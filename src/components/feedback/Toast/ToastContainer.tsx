import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { cn } from '../../../utils/classNames';
import './Toast.css';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const renderIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} className="text-sage-500" style={{ color: 'var(--status-success)' }} />;
      case 'error':
        return <AlertCircle size={18} style={{ color: 'var(--status-error)' }} />;
      case 'warning':
        return <AlertTriangle size={18} style={{ color: 'var(--status-warning)' }} />;
      default:
        return <Info size={18} style={{ color: 'var(--color-coral-500)' }} />;
    }
  };

  return (
    <div className="solis-toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn('solis-toast', `solis-toast--${toast.type}`)}
          role="alert"
        >
          {renderIcon(toast.type)}
          <div className="solis-toast__content">
            <div className="solis-toast__title">{toast.title}</div>
            {toast.description && (
              <div className="solis-toast__description">{toast.description}</div>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="solis-toast__close"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
