import { useContext, useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { AppContext } from '../contexts/AppContext';

const WikiPage = () => {
  const ctx = useContext(AppContext);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editTitle, setEditTitle] = useState('');

  if (!ctx) return null;

  const { docs, setQuickActionModal, showToast } = ctx;
  const selected = docs.find((d) => d.id === selectedId) ?? docs[0];

  const startEdit = () => {
    if (!selected) return;
    setEditTitle(selected.title);
    setEditBody(selected.body);
  };

  return (
    <div>
      <div className="page-header glass section" style={{ padding: 24, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="overline">Documentation Wiki</div>
            <h1 style={{ margin: '8px 0' }}>Wiki Docs</h1>
            <p style={{ opacity: 0.75, margin: 0 }}>Collaborative knowledge base with AI summaries and smart backlinks</p>
          </div>
          <button className="glow-button" onClick={() => setQuickActionModal('document')}>+ New Page</button>
        </div>
      </div>

      <div className="wiki-layout">
        <aside className="glass wiki-sidebar">
          <div className="overline">Pages</div>
          {docs.map((d) => (
            <button
              key={d.id}
              className={`wiki-page-link ${selected?.id === d.id ? 'active' : ''}`}
              onClick={() => { setSelectedId(d.id); setEditBody(''); }}
            >
              📄 {d.title}
              {d.shared && <span className="small-badge" style={{ marginLeft: 6, fontSize: '0.65rem' }}>shared</span>}
            </button>
          ))}

          <div className="overline" style={{ marginTop: 20 }}>Knowledge Graph</div>
          <div className="knowledge-graph">
            {docs.map((d, i) => (
              <div key={d.id} className="graph-node" style={{ left: `${20 + (i % 3) * 30}%`, top: `${10 + Math.floor(i / 3) * 35}%` }}>
                {d.title.split(' ')[0]}
              </div>
            ))}
          </div>
        </aside>

        <main className="glass wiki-content">
          {selected && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div>
                  {editBody ? (
                    <input className="input-field" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 12 }} />
                  ) : (
                    <h1 style={{ margin: '0 0 8px' }}>{selected.title}</h1>
                  )}
                  <div style={{ fontSize: '0.82rem', opacity: 0.7 }}>
                    Updated by {selected.updatedBy} · {selected.updatedAt}
                  </div>
                </div>
                <button className="glow-button secondary" onClick={() => { startEdit(); showToast('Editing mode — changes auto-save (mock)'); }}>
                  Edit
                </button>
              </div>

              {selected.aiSummary && (
                <div className="ai-insight-box" style={{ margin: '20px 0' }}>
                  <SparklesIcon width={16} />
                  AI Summary: {selected.aiSummary}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                {selected.tags.map((t) => (
                  <span key={t} className="small-badge">{t}</span>
                ))}
              </div>

              {editBody ? (
                <textarea className="input-field wiki-editor" value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={12} />
              ) : (
                <div className="wiki-body">{selected.body}</div>
              )}

              <div className="overline" style={{ marginTop: 24 }}>Version History</div>
              <ul className="activity-log">
                <li>{selected.updatedAt} — {selected.updatedBy} edited content</li>
                <li>2026-05-20 — Initial version created</li>
              </ul>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default WikiPage;
