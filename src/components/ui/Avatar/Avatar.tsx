import React from 'react';
import { cn } from '../../../utils/classNames';
import './Avatar.css';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md', className }) => {
  const getInitials = (str: string) => {
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  return (
    <div className={cn('solis-avatar', `solis-avatar--${size}`, className)}>
      {src ? (
        <img src={src} alt={name} className="solis-avatar__img" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};
