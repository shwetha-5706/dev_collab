import { useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SparklesIcon, ExclamationTriangleIcon, ViewColumnsIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { AppContext } from '../contexts/AppContext';
import UserAvatar from '../components/UserAvatar';
import LivePresenceBar from '../components/kanban/LivePresenceBar';
import TaskDetailPanel from '../components/kanban/TaskDetailPanel';
import type { Task } from '../types';

const columns: Task['status'][] = ['To Do', 'In Progress', 'In Review', 'Done'];

const KanbanBoard = () => {
  const ctx = useContext(AppContext);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTo, setAddingTo] = useState<Task['status'] | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  if (!ctx) return null;

  const { tasks, projects, activeWorkspace, memberPresence, updateTaskStatus, createTask, showToast, balanceWorkload, generateTaskSubtasks, auth } = ctx;

  const workspaceProjects = useMemo(
    () => projects.filter((p) => p.workspaceId === activeWorkspace?.id),
    [projects, activeWorkspace]
  );

  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          workspaceProjects.some((p) => p.id === t.projectId) &&
          (projectFilter === 'all' || t.projectId === projectFilter)
      ),
    [tasks, workspaceProjects, projectFilter]
  );

  const workloadByUser = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTasks
      .filter((t) => t.status !== 'Done')
      .forEach((t) => {
        t.assignees.forEach((a) => {
          counts[a.name] = (counts[a.name] ?? 0) + 1;
        });
      });
    return counts;
  }, [filteredTasks]);

  const overloaded = Object.entries(workloadByUser).filter(([, c]) => c >= 4);

  const handleDrop = (status: Task['status']) => {
    if (draggingId) {
      updateTaskStatus(draggingId, status);
      setDraggingId(null);
    }
  };

  const handleAddTask = async (status: Task['status']) => {
    if (!newTaskTitle.trim()) return;
    const projectId = projectFilter !== 'all' ? projectFilter : workspaceProjects[0]?.id;
    if (!projectId) {
      showToast('Create a project first, then add tasks');
      return;
    }
    try {
      await createTask({ title: newTaskTitle.trim(), projectId, status });
      setNewTaskTitle('');
      setAddingTo(null);
      showToast('Task created');
    } catch {
      showToast('Failed to create task');
    }
  };

  const generateSubtasks = async (task: Task) => {
    await generateTaskSubtasks(task.id);
  };

  const liveSelectedTask = selectedTask
    ? tasks.find((t) => t.id === selectedTask.id) ?? selectedTask
    : null;

  const taskViewers = (taskId: string) =>
    memberPresence.filter((p) => p.viewingTaskId === taskId && p.userId !== auth.user?.id);

  return (
    <div>
      <div className="page-header glass section" style={{ padding: 24, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="overline">Advanced Kanban</div>
            <h1 style={{ margin: '8px 0' }}>Task Board</h1>
            <p className="page-lead">Drag tasks between columns — live sync across your team</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className={`filter-tab ${viewMode === 'board' ? 'active' : ''}`} onClick={() => setViewMode('board')} title="Board view">
                <ViewColumnsIcon width={16} />
              </button>
              <button className={`filter-tab ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="List view">
                <ListBulletIcon width={16} />
              </button>
            </div>
            <select className="input-field" style={{ width: 'auto', minWidth: 180 }} value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
              <option value="all">All projects</option>
              {workspaceProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button className="glow-button secondary" onClick={() => balanceWorkload()}>
              <SparklesIcon width={18} /> Balance workload
            </button>
          </div>
        </div>

        {overloaded.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="burnout-alert"
            style={{ marginTop: 16 }}
          >
            <ExclamationTriangleIcon width={18} />
            Burnout risk: {overloaded.map(([n]) => n).join(', ')} have 4+ active tasks
          </motion.div>
        )}
      </div>

      <LivePresenceBar />

      {workspaceProjects.length === 0 ? (
        <div className="glass card section" style={{ textAlign: 'center', padding: 48 }}>
          <h2 style={{ margin: '0 0 8px' }}>No projects to work on</h2>
          <p className="page-lead" style={{ marginBottom: 20 }}>
            Create a project first, then add and manage tasks on this board.
          </p>
          <Link to="/projects" className="glow-button">Create a project</Link>
        </div>
      ) : viewMode === 'list' ? (
        <div className="glass card section">
          <table className="task-list-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: '0.78rem', opacity: 0.7 }}>
                <th style={{ padding: '10px 12px' }}>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due</th>
                <th>Labels</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className="task-list-row"
                  onClick={() => setSelectedTask(task)}
                  style={{ cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <td style={{ padding: '12px', fontWeight: 600 }}>{task.title}</td>
                  <td><span className="small-badge">{task.status}</span></td>
                  <td><span className={`small-badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span></td>
                  <td>{task.assignees.map((a) => a.name).join(', ') || '—'}</td>
                  <td>{task.dueDate}</td>
                  <td>{task.labels.map((l) => <span key={l} className="small-badge" style={{ marginRight: 4 }}>{l}</span>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTasks.length === 0 && <p className="empty-state">No tasks found</p>}
        </div>
      ) : (
      <div className="kanban-board">
        {columns.map((status) => {
          const columnTasks = filteredTasks.filter((t) => t.status === status);
          return (
            <div
              key={status}
              className="kanban-column kanban-column-full"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(status)}
            >
              <div className="kanban-column-header">
                <span>{status}</span>
                <span className="small-badge">{columnTasks.length}</span>
              </div>

              {columnTasks.map((task) => {
                const isOverdue = task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== 'Done';
                const viewers = taskViewers(task.id);
                return (
                  <motion.div
                    key={task.id}
                    layout
                    className={`kanban-card kanban-card-full ${draggingId === task.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={() => setDraggingId(task.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onClick={() => setSelectedTask(task)}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{task.title}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className={`small-badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                      {isOverdue && <span className="small-badge badge-danger">Overdue</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
                      <div className="avatar-group">
                        {task.assignees.slice(0, 3).map((a) => (
                          <UserAvatar key={a.id} name={a.name} size="xs" title={a.name} />
                        ))}
                        {viewers.map((p) => (
                          <UserAvatar
                            key={`view-${p.userId}`}
                            name={p.userName ?? 'User'}
                            size="xs"
                            title={`${p.userName ?? 'Teammate'} is viewing`}
                          />
                        ))}
                      </div>
                      <button
                        className="kanban-ai-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          generateSubtasks(task);
                        }}
                        title="AI subtasks"
                      >
                        <SparklesIcon width={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}

              {addingTo === status ? (
                <div style={{ marginTop: 8 }}>
                  <input
                    className="input-field"
                    placeholder="Task title…"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask(status)}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <button className="glow-button" style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }} onClick={() => handleAddTask(status)}>
                      Add
                    </button>
                    <button className="glow-button secondary" style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }} onClick={() => setAddingTo(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button className="kanban-add-btn" onClick={() => setAddingTo(status)}>
                  + Add task
                </button>
              )}
            </div>
          );
        })}
      </div>
      )}

      <TaskDetailPanel task={liveSelectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
};

export default KanbanBoard;
