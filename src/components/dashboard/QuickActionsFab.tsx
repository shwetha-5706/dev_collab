import { AnimatePresence, motion } from 'framer-motion';
import { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import type { QuickActionType } from '../../types';

const fabActions: { type: QuickActionType; label: string }[] = [
  { type: 'task', label: 'Create Task' },
  { type: 'project', label: 'Create Project' },
  { type: 'invite', label: 'Invite Member' },
  { type: 'snippet', label: 'Add Snippet' },
  { type: 'document', label: 'Create Document' },
  { type: 'report', label: 'AI Report' },
];

type Props = {
  open: boolean;
  onToggle: () => void;
};

const QuickActionsFab = ({ open, onToggle }: Props) => {
  const ctx = useContext(AppContext);
  if (!ctx) return null;
  const { setQuickActionModal } = ctx;

  return (
    <div className="fab-container">
      <AnimatePresence>
        {open && (
          <motion.div className="fab-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {fabActions.map((action, i) => (
              <motion.button
                key={action.type}
                className="fab-item glass glow-button secondary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  setQuickActionModal(action.type);
                  onToggle();
                }}
              >
                {action.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button className={`fab-main ${open ? 'open' : ''}`} onClick={onToggle} aria-label="Quick actions">
        +
      </button>
    </div>
  );
};

export default QuickActionsFab;
