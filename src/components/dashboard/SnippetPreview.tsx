import { useContext, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';

const SnippetPreview = () => {
  const ctx = useContext(AppContext);
  const [langFilter, setLangFilter] = useState('all');
  if (!ctx) return null;
  const { snippets, toggleSnippetFavorite } = ctx;

  const languages = ['all', ...new Set(snippets.map((s) => s.language))];
  const filtered = langFilter === 'all' ? snippets : snippets.filter((s) => s.language === langFilter);
  const trending = snippets.filter((s) => s.trending);

  return (
    <div className="glass card section">
      <div className="overline">Code Snippets</div>
      <h2 style={{ margin: '8px 0 12px' }}>Recent & favorites</h2>

      {trending.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div className="small-badge" style={{ marginBottom: 8 }}>🔥 Trending</div>
          {trending.map((s) => (
            <div key={s.id} style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: 4 }}>{s.title}</div>
          ))}
        </div>
      )}

      <div className="filter-tabs">
        {languages.map((lang) => (
          <button key={lang} className={`filter-tab ${langFilter === lang ? 'active' : ''}`} onClick={() => setLangFilter(lang)}>
            {lang}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.slice(0, 4).map((snippet) => (
          <div key={snippet.id} style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.88rem' }}>{snippet.title}</strong>
              <button
                onClick={() => toggleSnippetFavorite(snippet.id)}
                style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer' }}
              >
                {snippet.favorite ? '★' : '☆'}
              </button>
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: 4 }}>
              {snippet.language} · {snippet.author}
            </div>
            <pre style={{ fontSize: '0.72rem', opacity: 0.7, margin: '8px 0 0', overflow: 'hidden', maxHeight: 48, whiteSpace: 'pre-wrap' }}>
              {snippet.code.slice(0, 80)}…
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SnippetPreview;
