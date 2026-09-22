import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, Sun, Moon, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AccountMenu } from '../AccountMenu/AccountMenu';
import { useGuide } from '../../../context/GuideContext';
import { useTheme } from '../../../context/ThemeContext';
import { APP_NAVIGATION } from '../../../constants/navigation';
import { notificationService } from '../../../services/notifications/notification.service';
import { NotificationCenterDrawer } from '../NotificationCenter/NotificationCenterDrawer';
import './AppHeader.css';

export interface AppHeaderProps {
  onOpenSearch?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenSearch }) => {
  const location = useLocation();
  const { openGuide } = useGuide();
  const { isDark, toggleTheme } = useTheme();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(() => notificationService.getUnreadCount());

  useEffect(() => {
    const unsub = notificationService.subscribe(() => {
      setUnreadCount(notificationService.getUnreadCount());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentNav = useMemo(() => {
    for (const section of APP_NAVIGATION) {
      for (const item of section.items) {
        if (location.pathname === item.path || (item.path !== '/app/dashboard' && location.pathname.startsWith(item.path))) {
          return item;
        }
      }
    }
    return { label: 'Today' };
  }, [location.pathname]);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(currentDate);

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(currentDate);

  return (
    <header className="solis-app-header">
      <div className="solis-app-header__left">
        <nav className="solis-app-header__breadcrumbs" aria-label="Breadcrumb">
          <Link
            to="/app/dashboard"
            className="solis-app-header__breadcrumb-root"
            title="Go to Today Cockpit"
          >
            Solis
          </Link>
          <span className="solis-app-header__breadcrumb-sep" aria-hidden="true">/</span>
          <span className="solis-app-header__breadcrumb-current" aria-current="page">
            {currentNav.label}
          </span>
        </nav>

        <div className="solis-app-header__date">
          <span className="solis-app-header__time-dot" aria-hidden="true">·</span>
          <span className="solis-app-header__date-day">{formattedDate}</span>
          <span className="solis-app-header__time-dot" aria-hidden="true">·</span>
          <span className="solis-app-header__time">{formattedTime}</span>
        </div>
      </div>

      <div className="solis-app-header__right">
        <button
          type="button"
          className="solis-app-header__search-btn"
          onClick={onOpenSearch}
          title="Search workspace (Cmd + K)"
          aria-label="Search workspace"
        >
          <Search size={13} />
          <span className="solis-app-header__search-label">Search workspace</span>
          <kbd className="solis-app-header__kbd">⌘K</kbd>
        </button>

        <div className="solis-app-header__icon-btn-wrap">
          <button
            type="button"
            className="solis-app-header__icon-btn tactile-press"
            onClick={() => setIsNotifDrawerOpen(true)}
            title="Notifications & Alerts"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell size={15} />
          </button>
          {unreadCount > 0 && (
            <span className="solis-app-header__badge" aria-hidden="true">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        <button
          type="button"
          className="solis-app-header__icon-btn tactile-press"
          onClick={() => openGuide()}
          title="Guides & Operating Philosophy"
          aria-label="Open Guides"
        >
          <BookOpen size={15} />
        </button>

        <button
          type="button"
          className="solis-app-header__icon-btn tactile-press"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Warm Ivory (Day Flow)' : 'Switch to Deep Charcoal (Night Sanctuary)'}
          aria-label={isDark ? 'Switch to Warm Ivory theme' : 'Switch to Deep Charcoal theme'}
        >
          {isDark ? <Sun size={15} className="solis-theme-icon solis-theme-icon--sun" /> : <Moon size={15} className="solis-theme-icon solis-theme-icon--moon" />}
        </button>

        <AccountMenu />
      </div>

      <NotificationCenterDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
      />
    </header>
  );
};
