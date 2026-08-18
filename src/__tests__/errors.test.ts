import { describe, it, expect } from 'vitest';
import { classifyError, formatErrorMessage } from '../utils/errors';

describe('Error Handling & Classification Suite', () => {
  it('classifies RLS permission denied errors correctly', () => {
    const error = { code: '42501', message: 'new row violates row-level security policy for table "notes"' };
    const classified = classifyError(error);
    expect(classified.category).toBe('permission_denied');
    expect(classified.userMessage).toContain('Permission denied');
  });

  it('classifies foreign key constraint errors correctly', () => {
    const error = { code: '23503', message: 'insert or update on table "notes" violates foreign key constraint' };
    const classified = classifyError(error);
    expect(classified.category).toBe('constraint_violation');
    expect(classified.userMessage).toContain('Referenced item was not found');
  });

  it('classifies validation errors properly', () => {
    const error = new Error('Subject title is required.');
    (error as any).name = 'ValidationError';
    const msg = formatErrorMessage(error);
    expect(msg).toBe('Subject title is required.');
  });

  it('handles unknown non-Error objects safely', () => {
    const error = { message: 'Custom server failure' };
    const msg = formatErrorMessage(error);
    expect(msg).toBe('Custom server failure');
  });

  it('falls back gracefully on empty errors', () => {
    const msg = formatErrorMessage(null, 'Fallback error message');
    expect(msg).toBe('Fallback error message');
  });
});
