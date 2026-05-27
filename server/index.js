import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { readDb, writeDb, uid } from './db.js';
import { hashPassword, verifyPassword, DEMO_PASSWORD } from './seed.js';
import {
  getAIStatus,
  generateAIStandup,
  generateAITaskInsight,
  generateAICommentSummary,
  generateAICollaborationInsight,
  generateAIActivityDigest,
} from './ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'devcollab-secret-change-in-production';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '2mb' }));

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function createUserRecord(d, { email, password, name, joinDefaultWorkspace = false }) {
  const userId = uid('u');
  const user = {
    id: userId,
    name: name || email.split('@')[0],
    email,
    avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
    role: 'Member',
    bio: 'DevCollab member.',
    skills: [],
    streak: 0,
  };
  d.users.push(user);
  d.credentials.push({ userId, email, passwordHash: hashPassword(password || 'password') });
  if (joinDefaultWorkspace) {
    const ws = d.workspaces[0];
    if (ws && !ws.memberIds.includes(userId)) {
      ws.memberIds.push(userId);
      d.memberRoles.push({ workspaceId: ws.id, userId, role: 'Member' });
    }
  }
  return user;
}

function findWorkspaceForUser(db, userId) {
  return db.workspaces.find((w) => w.memberIds.includes(userId));
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.auth = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function getUser(db, userId) {
  return db.users.find((u) => u.id === userId);
}

function userRoleInWorkspace(db, userId, workspaceId) {
  return db.memberRoles.find((r) => r.userId === userId && r.workspaceId === workspaceId)?.role ?? 'Member';
}

function workspaceWithMembers(db, ws, userId) {
  const members = ws.memberIds
    .map((id) => {
      const u = getUser(db, id);
      if (!u) return null;
      return { ...u, role: userRoleInWorkspace(db, id, ws.id) };
    })
    .filter(Boolean);
  return {
    id: ws.id,
    name: ws.name,
    description: ws.description,
    type: ws.type,
    icon: ws.icon,
    members,
    settings: ws.settings,
  };
}

function hydrateTask(db, task) {
  const assignees = (task.assigneeIds ?? []).map((id) => getUser(db, id)).filter(Boolean);
  return {
    ...task,
    assignees,
    comments: task.comments ?? [],
    history: task.history ?? [],
    subtasks: task.subtasks ?? [],
    checklist: task.checklist ?? [],
    attachments: task.attachments ?? [],
  };
}

function recalcProjectStats(db, projectId) {
  const tasks = db.tasks.filter((t) => t.projectId === projectId);
  const openTasks = tasks.filter((t) => t.status !== 'Done').length;
  const done = tasks.filter((t) => t.status === 'Done').length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const idx = db.projects.findIndex((p) => p.id === projectId);
  if (idx >= 0) {
    db.projects[idx].openTasks = openTasks;
    db.projects[idx].progress = progress;
    db.projects[idx].health = Math.min(100, progress + 15);
    const daysLeft = Math.ceil((new Date(db.projects[idx].deadline) - Date.now()) / 86400000);
    db.projects[idx].riskLevel = daysLeft < 7 && progress < 70 ? 'high' : daysLeft < 14 && progress < 50 ? 'medium' : 'low';
  }
}

function addActivity(db, workspaceId, user, message, type = 'task', project) {
  const activity = { id: uid('a'), workspaceId, user, message, timestamp: 'Just now', type, project };
  db.activities.unshift(activity);
  db.activities = db.activities.slice(0, 50);
  emitWorkspace(workspaceId, 'activity:new', activity);
  return activity;
}

function addNotification(db, userId, notification) {
  const n = { id: uid('n'), userId, read: false, time: 'Just now', ...notification };
  db.notifications.unshift(n);
  return n;
}

function emitNotification(userId, notification) {
  io.emit(`notification:${userId}`, notification);
}

const PLAN_LIMITS = {
  free: { workspaces: 1, projects: 3, members: 5, ai: false },
  pro: { workspaces: Infinity, projects: Infinity, members: Infinity, ai: true },
};

function getUserPlan(db, userId) {
  return db.subscriptions?.find((s) => s.userId === userId)?.plan ?? 'free';
}

function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

function assertRole(db, userId, workspaceId, minRole) {
  const role = userRoleInWorkspace(db, userId, workspaceId);
  const order = ['Viewer', 'Member', 'Admin', 'Owner'];
  if (order.indexOf(role) < order.indexOf(minRole)) {
    return { ok: false, role, error: `${role} role cannot perform this action` };
  }
  return { ok: true, role };
}

function assertCanEdit(db, userId, workspaceId) {
  return assertRole(db, userId, workspaceId, 'Member');
}

function assertCanManage(db, userId, workspaceId) {
  return assertRole(db, userId, workspaceId, 'Admin');
}

function assertCanView(db, userId, workspaceId) {
  const ws = db.workspaces.find((w) => w.id === workspaceId);
  if (!ws?.memberIds.includes(userId)) return { ok: false, error: 'Forbidden' };
  return { ok: true, role: userRoleInWorkspace(db, userId, workspaceId) };
}

const livePresence = new Map();

function setLivePresence(workspaceId, userId, data) {
  if (!livePresence.has(workspaceId)) livePresence.set(workspaceId, new Map());
  const entry = { userId, status: 'Online', ...livePresence.get(workspaceId).get(userId), ...data };
  livePresence.get(workspaceId).set(userId, entry);
  return entry;
}

function removeLivePresence(workspaceId, userId) {
  livePresence.get(workspaceId)?.delete(userId);
}

function getMergedPresence(db, workspaceId) {
  const ws = db.workspaces.find((w) => w.id === workspaceId);
  const live = livePresence.get(workspaceId);
  const seed = db.memberPresence ?? [];
  const memberIds = ws?.memberIds ?? [];
  return memberIds.map((id) => {
    const user = getUser(db, id);
    const liveEntry = live?.get(id);
    const seedEntry = seed.find((p) => p.userId === id);
    const base = liveEntry ?? seedEntry ?? { userId: id, status: 'Away' };
    return {
      ...base,
      userId: id,
      userName: user?.name ?? base.userName,
    };
  });
}

function emitPresence(workspaceId) {
  const db = readDb();
  emitWorkspace(workspaceId, 'presence:changed', getMergedPresence(db, workspaceId));
}

function extractMentions(text, members) {
  return members.filter((m) => text.includes(`@${m.name}`));
}

function buildCalendarEvents(db, workspaceId) {
  const projectIds = db.projects.filter((p) => p.workspaceId === workspaceId).map((p) => p.id);
  const tasks = db.tasks.filter((t) => projectIds.includes(t.projectId));
  const taskEvents = tasks.map((t) => ({
    id: `cal-${t.id}`,
    title: t.title,
    date: t.dueDate,
    type: 'deadline',
    projectId: t.projectId,
    riskScore: t.status !== 'Done' && t.dueDate < new Date().toISOString().slice(0, 10) ? 75 : 15,
  }));
  const staticEvents = (db.calendarEvents ?? []).filter((e) => !e.projectId || projectIds.includes(e.projectId));
  const seen = new Set();
  return [...taskEvents, ...staticEvents].filter((e) => {
    const key = `${e.date}-${e.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function notifyTaskAssignees(db, task, actorId, message, type = 'assignment') {
  (task.assigneeIds ?? []).forEach((id) => {
    if (id === actorId) return;
    const n = addNotification(db, id, { type, text: message, priority: 'medium', projectId: task.projectId });
    emitNotification(id, n);
  });
}

function saveDocVersion(db, doc) {
  if (!db.docVersions) db.docVersions = [];
  db.docVersions.unshift({
    id: uid('dv'),
    docId: doc.id,
    title: doc.title,
    body: doc.body,
    updatedBy: doc.updatedBy,
    updatedAt: doc.updatedAt,
  });
  db.docVersions = db.docVersions.slice(0, 200);
}

function generateStandupReport(db, workspaceId) {
  const today = new Date().toISOString().slice(0, 10);
  const projectIds = db.projects.filter((p) => p.workspaceId === workspaceId).map((p) => p.id);
  const tasks = db.tasks.filter((t) => projectIds.includes(t.projectId));

  const completed = tasks.filter((t) => t.status === 'Done');
  const moved = tasks.filter((t) => (t.history ?? []).some((h) => h.includes('Status changed')));
  const activeToday = tasks.filter((t) => t.status === 'In Progress' || t.status === 'To Do');
  const overdue = tasks.filter((t) => t.dueDate < today && t.status !== 'Done');
  const inReview = tasks.filter((t) => t.status === 'In Review');
  const insights = computeAiInsights(db, workspaceId);

  const yesterday = [];
  completed.slice(0, 6).forEach((t) => yesterday.push(`${t.title} completed`));
  moved.slice(0, 4).forEach((t) => {
    const move = [...(t.history ?? [])].reverse().find((h) => h.includes('Status changed'));
    if (move && !yesterday.some((line) => line.startsWith(t.title))) {
      yesterday.push(`${t.title} — ${move.replace('Status changed to ', 'moved to ')}`);
    }
  });

  const todayPlan = activeToday.slice(0, 6).map((t) => `${t.title} (${t.status})`);

  const blockers = [];
  overdue.slice(0, 4).forEach((t) => blockers.push(`${t.title} — overdue (due ${t.dueDate})`));
  inReview.slice(0, 3).forEach((t) => blockers.push(`${t.title} — waiting in review`));
  if (insights.blockedTasks > 0 && blockers.length === 0) {
    blockers.push(`${insights.blockedTasks} task(s) need review before shipping`);
  }

  const fmt = (lines, fallback) => (lines.length ? lines.map((l) => `- ${l}`).join('\n') : `- ${fallback}`);

  return [
    'Yesterday:',
    fmt(yesterday, 'No completed tasks yet — great time to close out work!'),
    '',
    'Today:',
    fmt(todayPlan, 'Pick top priorities from the backlog'),
    '',
    'Blockers:',
    fmt(blockers, 'None — team is unblocked'),
    '',
    `Sprint health: ${insights.sprintHealth}% · ${completed.length} done · ${overdue.length} overdue`,
  ].join('\n');
}

function computeAnalytics(db, workspaceId) {
  const ws = db.workspaces.find((w) => w.id === workspaceId);
  const projectIds = db.projects.filter((p) => p.workspaceId === workspaceId).map((p) => p.id);
  const tasks = db.tasks.filter((t) => projectIds.includes(t.projectId));
  const members = ws?.memberIds.map((id) => getUser(db, id)).filter(Boolean) ?? [];

  const teamPerformance = members.map((m) => {
    const assigned = tasks.filter((t) => t.assigneeIds?.includes(m.id));
    const completed = assigned.filter((t) => t.status === 'Done');
    return { name: m.name, completed: completed.length, assigned: assigned.length || 1 };
  });

  const activeCounts = members.map((m) => tasks.filter((t) => t.assigneeIds?.includes(m.id) && t.status !== 'Done').length);
  const maxLoad = Math.max(...activeCounts, 0);
  const burnoutIndex = Math.min(100, Math.round(maxLoad * 8 + (tasks.filter((t) => t.status !== 'Done' && t.dueDate < new Date().toISOString().slice(0, 10)).length * 5)));

  const done = tasks.filter((t) => t.status === 'Done').length;
  const sprintHealth = tasks.length ? Math.round((done / tasks.length) * 100) : 100;

  return {
    daily: [4, 6, 3, 8, 5, 7, 6],
    weekly: [28, 32, 35, 30, 38, 42, 36],
    monthly: [120, 145, 132, 158, 170, 165],
    teamPerformance,
    collaborationScore: ws?.settings.collaborationScore ?? 85,
    burnoutIndex,
    sprintHealth,
  };
}

function computeAiInsights(db, workspaceId) {
  const analytics = computeAnalytics(db, workspaceId);
  const projectIds = db.projects.filter((p) => p.workspaceId === workspaceId).map((p) => p.id);
  const tasks = db.tasks.filter((t) => projectIds.includes(t.projectId));
  const overdue = tasks.filter((t) => t.dueDate < new Date().toISOString().slice(0, 10) && t.status !== 'Done');
  const blocked = tasks.filter((t) => t.status === 'In Review').length;

  return {
    blockedTasks: blocked,
    sprintHealth: analytics.sprintHealth,
    burnoutRisk: analytics.burnoutIndex > 50 ? 'high' : analytics.burnoutIndex > 30 ? 'medium' : 'low',
    teamMood: analytics.burnoutIndex > 40 ? 'stressed' : 'focused',
    predictions: [
      overdue.length ? `${overdue.length} task(s) are overdue and may slip the sprint.` : 'All tasks are on schedule.',
      `Team completion rate is ${analytics.sprintHealth}%.`,
      analytics.burnoutIndex > 35 ? 'Consider rebalancing workload across members.' : 'Workload is well distributed.',
    ],
    recommendations: [
      'Generate standup report for today\'s sync',
      overdue.length ? `Address ${overdue.length} overdue task(s)` : 'Keep current sprint momentum',
      'Review high-priority items in the backlog',
    ],
  };
}

function buildBootstrap(db, userId, workspaceId) {
  const user = getUser(db, userId);
  const workspaces = db.workspaces
    .filter((w) => w.memberIds.includes(userId))
    .map((w) => workspaceWithMembers(db, w, userId));

  const ws = db.workspaces.find((w) => w.id === workspaceId);
  if (!ws || !ws.memberIds.includes(userId)) {
    const fallback = workspaces[0];
    workspaceId = fallback?.id ?? '';
  }

  const projects = db.projects.filter((p) => p.workspaceId === workspaceId);
  const projectIds = projects.map((p) => p.id);
  const tasks = db.tasks.filter((t) => projectIds.includes(t.projectId)).map((t) => hydrateTask(db, t));
  const favorites = db.snippetFavorites.filter((f) => f.userId === userId).map((f) => f.snippetId);
  const snippets = db.snippets
    .filter((s) => !s.workspaceId || s.workspaceId === workspaceId)
    .map((s) => ({
      ...s,
      favorite: favorites.includes(s.id),
    }));

  return {
    user: user ? { ...user, role: userRoleInWorkspace(db, userId, workspaceId) } : null,
    workspaceId,
    workspaces,
    projects,
    tasks,
    snippets,
    docs: db.docs.filter((d) => !d.workspaceId || d.workspaceId === workspaceId),
    notifications: db.notifications.filter((n) => n.userId === userId),
    activities: db.activities.filter((a) => a.workspaceId === workspaceId).slice(0, 20),
    memberPresence: getMergedPresence(db, workspaceId),
    calendarEvents: buildCalendarEvents(db, workspaceId),
    analyticsData: computeAnalytics(db, workspaceId),
    aiInsights: computeAiInsights(db, workspaceId),
    subscription: {
      plan: getUserPlan(db, userId),
      limits: getPlanLimits(getUserPlan(db, userId)),
    },
  };
}

function emitWorkspace(workspaceId, event, payload) {
  io.to(`workspace:${workspaceId}`).emit(event, payload);
}

io.on('connection', (socket) => {
  socket.on('join', (payload) => {
    const workspaceId = typeof payload === 'string' ? payload : payload?.workspaceId;
    const userId = typeof payload === 'object' ? payload?.userId : null;
    const userName = typeof payload === 'object' ? payload?.userName : null;
    if (!workspaceId) return;
    socket.join(`workspace:${workspaceId}`);
    socket.data = { workspaceId, userId, userName };
    if (userId) {
      const user = getUser(readDb(), userId);
      setLivePresence(workspaceId, userId, {
        userName: userName ?? user?.name,
        status: 'Online',
        activity: 'Browsing workspace',
      });
      emitPresence(workspaceId);
    }
  });

  socket.on('presence:update', ({ viewingTaskId, viewingTaskTitle, viewingTask, activity, status }) => {
    const { workspaceId, userId, userName } = socket.data ?? {};
    if (!workspaceId || !userId) return;
    setLivePresence(workspaceId, userId, {
      userName,
      status: status ?? 'Online',
      activity: activity ?? 'Active',
      viewingTaskId: viewingTaskId ?? undefined,
      viewingTask: viewingTaskTitle ?? viewingTask ?? undefined,
    });
    emitPresence(workspaceId);
  });

  socket.on('disconnect', () => {
    const { workspaceId, userId } = socket.data ?? {};
    if (workspaceId && userId) {
      removeLivePresence(workspaceId, userId);
      emitPresence(workspaceId);
    }
  });
});

// ─── Auth ───────────────────────────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim()) return res.status(400).json({ error: 'Email required' });

  const normalizedEmail = email.trim().toLowerCase();
  let db = readDb();
  let cred = db.credentials.find((c) => c.email.toLowerCase() === normalizedEmail);

  if (!cred) {
    writeDb((d) => {
      createUserRecord(d, {
        email: normalizedEmail,
        password: password ?? 'password',
        joinDefaultWorkspace: true,
      });
      return d;
    });
    db = readDb();
    cred = db.credentials.find((c) => c.email.toLowerCase() === normalizedEmail);
  }

  const user = getUser(db, cred.userId);
  const workspace = findWorkspaceForUser(db, user.id);
  const token = signToken(user.id);
  res.json({
    token,
    user,
    workspaceId: workspace?.id ?? '',
    needsWorkspaceSetup: !workspace,
  });
});

app.post('/api/auth/signup', (req, res) => {
  const { email, password, name } = req.body;
  if (!email?.trim() || !password) return res.status(400).json({ error: 'Email and password required' });

  const normalizedEmail = email.trim().toLowerCase();
  const db = readDb();
  const existing = db.credentials.find((c) => c.email.toLowerCase() === normalizedEmail);
  if (existing) {
    const user = getUser(db, existing.userId);
    const workspace = findWorkspaceForUser(db, user.id);
    const token = signToken(user.id);
    return res.json({
      token,
      user,
      workspaceId: workspace?.id ?? '',
      needsWorkspaceSetup: !workspace,
      alreadyRegistered: true,
    });
  }

  let userId;
  writeDb((d) => {
    const user = createUserRecord(d, {
      email: normalizedEmail,
      password,
      name: name?.trim(),
      joinDefaultWorkspace: false,
    });
    userId = user.id;
    return d;
  });

  const fresh = readDb();
  const user = getUser(fresh, userId);
  const token = signToken(user.id);
  res.json({ token, user, needsWorkspaceSetup: true });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const db = readDb();
  const pending = db.pendingSignups.find((p) => p.email.toLowerCase() === email?.toLowerCase());
  if (!pending || pending.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
  const userId = uid('u');
  const user = {
    id: userId,
    name: pending.name,
    email: pending.email,
    avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(pending.email)}`,
    role: 'Owner',
    bio: 'New DevCollab member.',
    skills: [],
    streak: 0,
  };
  writeDb((d) => {
    d.users.push(user);
    d.credentials.push({ userId, email: pending.email, passwordHash: pending.passwordHash });
    d.pendingSignups = d.pendingSignups.filter((p) => p.email !== pending.email);
    return d;
  });
  const token = signToken(userId);
  res.json({ token, user, needsWorkspaceSetup: true });
});

app.post('/api/auth/social-login', (req, res) => {
  const { email, provider } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const db = readDb();
  let cred = db.credentials.find((c) => c.email.toLowerCase() === email.toLowerCase());
  if (!cred) {
    const userId = uid('u');
    const user = {
      id: userId,
      name: email.split('@')[0],
      email,
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
      role: 'Member',
      bio: `Signed in via ${provider ?? 'OAuth'}`,
      skills: [],
      streak: 0,
    };
    writeDb((d) => {
      d.users.push(user);
      d.credentials.push({ userId, email, passwordHash: hashPassword(DEMO_PASSWORD) });
      const ws = d.workspaces[0];
      if (ws && !ws.memberIds.includes(userId)) {
        ws.memberIds.push(userId);
        d.memberRoles.push({ workspaceId: ws.id, userId, role: 'Member' });
      }
      return d;
    });
    cred = readDb().credentials.find((c) => c.userId === userId);
  }
  const user = getUser(readDb(), cred.userId);
  const workspace = readDb().workspaces.find((w) => w.memberIds.includes(user.id));
  res.json({ token: signToken(user.id), user, workspaceId: workspace?.id ?? '' });
});

app.post('/api/auth/social', authMiddleware, (req, res) => {
  res.status(501).json({ error: 'Social login requires OAuth setup. Use email/password.' });
});

app.post('/api/auth/forgot-password', (req, res) => {
  res.json({ message: 'If that email exists, a reset link was sent.' });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const db = readDb();
  const user = getUser(db, req.auth.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// ─── Bootstrap ──────────────────────────────────────────────────────────────

app.get('/api/bootstrap', authMiddleware, (req, res) => {
  const db = readDb();
  const workspaceId = req.query.workspaceId || db.workspaces.find((w) => w.memberIds.includes(req.auth.userId))?.id;
  res.json(buildBootstrap(db, req.auth.userId, workspaceId));
});

// ─── Workspaces ─────────────────────────────────────────────────────────────

app.post('/api/workspaces', authMiddleware, (req, res) => {
  const { name, description, type } = req.body;
  const db = readDb();
  const user = getUser(db, req.auth.userId);
  const plan = getUserPlan(db, req.auth.userId);
  const limits = getPlanLimits(plan);
  const owned = db.workspaces.filter((w) => w.memberIds[0] === user.id || db.memberRoles.some((r) => r.workspaceId === w.id && r.userId === user.id && r.role === 'Owner')).length;
  const userWorkspaces = db.workspaces.filter((w) => w.memberIds.includes(user.id)).length;
  if (userWorkspaces >= limits.workspaces && plan === 'free') {
    return res.status(403).json({ error: 'Free plan allows 1 workspace. Upgrade to Pro for unlimited workspaces.' });
  }
  const wsId = uid('ws');
  writeDb((d) => {
    d.workspaces.push({
      id: wsId,
      name,
      description: description ?? '',
      type: type ?? 'Private',
      icon: (name?.charAt(0) ?? 'W').toUpperCase(),
      memberIds: [user.id],
      settings: { allowInvites: true, collaborationScore: 85 },
    });
    d.memberRoles.push({ workspaceId: wsId, userId: user.id, role: 'Owner' });
    addActivity(d, wsId, user.name, `created workspace "${name}"`, 'member');
    return d;
  });
  const fresh = readDb();
  emitWorkspace(wsId, 'bootstrap:refresh', { workspaceId: wsId });
  res.json(buildBootstrap(fresh, req.auth.userId, wsId));
});

app.patch('/api/workspaces/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const ws = db.workspaces.find((w) => w.id === id);
  if (!ws || !ws.memberIds.includes(req.auth.userId)) return res.status(403).json({ error: 'Forbidden' });
  const perm = assertCanManage(db, req.auth.userId, id);
  if (!perm.ok) return res.status(403).json({ error: perm.error });
  writeDb((d) => {
    const idx = d.workspaces.findIndex((w) => w.id === id);
    if (idx >= 0) {
      d.workspaces[idx] = {
        ...d.workspaces[idx],
        name: req.body.name ?? d.workspaces[idx].name,
        description: req.body.description ?? d.workspaces[idx].description,
        type: req.body.type ?? d.workspaces[idx].type,
        icon: req.body.icon ?? d.workspaces[idx].icon,
        settings: {
          ...d.workspaces[idx].settings,
          allowInvites: req.body.allowInvites ?? d.workspaces[idx].settings.allowInvites,
        },
      };
    }
    return d;
  });
  const fresh = readDb();
  const payload = buildBootstrap(fresh, req.auth.userId, id);
  emitWorkspace(id, 'bootstrap:refresh', { workspaceId: id });
  res.json(payload);
});

app.post('/api/workspaces/:id/invite', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { email, role } = req.body;
  const db = readDb();
  const ws = db.workspaces.find((w) => w.id === id);
  if (!ws) return res.status(404).json({ error: 'Workspace not found' });
  const perm = assertCanManage(db, req.auth.userId, id);
  if (!perm.ok) return res.status(403).json({ error: perm.error });
  if (!ws.settings.allowInvites) return res.status(403).json({ error: 'Invites are disabled for this workspace' });
  const plan = getUserPlan(db, req.auth.userId);
  const limits = getPlanLimits(plan);
  if (ws.memberIds.length >= limits.members && plan === 'free') {
    return res.status(403).json({ error: 'Free plan allows 5 members. Upgrade to Pro for unlimited members.' });
  }
  const inviter = getUser(db, req.auth.userId);
  let invitedUser = db.users.find((u) => u.email.toLowerCase() === email?.toLowerCase());
  const inviteToken = uid('inv');

  writeDb((d) => {
    if (!d.pendingInvites) d.pendingInvites = [];
    d.pendingInvites.push({
      token: inviteToken,
      workspaceId: id,
      email: email?.toLowerCase(),
      role: role ?? 'Member',
      createdBy: req.auth.userId,
      expiresAt: Date.now() + 7 * 86400000,
    });
    if (!invitedUser) {
      const newId = uid('u');
      invitedUser = {
        id: newId,
        name: email.split('@')[0],
        email,
        avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
        role: role ?? 'Member',
        bio: '',
        skills: [],
        streak: 0,
      };
      d.users.push(invitedUser);
      d.credentials.push({ userId: newId, email, passwordHash: hashPassword(DEMO_PASSWORD) });
    }
    const widx = d.workspaces.findIndex((w) => w.id === id);
    if (!d.workspaces[widx].memberIds.includes(invitedUser.id)) {
      d.workspaces[widx].memberIds.push(invitedUser.id);
      d.memberRoles.push({ workspaceId: id, userId: invitedUser.id, role: role ?? 'Member' });
    }
    addActivity(d, id, inviter.name, `invited ${email} as ${role ?? 'Member'}`, 'member');
    const n = addNotification(d, invitedUser.id, { type: 'invite', text: `${inviter.name} invited you to ${ws.name}`, priority: 'low' });
    emitNotification(invitedUser.id, n);
    addNotification(d, req.auth.userId, { type: 'invite', text: `Invitation sent to ${email} as ${role ?? 'Member'}`, priority: 'low' });
    return d;
  });

  emitWorkspace(id, 'bootstrap:refresh', { workspaceId: id });
  res.json({ ok: true, inviteLink: `/join?token=${inviteToken}`, demoPassword: DEMO_PASSWORD });
});

app.post('/api/invites/:token/accept', authMiddleware, (req, res) => {
  const db = readDb();
  const invite = db.pendingInvites?.find((i) => i.token === req.params.token);
  if (!invite || invite.expiresAt < Date.now()) return res.status(404).json({ error: 'Invite expired or invalid' });
  writeDb((d) => {
    const ws = d.workspaces.find((w) => w.id === invite.workspaceId);
    if (ws && !ws.memberIds.includes(req.auth.userId)) {
      ws.memberIds.push(req.auth.userId);
      d.memberRoles.push({ workspaceId: invite.workspaceId, userId: req.auth.userId, role: invite.role });
    }
    d.pendingInvites = d.pendingInvites.filter((i) => i.token !== req.params.token);
    return d;
  });
  emitWorkspace(invite.workspaceId, 'bootstrap:refresh', { workspaceId: invite.workspaceId });
  res.json({ ok: true, workspaceId: invite.workspaceId });
});

// ─── Projects ───────────────────────────────────────────────────────────────

app.post('/api/projects', authMiddleware, (req, res) => {
  const db = readDb();
  const user = getUser(db, req.auth.userId);
  const workspaceId = req.body.workspaceId;
  const perm = assertCanEdit(db, req.auth.userId, workspaceId);
  if (!perm.ok) return res.status(403).json({ error: perm.error });
  const plan = getUserPlan(db, req.auth.userId);
  const limits = getPlanLimits(plan);
  const projectCount = db.projects.filter((p) => p.workspaceId === workspaceId).length;
  if (projectCount >= limits.projects && plan === 'free') {
    return res.status(403).json({ error: 'Free plan allows 3 projects. Upgrade to Pro for unlimited projects.' });
  }
  const project = {
    id: uid('p'),
    workspaceId,
    name: req.body.name,
    banner: req.body.banner ?? 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80',
    deadline: req.body.deadline,
    stack: req.body.stack ?? [],
    priority: req.body.priority ?? 'P2',
    owner: user.name,
    health: 100,
    progress: 0,
    visibility: req.body.visibility ?? 'Private',
    openTasks: 0,
    riskLevel: 'low',
  };
  writeDb((d) => {
    d.projects.push(project);
    addActivity(d, workspaceId, user.name, `created project "${project.name}"`, 'task');
    return d;
  });
  emitWorkspace(workspaceId, 'project:created', project);
  res.json(project);
});

app.patch('/api/projects/:id', authMiddleware, (req, res) => {
  const db = readDb();
  writeDb((d) => {
    const idx = d.projects.findIndex((p) => p.id === req.params.id);
    if (idx >= 0) d.projects[idx] = { ...d.projects[idx], ...req.body, id: req.params.id };
    return d;
  });
  const project = readDb().projects.find((p) => p.id === req.params.id);
  emitWorkspace(project.workspaceId, 'project:updated', project);
  res.json(project);
});

app.delete('/api/projects/:id', authMiddleware, (req, res) => {
  const db = readDb();
  const project = db.projects.find((p) => p.id === req.params.id);
  writeDb((d) => {
    d.projects = d.projects.filter((p) => p.id !== req.params.id);
    d.tasks = d.tasks.filter((t) => t.projectId !== req.params.id);
    return d;
  });
  if (project) emitWorkspace(project.workspaceId, 'bootstrap:refresh', { workspaceId: project.workspaceId });
  res.json({ ok: true });
});

// ─── Tasks ──────────────────────────────────────────────────────────────────

app.post('/api/tasks', authMiddleware, (req, res) => {
  const db = readDb();
  const user = getUser(db, req.auth.userId);
  const project = db.projects.find((p) => p.id === req.body.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const task = {
    id: uid('t'),
    projectId: req.body.projectId,
    title: req.body.title,
    description: req.body.description ?? '',
    status: req.body.status ?? 'To Do',
    priority: req.body.priority ?? 'P2',
    dueDate: req.body.dueDate ?? new Date().toISOString().slice(0, 10),
    labels: req.body.labels ?? [],
    assigneeIds: req.body.assigneeIds ?? [user.id],
    estimate: req.body.estimate ?? '2h',
    comments: [],
    history: [`Created by ${user.name}`],
    subtasks: [],
    checklist: [],
    attachments: [],
  };

  writeDb((d) => {
    d.tasks.push(task);
    recalcProjectStats(d, project.id);
    addActivity(d, project.workspaceId, user.name, `created task "${task.title}"`, 'task', project.name);
    return d;
  });

  const hydrated = hydrateTask(readDb(), task);
  emitWorkspace(project.workspaceId, 'task:created', hydrated);
  emitWorkspace(project.workspaceId, 'task:updated', hydrated);
  res.json(hydrated);
});

app.patch('/api/tasks/:id', authMiddleware, (req, res) => {
  const db = readDb();
  const user = getUser(db, req.auth.userId);
  let workspaceId;
  let oldStatus;
  writeDb((d) => {
    const idx = d.tasks.findIndex((t) => t.id === req.params.id);
    if (idx < 0) return d;
    const task = d.tasks[idx];
    const project = d.projects.find((p) => p.id === task.projectId);
    workspaceId = project?.workspaceId;
    const perm = assertCanEdit(d, req.auth.userId, workspaceId);
    if (!perm.ok) return d;
    oldStatus = task.status;
    const history = [...(task.history ?? [])];
    if (req.body.status && req.body.status !== task.status) history.push(`Status changed to ${req.body.status}`);
    if (req.body.title && req.body.title !== task.title) history.push(`Title updated to "${req.body.title}"`);
    if (req.body.assigneeIds) history.push(`${user.name} updated assignees`);
    if (req.body.labels) history.push(`${user.name} updated labels`);
    if (req.body.dueDate && req.body.dueDate !== task.dueDate) history.push(`Due date set to ${req.body.dueDate}`);
    d.tasks[idx] = {
      ...task,
      ...req.body,
      id: req.params.id,
      history,
      assigneeIds: req.body.assigneeIds ?? task.assigneeIds,
    };
    recalcProjectStats(d, task.projectId);
    const statusMsg = req.body.status && req.body.status !== oldStatus
      ? `${user.name} moved "${task.title}" to ${req.body.status}`
      : `${user.name} updated "${task.title}"`;
    addActivity(d, workspaceId, user.name, statusMsg, 'task', project?.name);
    if (req.body.status && req.body.status !== oldStatus) {
      notifyTaskAssignees(d, d.tasks[idx], req.auth.userId, `${user.name} moved your task "${task.title}" to ${req.body.status}`, 'activity');
    }
    if (req.body.assigneeIds) {
      (req.body.assigneeIds ?? []).forEach((id) => {
        if (id !== req.auth.userId) {
          const n = addNotification(d, id, { type: 'assignment', text: `${user.name} assigned you "${task.title}"`, priority: 'high', projectId: task.projectId });
          emitNotification(id, n);
        }
      });
    }
    return d;
  });
  const task = hydrateTask(readDb(), readDb().tasks.find((t) => t.id === req.params.id));
  emitWorkspace(workspaceId, 'task:updated', task);
  res.json(task);
});

app.delete('/api/tasks/:id', authMiddleware, (req, res) => {
  const db = readDb();
  const task = db.tasks.find((t) => t.id === req.params.id);
  const project = db.projects.find((p) => p.id === task?.projectId);
  writeDb((d) => {
    d.tasks = d.tasks.filter((t) => t.id !== req.params.id);
    if (task) recalcProjectStats(d, task.projectId);
    return d;
  });
  if (project) emitWorkspace(project.workspaceId, 'bootstrap:refresh', { workspaceId: project.workspaceId });
  res.json({ ok: true });
});

app.post('/api/tasks/:id/comments', authMiddleware, (req, res) => {
  const db = readDb();
  const user = getUser(db, req.auth.userId);
  let workspaceId;
  writeDb((d) => {
    const idx = d.tasks.findIndex((t) => t.id === req.params.id);
    if (idx < 0) return d;
    const project = d.projects.find((p) => p.id === d.tasks[idx].projectId);
    workspaceId = project?.workspaceId;
    const perm = assertCanEdit(d, req.auth.userId, workspaceId);
    if (!perm.ok) return d;
    const ws = d.workspaces.find((w) => w.id === workspaceId);
    const members = ws?.memberIds.map((id) => getUser(d, id)).filter(Boolean) ?? [];
    const comment = { id: uid('c'), author: user.name, text: req.body.text, time: 'Just now' };
    d.tasks[idx].comments = [...(d.tasks[idx].comments ?? []), comment];
    d.tasks[idx].history = [...(d.tasks[idx].history ?? []), `${user.name} commented`];
    addActivity(d, workspaceId, user.name, `commented on "${d.tasks[idx].title}"`, 'comment', project?.name);
    extractMentions(req.body.text ?? '', members).forEach((m) => {
      if (m.id === req.auth.userId) return;
      const n = addNotification(d, m.id, {
        type: 'mention',
        text: `${user.name} mentioned you on "${d.tasks[idx].title}"`,
        priority: 'high',
        projectId: d.tasks[idx].projectId,
      });
      emitNotification(m.id, n);
    });
    return d;
  });
  const task = hydrateTask(readDb(), readDb().tasks.find((t) => t.id === req.params.id));
  emitWorkspace(workspaceId, 'task:updated', task);
  res.json(task);
});

app.post('/api/tasks/:id/subtasks/generate', authMiddleware, (req, res) => {
  const db = readDb();
  const user = getUser(db, req.auth.userId);
  let workspaceId;
  writeDb((d) => {
    const idx = d.tasks.findIndex((t) => t.id === req.params.id);
    if (idx < 0) return d;
    const task = d.tasks[idx];
    const project = d.projects.find((p) => p.id === task.projectId);
    workspaceId = project?.workspaceId;
    const generated = [
      { id: uid('st'), title: 'Research & plan approach', completed: false },
      { id: uid('st'), title: 'Implement core functionality', completed: false },
      { id: uid('st'), title: 'Test and review', completed: false },
    ];
    d.tasks[idx].subtasks = [...(d.tasks[idx].subtasks ?? []), ...generated];
    d.tasks[idx].history = [...(d.tasks[idx].history ?? []), `${user.name} generated AI subtasks`];
    return d;
  });
  const task = hydrateTask(readDb(), readDb().tasks.find((t) => t.id === req.params.id));
  emitWorkspace(workspaceId, 'task:updated', task);
  res.json(task);
});

app.post('/api/tasks/balance-workload', authMiddleware, (req, res) => {
  const { workspaceId } = req.body;
  const db = readDb();
  const user = getUser(db, req.auth.userId);
  const projectIds = db.projects.filter((p) => p.workspaceId === workspaceId).map((p) => p.id);
  const ws = db.workspaces.find((w) => w.id === workspaceId);
  if (!ws) return res.status(404).json({ error: 'Workspace not found' });

  writeDb((d) => {
    const activeTasks = d.tasks.filter((t) => projectIds.includes(t.projectId) && t.status !== 'Done');
    const loads = {};
    ws.memberIds.forEach((id) => { loads[id] = 0; });
    activeTasks.forEach((t) => {
      (t.assigneeIds ?? []).forEach((id) => { loads[id] = (loads[id] ?? 0) + 1; });
    });

    const sorted = ws.memberIds.sort((a, b) => (loads[a] ?? 0) - (loads[b] ?? 0));
    let moved = 0;
    activeTasks.forEach((t) => {
      const assignee = t.assigneeIds?.[0];
      if ((loads[assignee] ?? 0) >= 4 && sorted.length > 1) {
        const target = sorted.find((id) => (loads[id] ?? 0) < 3 && id !== assignee) ?? sorted[0];
        t.assigneeIds = [target];
        loads[assignee]--;
        loads[target] = (loads[target] ?? 0) + 1;
        moved++;
      }
    });
    if (moved > 0) addActivity(d, workspaceId, user.name, `AI rebalanced ${moved} task(s) across the team`, 'task');
    return d;
  });

  const payload = buildBootstrap(readDb(), req.auth.userId, workspaceId);
  emitWorkspace(workspaceId, 'bootstrap:refresh', { workspaceId });
  res.json({ ...payload, moved: true });
});

// ─── Snippets ───────────────────────────────────────────────────────────────

app.post('/api/snippets', authMiddleware, (req, res) => {
  const db = readDb();
  const user = getUser(db, req.auth.userId);
  const snippet = {
    id: uid('s'),
    workspaceId: req.body.workspaceId ?? db.workspaces.find((w) => w.memberIds.includes(user.id))?.id,
    projectId: req.body.projectId,
    title: req.body.title,
    language: req.body.language,
    code: req.body.code ?? '',
    description: req.body.description ?? '',
    tags: req.body.tags ?? [],
    author: user.name,
    trending: false,
  };
  writeDb((d) => { d.snippets.unshift(snippet); return d; });
  res.json({ ...snippet, favorite: false });
});

app.patch('/api/snippets/:id', authMiddleware, (req, res) => {
  writeDb((d) => {
    const idx = d.snippets.findIndex((s) => s.id === req.params.id);
    if (idx >= 0) {
      d.snippets[idx] = {
        ...d.snippets[idx],
        title: req.body.title ?? d.snippets[idx].title,
        language: req.body.language ?? d.snippets[idx].language,
        code: req.body.code ?? d.snippets[idx].code,
        description: req.body.description ?? d.snippets[idx].description,
        tags: req.body.tags ?? d.snippets[idx].tags,
      };
    }
    return d;
  });
  const snippet = readDb().snippets.find((s) => s.id === req.params.id);
  const fav = readDb().snippetFavorites.some((f) => f.userId === req.auth.userId && f.snippetId === req.params.id);
  res.json({ ...snippet, favorite: fav });
});

app.delete('/api/snippets/:id', authMiddleware, (req, res) => {
  writeDb((d) => {
    d.snippets = d.snippets.filter((s) => s.id !== req.params.id);
    d.snippetFavorites = d.snippetFavorites.filter((f) => f.snippetId !== req.params.id);
    return d;
  });
  res.json({ ok: true });
});

app.patch('/api/snippets/:id/favorite', authMiddleware, (req, res) => {
  writeDb((d) => {
    const exists = d.snippetFavorites.some((f) => f.userId === req.auth.userId && f.snippetId === req.params.id);
    if (exists) {
      d.snippetFavorites = d.snippetFavorites.filter((f) => !(f.userId === req.auth.userId && f.snippetId === req.params.id));
    } else {
      d.snippetFavorites.push({ userId: req.auth.userId, snippetId: req.params.id });
    }
    return d;
  });
  const fav = readDb().snippetFavorites.some((f) => f.userId === req.auth.userId && f.snippetId === req.params.id);
  res.json({ favorite: fav });
});

// ─── Docs ───────────────────────────────────────────────────────────────────

app.post('/api/docs', authMiddleware, (req, res) => {
  const db = readDb();
  const user = getUser(db, req.auth.userId);
  const workspaceId = req.body.workspaceId ?? db.workspaces.find((w) => w.memberIds.includes(user.id))?.id;
  const doc = {
    id: uid('d'),
    workspaceId,
    projectId: req.body.projectId,
    title: req.body.title,
    body: req.body.body ?? '',
    tags: req.body.tags ?? [],
    links: [],
    updatedBy: user.name,
    updatedAt: new Date().toISOString().slice(0, 10),
    shared: true,
    aiSummary: `Overview of ${req.body.title}`,
  };
  writeDb((d) => {
    d.docs.unshift(doc);
    addActivity(d, workspaceId, user.name, `created wiki page "${doc.title}"`, 'wiki');
    return d;
  });
  res.json(doc);
});

app.patch('/api/docs/:id', authMiddleware, (req, res) => {
  const db = readDb();
  const user = getUser(db, req.auth.userId);
  let workspaceId;
  writeDb((d) => {
    const idx = d.docs.findIndex((doc) => doc.id === req.params.id);
    if (idx < 0) return d;
    const old = d.docs[idx];
    workspaceId = old.workspaceId ?? d.workspaces.find((w) => w.memberIds.includes(req.auth.userId))?.id;
    const perm = assertCanEdit(d, req.auth.userId, workspaceId);
    if (!perm.ok) return d;
    saveDocVersion(d, old);
    const body = req.body.body ?? old.body;
    const linkMatches = body.match(/\[\[([^\]]+)\]\]/g) ?? [];
    const links = linkMatches.map((m) => m.slice(2, -2));
    d.docs[idx] = {
      ...old,
      title: req.body.title ?? old.title,
      body,
      tags: req.body.tags ?? old.tags,
      links,
      updatedBy: user.name,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    addActivity(d, workspaceId, user.name, `updated wiki page "${d.docs[idx].title}"`, 'wiki');
    return d;
  });
  const doc = readDb().docs.find((d) => d.id === req.params.id);
  if (workspaceId) emitWorkspace(workspaceId, 'bootstrap:refresh', { workspaceId });
  res.json(doc);
});

app.get('/api/docs/:id/versions', authMiddleware, (req, res) => {
  const db = readDb();
  const versions = (db.docVersions ?? []).filter((v) => v.docId === req.params.id);
  res.json({ versions });
});

// ─── Notifications ──────────────────────────────────────────────────────────

app.patch('/api/notifications/:id/read', authMiddleware, (req, res) => {
  writeDb((d) => {
    const n = d.notifications.find((x) => x.id === req.params.id && x.userId === req.auth.userId);
    if (n) n.read = true;
    return d;
  });
  res.json({ ok: true });
});

app.patch('/api/notifications/read-all', authMiddleware, (req, res) => {
  writeDb((d) => {
    d.notifications.forEach((n) => { if (n.userId === req.auth.userId) n.read = true; });
    return d;
  });
  res.json({ ok: true });
});

// ─── Profile ────────────────────────────────────────────────────────────────

app.patch('/api/profile', authMiddleware, (req, res) => {
  writeDb((d) => {
    const idx = d.users.findIndex((u) => u.id === req.auth.userId);
    if (idx >= 0) {
      d.users[idx] = {
        ...d.users[idx],
        name: req.body.name ?? d.users[idx].name,
        bio: req.body.bio ?? d.users[idx].bio,
        skills: req.body.skills ?? d.users[idx].skills,
        avatar: req.body.avatar ?? d.users[idx].avatar,
        github: req.body.github ?? d.users[idx].github,
      };
    }
    return d;
  });
  res.json(getUser(readDb(), req.auth.userId));
});

// ─── AI ─────────────────────────────────────────────────────────────────────

app.get('/api/ai/status', authMiddleware, (_req, res) => {
  res.json(getAIStatus());
});

app.post('/api/ai/standup', authMiddleware, async (req, res) => {
  const { workspaceId } = req.body;
  const db = readDb();
  const user = getUser(db, req.auth.userId);
  if (!workspaceId) return res.status(400).json({ error: 'workspaceId required' });
  try {
    const { report, provider } = await generateAIStandup(db, workspaceId, getUser, computeAiInsights);
    writeDb((d) => { addActivity(d, workspaceId, user.name, 'generated AI standup report', 'task'); return d; });
    res.json({ report, provider });
  } catch (err) {
    const report = generateStandupReport(db, workspaceId);
    res.json({ report, provider: 'local', fallback: err.message });
  }
});

app.post('/api/ai/task-insight', authMiddleware, async (req, res) => {
  const { taskId } = req.body;
  if (!taskId) return res.status(400).json({ error: 'taskId required' });
  const db = readDb();
  try {
    const result = await generateAITaskInsight(db, taskId, getUser, hydrateTask);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/summarize-comments', authMiddleware, async (req, res) => {
  const { taskId } = req.body;
  if (!taskId) return res.status(400).json({ error: 'taskId required' });
  const db = readDb();
  const task = db.tasks.find((t) => t.id === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  try {
    const result = await generateAICommentSummary(task.comments ?? []);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/collaboration-insight', authMiddleware, async (req, res) => {
  const { workspaceId } = req.body;
  if (!workspaceId) return res.status(400).json({ error: 'workspaceId required' });
  const db = readDb();
  const presence = getMergedPresence(db, workspaceId);
  try {
    const result = await generateAICollaborationInsight(db, workspaceId, presence, getUser);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/activity-digest', authMiddleware, async (req, res) => {
  const { workspaceId } = req.body;
  if (!workspaceId) return res.status(400).json({ error: 'workspaceId required' });
  const db = readDb();
  try {
    const result = await generateAIActivityDigest(db, workspaceId, getUser);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/summarize', authMiddleware, (req, res) => {
  const { workspaceId } = req.body;
  const db = readDb();
  const plan = getUserPlan(db, req.auth.userId);
  if (!getPlanLimits(plan).ai) return res.status(403).json({ error: 'AI features require Pro plan' });
  const projectIds = db.projects.filter((p) => p.workspaceId === workspaceId).map((p) => p.id);
  const projects = db.projects.filter((p) => p.workspaceId === workspaceId);
  const tasks = db.tasks.filter((t) => projectIds.includes(t.projectId));
  const byStatus = {};
  tasks.forEach((t) => { byStatus[t.status] = (byStatus[t.status] ?? 0) + 1; });
  const summary = `## Project Summary\n\n**Workspace progress across ${projects.length} project(s)**\n\n| Status | Count |\n|--------|-------|\n${Object.entries(byStatus).map(([s, c]) => `| ${s} | ${c} |`).join('\n')}\n\n**Overall completion:** ${tasks.length ? Math.round((byStatus['Done'] ?? 0) / tasks.length * 100) : 0}%\n\n**Projects:**\n${projects.map((p) => `- ${p.name}: ${p.progress}% complete, ${p.openTasks} open tasks`).join('\n')}`;
  res.json({ summary });
});

app.post('/api/ai/blockers', authMiddleware, (req, res) => {
  const { workspaceId } = req.body;
  const db = readDb();
  const plan = getUserPlan(db, req.auth.userId);
  if (!getPlanLimits(plan).ai) return res.status(403).json({ error: 'AI features require Pro plan' });
  const projectIds = db.projects.filter((p) => p.workspaceId === workspaceId).map((p) => p.id);
  const tasks = db.tasks.filter((t) => projectIds.includes(t.projectId));
  const staleDays = 7;
  const cutoff = new Date(Date.now() - staleDays * 86400000).toISOString().slice(0, 10);
  const stuck = tasks.filter((t) => t.status === 'In Progress' && t.dueDate < cutoff);
  const inReview = tasks.filter((t) => t.status === 'In Review');
  const overdue = tasks.filter((t) => t.dueDate < new Date().toISOString().slice(0, 10) && t.status !== 'Done');
  const report = `## What's Blocking Us?\n\n**Stuck in In Progress (>${staleDays} days):** ${stuck.length}\n${stuck.map((t) => `- ${t.title} (due ${t.dueDate})`).join('\n') || '- None detected'}\n\n**Awaiting review:** ${inReview.length}\n${inReview.map((t) => `- ${t.title}`).join('\n') || '- None'}\n\n**Overdue:** ${overdue.length}\n${overdue.map((t) => `- ${t.title}`).join('\n') || '- None'}\n\n### Recommendations\n${stuck.length ? '- Reassign or break down stuck tasks\n' : ''}${inReview.length ? '- Schedule a review session for pending tasks\n' : ''}- Focus on highest priority (P0) items first`;
  res.json({ report, blockers: stuck.length + inReview.length });
});

app.post('/api/ai/task-breakdown', authMiddleware, (req, res) => {
  const { description, projectId, workspaceId } = req.body;
  const db = readDb();
  const plan = getUserPlan(db, req.auth.userId);
  if (!getPlanLimits(plan).ai) return res.status(403).json({ error: 'AI features require Pro plan' });
  const user = getUser(db, req.auth.userId);
  const feature = description ?? 'New feature';
  const templates = [
    { title: `Design: ${feature}`, status: 'To Do', priority: 'P1' },
    { title: `Implement core: ${feature}`, status: 'To Do', priority: 'P0' },
    { title: `Write unit tests for ${feature}`, status: 'To Do', priority: 'P1' },
    { title: `API integration for ${feature}`, status: 'To Do', priority: 'P1' },
    { title: `UI/UX for ${feature}`, status: 'To Do', priority: 'P2' },
    { title: `Documentation for ${feature}`, status: 'To Do', priority: 'P2' },
  ];
  const created = [];
  writeDb((d) => {
    templates.forEach((tpl) => {
      const task = {
        id: uid('t'),
        projectId,
        title: tpl.title,
        description: `Auto-generated from: ${feature}`,
        status: tpl.status,
        priority: tpl.priority,
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        labels: ['ai-generated'],
        assigneeIds: [user.id],
        estimate: '4h',
        comments: [],
        history: [`AI generated from feature description`],
        subtasks: [],
        checklist: [],
        attachments: [],
      };
      d.tasks.push(task);
      created.push(hydrateTask(d, task));
    });
    recalcProjectStats(d, projectId);
    addActivity(d, workspaceId, user.name, `AI generated ${templates.length} tasks for "${feature}"`, 'task');
    return d;
  });
  const project = readDb().projects.find((p) => p.id === projectId);
  if (project) emitWorkspace(project.workspaceId, 'bootstrap:refresh', { workspaceId: project.workspaceId });
  res.json({ tasks: created, count: created.length });
});

app.post('/api/ai/code-review', authMiddleware, (req, res) => {
  const { code, language } = req.body;
  const db = readDb();
  const plan = getUserPlan(db, req.auth.userId);
  if (!getPlanLimits(plan).ai) return res.status(403).json({ error: 'AI features require Pro plan' });
  const src = code ?? '';
  const lines = src.split('\n').length;
  const hasEval = src.includes('eval(');
  const hasConsole = src.includes('console.log');
  const hasVar = /\bvar\b/.test(src);
  const hasAny = src.includes('any');
  const qualityScore = Math.max(1, Math.min(10, Math.round((60 + lines * 2 + (src.includes('try') ? 10 : 0) - (hasEval ? 30 : 0) - (hasConsole ? 5 : 0)) / 10)));
  res.json({
    qualityScore,
    readability: Math.min(90, 70 + (src.includes('//') ? 10 : 0) - (hasVar ? 10 : 0)),
    security: hasEval ? 'high' : src.includes('password') ? 'medium' : 'low',
    bugs: [
      ...(hasConsole ? ['Remove debug console.log statements'] : []),
      ...(hasVar ? ['Use const/let instead of var for block scoping'] : []),
    ],
    optimizations: [
      ...(lines > 20 ? ['Consider splitting into smaller functions'] : ['Code looks concise — good job!']),
      ...(lines > 50 ? ['Add error handling for edge cases'] : []),
    ],
    securityIssues: [
      ...(hasEval ? ['Avoid eval() — use JSON.parse or safe alternatives'] : []),
      ...(src.includes('innerHTML') ? ['Sanitize HTML to prevent XSS'] : []),
    ],
    suggestions: [
      `Add JSDoc/type annotations for ${language ?? 'this'} code`,
      'Ensure consistent naming conventions',
      hasAny && language === 'TypeScript' ? 'Replace any with specific types' : 'Add input validation',
    ].filter(Boolean),
    language,
  });
});

// ─── Billing ────────────────────────────────────────────────────────────────

app.get('/api/billing/plan', authMiddleware, (req, res) => {
  const db = readDb();
  const plan = getUserPlan(db, req.auth.userId);
  const limits = getPlanLimits(plan);
  const workspaceId = db.workspaces.find((w) => w.memberIds.includes(req.auth.userId))?.id;
  const projectCount = workspaceId ? db.projects.filter((p) => p.workspaceId === workspaceId).length : 0;
  const ws = db.workspaces.find((w) => w.id === workspaceId);
  res.json({
    plan,
    limits,
    usage: {
      workspaces: db.workspaces.filter((w) => w.memberIds.includes(req.auth.userId)).length,
      projects: projectCount,
      members: ws?.memberIds.length ?? 0,
    },
  });
});

app.post('/api/billing/checkout', authMiddleware, (req, res) => {
  const { plan } = req.body;
  if (plan !== 'pro') return res.status(400).json({ error: 'Only Pro plan available in sandbox' });
  writeDb((d) => {
    if (!d.subscriptions) d.subscriptions = [];
    const idx = d.subscriptions.findIndex((s) => s.userId === req.auth.userId);
    const sub = { userId: req.auth.userId, plan: 'pro', status: 'active', sandbox: true, upgradedAt: new Date().toISOString() };
    if (idx >= 0) d.subscriptions[idx] = sub;
    else d.subscriptions.push(sub);
    return d;
  });
  res.json({
    ok: true,
    message: 'Sandbox checkout complete — Pro plan activated!',
    plan: 'pro',
    sandbox: true,
    receiptId: uid('rcpt'),
  });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(path.join(distPath, 'index.html'))) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`DevCollab API running on http://localhost:${PORT}`);
  console.log(`Demo login: shwetha@devcollab.io / ${DEMO_PASSWORD}`);
});
