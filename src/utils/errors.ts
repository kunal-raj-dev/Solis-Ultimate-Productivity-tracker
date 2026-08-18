/**
 * Solis - Centralized Application Error Formatter
 * Translates domain, network, and database/PostgREST errors into clean, actionable user feedback.
 */

export interface FormattedError {
  userMessage: string;
  category: 'permission_denied' | 'invalid_data' | 'constraint_violation' | 'network' | 'auth_expired' | 'server_error';
  technicalDetails?: string;
}

export function formatErrorMessage(err: unknown, fallbackMessage = 'An unexpected error occurred.'): string {
  const formatted = classifyError(err, fallbackMessage);
  return formatted.userMessage;
}

export function classifyError(err: unknown, fallbackMessage = 'An unexpected error occurred.'): FormattedError {
  if (!err) {
    return {
      userMessage: fallbackMessage,
      category: 'server_error'
    };
  }

  // If it's a string
  if (typeof err === 'string') {
    return {
      userMessage: err,
      category: 'server_error'
    };
  }

  const anyErr = err as Record<string, any>;
  const rawMsg: string = anyErr.message || anyErr.error_description || anyErr.msg || (err instanceof Error ? err.message : '');
  const code: string = String(anyErr.code || anyErr.status || '');
  const details: string = anyErr.details || anyErr.hint || '';

  // Log in dev environment for fast debugging
  if (import.meta.env?.DEV) {
    console.error('[Solis Error Boundary]', { rawMsg, code, details, err });
  }

  // 1. Permission / RLS Denied
  if (code === '42501' || rawMsg.toLowerCase().includes('permission denied') || rawMsg.toLowerCase().includes('policy')) {
    return {
      userMessage: 'Permission denied. You do not have authorization to access or modify this record.',
      category: 'permission_denied',
      technicalDetails: rawMsg
    };
  }

  // 2. Database Constraint Violations (Foreign key, unique constraint, check constraint)
  if (code === '23503' || rawMsg.toLowerCase().includes('foreign key constraint')) {
    return {
      userMessage: 'Referenced item was not found or has been removed.',
      category: 'constraint_violation',
      technicalDetails: rawMsg
    };
  }

  if (code === '23505' || rawMsg.toLowerCase().includes('duplicate key') || rawMsg.toLowerCase().includes('already exists')) {
    return {
      userMessage: 'A record with this information already exists.',
      category: 'constraint_violation',
      technicalDetails: rawMsg
    };
  }

  // 3. Validation Errors
  if (anyErr.name === 'ValidationError' || rawMsg.toLowerCase().includes('validation')) {
    return {
      userMessage: rawMsg || 'Invalid input data. Please check required fields.',
      category: 'invalid_data',
      technicalDetails: details
    };
  }

  // 4. Network / Connectivity
  if (rawMsg.toLowerCase().includes('fetch') || rawMsg.toLowerCase().includes('network') || rawMsg.toLowerCase().includes('failed to fetch')) {
    return {
      userMessage: 'Unable to connect to the database. Please check your network connection.',
      category: 'network',
      technicalDetails: rawMsg
    };
  }

  // 5. Auth Expired
  if (code === '401' || rawMsg.toLowerCase().includes('jwt') || rawMsg.toLowerCase().includes('session expired') || rawMsg.toLowerCase().includes('not logged in')) {
    return {
      userMessage: 'Your session has expired. Please sign in again.',
      category: 'auth_expired',
      technicalDetails: rawMsg
    };
  }

  // Generic message with readable rawMsg if available
  return {
    userMessage: rawMsg || fallbackMessage,
    category: 'server_error',
    technicalDetails: details
  };
}
