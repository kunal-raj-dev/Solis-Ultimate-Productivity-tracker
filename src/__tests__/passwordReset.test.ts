import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataService } from '../services/mock/mockService';
import { formatAuthError } from '../utils/authErrors';

describe('Solis Password Recovery & Security Hardening Suite', () => {
  let service: MockDataService;

  beforeEach(() => {
    service = new MockDataService();
  });

  describe('Password Reset Request (Account Enumeration Defense)', () => {
    it('dispatches password reset request neutrally for valid email', async () => {
      await expect(
        service.auth.requestPasswordReset('scholar@solis.space')
      ).resolves.toBeUndefined();
    });

    it('rejects invalid email inputs gracefully at validation boundary', async () => {
      await expect(
        service.auth.requestPasswordReset('')
      ).rejects.toThrow('Please provide a valid email address.');

      await expect(
        service.auth.requestPasswordReset('invalid-email-string')
      ).rejects.toThrow('Please provide a valid email address.');
    });
  });

  describe('Password Update Execution', () => {
    it('updates password successfully when minimum length requirement is met', async () => {
      await expect(
        service.auth.updatePassword('NewSecurePassword123!')
      ).resolves.toBeUndefined();
    });

    it('rejects short passwords with clear validation message', async () => {
      await expect(
        service.auth.updatePassword('123')
      ).rejects.toThrow('Password must be at least 6 characters.');
    });
  });

  describe('Auth Error Sanitization for Password Reset', () => {
    it('transforms auth recovery errors into user-safe messages', () => {
      const error = {
        code: 'invalid_credentials',
        message: 'Invalid login credentials'
      };

      const formatted = formatAuthError(error);
      expect(formatted.userMessage).toBeDefined();
      expect(formatted.userMessage.length).toBeGreaterThan(0);
      expect(formatted.category).toBe('invalid_credentials');
    });

    it('handles network disconnection errors during password reset', () => {
      const error = new TypeError('Failed to fetch');
      const formatted = formatAuthError(error);
      expect(formatted.category).toBe('network');
      expect(formatted.userMessage).toContain('Network connection failure');
    });
  });
});
