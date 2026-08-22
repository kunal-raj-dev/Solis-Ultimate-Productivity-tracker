import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Compass, CheckCircle2, BookOpen, Flame, MoreHorizontal } from 'lucide-react';
import { MOBILE_NAVIGATION } from '../../../constants/navigation';
import { cn } from '../../../utils/classNames';
import { prefetchRoute } from '../../../utils/prefetch';
import { MobileMoreSheet } from './MobileMoreSheet';
import './MobileNav.css';

const ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
  Compass,
  CheckCircle2,
  BookOpen,
  Flame
};

const PRIMARY_MOBILE_PATHS = ['/app/dashboard', '/app/tasks', '/app/study', '/app/focus'];

export const MobileNav: React.FC = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const location = useLocation();

  const isMoreActive = !PRIMARY_MOBILE_PATHS.includes(location.pathname) && location.pathname.startsWith('/app');

  // First 4 primary items
  const primaryNav = MOBILE_NAVIGATION.filter(item => PRIMARY_MOBILE_PATHS.includes(item.path));

  return (
    <>
      <nav className="solis-mobile-nav" aria-label="Mobile Bottom Navigation">
        {primaryNav.map((item) => {
          const IconComponent = ICON_MAP[item.iconName] || Compass;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              onMouseEnter={() => prefetchRoute(item.id)}
              onTouchStart={() => prefetchRoute(item.id)}
              className={({ isActive }) =>
                cn(
                  'solis-mobile-nav__item',
                  isActive && 'solis-mobile-nav__item--active'
                )
              }
            >
              <span className="solis-mobile-nav__icon">
                <IconComponent size={20} />
              </span>
              <span className="solis-mobile-nav__label">{item.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={() => setIsMoreOpen(prev => !prev)}
          className={cn(
            'solis-mobile-nav__item',
            'solis-mobile-nav__item--button',
            (isMoreActive || isMoreOpen) && 'solis-mobile-nav__item--active'
          )}
          aria-expanded={isMoreOpen}
          aria-label="More navigation destinations"
        >
          <span className="solis-mobile-nav__icon">
            <MoreHorizontal size={20} />
          </span>
          <span className="solis-mobile-nav__label">More</span>
        </button>
      </nav>

      <MobileMoreSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </>
  );
};

