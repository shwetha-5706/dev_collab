import { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { AppContext } from '../../contexts/AppContext';
import type { Task } from '../../types';

type Props = {
  task: Task | null;
  onClose: () => void;
};

const TaskDetailPanel = ({ task, onClose }: Props) => {
  const ctx = useContext(AppContext);
  const [comment, setComment] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  if (!ctx || !task) return null;

  const { addTaskComment, updateTask, memberPresence, auth } = ctx;
  const viewers = memberPresence.filter((p) => p.viewingTask === task.title).length + 1;

  const aiSummary = `This task "${task.title}" is ${task.status.toLowerCase()} with ${task.priority} priority. ${
    task.assignees.length
  } member(s) assigned. Estimated ${task.estimate}. ${
    task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== 'Done'
      ? '⚠️ Deadline risk detected.'
      : 'On schedule.'
  }`;

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addTaskComment(task.id, comment.trim());
    setComment('');
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!task.checklist) return;
    updateTask(task.id, {
      checklist: task.checklist.map((c) => (c.id === itemId ? { ...c, checked: !c.checked } : c)),
    });
  };

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div
            className="task-panel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="task-panel glass"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className="task-panel-header">
              <div>
                <div className="overline">Task Details</div>
                <h2 style={{ margin: '8px 0 0' }}>{task.title}</h2>
              </div>
              <button className="icon-button" onClick={onClose} aria-label="Close">
                <XMarkIcon width={20} />
              </button>
            </div>

            <div className="small-badge" style={{ marginTop: 12 }}>
              👁 {viewers} viewing live
            </div>

            <div className="task-panel-meta">
              <span className={`small-badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
              <span className="small-badge">{task.status}</span>
              {task.labels.map((l) => (
                <span key={l} className="small-badge">
                  {l}
                </span>
              ))}
            </div>

            <p style={{ opacity: 0.85, lineHeight: 1.6 }}>{task.description || 'No description yet.'}</p>

            <div className="task-panel-grid">
              <div>
                <div className="overline">Due date</div>
                <div>{task.dueDate}</div>
              </div>
              <div>
                <div className="overline">Estimate</div>
                <div>{task.estimate}</div>
              </div>
            </div>

            <div className="task-panel-section">
              <h3>Assigned</h3>
              <div className="avatar-group">
                {task.assignees.map((a) => (
                  <img key={a.id} src={a.avatar} alt={a.name} className="avatar-pill lg" title={a.name} />
                ))}
              </div>
            </div>

            {task.subtasks && task.subtasks.length > 0 && (
              <div className="task-panel-section">
                <h3>Subtasks</h3>
                {task.subtasks.map((s) => (
                  <label key={s.id} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: '0.9rem' }}>
                    <input type="checkbox" checked={s.completed} readOnly />
                    {s.title}
                  </label>
                ))}
              </div>
            )}

            {task.checklist && task.checklist.length > 0 && (
              <div className="task-panel-section">
                <h3>Checklist</h3>
                {task.checklist.map((c) => (
                  <label key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={c.checked} onChange={() => toggleChecklistItem(c.id)} />
                    {c.label}
                  </label>
                ))}
              </div>
            )}

            {task.attachments && task.attachments.length > 0 && (
              <div className="task-panel-section">
                <h3>Attachments</h3>
                {task.attachments.map((a) => (
                  <div key={a.id} className="comment-item" style={{ fontSize: '0.85rem' }}>
                    📎 {a.name} <span style={{ opacity: 0.6 }}>({a.size})</span>
                  </div>
                ))}
              </div>
            )}

            <div className="task-panel-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Comments</h3>
                <button className="glow-button secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => setShowSummary(!showSummary)}>
                  <SparklesIcon width={14} /> AI Summary
                </button>
              </div>
              {showSummary && (
                <div className="comment-item" style={{ marginBottom: 12, borderColor: 'rgba(148, 86, 255, 0.3)' }}>
                  {aiSummary}
                </div>
              )}
              <div className="comments-list">
                {task.comments.map((c) => (
                  <div key={c.id} className="comment-item">
                    <strong>{c.author}</strong>
                    <span style={{ opacity: 0.5, fontSize: '0.78rem', marginLeft: 8 }}>{c.time}</span>
                    <p style={{ margin: '6px 0 0' }}>{c.text}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleComment} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input
                  className="input-field"
                  placeholder={`Comment as ${auth.user?.name}…`}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button type="submit" className="glow-button" style={{ flexShrink: 0 }}>
                  Send
                </button>
              </form>
            </div>

            <div className="task-panel-section">
              <h3>Activity</h3>
              <ul className="activity-log">
                {task.history.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default TaskDetailPanel;
