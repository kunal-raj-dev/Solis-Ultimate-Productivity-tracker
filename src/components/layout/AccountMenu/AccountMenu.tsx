import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sliders, LogOut, Moon, Sun, Loader2, BookOpen } from 'lucide-react';
import { Avatar } from '../../ui/Avatar/Avatar';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { useGuide } from '../../../context/GuideContext';
import './AccountMenu.css';

export const AccountMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { user, logout, isLoggingOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { openGuide } = useGuide();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle Keyboard Escape key to close menu and return focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      addToast({
        title: 'Signed out',
        description: 'Your study session has ended securely.',
        type: 'info'
      });
      navigate('/auth/login', { replace: true });
    } catch (err) {
      addToast({
        title: 'Sign out issue',
        description: 'Encountered an issue while signing out. Redirecting to login.',
        type: 'error'
      });
      navigate('/auth/login', { replace: true });
    }
  };

  const displayName = user?.name || 'Solis Scholar';
  const displayEmail = user?.email || 'scholar@solis.space';
  const displayField = user?.focusField || 'Systems Architecture';

  return (
    <div className="solis-account-menu-container" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        className="solis-account-menu__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="User Account and Settings Menu"
      >
        <Avatar name={displayName} size="sm" />
      </button>

      {isOpen && (
        <div className="solis-account-dropdown" role="menu" aria-orientation="vertical">
          {/* User Identity Header */}
          <div className="solis-account-dropdown__identity">
            <div className="solis-account-dropdown__avatar-wrapper">
              <Avatar name={displayName} size="md" />
            </div>
            <div className="solis-account-dropdown__user-info">
              <span className="solis-account-dropdown__name">{displayName}</span>
              <span className="solis-account-dropdown__email" title={displayEmail}>
                {displayEmail}
              </span>
              <span className="solis-account-dropdown__field">{displayField}</span>
            </div>
          </div>

          <div className="solis-account-dropdown__divider" role="separator" />

          {/* Navigation & Preferences */}
          <div className="solis-account-dropdown__section">
            <Link
              to="/app/settings"
              className="solis-account-dropdown__item"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <Sliders size={16} className="solis-account-dropdown__item-icon" />
              <span>System Settings</span>
            </Link>

            <button
              type="button"
              className="solis-account-dropdown__item"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                openGuide();
              }}
            >
              <BookOpen size={16} className="solis-account-dropdown__item-icon" />
              <span>Guide Center & Philosophy</span>
            </button>

            <button
              type="button"
              className="solis-account-dropdown__item"
              role="menuitem"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <Sun size={16} className="solis-account-dropdown__item-icon" />
              ) : (
                <Moon size={16} className="solis-account-dropdown__item-icon" />
              )}
              <span>Atmosphere: {theme === 'dark' ? 'Warm Ivory' : 'Deep Charcoal'}</span>
            </button>
          </div>

          <div className="solis-account-dropdown__divider" role="separator" />

          {/* Destructive Sign Out Action */}
          <div className="solis-account-dropdown__section">
            <button
              type="button"
              className="solis-account-dropdown__item solis-account-dropdown__item--danger"
              role="menuitem"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 size={16} className="solis-account-dropdown__spinner" />
              ) : (
                <LogOut size={16} className="solis-account-dropdown__item-icon" />
              )}
              <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
