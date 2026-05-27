/**
 * Mock Authentication System for Development/Demo Mode
 * 
 * This module provides a temporary authentication system that:
 * - Accepts ANY email/password combination
 * - Creates mock user objects
 * - Generates mock bootstrap data (workspaces, projects, tasks, etc.)
 * - Stores session in localStorage
 * 
 * This is TEMPORARY and should be replaced with real authentication later.
 */

import type { 
  UserProfile, 
  Workspace, 
  Project, 
  Task, 
  Snippet, 
  DocPage,
  Notification,
  Activity,
  CalendarEvent,
} from '../types';

// Bootstrap Payload type (mirrors the one in client.ts)
type BootstrapPayload = {
  user: UserProfile | null;
  workspaceId: string;
  workspaces: Workspace[];
  projects: Project[];
  tasks: Task[];
  snippets: Snippet[];
  docs: DocPage[];
  notifications: Notification[];
  activities: Activity[];
  memberPresence: { userId: string; userName?: string; status: 'Online' | 'Away' | 'Busy'; activity?: string }[];
  calendarEvents: CalendarEvent[];
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
};

// ─── Mock User Generator ────────────────────────────────────────────────────

export function generateMockUser(email: string, name?: string): UserProfile {
  const username = name?.trim() || email.split('@')[0];
  const userId = `user-${btoa(email).substring(0, 12)}`;
  
  return {
    id: userId,
    name: username,
    email,
    avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
    role: 'Owner', // Full access in dev mode
    bio: 'Development user - temporary mock auth',
    skills: ['React', 'TypeScript', 'Node.js'],
    streak: 0,
    badges: ['Early Adopter'],
  };
}

// ─── Mock Token Generator ───────────────────────────────────────────────────

export function generateMockToken(email: string): string {
  // Fake JWT: header.payload.signature format
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    email, 
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
  }));
  const signature = btoa(`devcollab-mock-secret-${email}`);
  return `${header}.${payload}.${signature}`;
}

// ─── Mock Workspace Generator ───────────────────────────────────────────────

function generateMockWorkspace(userId: string): Workspace {
  return {
    id: 'ws-demo-001',
    name: 'My Workspace',
    description: 'Development workspace',
    type: 'Private',
    icon: '🚀',
    members: [],
    settings: {
      allowInvites: true,
      collaborationScore: 85,
    },
  };
}

// ─── Mock Projects Generator ────────────────────────────────────────────────

function generateMockProjects(workspaceId: string): Project[] {
  return [
    {
      id: 'proj-001',
      workspaceId,
      name: 'Frontend Dashboard',
      banner: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      deadline: '2026-06-30',
      stack: ['React', 'TypeScript', 'Vite'],
      priority: 'P0',
      owner: 'Demo Owner',
      health: 85,
      progress: 65,
      visibility: 'Private',
      openTasks: 12,
      riskLevel: 'low',
    },
    {
      id: 'proj-002',
      workspaceId,
      name: 'Backend API',
      banner: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      deadline: '2026-07-15',
      stack: ['Node.js', 'Express', 'PostgreSQL'],
      priority: 'P0',
      owner: 'Demo Owner',
      health: 72,
      progress: 45,
      visibility: 'Private',
      openTasks: 18,
      riskLevel: 'medium',
    },
    {
      id: 'proj-003',
      workspaceId,
      name: 'Mobile App',
      banner: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      deadline: '2026-08-30',
      stack: ['React Native', 'TypeScript'],
      priority: 'P1',
      owner: 'Demo Owner',
      health: 60,
      progress: 30,
      visibility: 'Private',
      openTasks: 24,
      riskLevel: 'high',
    },
  ];
}

// ─── Mock Tasks Generator ───────────────────────────────────────────────────

function generateMockTasks(projectIds: string[]): Task[] {
  return [
    {
      id: 'task-001',
      projectId: projectIds[0],
      title: 'Implement authentication UI',
      description: 'Design and build login/signup forms with proper validation',
      status: 'In Progress',
      priority: 'P0',
      dueDate: '2026-06-05',
      labels: ['UI', 'Auth', 'Frontend'],
      assignees: [],
      estimate: '8h',
      comments: [],
      history: [],
    },
    {
      id: 'task-002',
      projectId: projectIds[0],
      title: 'Add dark mode toggle',
      description: 'Implement theme switching with persistent storage',
      status: 'To Do',
      priority: 'P1',
      dueDate: '2026-06-20',
      labels: ['UI', 'Frontend'],
      assignees: [],
      estimate: '4h',
      comments: [],
      history: [],
    },
    {
      id: 'task-003',
      projectId: projectIds[1],
      title: 'Setup database schema',
      description: 'Design and create PostgreSQL tables for core entities',
      status: 'Done',
      priority: 'P0',
      dueDate: '2026-05-20',
      labels: ['Backend', 'Database'],
      assignees: [],
      estimate: '12h',
      comments: [],
      history: ['Completed by Demo Owner'],
    },
    {
      id: 'task-004',
      projectId: projectIds[1],
      title: 'Create API endpoints',
      description: 'Build REST endpoints for projects, tasks, and user management',
      status: 'In Progress',
      priority: 'P0',
      dueDate: '2026-06-15',
      labels: ['Backend', 'API'],
      assignees: [],
      estimate: '16h',
      comments: [],
      history: [],
    },
    {
      id: 'task-005',
      projectId: projectIds[2],
      title: 'Design mobile UI mockups',
      description: 'Create wireframes and high-fidelity designs in Figma',
      status: 'To Do',
      priority: 'P1',
      dueDate: '2026-06-30',
      labels: ['Design', 'Mobile'],
      assignees: [],
      estimate: '20h',
      comments: [],
      history: [],
    },
  ];
}

