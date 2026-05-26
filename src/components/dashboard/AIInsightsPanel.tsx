import { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';

const AIInsightsPanel = () => {
  const ctx = useContext(AppContext);
  if (!ctx) return null;
  const { aiInsights, projects } = ctx;

  return (
    <div className="glass card section">
      <div className="overline">AI Insights</div>
      <h2 style={{ margin: '8px 0 16px' }}>Sprint intelligence</h2>

      <div className="grid-columns" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-value">{aiInsights.sprintHealth}%</div>
          <div className="stat-label">Sprint health</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{aiInsights.blockedTasks}</div>
          <div className="stat-label">Blocked tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '1.2rem' }}>{aiInsights.teamMood}</div>
          <div className="stat-label">Team mood</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '1.2rem' }}>{aiInsights.burnoutRisk}</div>
          <div className="stat-label">Burnout risk</div>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <strong style={{ fontSize: '0.85rem' }}>Predictions</strong>
        {aiInsights.predictions.map((p) => (
          <p key={p} style={{ margin: '8px 0', fontSize: '0.85rem', opacity: 0.85 }}>{p}</p>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {aiInsights.recommendations.map((rec) => (
          <button key={rec} className="glow-button secondary" style={{ padding: '8px 14px', fontSize: '0.78rem' }}>
            {rec}
          </button>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 14 }}>
        <strong style={{ fontSize: '0.85rem' }}>Project health</strong>
        {projects.slice(0, 3).map((p) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '0.85rem' }}>
            <span>{p.name}</span>
            <span className={`risk-${p.riskLevel}`}>{p.health}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIInsightsPanel;
