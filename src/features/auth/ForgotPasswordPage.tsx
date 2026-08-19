import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await requestPasswordReset(email.trim());
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Unable to process your password reset request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="solis-auth-card">
      <div className="solis-auth-header">
        <h2 className="solis-auth-title">Recover Sanctuary</h2>
        <p className="solis-auth-subtitle">
          Enter your registered email address to receive password reset instructions.
        </p>
      </div>

      {error && (
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
          <span>{error}</span>
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
              Reset Instructions Dispatched
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
              If an account is associated with <strong>{email}</strong>, you will receive a secure password recovery link shortly. Please check your inbox and spam folder.
            </p>
          </div>

          <Link to="/auth/login" style={{ width: '100%', marginTop: 'var(--space-sm)' }}>
            <Button
              variant="outline"
              size="md"
              isFullWidth
              leftIcon={<ArrowLeft size={16} />}
            >
              Return to Sign In
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="solis-auth-form">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="scholar@solis.space"
            leftIcon={<Mail size={16} />}
            required
            autoFocus
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            disabled={isSubmitting || !email.trim()}
            isFullWidth
            rightIcon={<ArrowRight size={16} />}
          >
            Send Recovery Link
          </Button>

          <div className="solis-auth-footer-nav">
            Remembered your credentials? <Link to="/auth/login">Return to Sign In</Link>
          </div>
        </form>
      )}
    </div>
  );
};
