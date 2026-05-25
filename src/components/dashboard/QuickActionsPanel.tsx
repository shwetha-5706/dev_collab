import { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import type { QuickActionType } from '../../types';

const actions: { type: QuickActionType; label: string; icon: string; shortcut: string }[] = [
  { type: 'task', label: 'Create Task', icon: '✓', shortcut: 'T' },
  { type: 'project', label: 'Create Project', icon: '🚀', shortcut: 'P' },
  { type: 'invite', label: 'Invite Member', icon: '👤', shortcut: 'I' },
  { type: 'snippet', label: 'Add Snippet', icon: '📝', shortcut: 'S' },
  { type: 'document', label: 'Create Document', icon: '📄', shortcut: 'D' },
  { type: 'report', label: 'Generate AI Report', icon: '🤖', shortcut: 'R' },
];

const QuickActionsPanel = () => {
  const ctx = useContext(AppContext);
  if (!ctx) return null;
  const { setQuickActionModal } = ctx;

  return (
    <div className="glass card section">
      <div className="overline">Quick Actions</div>
      <h2 style={{ margin: '8px 0 16px' }}>Create instantly</h2>
      <div className="grid-columns">
        {actions.map((action) => (
          <button
            key={action.type}
            className="glow-button secondary"
            style={{ flexDirection: 'column', padding: '16px', gap: 6 }}
            onClick={() => setQuickActionModal(action.type)}
          >
            <span style={{ fontSize: '1.4rem' }}>{action.icon}</span>
            <span style={{ fontSize: '0.82rem' }}>{action.label}</span>
            <span style={{ fontSize: '0.68rem', opacity: 0.5 }}>⌘{action.shortcut}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsPanel;
