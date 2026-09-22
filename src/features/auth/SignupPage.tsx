import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { CustomSelect } from '../../components/ui/Select/CustomSelect';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ServiceContainer } from '../../services/dataService';
import './AuthPages.css';

export const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusField, setFocusField] = useState('engineering');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { login, signup, isAuthenticated, isLoading: authLoading, authError, clearError } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Clear any previous error when arriving on the Signup page (mount only)
  useEffect(() => {
    clearError();
    setLocalError(null);
  }, []); // Run strictly once on mount to preserve submission errors

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    const form = e.currentTarget;
    const nameInput = form.querySelector('input[type="text"]') as HTMLInputElement | null;
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement | null;
    const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement | null;

    const finalName = (name || nameInput?.value || '').trim();
    const finalEmail = (email || emailInput?.value || '').trim();
    const finalPassword = password || passwordInput?.value || '';

    if (!finalName || !finalEmail || !finalPassword) {
      setLocalError('Please complete all required fields.');
      return;
    }

    if (finalPassword.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({ name: finalName, email: finalEmail, password: finalPassword, focusField });
      addToast({
        title: 'Sanctuary created',
        description: 'Welcome to Solis. Your study space is initialized.',
        type: 'success'
      });
      navigate('/app/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err?.message || 'Registration error. Unable to initialize account.';
      setLocalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="solis-auth-card">
      <div className="solis-auth-header">
        <h2 className="solis-auth-title">Create your space</h2>
        <p className="solis-auth-subtitle">Begin your intentional study and focus journey.</p>
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
          label="Your Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alex Morgan"
          autoComplete="name"
          leftIcon={<User size={16} />}
          required
          autoFocus
        />

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          autoComplete="username"
          leftIcon={<Mail size={16} />}
          required
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 6 characters"
          autoComplete="new-password"
          leftIcon={<Lock size={16} />}
          required
        />

        <CustomSelect
          label="Primary Field of Focus"
          value={focusField}
          onChange={setFocusField}
          options={[
            { value: 'engineering', label: 'Computer Science & Software Architecture' },
            { value: 'medicine', label: 'Medicine & Healthcare Pre-Med' },
            { value: 'law', label: 'Law, Policy & Jurisprudence' },
            { value: 'finance', label: 'Quantitative Finance & Economics' },
            { value: 'design', label: 'Architecture & Visual Design' },
            { value: 'general', label: 'General Intellectual Mastery' }
          ]}
        />

        <Button
          type="submit"
          variant="accent"
          size="md"
          isLoading={isSubmitting}
          disabled={isSubmitting || !name.trim() || !email.trim() || !password}
          isFullWidth
          rightIcon={<ArrowRight size={16} />}
          leftIcon={<Sparkles size={16} />}
        >
          Initialize Sanctuary
        </Button>

        <div className="solis-auth-divider">
          <span>or try demo space</span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="md"
          isFullWidth
          disabled={isSubmitting}
          className="solis-auth-guest-btn tactile-press"
          leftIcon={<Sparkles size={16} color="var(--color-coral-500)" />}
          onClick={async () => {
            setIsSubmitting(true);
            setLocalError(null);
            clearError();
            try {
              ServiceContainer.switchToMock();
              await login({ email: 'scholar@solis.space', password: 'guest-session' });
              addToast({
                title: 'Demo Sanctuary Ready',
                description: 'Loaded with complete mock study curriculum and goals.',
                type: 'success'
              });
              navigate('/app/dashboard', { replace: true });
            } catch (err: any) {
              setLocalError(err?.message || 'Could not load guest session.');
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          Explore Demo Sanctuary (Instant Guest)
        </Button>
      </form>

      <div className="solis-auth-footer-nav">
        Already have a workspace? <Link to="/auth/login">Sign in</Link>
      </div>
    </div>
  );
};
