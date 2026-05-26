/**
 * DevCollab AI layer — uses OpenAI when OPENAI_API_KEY is set, otherwise smart local generation.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export function getAIStatus() {
  return {
    configured: Boolean(OPENAI_API_KEY),
    model: OPENAI_API_KEY ? OPENAI_MODEL : 'local',
    provider: OPENAI_API_KEY ? 'openai' : 'local',
  };
}

export async function callOpenAI(system, user, maxTokens = 900) {
  if (!OPENAI_API_KEY) return null;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: maxTokens,
      temperature: 0.65,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

export function buildWorkspaceTaskContext(db, workspaceId, getUser) {
  const today = new Date().toISOString().slice(0, 10);
  const projects = db.projects.filter((p) => p.workspaceId === workspaceId);
  const projectIds = projects.map((p) => p.id);
  const tasks = db.tasks.filter((t) => projectIds.includes(t.projectId));
  const activities = db.activities.filter((a) => a.workspaceId === workspaceId).slice(0, 15);
  const ws = db.workspaces.find((w) => w.id === workspaceId);
  const members = ws?.memberIds.map((id) => getUser(db, id)?.name).filter(Boolean) ?? [];

  return {
    today,
    team: members,
    projects: projects.map((p) => ({ name: p.name, progress: p.progress, openTasks: p.openTasks })),
    completed: tasks.filter((t) => t.status === 'Done').map((t) => t.title),
    inProgress: tasks.filter((t) => t.status === 'In Progress').map((t) => t.title),
    todo: tasks.filter((t) => t.status === 'To Do').map((t) => t.title),
    inReview: tasks.filter((t) => t.status === 'In Review').map((t) => t.title),
    overdue: tasks.filter((t) => t.dueDate < today && t.status !== 'Done').map((t) => ({ title: t.title, due: t.dueDate })),
    moved: tasks
      .filter((t) => (t.history ?? []).some((h) => h.includes('Status changed')))
      .slice(0, 8)
      .map((t) => {
        const move = [...(t.history ?? [])].reverse().find((h) => h.includes('Status changed'));
        return { title: t.title, move };
      }),
    recentActivity: activities.map((a) => `${a.user}: ${a.message}`),
  };
}

function localStandupReport(ctx, sprintHealth) {
  const yesterday = [];
  ctx.completed.slice(0, 5).forEach((t) => yesterday.push(`${t}`));
  ctx.moved.slice(0, 4).forEach(({ title, move }) => {
    if (move && !yesterday.includes(title)) {
      yesterday.push(`${title} (${move.replace('Status changed to ', 'moved to ')})`);
    }
  });

  const today = [...ctx.inProgress, ...ctx.todo].slice(0, 6);
  const blockers = ctx.overdue.map((t) => `${t.title} — overdue (due ${t.due})`);
  ctx.inReview.slice(0, 3).forEach((t) => blockers.push(`${t} — waiting in review`));

  const fmt = (lines, fallback) => (lines.length ? lines.map((l) => `- ${l}`).join('\n') : `- ${fallback}`);

  return [
    'Yesterday:',
    fmt(yesterday, 'No completed tasks yet — close out wins from the backlog'),
    '',
    'Today:',
    fmt(today, 'Plan sprint priorities with the team'),
    '',
    'Blockers:',
    fmt(blockers, 'None — team is unblocked'),
    '',
    `Sprint health: ${sprintHealth}% · Team: ${ctx.team.join(', ') || 'You'}`,
  ].join('\n');
}

export async function generateAIStandup(db, workspaceId, getUser, computeAiInsights) {
  const ctx = buildWorkspaceTaskContext(db, workspaceId, getUser);
  const insights = computeAiInsights(db, workspaceId);
  const contextJson = JSON.stringify(ctx, null, 2);

  const system = `You are an engineering standup assistant. Write a concise daily standup in plain text with exactly these sections:
Yesterday:
Today:
Blockers:

Use bullet points (- item) under each section. Be specific using the task data provided. Keep it professional and under 200 words total. Do not use markdown headers beyond the three section labels.`;

  const user = `Generate today's standup for team: ${ctx.team.join(', ') || 'solo dev'}.
Sprint health: ${insights.sprintHealth}%.

Task data:
${contextJson}`;

  try {
    const aiText = await callOpenAI(system, user);
    if (aiText) {
      return { report: aiText, provider: 'openai' };
    }
  } catch (err) {
    console.warn('[AI] Standup OpenAI fallback:', err.message);
  }

  return { report: localStandupReport(ctx, insights.sprintHealth), provider: 'local' };
}

export function buildTaskContext(db, task, getUser, hydrateTask) {
  const project = db.projects.find((p) => p.id === task.projectId);
  const hydrated = hydrateTask(db, task);
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    project: project?.name,
    assignees: hydrated.assignees?.map((a) => a.name) ?? [],
    labels: task.labels ?? [],
    comments: (task.comments ?? []).map((c) => `${c.author}: ${c.text}`),
    history: task.history ?? [],
    subtasks: (task.subtasks ?? []).map((s) => s.title),
  };
}

function localTaskInsight(ctx, today) {
  const overdue = ctx.dueDate < today && ctx.status !== 'Done';
  const assigneeText = ctx.assignees.length ? ctx.assignees.join(', ') : 'Unassigned';
  let risk = overdue ? 'This task is overdue — prioritize or re-scope.' : 'On schedule for the current sprint.';
  if (ctx.status === 'In Review') risk = 'Waiting on review — consider pairing or async feedback.';
  if (ctx.status === 'Done') risk = 'Completed — ready to ship or document.';

  const commentNote = ctx.comments.length
    ? `Team left ${ctx.comments.length} comment(s) — latest: "${ctx.comments[ctx.comments.length - 1]?.slice(0, 80)}…"`
    : 'No comments yet — good time to sync with assignees.';

  return `${ctx.title} is ${ctx.status} (${ctx.priority}) on project ${ctx.project ?? 'unknown'}. Assigned to ${assigneeText}. ${risk} ${commentNote}`;
}

export async function generateAITaskInsight(db, taskId, getUser, hydrateTask) {
  const task = db.tasks.find((t) => t.id === taskId);
  if (!task) return { insight: 'Task not found.', provider: 'local' };

  const ctx = buildTaskContext(db, task, getUser, hydrateTask);
  const today = new Date().toISOString().slice(0, 10);

  const system = `You are a helpful engineering copilot. Summarize the task status in 2-3 sentences for someone opening the task panel. Mention risk, assignees, and next step. Be direct.`;

  try {
    const aiText = await callOpenAI(system, `Task data:\n${JSON.stringify(ctx, null, 2)}`, 200);
    if (aiText) return { insight: aiText, provider: 'openai' };
  } catch (err) {
    console.warn('[AI] Task insight fallback:', err.message);
  }

  return { insight: localTaskInsight(ctx, today), provider: 'local' };
}

function localCommentSummary(comments) {
  if (!comments.length) return 'No comments yet. Start the discussion with context or @mentions.';
  const authors = [...new Set(comments.map((c) => c.author))];
  const last = comments[comments.length - 1];
  return `Thread has ${comments.length} message(s) from ${authors.join(', ')}. Latest from ${last.author}: "${last.text.slice(0, 120)}${last.text.length > 120 ? '…' : ''}"`;
}

export async function generateAICommentSummary(comments) {
  if (!comments?.length) {
    return { summary: localCommentSummary([]), provider: 'local' };
  }

  const system = `Summarize this task comment thread in 1-2 sentences. Capture decisions, blockers, and who said what. Plain text only.`;
  const user = comments.map((c) => `${c.author} (${c.time}): ${c.text}`).join('\n');

  try {
    const aiText = await callOpenAI(system, user, 150);
    if (aiText) return { summary: aiText, provider: 'openai' };
  } catch (err) {
    console.warn('[AI] Comment summary fallback:', err.message);
  }

  return { summary: localCommentSummary(comments), provider: 'local' };
}

function localCollaborationInsight(presence, getUser, db) {
  const online = presence.filter((p) => p.status === 'Online');
  if (!online.length) return 'Team is offline — async updates will sync when they return.';

  const parts = online.map((p) => {
    const name = p.userName ?? getUser(db, p.userId)?.name ?? 'Teammate';
    if (p.viewingTask) return `${name} is viewing "${p.viewingTask}"`;
    if (p.activity) return `${name} is ${p.activity.toLowerCase()}`;
    return `${name} is online`;
  });

  return `Live collaboration: ${parts.join(' · ')}. Changes sync instantly across the board.`;
}

export async function generateAICollaborationInsight(db, workspaceId, presence, getUser) {
  const online = presence.filter((p) => p.status === 'Online');
  if (!online.length) {
    return { insight: localCollaborationInsight(presence, getUser, db), provider: 'local' };
  }

  const payload = online.map((p) => ({
    name: p.userName ?? getUser(db, p.userId)?.name,
    status: p.status,
    activity: p.activity,
    viewingTask: p.viewingTask,
  }));

  const system = `You write one short sentence (max 25 words) describing what the live team is focused on right now. Friendly, like a Slack status. No bullet points.`;

  try {
    const aiText = await callOpenAI(system, `Online teammates:\n${JSON.stringify(payload)}`, 80);
    if (aiText) return { insight: aiText, provider: 'openai' };
  } catch (err) {
    console.warn('[AI] Collaboration insight fallback:', err.message);
  }

  return { insight: localCollaborationInsight(presence, getUser, db), provider: 'local' };
}

export async function generateAIActivityDigest(db, workspaceId, getUser) {
  const ctx = buildWorkspaceTaskContext(db, workspaceId, getUser);
  const system = `Summarize the team's recent activity in 2-3 bullet points. Focus on momentum, blockers, and wins. Plain text with - bullets.`;

  try {
    const aiText = await callOpenAI(
      system,
      `Recent activity:\n${ctx.recentActivity.join('\n') || 'No activity yet'}\n\nTasks in progress: ${ctx.inProgress.join(', ') || 'none'}`,
      250
    );
    if (aiText) return { digest: aiText, provider: 'openai' };
  } catch (err) {
    console.warn('[AI] Activity digest fallback:', err.message);
  }

  const lines = ctx.recentActivity.slice(0, 4);
  const digest = lines.length
    ? lines.map((l) => `- ${l}`).join('\n')
    : '- No recent activity — create tasks or move cards to generate live updates.';
  return { digest, provider: 'local' };
}
