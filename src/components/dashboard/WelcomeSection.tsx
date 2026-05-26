import { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../../contexts/AppContext';

const WelcomeSection = () => {
  const ctx = useContext(AppContext);
  if (!ctx) return null;

  const { auth, tasks, projects, activeWorkspace } = ctx;

  const stats = useMemo(() => {
    const open = tasks.filter((t) => t.status !== 'Done').length;
    const done = tasks.filter((t) => t.status === 'Done').length;
    const overdue = tasks.filter(
      (t) => t.status !== 'Done' && t.dueDate < new Date().toISOString().slice(0, 10)
    ).length;
    const projectCount = projects.filter((p) => p.workspaceId === activeWorkspace?.id).length;

    return [
      { label: 'Open tasks', value: open, tone: 'neutral' },
      { label: 'Completed', value: done, tone: 'success' },
      { label: 'Overdue', value: overdue, tone: overdue > 0 ? 'danger' : 'neutral' },
      { label: 'Projects', value: projectCount, tone: 'neutral' },
    ];
  }, [tasks, projects, activeWorkspace?.id]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <section className="dashboard-panel dashboard-panel-hero">
      <div className="dashboard-panel-head">
        <div>
          <p className="dashboard-eyebrow">Dashboard</p>
          <h1 className="dashboard-title">{greeting}, {auth.user?.name}</h1>
          <p className="dashboard-subtitle">{activeWorkspace?.name}</p>
        </div>
        <div className="dashboard-header-actions">
          <Link to="/board" className="dashboard-btn dashboard-btn-outline">Open tasks</Link>
          <Link to="/projects" className="dashboard-btn dashboard-btn-outline">View projects</Link>
        </div>
      </div>

      <div className="dashboard-kpi-grid">
        {stats.map((s) => (
          <div key={s.label} className={`dashboard-kpi dashboard-kpi-${s.tone}`}>
            <span className="dashboard-kpi-value">{s.value}</span>
            <span className="dashboard-kpi-label">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WelcomeSection;
