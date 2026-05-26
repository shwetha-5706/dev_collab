import { useContext, useEffect, useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { AppContext } from '../contexts/AppContext';
import { renderMarkdown } from '../utils/markdown';
import type { DocVersion } from '../types';

const WikiPage = () => {
  const ctx = useContext(AppContext);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [versions, setVersions] = useState<DocVersion[]>([]);

  const selected = ctx?.docs.find((d) => d.id === selectedId) ?? ctx?.docs[0];

  useEffect(() => {
    if (!ctx || !selected?.id) return;
    ctx.getDocVersions(selected.id).then(setVersions);
  }, [selected?.id, selected?.updatedAt, ctx]);

  if (!ctx) return null;

  const { docs, setQuickActionModal, updateDoc, getDocVersions } = ctx;
  const current = docs.find((d) => d.id === selectedId) ?? docs[0];
  const isEditing = editBody !== '' || (editTitle !== '' && editTitle !== current?.title);

  const startEdit = () => {
    if (!current) return;
    setEditTitle(current.title);
    setEditBody(current.body);
  };

  const saveDoc = async () => {
    if (!current) return;
    await updateDoc(current.id, { title: editTitle, body: editBody });
    setEditBody('');
    setEditTitle('');
    const v = await getDocVersions(current.id);
    setVersions(v);
  };

  const navigateToPage = (title: string) => {
    const match = docs.find((d) => d.title.toLowerCase() === title.toLowerCase());
    if (match) setSelectedId(match.id);
  };

  const handleWikiClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest('[data-wiki-link]');
    if (target) {
      e.preventDefault();
      navigateToPage(target.getAttribute('data-wiki-link') ?? '');
    }
  };

  return (
    <div>
      <div className="page-header glass section" style={{ padding: 24, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="overline">Documentation Wiki</div>
            <h1 style={{ margin: '8px 0' }}>Wiki Docs</h1>
            <p className="page-lead">Rich pages with headings, code blocks, tables — link pages with [[Page Title]]</p>
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
              className={`wiki-page-link ${current?.id === d.id ? 'active' : ''}`}
              onClick={() => { setSelectedId(d.id); setEditBody(''); }}
            >
              {d.title}
              {d.shared && <span className="small-badge" style={{ marginLeft: 6, fontSize: '0.65rem' }}>shared</span>}
            </button>
          ))}

          {current?.links && current.links.length > 0 && (
            <>
              <div className="overline" style={{ marginTop: 20 }}>Linked Pages</div>
              {current.links.map((link) => (
                <button key={link} className="wiki-page-link" onClick={() => navigateToPage(link)} style={{ fontSize: '0.85rem' }}>
                  {link}
                </button>
              ))}
            </>
          )}
        </aside>

        <main className="glass wiki-content">
          {current && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div>
                  {editBody ? (
                    <input className="input-field" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 12 }} />
                  ) : (
                    <h1 style={{ margin: '0 0 8px' }}>{current.title}</h1>
                  )}
                  <div style={{ fontSize: '0.82rem', opacity: 0.7 }}>
                    Updated by {current.updatedBy} · {current.updatedAt}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!isEditing ? (
                    <button className="glow-button secondary" onClick={startEdit}>Edit</button>
                  ) : (
                    <>
                      <button className="glow-button" onClick={saveDoc}>Save</button>
                      <button className="glow-button secondary" onClick={() => { setEditBody(''); setEditTitle(''); }}>Cancel</button>
                    </>
                  )}
                </div>
              </div>

              {current.aiSummary && (
                <div className="ai-insight-box" style={{ margin: '20px 0' }}>
                  <SparklesIcon width={16} />
                  AI Summary: {current.aiSummary}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                {current.tags.map((t) => (
                  <span key={t} className="small-badge">{t}</span>
                ))}
              </div>

              {editBody ? (
                <textarea
                  className="input-field wiki-editor"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={16}
                  placeholder="Use # headings, - bullets, ```code blocks```, [[Page Links]]"
                />
              ) : (
                <div className="wiki-body wiki-markdown" onClick={handleWikiClick} dangerouslySetInnerHTML={{ __html: renderMarkdown(current.body) }} />
              )}

              <div className="overline" style={{ marginTop: 24 }}>Version History</div>
              <ul className="activity-log">
                <li>{current.updatedAt} — {current.updatedBy} (current version)</li>
                {versions.map((v) => (
                  <li key={v.id}>{v.updatedAt} — {v.updatedBy}: &quot;{v.title}&quot;</li>
                ))}
                {versions.length === 0 && <li style={{ opacity: 0.6 }}>No previous versions yet</li>}
              </ul>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default WikiPage;
