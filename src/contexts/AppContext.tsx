import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Activity,
  AuthState,
  CalendarEvent,
  CreateDocInput,
  CreateProjectInput,
  CreateSnippetInput,
  CreateTaskInput,
  DocPage,
  DocVersion,
  MemberPresence,
  Notification,
  Project,
  QuickActionType,
  SearchResult,
  Snippet,
  SubscriptionPlan,
  Task,
  TaskFilter,
  UserProfile,
  Workspace,
} from '../types';
import { api, ApiError, getToken, setToken, type BootstrapPayload } from '../api/client';
import { connectSocket, disconnectSocket } from '../api/socket';

const AUTH_STORAGE_KEY = 'devcollab_auth';

type StoredAuth = {
  userId: string;
  currentWorkspaceId: string;
  rememberMe: boolean;
};

const defaultAiInsights = {
  blockedTasks: 0,
  sprintHealth: 100,
  burnoutRisk: 'low' as const,
  teamMood: 'focused' as const,
  predictions: [] as string[],
  recommendations: [] as string[],
};

const defaultAnalytics = {
  daily: [0, 0, 0, 0, 0, 0, 0],
  weekly: [0, 0, 0, 0, 0, 0, 0],
  monthly: [0, 0, 0, 0, 0, 0],
  teamPerformance: [] as { name: string; completed: number; assigned: number }[],
  collaborationScore: 0,
  burnoutIndex: 0,
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
  aiInsights: typeof defaultAiInsights;
  analyticsData: typeof defaultAnalytics;
  subscription: SubscriptionPlan;
  activeWorkspace: Workspace | undefined;
  loading: boolean;
  backendOnline: boolean;
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  notificationPanelOpen: boolean;
  commandPaletteOpen: boolean;
  quickActionModal: QuickActionType | null;
  quickActionProjectId: string | null;
  taskFilter: TaskFilter;
  searchQuery: string;
  searchResults: SearchResult[];
  toast: string | null;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<{ demoOtp?: string }>;
  signOut: () => void;
  socialLogin: (provider: string, email: string, rememberMe?: boolean) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  createWorkspace: (name: string, description: string, type: Workspace['type']) => Promise<void>;
  updateWorkspace: (updates: Partial<Pick<Workspace, 'name' | 'description' | 'type' | 'icon'>> & { allowInvites?: boolean }) => Promise<void>;
  selectWorkspace: (workspaceId: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task | null>;
  updateTask: (taskId: string, updates: Partial<Task> & { assigneeIds?: string[] }) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addTaskComment: (taskId: string, text: string) => Promise<void>;
  generateTaskSubtasks: (taskId: string) => Promise<void>;
  balanceWorkload: () => Promise<void>;
  createProject: (input: CreateProjectInput) => Promise<Project | null>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  createSnippet: (input: CreateSnippetInput) => Promise<Snippet | null>;
  createDoc: (input: CreateDocInput) => Promise<DocPage | null>;
  updateDoc: (docId: string, updates: Partial<DocPage>) => Promise<void>;
  inviteMember: (email: string, role: UserProfile['role']) => Promise<string | undefined>;
  updateProfile: (updates: Partial<Pick<UserProfile, 'name' | 'bio' | 'skills' | 'avatar' | 'github'>>) => Promise<void>;
  generateAIReport: () => Promise<{ report: string; provider: 'openai' | 'local' }>;
  getTaskInsight: (taskId: string) => Promise<{ insight: string; provider: 'openai' | 'local' }>;
  summarizeTaskComments: (taskId: string) => Promise<{ summary: string; provider: 'openai' | 'local' }>;
  getCollaborationInsight: () => Promise<{ insight: string; provider: 'openai' | 'local' }>;
  getActivityDigest: () => Promise<{ digest: string; provider: 'openai' | 'local' }>;
  aiProvider: 'openai' | 'local';
  aiConfigured: boolean;
  summarizeProject: () => Promise<string>;
  getBlockersReport: () => Promise<string>;
  generateTaskBreakdown: (description: string, projectId: string) => Promise<number>;
  analyzeCode: (code: string, language: string) => Promise<Record<string, unknown>>;
  toggleSnippetFavorite: (snippetId: string) => Promise<void>;
  getDocVersions: (docId: string) => Promise<DocVersion[]>;
  checkoutPro: () => Promise<void>;
  refreshBilling: () => Promise<void>;
  refreshData: () => Promise<void>;
  checkBackend: () => Promise<boolean>;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleSidebar: () => void;
  setNotificationPanelOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setQuickActionModal: (action: QuickActionType | null, projectId?: string | null) => void;
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
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ userId, currentWorkspaceId: workspaceId, rememberMe: true }));
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(defaultAuth);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [docs, setDocs] = useState<DocPage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [memberPresence, setMemberPresence] = useState<MemberPresence[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [aiInsights, setAiInsights] = useState(defaultAiInsights);
  const [analyticsData, setAnalyticsData] = useState(defaultAnalytics);
  const [subscription, setSubscription] = useState<SubscriptionPlan>({
    plan: 'free',
    limits: { workspaces: 1, projects: 3, members: 5, ai: false },
  });
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  const [aiProvider, setAiProvider] = useState<'openai' | 'local'>('local');
  const [aiConfigured, setAiConfigured] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickActionModal, setQuickActionModalState] = useState<QuickActionType | null>(null);
  const [quickActionProjectId, setQuickActionProjectId] = useState<string | null>(null);

  const setQuickActionModal = useCallback((action: QuickActionType | null, projectId?: string | null) => {
    setQuickActionModalState(action);
    setQuickActionProjectId(projectId ?? null);
  }, []);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const workspaceIdRef = useRef('');

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === auth.currentWorkspaceId) ?? workspaces[0],
    [auth.currentWorkspaceId, workspaces]
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const applyBootstrap = useCallback((data: BootstrapPayload, rememberMe = auth.rememberMe) => {
    if (data.user) {
      setAuth((prev) => ({
        ...prev,
        user: data.user,
        isAuthenticated: true,
        currentWorkspaceId: data.workspaceId,
        sessionActive: true,
        rememberMe,
        needsWorkspaceSetup: false,
        pendingSignupEmail: null,
      }));
      persistAuth(data.user.id, data.workspaceId, rememberMe);
    }
    setWorkspaces(data.workspaces);
    setProjects(data.projects);
    setTasks(data.tasks);
    setSnippets(data.snippets);
    setDocs(data.docs);
    setNotifications(data.notifications);
    setActivities(data.activities);
    setMemberPresence(data.memberPresence);
    setCalendarEvents(data.calendarEvents);
    setAnalyticsData(data.analyticsData);
    setAiInsights(data.aiInsights as typeof defaultAiInsights);
    if (data.subscription) setSubscription(data.subscription);
    workspaceIdRef.current = data.workspaceId;
  }, [auth.rememberMe]);

  const refreshAIStatus = useCallback(async () => {
    if (!getToken()) return;
    try {
      const status = await api.getAIStatus();
      setAiProvider(status.provider);
      setAiConfigured(status.configured);
    } catch {
      setAiProvider('local');
      setAiConfigured(false);
    }
  }, []);

  const checkBackend = useCallback(async () => {
    try {
      await api.health();
      setBackendOnline(true);
      return true;
    } catch {
      setBackendOnline(false);
      return false;
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!getToken()) return;
    try {
      const data = await api.bootstrap(auth.currentWorkspaceId || workspaceIdRef.current);
      applyBootstrap(data);
      setBackendOnline(true);
      await refreshAIStatus();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setToken(null);
        setAuth(defaultAuth);
      } else {
        setBackendOnline(false);
      }
    }
  }, [auth.currentWorkspaceId, applyBootstrap, refreshAIStatus]);

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, [checkBackend]);

  useEffect(() => {
    const init = async () => {
      if (!getToken()) {
        const stored = loadStoredAuth();
        if (stored?.rememberMe) {
          showToast('Session expired — please sign in again');
        }
        await checkBackend();
        return;
      }
      setLoading(true);
      try {
        const stored = loadStoredAuth();
        const data = await api.bootstrap(stored?.currentWorkspaceId);
        applyBootstrap(data, stored?.rememberMe ?? false);
        setBackendOnline(true);
      } catch {
        setToken(null);
        setBackendOnline(false);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.currentWorkspaceId || !auth.user) return;
    connectSocket(
      auth.currentWorkspaceId,
      auth.user.id,
      auth.user.name,
      {
        onRefresh: () => { refreshData(); },
        onTaskUpdated: (task) => {
          setTasks((prev) => {
            const exists = prev.some((x) => x.id === task.id);
            return exists ? prev.map((x) => (x.id === task.id ? task : x)) : [...prev, task];
          });
        },
        onTaskCreated: (task) => {
          setTasks((prev) => (prev.some((x) => x.id === task.id) ? prev : [...prev, task]));
        },
        onActivityNew: (activity) => {
          setActivities((prev) => [activity, ...prev.filter((a) => a.id !== activity.id)].slice(0, 20));
        },
        onPresenceChanged: (presence) => setMemberPresence(presence),
        onLiveUpdate: (message) => {
          if (!message.includes(auth.user?.name ?? '')) {
            showToast(`Live: ${message}`);
          }
        },
        onNotification: (n) => {
          setNotifications((prev) => [n, ...prev]);
          showToast(n.text);
        },
      }
    );
    return () => disconnectSocket();
  }, [auth.isAuthenticated, auth.currentWorkspaceId, auth.user?.id, refreshData, showToast]);

  const globalSearch = useCallback(
    (query: string): SearchResult[] => {
      if (!query.trim()) return [];
      const q = query.toLowerCase();
      const results: SearchResult[] = [];
      tasks.forEach((t) => {
        if (t.title.toLowerCase().includes(q)) results.push({ id: t.id, type: 'task', title: t.title, subtitle: t.status });
      });
      projects.forEach((p) => {
        if (p.name.toLowerCase().includes(q)) results.push({ id: p.id, type: 'project', title: p.name, subtitle: `${p.progress}% complete` });
      });
      docs.forEach((d) => {
        if (d.title.toLowerCase().includes(q)) results.push({ id: d.id, type: 'doc', title: d.title, subtitle: `Updated by ${d.updatedBy}` });
      });
      snippets.forEach((s) => {
        if (s.title.toLowerCase().includes(q)) results.push({ id: s.id, type: 'snippet', title: s.title, subtitle: s.language });
      });
      activeWorkspace?.members.forEach((u) => {
        if (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) {
          results.push({ id: u.id, type: 'member', title: u.name, subtitle: u.role });
        }
      });
      return results.slice(0, 8);
    },
    [tasks, projects, docs, snippets, activeWorkspace]
  );

  useEffect(() => setSearchResults(globalSearch(searchQuery)), [searchQuery, globalSearch]);

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

  const signIn = async (email: string, password: string, rememberMe = false) => {
    const { token, user, workspaceId } = await api.login(email, password);
    setToken(token);
    setAuth((prev) => ({ ...prev, rememberMe }));
    const data = await api.bootstrap(workspaceId);
    applyBootstrap(data, rememberMe);
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const result = await api.signup(email, password, name);
    setAuth((prev) => ({ ...prev, pendingSignupEmail: email, isAuthenticated: false }));
    return { demoOtp: result.demoOtp };
  };

  const socialLogin = async (provider: string, email: string, rememberMe = false) => {
    const { token, user, workspaceId } = await api.socialLogin(provider, email);
    setToken(token);
    const data = await api.bootstrap(workspaceId);
    applyBootstrap(data, rememberMe);
  };

  const signOut = () => {
    setToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    disconnectSocket();
    setAuth(defaultAuth);
    setWorkspaces([]);
    setProjects([]);
    setTasks([]);
  };

  const verifyOtp = async (otp: string) => {
    const email = auth.pendingSignupEmail;
    if (!email) throw new Error('No pending signup');
    const { token, user, needsWorkspaceSetup } = await api.verifyOtp(email, otp);
    setToken(token);
    setAuth({
      user: user as UserProfile,
      isAuthenticated: false,
      currentWorkspaceId: '',
      sessionActive: false,
      rememberMe: false,
      needsWorkspaceSetup,
      pendingSignupEmail: email,
    });
  };

  const createWorkspace = async (name: string, description: string, type: Workspace['type']) => {
    const data = await api.createWorkspace(name, description, type);
    applyBootstrap(data);
    showToast(`Workspace "${name}" created!`);
  };

  const updateWorkspace = async (updates: Partial<Pick<Workspace, 'name' | 'description' | 'type' | 'icon'>> & { allowInvites?: boolean }) => {
    if (!activeWorkspace) return;
    const data = await api.updateWorkspace(activeWorkspace.id, updates);
    applyBootstrap(data);
    showToast('Workspace settings saved');
  };

  const selectWorkspace = async (workspaceId: string) => {
    const data = await api.bootstrap(workspaceId);
    applyBootstrap(data, auth.rememberMe);
  };

  const markNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((items) => items.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((items) => items.map((n) => ({ ...n, read: true })));
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    const task = await api.updateTask(taskId, { status }) as Task;
    setTasks((items) => items.map((t) => (t.id === taskId ? task : t)));
    await refreshData();
  };

  const createTask = async (input: CreateTaskInput) => {
    if (!input.projectId) {
      throw new ApiError('Select a project for this task.', 400);
    }
    const task = await api.createTask({
      ...input,
      workspaceId: auth.currentWorkspaceId || workspaceIdRef.current,
    }) as Task;
    setTasks((prev) => [...prev, task]);
    await refreshData();
    return task;
  };

  const updateTask = async (taskId: string, updates: Partial<Task> & { assigneeIds?: string[] }) => {
    const { assignees, ...rest } = updates;
    const payload: Record<string, unknown> = { ...rest };
    if (assignees) payload.assigneeIds = assignees.map((a) => a.id);
    if (updates.assigneeIds) payload.assigneeIds = updates.assigneeIds;
    const task = await api.updateTask(taskId, payload) as Task;
    setTasks((items) => items.map((t) => (t.id === taskId ? task : t)));
  };

  const deleteTask = async (taskId: string) => {
    await api.deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await refreshData();
  };

  const addTaskComment = async (taskId: string, text: string) => {
    const task = await api.addComment(taskId, text) as Task;
    setTasks((items) => items.map((t) => (t.id === taskId ? task : t)));
  };

  const generateTaskSubtasks = async (taskId: string) => {
    const task = await api.generateSubtasks(taskId) as Task;
    setTasks((items) => items.map((t) => (t.id === taskId ? task : t)));
    showToast('AI subtasks generated');
  };

  const balanceWorkload = async () => {
    if (!activeWorkspace) return;
    const data = await api.balanceWorkload(activeWorkspace.id);
    applyBootstrap(data);
    showToast('Workload rebalanced across the team');
  };

  const createProject = async (input: CreateProjectInput) => {
    const workspaceId = auth.currentWorkspaceId || workspaceIdRef.current;
    if (!workspaceId) {
      throw new ApiError('Create a workspace before adding projects.', 400);
    }
    const project = await api.createProject({
      ...input,
      workspaceId,
    }) as Project;
    setProjects((prev) => [...prev, project]);
    await refreshData();
    return project;
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    const project = await api.updateProject(projectId, updates) as Project;
    setProjects((prev) => prev.map((p) => (p.id === projectId ? project : p)));
  };

  const deleteProject = async (projectId: string) => {
    await api.deleteProject(projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setTasks((prev) => prev.filter((t) => t.projectId !== projectId));
  };

  const createSnippet = async (input: CreateSnippetInput) => {
    const workspaceId = auth.currentWorkspaceId || workspaceIdRef.current;
    const snippet = await api.createSnippet({ ...input, workspaceId }) as Snippet;
    setSnippets((prev) => [snippet, ...prev]);
    await refreshData();
    return snippet;
  };

  const createDoc = async (input: CreateDocInput) => {
    const workspaceId = auth.currentWorkspaceId || workspaceIdRef.current;
    const doc = await api.createDoc({ ...input, workspaceId }) as DocPage;
    setDocs((prev) => [doc, ...prev]);
    await refreshData();
    return doc;
  };

  const updateDoc = async (docId: string, updates: Partial<DocPage>) => {
    const doc = await api.updateDoc(docId, updates) as DocPage;
    setDocs((prev) => prev.map((d) => (d.id === docId ? doc : d)));
    showToast('Document saved');
  };

  const inviteMember = async (email: string, role: UserProfile['role']) => {
    if (!activeWorkspace) return;
    const result = await api.inviteMember(activeWorkspace.id, email, role);
    await refreshData();
    return result.inviteLink;
  };

  const updateProfile = async (updates: Partial<Pick<UserProfile, 'name' | 'bio' | 'skills' | 'avatar' | 'github'>>) => {
    const user = await api.updateProfile(updates) as UserProfile;
    setAuth((prev) => ({ ...prev, user }));
    showToast('Profile updated');
  };

  const generateAIReport = useCallback(async () => {
    if (!activeWorkspace) return { report: '', provider: 'local' as const };
    const result = await api.generateStandup(activeWorkspace.id);
    await refreshData();
    return result;
  }, [activeWorkspace, refreshData]);

  const getTaskInsight = useCallback((taskId: string) => api.getTaskInsight(taskId), []);

  const summarizeTaskComments = useCallback((taskId: string) => api.summarizeTaskComments(taskId), []);

  const getCollaborationInsight = useCallback(async () => {
    if (!activeWorkspace) return { insight: '', provider: 'local' as const };
    return api.getCollaborationInsight(activeWorkspace.id);
  }, [activeWorkspace]);

  const getActivityDigest = useCallback(async () => {
    if (!activeWorkspace) return { digest: '', provider: 'local' as const };
    return api.getActivityDigest(activeWorkspace.id);
  }, [activeWorkspace]);

  const summarizeProject = async () => {
    if (!activeWorkspace) return '';
    const { summary } = await api.summarizeProject(activeWorkspace.id);
    return summary;
  };

  const getBlockersReport = async () => {
    if (!activeWorkspace) return '';
    const { report } = await api.getBlockers(activeWorkspace.id);
    return report;
  };

  const generateTaskBreakdown = async (description: string, projectId: string) => {
    if (!activeWorkspace) return 0;
    const { count } = await api.generateTaskBreakdown(description, projectId, activeWorkspace.id);
    await refreshData();
    return count;
  };

  const analyzeCode = async (code: string, language: string) => {
    return api.codeReview(code, language) as Promise<Record<string, unknown>>;
  };

  const getDocVersions = async (docId: string) => {
    const { versions } = await api.getDocVersions(docId);
    return versions;
  };

  const checkoutPro = async () => {
    const result = await api.checkoutPro();
    await refreshData();
    showToast(result.message);
  };

  const refreshBilling = async () => {
    const data = await api.getBillingPlan();
    setSubscription({ plan: data.plan, limits: data.limits, usage: data.usage });
  };

  const toggleSnippetFavorite = async (snippetId: string) => {
    const { favorite } = await api.toggleSnippetFavorite(snippetId);
    setSnippets((items) => items.map((s) => (s.id === snippetId ? { ...s, favorite } : s)));
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
        subscription,
        activeWorkspace,
        loading,
        backendOnline,
        aiProvider,
        aiConfigured,
        theme,
        sidebarCollapsed,
        notificationPanelOpen,
        commandPaletteOpen,
        quickActionModal,
        quickActionProjectId,
        taskFilter,
        searchQuery,
        searchResults,
        toast,
        signIn,
        signUp,
        signOut,
        socialLogin,
        verifyOtp,
        createWorkspace,
        updateWorkspace,
        selectWorkspace,
        markNotificationRead,
        markAllNotificationsRead,
        updateTaskStatus,
        createTask,
        updateTask,
        deleteTask,
        addTaskComment,
        generateTaskSubtasks,
        balanceWorkload,
        createProject,
        updateProject,
        deleteProject,
        createSnippet,
        createDoc,
        updateDoc,
        inviteMember,
        updateProfile,
        generateAIReport,
        getTaskInsight,
        summarizeTaskComments,
        getCollaborationInsight,
        getActivityDigest,
        summarizeProject,
        getBlockersReport,
        generateTaskBreakdown,
        analyzeCode,
        toggleSnippetFavorite,
        getDocVersions,
        checkoutPro,
        refreshBilling,
        refreshData,
        checkBackend,
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
      {toast && <div className="toast-notification glass" role="status">{toast}</div>}
      {loading && (
        <div className="toast-notification glass" style={{ bottom: 80 }} role="status">Loading…</div>
      )}
    </AppContext.Provider>
  );
};
