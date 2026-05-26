import { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';

const BackendStatusBar = () => {
  const ctx = useContext(AppContext);
  if (!ctx || ctx.backendOnline) return null;

  return (
    <div
      className="backend-status-bar"
      role="alert"
    >
      <span>
        Backend offline — start the API with <code>npm run backend</code> or <code>npm run dev:all</code>
      </span>
      <button type="button" className="glow-button secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => ctx.checkBackend()}>
        Retry
      </button>
    </div>
  );
};

export default BackendStatusBar;
