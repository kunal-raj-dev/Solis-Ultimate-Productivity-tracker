import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  BookOpen,
  Flame,
  Repeat,
  Target,
  BarChart3,
  FileText,
  Sliders,
  LogOut,
  Loader2,
  Sparkles,
  Users,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { APP_NAVIGATION } from '../../../constants/navigation';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { Avatar } from '../../ui/Avatar/Avatar';
import { Logo } from '../../ui/Logo/Logo';
import { cn } from '../../../utils/classNames';
import { prefetchRoute } from '../../../utils/prefetch';
import './Sidebar.css';

const ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
  Compass,
  CheckCircle2,
  BookOpen,
  Flame,
  Repeat,
  Target,
  BarChart3,
  FileText,
  Sliders,
  Sparkles,
  Users
};

export interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onToggleCollapse }) => {
  const { summary } = useData();
  const { user, logout, isLoggingOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const hasMomentumData = Boolean(
    summary && (summary.totalTasksCount > 0 || summary.totalStudyMinutes > 0 || summary.focusSessionsCount > 0)
  );
  const momentumScore = summary?.momentumScore ?? 0;
  const pendingTasks = summary ? Math.max(0, summary.totalTasksCount - summary.completedTasksCount) : 0;

  const handleLogout = async () => {
    try {
      await logout();
      addToast({
        title: 'Signed out',
        description: 'Your study session has ended securely.',
        type: 'info'
      });
      navigate('/auth/login', { replace: true });
    } catch {
      navigate('/auth/login', { replace: true });
    }
  };

  const displayName = user?.name || 'Solis Scholar';
  const displayEmail = user?.email || 'scholar@solis.space';

  return (
    <aside className={cn('solis-sidebar', isCollapsed && 'solis-sidebar--collapsed')}>
      <div className="solis-sidebar__brand">
        {!isCollapsed ? (
          <Logo to="/app/dashboard" size="md" showBadge={true} badgeText="Solis OS" />
        ) : (
          <Logo to="/app/dashboard" size="sm" showBadge={false} showWordmark={false} />
        )}
        {onToggleCollapse && (
          <button
            type="button"
            className="solis-sidebar__collapse-toggle tactile-press"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar (⌘\\)' : 'Collapse sidebar to rail (⌘\\)'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
      </div>

      <nav className="solis-sidebar__nav" aria-label="Main Navigation">
        {APP_NAVIGATION.map((section) => (
          <div key={section.id} className="solis-sidebar__section">
            {!isCollapsed && section.title && (
              <div className="solis-sidebar__section-title">{section.title}</div>
            )}
            <div className="solis-sidebar__list">
              {section.items.map((item) => {
                const IconComponent = ICON_MAP[item.iconName] || Compass;
                const badgeValue = item.id === 'tasks' ? pendingTasks : item.badge;

                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    aria-label={isCollapsed ? item.label : undefined}
                    onMouseEnter={() => prefetchRoute(item.id)}
                    onFocus={() => prefetchRoute(item.id)}
                    className={({ isActive }) =>
                      cn(
                        'solis-sidebar__link',
                        isActive && 'solis-sidebar__link--active'
                      )
                    }
                  >
                    <span className="solis-sidebar__icon">
                      <IconComponent size={18} />
                    </span>
                    {!isCollapsed && <span>{item.label}</span>}
                    {badgeValue !== undefined && Boolean(badgeValue) && (
                      <span className="solis-sidebar__link-badge">{badgeValue}</span>
                    )}
                    {isCollapsed && (
                      <div className="solis-sidebar__rail-tooltip" role="tooltip">
                        <span className="solis-sidebar__rail-tooltip-label">{item.label}</span>
                        {badgeValue !== undefined && Boolean(badgeValue) && (
                          <span className="solis-sidebar__rail-tooltip-badge">{badgeValue}</span>
                        )}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Momentum summary pod */}
      {!isCollapsed ? (
        <div className="solis-sidebar__momentum-pod">
          <div className="solis-sidebar__momentum-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={14} color="var(--color-coral-500)" />
              <span style={{ fontSize: 'var(--text-micro)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                {hasMomentumData ? 'Momentum' : 'Rhythm Forming'}
              </span>
            </div>
            <span style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {hasMomentumData ? `${momentumScore}%` : '—'}
            </span>
          </div>
          <div className="solis-sidebar__momentum-bar">
            <div
              className="solis-sidebar__momentum-fill"
              style={{ width: hasMomentumData ? `${momentumScore}%` : '0%' }}
            />
          </div>
        </div>
      ) : (
        <div className="solis-sidebar__momentum-mini" title={`Momentum: ${hasMomentumData ? `${momentumScore}%` : 'Forming'}`}>
          <div
            className="solis-sidebar__momentum-mini-fill"
            style={{ height: hasMomentumData ? `${Math.max(10, momentumScore)}%` : '15%' }}
          />
        </div>
      )}

      {/* Footer Profile & Logout */}
      <div className="solis-sidebar__footer">
        <div className="solis-sidebar__user">
          <Avatar name={displayName} size="sm" />
          {!isCollapsed && (
            <div className="solis-sidebar__user-info">
              <span className="solis-sidebar__user-name">{displayName}</span>
              <span className="solis-sidebar__user-email">{displayEmail}</span>
            </div>
          )}
        </div>

        {!isCollapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              className="solis-sidebar__logout-btn tactile-press"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Warm Ivory (Day Flow)' : 'Switch to Deep Charcoal (Night Sanctuary)'}
              aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? <Sun size={15} style={{ color: 'var(--color-amber-400)' }} /> : <Moon size={15} style={{ color: 'var(--color-lavender-400)' }} />}
            </button>

            <button
              className="solis-sidebar__logout-btn tactile-press"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Sign out of Solis"
              aria-label="Sign out"
            >
              {isLoggingOut ? <Loader2 size={16} className="solis-spin" /> : <LogOut size={16} />}
            </button>
          </div>
        ) : (
          <div className="solis-sidebar__collapsed-actions">
            <button
              className="solis-sidebar__logout-btn tactile-press"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Warm Ivory' : 'Switch to Deep Charcoal'}
              aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? <Sun size={14} style={{ color: 'var(--color-amber-400)' }} /> : <Moon size={14} style={{ color: 'var(--color-lavender-400)' }} />}
            </button>

            <button
              className="solis-sidebar__logout-btn tactile-press"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Sign out"
              aria-label="Sign out"
            >
              {isLoggingOut ? <Loader2 size={14} className="solis-spin" /> : <LogOut size={14} />}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
