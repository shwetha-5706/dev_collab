import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../../contexts/AppContext';

const ProjectOverviewCards = () => {
  const ctx = useContext(AppContext);
  const navigate = useNavigate();
  if (!ctx) return null;
  const { projects, activeWorkspace } = ctx;

  const workspaceProjects = projects.filter((p) => p.workspaceId === activeWorkspace?.id);

  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-head">
        <div>
          <p className="dashboard-eyebrow">Portfolio</p>
          <h2 className="dashboard-panel-title">Projects</h2>
        </div>
        <Link to="/projects" className="dashboard-text-link">View all →</Link>
      </div>

      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Progress</th>
              <th>Priority</th>
              <th>Open tasks</th>
              <th>Deadline</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {workspaceProjects.slice(0, 6).map((project) => (
              <tr
                key={project.id}
                className="dashboard-table-clickable"
                onClick={() => navigate(`/board?project=${project.id}`)}
              >
                <td className="dashboard-table-primary">{project.name}</td>
                <td>
                  <div className="dashboard-progress-cell">
                    <div className="dashboard-progress-bar">
                      <div className="dashboard-progress-fill" style={{ width: `${project.progress}%` }} />
                    </div>
                    <span className="dashboard-table-muted">{project.progress}%</span>
                  </div>
                </td>
                <td><span className={`dashboard-tag priority-${project.priority.toLowerCase()}`}>{project.priority}</span></td>
                <td>{project.openTasks}</td>
                <td className="dashboard-table-muted">{project.deadline}</td>
                <td>
                  <span className={`dashboard-tag status-${project.riskLevel}`}>
                    {project.riskLevel === 'high' ? 'At risk' : project.riskLevel === 'medium' ? 'Watch' : 'On track'}
                  </span>
                </td>
              </tr>
            ))}
            {workspaceProjects.length === 0 && (
              <tr>
                <td colSpan={6} className="dashboard-table-empty">No projects yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ProjectOverviewCards;
