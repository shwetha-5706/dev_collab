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
  suggestions?: string[];
};

const AIAssistantPage = () => {
  const ctx = useContext(AppContext);
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'assistant' | 'reviewer'>('assistant');
  const [code, setCode] = useState('function fetchData(url) {\n  return fetch(url).then(r => r.json());\n}');
  const [lang, setLang] = useState('JavaScript');
  const [review, setReview] = useState<CodeReview | null>(null);
  const [report, setReport] = useState('');
  const [featureDesc, setFeatureDesc] = useState('Build a login system');
  const [breakdownProject, setBreakdownProject] = useState('');

  useEffect(() => {
    if (!ctx) return;
    const action = searchParams.get('action');
    if (action === 'standup') {
      ctx.generateAIReport().then((r) => setReport(r.report));
      setTab('assistant');
    } else if (action === 'blockers') {
      ctx.getBlockersReport().then(setReport);
      setTab('assistant');
    }
  }, [searchParams, ctx]);

  if (!ctx) return null;

  const { aiInsights, tasks, projects, generateAIReport, summarizeProject, getBlockersReport, generateTaskBreakdown, analyzeCode, showToast, subscription, activeWorkspace } = ctx;

  const workspaceProjects = projects.filter((p) => p.workspaceId === activeWorkspace?.id);

  const overdue = tasks.filter((t) => t.dueDate < new Date().toISOString().slice(0, 10) && t.status !== 'Done');

  const runReview = async () => {
    const result = await analyzeCode(code, lang) as CodeReview;
    setReview(result);
    showToast('AI code review complete');
  };

  return (
    <div>
      <div className="page-header glass section" style={{ padding: 24, borderRadius: 20 }}>
        <div className="overline">AI Project Assistant</div>
        <h1 style={{ margin: '8px 0' }}>AI Copilot</h1>
        <p className="page-lead">Standups, blockers, sprint health, and code review — powered by AI</p>
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
              <button className="glow-button" onClick={() => generateAIReport().then((r) => setReport(r.report))}>Generate Standup</button>
              <button className="glow-button secondary" onClick={() => summarizeProject().then(setReport)}>Summarise This Project</button>
              <button className="glow-button secondary" onClick={() => getBlockersReport().then(setReport)}>What's Blocking Us?</button>
            </div>

            <div className="overline" style={{ marginTop: 24 }}>Auto Task Breakdown</div>
            <textarea
              className="input-field"
              rows={2}
              value={featureDesc}
              onChange={(e) => setFeatureDesc(e.target.value)}
              placeholder="Describe a feature…"
              style={{ marginTop: 8 }}
            />
            <select
              className="input-field"
              style={{ marginTop: 8 }}
              value={breakdownProject || workspaceProjects[0]?.id || ''}
              onChange={(e) => setBreakdownProject(e.target.value)}
            >
              {workspaceProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              className="glow-button secondary"
              style={{ marginTop: 8 }}
              onClick={async () => {
                const pid = breakdownProject || workspaceProjects[0]?.id;
                if (!pid) return;
                const count = await generateTaskBreakdown(featureDesc, pid);
                showToast(`AI created ${count} subtasks`);
              }}
            >
              Generate Tasks from Feature
            </button>
            {!subscription.limits.ai && (
              <div className="small-badge badge-warning" style={{ marginTop: 12 }}>
                Code review & task breakdown require Pro · Standup reports are free
              </div>
            )}

            <div className="overline" style={{ marginTop: 24 }}>AI Predictions</div>
            <ul className="list-muted">
              {aiInsights.predictions.map((p, i) => (
                <li key={i} style={{ marginBottom: 8 }}>{p}</li>
              ))}
            </ul>
          </div>

          {report && (
            <div className="glass card" style={{ gridColumn: '1 / -1' }}>
              <div className="overline">Generated Standup Report</div>
              <pre className="report-preview standup-report" style={{ maxHeight: 400 }}>{report}</pre>
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
                  <div className="stat-value">{review.qualityScore}/10</div>
                  <div className="stat-label">Quality Score</div>
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
                  <h3 style={{ fontSize: '0.95rem' }}>Bug Detection</h3>
                  <ul className="list-muted">{review.bugs.map((b, i) => <li key={i}>{b}</li>)}</ul>
                </>
              )}

              <h3 style={{ fontSize: '0.95rem' }}>Optimizations</h3>
              <ul className="list-muted">{review.optimizations.map((o, i) => <li key={i}>{o}</li>)}</ul>

              {review.securityIssues.length > 0 && (
                <>
                  <h3 style={{ fontSize: '0.95rem' }}>Security</h3>
                  <ul className="list-muted">{review.securityIssues.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </>
              )}

              {review.suggestions && review.suggestions.length > 0 && (
                <>
                  <h3 style={{ fontSize: '0.95rem' }}>Suggestions</h3>
                  <ul className="list-muted">{review.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
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
