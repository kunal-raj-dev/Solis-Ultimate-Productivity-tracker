import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Brain, CheckSquare, Home, Timer } from 'lucide-react';
import { MOBILE_NAVIGATION } from '../../../constants/navigation';
import { cn } from '../../../utils/classNames';
import { prefetchRoute } from '../../../utils/prefetch';
import './MobileNav.css';

/**
 * Plan §7.2 — dedicated 5-tab mobile bottom navigation. This is the canonical
 * mobile bottom bar (master.md §9.4), evolved in place to the Phase 7 tab set:
 * Today, Focus, Subjects (/app/study), Tasks, Progress. Every tab keeps the
 * 48px minimum touch target enforced in MobileNav.css.
 */
const ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
  Home,
  Timer,
  Brain,
  CheckSquare,
  BarChart3
};

export const MobileNav: React.FC = () => {
  return (
    <nav className="solis-mobile-nav" aria-label="Mobile Bottom Navigation">
      {MOBILE_NAVIGATION.map((item) => {
        const IconComponent = ICON_MAP[item.iconName] || Home;
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
    </nav>
  );
};
