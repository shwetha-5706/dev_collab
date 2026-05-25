import { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';

type ViewMode = 'month' | 'week' | 'day';

const CalendarDeadlines = () => {
  const ctx = useContext(AppContext);
  const [view, setView] = useState<ViewMode>('month');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  if (!ctx) return null;
  const { calendarEvents } = ctx;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const eventDates = useMemo(() => {
    const set = new Set<number>();
    calendarEvents.forEach((e) => {
      const d = new Date(e.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        set.add(d.getDate());
      }
    });
    return set;
  }, [calendarEvents, month, year]);

  const upcoming = calendarEvents
    .filter((e) => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  return (
    <div className="glass card section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div className="overline">Calendar</div>
          <h2 style={{ margin: '8px 0 0' }}>Deadlines & events</h2>
        </div>
        <div className="filter-tabs" style={{ margin: 0 }}>
          {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
            <button key={v} className={`filter-tab ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 8, fontWeight: 600 }}>
            {today.toLocaleDateString([], { month: 'long', year: 'numeric' })}
          </div>
          <div className="calendar-grid" style={{ marginBottom: 16 }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', opacity: 0.5 }}>{d}</div>
            ))}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const isToday = day === today.getDate();
              const hasEvent = eventDates.has(day);
              return (
                <div
                  key={day}
                  className={`calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''} ${selectedDay === day ? 'active' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="overline" style={{ marginBottom: 8 }}>Upcoming</div>
      {upcoming.map((event) => (
        <div key={event.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-glass)', fontSize: '0.85rem' }}>
          <div>
            <strong>{event.title}</strong>
            <div style={{ opacity: 0.6, fontSize: '0.78rem' }}>{event.date} · {event.type}</div>
          </div>
          {event.riskScore !== undefined && (
            <span className={`risk-${event.riskScore > 60 ? 'high' : event.riskScore > 30 ? 'medium' : 'low'}`}>
              {event.riskScore}% risk
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default CalendarDeadlines;
