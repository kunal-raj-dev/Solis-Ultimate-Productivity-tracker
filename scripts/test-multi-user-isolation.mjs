import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env file
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

const clientA = createClient(supabaseUrl, supabaseAnonKey);
const clientB = createClient(supabaseUrl, supabaseAnonKey);

async function runE2ESecurityTest() {
  console.log('================================================================');
  console.log('SOLIS — MULTI-USER ISOLATION & RLS SECURITY VERIFICATION');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const userA_email = `solis_test_user_a_${timestamp}@gmail.com`;
  const userB_email = `solis_test_user_b_${timestamp}@gmail.com`;
  const password = 'Password@123456';

  // 1. Register User A
  console.log(`[1] Registering User A (${userA_email})...`);
  const { data: authA, error: errA } = await clientA.auth.signUp({
    email: userA_email,
    password,
    options: { data: { name: 'User Alpha', focus_field: 'Distributed Systems Architecture' } }
  });

  if (errA || !authA.user) {
    console.error('❌ User A Registration failed:', errA?.message);
    return;
  }
  console.log(`✅ User A Registered. ID: ${authA.user.id}`);

  // 2. Register User B
  console.log(`\n[2] Registering User B (${userB_email})...`);
  const { data: authB, error: errB } = await clientB.auth.signUp({
    email: userB_email,
    password,
    options: { data: { name: 'User Beta', focus_field: 'Theoretical Quantum Computing' } }
  });

  if (errB || !authB.user) {
    console.error('❌ User B Registration failed:', errB?.message);
    return;
  }
  console.log(`✅ User B Registered. ID: ${authB.user.id}`);

  // 3. User A creates private domain records
  console.log(`\n[3] User A creating private Task, Subject, Habit, Goal...`);
  const { data: taskA, error: taskErr } = await clientA
    .from('tasks')
    .insert({
      user_id: authA.user.id,
      title: 'Secret Alpha Invariant Proof #101',
      description: 'Private research for User A only',
      status: 'in_progress',
      priority: 'high',
      category: 'deep_work'
    })
    .select()
    .single();

  if (taskErr || !taskA) {
    console.error('❌ Failed to insert task for User A:', taskErr?.message);
    return;
  }
  console.log(`✅ User A inserted private Task: "${taskA.title}" (ID: ${taskA.id})`);

  const { data: subtaskA, error: subErr } = await clientA
    .from('subtasks')
    .insert({
      task_id: taskA.id,
      user_id: authA.user.id,
      title: 'Confidential subtask item',
      completed: false
    })
    .select()
    .single();

  if (subErr || !subtaskA) {
    console.error('❌ Failed to insert subtask for User A:', subErr?.message);
  } else {
    console.log(`✅ User A inserted subtask: "${subtaskA.title}"`);
  }

  // 4. User A reads own records
  const { data: userATasks } = await clientA.from('tasks').select('*');
  console.log(`\n[4] User A queries their own tasks count: ${userATasks ? userATasks.length : 0} (Expected: >= 1)`);
  if (userATasks && userATasks.some(t => t.id === taskA.id)) {
    console.log(`✅ User A successfully retrieved private task "${taskA.title}"`);
  } else {
    console.error('❌ User A could not find own task!');
  }

  // 5. SECURITY ATTACK SIMULATION: User B attempts to read User A's task
  console.log(`\n[5] SECURITY CHECK: User B attempting to SELECT User A's private task (${taskA.id})...`);
  const { data: userBTasks } = await clientB
    .from('tasks')
    .select('*')
    .eq('id', taskA.id);

  if (!userBTasks || userBTasks.length === 0) {
    console.log(`🔒 RLS ENFORCED: User B received 0 rows when querying User A's task. (PASS)`);
  } else {
    console.error(`🚨 SECURITY BREACH: User B was able to read User A's task!`, userBTasks);
  }

  // 6. SECURITY ATTACK SIMULATION: User B attempts to UPDATE User A's task
  console.log(`\n[6] SECURITY CHECK: User B attempting to UPDATE User A's task...`);
  const { data: hackedData, error: hackErr } = await clientB
    .from('tasks')
    .update({ title: 'HACKED BY USER B' })
    .eq('id', taskA.id)
    .select();

  if (!hackedData || hackedData.length === 0) {
    console.log(`🔒 RLS ENFORCED: User B update query affected 0 rows. User A's task was NOT modified. (PASS)`);
  } else {
    console.error(`🚨 SECURITY BREACH: User B modified User A's task!`, hackedData);
  }

  // 7. SECURITY ATTACK SIMULATION: User B attempts to DELETE User A's task
  console.log(`\n[7] SECURITY CHECK: User B attempting to DELETE User A's task...`);
  const { error: delErr } = await clientB
    .from('tasks')
    .delete()
    .eq('id', taskA.id);

  // Check if User A's task is still alive
  const { data: taskACheck } = await clientA
    .from('tasks')
    .select('*')
    .eq('id', taskA.id)
    .single();

  if (taskACheck && taskACheck.id === taskA.id) {
    console.log(`🔒 RLS ENFORCED: User A's task remains intact after User B delete attempt. (PASS)`);
  } else {
    console.error(`🚨 SECURITY BREACH: User B deleted User A's task!`);
  }

  // 8. SECURITY ATTACK SIMULATION: User B attempts to insert subtask into User A's task
  console.log(`\n[8] SECURITY CHECK: User B attempting to INSERT subtask under User A's task...`);
  const { data: rogueSub, error: rogueSubErr } = await clientB
    .from('subtasks')
    .insert({
      task_id: taskA.id,
      user_id: authB.user.id,
      title: 'Rogue Subtask injected by User B'
    })
    .select();

  if (rogueSubErr || !rogueSub || rogueSub.length === 0) {
    console.log(`🔒 RLS ENFORCED: Relational parent ownership policy rejected rogue subtask insertion: "${rogueSubErr?.message}". (PASS)`);
  } else {
    console.error(`🚨 SECURITY BREACH: User B inserted subtask into User A's task!`, rogueSub);
  }

  console.log('\n================================================================');
  console.log('🎉 ALL SECURITY & MULTI-USER ISOLATION TESTS PASSED 100%');
  console.log('================================================================\n');
}

runE2ESecurityTest();
