import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, CheckCircle2, BookOpen, Flame, FileText } from 'lucide-react';
import { MOBILE_NAVIGATION } from '../../../constants/navigation';
import { cn } from '../../../utils/classNames';
import { prefetchRoute } from '../../../utils/prefetch';
import './MobileNav.css';

const ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
  Compass,
  CheckCircle2,
  BookOpen,
  Flame,
  FileText
};

export const MobileNav: React.FC = () => {
  return (
    <nav className="solis-mobile-nav" aria-label="Mobile Bottom Navigation">
      {MOBILE_NAVIGATION.map((item) => {
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
    </nav>
  );
};
