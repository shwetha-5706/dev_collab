import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import UserAvatar from '../components/UserAvatar';

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

  useEffect(() => {
    ctx?.refreshBilling();
  }, []);

  if (!ctx) return null;

  const { activeWorkspace, theme, setTheme, auth, signOut, showToast, updateWorkspace, subscription, checkoutPro } = ctx;
  const usage = subscription.usage;

  return (
    <div>
      <div className="page-header glass section" style={{ padding: 24, borderRadius: 20 }}>
        <div className="overline">Settings</div>
        <h1 style={{ margin: '8px 0' }}>Workspace & Account</h1>
        <p className="page-lead">Manage workspace preferences, roles, and session settings</p>
      </div>

      <div className="grid-columns-2">
        <div className="glass card">
          <div className="overline">Workspace Settings</div>
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            <div>
              <label className="overline">Icon</label>
              <UserAvatar name={activeWorkspace?.name ?? 'Workspace'} size="lg" />
              <button
                className="glow-button secondary"
                style={{ marginTop: 8, padding: '8px 14px', fontSize: '0.82rem' }}
                onClick={() => updateWorkspace({ icon: (wsName.trim().charAt(0) || 'W').toUpperCase() })}
              >
                Use name initial as icon
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
            <button className="glow-button" onClick={() => updateWorkspace({ name: wsName, description: wsDesc, type: wsType, allowInvites })}>
              Save workspace
            </button>
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

          <button className="glow-button danger" style={{ marginTop: 20 }} onClick={signOut}>
            Sign out
          </button>
        </div>

        <div className="glass card" style={{ gridColumn: '1 / -1' }}>
          <div className="overline">Billing & Plans</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
            <div>
              <h2 style={{ margin: '0 0 8px', fontSize: '1.2rem' }}>
                Current plan: <span className={`small-badge ${subscription.plan === 'pro' ? 'priority-p0' : ''}`}>{subscription.plan.toUpperCase()}</span>
              </h2>
              <p style={{ opacity: 0.75, margin: 0, fontSize: '0.9rem' }}>
                {subscription.plan === 'free'
                  ? 'Free: 1 workspace, 3 projects, 5 members'
                  : 'Pro: Unlimited workspaces, projects, members + AI features'}
              </p>
            </div>
            {subscription.plan === 'free' && (
              <button className="glow-button" onClick={() => checkoutPro()}>
                Upgrade to Pro — Sandbox Checkout
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
            <div className="stat-card glass">
              <div className="stat-value">{usage?.workspaces ?? 1}/{subscription.limits.workspaces === Infinity ? '∞' : subscription.limits.workspaces}</div>
              <div className="stat-label">Workspaces</div>
            </div>
            <div className="stat-card glass">
              <div className="stat-value">{usage?.projects ?? 0}/{subscription.limits.projects === Infinity ? '∞' : subscription.limits.projects}</div>
              <div className="stat-label">Projects</div>
            </div>
            <div className="stat-card glass">
              <div className="stat-value">{usage?.members ?? 0}/{subscription.limits.members === Infinity ? '∞' : subscription.limits.members}</div>
              <div className="stat-label">Members</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
            <div className="comment-item">
              <strong>Free</strong>
              <ul style={{ fontSize: '0.85rem', opacity: 0.85, paddingLeft: 18, marginTop: 8 }}>
                <li>1 workspace</li>
                <li>3 projects</li>
                <li>5 members</li>
                <li>Basic collaboration</li>
              </ul>
            </div>
            <div className="comment-item" style={{ borderColor: 'rgba(148, 86, 255, 0.3)' }}>
              <strong>Pro — $12/mo (sandbox)</strong>
              <ul style={{ fontSize: '0.85rem', opacity: 0.85, paddingLeft: 18, marginTop: 8 }}>
                <li>Unlimited workspaces & projects</li>
                <li>Unlimited members</li>
                <li>AI assistant & code review</li>
                <li>Priority support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
