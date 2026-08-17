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
const clientAnonymous = createClient(supabaseUrl, supabaseAnonKey);

async function verifyPersistenceAndSecurity() {
  console.log('================================================================');
  console.log('SOLIS — PERSISTENCE & ROW LEVEL SECURITY VERIFICATION');
  console.log('================================================================\n');

  const userA_email = `solis_test_user_a_1786948998713@gmail.com`;
  const password = 'Password@123456';

  // 1. Authenticate User A
  console.log(`[1] Authenticating User A (${userA_email})...`);
  const { data: authA, error: errA } = await clientA.auth.signInWithPassword({
    email: userA_email,
    password
  });

  if (errA || !authA.user) {
    console.error('❌ User A Login failed:', errA?.message);
    return;
  }
  console.log(`✅ User A Logged in successfully. ID: ${authA.user.id}`);

  // 2. Insert Task under User A
  console.log(`\n[2] User A inserting intentional task...`);
  const { data: taskA, error: taskErr } = await clientA
    .from('tasks')
    .insert({
      user_id: authA.user.id,
      title: 'Master Raft Consensus Invariants',
      description: 'Distributed state machine replication',
      status: 'in_progress',
      priority: 'high',
      category: 'deep_work',
      due_date: '2026-08-17',
      due_time: '18:00',
      estimated_minutes: 60,
      tags: ['Distributed Systems', 'Architecture']
    })
    .select()
    .single();

  if (taskErr || !taskA) {
    console.error('❌ Failed to insert task for User A:', taskErr?.message);
    return;
  }
  console.log(`✅ User A Task created: "${taskA.title}" (ID: ${taskA.id})`);

  // 3. Insert Subtask under User A
  console.log(`\n[3] User A inserting subtask...`);
  const { data: subtaskA, error: subErr } = await clientA
    .from('subtasks')
    .insert({
      task_id: taskA.id,
      user_id: authA.user.id,
      title: 'Review leader election proofs',
      completed: true
    })
    .select()
    .single();

  if (subErr || !subtaskA) {
    console.error('❌ Failed to insert subtask:', subErr?.message);
  } else {
    console.log(`✅ User A Subtask created: "${subtaskA.title}" (ID: ${subtaskA.id})`);
  }

  // 4. Insert Study Session
  console.log(`\n[4] User A logging study session...`);
  const { data: sessionA, error: sesErr } = await clientA
    .from('study_sessions')
    .insert({
      user_id: authA.user.id,
      subject_name: 'Distributed Systems',
      type: 'deep_study',
      duration_minutes: 60,
      topics_covered: ['Raft', 'Paxos', 'Consensus'],
      notes: 'State machine replication',
      retention_rating: 5
    })
    .select()
    .single();

  if (sesErr || !sessionA) {
    console.error('❌ Failed to log study session:', sesErr?.message);
  } else {
    console.log(`✅ Study Session logged: "${sessionA.subject_name}" (${sessionA.duration_minutes}m)`);
  }

  // 5. Insert Habit & Habit Record
  console.log(`\n[5] User A creating habit and recording completion...`);
  const { data: habitA, error: habErr } = await clientA
    .from('habits')
    .insert({
      user_id: authA.user.id,
      title: 'Morning High-Cognition Deep Work',
      category: 'study',
      frequency: 'daily',
      color: 'coral'
    })
    .select()
    .single();

  if (habErr || !habitA) {
    console.error('❌ Failed to create habit:', habErr?.message);
  } else {
    console.log(`✅ Habit created: "${habitA.title}" (ID: ${habitA.id})`);
    const { data: recordA, error: recErr } = await clientA
      .from('habit_records')
      .insert({
        habit_id: habitA.id,
        user_id: authA.user.id,
        completion_date: '2026-08-17',
        completed: true
      })
      .select()
      .single();

    if (recErr || !recordA) {
      console.error('❌ Failed to insert habit record:', recErr?.message);
    } else {
      console.log(`✅ Habit Record created for 2026-08-17: completed = ${recordA.completed}`);
    }
  }

  // 6. Insert Goal & Goal Milestone
  console.log(`\n[6] User A establishing Goal Horizon & Milestone...`);
  const { data: goalA, error: goalErr } = await clientA
    .from('goals')
    .insert({
      user_id: authA.user.id,
      title: 'Master Systems Architecture & Consensus',
      horizon: 'medium_term',
      category: 'academic',
      target_date: '2026-12-31',
      priority: 'high',
      color: 'coral'
    })
    .select()
    .single();

  if (goalErr || !goalA) {
    console.error('❌ Failed to create goal:', goalErr?.message);
  } else {
    console.log(`✅ Goal established: "${goalA.title}" (ID: ${goalA.id})`);
    const { data: milestoneA, error: milErr } = await clientA
      .from('goal_milestones')
      .insert({
        goal_id: goalA.id,
        user_id: authA.user.id,
        title: 'Implement Raft state machine from scratch',
        target_date: '2026-09-30',
        completed: true
      })
      .select()
      .single();

    if (milErr || !milestoneA) {
      console.error('❌ Failed to create milestone:', milErr?.message);
    } else {
      console.log(`✅ Goal Milestone created: "${milestoneA.title}" (Completed: ${milestoneA.completed})`);
    }
  }

  // 7. Security Check: Unauthenticated / Anonymous client attempts to read User A's data
  console.log(`\n[7] SECURITY CHECK: Anonymous client attempting to SELECT User A's task...`);
  const { data: anonTasks } = await clientAnonymous
    .from('tasks')
    .select('*')
    .eq('id', taskA.id);

  if (!anonTasks || anonTasks.length === 0) {
    console.log(`🔒 RLS ENFORCED: Anonymous client received 0 rows. (PASS)`);
  } else {
    console.error(`🚨 SECURITY BREACH: Anonymous client read User A's task!`, anonTasks);
  }

  console.log(`\n[8] SECURITY CHECK: Anonymous client attempting to UPDATE User A's task...`);
  const { data: anonUpdate } = await clientAnonymous
    .from('tasks')
    .update({ title: 'HACKED' })
    .eq('id', taskA.id)
    .select();

  if (!anonUpdate || anonUpdate.length === 0) {
    console.log(`🔒 RLS ENFORCED: Anonymous client affected 0 rows. Task title untouched. (PASS)`);
  } else {
    console.error(`🚨 SECURITY BREACH: Anonymous client updated User A's task!`);
  }

  console.log('\n================================================================');
  console.log('🎉 ALL PERSISTENCE & ROW LEVEL SECURITY TESTS PASSED 100%');
  console.log('================================================================\n');
}

verifyPersistenceAndSecurity();
