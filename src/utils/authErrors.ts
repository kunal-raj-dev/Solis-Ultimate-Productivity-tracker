/**
 * Solis - Centralized Supabase Auth Error Classifier
 * Translates raw PostgREST and GoTrue error codes into accurate, actionable user messages.
 */

export interface FormattedAuthError {
  userMessage: string;
  code: string;
  category: 'rate_limit' | 'unconfirmed' | 'invalid_credentials' | 'duplicate_user' | 'network' | 'generic';
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
  const message: string = (error.message || error.msg || '').toLowerCase();
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

  // 2. Request Rate Limit (Too many sign-in attempts)
  if (
    code === 'over_request_rate_limit' ||
    message.includes('too many requests') ||
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

  // 4. Invalid Login Credentials
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

  // 6. Network / Connectivity Failures
  if (
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('timeout')
  ) {
    return {
      userMessage: 'Network connection failure. Please check your internet connection.',
      code: 'network_error',
      category: 'network'
    };
  }

  // Generic fallback preserving server message
  return {
    userMessage: error.message || 'Authentication error. Please try again.',
    code: code || 'auth_error',
    category: 'generic'
  };
}
