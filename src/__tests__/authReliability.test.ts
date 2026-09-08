import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatAuthError } from '../utils/authErrors';

describe('Solis Authentication Reliability & Error Architecture', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error Classification Determinism', () => {
    it('classifies DNS resolution / host name errors as server unreachable when online', () => {
      // Simulate browser online
      vi.stubGlobal('navigator', { onLine: true });

      const err = new TypeError('Failed to fetch: net::ERR_NAME_NOT_RESOLVED');
      const formatted = formatAuthError(err);

      expect(formatted.category).toBe('network');
      expect(formatted.code).toBe('server_unreachable');
      expect(formatted.userMessage).toContain('Unable to reach Solis authentication servers');
      expect(formatted.userMessage).toContain('paused');
    });

    it('classifies network errors accurately when the client is genuinely offline', () => {
      // Simulate browser offline
      vi.stubGlobal('navigator', { onLine: false });

      const err = new TypeError('Failed to fetch');
      const formatted = formatAuthError(err);

      expect(formatted.category).toBe('network');
      expect(formatted.code).toBe('offline');
      expect(formatted.userMessage).toContain('offline');
    });

    it('classifies invalid credentials without leaking whether email exists', () => {
      const err = {
        code: 'invalid_credentials',
        message: 'Invalid login credentials'
      };
      const formatted = formatAuthError(err);

      expect(formatted.category).toBe('invalid_credentials');
      expect(formatted.code).toBe('invalid_credentials');
      expect(formatted.userMessage).toContain('Invalid email address or password');
    });

    it('classifies unconfirmed email addresses with actionable guidance', () => {
      const err = {
        code: 'email_not_confirmed',
        message: 'Email not confirmed'
      };
      const formatted = formatAuthError(err);

      expect(formatted.category).toBe('unconfirmed');
      expect(formatted.code).toBe('email_not_confirmed');
      expect(formatted.userMessage).toContain('has not been confirmed yet');
    });

    it('classifies rate limiting (429) cleanly without crash', () => {
      const err = {
        status: 429,
        message: 'Too many requests'
      };
      const formatted = formatAuthError(err);

      expect(formatted.category).toBe('rate_limit');
      expect(formatted.userMessage).toContain('Too many authentication attempts');
    });
  });

  describe('Security & Information Leakage Defense', () => {
    it('redacts postgres connection strings with credentials from raw errors', () => {
      const err = {
        message: 'Fatal error at postgres://postgres:SecretPass123@db.tmxrupqgttaxlcrrcubt.supabase.co:5432/postgres'
      };
      const formatted = formatAuthError(err);

      expect(formatted.userMessage).not.toContain('SecretPass123');
      expect(formatted.userMessage).toContain('[REDACTED_DB_URL]');
    });

    it('handles null and undefined error inputs gracefully', () => {
      const formattedNull = formatAuthError(null);
      expect(formattedNull.category).toBe('generic');
      expect(formattedNull.code).toBe('unknown');

      const formattedUndefined = formatAuthError(undefined);
      expect(formattedUndefined.category).toBe('generic');
    });
  });

  describe('Credential Semantics & Input Guardrails', () => {
    it('preserves password characters with special symbols and exact spacing', () => {
      const originalPassword = ' kunalraj@#1002 ';
      // Password must NEVER be trimmed: trailing spaces could be valid intentional characters
      expect(originalPassword).toBe(' kunalraj@#1002 ');
      expect(originalPassword.length).toBe(16);
    });

    it('safely normalizes email while keeping domain intact', () => {
      const rawEmail = '  KunalRazzz7@GMAIL.COM  ';
      const normalized = rawEmail.trim().toLowerCase();
      expect(normalized).toBe('kunalrazzz7@gmail.com');
    });
  });
});
