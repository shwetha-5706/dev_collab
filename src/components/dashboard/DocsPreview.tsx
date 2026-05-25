import { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';

const DocsPreview = () => {
  const ctx = useContext(AppContext);
  if (!ctx) return null;
  const { docs } = ctx;

  const recent = docs.slice(0, 3);
  const shared = docs.filter((d) => d.shared);

  return (
    <div className="glass card section">
      <div className="overline">Documentation</div>
      <h2 style={{ margin: '8px 0 16px' }}>Wiki preview</h2>

      <div style={{ display: 'grid', gap: 12 }}>
        {recent.map((doc) => (
          <div key={doc.id} style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.9rem' }}>{doc.title}</strong>
              {doc.shared && <span className="small-badge">Shared</span>}
            </div>
            {doc.aiSummary && (
              <p style={{ fontSize: '0.82rem', opacity: 0.75, margin: '8px 0' }}>
                🤖 {doc.aiSummary}
              </p>
            )}
            <div style={{ fontSize: '0.75rem', opacity: 0.55 }}>
              {doc.updatedBy} · {doc.updatedAt}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button className="glow-button secondary" style={{ padding: '6px 12px', fontSize: '0.72rem' }}>Quick edit</button>
              <button className="glow-button secondary" style={{ padding: '6px 12px', fontSize: '0.72rem' }}>Collaborate</button>
            </div>
          </div>
        ))}
      </div>

      {shared.length > 0 && (
        <div style={{ marginTop: 14, fontSize: '0.82rem', opacity: 0.7 }}>
          {shared.length} shared page{shared.length > 1 ? 's' : ''} available
        </div>
      )}
    </div>
  );
};

export default DocsPreview;
