/**
 * Solis - Centralized Supabase Auth Error Classifier
 * Translates raw PostgREST and GoTrue error codes into accurate, actionable user messages.
 */

export interface FormattedAuthError {
  userMessage: string;
  code: string;
  category: 'rate_limit' | 'unconfirmed' | 'invalid_credentials' | 'duplicate_user' | 'validation' | 'auth_expired' | 'network' | 'generic';
}

export function formatAuthError(error: any): FormattedAuthError {
  if (!error) {
    return {
      userMessage: 'An unexpected authentication error occurred.',
      code: 'unknown',
      category: 'generic'
    };
  }

  const code: string = error.code || error.error_code || '';
  const message: string = (error.message || error.msg || (typeof error === 'string' ? error : '')).toLowerCase();
  const status: number = error.status || 0;

  // 1. Email Send Rate Limit (Supabase free tier 3 emails/hour quota)
  if (
    code === 'over_email_send_rate_limit' ||
    message.includes('email rate limit exceeded') ||
    message.includes('over_email_send_rate_limit')
  ) {
    return {
      userMessage:
        'Supabase signup email rate limit reached (3 confirmation emails/hour on free tier). To enable unlimited instant signups, turn OFF "Confirm email" in Supabase Dashboard (Authentication → Providers → Email).',
      code: 'over_email_send_rate_limit',
      category: 'rate_limit'
    };
  }

  // 2. Request Rate Limit (Too many sign-in attempts / HTTP 429)
  if (
    code === 'over_request_rate_limit' ||
    message.includes('too many requests') ||
    message.includes('rate limit') ||
    status === 429
  ) {
    return {
      userMessage: 'Too many authentication attempts. Please wait a moment before trying again.',
      code: 'over_request_rate_limit',
      category: 'rate_limit'
    };
  }

  // 3. Email Not Confirmed
  if (
    code === 'email_not_confirmed' ||
    message.includes('email not confirmed')
  ) {
    return {
      userMessage:
        'Your email address has not been confirmed yet. Please verify your email inbox or disable "Confirm email" in Supabase Dashboard to log in directly.',
      code: 'email_not_confirmed',
      category: 'unconfirmed'
    };
  }

  // 4. Invalid Login Credentials (Account enumeration defense)
  if (
    code === 'invalid_credentials' ||
    code === 'invalid_grant' ||
    message.includes('invalid login credentials') ||
    message.includes('invalid credentials')
  ) {
    return {
      userMessage: 'Invalid email address or password. Please verify your credentials and try again.',
      code: 'invalid_credentials',
      category: 'invalid_credentials'
    };
  }

  // 5. User Already Registered
  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    message.includes('user already registered') ||
    message.includes('already exists')
  ) {
    return {
      userMessage: 'An account with this email address already exists. Please sign in instead.',
      code: 'user_already_exists',
      category: 'duplicate_user'
    };
  }

  // 6. Password Policy / Validation
  if (
    code === 'weak_password' ||
    message.includes('password should be at least') ||
    message.includes('password is too short') ||
    message.includes('weak password')
  ) {
    return {
      userMessage: 'Password must be at least 6 characters.',
      code: 'weak_password',
      category: 'validation'
    };
  }

  // 7. Session / JWT Expired
  if (
    code === 'jwt_expired' ||
    code === 'bad_jwt' ||
    code === 'session_not_found' ||
    message.includes('jwt expired') ||
    message.includes('session expired') ||
    message.includes('token is expired')
  ) {
    return {
      userMessage: 'Your authentication session has expired. Please sign in again.',
      code: 'jwt_expired',
      category: 'auth_expired'
    };
  }

  // 8. Signups Disabled
  if (
    code === 'signup_disabled' ||
    message.includes('signups not allowed')
  ) {
    return {
      userMessage: 'New account registrations are temporarily closed.',
      code: 'signup_disabled',
      category: 'generic'
    };
  }

  // 9. Network / Connectivity Failures
  if (
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('networkerror') ||
    message.includes('timeout') ||
    message.includes('aborterror')
  ) {
    return {
      userMessage: 'Network connection failure. Please check your internet connection.',
      code: 'network_error',
      category: 'network'
    };
  }

  // Generic fallback with information leakage sanitization
  const rawMsg = error.message || (typeof error === 'string' ? error : 'Authentication error. Please try again.');
  const sanitizedMsg = rawMsg.replace(/postgres:\/\/[^ ]+/gi, '[REDACTED_DB_URL]');

  return {
    userMessage: sanitizedMsg,
    code: code || 'auth_error',
    category: 'generic'
  };
}