// ─── Mock Snippets Generator ────────────────────────────────────────────────

function generateMockSnippets(): Snippet[] {
  return [
    {
      id: 'snip-001',
      title: 'React Hook - useLocalStorage',
      language: 'TypeScript',
      code: `export const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = React.useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  
  const setStoredValue = (value) => {
    try {
      setValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(e);
    }
  };
  
  return [value, setStoredValue];
};`,
      tags: ['react', 'hook', 'typescript'],
      favorite: true,
      author: 'You',
    },
    {
      id: 'snip-002',
      title: 'CSS Glassmorphism Card',
      language: 'CSS',
      code: `.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 24px;
}`,
      tags: ['css', 'design', 'ui'],
      favorite: false,
      author: 'You',
    },
  ];
}

// ─── Mock Docs Generator ────────────────────────────────────────────────────

function generateMockDocs(): DocPage[] {
  return [
    {
      id: 'doc-001',
      title: 'Getting Started',
      slug: 'getting-started',
      content: '# Getting Started\n\nWelcome to DevCollab! This is your first documentation page.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'You',
      starred: true,
    },
    {
      id: 'doc-002',
      title: 'Project Guidelines',
      slug: 'project-guidelines',
      content: '# Project Guidelines\n\nFollow these guidelines for all projects.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'You',
      starred: false,
    },
  ];
}

// ─── Main Mock Bootstrap Generator ──────────────────────────────────────────

export function generateMockBootstrapData(user: UserProfile, workspaceId?: string): BootstrapPayload {
  const workspace = generateMockWorkspace(user.id);
  const projects = generateMockProjects(workspace.id);
  const tasks = generateMockTasks(projects.map((p) => p.id));
  const snippets = generateMockSnippets();
  const docs = generateMockDocs();

  return {
    user,
    workspaceId: workspaceId || workspace.id,
    workspaces: [workspace],
    projects,
    tasks,
    snippets,
    docs,
    notifications: [
      {
        id: 'notif-001',
        type: 'assignment',
        text: 'You have been assigned a new task',
        read: false,
        time: 'just now',
        priority: 'medium',
      },
    ],
    activities: [
      {
        id: 'act-001',
        user: user.name,
        message: `${user.name} created a new task`,
        timestamp: new Date().toISOString(),
        type: 'task',
      },
    ],
    memberPresence: [
      {
        userId: user.id,
        userName: user.name,
        status: 'Online',
        activity: 'Working on tasks',
      },
    ],
    calendarEvents: [
      {
        id: 'event-001',
        title: 'Sprint Planning',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'sprint',
      },
      {
        id: 'event-002',
        title: 'Team Standup',
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'reminder',
      },
    ],
    analyticsData: {
      daily: [45, 52, 48, 61, 55, 67, 72],
      weekly: [320, 385, 410, 520],
      monthly: [2800, 3200, 3100],
      teamPerformance: [
        { name: user.name, completed: 12, assigned: 18 },
        { name: 'Team Member 1', completed: 8, assigned: 15 },
        { name: 'Team Member 2', completed: 10, assigned: 12 },
      ],
      collaborationScore: 85,
      burnoutIndex: 25,
      sprintHealth: 82,
    },
    aiInsights: {
      blockedTasks: 2,
      sprintHealth: 75,
      burnoutRisk: 'low',
      teamMood: 'focused',
      predictions: [
        'Completion on track for Q2',
        'Risk: Mobile app backend integration',
      ],
      recommendations: [
        'Consider distributing tasks more evenly',
        'Schedule buffer time for code reviews',
      ],
    },
  };
}

// ─── Dev Mode Mock Auth Response ────────────────────────────────────────────

export interface MockLoginResponse {
  token: string;
  user: UserProfile;
  workspaceId: string;
  needsWorkspaceSetup: false;
}

export function mockLogin(email: string, password: string): MockLoginResponse {
  const user = generateMockUser(email);
  const token = generateMockToken(email);
  const bootstrap = generateMockBootstrapData(user);

  return {
    token,
    user,
    workspaceId: bootstrap.workspaceId,
    needsWorkspaceSetup: false,
  };
}

export function mockSignUp(email: string, password: string, name?: string): MockLoginResponse {
  const user = generateMockUser(email, name);
  const token = generateMockToken(email);
  const bootstrap = generateMockBootstrapData(user);

  return {
    token,
    user,
    workspaceId: bootstrap.workspaceId,
    needsWorkspaceSetup: false,
  };
}

export function mockSocialLogin(provider: string, email: string): MockLoginResponse {
  const user = generateMockUser(email);
  const token = generateMockToken(email);
  const bootstrap = generateMockBootstrapData(user);

  return {
    token,
    user,
    workspaceId: bootstrap.workspaceId,
    needsWorkspaceSetup: false,
  };
}
