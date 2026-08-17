import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env file manually
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

console.log('Testing Supabase Connection to:', supabaseUrl);
console.log('Using Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.slice(0, 16)}...` : 'NONE');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
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

  console.log('\n--- Checking Table Connectivity & RLS ---');
  let missingTables = [];
  let accessibleTables = [];

  for (const table of tables) {
    try {
      const { data, error, status } = await supabase.from(table).select('*').limit(1);
      if (error) {
        if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log(`❌ Table '${table}' DOES NOT EXIST (Migration needed)`);
          missingTables.push(table);
        } else if (error.code === 'PGRST301' || error.message.includes('JWT') || error.message.includes('permission')) {
          console.log(`🔒 Table '${table}' exists (Protected by RLS: ${error.message})`);
          accessibleTables.push(table);
        } else {
          console.log(`⚠️ Table '${table}' returned error:`, error.message, `(Code: ${error.code})`);
          missingTables.push(table);
        }
      } else {
        console.log(`✅ Table '${table}' exists & accessible (Rows returned: ${data ? data.length : 0})`);
        accessibleTables.push(table);
      }
    } catch (err) {
      console.log(`❌ Error querying '${table}':`, err.message);
      missingTables.push(table);
    }
  }

  console.log('\n--- Verification Summary ---');
  console.log(`Accessible/Existing Tables: ${accessibleTables.length} / ${tables.length}`);
  console.log(`Missing/Pending Tables: ${missingTables.length} / ${tables.length}`);

  if (missingTables.length > 0) {
    console.log('\nMigration has not been applied yet to the remote Supabase database.');
    console.log('The SQL migration file is ready at: supabase/migrations/20260817_initial_schema.sql');
  } else {
    console.log('\n🎉 ALL TABLES VERIFIED AND OPERATIONAL!');
  }
}

verify();
