import { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../../contexts/AppContext';
import type { TaskFilter } from '../../types';

const filters: { key: TaskFilter; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
];

const TaskSummarySection = () => {
  const ctx = useContext(AppContext);
  if (!ctx) return null;
  const { tasks, taskFilter, setTaskFilter, activeWorkspace, projects } = ctx;

  const workspaceProjectIds = useMemo(
    () => new Set(projects.filter((p) => p.workspaceId === activeWorkspace?.id).map((p) => p.id)),
    [projects, activeWorkspace?.id]
  );

  const filtered = useMemo(() => {
    const now = new Date();
    return tasks
      .filter((t) => workspaceProjectIds.has(t.projectId))
      .filter((t) => {
        const due = new Date(t.dueDate);
        if (taskFilter === 'today') return due.toDateString() === now.toDateString();
        if (taskFilter === 'week') {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return due >= weekAgo;
        }
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return due >= monthAgo;
      });
  }, [tasks, taskFilter, workspaceProjectIds]);

  const stats = [
    { label: 'Total', value: filtered.length },
    { label: 'Done', value: filtered.filter((t) => t.status === 'Done').length },
    { label: 'Pending', value: filtered.filter((t) => t.status !== 'Done').length },
    { label: 'Overdue', value: filtered.filter((t) => t.status !== 'Done' && new Date(t.dueDate) < new Date()).length },
  ];

  const recentTasks = filtered.slice(0, 6);

  return (
    <section className="dashboard-panel dashboard-panel-fill">
      <div className="dashboard-panel-head">
        <div>
          <p className="dashboard-eyebrow">Workload</p>
          <h2 className="dashboard-panel-title">Tasks</h2>
        </div>
        <div className="dashboard-segmented">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`dashboard-segment ${taskFilter === f.key ? 'active' : ''}`}
              onClick={() => setTaskFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-mini-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="dashboard-mini-stat">
            <span className="dashboard-mini-stat-value">{stat.value}</span>
            <span className="dashboard-mini-stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assignee</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {recentTasks.map((task) => (
              <tr key={task.id}>
                <td className="dashboard-table-primary">{task.title}</td>
                <td><span className="dashboard-tag">{task.status}</span></td>
                <td><span className={`dashboard-tag priority-${task.priority.toLowerCase()}`}>{task.priority}</span></td>
                <td>{task.assignees[0]?.name ?? '—'}</td>
                <td className="dashboard-table-muted">{task.dueDate}</td>
              </tr>
            ))}
            {recentTasks.length === 0 && (
              <tr>
                <td colSpan={5} className="dashboard-table-empty">No tasks in this period</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="dashboard-panel-foot">
        <Link to="/board" className="dashboard-text-link">Open full board →</Link>
      </div>
    </section>
  );
};

export default TaskSummarySection;
