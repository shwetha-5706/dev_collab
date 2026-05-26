import { useContext, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SparklesIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { AppContext } from '../contexts/AppContext';
import { ApiError } from '../api/client';
import type { Project } from '../types';

const ProjectsPage = () => {
  const ctx = useContext(AppContext);
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    deadline: '',
    stack: '',
    priority: 'P2' as Project['priority'],
    visibility: 'Private' as Project['visibility'],
  });

  if (!ctx) return null;

  const { projects, activeWorkspace, createProject, updateProject, deleteProject, tasks, showToast, setQuickActionModal } = ctx;

  const workspaceProjects = useMemo(
    () => projects.filter((p) => p.workspaceId === activeWorkspace?.id),
    [projects, activeWorkspace]
  );

  const resetForm = () => {
    setForm({ name: '', deadline: '', stack: '', priority: 'P2', visibility: 'Private' });
    setShowCreate(false);
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showToast('Enter a project name');
      return;
    }
    if (!activeWorkspace) {
      showToast('No workspace selected');
      return;
    }

    const stack = form.stack.split(',').map((s) => s.trim()).filter(Boolean);
    setSubmitting(true);
    try {
      if (editId) {
        await updateProject(editId, {
          name: form.name.trim(),
          deadline: form.deadline || new Date().toISOString().slice(0, 10),
          stack,
          priority: form.priority,
          visibility: form.visibility,
        });
        showToast('Project updated');
        resetForm();
      } else {
        const project = await createProject({
          name: form.name.trim(),
          deadline: form.deadline || new Date().toISOString().slice(0, 10),
          stack,
          priority: form.priority,
          visibility: form.visibility,
        });
        showToast(`Project "${project?.name}" created`);
        resetForm();
        navigate('/board');
      }
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      showToast('Project deleted');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to delete project');
    }
  };

  const startEdit = (p: Project) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      deadline: p.deadline,
      stack: p.stack.join(', '),
      priority: p.priority,
      visibility: p.visibility,
    });
    setShowCreate(true);
  };

  const predictCompletion = (p: Project) => {
    const daysLeft = Math.max(0, Math.ceil((new Date(p.deadline).getTime() - Date.now()) / 86400000));
    const rate = p.progress / Math.max(1, 100 - daysLeft);
    return Math.min(99, Math.round(p.progress + rate * daysLeft * 0.3));
  };

  return (
    <div>
      <div className="page-header glass section" style={{ padding: 24, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="overline">Project Management</div>
            <h1 style={{ margin: '8px 0' }}>Projects</h1>
            <p className="page-lead">
              {workspaceProjects.length} active projects · Collaboration score {activeWorkspace?.settings.collaborationScore ?? 0}%
            </p>
          </div>
          <button className="glow-button" onClick={() => { resetForm(); setShowCreate(true); }}>
            + New Project
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="glass card section">
          <h2 style={{ margin: '0 0 16px' }}>{editId ? 'Edit Project' : 'Create Project'}</h2>
          <div className="form-grid">
            <input className="input-field" placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input-field" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            <input className="input-field" placeholder="Tech stack (comma-separated)" value={form.stack} onChange={(e) => setForm({ ...form, stack: e.target.value })} />
            <select className="input-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Project['priority'] })}>
              <option value="P0">P0 — Critical</option>
              <option value="P1">P1 — High</option>
              <option value="P2">P2 — Normal</option>
            </select>
            <select className="input-field" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as Project['visibility'] })}>
              <option value="Private">Private</option>
              <option value="Public">Public</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="glow-button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving…' : editId ? 'Save' : 'Create & open board'}
            </button>
            <button className="glow-button secondary" onClick={resetForm} disabled={submitting}>Cancel</button>
          </div>
        </div>
      )}

      {workspaceProjects.length === 0 && !showCreate && (
        <div className="glass card section" style={{ textAlign: 'center', padding: 40 }}>
          <h2 style={{ margin: '0 0 8px' }}>No projects yet</h2>
          <p className="page-lead" style={{ marginBottom: 20 }}>
            Create your first project to add tasks, track progress, and collaborate with your team.
          </p>
          <button className="glow-button" onClick={() => setShowCreate(true)}>Create your first project</button>
        </div>
      )}

      <div className="projects-list">
        {workspaceProjects.map((p, i) => {
          const projectTasks = tasks.filter((t) => t.projectId === p.id);
          const done = projectTasks.filter((t) => t.status === 'Done').length;
          const predicted = predictCompletion(p);
          return (
            <motion.div
              key={p.id}
              className="glass project-card-full section"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="project-card-list">
                <div className="project-banner" style={{ backgroundImage: `url(${p.banner})` }} />
                <div className="project-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <h2 style={{ margin: '0 0 6px' }}>{p.name}</h2>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className={`small-badge priority-${p.priority.toLowerCase()}`}>{p.priority}</span>
                        <span className="small-badge">{p.visibility}</span>
                        <span className={`small-badge risk-${p.riskLevel}`}>Risk: {p.riskLevel}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="stat-value" style={{ fontSize: '1.5rem' }}>{p.health}%</div>
                      <div className="stat-label">Health</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0' }}>
                    {p.stack.map((s) => (
                      <span key={s} className="small-badge">{s}</span>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '16px 0' }}>
                    <div>
                      <div className="overline">Progress</div>
                      <div className="sprint-meter"><div className="sprint-meter-fill" style={{ width: `${p.progress}%` }} /></div>
                      <div style={{ fontSize: '0.82rem', marginTop: 4 }}>{p.progress}% complete</div>
                    </div>
                    <div>
                      <div className="overline">Tasks</div>
                      <div>{done}/{projectTasks.length} done · {p.openTasks} open</div>
                    </div>
                    <div>
                      <div className="overline">Deadline</div>
                      <div>{p.deadline}</div>
                    </div>
                  </div>

                  <div className="ai-insight-box">
                    <SparklesIcon width={16} />
                    <span>AI predicts {predicted}% completion by deadline · Owner: {p.owner}</span>
                  </div>

                  <div className="project-card-actions">
                    <Link to="/board" className="glow-button secondary" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
                      Open board
                    </Link>
                    <button
                      className="glow-button secondary"
                      style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                      onClick={() => setQuickActionModal('task', p.id)}
                    >
                      Add task
                    </button>
                    <button className="icon-button" onClick={() => startEdit(p)} title="Edit">
                      <PencilIcon width={16} />
                    </button>
                    <button className="icon-button danger" onClick={() => handleDelete(p.id)} title="Delete">
                      <TrashIcon width={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectsPage;
