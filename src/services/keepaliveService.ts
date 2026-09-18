/**
 * ============================================================================
 * SOLIS CLIENT-SIDE KEEPALIVE & DATABASE HEALTH MONITOR
 * ============================================================================
 * 
 * Purpose:
 * Monitors Supabase connectivity, detects when the database is waking up
 * or paused due to free-tier inactivity, and periodically pings the server
 * while the app is active to keep the session and connection warm.
 */

import { isSupabaseConfigured } from './supabase/supabaseClient';
import { ServiceContainer } from './dataService';

export type HealthState = 'healthy' | 'waking_up' | 'paused' | 'offline' | 'mock' | 'error';

export interface DatabaseHealthInfo {
  state: HealthState;
  message: string;
  latencyMs?: number;
  lastChecked: Date | null;
  retryCount: number;
}

type HealthListener = (info: DatabaseHealthInfo) => void;

class KeepaliveService {
  private static instance: KeepaliveService;
  private intervalId: any = null;
  private listeners: Set<HealthListener> = new Set();
  private retryCount = 0;
  private currentHealth: DatabaseHealthInfo = {
    state: 'healthy',
    message: 'Operational',
    lastChecked: null,
    retryCount: 0
  };

  public static getInstance(): KeepaliveService {
    if (!KeepaliveService.instance) {
      KeepaliveService.instance = new KeepaliveService();
    }
    return KeepaliveService.instance;
  }

  public getHealth(): DatabaseHealthInfo {
    return this.currentHealth;
  }

  public subscribe(listener: HealthListener): () => void {
    this.listeners.add(listener);
    listener(this.currentHealth);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentHealth);
      } catch (err) {
        console.error('[KeepaliveService] Error notifying listener:', err);
      }
    }
  }

  /**
   * Pings Supabase or the keepalive endpoint to reset inactivity and test latency
   */
  public async checkHealth(): Promise<DatabaseHealthInfo> {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.currentHealth = {
        state: 'offline',
        message: 'No internet connection detected.',
        lastChecked: new Date(),
        retryCount: this.retryCount
      };
      this.notify();
      return this.currentHealth;
    }

    if (ServiceContainer.getMode() === 'mock' || !isSupabaseConfigured()) {
      this.currentHealth = {
        state: 'mock',
        message: 'Local in-memory development mode active.',
        lastChecked: new Date(),
        retryCount: 0
      };
      this.notify();
      return this.currentHealth;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    // Query actual table with limit=1 to trigger real PostgreSQL query
    const pingEndpoint = `${cleanUrl}/rest/v1/tasks?select=id&limit=1`;

    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const response = await fetch(pingEndpoint, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Accept': 'application/json',
          'User-Agent': 'Solis-Client-Keepalive/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (response.status === 200 || response.status === 204 || response.status === 206) {
        this.retryCount = 0;
        this.currentHealth = {
          state: 'healthy',
          message: 'Supabase PostgreSQL service is active and responsive.',
          latencyMs,
          lastChecked: new Date(),
          retryCount: 0
        };
      } else if (response.status === 503 || response.status === 521 || response.status === 522) {
        this.retryCount++;
        this.currentHealth = {
          state: 'paused',
          message: 'Supabase database appears to be paused or waking up from inactivity.',
          latencyMs,
          lastChecked: new Date(),
          retryCount: this.retryCount
        };
      } else if (response.status === 401 || response.status === 403) {
        this.retryCount++;
        this.currentHealth = {
          state: 'error',
          message: 'Supabase API key invalid or unauthorized.',
          latencyMs,
          lastChecked: new Date(),
          retryCount: this.retryCount
        };
      } else {
        this.currentHealth = {
          state: 'healthy',
          message: `Database responded with status ${response.status}`,
          latencyMs,
          lastChecked: new Date(),
          retryCount: 0
        };
      }
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      this.retryCount++;
      const isTimeout = err.name === 'AbortError';

      this.currentHealth = {
        state: this.retryCount > 1 ? 'paused' : 'waking_up',
        message: isTimeout
          ? 'Database connection timed out. Supabase may be waking up from inactivity.'
          : `Connection error: ${err.message || 'Unable to reach database'}`,
        latencyMs,
        lastChecked: new Date(),
        retryCount: this.retryCount
      };
    }

    this.notify();
    return this.currentHealth;
  }

  /**
   * Initializes background heartbeat while tab is open
   */
  public start(intervalMinutes = 4): void {
    if (this.intervalId) return;

    // Run initial health check shortly after mount
    setTimeout(() => {
      this.checkHealth().catch(() => {});
    }, 1500);

    // Periodic heartbeat
    this.intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.checkHealth().catch(() => {});
      }
    }, intervalMinutes * 60 * 1000);

    // Check on tab focus / visibility change
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkHealth().catch(() => {});
        }
      });
    }
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const keepaliveService = KeepaliveService.getInstance();
