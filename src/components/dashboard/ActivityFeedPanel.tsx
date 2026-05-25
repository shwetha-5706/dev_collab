import { useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppContext } from '../../contexts/AppContext';

const ActivityFeedPanel = () => {
  const ctx = useContext(AppContext);
  const [filter, setFilter] = useState('all');
  if (!ctx) return null;
  const { activities } = ctx;

  const filtered = filter === 'all' ? activities : activities.filter((a) => a.type === filter);

  const typeColors: Record<string, string> = {
    task: '#5d7bff',
    comment: '#9456ff',
    member: '#5ce5e5',
    wiki: '#86efac',
  };

  return (
    <div className="glass card section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div className="overline">Activity Feed</div>
          <h2 style={{ margin: '8px 0 0' }}>Live updates</h2>
        </div>
        <div className="small-badge">● Live</div>
      </div>

      <div className="filter-tabs">
        {['all', 'task', 'comment', 'member', 'wiki'].map((f) => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        <AnimatePresence initial={false}>
          {filtered.slice(0, 8).map((activity) => (
            <motion.div
              key={activity.id}
              className="activity-item"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="activity-dot" style={{ background: typeColors[activity.type || 'task'] }} />
              <div>
                <p style={{ margin: 0, fontSize: '0.88rem' }}>
                  <strong>{activity.user}</strong> {activity.message}
                </p>
                <div style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: 4 }}>
                  {activity.timestamp}{activity.project ? ` · ${activity.project}` : ''}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div style={{ marginTop: 16 }}>
        <div className="overline" style={{ marginBottom: 8 }}>Contribution graph</div>
        <div className="contribution-graph">
          {Array.from({ length: 28 }, (_, i) => {
            const level = Math.floor(Math.random() * 5);
            const colors = ['rgba(93,123,255,0.08)', 'rgba(93,123,255,0.2)', 'rgba(93,123,255,0.4)', 'rgba(93,123,255,0.6)', 'rgba(148,86,255,0.8)'];
            return <div key={i} className="contribution-cell" style={{ background: colors[level] }} />;
          })}
        </div>
      </div>
    </div>
  );
};

export default ActivityFeedPanel;
