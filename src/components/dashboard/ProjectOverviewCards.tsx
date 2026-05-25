import { useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../contexts/AppContext';
import ProgressRing from './ProgressRing';

const ProjectOverviewCards = () => {
  const ctx = useContext(AppContext);
  const navigate = useNavigate();
  if (!ctx) return null;
  const { projects, activeWorkspace } = ctx;

  const workspaceProjects = projects.filter((p) => p.workspaceId === activeWorkspace?.id);

  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="overline">Projects</div>
          <h2>Project Overview</h2>
        </div>
        <button className="glow-button secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => navigate('/projects')}>
          View all
        </button>
      </div>
      <div className="grid-columns">
        {workspaceProjects.map((project, i) => (
          <motion.div
            key={project.id}
            className="glass project-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => navigate(`/board?project=${project.id}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 6px' }}>{project.name}</h3>
                <p style={{ opacity: 0.7, fontSize: '0.85rem', margin: 0 }}>{project.stack.join(' · ')}</p>
              </div>
              <ProgressRing value={project.progress} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
              <span className="small-badge">{project.priority}</span>
              <span className={`status-pill risk-${project.riskLevel}`}>
                {project.riskLevel === 'high' ? '⚠ Risk' : project.riskLevel === 'medium' ? '◐ Watch' : '✓ Healthy'}
              </span>
              <span className="status-pill">Health {project.health}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', opacity: 0.75 }}>
              <span>Due {project.deadline}</span>
              <span>{project.openTasks} open tasks</span>
            </div>
            <div className="sprint-meter">
              <div className="sprint-meter-fill" style={{ width: `${project.progress}%` }} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProjectOverviewCards;
