import { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';

const TeamMembersPanel = () => {
  const ctx = useContext(AppContext);
  if (!ctx) return null;
  const { activeWorkspace, memberPresence, tasks } = ctx;

  return (
    <div className="glass card section">
      <div className="overline">Team Members</div>
      <h2 style={{ margin: '8px 0 16px' }}>Live presence</h2>

      <div style={{ display: 'grid', gap: 14 }}>
        {activeWorkspace?.members.map((member) => {
          const presence = memberPresence.find((p) => p.userId === member.id);
          const assignedCount = tasks.filter((t) => t.assignees.some((a) => a.id === member.id) && t.status !== 'Done').length;
          const statusClass = presence?.status.toLowerCase() || 'away';

          return (
            <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ position: 'relative' }}>
                <img src={member.avatar} alt={member.name} className="avatar-pill lg" />
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    border: '2px solid var(--bg-primary)',
                    background: statusClass === 'online' ? '#22c55e' : statusClass === 'busy' ? '#ef4444' : '#eab308',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong>{member.name}</strong>
                  <span className={`status-pill ${statusClass}`}>{presence?.status || 'Away'}</span>
                  <span className="small-badge">{member.role}</span>
                </div>
                <div style={{ fontSize: '0.82rem', opacity: 0.7, marginTop: 4 }}>
                  {presence?.activity || 'Idle'}
                  {presence?.viewingTask && (
                    <span style={{ color: 'var(--accent-cyan)' }}> · viewing {presence.viewingTask}</span>
                  )}
                </div>
              </div>
              <div className="stat-value" style={{ fontSize: '1.2rem' }}>{assignedCount}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamMembersPanel;
