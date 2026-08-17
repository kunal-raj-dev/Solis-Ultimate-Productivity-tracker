import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...vals] = trimmed.split('=');
    env[key.trim()] = vals.join('=').trim();
  }
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

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
