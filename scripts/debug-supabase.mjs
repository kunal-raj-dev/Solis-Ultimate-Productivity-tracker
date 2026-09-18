import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Safe .env loader
function loadEnv() {
  const env = { ...process.env };
  const envFiles = ['.env', '.env.local'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx !== -1) {
              const key = trimmed.slice(0, eqIdx).trim();
              const val = trimmed.slice(eqIdx + 1).trim();
              if (!env[key]) env[key] = val;
            }
          }
        }
      } catch {}
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://tmxrupqgttaxlcrrcubt.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const tables = [
    'profiles',
    'subjects',
    'study_topics',
    'tasks',
    'subtasks',
    'study_sessions',
    'study_plan_items',
    'focus_sessions',
    'habits',
    'habit_records',
    'goals',
    'goal_milestones',
    'notes'
  ];

  for (const t of tables) {
    const res = await supabase.from(t).select('*').limit(1);
    console.log(`Table: ${t} -> Status: ${res.status}, Error:`, res.error ? JSON.stringify(res.error) : 'NONE', `Data length: ${res.data?.length}`);
  }
}

run();
