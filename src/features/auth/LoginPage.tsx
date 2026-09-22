import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { Checkbox } from '../../components/ui/Checkbox/Checkbox';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ServiceContainer } from '../../services/dataService';
import './AuthPages.css';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { login, isAuthenticated, isLoading: authLoading, authError, clearError } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = (location.state as any)?.from?.pathname || '/app/dashboard';

  // Clear any previous error when arriving on the Login page (mount only)
  useEffect(() => {
    clearError();
    setLocalError(null);
  }, []); // Run strictly once on mount to avoid clearing active submission errors

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, redirectPath]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Resilient fallback to DOM inputs if browser autofill didn't trigger React onChange
    const form = e.currentTarget;
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement | null;
    const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement | null;

    const finalEmail = (email || emailInput?.value || '').trim();
    const finalPassword = password || passwordInput?.value || '';

    if (!finalEmail || !finalPassword) {
      setLocalError('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ email: finalEmail, password: finalPassword, rememberMe });
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

  const handleGuestExplore = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    clearError();
    try {
      ServiceContainer.switchToMock();
      await login({ email: 'scholar@solis.space', password: 'guest-session' });
      addToast({
        title: 'Guest Sanctuary Loaded',
        description: 'Exploring Solis with full interactive mock workspace.',
        type: 'success'
      });
      navigate('/app/dashboard', { replace: true });
    } catch (err: any) {
      setLocalError(err?.message || 'Could not load guest session.');
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
          autoComplete="username"
          leftIcon={<Mail size={16} />}
          required
          autoFocus
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          leftIcon={<Lock size={16} />}
          required
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Checkbox
            label="Remember this device"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <Link
            to="/auth/forgot-password"
            style={{
              fontSize: 'var(--text-caption)',
              color: 'var(--text-secondary)',
              textDecoration: 'underline'
            }}
          >
            Forgot?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          isFullWidth
          rightIcon={<ArrowRight size={16} />}
        >
          Enter Workspace
        </Button>

        <div className="solis-auth-divider">
          <span>or explore instantly</span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="md"
          isFullWidth
          disabled={isSubmitting}
          className="solis-auth-guest-btn tactile-press"
          leftIcon={<Sparkles size={16} color="var(--color-coral-500)" />}
          onClick={handleGuestExplore}
        >
          Explore Demo Sanctuary (Instant Guest)
        </Button>
      </form>

      <div className="solis-auth-footer-nav">
        Don&apos;t have an account yet? <Link to="/auth/signup">Create sanctuary</Link>
      </div>
    </div>
  );
};
