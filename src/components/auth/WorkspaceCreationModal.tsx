import { useContext, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';

const WorkspaceCreationModal = () => {
  const ctx = useContext(AppContext);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'Public' | 'Private'>('Private');

  if (!ctx?.auth.needsWorkspaceSetup) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    ctx.createWorkspace(name.trim(), description.trim() || 'My workspace', type);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
        <div className="overline">Welcome aboard</div>
        <h2 style={{ margin: '8px 0 12px' }}>Create your workspace</h2>
        <p style={{ opacity: 0.75, marginBottom: 20, fontSize: '0.9rem' }}>
          Set up a home for your team before entering the dashboard.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <input
            className="input-field"
            placeholder="Workspace name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <textarea
            className="input-field"
            placeholder="Description (optional)"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <select className="input-field" value={type} onChange={(e) => setType(e.target.value as 'Public' | 'Private')}>
            <option value="Private">Private</option>
            <option value="Public">Public</option>
          </select>
          <button type="submit" className="glow-button" style={{ width: '100%', marginTop: 8 }}>
            Create workspace & continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceCreationModal;
