import { useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SparklesIcon, ShieldCheckIcon, BoltIcon } from '@heroicons/react/24/outline';
import { AppContext } from '../contexts/AppContext';

const LANGUAGES = ['JavaScript', 'Python', 'Java', 'C++', 'Go'];

type CodeReview = {
  qualityScore: number;
  readability: number;
  security: 'low' | 'medium' | 'high';
  bugs: string[];
  optimizations: string[];
  securityIssues: string[];
};

const mockAnalyze = (code: string, lang: string): CodeReview => {
  const lines = code.split('\n').length;
  const hasEval = code.includes('eval(');
  const hasConsole = code.includes('console.log');
  return {
    qualityScore: Math.min(95, 60 + lines * 2 + (code.includes('try') ? 10 : 0)),
    readability: Math.min(90, 70 + (code.includes('//') ? 10 : 0)),
    security: hasEval ? 'high' : code.includes('password') ? 'medium' : 'low',
    bugs: hasConsole ? ['Remove debug console.log statements'] : [],
    optimizations: lines > 20 ? ['Consider splitting into smaller functions', 'Add error handling for edge cases'] : ['Code looks concise — good job!'],
    securityIssues: hasEval ? ['Avoid eval() — use JSON.parse or safe alternatives'] : [],
  };
};

const AIAssistantPage = () => {
  const ctx = useContext(AppContext);
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'assistant' | 'reviewer'>('assistant');
  const [code, setCode] = useState('function fetchData(url) {\n  return fetch(url).then(r => r.json());\n}');
  const [lang, setLang] = useState('JavaScript');
  const [review, setReview] = useState<CodeReview | null>(null);
  const [report, setReport] = useState('');

  if (!ctx) return null;

  const { aiInsights, tasks, generateAIReport, showToast } = ctx;

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'standup') {
      setReport(generateAIReport());
      setTab('assistant');
    } else if (action === 'blockers') {
      setReport(`## Blockers Detected\n\n- ${aiInsights.blockedTasks} tasks are blocked\n- Real-time Sync Engine at high risk\n- WebSocket pool is overdue\n\n### Recommendations\n${aiInsights.recommendations.map((r) => `- ${r}`).join('\n')}`);
      setTab('assistant');
    }
  }, [searchParams]);

  const overdue = tasks.filter((t) => t.dueDate < new Date().toISOString().slice(0, 10) && t.status !== 'Done');

  const runReview = () => {
    setReview(mockAnalyze(code, lang));
    showToast('AI code review complete');
  };

  return (
    <div>
      <div className="page-header glass section" style={{ padding: 24, borderRadius: 20 }}>
        <div className="overline">AI Project Assistant</div>
        <h1 style={{ margin: '8px 0' }}>AI Copilot</h1>
        <p style={{ opacity: 0.75, margin: 0 }}>Standups, blockers, sprint health, and code review — powered by AI</p>
      </div>

      <div className="filter-tabs">
        <button className={`filter-tab ${tab === 'assistant' ? 'active' : ''}`} onClick={() => setTab('assistant')}>
          <SparklesIcon width={16} style={{ display: 'inline', marginRight: 6 }} />
          Project Assistant
        </button>
        <button className={`filter-tab ${tab === 'reviewer' ? 'active' : ''}`} onClick={() => setTab('reviewer')}>
          <ShieldCheckIcon width={16} style={{ display: 'inline', marginRight: 6 }} />
          Code Reviewer
        </button>
      </div>

      {tab === 'assistant' && (
        <div className="grid-columns-2">
          <div className="glass card">
            <div className="overline">Sprint Health</div>
            <div className="stat-value" style={{ fontSize: '2.5rem' }}>{aiInsights.sprintHealth}%</div>
            <div className="sprint-meter"><div className="sprint-meter-fill" style={{ width: `${aiInsights.sprintHealth}%` }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
              <div className="stat-card glass">
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{aiInsights.blockedTasks}</div>
                <div className="stat-label">Blocked</div>
              </div>
              <div className="stat-card glass">
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{overdue.length}</div>
                <div className="stat-label">Overdue</div>
              </div>
            </div>
            <div className="small-badge" style={{ marginTop: 16 }}>
              Team mood: {aiInsights.teamMood} · Burnout: {aiInsights.burnoutRisk}
            </div>
          </div>

          <div className="glass card">
            <div className="overline">Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              <button className="glow-button" onClick={() => setReport(generateAIReport())}>Generate Standup</button>
              <button className="glow-button secondary" onClick={() => showToast('AI task breakdown generated for 3 projects')}>Auto Task Breakdown</button>
              <button className="glow-button secondary" onClick={() => showToast('Productivity focus mode enabled')}>Enable Focus Mode</button>
            </div>

            <div className="overline" style={{ marginTop: 24 }}>AI Predictions</div>
            <ul style={{ paddingLeft: 18, opacity: 0.85, fontSize: '0.9rem' }}>
              {aiInsights.predictions.map((p, i) => (
                <li key={i} style={{ marginBottom: 8 }}>{p}</li>
              ))}
            </ul>
          </div>

          {report && (
            <div className="glass card" style={{ gridColumn: '1 / -1' }}>
              <div className="overline">Generated Report</div>
              <pre className="report-preview" style={{ maxHeight: 400 }}>{report}</pre>
            </div>
          )}
        </div>
      )}

      {tab === 'reviewer' && (
        <div className="grid-columns-2">
          <div className="glass card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div className="overline">Paste Code</div>
              <select className="input-field" style={{ width: 'auto' }} value={lang} onChange={(e) => setLang(e.target.value)}>
                {LANGUAGES.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <textarea className="input-field code-editor" value={code} onChange={(e) => setCode(e.target.value)} rows={16} spellCheck={false} />
            <button className="glow-button" style={{ marginTop: 16, width: '100%' }} onClick={runReview}>
              <BoltIcon width={18} /> Analyze Code
            </button>
          </div>

          {review && (
            <div className="glass card">
              <div className="overline">Review Report</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '16px 0' }}>
                <div className="stat-card">
                  <div className="stat-value">{review.qualityScore}</div>
                  <div className="stat-label">Quality</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{review.readability}</div>
                  <div className="stat-label">Readability</div>
                </div>
                <div className="stat-card">
                  <div className={`stat-value risk-${review.security === 'high' ? 'high' : review.security === 'medium' ? 'medium' : 'low'}`}>
                    {review.security}
                  </div>
                  <div className="stat-label">Security</div>
                </div>
              </div>

              {review.bugs.length > 0 && (
                <>
                  <h3 style={{ fontSize: '0.95rem' }}>🐛 Bug Detection</h3>
                  <ul style={{ fontSize: '0.88rem', opacity: 0.85 }}>{review.bugs.map((b, i) => <li key={i}>{b}</li>)}</ul>
                </>
              )}

              <h3 style={{ fontSize: '0.95rem' }}>⚡ Optimizations</h3>
              <ul style={{ fontSize: '0.88rem', opacity: 0.85 }}>{review.optimizations.map((o, i) => <li key={i}>{o}</li>)}</ul>

              {review.securityIssues.length > 0 && (
                <>
                  <h3 style={{ fontSize: '0.95rem' }}>🔒 Security</h3>
                  <ul style={{ fontSize: '0.88rem', opacity: 0.85 }}>{review.securityIssues.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssistantPage;
