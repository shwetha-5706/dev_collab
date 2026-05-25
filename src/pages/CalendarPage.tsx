import { useContext, useMemo, useState } from 'react';
import { AppContext } from '../contexts/AppContext';

const CalendarPage = () => {
  const ctx = useContext(AppContext);
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!ctx) return null;

  const { calendarEvents, projects } = ctx;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof calendarEvents> = {};
    calendarEvents.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [calendarEvents]);

  const monthEvents = calendarEvents.filter((e) => e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`));

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="page-header glass section" style={{ padding: 24, borderRadius: 20 }}>
        <div className="overline">Calendar</div>
        <h1 style={{ margin: '8px 0' }}>Sprint Timeline & Deadlines</h1>
        <p style={{ opacity: 0.75, margin: 0 }}>Track project milestones, sprints, and AI risk indicators</p>
      </div>

      <div className="grid-columns-2">
        <div className="glass card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button className="icon-button" onClick={prevMonth}>‹</button>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
              {currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </h2>
            <button className="icon-button" onClick={nextMonth}>›</button>
          </div>

          <div className="calendar-grid" style={{ marginBottom: 8 }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', opacity: 0.6, padding: 4 }}>{d}</div>
            ))}
          </div>

          <div className="calendar-grid">
            {cells.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hasEvent = eventsByDate[dateStr]?.length;
              const isToday = dateStr === today;
              return (
                <div key={day} className={`calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}`}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass card">
          <div className="overline">Upcoming Events</div>
          {monthEvents.length === 0 && (
            <p style={{ opacity: 0.6, marginTop: 16 }}>No events this month</p>
          )}
          {monthEvents.map((e) => {
            const project = projects.find((p) => p.id === e.projectId);
            return (
              <div key={e.id} className="comment-item" style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong>{e.title}</strong>
                    <div style={{ fontSize: '0.82rem', opacity: 0.7, marginTop: 4 }}>{e.date} · {e.type}</div>
                    {project && <span className="small-badge" style={{ marginTop: 6 }}>{project.name}</span>}
                  </div>
                  {e.riskScore !== undefined && (
                    <span className={`small-badge ${e.riskScore > 60 ? 'risk-high' : e.riskScore > 30 ? 'risk-medium' : 'risk-low'}`}>
                      Risk {e.riskScore}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          <div className="ai-insight-box" style={{ marginTop: 20 }}>
            ⚠️ AI deadline warning: Sync Engine deadline has high risk score (82%)
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
