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

  it('handles network failure errors gracefully', () => {
    const error = new Error('Failed to fetch');
    const formatted = formatAuthError(error);
    expect(formatted.category).toBe('network');
    expect(formatted.userMessage).toContain('Network connection failure');
  });
});
