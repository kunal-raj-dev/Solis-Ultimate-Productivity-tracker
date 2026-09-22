import React, { useState, useEffect } from 'react';
import { Search, Flame, BookOpen, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button/Button';
import { AccountMenu } from '../AccountMenu/AccountMenu';
import { useGuide } from '../../../context/GuideContext';
import { useTheme } from '../../../context/ThemeContext';
import './AppHeader.css';

export interface AppHeaderProps {
  onOpenSearch?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenSearch }) => {
  const navigate = useNavigate();
  const { openGuide } = useGuide();
  const { isDark, toggleTheme } = useTheme();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(currentDate);

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(currentDate);

  return (
    <header className="solis-app-header">
      <div className="solis-app-header__left">
        <div className="solis-app-header__date">
          <span className="solis-app-header__date-day">{formattedDate}</span>
          <span className="solis-app-header__time-dot">·</span>
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
          <Search size={14} />
          <span className="solis-app-header__search-label">Find tasks, sessions, notes...</span>
          <span className="solis-app-header__kbd">⌘K</span>
        </button>

        <button
          type="button"
          className="solis-app-header__search-btn solis-app-header__guide-btn"
          onClick={() => openGuide()}
          title="Guide Center & Philosophy"
          aria-label="Open Guide Center"
        >
          <BookOpen size={14} />
          <span className="solis-app-header__search-label">Guides</span>
        </button>

        <button
          type="button"
          className="solis-app-header__theme-btn tactile-press"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Warm Ivory (Day Flow)' : 'Switch to Deep Charcoal (Night Sanctuary)'}
          aria-label={isDark ? 'Switch to Warm Ivory theme' : 'Switch to Deep Charcoal theme'}
        >
          {isDark ? <Sun size={15} className="solis-theme-icon solis-theme-icon--sun" /> : <Moon size={15} className="solis-theme-icon solis-theme-icon--moon" />}
        </button>

        <div className="solis-app-header__focus-wrapper">
          <Button
            variant="accent"
            size="sm"
            leftIcon={<Flame size={15} />}
            onClick={() => navigate('/app/focus')}
          >
            Start Focus
          </Button>
        </div>

        <AccountMenu />
      </div>
    </header>
  );
};
