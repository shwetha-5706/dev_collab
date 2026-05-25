import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Activity,
  AuthState,
  CalendarEvent,
  CreateDocInput,
  CreateProjectInput,
  CreateSnippetInput,
  CreateTaskInput,
  DocPage,
  MemberPresence,
  Notification,
  Project,
  QuickActionType,
  SearchResult,
  Snippet,
  Task,
  TaskFilter,
  UserProfile,
  Workspace,
} from '../types';
import {
  activities as mockActivities,
  aiInsights,
  analyticsData,
  calendarEvents,
  docs as mockDocs,
  memberPresence as mockPresence,
  notifications as mockNotifications,
  projects as mockProjects,
  snippets as mockSnippets,
  tasks as mockTasks,
  users,
  workspaces as mockWorkspaces,
} from '../data/mock';

const AUTH_STORAGE_KEY = 'devcollab_auth';

type StoredAuth = {
  userId: string;
  currentWorkspaceId: string;
  rememberMe: boolean;
};

export type AppContextValue = {
  auth: AuthState;
  workspaces: Workspace[];
  projects: Project[];
  tasks: Task[];
  snippets: Snippet[];
  docs: DocPage[];
  notifications: Notification[];
  activities: Activity[];
  memberPresence: MemberPresence[];
  calendarEvents: CalendarEvent[];
  aiInsights: typeof aiInsights;
  analyticsData: typeof analyticsData;
  activeWorkspace: Workspace | undefined;
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  notificationPanelOpen: boolean;
  commandPaletteOpen: boolean;
  quickActionModal: QuickActionType | null;
  taskFilter: TaskFilter;
  searchQuery: string;
  searchResults: SearchResult[];
  toast: string | null;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => void;
  verifyOtp: (otp: string) => Promise<void>;
  createWorkspace: (name: string, description: string, type: Workspace['type']) => void;
  selectWorkspace: (workspaceId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  createTask: (input: CreateTaskInput) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addTaskComment: (taskId: string, text: string) => void;
  createProject: (input: CreateProjectInput) => Project;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  createSnippet: (input: CreateSnippetInput) => Snippet;
  createDoc: (input: CreateDocInput) => DocPage;
  inviteMember: (email: string, role: UserProfile['role']) => void;
  generateAIReport: () => string;
  toggleSnippetFavorite: (snippetId: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleSidebar: () => void;
  setNotificationPanelOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setQuickActionModal: (action: QuickActionType | null) => void;
  setTaskFilter: (filter: TaskFilter) => void;
  setSearchQuery: (query: string) => void;
  globalSearch: (query: string) => SearchResult[];
  showToast: (message: string) => void;
};

export const AppContext = createContext<AppContextValue | undefined>(undefined);

const defaultAuth: AuthState = {
  user: null,
  isAuthenticated: false,
  currentWorkspaceId: '',
  sessionActive: false,
  rememberMe: false,
  needsWorkspaceSetup: false,
  pendingSignupEmail: null,
};

const loadStoredAuth = (): StoredAuth | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
};

const persistAuth = (userId: string, workspaceId: string, rememberMe: boolean) => {
  if (!rememberMe) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ userId, currentWorkspaceId: workspaceId, rememberMe: true })
  );
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(defaultAuth);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(mockWorkspaces);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [snippets, setSnippets] = useState<Snippet[]>(mockSnippets);
  const [docs, setDocs] = useState<DocPage[]>(mockDocs);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [memberPresence] = useState<MemberPresence[]>(mockPresence);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickActionModal, setQuickActionModal] = useState<QuickActionType | null>(null);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingSignupName, setPendingSignupName] = useState('');

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === auth.currentWorkspaceId) ?? workspaces[0],
    [auth.currentWorkspaceId, workspaces]
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const addActivity = useCallback((user: string, message: string, type: Activity['type'] = 'task') => {
    setActivities((prev) => [
      { id: `a-${Date.now()}`, user, message, timestamp: 'Just now', type },
      ...prev.slice(0, 9),
    ]);
  }, []);

  useEffect(() => {
    const stored = loadStoredAuth();
    if (!stored?.rememberMe) return;
    const user = users.find((u) => u.id === stored.userId) ?? users[0];
    setAuth({
      user,
      isAuthenticated: true,
      currentWorkspaceId: stored.currentWorkspaceId || mockWorkspaces[0].id,
      sessionActive: true,
      rememberMe: true,
      needsWorkspaceSetup: false,
      pendingSignupEmail: null,
    });
  }, []);

  const globalSearch = useCallback(
    (query: string): SearchResult[] => {
      if (!query.trim()) return [];
      const q = query.toLowerCase();
      const results: SearchResult[] = [];

      tasks.forEach((t) => {
        if (t.title.toLowerCase().includes(q)) {
          results.push({ id: t.id, type: 'task', title: t.title, subtitle: t.status });
        }
      });
      projects.forEach((p) => {
        if (p.name.toLowerCase().includes(q)) {
          results.push({ id: p.id, type: 'project', title: p.name, subtitle: `${p.progress}% complete` });
        }
      });
      docs.forEach((d) => {
        if (d.title.toLowerCase().includes(q)) {
          results.push({ id: d.id, type: 'doc', title: d.title, subtitle: `Updated by ${d.updatedBy}` });
        }
      });
      snippets.forEach((s) => {
        if (s.title.toLowerCase().includes(q)) {
          results.push({ id: s.id, type: 'snippet', title: s.title, subtitle: s.language });
        }
      });
      users.forEach((u) => {
        if (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) {
          results.push({ id: u.id, type: 'member', title: u.name, subtitle: u.role });
        }
      });

      return results.slice(0, 8);
    },
    [tasks, projects, docs, snippets]
  );

  useEffect(() => {
    setSearchResults(globalSearch(searchQuery));
  }, [searchQuery, globalSearch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setNotificationPanelOpen(false);
        setQuickActionModal(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    const interval = setInterval(() => {
      const liveActivity: Activity = {
        id: `a-live-${Date.now()}`,
        user: users[Math.floor(Math.random() * users.length)].name,
        message: ['updated a task', 'added a comment', 'shared a snippet', 'edited a wiki page'][
          Math.floor(Math.random() * 4)
        ],
        timestamp: 'Just now',
        type: 'task',
      };
      setActivities((prev) => [liveActivity, ...prev.slice(0, 9)]);
    }, 15000);
    return () => clearInterval(interval);
  }, [auth.isAuthenticated]);

  const signIn = async (email: string, _password: string, rememberMe = false) => {
    const user = users.find((u) => u.email === email) ?? users[0];
    const workspaceId = mockWorkspaces[0].id;
    setAuth({
      user,
      isAuthenticated: true,
      currentWorkspaceId: workspaceId,
      sessionActive: true,
      rememberMe,
      needsWorkspaceSetup: false,
      pendingSignupEmail: null,
    });
    persistAuth(user.id, workspaceId, rememberMe);
  };

  const signUp = async (email: string, _password: string, name?: string) => {
    setPendingSignupName(name ?? email.split('@')[0]);
    setAuth((prev) => ({
      ...prev,
      isAuthenticated: false,
      pendingSignupEmail: email,
      needsWorkspaceSetup: false,
    }));
  };

  const signOut = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth(defaultAuth);
    setPendingSignupName('');
  };

  const verifyOtp = async (_otp: string) => {
    const email = auth.pendingSignupEmail ?? 'new@devcollab.io';
    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      name: pendingSignupName || email.split('@')[0],
      email,
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
      role: 'Owner',
      bio: 'New DevCollab member.',
      skills: [],
      streak: 0,
    };
    setAuth({
      user: newUser,
      isAuthenticated: false,
      currentWorkspaceId: '',
      sessionActive: false,
      rememberMe: false,
      needsWorkspaceSetup: true,
      pendingSignupEmail: email,
    });
  };

  const createWorkspace = (name: string, description: string, type: Workspace['type']) => {
    const wsId = `ws-${Date.now()}`;
    const owner = auth.user ?? users[0];
    const newWorkspace: Workspace = {
      id: wsId,
      name,
      description,
      type,
      icon: '🚀',
      members: [owner],
      settings: { allowInvites: true, collaborationScore: 85 },
    };
    setWorkspaces((prev) => [...prev, newWorkspace]);
    setAuth((prev) => ({
      ...prev,
      isAuthenticated: true,
      currentWorkspaceId: wsId,
      sessionActive: true,
      needsWorkspaceSetup: false,
      pendingSignupEmail: null,
    }));
    persistAuth(owner.id, wsId, auth.rememberMe);
    addActivity(owner.name, `created workspace "${name}"`, 'member');
    showToast(`Workspace "${name}" created!`);
  };

  const selectWorkspace = (workspaceId: string) => {
    setAuth((prev) => {
      if (prev.user && prev.rememberMe) {
        persistAuth(prev.user.id, workspaceId, true);
      }
      return { ...prev, currentWorkspaceId: workspaceId };
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications((items) => items.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((items) => items.map((n) => ({ ...n, read: true })));
  };

  const updateTaskStatus = (taskId: string, status: Task['status']) => {
    setTasks((items) =>
      items.map((t) =>
        t.id === taskId
          ? { ...t, status, history: [...t.history, `Status changed to ${status}`] }
          : t
      )
    );
    const task = tasks.find((t) => t.id === taskId);
    if (task && auth.user) {
      addActivity(auth.user.name, `moved ${task.title} to ${status}`, 'task');
    }
  };

  const createTask = (input: CreateTaskInput): Task => {
    const task: Task = {
      id: `t-${Date.now()}`,
      projectId: input.projectId,
      title: input.title,
      description: input.description ?? '',
      status: input.status ?? 'To Do',
      priority: input.priority ?? 'P2',
      dueDate: input.dueDate ?? new Date().toISOString().slice(0, 10),
      labels: input.labels ?? [],
      assignees: auth.user ? [auth.user] : [],
      estimate: input.estimate ?? '2h',
      comments: [],
      history: [`Created by ${auth.user?.name ?? 'Unknown'}`],
    };
    setTasks((prev) => [...prev, task]);
    setProjects((prev) =>
      prev.map((p) => (p.id === input.projectId ? { ...p, openTasks: p.openTasks + 1 } : p))
    );
    if (auth.user) addActivity(auth.user.name, `created task "${input.title}"`, 'task');
    return task;
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((items) =>
      items.map((t) => {
        if (t.id !== taskId) return t;
        const history = [...t.history];
        if (updates.status && updates.status !== t.status) {
          history.push(`Status changed to ${updates.status}`);
        }
        if (updates.title && updates.title !== t.title) {
          history.push(`Title updated to "${updates.title}"`);
        }
        return { ...t, ...updates, history };
      })
    );
    if (auth.user) addActivity(auth.user.name, `updated task`, 'task');
  };

  const deleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (task) {
      setProjects((prev) =>
        prev.map((p) => (p.id === task.projectId ? { ...p, openTasks: Math.max(0, p.openTasks - 1) } : p))
      );
    }
  };

  const addTaskComment = (taskId: string, text: string) => {
    const author = auth.user?.name ?? 'Anonymous';
    setTasks((items) =>
      items.map((t) =>
        t.id === taskId
          ? {
              ...t,
              comments: [
                ...t.comments,
                { id: `c-${Date.now()}`, author, text, time: 'Just now' },
              ],
              history: [...t.history, `${author} commented`],
            }
          : t
      )
    );
    addActivity(author, `commented on a task`, 'comment');
  };

  const createProject = (input: CreateProjectInput): Project => {
    const project: Project = {
      id: `p-${Date.now()}`,
      workspaceId: auth.currentWorkspaceId || mockWorkspaces[0].id,
      name: input.name,
      banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80',
      deadline: input.deadline,
      stack: input.stack,
      priority: input.priority,
      owner: auth.user?.name ?? 'Unknown',
      health: 100,
      progress: 0,
      visibility: input.visibility,
      openTasks: 0,
      riskLevel: 'low',
    };
    setProjects((prev) => [...prev, project]);
    if (auth.user) addActivity(auth.user.name, `created project "${input.name}"`, 'task');
    return project;
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, ...updates } : p)));
  };

  const deleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setTasks((prev) => prev.filter((t) => t.projectId !== projectId));
  };

  const createSnippet = (input: CreateSnippetInput): Snippet => {
    const snippet: Snippet = {
      id: `s-${Date.now()}`,
      title: input.title,
      language: input.language,
      code: input.code,
      tags: input.tags ?? [],
      favorite: false,
      author: auth.user?.name ?? 'Unknown',
    };
    setSnippets((prev) => [...prev, snippet]);
    if (auth.user) addActivity(auth.user.name, `added snippet "${input.title}"`, 'wiki');
    return snippet;
  };

  const createDoc = (input: CreateDocInput): DocPage => {
    const doc: DocPage = {
      id: `d-${Date.now()}`,
      title: input.title,
      body: input.body,
      tags: input.tags ?? [],
      updatedBy: auth.user?.name ?? 'Unknown',
      updatedAt: new Date().toISOString().slice(0, 10),
      shared: true,
    };
    setDocs((prev) => [...prev, doc]);
    if (auth.user) addActivity(auth.user.name, `created doc "${input.title}"`, 'wiki');
    return doc;
  };

  const inviteMember = (email: string, role: UserProfile['role']) => {
    const inviteNotification: Notification = {
      id: `n-${Date.now()}`,
      type: 'invite',
      text: `Invitation sent to ${email} as ${role}`,
      time: 'Just now',
      read: false,
      priority: 'low',
    };
    setNotifications((prev) => [inviteNotification, ...prev]);
    if (auth.user) addActivity(auth.user.name, `invited ${email} as ${role}`, 'member');
  };

  const generateAIReport = (): string => {
    const done = tasks.filter((t) => t.status === 'Done').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const overdue = tasks.filter((t) => t.dueDate < new Date().toISOString().slice(0, 10) && t.status !== 'Done').length;
    const report = `## Daily Standup Report\n\n**Completed:** ${done} tasks\n**In Progress:** ${inProgress} tasks\n**Overdue:** ${overdue} tasks\n\n**Sprint Health:** ${aiInsights.sprintHealth}%\n**Team Mood:** ${aiInsights.teamMood}\n\n### Key Updates\n${aiInsights.predictions.map((p) => `- ${p}`).join('\n')}\n\n### Recommendations\n${aiInsights.recommendations.map((r) => `- ${r}`).join('\n')}`;
    if (auth.user) addActivity(auth.user.name, 'generated AI standup report', 'task');
    return report;
  };

  const toggleSnippetFavorite = (snippetId: string) => {
    setSnippets((items) =>
      items.map((s) => (s.id === snippetId ? { ...s, favorite: !s.favorite } : s))
    );
  };

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  return (
    <AppContext.Provider
      value={{
        auth,
        workspaces,
        projects,
        tasks,
        snippets,
        docs,
        notifications,
        activities,
        memberPresence,
        calendarEvents,
        aiInsights,
        analyticsData,
        activeWorkspace,
        theme,
        sidebarCollapsed,
        notificationPanelOpen,
        commandPaletteOpen,
        quickActionModal,
        taskFilter,
        searchQuery,
        searchResults,
        toast,
        signIn,
        signUp,
        signOut,
        verifyOtp,
        createWorkspace,
        selectWorkspace,
        markNotificationRead,
        markAllNotificationsRead,
        updateTaskStatus,
        createTask,
        updateTask,
        deleteTask,
        addTaskComment,
        createProject,
        updateProject,
        deleteProject,
        createSnippet,
        createDoc,
        inviteMember,
        generateAIReport,
        toggleSnippetFavorite,
        setTheme,
        toggleSidebar,
        setNotificationPanelOpen,
        setCommandPaletteOpen,
        setQuickActionModal,
        setTaskFilter,
        setSearchQuery,
        globalSearch,
        showToast,
      }}
    >
      {children}
      {toast && (
        <div className="toast-notification glass" role="status">
          {toast}
        </div>
      )}
    </AppContext.Provider>
  );
};
