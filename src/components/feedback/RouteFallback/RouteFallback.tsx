import React from 'react';
import './RouteFallback.css';

export const RouteFallback: React.FC = () => {
  return (
    <div className="solis-route-fallback" role="status" aria-label="Loading section">
      <div className="solis-route-fallback__shimmer-header">
        <div className="solis-route-fallback__bar solis-route-fallback__bar--title" />
        <div className="solis-route-fallback__bar solis-route-fallback__bar--subtitle" />
      </div>
      <div className="solis-route-fallback__grid">
        <div className="solis-route-fallback__card" />
        <div className="solis-route-fallback__card" />
      </div>
    </div>
  );
};
