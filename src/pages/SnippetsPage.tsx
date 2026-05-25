import { useContext, useMemo, useState } from 'react';
import { ClipboardDocumentIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { AppContext } from '../contexts/AppContext';

const LANGUAGES = ['All', 'TypeScript', 'JavaScript', 'Python', 'CSS', 'Go', 'Java', 'C++'];

const SnippetsPage = () => {
  const ctx = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!ctx) return null;

  const { snippets, toggleSnippetFavorite, showToast, setQuickActionModal } = ctx;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return snippets.filter((s) => {
      const matchLang = langFilter === 'All' || s.language === langFilter;
      const matchSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.tags.some((t) => t.includes(q)) ||
        s.code.toLowerCase().includes(q);
      return matchLang && matchSearch;
    });
  }, [snippets, search, langFilter]);

  const trending = snippets.filter((s) => s.trending);
  const selected = snippets.find((s) => s.id === selectedId) ?? filtered[0];

  const copyCode = () => {
    if (!selected) return;
    navigator.clipboard.writeText(selected.code);
    setCopied(true);
    showToast('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="page-header glass section" style={{ padding: 24, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="overline">Code Snippet Manager</div>
            <h1 style={{ margin: '8px 0' }}>Snippets</h1>
            <p style={{ opacity: 0.75, margin: 0 }}>Save, search, and reuse code with AI recommendations</p>
          </div>
          <button className="glow-button" onClick={() => setQuickActionModal('snippet')}>+ New Snippet</button>
        </div>
      </div>

      {trending.length > 0 && (
        <div className="glass card section">
          <div className="overline">Trending</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            {trending.map((s) => (
              <button key={s.id} className="small-badge" style={{ cursor: 'pointer', padding: '8px 14px' }} onClick={() => setSelectedId(s.id)}>
                🔥 {s.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid-columns-2">
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input className="input-field" placeholder="Search snippets…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
            <select className="input-field" value={langFilter} onChange={(e) => setLangFilter(e.target.value)} style={{ width: 'auto' }}>
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="snippet-list">
            {filtered.map((s) => (
              <div
                key={s.id}
                className={`glass card snippet-item ${selected?.id === s.id ? 'active' : ''}`}
                onClick={() => setSelectedId(s.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong>{s.title}</strong>
                    <div style={{ fontSize: '0.78rem', opacity: 0.7, marginTop: 4 }}>{s.language} · {s.author}</div>
                  </div>
                  <button
                    className="icon-button"
                    style={{ width: 32, height: 32 }}
                    onClick={(e) => { e.stopPropagation(); toggleSnippetFavorite(s.id); }}
                  >
                    {s.favorite ? <StarSolid width={16} style={{ color: '#fde047' }} /> : <StarIcon width={16} />}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {s.tags.map((t) => (
                    <span key={t} className="small-badge">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selected && (
          <div className="glass card snippet-detail">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0 }}>{selected.title}</h2>
                <div style={{ opacity: 0.7, fontSize: '0.85rem' }}>{selected.language}</div>
              </div>
              <button className="glow-button secondary" onClick={copyCode}>
                <ClipboardDocumentIcon width={18} /> {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="ai-insight-box" style={{ marginBottom: 16 }}>
              ✨ AI: This snippet provides a reusable {selected.language} utility for {selected.tags[0] ?? 'development'} workflows.
            </div>

            <pre className="code-block">{selected.code}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnippetsPage;
