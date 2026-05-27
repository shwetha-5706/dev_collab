import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { AppContext } from '../contexts/AppContext';
import { ApiError } from '../api/client';
import AuthBackground from '../components/auth/AuthBackground';
import WorkspaceCreationModal from '../components/auth/WorkspaceCreationModal';

const socialOptions = [
  { label: 'Google', color: '#DE5246' },
  { label: 'GitHub', color: '#24292f' },
];

const AuthLanding: React.FC<{ verify?: boolean }> = ({ verify = false }) => {
  const ctx = useContext(AppContext);
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('devcollab_demo_otp');
    if (stored) setDemoOtp(stored);
  }, [verify]);

  useEffect(() => {
    if (ctx?.auth.isAuthenticated && !ctx.auth.needsWorkspaceSetup) {
      navigate('/dashboard');
    }
  }, [ctx?.auth.isAuthenticated, ctx?.auth.needsWorkspaceSetup, navigate]);

  if (!ctx) return null;

  const aiWelcome = (who: string) => {
    const hour = new Date().getHours();
    const timeGreet = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    return `Good ${timeGreet}, ${who}! Your AI copilot is ready — let's ship something amazing today.`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (verify) {
        await ctx.verifyOtp(otp);
        sessionStorage.removeItem('devcollab_demo_otp');
        return;
      }
      if (mode === 'signup') {
        const result = await ctx.signUp(email, password, name || undefined);
        if (!result.needsWorkspaceSetup) {
          setWelcomeMsg(aiWelcome(name || email.split('@')[0]));
          setTimeout(() => navigate('/dashboard'), 600);
        }
        return;
      }
      if (mode === 'forgot') {
        ctx.showToast('If that email exists, a reset link was sent.');
        return;
      }
      const loginResult = await ctx.signIn(email, password, rememberMe);
      if (loginResult.needsWorkspaceSetup) return;
      setWelcomeMsg(aiWelcome(name || email.split('@')[0]));
      setTimeout(() => navigate('/dashboard'), 600);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthBackground />
      <WorkspaceCreationModal />

      <div
        className="glass auth-card"
        style={{
          width: 'min(1024px, 100%)',
          padding: 36,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 28,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div>
          <div className="overline">DevCollab</div>
          <h1 style={{ margin: '18px 0 12px', fontSize: '2.2rem', lineHeight: 1.1 }}>
            Your AI-powered mission control for developer teams.
          </h1>
          <p className="auth-card-desc">
            Projects, tasks, real-time collaboration, AI insights, and productivity tracking — all in one futuristic dashboard.
          </p>
          <p className="demo-hint">
            Use any email and password to log in. New accounts are created automatically.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {socialOptions.map((opt) => (
              <button
                key={opt.label}
                className="glow-button"
                style={{ background: opt.color }}
                onClick={async () => {
                  setError('');
                  try {
                    await ctx.socialLogin(opt.label, email, rememberMe);
                    navigate('/dashboard');
                  } catch (err) {
                    setError(err instanceof ApiError ? err.message : 'Social login failed');
                  }
                }}
              >
                Continue with {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass" style={{ padding: 28 }}>
          <div className="overline">Authentication</div>
          {!verify && (
            <div style={{ display: 'flex', gap: 8, marginTop: 18, marginBottom: 22 }}>
              {(['login', 'signup', 'forgot'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setMode(opt)}
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    padding: '10px 12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: mode === opt ? 'rgba(93, 123, 255, 0.24)' : 'transparent',
                    color: 'inherit',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {verify && (
            <>
              <p style={{ marginTop: 18, marginBottom: 8, opacity: 0.8, fontSize: '0.9rem' }}>
                Enter the 6-digit code sent to {ctx.auth.pendingSignupEmail ?? email}
              </p>
              {demoOtp && (
                <p style={{ marginBottom: 16, fontSize: '0.85rem', color: '#b7c0ff' }}>
                  Dev OTP: <strong>{demoOtp}</strong>
                </p>
              )}
            </>
          )}

          {error && (
            <p className="form-error">{error}</p>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            {mode === 'signup' && !verify && (
              <input className="input-field" type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            )}
            {!verify && (
              <input className="input-field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            )}
            {mode !== 'forgot' && !verify && (
              <div className="password-field-wrap">
                <input
                  className="input-field"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeSlashIcon width={18} /> : <EyeIcon width={18} />}
                </button>
              </div>
            )}
            {verify && (
              <input className="input-field" type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
            )}
            {mode === 'login' && !verify && (
              <label className="remember-me">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                Remember me
              </label>
            )}
            <button type="submit" className="glow-button" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Please wait…' : verify ? 'Verify OTP' : mode === 'signup' ? 'Sign up' : mode === 'forgot' ? 'Send reset link' : 'Log in'}
            </button>
          </form>
          {welcomeMsg && <div className="auth-welcome-msg">{welcomeMsg}</div>}
        </div>
      </div>
    </div>
  );
};

export default AuthLanding;
