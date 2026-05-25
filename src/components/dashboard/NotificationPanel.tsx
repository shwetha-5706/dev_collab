import { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';

const NotificationPanel = () => {
  const ctx = useContext(AppContext);
  if (!ctx) return null;

  const {
    notifications,
    notificationPanelOpen,
    setNotificationPanelOpen,
    markNotificationRead,
    markAllNotificationsRead,
  } = ctx;

  const grouped = {
    high: notifications.filter((n) => n.priority === 'high'),
    medium: notifications.filter((n) => n.priority === 'medium'),
    low: notifications.filter((n) => n.priority === 'low' || !n.priority),
  };

  return (
    <>
      {notificationPanelOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 140 }}
          onClick={() => setNotificationPanelOpen(false)}
        />
      )}
      <aside className={`notification-panel glass ${notificationPanelOpen ? 'open' : ''}`}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="overline">Notifications</div>
            <h2 style={{ margin: '4px 0 0', fontSize: '1.1rem' }}>Activity panel</h2>
          </div>
          <button className="glow-button secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={markAllNotificationsRead}>
            Mark all read
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {(['high', 'medium', 'low'] as const).map((priority) => {
            const items = grouped[priority];
            if (items.length === 0) return null;
            return (
              <div key={priority}>
                <div className="sidebar-section-label" style={{ padding: '12px 16px 4px' }}>
                  {priority} priority · AI ranked
                </div>
                {items.map((n) => (
                  <div
                    key={n.id}
                    className={`notification-item ${!n.read ? 'unread' : ''}`}
                    onClick={() => markNotificationRead(n.id)}
                  >
                    <div style={{ fontSize: '0.78rem', opacity: 0.6, marginBottom: 4 }}>{n.type} · {n.time}</div>
                    <div style={{ fontSize: '0.88rem' }}>{n.text}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default NotificationPanel;
