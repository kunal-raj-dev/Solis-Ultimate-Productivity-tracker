import { describe, it, expect } from 'vitest';
import { formatFriendlyDate, getISODateString } from '../utils/date';
import { formatErrorMessage, classifyError } from '../utils/errors';

describe('Solis Reliability & Resilience Suite (Phase 8)', () => {
  describe('Date & Continuity Null-Safety', () => {
    it('formats invalid or empty date strings safely without throwing', () => {
      expect(formatFriendlyDate('')).toBe('');
      expect(formatFriendlyDate(null as any)).toBe('');
      expect(formatFriendlyDate(undefined as any)).toBe('');
    });

    it('generates consistent ISO date strings', () => {
      const iso = getISODateString(new Date('2026-08-17T12:00:00Z'));
      expect(iso).toBe('2026-08-17');
    });
  });

  describe('Error Classification Determinism', () => {
    it('classifies network fetch timeout / disconnection errors safely', () => {
      const netError = new TypeError('Failed to fetch');
      const classified = classifyError(netError);
      expect(classified.category).toBe('network');
      expect(classified.userMessage).toContain('Unable to connect to the database');
    });

    it('classifies JWT / session expiration errors into auth_expired category', () => {
      const authError = {
        status: 401,
        message: 'JWT expired: user session has ended'
      };
      const classified = classifyError(authError);
      expect(classified.category).toBe('auth_expired');
      expect(classified.userMessage).toContain('Your session has expired');
    });

    it('handles unexpected non-standard errors with safe fallback messages', () => {
      const customErr = { weirdCode: 999 };
      const formatted = formatErrorMessage(customErr, 'Custom fallback message');
      expect(formatted).toBe('Custom fallback message');
    });
  });
});
