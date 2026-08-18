import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { Checkbox } from '../../components/ui/Checkbox/Checkbox';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './AuthPages.css';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('kunal@solis.space');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { login, isAuthenticated, isLoading: authLoading, authError, clearError } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = (location.state as any)?.from?.pathname || '/app/dashboard';

  // Clear any previous error when arriving on the Login page
  useEffect(() => {
    clearError();
    setLocalError(null);
  }, [clearError]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setIsSubmitting(true);

    try {
      await login({ email: email.trim(), password, rememberMe });
      addToast({
        title: 'Welcome back',
        description: 'Your study sanctuary has been loaded.',
        type: 'success'
      });
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      const msg = err?.message || 'Authentication error. Please check your credentials.';
      setLocalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="solis-auth-card">
      <div className="solis-auth-header">
        <h2 className="solis-auth-title">Sign in to Solis</h2>
        <p className="solis-auth-subtitle">Return to your calm daily study rhythm.</p>
      </div>

      {displayedError && (
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
          <span>{displayedError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="solis-auth-form">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          leftIcon={<Mail size={16} />}
          required
          autoFocus
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          leftIcon={<Lock size={16} />}
          required
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Checkbox
            label="Remember this device"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <button
            type="button"
            style={{
              fontSize: 'var(--text-caption)',
              color: 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            onClick={() => {
              addToast({
                title: 'Password reset instructions',
                description: 'Please contact support or check your email settings in Supabase.',
                type: 'info'
              });
            }}
          >
            Forgot?
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          isFullWidth
          rightIcon={<ArrowRight size={16} />}
        >
          Enter Workspace
        </Button>
      </form>

      <div className="solis-auth-footer-nav">
        Don&apos;t have an account yet? <Link to="/auth/signup">Create sanctuary</Link>
      </div>
    </div>
  );
};
