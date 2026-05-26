import { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../../contexts/AppContext';

const UpcomingDeadlines = () => {
  const ctx = useContext(AppContext);
  if (!ctx) return null;
  const { calendarEvents, projects } = ctx;

  const upcoming = useMemo(
    () =>
      [...calendarEvents]
        .filter((e) => new Date(e.date) >= new Date(new Date().toISOString().slice(0, 10)))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 7),
    [calendarEvents]
  );

  return (
    <section className="dashboard-panel dashboard-panel-fill">
      <div className="dashboard-panel-head">
        <div>
          <p className="dashboard-eyebrow">Schedule</p>
          <h2 className="dashboard-panel-title">Upcoming</h2>
        </div>
        <Link to="/calendar" className="dashboard-text-link">Open calendar →</Link>
      </div>

      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
              <th>Project</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map((event) => {
              const project = projects.find((p) => p.id === event.projectId);
              return (
                <tr key={event.id}>
                  <td className="dashboard-table-primary">{event.title}</td>
                  <td className="dashboard-table-muted">{event.date}</td>
                  <td>{project?.name ?? '—'}</td>
                  <td><span className="dashboard-tag">{event.type}</span></td>
                </tr>
              );
            })}
            {upcoming.length === 0 && (
              <tr>
                <td colSpan={4} className="dashboard-table-empty">No upcoming deadlines</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default UpcomingDeadlines;
