import { Link, useLocation } from 'react-router-dom';
import {
  BellIcon,
  BookOpenIcon,
  CalendarIcon,
  ChartBarIcon,
  ChevronDoubleLeftIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CodeBracketIcon,
  HomeIcon,
  RocketLaunchIcon,
  SparklesIcon,
  UserGroupIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';
import { aiShortcuts, recentRoutes } from '../../data/mock';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { path: '/projects', label: 'Projects', icon: RocketLaunchIcon },
  { path: '/board', label: 'Tasks', icon: ViewColumnsIcon },
  { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { path: '/snippets', label: 'Snippets', icon: CodeBracketIcon },
  { path: '/wiki', label: 'Wiki Docs', icon: BookOpenIcon },
  { path: '/assistant', label: 'AI Assistant', icon: SparklesIcon },
  { path: '/activity', label: 'Activity Feed', icon: ClipboardDocumentListIcon },
  { path: '/analytics', label: 'Analytics', icon: ChartBarIcon },
  { path: '/team', label: 'Team Members', icon: UserGroupIcon },
  { path: '/notifications', label: 'Notifications', icon: BellIcon },
  { path: '/settings', label: 'Settings', icon: Cog6ToothIcon },
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  workspaceName?: string;
};

const Sidebar = ({ collapsed, onToggle, workspaceName }: SidebarProps) => {
  const location = useLocation();

  return (
    <aside className={`sidebar glass ${collapsed ? 'collapsed' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', marginBottom: 20 }}>
        {!collapsed && (
          <div>
            <div className="overline">DevCollab</div>
            <h2 style={{ margin: '6px 0 0', fontSize: '1.1rem' }}>{workspaceName}</h2>
          </div>
        )}
        <button className="icon-button" onClick={onToggle} title="Collapse sidebar">
          <ChevronDoubleLeftIcon width={18} style={{ transform: collapsed ? 'rotate(180deg)' : undefined, transition: 'transform 0.3s' }} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`sidebar-link ${location.pathname === path ? 'active' : ''}`}
            title={label}
          >
            <Icon />
            {!collapsed && label}
          </Link>
        ))}

        {!collapsed && (
          <>
            <div className="sidebar-section-label">Recently visited</div>
            {recentRoutes.map((route) => (
              <Link key={route.path} to={route.path} className="sidebar-link" style={{ fontSize: '0.85rem', opacity: 0.85 }}>
                {route.label}
              </Link>
            ))}

            <div className="sidebar-section-label">AI shortcuts</div>
            {aiShortcuts.map((shortcut) => (
              <Link key={shortcut.path} to={shortcut.path} className="sidebar-link" style={{ fontSize: '0.85rem', opacity: 0.85 }}>
                <SparklesIcon width={16} />
                {shortcut.label}
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
