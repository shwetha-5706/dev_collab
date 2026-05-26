export type AuthState = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  currentWorkspaceId: string;
  sessionActive: boolean;
  rememberMe: boolean;
  needsWorkspaceSetup: boolean;
  pendingSignupEmail: string | null;
};

export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
};

export type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
};

export type Attachment = {
  id: string;
  name: string;
  url: string;
  size: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Owner' | 'Admin' | 'Member' | 'Viewer';
  bio: string;
  skills: string[];
  streak: number;
  badges?: string[];
  github?: string;
};

export type MemberPresence = {
  userId: string;
  userName?: string;
  status: 'Online' | 'Away' | 'Busy';
  activity?: string;
  viewingTask?: string;
  viewingTaskId?: string;
};

export type Workspace = {
  id: string;
  name: string;
  description: string;
  type: 'Public' | 'Private';
  icon: string;
  members: UserProfile[];
  settings: {
    allowInvites: boolean;
    collaborationScore: number;
  };
};

export type Project = {
  id: string;
  workspaceId: string;
  name: string;
  banner: string;
  deadline: string;
  stack: string[];
  priority: 'P0' | 'P1' | 'P2';
  owner: string;
  health: number;
  progress: number;
  visibility: 'Public' | 'Private';
  openTasks: number;
  riskLevel?: 'low' | 'medium' | 'high';
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'In Review' | 'Done';
  priority: 'P0' | 'P1' | 'P2';
  dueDate: string;
  labels: string[];
  assignees: UserProfile[];
  estimate: string;
  comments: CommentItem[];
  history: string[];
  subtasks?: Subtask[];
  checklist?: ChecklistItem[];
  attachments?: Attachment[];
};

export type CreateTaskInput = {
  title: string;
  projectId: string;
  status?: Task['status'];
  priority?: Task['priority'];
  dueDate?: string;
  description?: string;
  labels?: string[];
  estimate?: string;
};

export type CreateProjectInput = {
  name: string;
  deadline: string;
  stack: string[];
  priority: Project['priority'];
  visibility: Project['visibility'];
};

export type CreateSnippetInput = {
  title: string;
  language: string;
  code: string;
  tags?: string[];
};

export type CreateDocInput = {
  title: string;
  body: string;
  tags?: string[];
};

export type CommentItem = {
  id: string;
  author: string;
  text: string;
  time: string;
};

export type Snippet = {
  id: string;
  title: string;
  language: string;
  code: string;
  tags: string[];
  favorite: boolean;
  author: string;
  trending?: boolean;
  description?: string;
  workspaceId?: string;
  projectId?: string;
};

export type DocPage = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  updatedBy: string;
  updatedAt: string;
  shared?: boolean;
  aiSummary?: string;
  links?: string[];
  workspaceId?: string;
  projectId?: string;
};

export type DocVersion = {
  id: string;
  docId: string;
  title: string;
  body: string;
  updatedBy: string;
  updatedAt: string;
};

export type SubscriptionPlan = {
  plan: 'free' | 'pro';
  limits: { workspaces: number; projects: number; members: number; ai: boolean };
  usage?: { workspaces: number; projects: number; members: number };
};

export type Notification = {
  id: string;
  type: 'mention' | 'assignment' | 'deadline' | 'invite' | 'activity';
  text: string;
  projectId?: string;
  time: string;
  read: boolean;
  priority?: 'high' | 'medium' | 'low';
};

export type Activity = {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  project?: string;
  type?: 'task' | 'comment' | 'member' | 'wiki';
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: 'deadline' | 'sprint' | 'reminder';
  projectId?: string;
  riskScore?: number;
};

export type SearchResult = {
  id: string;
  type: 'task' | 'project' | 'doc' | 'snippet' | 'member';
  title: string;
  subtitle: string;
};

export type TaskFilter = 'today' | 'week' | 'month';

export type QuickActionType =
  | 'task'
  | 'project'
  | 'invite'
  | 'snippet'
  | 'document'
  | 'report';
