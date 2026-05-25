import { useContext, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';
import type { Task } from '../../types';

const columns: Task['status'][] = ['To Do', 'In Progress', 'In Review', 'Done'];

const KanbanPreview = () => {
  const ctx = useContext(AppContext);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  if (!ctx) return null;
  const { tasks, updateTaskStatus } = ctx;

  const handleDrop = (status: Task['status']) => {
    if (draggingId) {
      updateTaskStatus(draggingId, status);
      setDraggingId(null);
    }
  };

  return (
    <div className="glass card section">
      <div className="overline">Kanban Preview</div>
      <h2 style={{ margin: '8px 0 16px' }}>Live task board</h2>
      <div className="kanban-preview">
        {columns.map((status) => {
          const columnTasks = tasks.filter((t) => t.status === status).slice(0, 3);
          return (
            <div
              key={status}
              className="kanban-column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(status)}
            >
              <div className="kanban-column-header">
                <span>{status}</span>
                <span className="small-badge">{columnTasks.length}</span>
              </div>
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  className={`kanban-card ${draggingId === task.id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => setDraggingId(task.id)}
                  onDragEnd={() => setDraggingId(null)}
                >
                  {task.title}
                  <div style={{ fontSize: '0.72rem', opacity: 0.6, marginTop: 4 }}>{task.priority}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: 12 }}>Drag tasks between columns — changes sync in real-time</p>
    </div>
  );
};

export default KanbanPreview;
