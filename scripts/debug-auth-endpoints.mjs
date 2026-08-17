import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env
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

async function testAuthEndpoints() {
  console.log('================================================================');
  console.log('SUPABASE AUTH FORENSIC DEBUGGER');
  console.log('Supabase URL:', supabaseUrl);
  console.log('================================================================\n');

  // Test 1: Password Sign In with a random/invalid user
  console.log('--- TEST 1: Exact Sign-In Call (/auth/v1/token?grant_type=password) ---');
  console.log('Calling supabase.auth.signInWithPassword with non-existent account...');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'nonexistent_test_account_999@gmail.com',
    password: 'WrongPassword123!'
  });

  console.log('Sign-in result:');
  console.log('  Data user:', loginData?.user ? 'Found' : 'null');
  console.log('  Data session:', loginData?.session ? 'Found' : 'null');
  if (loginError) {
    console.log('  Error name:', loginError.name);
    console.log('  Error message:', `"${loginError.message}"`);
    console.log('  Error code:', loginError.code);
    console.log('  Error status:', loginError.status);
  } else {
    console.log('  No error returned.');
  }

  // Test 2: Password Sign In with the created user
  console.log('\n--- TEST 2: Exact Sign-In Call for User A ---');
  const { data: userALogin, error: userAErr } = await supabase.auth.signInWithPassword({
    email: 'solis_test_user_a_1786948998713@gmail.com',
    password: 'Password@123456'
  });

  console.log('User A Sign-in result:');
  console.log('  Data user:', userALogin?.user ? userALogin.user.id : 'null');
  console.log('  Data session:', userALogin?.session ? 'Active session' : 'null');
  if (userAErr) {
    console.log('  Error name:', userAErr.name);
    console.log('  Error message:', `"${userAErr.message}"`);
    console.log('  Error code:', userAErr.code);
    console.log('  Error status:', userAErr.status);
  }

  // Test 3: Sign Up Call (/auth/v1/signup)
  console.log('\n--- TEST 3: Exact Sign-Up Call (/auth/v1/signup) ---');
  const testEmail = `probe_${Date.now()}@gmail.com`;
  console.log(`Calling supabase.auth.signUp for ${testEmail}...`);
  const { data: signupData, error: signupErr } = await supabase.auth.signUp({
    email: testEmail,
    password: 'ValidPassword123!',
    options: {
      data: { name: 'Probe User', focus_field: 'Engineering' }
    }
  });

  console.log('Sign-up result:');
  console.log('  Data user:', signupData?.user ? signupData.user.id : 'null');
  console.log('  Data session:', signupData?.session ? 'Session created' : 'null (Email confirmation required)');
  if (signupErr) {
    console.log('  Error name:', signupErr.name);
    console.log('  Error message:', `"${signupErr.message}"`);
    console.log('  Error code:', signupErr.code);
    console.log('  Error status:', signupErr.status);
  }
}

testAuthEndpoints();
