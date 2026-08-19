import { describe, it, expect } from 'vitest';
import { formatAuthError } from '../utils/authErrors';

describe('Supabase Auth Error Classifier', () => {
  it('correctly classifies email send rate limit', () => {
    const error = {
      name: 'AuthApiError',
      code: 'over_email_send_rate_limit',
      message: 'email rate limit exceeded',
      status: 429
    };

    const formatted = formatAuthError(error);
    expect(formatted.category).toBe('rate_limit');
    expect(formatted.code).toBe('over_email_send_rate_limit');
    expect(formatted.userMessage).toContain('Supabase signup email rate limit reached');
  });

  it('correctly classifies unconfirmed email', () => {
    const error = {
      name: 'AuthApiError',
      code: 'email_not_confirmed',
      message: 'Email not confirmed',
      status: 400
    };

    const formatted = formatAuthError(error);
    expect(formatted.category).toBe('unconfirmed');
    expect(formatted.code).toBe('email_not_confirmed');
    expect(formatted.userMessage).toContain('has not been confirmed yet');
  });

  it('correctly classifies invalid login credentials', () => {
    const error = {
      name: 'AuthApiError',
      code: 'invalid_credentials',
      message: 'Invalid login credentials',
      status: 400
    };

    const formatted = formatAuthError(error);
    expect(formatted.category).toBe('invalid_credentials');
    expect(formatted.code).toBe('invalid_credentials');
    expect(formatted.userMessage).toContain('Invalid email address or password');
  });

  it('correctly classifies duplicate user registration', () => {
    const error = {
      name: 'AuthApiError',
      code: 'user_already_exists',
      message: 'User already registered',
      status: 400
    };

    const formatted = formatAuthError(error);
    expect(formatted.category).toBe('duplicate_user');
    expect(formatted.code).toBe('user_already_exists');
    expect(formatted.userMessage).toContain('already exists');
  });

  it('correctly classifies request rate limit (HTTP 429)', () => {
    const error = {
      name: 'AuthApiError',
      code: 'over_request_rate_limit',
      message: 'Too many requests',
      status: 429
    };

    const formatted = formatAuthError(error);
    expect(formatted.category).toBe('rate_limit');
    expect(formatted.code).toBe('over_request_rate_limit');
    expect(formatted.userMessage).toContain('Too many authentication attempts');
  });

  it('correctly classifies weak password / password validation failure', () => {
    const error = {
      code: 'weak_password',
      message: 'Password should be at least 6 characters'
    };

    const formatted = formatAuthError(error);
    expect(formatted.category).toBe('validation');
    expect(formatted.userMessage).toContain('Password must be at least 6 characters');
  });

  it('correctly classifies expired auth token / session', () => {
    const error = {
      code: 'jwt_expired',
      message: 'JWT expired: user session has ended'
    };

    const formatted = formatAuthError(error);
    expect(formatted.category).toBe('auth_expired');
    expect(formatted.userMessage).toContain('Your authentication session has expired');
  });

  it('correctly classifies disabled signups', () => {
    const error = {
      code: 'signup_disabled',
      message: 'Signups not allowed for this instance'
    };

    const formatted = formatAuthError(error);
    expect(formatted.category).toBe('generic');
    expect(formatted.userMessage).toContain('New account registrations are temporarily closed');
  });

  it('sanitizes sensitive database URLs from error fallback messages', () => {
    const error = {
      message: 'Connection failed to postgres://admin:supersecret@db.supabase.co:5432/solis'
    };

    const formatted = formatAuthError(error);
    expect(formatted.userMessage).not.toContain('supersecret');
    expect(formatted.userMessage).toContain('[REDACTED_DB_URL]');
  });

  it('handles network failure errors gracefully', () => {
    const error = new Error('Failed to fetch');
    const formatted = formatAuthError(error);
    expect(formatted.category).toBe('network');
    expect(formatted.userMessage).toContain('Network connection failure');
  });
});
