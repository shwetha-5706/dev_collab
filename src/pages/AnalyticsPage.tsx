import { useContext, useState } from 'react';
import { AppContext } from '../contexts/AppContext';

const AnalyticsPage = () => {
  const ctx = useContext(AppContext);
  const [range, setRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  if (!ctx) return null;

  const { analyticsData, aiInsights, tasks } = ctx;
  const chartData = analyticsData[range];
  const maxVal = Math.max(...chartData);

  const done = tasks.filter((t) => t.status === 'Done').length;
  const total = tasks.length;
  const completionPct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <div className="page-header glass section" style={{ padding: 24, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="overline">Analytics Dashboard</div>
            <h1 style={{ margin: '8px 0' }}>Productivity Analytics</h1>
            <p className="page-lead">Team performance, workload metrics, and AI-powered insights</p>
          </div>
          <div className="filter-tabs" style={{ margin: 0 }}>
            {(['daily', 'weekly', 'monthly'] as const).map((r) => (
              <button key={r} className={`filter-tab ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-columns-3 section">
        <div className="glass stat-card">
          <div className="stat-value">{completionPct}%</div>
          <div className="stat-label">Task Completion</div>
        </div>
        <div className="glass stat-card">
          <div className="stat-value">{analyticsData.collaborationScore}</div>
          <div className="stat-label">Team Efficiency</div>
        </div>
        <div className="glass stat-card">
          <div className="stat-value">{analyticsData.burnoutIndex}</div>
          <div className="stat-label">Burnout Index</div>
        </div>
      </div>

      <div className="grid-columns-2">
        <div className="glass card">
          <div className="overline">Progress Chart</div>
          <div className="bar-chart" style={{ height: 120, marginTop: 20 }}>
            {chartData.map((val, i) => (
              <div
                key={i}
                className="bar-chart-bar"
                style={{ height: `${(val / maxVal) * 100}%` }}
                title={`${val} tasks`}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', opacity: 0.6, marginTop: 8 }}>
            {chartData.map((_, i) => (
              <span key={i}>{range === 'daily' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i] : `#${i + 1}`}</span>
            ))}
          </div>
        </div>

        <div className="glass card">
          <div className="overline">Sprint Health Meter</div>
          <div className="stat-value" style={{ fontSize: '2rem', marginTop: 12 }}>{aiInsights.sprintHealth}%</div>
          <div className="sprint-meter" style={{ height: 12 }}>
            <div className="sprint-meter-fill" style={{ width: `${aiInsights.sprintHealth}%` }} />
          </div>
          <div className="ai-insight-box" style={{ marginTop: 20 }}>
            Burnout prediction: {aiInsights.burnoutRisk} risk · Team mood: {aiInsights.teamMood}
          </div>
        </div>
      </div>

      <div className="glass card section">
        <div className="overline">Team Comparison</div>
        <div style={{ marginTop: 16 }}>
          {analyticsData.teamPerformance.map((member) => {
            const pct = Math.round((member.completed / member.assigned) * 100);
            return (
              <div key={member.name} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong>{member.name}</strong>
                  <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>{member.completed}/{member.assigned} tasks ({pct}%)</span>
                </div>
                <div className="sprint-meter">
                  <div className="sprint-meter-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
