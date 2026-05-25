import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../contexts/AppContext';

const commands = [
  { label: 'Go to Dashboard', path: '/dashboard' },
  { label: 'Go to Projects', path: '/projects' },
  { label: 'Go to Kanban Board', path: '/board' },
  { label: 'Open AI Assistant', path: '/assistant' },
  { label: 'View Analytics', path: '/analytics' },
  { label: 'Create Task', action: 'task' },
  { label: 'Generate AI Report', action: 'report' },
  { label: 'Toggle Focus Mode', action: 'focus' },
];

const CommandPalette = () => {
  const ctx = useContext(AppContext);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  if (!ctx) return null;

  const { commandPaletteOpen, setCommandPaletteOpen, setQuickActionModal, globalSearch } = ctx;

  if (!commandPaletteOpen) return null;

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));
  const searchResults = globalSearch(query);

  return (
    <div className="command-palette-overlay" onClick={() => setCommandPaletteOpen(false)}>
      <div className="command-palette glass" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          placeholder="Ask AI or search anything…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: '0 8px 8px' }}>
          {searchResults.length > 0 && (
            <>
              <div className="sidebar-section-label">Search results</div>
              {searchResults.map((r) => (
                <div key={r.id} className="search-result-item">
                  <span className="small-badge">{r.type}</span>
                  <div>
                    <strong>{r.title}</strong>
                    <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>{r.subtitle}</div>
                  </div>
                </div>
              ))}
            </>
          )}
          <div className="sidebar-section-label">Commands</div>
          {filtered.map((cmd) => (
            <div
              key={cmd.label}
              className="search-result-item"
              onClick={() => {
                if (cmd.path) navigate(cmd.path);
                if (cmd.action === 'task' || cmd.action === 'report') setQuickActionModal(cmd.action);
                setCommandPaletteOpen(false);
              }}
            >
              <SparklesIcon />
              {cmd.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SparklesIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
  </svg>
);

export default CommandPalette;
