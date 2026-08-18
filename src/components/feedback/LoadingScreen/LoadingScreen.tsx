import React from 'react';
import './LoadingScreen.css';

export interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  title = 'Solis',
  subtitle = 'Harmonizing your daily focus space'
}) => {
  return (
    <div className="solis-loading-screen" role="status" aria-live="polite">
      <div className="solis-loading-orb" />
      <h2 className="solis-loading-title">{title}</h2>
      <p className="solis-loading-subtitle">{subtitle}</p>
    </div>
  );
};
