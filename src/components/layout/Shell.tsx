import { useContext, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  BellIcon,
  HomeIcon,
  RocketLaunchIcon,
  SparklesIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';
import { AppContext } from '../../contexts/AppContext';
import TopNavbar from './TopNavbar';
import Sidebar from './Sidebar';
import BackendStatusBar from './BackendStatusBar';
import Dashboard from '../../pages/Dashboard';
import KanbanBoard from '../../pages/KanbanBoard';
import ProjectsPage from '../../pages/ProjectsPage';
import SnippetsPage from '../../pages/SnippetsPage';
import WikiPage from '../../pages/WikiPage';
import AIAssistantPage from '../../pages/AIAssistantPage';
import ActivityFeedPage from '../../pages/ActivityFeedPage';
import AnalyticsPage from '../../pages/AnalyticsPage';
import TeamPage from '../../pages/TeamPage';
import NotificationsPage from '../../pages/NotificationsPage';
import SettingsPage from '../../pages/SettingsPage';
import ProfilePage from '../../pages/ProfilePage';
import CalendarPage from '../../pages/CalendarPage';
import NotificationPanel from '../dashboard/NotificationPanel';
import CommandPalette from '../dashboard/CommandPalette';
import QuickActionsFab from '../dashboard/QuickActionsFab';
import QuickActionModal from '../dashboard/QuickActionModal';

const mobileNav = [
  { path: '/dashboard', label: 'Home', icon: HomeIcon },
  { path: '/projects', label: 'Projects', icon: RocketLaunchIcon },
  { path: '/board', label: 'Tasks', icon: ViewColumnsIcon },
  { path: '/assistant', label: 'AI', icon: SparklesIcon },
  { path: '/notifications', label: 'Alerts', icon: BellIcon },
];

const Shell = () => {
  const ctx = useContext(AppContext);
  const location = useLocation();
  const [fabOpen, setFabOpen] = useState(false);

  if (!ctx) return null;

  const { theme, sidebarCollapsed, toggleSidebar, activeWorkspace } = ctx;
  const themeClass = theme === 'dark' ? 'theme-dark' : 'theme-light';

  return (
    <div className={`page-shell ${themeClass}`}>
      <BackendStatusBar />
      <TopNavbar />
      <div className="shell-body">
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} workspaceName={activeWorkspace?.name} />
        <main className="main-panel">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/board" element={<KanbanBoard />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/snippets" element={<SnippetsPage />} />
            <Route path="/wiki" element={<WikiPage />} />
            <Route path="/assistant" element={<AIAssistantPage />} />
            <Route path="/activity" element={<ActivityFeedPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      <nav className="mobile-bottom-nav glass">
        {mobileNav.map(({ path, label, icon: Icon }) => (
          <Link key={path} to={path} className={`mobile-nav-item ${location.pathname === path ? 'active' : ''}`}>
            <Icon width={22} />
            {label}
          </Link>
        ))}
      </nav>

      <NotificationPanel />
      <CommandPalette />
      <QuickActionsFab open={fabOpen} onToggle={() => setFabOpen(!fabOpen)} />
      <QuickActionModal />
    </div>
  );
};

export default Shell;
