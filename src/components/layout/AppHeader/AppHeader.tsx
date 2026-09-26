import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, Sun, Moon, Bell, Sparkles, Radio } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AccountMenu } from '../AccountMenu/AccountMenu';
import { useGuide } from '../../../context/GuideContext';
import { useTheme } from '../../../context/ThemeContext';
import { APP_NAVIGATION } from '../../../constants/navigation';
import { notificationService } from '../../../services/notifications/notification.service';
import { NotificationCenterDrawer } from '../NotificationCenter/NotificationCenterDrawer';
import { dataService } from '../../../services/dataService';
import { countScholarsFocusingNow } from '../../../types/studyPact';
import './AppHeader.css';

export interface AppHeaderProps {
  onOpenSearch?: () => void;
  onOpenAskSolis?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenSearch, onOpenAskSolis }) => {
  const location = useLocation();
  const { openGuide } = useGuide();
  const { isDark, toggleTheme } = useTheme();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(() => notificationService.getUnreadCount());
  /**
   * Plan §8.3 — passive quiet peer presence: an anonymous live count of
   * scholars in running rooms, shown only when someone is actually focusing.
   * Real room state only — never a padded or simulated number.
   */
  const [scholarsFocusing, setScholarsFocusing] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const refreshPresence = () => {
      dataService.rooms
        .getRooms()
        .then((rooms) => {
          if (isMounted) setScholarsFocusing(countScholarsFocusingNow(rooms || []));
        })
        .catch(() => {
          // Presence is a quiet signal; a failed poll simply stays quiet.
        });
    };
    refreshPresence();
    // Review P8F10: a passive presence signal polls on its own cadence and
    // does NOT subscribe to the dataService event bus — a no-filter
    // subscription re-fetched rooms on top of every app-wide mutation.
    const interval = setInterval(refreshPresence, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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
          data-cursor="action"
        >
          <Search size={13} />
          <span className="solis-app-header__search-label">Search workspace</span>
          <kbd className="solis-app-header__kbd">⌘K</kbd>
        </button>

        {onOpenAskSolis && (
          <button
            type="button"
            className="solis-app-header__ask-btn tactile-press"
            onClick={onOpenAskSolis}
            title="Ask Solis Intelligence (Cmd + J)"
            aria-label="Ask Solis Intelligence"
            data-cursor="action"
          >
            <Sparkles size={13} className="solis-ask-icon" />
            <span className="solis-app-header__ask-label">Ask Solis</span>
            <kbd className="solis-app-header__kbd">⌘J</kbd>
          </button>
        )}

        {scholarsFocusing > 0 && (
          <Link
            to="/app/rooms"
            className="solis-app-header__presence tactile-press"
            title="Scholars focusing in Study Rooms right now"
            aria-label={`${scholarsFocusing} ${scholarsFocusing === 1 ? 'scholar' : 'scholars'} focusing right now — open Study Rooms`}
            data-cursor="action"
          >
            <Radio size={12} aria-hidden="true" />
            <span className="solis-app-header__presence-dot" aria-hidden="true" />
            <span className="solis-app-header__presence-label">
              {scholarsFocusing} {scholarsFocusing === 1 ? 'scholar' : 'scholars'} focusing right now
            </span>
          </Link>
        )}

        <div className="solis-app-header__icon-btn-wrap">
          <button
            type="button"
            className="solis-app-header__icon-btn tactile-press"
            onClick={() => setIsNotifDrawerOpen(true)}
            title="Notifications & Alerts"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            data-cursor="action"
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
          className="solis-app-header__icon-btn solis-app-header__guide-btn tactile-press"
          onClick={() => openGuide()}
          title="Guides & Operating Philosophy"
          aria-label="Open Guides"
          data-cursor="action"
        >
          <BookOpen size={15} />
        </button>

        <button
          type="button"
          className="solis-app-header__icon-btn solis-app-header__theme-btn tactile-press"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Warm Ivory (Day Flow)' : 'Switch to Deep Charcoal (Night Sanctuary)'}
          aria-label={isDark ? 'Switch to Warm Ivory theme' : 'Switch to Deep Charcoal theme'}
          data-cursor="action"
        >
          {isDark ? <Sun size={15} className="solis-theme-icon solis-theme-icon--sun" /> : <Moon size={15} className="solis-theme-icon solis-theme-icon--moon" />}
        </button>

        <div data-cursor="action">
          <AccountMenu />
        </div>
      </div>

      <NotificationCenterDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
      />
    </header>
  );
};
