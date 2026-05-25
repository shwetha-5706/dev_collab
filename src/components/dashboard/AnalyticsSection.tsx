import { useContext, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';

type Period = 'daily' | 'weekly' | 'monthly';

const AnalyticsSection = () => {
  const ctx = useContext(AppContext);
  const [period, setPeriod] = useState<Period>('weekly');
  if (!ctx) return null;
  const { analyticsData } = ctx;

  const chartData = analyticsData[period];
  const maxVal = Math.max(...chartData);

  return (
    <div className="glass card section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div className="overline">Analytics</div>
          <h2 style={{ margin: '8px 0 0' }}>Team performance</h2>
        </div>
        <div className="filter-tabs" style={{ margin: 0 }}>
          {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
            <button key={p} className={`filter-tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bar-chart" style={{ marginBottom: 20 }}>
        {chartData.map((val, i) => (
          <div
            key={i}
            className="bar-chart-bar"
            style={{ height: `${(val / maxVal) * 100}%` }}
            title={`${val} tasks`}
          />
        ))}
      </div>

      <div className="grid-columns" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-value">{analyticsData.collaborationScore}%</div>
          <div className="stat-label">Collaboration score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{analyticsData.burnoutIndex}%</div>
          <div className="stat-label">Burnout index</div>
        </div>
      </div>

      <div className="overline" style={{ marginBottom: 8 }}>Team load</div>
      {analyticsData.teamPerformance.map((member) => (
        <div key={member.name} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
            <span>{member.name}</span>
            <span>{member.completed}/{member.assigned} tasks</span>
          </div>
          <div className="sprint-meter">
            <div
              className="sprint-meter-fill"
              style={{ width: `${(member.completed / member.assigned) * 100}%` }}
            />
          </div>
        </div>
      ))}

      <div style={{ marginTop: 16 }}>
        <div className="overline" style={{ marginBottom: 8 }}>Productivity heatmap</div>
        <div className="heatmap-grid">
          {Array.from({ length: 28 }, (_, i) => (
            <div key={i} className={`heatmap-cell level-${Math.floor(Math.random() * 4)}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSection;
