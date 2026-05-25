import { useContext, useMemo } from 'react';
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
  const { tasks, taskFilter, setTaskFilter } = ctx;

  const filtered = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => {
      const due = new Date(t.dueDate);
      if (taskFilter === 'today') {
        return due.toDateString() === now.toDateString();
      }
      if (taskFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return due >= weekAgo;
      }
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      return due >= monthAgo;
    });
  }, [tasks, taskFilter]);

  const total = filtered.length;
  const completed = filtered.filter((t) => t.status === 'Done').length;
  const pending = filtered.filter((t) => t.status !== 'Done').length;
  const overdue = filtered.filter((t) => t.status !== 'Done' && new Date(t.dueDate) < new Date()).length;

  const stats = [
    { label: 'Total tasks', value: total },
    { label: 'Completed', value: completed },
    { label: 'Pending', value: pending },
    { label: 'Overdue', value: overdue },
  ];

  return (
    <div className="glass card section">
      <div className="overline">Task Summary</div>
      <h2 style={{ margin: '8px 0 16px' }}>Workload at a glance</h2>

      <div className="filter-tabs">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`filter-tab ${taskFilter === f.key ? 'active' : ''}`}
            onClick={() => setTaskFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid-columns">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: 'rgba(93, 123, 255, 0.08)' }}>
        <strong>🤖 AI Analysis:</strong>{' '}
        {overdue > 0
          ? `${overdue} overdue task${overdue > 1 ? 's' : ''} — consider rebalancing workload across team members.`
          : 'Workload is balanced. Great momentum this sprint!'}
      </div>
    </div>
  );
};

export default TaskSummarySection;
