import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { AppContext } from '../../contexts/AppContext';

const ActivityFeedPanel = () => {
  const ctx = useContext(AppContext);
  const [digest, setDigest] = useState('');
  const [digestLoading, setDigestLoading] = useState(false);

  if (!ctx) return null;
  const { activities, getActivityDigest, showToast, backendOnline } = ctx;

  const runDigest = async () => {
    if (!backendOnline) {
      showToast('Backend offline — start the server to use AI');
      return;
    }
    setDigestLoading(true);
    try {
      const result = await getActivityDigest();
      setDigest(result.digest);
      showToast(result.provider === 'openai' ? 'Activity digest ready (OpenAI)' : 'Activity digest ready');
    } catch {
      showToast('Could not generate digest');
    } finally {
      setDigestLoading(false);
    }
  };

  return (
    <section className="dashboard-panel dashboard-panel-fill">
      <div className="dashboard-panel-head">
        <div>
          <p className="dashboard-eyebrow">Timeline</p>
          <h2 className="dashboard-panel-title">Recent activity</h2>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="button"
            className="glow-button secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            onClick={runDigest}
            disabled={digestLoading}
          >
            <SparklesIcon width={14} />
            {digestLoading ? 'Summarizing…' : 'AI digest'}
          </button>
          <Link to="/activity" className="dashboard-text-link">View all →</Link>
        </div>
      </div>

      {digest && (
        <div style={{ padding: '0 24px 16px' }}>
          <pre className="report-preview" style={{ fontSize: '0.85rem', margin: 0 }}>{digest}</pre>
        </div>
      )}

      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Action</th>
              <th>Project</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {activities.slice(0, 7).map((activity) => (
              <tr key={activity.id}>
                <td className="dashboard-table-primary">{activity.user}</td>
                <td>{activity.message}</td>
                <td className="dashboard-table-muted">{activity.project ?? '—'}</td>
                <td className="dashboard-table-muted">{activity.timestamp}</td>
              </tr>
            ))}
            {activities.length === 0 && (
              <tr>
                <td colSpan={4} className="dashboard-table-empty">No recent activity</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ActivityFeedPanel;
