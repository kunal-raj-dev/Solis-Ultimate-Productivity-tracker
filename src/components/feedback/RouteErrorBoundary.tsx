import React from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { telemetryService } from '../../services/telemetry/telemetry.service';

interface RouteErrorBoundaryState {
  hasError: boolean;
  message: string | null;
}

/**
 * Phase 0 (P0-08) per-route error boundary. V1 had a single root-only
 * ErrorBoundary, so a failure in any one feature page unmounted the entire
 * app. Each route element is wrapped with this boundary, so a crash is
 * contained to the route that caused it — the rest of the shell, navigation
 * and the user's data stay reachable. Failures are reported to the local
 * error sink (telemetryService) for the reliability metric.
 */
export class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    telemetryService.captureError('route.boundary', error);
    if (import.meta.env.DEV) {
      console.error('[Solis] Route crash contained by error boundary:', error, info.componentStack);
    }
  }

  private handleRetry = (): void => {
    telemetryService.track('route.boundary_retry');
    this.setState({ hasError: false, message: null });
  };

  private handleGoHome = (): void => {
    window.location.assign('/app/dashboard');
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          padding: '32px',
          textAlign: 'center'
        }}
      >
        <AlertTriangle size={40} color="var(--color-amber-500)" aria-hidden="true" />
        <h2 style={{ margin: 0, fontSize: 'var(--text-heading-2)', color: 'var(--text-primary)' }}>
          This section hit an unexpected error
        </h2>
        <p
          style={{
            margin: 0,
            maxWidth: '440px',
            fontSize: 'var(--text-body-sm)',
            color: 'var(--text-secondary)'
          }}
        >
          The rest of Solis is unaffected — your data is safe. You can retry this
          section or return to Today.
        </p>
        {this.state.message && (
          <code
            style={{
              fontSize: 'var(--text-caption)',
              color: 'var(--text-muted)',
              maxWidth: '560px',
              overflowWrap: 'anywhere'
            }}
          >
            {this.state.message}
          </code>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="primary" leftIcon={<RotateCcw size={14} />} onClick={this.handleRetry}>
            Retry this section
          </Button>
          <Button variant="outline" leftIcon={<ArrowLeft size={14} />} onClick={this.handleGoHome}>
            Back to Today
          </Button>
        </div>
      </div>
    );
  }
}
