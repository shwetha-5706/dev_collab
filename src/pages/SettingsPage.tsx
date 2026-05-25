import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../contexts/AppContext';

const SettingsPage = () => {
  const ctx = useContext(AppContext);
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [wsType, setWsType] = useState<'Public' | 'Private'>('Private');
  const [allowInvites, setAllowInvites] = useState(true);

  useEffect(() => {
    const ws = ctx?.activeWorkspace;
    if (ws) {
      setWsName(ws.name);
      setWsDesc(ws.description);
      setWsType(ws.type);
      setAllowInvites(ws.settings.allowInvites);
    }
  }, [ctx?.activeWorkspace]);

  if (!ctx) return null;

  const { activeWorkspace, theme, setTheme, auth, signOut, showToast } = ctx;

  return (
    <div>
      <div className="page-header glass section" style={{ padding: 24, borderRadius: 20 }}>
        <div className="overline">Settings</div>
        <h1 style={{ margin: '8px 0' }}>Workspace & Account</h1>
        <p style={{ opacity: 0.75, margin: 0 }}>Manage workspace preferences, roles, and session settings</p>
      </div>

      <div className="grid-columns-2">
        <div className="glass card">
          <div className="overline">Workspace Settings</div>
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            <div>
              <label className="overline">Icon</label>
              <div style={{ fontSize: '2rem', marginTop: 8 }}>{activeWorkspace?.icon ?? '🚀'}</div>
              <button className="glow-button secondary" style={{ marginTop: 8, padding: '8px 14px', fontSize: '0.82rem' }} onClick={() => showToast('Icon upload (mock)')}>
                Upload icon
              </button>
            </div>
            <input className="input-field" placeholder="Workspace name" value={wsName} onChange={(e) => setWsName(e.target.value)} />
            <textarea className="input-field" placeholder="Team description" rows={3} value={wsDesc} onChange={(e) => setWsDesc(e.target.value)} />
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="radio" checked={wsType === 'Private'} onChange={() => setWsType('Private')} />
                Private
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="radio" checked={wsType === 'Public'} onChange={() => setWsType('Public')} />
                Public
              </label>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={allowInvites} onChange={(e) => setAllowInvites(e.target.checked)} />
              Allow member invites
            </label>
            <button className="glow-button" onClick={() => showToast('Workspace settings saved')}>Save workspace</button>
          </div>
        </div>

        <div className="glass card">
          <div className="overline">Appearance</div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className={`filter-tab ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>Dark mode</button>
              <button className={`filter-tab ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>Light mode</button>
            </div>
          </div>

          <div className="overline" style={{ marginTop: 28 }}>Session & Devices</div>
          <div className="comment-item" style={{ marginTop: 12 }}>
            <strong>Current session</strong>
            <div style={{ fontSize: '0.82rem', opacity: 0.7, marginTop: 4 }}>
              {auth.user?.email} · Active now · Windows
            </div>
          </div>
          <div className="comment-item">
            <strong>Remember me</strong>
            <div style={{ fontSize: '0.82rem', opacity: 0.7, marginTop: 4 }}>
              {auth.rememberMe ? 'Enabled — session persists across visits' : 'Disabled'}
            </div>
          </div>

          <div className="overline" style={{ marginTop: 28 }}>Role Permissions</div>
          <ul style={{ fontSize: '0.88rem', opacity: 0.85, paddingLeft: 18, marginTop: 12 }}>
            <li><strong>Owner</strong> — Full control, billing, delete workspace</li>
            <li><strong>Admin</strong> — Manage members, projects, settings</li>
            <li><strong>Member</strong> — Create/edit tasks and docs</li>
            <li><strong>Viewer</strong> — Read-only access</li>
          </ul>

          <button className="glow-button secondary" style={{ marginTop: 20, color: '#fca5a5' }} onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
