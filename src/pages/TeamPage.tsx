import { useContext, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import UserAvatar from '../components/UserAvatar';

const ROLES = ['Owner', 'Admin', 'Member', 'Viewer'] as const;

const TeamPage = () => {
  const ctx = useContext(AppContext);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<(typeof ROLES)[number]>('Member');

  if (!ctx) return null;

  const { activeWorkspace, memberPresence, inviteMember, showToast } = ctx;

  const getPresence = (userId: string) => memberPresence.find((p) => p.userId === userId);

  const [inviteLink, setInviteLink] = useState('');

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    const link = await inviteMember(inviteEmail.trim(), inviteRole);
    if (link) setInviteLink(`${window.location.origin}${link}`);
    showToast(`Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
  };

  return (
    <div>
      <div className="page-header glass section" style={{ padding: 24, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="overline">Team Members</div>
            <h1 style={{ margin: '8px 0' }}>{activeWorkspace?.name} Team</h1>
            <p className="page-lead">
              {activeWorkspace?.members.length} members · Collaboration score {activeWorkspace?.settings.collaborationScore}%
            </p>
          </div>
        </div>
      </div>

      <div className="glass card section">
        <div className="overline">Invite Member</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <input className="input-field" placeholder="Email address" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
          <select className="input-field" style={{ width: 'auto' }} value={inviteRole} onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <button className="glow-button" onClick={handleInvite}>Send Invite</button>
        </div>
        {inviteLink && (
          <div className="comment-item" style={{ marginTop: 12, fontSize: '0.85rem' }}>
            <strong>Invite link (email):</strong>
            <div style={{ wordBreak: 'break-all', marginTop: 4, opacity: 0.85 }}>{inviteLink}</div>
          </div>
        )}
      </div>

      <div className="grid-columns">
        {(activeWorkspace?.members ?? []).map((member) => {
          const presence = getPresence(member.id);
          const statusClass = presence?.status.toLowerCase() ?? 'away';
          return (
            <div key={member.id} className="glass card team-member-card">
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ position: 'relative' }}>
                  <UserAvatar name={member.name} size="lg" />
                  <span className={`presence-dot ${statusClass}`} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong>{member.name}</strong>
                      <div style={{ fontSize: '0.82rem', opacity: 0.7 }}>{member.email}</div>
                    </div>
                    <span className={`status-pill ${statusClass}`}>{presence?.status ?? 'Offline'}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', opacity: 0.8, margin: '8px 0' }}>{member.bio}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {member.skills.map((s) => (
                      <span key={s} className="small-badge">{s}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.82rem', opacity: 0.75 }}>
                    <span className="small-badge">{member.role}</span>
                    <span>{member.streak} day streak</span>
                  </div>
                  {presence?.activity && (
                    <div className="text-xs-muted" style={{ marginTop: 8 }}>
                      {presence.activity}
                      {presence.viewingTask && ` · viewing "${presence.viewingTask}"`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamPage;
