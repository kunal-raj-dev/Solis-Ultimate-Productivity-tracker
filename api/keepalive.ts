/**
 * ============================================================================
 * VERCEL SERVERLESS KEEPALIVE & HEALTH ENDPOINT (/api/keepalive)
 * ============================================================================
 * 
 * Scheduled via vercel.json cron to run daily, resetting Supabase 7-day
 * inactivity timer even if zero user traffic arrives at the frontend.
 */

export const config = {
  runtime: 'edge', // Fast edge runtime for low-latency serverless execution
};

export default async function handler(request: Request) {
  const startTime = Date.now();
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  let supabaseStatus = 'unknown';
  let latencyMs = 0;
  let isAlive = false;

  if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id')) {
    try {
      const cleanUrl = supabaseUrl.replace(/\/+$/, '');
      // Query actual table with limit=1 to trigger real PostgreSQL SELECT query
      const pingUrl = `${cleanUrl}/rest/v1/tasks?select=id&limit=1`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(pingUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Accept': 'application/json',
          'User-Agent': 'Solis-Vercel-Cron-Keepalive/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      latencyMs = Date.now() - startTime;

      if (response.status === 200 || response.status === 204 || response.status === 206) {
        // Real PostgreSQL query executed, resetting 7-day inactivity clock
        supabaseStatus = 'active';
        isAlive = true;
      } else if (response.status === 503 || response.status === 521 || response.status === 522) {
        supabaseStatus = 'paused_or_sleeping';
        isAlive = false;
      } else if (response.status === 401 || response.status === 403) {
        supabaseStatus = 'invalid_key_or_unauthorized';
        isAlive = false;
      } else {
        supabaseStatus = `http_${response.status}`;
        isAlive = true;
      }
    } catch (err: any) {
      latencyMs = Date.now() - startTime;
      supabaseStatus = err.name === 'AbortError' ? 'timeout' : 'unreachable';
      isAlive = false;
    }
  } else {
    supabaseStatus = 'mock_mode';
    isAlive = true;
  }

  const payload = {
    service: 'Solis Productivity OS',
    keepalive: 'active',
    status: isAlive ? 'healthy' : 'degraded',
    supabase: {
      url: supabaseUrl,
      status: supabaseStatus,
      latencyMs
    },
    timestamp: new Date().toISOString(),
    uptimeMessage: 'Inactivity clock reset. Supabase database kept warm.'
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: isAlive ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}
