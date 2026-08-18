import React from 'react';
import { Search, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button/Button';
import { AccountMenu } from '../AccountMenu/AccountMenu';
import { formatFullDate } from '../../../utils/date';
import './AppHeader.css';

export interface AppHeaderProps {
  onOpenSearch?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenSearch }) => {
  const navigate = useNavigate();
  const todayFormatted = formatFullDate();

  return (
    <header className="solis-app-header">
      <div className="solis-app-header__left">
        <div className="solis-app-header__date">{todayFormatted}</div>
      </div>

      <div className="solis-app-header__right">
        <button
          type="button"
          className="solis-app-header__search-btn"
          onClick={onOpenSearch}
          title="Search workspace (Cmd + K)"
        >
          <Search size={14} />
          <span>Find tasks, sessions, notes...</span>
          <span className="solis-app-header__kbd">⌘K</span>
        </button>

        <Button
          variant="accent"
          size="sm"
          leftIcon={<Flame size={15} />}
          onClick={() => navigate('/app/focus')}
        >
          Focus Space
        </Button>

        <AccountMenu />
      </div>
    </header>
  );
};
