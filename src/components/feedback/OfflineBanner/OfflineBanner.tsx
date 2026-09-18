import React, { useState, useEffect } from 'react';
import { WifiOff, Database, RefreshCw, Cloud } from 'lucide-react';
import { useOnlineStatus } from '../../../hooks/useOnlineStatus';
import { keepaliveService, DatabaseHealthInfo } from '../../../services/keepaliveService';
import { ServiceContainer } from '../../../services/dataService';
import './OfflineBanner.css';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [health, setHealth] = useState<DatabaseHealthInfo>(keepaliveService.getHealth());
  const [isRetrying, setIsRetrying] = useState(false);
  const [switchedOffline, setSwitchedOffline] = useState(false);

  useEffect(() => {
    keepaliveService.start();
    const unsubscribe = keepaliveService.subscribe((newHealth) => {
      setHealth(newHealth);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await keepaliveService.checkHealth();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleWorkOffline = () => {
    ServiceContainer.switchToMock();
    setSwitchedOffline(true);
    setHealth((prev) => ({
      ...prev,
      state: 'mock',
      message: 'Switched to offline development mode.'
    }));
  };

  const handleReconnect = async () => {
    setIsRetrying(true);
    try {
      ServiceContainer.switchToSupabase();
      setSwitchedOffline(false);
      await keepaliveService.checkHealth();
    } finally {
      setIsRetrying(false);
    }
  };

  // 1. Device Offline
  if (!isOnline) {
    return (
      <div className="solis-offline-banner" role="status" aria-live="polite">
        <div className="solis-offline-banner__content">
          <WifiOff size={15} className="solis-offline-banner__icon" />
          <span className="solis-offline-banner__text">
            <strong>Offline Mode Active:</strong> Your private workspace remains accessible locally. Modifications will be synchronized when connectivity is restored.
          </span>
        </div>
      </div>
    );
  }

  // 2. User manually switched to offline mode while cloud was unreachable
  if (switchedOffline) {
    return (
      <div className="solis-offline-banner" role="status" aria-live="polite">
        <div className="solis-offline-banner__content">
          <Database size={15} className="solis-offline-banner__icon" />
          <span className="solis-offline-banner__text">
            <strong>Offline Fallback Mode:</strong> Working locally. Cloud database was paused or inactive.
          </span>
          <div className="solis-offline-banner__actions">
            <button
              onClick={handleReconnect}
              disabled={isRetrying}
              className="solis-offline-banner__btn"
              title="Reconnect to cloud Supabase"
            >
              <Cloud size={12} />
              {isRetrying ? 'Connecting...' : 'Reconnect Cloud DB'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Database Paused or Inactive (e.g. 7-day inactivity pause on Supabase free tier)
  if (health.state === 'paused' || health.state === 'waking_up') {
    return (
      <div className="solis-offline-banner solis-offline-banner--paused" role="status" aria-live="polite">
        <div className="solis-offline-banner__content">
          <Database size={15} className="solis-offline-banner__icon" />
          <span className="solis-offline-banner__text">
            <strong>Database Inactivity Sleep:</strong> Supabase database may be paused or waking up.
          </span>
          <div className="solis-offline-banner__actions">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="solis-offline-banner__btn"
              title="Ping database to wake it up"
            >
              <RefreshCw size={12} className={isRetrying ? 'solis-spin' : ''} />
              {isRetrying ? 'Checking...' : 'Wake / Retry'}
            </button>
            <button
              onClick={handleWorkOffline}
              className="solis-offline-banner__btn solis-offline-banner__btn--secondary"
              title="Continue using local in-memory storage without cloud delays"
            >
              Work Offline
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

