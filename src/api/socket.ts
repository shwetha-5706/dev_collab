import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './config';
import type { Activity, MemberPresence, Notification, Task } from '../types';

let socket: Socket | null = null;

export function connectSocket(
  workspaceId: string,
  userId: string,
  userName: string,
  handlers: {
    onRefresh: () => void;
    onTaskUpdated: (task: Task) => void;
    onTaskCreated?: (task: Task) => void;
    onActivityNew?: (activity: Activity) => void;
    onPresenceChanged?: (presence: MemberPresence[]) => void;
    onNotification?: (notification: Notification) => void;
    onLiveUpdate?: (message: string) => void;
  }
) {
  if (!socket) {
    socket = io(SOCKET_URL || undefined, { path: '/socket.io', transports: ['websocket', 'polling'] });
  }
  socket.emit('join', { workspaceId, userId, userName });
  socket.off('bootstrap:refresh');
  socket.off('task:updated');
  socket.off('task:created');
  socket.off('activity:new');
  socket.off('presence:changed');
  socket.on('bootstrap:refresh', handlers.onRefresh);
  socket.on('task:updated', (task) => {
    const t = task as Task;
    handlers.onTaskUpdated(t);
    if (handlers.onLiveUpdate && t.history?.length) {
      const last = t.history[t.history.length - 1];
      if (last.includes('Status changed') || last.includes('commented')) {
        handlers.onLiveUpdate(last);
      }
    }
  });
  socket.on('task:created', (task) => handlers.onTaskCreated?.(task as Task));
  socket.on('activity:new', (activity) => handlers.onActivityNew?.(activity as Activity));
  socket.on('presence:changed', (presence) => handlers.onPresenceChanged?.(presence as MemberPresence[]));
  if (handlers.onNotification) {
    socket.off(`notification:${userId}`);
    socket.on(`notification:${userId}`, (n) => handlers.onNotification?.(n as Notification));
  }
}

export function updatePresence(viewingTaskId?: string, viewingTaskTitle?: string, activity?: string) {
  socket?.emit('presence:update', {
    viewingTaskId,
    viewingTaskTitle,
    activity,
    status: 'Online',
  });
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
