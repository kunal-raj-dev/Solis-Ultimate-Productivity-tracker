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
  Sparkles
} from 'lucide-react';
import { APP_NAVIGATION } from '../../../constants/navigation';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
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
  Sparkles
};

export const Sidebar: React.FC = () => {
  const { summary } = useData();
  const { user, logout, isLoggingOut } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const momentumScore = summary?.momentumScore ?? 84;
  const pendingTasks = summary ? Math.max(0, summary.totalTasksCount - summary.completedTasksCount) : 3;

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
    <aside className="solis-sidebar">
      <div className="solis-sidebar__brand">
        <Logo to="/app/dashboard" size="md" showBadge={true} badgeText="Solis OS" />
      </div>

      <nav className="solis-sidebar__nav" aria-label="Main Navigation">
        {APP_NAVIGATION.map((section) => (
          <div key={section.id} className="solis-sidebar__section">
            {section.title && (
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
                    <span>{item.label}</span>
                    {badgeValue !== undefined && Boolean(badgeValue) && (
                      <span className="solis-sidebar__link-badge">{badgeValue}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Momentum summary pod */}
      <div className="solis-sidebar__momentum-pod">
        <div className="solis-sidebar__momentum-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={14} color="var(--color-coral-500)" />
            <span style={{ fontSize: 'var(--text-micro)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
              Momentum
            </span>
          </div>
          <span style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {momentumScore}%
          </span>
        </div>
        <div className="solis-sidebar__momentum-bar">
          <div
            className="solis-sidebar__momentum-fill"
            style={{ width: `${momentumScore}%` }}
          />
        </div>
      </div>

      {/* Footer Profile & Logout */}
      <div className="solis-sidebar__footer">
        <div className="solis-sidebar__user">
          <Avatar name={displayName} size="sm" />
          <div className="solis-sidebar__user-info">
            <span className="solis-sidebar__user-name">{displayName}</span>
            <span className="solis-sidebar__user-email">{displayEmail}</span>
          </div>
        </div>

        <button
          className="solis-sidebar__logout-btn"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Sign out of Solis"
          aria-label="Sign out"
        >
          {isLoggingOut ? <Loader2 size={16} className="solis-spin" /> : <LogOut size={16} />}
        </button>
      </div>
    </aside>
  );
};
