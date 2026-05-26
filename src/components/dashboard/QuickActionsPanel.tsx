import { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import type { QuickActionType } from '../../types';

const actions: { type: QuickActionType; label: string; desc: string }[] = [
  { type: 'task', label: 'New task', desc: 'Add to board' },
  { type: 'project', label: 'New project', desc: 'Start sprint' },
  { type: 'invite', label: 'Invite', desc: 'Add member' },
  { type: 'snippet', label: 'Snippet', desc: 'Save code' },
  { type: 'document', label: 'Wiki page', desc: 'Write docs' },
  { type: 'report', label: 'Standup', desc: 'AI report' },
];

const QuickActionsPanel = () => {
  const ctx = useContext(AppContext);
  if (!ctx) return null;
  const { setQuickActionModal } = ctx;

  return (
    <section className="dashboard-panel dashboard-panel-fill">
      <div className="dashboard-panel-head">
        <div>
          <p className="dashboard-eyebrow">Shortcuts</p>
          <h2 className="dashboard-panel-title">Quick actions</h2>
        </div>
      </div>

      <div className="dashboard-action-grid">
        {actions.map((action) => (
          <button
            key={action.type}
            type="button"
            className="dashboard-action-box"
            onClick={() => setQuickActionModal(action.type)}
          >
            <span className="dashboard-action-label">{action.label}</span>
            <span className="dashboard-action-desc">{action.desc}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default QuickActionsPanel;
