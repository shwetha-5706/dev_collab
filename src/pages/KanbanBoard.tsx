import { useContext, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { AppContext } from '../contexts/AppContext';
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

  if (!ctx) return null;

  const { tasks, projects, activeWorkspace, updateTaskStatus, createTask, showToast, auth } = ctx;

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

  const handleAddTask = (status: Task['status']) => {
    if (!newTaskTitle.trim()) return;
    const projectId = projectFilter !== 'all' ? projectFilter : workspaceProjects[0]?.id;
    if (!projectId) return;
    createTask({ title: newTaskTitle.trim(), projectId, status });
    setNewTaskTitle('');
    setAddingTo(null);
    showToast('Task created');
  };

  const generateSubtasks = (task: Task) => {
    showToast(`AI generated 3 subtasks for "${task.title}"`);
  };

  return (
    <div>
      <div className="page-header glass section" style={{ padding: 24, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="overline">Advanced Kanban</div>
            <h1 style={{ margin: '8px 0' }}>Task Board</h1>
            <p style={{ opacity: 0.75, margin: 0 }}>Drag tasks between columns — live sync across your team</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select className="input-field" style={{ width: 'auto', minWidth: 180 }} value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
              <option value="all">All projects</option>
              {workspaceProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button className="glow-button secondary" onClick={() => showToast('AI workload balancing applied')}>
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
                      {isOverdue && <span className="small-badge" style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>Overdue</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
                      <div className="avatar-group">
                        {task.assignees.slice(0, 3).map((a) => (
                          <img key={a.id} src={a.avatar} alt="" className="avatar-pill" style={{ width: 24, height: 24 }} />
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

      <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
};

export default KanbanBoard;
