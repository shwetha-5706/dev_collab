import { useContext, useState } from 'react';
import { SparklesIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { AppContext } from '../../contexts/AppContext';

const StandupReportPanel = () => {
  const ctx = useContext(AppContext);
  const [report, setReport] = useState('');
  const [provider, setProvider] = useState<'openai' | 'local' | null>(null);
  const [loading, setLoading] = useState(false);

  if (!ctx) return null;

  const { generateAIReport, showToast, aiConfigured } = ctx;

  const runStandup = async () => {
    setLoading(true);
    try {
      const result = await generateAIReport();
      setReport(result.report);
      setProvider(result.provider);
      showToast(result.provider === 'openai' ? 'Standup generated with OpenAI' : 'Standup generated');
    } catch {
      showToast('Failed to generate standup — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const copyReport = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    showToast('Copied to clipboard');
  };

  return (
    <section className="dashboard-panel dashboard-panel-fill">
      <div className="dashboard-panel-head">
        <div>
          <p className="dashboard-eyebrow">AI Standup</p>
          <h2 className="dashboard-panel-title">Daily standup report</h2>
          <p className="dashboard-subtitle">
            {aiConfigured
              ? 'OpenAI analyzes your tasks and activity for a natural standup'
              : 'Built from completed tasks, moves, and blockers (add OPENAI_API_KEY for GPT)'}
          </p>
        </div>
        <button type="button" className="glow-button" onClick={runStandup} disabled={loading}>
          <SparklesIcon width={16} />
          {loading ? 'Generating…' : 'Generate standup'}
        </button>
      </div>

      {report ? (
        <div style={{ padding: '0 24px 24px' }}>
          {provider && (
            <span className="small-badge" style={{ marginBottom: 12, display: 'inline-block' }}>
              {provider === 'openai' ? 'Powered by OpenAI' : 'Smart local AI'}
            </span>
          )}
          <pre className="report-preview standup-report">{report}</pre>
          <button type="button" className="glow-button secondary" style={{ marginTop: 12 }} onClick={copyReport}>
            <ClipboardDocumentIcon width={16} /> Copy for Slack
          </button>
        </div>
      ) : (
        <p className="dashboard-empty">Click generate to build your team update</p>
      )}
    </section>
  );
};

export default StandupReportPanel;
