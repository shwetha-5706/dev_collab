import { apiUrl } from './config';

const TOKEN_KEY = 'devcollab_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? 'Request failed', res.status);
  return data as T;
}

export const api = {
  health: () => request<{ ok: boolean }>('/health'),

  login: (email: string, password: string) =>
    request<{ token: string; user: unknown; workspaceId: string; needsWorkspaceSetup?: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (email: string, password: string, name?: string) =>
    request<{ token: string; user: unknown; needsWorkspaceSetup: boolean; workspaceId?: string; alreadyRegistered?: boolean }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  verifyOtp: (email: string, otp: string) =>
    request<{ token: string; user: unknown; needsWorkspaceSetup: boolean }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  socialLogin: (provider: string, email: string) =>
    request<{ token: string; user: unknown; workspaceId: string }>('/auth/social-login', {
      method: 'POST',
      body: JSON.stringify({ provider, email }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  bootstrap: (workspaceId?: string) =>
    request<BootstrapPayload>(`/bootstrap${workspaceId ? `?workspaceId=${workspaceId}` : ''}`),

  createWorkspace: (name: string, description: string, type: string) =>
    request<BootstrapPayload>('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name, description, type }),
    }),

  updateWorkspace: (id: string, data: Record<string, unknown>) =>
    request<BootstrapPayload>(`/workspaces/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  inviteMember: (workspaceId: string, email: string, role: string) =>
    request<{ ok: boolean; inviteLink?: string; demoPassword?: string }>(`/workspaces/${workspaceId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),

  acceptInvite: (token: string) =>
    request<{ ok: boolean; workspaceId: string }>(`/invites/${token}/accept`, { method: 'POST', body: '{}' }),

  createProject: (data: Record<string, unknown>) =>
    request<unknown>('/projects', { method: 'POST', body: JSON.stringify(data) }),

  updateProject: (id: string, data: Record<string, unknown>) =>
    request<unknown>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteProject: (id: string) => request<{ ok: boolean }>(`/projects/${id}`, { method: 'DELETE' }),

  createTask: (data: Record<string, unknown>) =>
    request<unknown>('/tasks', { method: 'POST', body: JSON.stringify(data) }),

  updateTask: (id: string, data: Record<string, unknown>) =>
    request<unknown>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteTask: (id: string) => request<{ ok: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),

  addComment: (taskId: string, text: string) =>
    request<unknown>(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),

  generateSubtasks: (taskId: string) =>
    request<unknown>(`/tasks/${taskId}/subtasks/generate`, { method: 'POST', body: JSON.stringify({}) }),

  balanceWorkload: (workspaceId: string) =>
    request<BootstrapPayload>('/tasks/balance-workload', {
      method: 'POST',
      body: JSON.stringify({ workspaceId }),
    }),

  createSnippet: (data: Record<string, unknown>) =>
    request<unknown>('/snippets', { method: 'POST', body: JSON.stringify(data) }),

  updateSnippet: (id: string, data: Record<string, unknown>) =>
    request<unknown>(`/snippets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteSnippet: (id: string) => request<{ ok: boolean }>(`/snippets/${id}`, { method: 'DELETE' }),

  toggleSnippetFavorite: (id: string) =>
    request<{ favorite: boolean }>(`/snippets/${id}/favorite`, { method: 'PATCH', body: '{}' }),

  createDoc: (data: Record<string, unknown>) =>
    request<unknown>('/docs', { method: 'POST', body: JSON.stringify(data) }),

  updateDoc: (id: string, data: Record<string, unknown>) =>
    request<unknown>(`/docs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  getDocVersions: (id: string) =>
    request<{ versions: import('../types').DocVersion[] }>(`/docs/${id}/versions`),

  markNotificationRead: (id: string) =>
    request<{ ok: boolean }>(`/notifications/${id}/read`, { method: 'PATCH', body: '{}' }),

  markAllNotificationsRead: () =>
    request<{ ok: boolean }>('/notifications/read-all', { method: 'PATCH', body: '{}' }),

  updateProfile: (data: Record<string, unknown>) =>
    request<unknown>('/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  getAIStatus: () =>
    request<{ configured: boolean; model: string; provider: 'openai' | 'local' }>('/ai/status'),

  generateStandup: (workspaceId: string) =>
    request<{ report: string; provider: 'openai' | 'local' }>('/ai/standup', {
      method: 'POST',
      body: JSON.stringify({ workspaceId }),
    }),

  getTaskInsight: (taskId: string) =>
    request<{ insight: string; provider: 'openai' | 'local' }>('/ai/task-insight', {
      method: 'POST',
      body: JSON.stringify({ taskId }),
    }),

  summarizeTaskComments: (taskId: string) =>
    request<{ summary: string; provider: 'openai' | 'local' }>('/ai/summarize-comments', {
      method: 'POST',
      body: JSON.stringify({ taskId }),
    }),

  getCollaborationInsight: (workspaceId: string) =>
    request<{ insight: string; provider: 'openai' | 'local' }>('/ai/collaboration-insight', {
      method: 'POST',
      body: JSON.stringify({ workspaceId }),
    }),

  getActivityDigest: (workspaceId: string) =>
    request<{ digest: string; provider: 'openai' | 'local' }>('/ai/activity-digest', {
      method: 'POST',
      body: JSON.stringify({ workspaceId }),
    }),

  summarizeProject: (workspaceId: string) =>
    request<{ summary: string }>('/ai/summarize', { method: 'POST', body: JSON.stringify({ workspaceId }) }),

  getBlockers: (workspaceId: string) =>
    request<{ report: string; blockers: number }>('/ai/blockers', { method: 'POST', body: JSON.stringify({ workspaceId }) }),

  generateTaskBreakdown: (description: string, projectId: string, workspaceId: string) =>
    request<{ tasks: unknown[]; count: number }>('/ai/task-breakdown', {
      method: 'POST',
      body: JSON.stringify({ description, projectId, workspaceId }),
    }),

  codeReview: (code: string, language: string) =>
    request<unknown>('/ai/code-review', { method: 'POST', body: JSON.stringify({ code, language }) }),

  getBillingPlan: () => request<import('../types').SubscriptionPlan & { usage: { workspaces: number; projects: number; members: number } }>('/billing/plan'),

  checkoutPro: () =>
    request<{ ok: boolean; message: string; plan: string; sandbox: boolean; receiptId: string }>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan: 'pro' }),
    }),
};

export type BootstrapPayload = {
  user: import('../types').UserProfile | null;
  workspaceId: string;
  workspaces: import('../types').Workspace[];
  projects: import('../types').Project[];
  tasks: import('../types').Task[];
  snippets: import('../types').Snippet[];
  docs: import('../types').DocPage[];
  notifications: import('../types').Notification[];
  activities: import('../types').Activity[];
  memberPresence: import('../types').MemberPresence[];
  calendarEvents: import('../types').CalendarEvent[];
  analyticsData: {
    daily: number[];
    weekly: number[];
    monthly: number[];
    teamPerformance: { name: string; completed: number; assigned: number }[];
    collaborationScore: number;
    burnoutIndex: number;
    sprintHealth?: number;
  };
  aiInsights: {
    blockedTasks: number;
    sprintHealth: number;
    burnoutRisk: string;
    teamMood: string;
    predictions: string[];
    recommendations: string[];
  };
  subscription?: import('../types').SubscriptionPlan;
};

export { ApiError };
