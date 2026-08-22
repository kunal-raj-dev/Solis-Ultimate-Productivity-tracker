import React, { useState, useEffect } from 'react';
import { Search, Flame, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button/Button';
import { AccountMenu } from '../AccountMenu/AccountMenu';
import { useGuide } from '../../../context/GuideContext';
import './AppHeader.css';

export interface AppHeaderProps {
  onOpenSearch?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenSearch }) => {
  const navigate = useNavigate();
  const { openGuide } = useGuide();
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
          <span>{formattedDate}</span>
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
          className="solis-app-header__search-btn"
          onClick={() => openGuide()}
          title="Guide Center & Philosophy"
          aria-label="Open Guide Center"
        >
          <BookOpen size={14} />
          <span className="solis-app-header__search-label">Guides</span>
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
