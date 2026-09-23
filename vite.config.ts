import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function keepaliveDevPlugin() {
  return {
    name: 'keepalive-dev-api',
    configureServer(server: any) {
      server.middlewares.use('/api/keepalive', async (_req: any, res: any) => {
        const startTime = Date.now();
        const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tmxrupqgttaxlcrrcubt.supabase.co';
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_-vxrkvw_6Ef3rwFd957ymw_gfmM99Co';

        let supabaseStatus = 'unknown';
        let latencyMs = 0;
        let isAlive = false;

        try {
          const cleanUrl = supabaseUrl.replace(/\/+$/, '');
          const pingUrl = `${cleanUrl}/rest/v1/tasks?select=id&limit=1`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const response = await fetch(pingUrl, {
            method: 'GET',
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              Accept: 'application/json',
              'User-Agent': 'Solis-DevServer-Keepalive/1.0'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          latencyMs = Date.now() - startTime;

          if (response.status === 200 || response.status === 204 || response.status === 206) {
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

        const payload = {
          service: 'Solis Productivity OS',
          environment: 'development',
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

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        res.statusCode = isAlive ? 200 : 503;
        res.end(JSON.stringify(payload, null, 2));
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), keepaliveDevPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  server: {
    port: 3000,
    open: false,
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (
              id.includes('/react/') ||
              id.includes('\\react\\') ||
              id.includes('/react-dom/') ||
              id.includes('\\react-dom\\') ||
              id.includes('/react-router/') ||
              id.includes('\\react-router\\') ||
              id.includes('/react-router-dom/') ||
              id.includes('\\react-router-dom\\') ||
              id.includes('/framer-motion/') ||
              id.includes('\\framer-motion\\')
            ) {
              return 'vendor-framework';
            }
            if (id.includes('remotion') || id.includes('@remotion')) {
              return 'vendor-remotion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            return 'vendor-libs';
          }
        }
      }
    }
  }
});
