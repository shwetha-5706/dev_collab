import { useContext, useMemo, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import type { Notification } from '../types';

const FILTERS: Array<{ key: 'all' | Notification['type']; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'mention', label: 'Mentions' },
  { key: 'assignment', label: 'Assignments' },
  { key: 'deadline', label: 'Deadlines' },
  { key: 'invite', label: 'Invites' },
  { key: 'activity', label: 'Activity' },
];

const NotificationsPage = () => {
  const ctx = useContext(AppContext);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [muted, setMuted] = useState(false);

  if (!ctx) return null;

  const { notifications, markNotificationRead, markAllNotificationsRead } = ctx;

  const filtered = useMemo(() => {
    return notifications
      .filter((n) => (filter === 'all' ? true : n.type === filter))
      .filter((n) => (showUnreadOnly ? !n.read : true))
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (priorityOrder[a.priority ?? 'low'] ?? 2) - (priorityOrder[b.priority ?? 'low'] ?? 2);
      });
  }, [notifications, filter, showUnreadOnly]);

  const unread = notifications.filter((n) => !n.read).length;

  const typeIcon = (type: Notification['type']) => {
    const icons = { mention: '@', assignment: 'A', deadline: 'D', invite: 'I', activity: 'N' };
    return icons[type];
  };

  return (
    <div>
      <div className="page-header glass section" style={{ padding: 24, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="overline">Notification Center</div>
            <h1 style={{ margin: '8px 0' }}>Notifications</h1>
            <p className="page-lead">{unread} unread · AI-ranked by importance</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="glow-button secondary" onClick={markAllNotificationsRead}>Mark all read</button>
            <button className={`glow-button secondary ${muted ? 'active' : ''}`} onClick={() => setMuted(!muted)}>
              {muted ? 'Unmute' : 'Mute all'}
            </button>
          </div>
        </div>
      </div>

      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <button key={f.key} className={`filter-tab ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
        <button className={`filter-tab ${showUnreadOnly ? 'active' : ''}`} onClick={() => setShowUnreadOnly(!showUnreadOnly)}>
          Unread only
        </button>
      </div>

      <div className="glass card">
        {muted && (
          <div className="ai-insight-box" style={{ margin: 16 }}>Notifications are muted</div>
        )}
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`notification-item ${!n.read ? 'unread' : ''}`}
            onClick={() => markNotificationRead(n.id)}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem' }}>{typeIcon(n.type)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span>{n.text}</span>
                  {n.priority === 'high' && <span className="small-badge badge-danger">High</span>}
                </div>
                <div className="text-xs-muted" style={{ marginTop: 4 }}>{n.time}</div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="empty-state">No notifications</p>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
