import { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import UserAvatar from '../components/UserAvatar';

const SKILLS_OPTIONS = ['React', 'TypeScript', 'Node.js', 'Python', 'Docker', 'AWS', 'Figma', 'CSS', 'Go', 'Java'];

const ProfilePage = () => {
  const ctx = useContext(AppContext);
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [github, setGithub] = useState('');

  const user = ctx?.auth.user;

  useEffect(() => {
    if (user?.github) setGithub(user.github);
  }, [user?.github]);

  if (!ctx) return null;

  const { tasks, updateProfile } = ctx;

  const stats = useMemo(() => {
    const assigned = tasks.filter((t) => t.assignees.some((a) => a.id === user?.id));
    const done = assigned.filter((t) => t.status === 'Done');
    return {
      assigned: assigned.length,
      completed: done.length,
      rate: assigned.length ? Math.round((done.length / assigned.length) * 100) : 0,
    };
  }, [tasks, user?.id]);

  const skillRadar = skills.length ? skills : user?.skills ?? [];

  useEffect(() => {
    if (user?.github) setGithub(user.github);
  }, [user?.github]);

  const toggleSkill = (s: string) => {
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  return (
    <div>
      <div className="hero-panel glass section">
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <UserAvatar name={user?.name ?? 'User'} size="xl" />
          <div style={{ flex: 1 }}>
            <div className="overline">Developer Profile</div>
            <h1 style={{ margin: '8px 0' }}>{user?.name}</h1>
            <p className="text-secondary">{user?.email}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <span className="small-badge">{user?.role}</span>
              <span className="small-badge">{user?.streak ?? 0} day streak</span>
              {user?.badges?.map((b) => (
                <span key={b} className="small-badge">{b}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
            <div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{stats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{stats.assigned}</div>
              <div className="stat-label">Assigned</div>
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{stats.rate}%</div>
              <div className="stat-label">Rate</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-columns-2">
        <div className="glass card">
          <div className="overline">Edit Profile</div>
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            <textarea
              className="input-field"
              placeholder="Bio"
              rows={3}
              defaultValue={user?.bio}
              value={bio || user?.bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <input
              className="input-field"
              placeholder="GitHub username"
              value={github || user?.github || ''}
              onChange={(e) => setGithub(e.target.value)}
            />
            {github && (
              <a href={`https://github.com/${github}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                github.com/{github}
              </a>
            )}
            <button className="glow-button" onClick={() => updateProfile({ bio: bio || user?.bio, skills: skillRadar, github: github || user?.github })}>
              Save profile
            </button>
          </div>

          <div className="overline" style={{ marginTop: 24 }}>Skills</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {SKILLS_OPTIONS.map((s) => (
              <button
                key={s}
                className={`filter-tab ${skillRadar.includes(s) ? 'active' : ''}`}
                onClick={() => toggleSkill(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="glass card">
          <div className="overline">Skill Radar</div>
          <div className="skill-radar" style={{ marginTop: 20 }}>
            {skillRadar.map((s, i) => {
              const angle = (i / skillRadar.length) * 360;
              const level = 40 + (i * 13) % 60;
              return (
                <div
                  key={s}
                  className="radar-point"
                  style={{
                    transform: `rotate(${angle}deg) translateY(-${level}px)`,
                  }}
                  title={s}
                >
                  <span style={{ transform: `rotate(-${angle}deg)`, display: 'block', fontSize: '0.72rem' }}>{s}</span>
                </div>
              );
            })}
            <div className="radar-center">AI</div>
          </div>

          <div className="ai-insight-box" style={{ marginTop: 24 }}>
            AI Insight: Strong in {skillRadar.slice(0, 2).join(' & ') || 'full-stack development'}. Consider mentoring on upcoming sprints.
          </div>

          <div className="overline" style={{ marginTop: 24 }}>Contribution Graph</div>
          <div className="contribution-graph" style={{ marginTop: 12 }}>
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} className={`contribution-cell heatmap-cell level-${(i + stats.completed) % 5}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
