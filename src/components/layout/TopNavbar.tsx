import { useContext, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BellIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SparklesIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import { AppContext } from '../../contexts/AppContext';
import UserAvatar from '../UserAvatar';

const TopNavbar = () => {
  const ctx = useContext(AppContext);
  const navigate = useNavigate();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  if (!ctx) return null;

  const {
    auth,
    workspaces,
    activeWorkspace,
    notifications,
    theme,
    searchQuery,
    searchResults,
    setSearchQuery,
    setTheme,
    setNotificationPanelOpen,
    notificationPanelOpen,
    setCommandPaletteOpen,
    selectWorkspace,
    signOut,
  } = ctx;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="top-navbar glass">
      <div className="workspace-switcher" onClick={() => setWorkspaceOpen(!workspaceOpen)}>
        <UserAvatar name={activeWorkspace?.name ?? 'W'} size="sm" noBorder className="workspace-icon-avatar" />
        <span>{activeWorkspace?.name}</span>
        {workspaceOpen && (
          <div className="workspace-dropdown glass" onClick={(e) => e.stopPropagation()}>
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className={`workspace-option ${ws.id === activeWorkspace?.id ? 'active' : ''}`}
                onClick={() => {
                  selectWorkspace(ws.id);
                  setWorkspaceOpen(false);
                }}
              >
                <UserAvatar name={ws.name} size="sm" noBorder />
                <div>
                  <strong>{ws.name}</strong>
                  <div className="text-xs-muted">{ws.members.length} members</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="navbar-search" ref={searchRef}>
        <MagnifyingGlassIcon />
        <input
          placeholder="Search tasks, projects, docs… (⌘K)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
        />
        {searchFocused && searchResults.length > 0 && (
          <div className="search-dropdown glass">
            {searchResults.map((result) => (
              <div key={result.id} className="search-result-item">
                <span className="small-badge">{result.type}</span>
                <div>
                  <strong>{result.title}</strong>
                  <div className="text-xs-muted">{result.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="navbar-actions">
        <button className="icon-button" title="AI Search" onClick={() => setCommandPaletteOpen(true)}>
          <SparklesIcon width={20} />
        </button>
        <button
          className="icon-button"
          title="Notifications"
          onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
        >
          <BellIcon width={20} />
          {unreadCount > 0 && <span className="notification-pulse" />}
        </button>
        <button className="icon-button" title="Settings" onClick={() => navigate('/settings')}>
          <Cog6ToothIcon width={20} />
        </button>
        <button
          className="icon-button"
          title="Toggle theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <SunIcon width={20} /> : <MoonIcon width={20} />}
        </button>

        <div className="profile-dropdown-wrap">
          <button className="icon-button" onClick={() => setProfileOpen(!profileOpen)} style={{ padding: 4 }}>
            <UserAvatar name={auth.user?.name ?? 'User'} size="sm" noBorder />
          </button>
          {profileOpen && (
            <div className="profile-menu glass">
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-glass)' }}>
                <strong>{auth.user?.name}</strong>
                <div className="text-xs-muted">{auth.user?.email}</div>
                <div className="small-badge" style={{ marginTop: 8 }}>
                  {auth.user?.streak} day streak
                </div>
              </div>
              {auth.user?.badges?.map((badge) => (
                <div key={badge} className="small-badge" style={{ margin: '8px 12px 0' }}>
                  {badge}
                </div>
              ))}
              <Link to="/profile" className="profile-menu-item" onClick={() => setProfileOpen(false)}>
                My Profile
              </Link>
              <Link to="/board" className="profile-menu-item" onClick={() => setProfileOpen(false)}>
                My Tasks
              </Link>
              <Link to="/settings" className="profile-menu-item" onClick={() => setProfileOpen(false)}>
                Settings
              </Link>
              <button
                className="profile-menu-item"
                onClick={() => {
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                  setProfileOpen(false);
                }}
              >
                Appearance
              </button>
              <button
                className="profile-menu-item danger"
                onClick={() => {
                  signOut();
                  navigate('/');
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
