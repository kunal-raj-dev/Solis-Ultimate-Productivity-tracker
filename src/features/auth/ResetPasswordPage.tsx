import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './AuthPages.css';

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { updatePassword } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(password);
      setSubmitted(true);
      addToast({
        title: 'Password updated',
        description: 'Your new password has been saved. Please sign in.',
        type: 'success'
      });
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to update password. Your recovery link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="solis-auth-card">
      <div className="solis-auth-header">
        <h2 className="solis-auth-title">Create New Password</h2>
        <p className="solis-auth-subtitle">
          Choose a secure password to protect your intentional study workspace.
        </p>
      </div>

      {localError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-error-bg)',
            color: 'var(--status-error)',
            fontSize: 'var(--text-body-sm)',
            marginBottom: 'var(--space-md)',
            lineHeight: 1.5
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{localError}</span>
        </div>
      )}

      {submitted ? (
        <div
          role="status"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: 'var(--space-lg) var(--space-xs)',
            gap: 'var(--space-md)'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--status-success-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--status-success)'
            }}
          >
            <CheckCircle2 size={26} />
          </div>

          <div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-heading-2)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-2xs)'
              }}
            >
              Password Successfully Updated
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-interface)',
                fontSize: 'var(--text-body-sm)',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: '380px'
              }}
            >
              Your credentials have been updated securely. You may now sign in to your study workspace.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            isFullWidth
            onClick={() => navigate('/auth/login', { replace: true })}
            rightIcon={<ArrowRight size={16} />}
            style={{ marginTop: 'var(--space-sm)' }}
          >
            Proceed to Sign In
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="solis-auth-form">
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            leftIcon={<Lock size={16} />}
            required
            autoFocus
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            leftIcon={<Lock size={16} />}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            disabled={isSubmitting || !password || !confirmPassword}
            isFullWidth
            rightIcon={<ArrowRight size={16} />}
          >
            Update Password
          </Button>

          <div className="solis-auth-footer-nav">
            <Link to="/auth/login">Return to Sign In</Link>
          </div>
        </form>
      )}
    </div>
  );
};
