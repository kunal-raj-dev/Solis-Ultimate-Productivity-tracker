import React, { useState } from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';
import './PartialDataWarningBanner.css';

interface PartialDataWarningBannerProps {
  /** Number of fetch promises that rejected inside Promise.allSettled. */
  failedCount: number;
  /** Re-runs the page's data load so the missing slices can be retried. */
  onRetry: () => void | Promise<void>;
}

/**
 * Plan §6.3 Partial Fetch Failure Resilience: rendered when one or more
 * promises rejected in a page's Promise.allSettled load. The tone is calm and
 * amber (never a red alert) — the student is told cached data is being shown
 * and offered a one-click retry.
 */
export const PartialDataWarningBanner: React.FC<PartialDataWarningBannerProps> = ({
  failedCount,
  onRetry
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  if (failedCount <= 0) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="solis-partial-data-banner" role="status" aria-live="polite">
      <div className="solis-partial-data-banner__content">
        <CloudOff size={15} className="solis-partial-data-banner__icon" aria-hidden="true" />
        <span className="solis-partial-data-banner__text">
          Some recent logs could not be synced from cloud. Showing cached data.
        </span>
        <div className="solis-partial-data-banner__actions">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="solis-partial-data-banner__btn"
            title="Retry fetching the data that could not be synced"
          >
            <RefreshCw size={12} className={isRetrying ? 'solis-partial-data-banner__spin' : ''} />
            {isRetrying ? 'Retrying…' : 'Retry'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartialDataWarningBanner;
