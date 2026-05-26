import { useContext, useMemo, useState } from 'react';
import { AppContext } from '../contexts/AppContext';

const ActivityFeedPage = () => {
  const ctx = useContext(AppContext);
  const [projectFilter, setProjectFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [search, setSearch] = useState('');

  if (!ctx) return null;

  const { activities, projects, activeWorkspace } = ctx;

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      const matchProject = projectFilter === 'all' || a.project === projects.find((p) => p.id === projectFilter)?.name;
      const matchMember = memberFilter === 'all' || a.user === memberFilter;
      const matchSearch = !search || a.message.toLowerCase().includes(search.toLowerCase()) || a.user.toLowerCase().includes(search.toLowerCase());
      return matchProject && matchMember && matchSearch;
    });
  }, [activities, projectFilter, memberFilter, search, projects]);

  const contributionLevels = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => {
      const level = (i + activities.length) % 5;
      return level;
    });
  }, [activities.length]);

  return (
    <div>
      <div className="page-header glass section" style={{ padding: 24, borderRadius: 20 }}>
        <div className="overline">Activity Feed</div>
        <h1 style={{ margin: '8px 0' }}>Team Activity</h1>
        <p className="page-lead">Live timeline of everything happening across your workspace</p>
      </div>

      <div className="glass card section">
        <div className="overline">Contribution Graph</div>
        <div className="contribution-graph" style={{ marginTop: 12 }}>
          {contributionLevels.map((level, i) => (
            <div key={i} className={`contribution-cell heatmap-cell level-${level}`} title={`Day ${i + 1}`} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input className="input-field" placeholder="Search activities…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        <select className="input-field" style={{ width: 'auto' }} value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="all">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select className="input-field" style={{ width: 'auto' }} value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)}>
          <option value="all">All members</option>
          {activeWorkspace?.members.map((u) => (
            <option key={u.id} value={u.name}>{u.name}</option>
          ))}
        </select>
      </div>

      <div className="glass card">
        {filtered.map((a) => (
          <div key={a.id} className="activity-item">
            <div className={`activity-dot type-${a.type}`} />
            <div style={{ flex: 1 }}>
              <strong>{a.user}</strong>
              <span style={{ opacity: 0.85 }}> {a.message}</span>
              {a.project && <span className="small-badge" style={{ marginLeft: 8 }}>{a.project}</span>}
              <div style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: 4 }}>{a.timestamp}</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', opacity: 0.6, padding: 40 }}>No activities match your filters</p>
        )}
      </div>
    </div>
  );
};

export default ActivityFeedPage;
