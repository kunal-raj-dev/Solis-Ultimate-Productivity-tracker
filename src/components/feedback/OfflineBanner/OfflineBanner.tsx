import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../../hooks/useOnlineStatus';
import './OfflineBanner.css';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

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
};
