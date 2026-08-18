import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../../ui/Button/Button';
import { AlertOctagon, RotateCcw, Home, ChevronDown } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by Solis ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleNavigateHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/app/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-xl)',
            backgroundColor: 'var(--bg-canvas)'
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface-primary)',
              padding: 'var(--space-2xl) var(--space-xl)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-floating)'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-error-bg)',
                color: 'var(--status-error)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-md)'
              }}
            >
              <AlertOctagon size={24} />
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-heading-2)',
                marginBottom: 'var(--space-xs)',
                color: 'var(--text-primary)'
              }}
            >
              Quiet Interruption
            </h2>

            <p
              style={{
                fontFamily: 'var(--font-interface)',
                fontSize: 'var(--text-body-sm)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-xl)',
                lineHeight: 1.6
              }}
            >
              An unexpected disturbance occurred. Your saved studies, notes, and tasks remain safely preserved in your workspace.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-sm)',
                justifyContent: 'center',
                marginBottom: 'var(--space-lg)'
              }}
            >
              <Button
                variant="primary"
                leftIcon={<RotateCcw size={16} />}
                onClick={this.handleReset}
              >
                Restore Flow
              </Button>
              <Button
                variant="secondary"
                leftIcon={<Home size={16} />}
                onClick={this.handleNavigateHome}
              >
                Return to Workspace
              </Button>
            </div>

            {/* Production-Safe Expandable Diagnostics */}
            {this.state.error && (
              <details
                style={{
                  textAlign: 'left',
                  marginTop: 'var(--space-md)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-secondary)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 'var(--text-micro)',
                  color: 'var(--text-muted)'
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>Technical Diagnostics</span>
                  <ChevronDown size={14} />
                </summary>
                <div style={{ marginTop: '8px', overflowX: 'auto', fontFamily: 'var(--font-mono)' }}>
                  <p style={{ margin: '4px 0', color: 'var(--status-error)' }}>
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <pre style={{ margin: 0, fontSize: '10px', opacity: 0.75, whiteSpace: 'pre-wrap' }}>
                      {this.state.error.stack.split('\n').slice(0, 4).join('\n')}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
