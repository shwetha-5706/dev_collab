import { useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { AppContext } from '../../contexts/AppContext';
import UserAvatar from '../UserAvatar';
import { updatePresence } from '../../api/socket';
import { highlightMentions } from '../../utils/markdown';
import type { Task } from '../../types';

type Props = {
  task: Task | null;
  onClose: () => void;
};

const TaskDetailPanel = ({ task, onClose }: Props) => {
  const ctx = useContext(AppContext);
  const [comment, setComment] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [labelsInput, setLabelsInput] = useState('');
  const [aiInsight, setAiInsight] = useState('');
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const [commentSummary, setCommentSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (task) {
      updatePresence(task.id, task.title, `Viewing "${task.title}"`);
    } else {
      updatePresence(undefined, undefined, 'Browsing workspace');
    }
    return () => { updatePresence(undefined, undefined, 'Browsing workspace'); };
  }, [task?.id, task?.title]);

  useEffect(() => {
    if (task) setLabelsInput(task.labels.join(', '));
  }, [task?.id, task?.labels]);

  useEffect(() => {
    if (!task || !ctx?.backendOnline) {
      setAiInsight('');
      return;
    }
    let cancelled = false;
    setAiInsightLoading(true);
    ctx.getTaskInsight(task.id)
      .then(({ insight }) => {
        if (!cancelled) setAiInsight(insight);
      })
      .catch(() => {
        if (!cancelled) setAiInsight('');
      })
      .finally(() => {
        if (!cancelled) setAiInsightLoading(false);
      });
    return () => { cancelled = true; };
  }, [task?.id, ctx?.backendOnline, ctx?.getTaskInsight]);

  useEffect(() => {
    setShowSummary(false);
    setCommentSummary('');
  }, [task?.id]);

  if (!ctx || !task) return null;

  const { addTaskComment, updateTask, memberPresence, auth, activeWorkspace, generateTaskSubtasks, summarizeTaskComments } = ctx;
  const viewers = memberPresence.filter(
    (p) => p.viewingTaskId === task.id && p.userId !== auth.user?.id
  );
  const viewerNames = viewers.map(
    (p) => p.userName ?? activeWorkspace?.members.find((m) => m.id === p.userId)?.name
  ).filter(Boolean) as string[];

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addTaskComment(task.id, comment.trim());
    setComment('');
  };

  const loadCommentSummary = async () => {
    if (showSummary) {
      setShowSummary(false);
      return;
    }
    setSummaryLoading(true);
    try {
      const { summary } = await summarizeTaskComments(task.id);
      setCommentSummary(summary);
      setShowSummary(true);
    } finally {
      setSummaryLoading(false);
    }
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!task.checklist) return;
    updateTask(task.id, {
      checklist: task.checklist.map((c) => (c.id === itemId ? { ...c, checked: !c.checked } : c)),
    });
  };

  const saveLabels = () => {
    const labels = labelsInput.split(',').map((l) => l.trim()).filter(Boolean);
    updateTask(task.id, { labels });
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

            <div className={`live-viewing-banner ${viewerNames.length ? 'active' : ''}`}>
              {viewerNames.length > 0 ? (
                <>
                  <div className="avatar-group">
                    {viewers.slice(0, 3).map((p) => (
                      <UserAvatar
                        key={p.userId}
                        name={p.userName ?? 'User'}
                        size="xs"
                        title={p.userName}
                      />
                    ))}
                  </div>
                  <span>
                    {viewerNames.length === 1
                      ? `${viewerNames[0]} is viewing this task`
                      : `${viewerNames.join(', ')} are viewing this task`}
                  </span>
                </>
              ) : (
                <span className="text-muted">Only you are viewing this task</span>
              )}
            </div>

            {(aiInsightLoading || aiInsight) && (
              <div className="task-ai-insight">
                <SparklesIcon width={16} />
                <p>{aiInsightLoading ? 'Analyzing task…' : aiInsight}</p>
              </div>
            )}

            <div className="task-panel-meta">
              <span className={`small-badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
              <span className="small-badge">{task.status}</span>
              {task.labels.map((l) => (
                <span key={l} className="small-badge">{l}</span>
              ))}
            </div>

            <p style={{ opacity: 0.85, lineHeight: 1.6 }}>{task.description || 'No description yet.'}</p>

            <div className="task-panel-grid">
              <div>
                <div className="overline">Due date</div>
                <input
                  type="date"
                  className="input-field"
                  value={task.dueDate}
                  onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                />
              </div>
              <div>
                <div className="overline">Estimate</div>
                <div>{task.estimate}</div>
              </div>
            </div>

            <div className="task-panel-section">
              <div className="overline">Labels</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  className="input-field"
                  placeholder="bug, frontend, urgent"
                  value={labelsInput}
                  onChange={(e) => setLabelsInput(e.target.value)}
                />
                <button className="glow-button secondary" style={{ flexShrink: 0, padding: '8px 12px' }} onClick={saveLabels}>
                  Save
                </button>
              </div>
            </div>

            <div className="task-panel-section">
              <h3>Assigned</h3>
              <div className="avatar-group" style={{ marginBottom: 10 }}>
                {task.assignees.map((a) => (
                  <UserAvatar key={a.id} name={a.name} size="lg" title={a.name} />
                ))}
              </div>
              <select
                className="input-field"
                value={task.assignees[0]?.id ?? ''}
                onChange={(e) => {
                  const member = activeWorkspace?.members.find((m) => m.id === e.target.value);
                  if (member) updateTask(task.id, { assigneeIds: [member.id] });
                }}
              >
                {activeWorkspace?.members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <button
                className="glow-button secondary"
                style={{ marginTop: 10, padding: '8px 12px', fontSize: '0.82rem', width: '100%' }}
                onClick={() => generateTaskSubtasks(task.id)}
              >
                <SparklesIcon width={14} /> Generate AI subtasks
              </button>
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
                    {a.name} <span style={{ opacity: 0.6 }}>({a.size})</span>
                  </div>
                ))}
              </div>
            )}

            <div className="task-panel-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Comments</h3>
                <button
                  type="button"
                  className="glow-button secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  onClick={loadCommentSummary}
                  disabled={summaryLoading}
                >
                  <SparklesIcon width={14} /> {summaryLoading ? 'Summarizing…' : showSummary ? 'Hide summary' : 'AI Summary'}
                </button>
              </div>
              {showSummary && commentSummary && (
                <div className="comment-item task-ai-comment-summary">
                  {commentSummary}
                </div>
              )}
              <div className="comments-list">
                {task.comments.map((c) => (
                  <div key={c.id} className="comment-item">
                    <strong>{c.author}</strong>
                    <span style={{ opacity: 0.5, fontSize: '0.78rem', marginLeft: 8 }}>{c.time}</span>
                    <p style={{ margin: '6px 0 0' }} dangerouslySetInnerHTML={{ __html: highlightMentions(c.text) }} />
                  </div>
                ))}
              </div>
              <form onSubmit={handleComment} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input
                  className="input-field"
                  placeholder={`Comment as ${auth.user?.name}… use @Name to mention`}
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
