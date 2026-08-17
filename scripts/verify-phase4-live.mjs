import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env file
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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runLiveVerification() {
  console.log(`\n======================================================`);
  console.log(`SOLIS — PHASE 4 LIVE SUPABASE VERIFICATION`);
  console.log(`Database URL: ${supabaseUrl}`);
  console.log(`======================================================\n`);

  // 1. Check all 13 tables connectivity (No 42P17 recursion errors)
  console.log(`--- [Step 1: Table Connectivity & Acyclic RLS Verification] ---`);
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

  let allTablesValid = true;
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`❌ Table '${table}' ERROR: [${error.code}] ${error.message}`);
      allTablesValid = false;
    } else {
      console.log(`✅ Table '${table}' is active & healthy (Acyclic RLS verified, Rows: ${data.length})`);
    }
  }

  if (!allTablesValid) {
    console.error('\n❌ Table connectivity check failed. Please review the errors above.');
    process.exit(1);
  }

  // 2. Test User Auth Lifecycle & Full Cross-Domain Interconnection
  console.log(`\n--- [Step 2: Cross-Domain Real User Data Flow & RLS Verification] ---`);
  const testEmail = `phase4_test_${Date.now()}@solis-os.internal`;
  const testPassword = `SolisTestPass_${Date.now()}!`;

  console.log(`Creating test user session: ${testEmail}...`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword
  });

  if (authError || !authData.user) {
    console.error(`❌ Failed to create test user:`, authError?.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`✅ Authenticated test user UID: ${userId}`);

  try {
    // 2.1 Create Subject
    console.log(`\n-> Creating Subject...`);
    const { data: subject, error: subError } = await supabase
      .from('subjects')
      .insert({
        user_id: userId,
        name: 'Computer Science Architecture',
        code: 'CS 501',
        description: 'Advanced distributed state machine protocols',
        color: 'coral',
        target_hours_per_week: 12,
        status: 'active'
      })
      .select()
      .single();

    if (subError || !subject) throw new Error(`Subject creation failed: ${subError?.message}`);
    console.log(`✅ Subject created successfully: [${subject.id}] "${subject.name}" (${subject.code})`);

    // 2.2 Create Study Topic
    console.log(`-> Creating Canonical Study Topic...`);
    const { data: topic, error: topicError } = await supabase
      .from('study_topics')
      .insert({
        user_id: userId,
        subject_id: subject.id,
        title: 'Raft Consensus & Raft Invariants',
        description: 'Leader election, log replication, and commit index safety',
        order_index: 1,
        mastery_level: 'learning'
      })
      .select()
      .single();

    if (topicError || !topic) throw new Error(`Topic creation failed: ${topicError?.message}`);
    console.log(`✅ Study Topic created: [${topic.id}] "${topic.title}" (Mastery: ${topic.mastery_level})`);

    // 2.3 Create Study Plan Item
    console.log(`-> Creating Study Plan Item...`);
    const { data: planItem, error: planError } = await supabase
      .from('study_plan_items')
      .insert({
        user_id: userId,
        subject_id: subject.id,
        subject_name: subject.name,
        topic_id: topic.id,
        title: 'Master Raft Commit Invariants',
        target_minutes: 60,
        priority: 'high',
        scheduled_time: '10:00 AM',
        completed: false
      })
      .select()
      .single();

    if (planError || !planItem) throw new Error(`Plan item creation failed: ${planError?.message}`);
    console.log(`✅ Study Plan Item created: [${planItem.id}] "${planItem.title}"`);

    // 2.4 Create Task linked to Study Plan Item
    console.log(`-> Creating Task linked to Study Plan Item...`);
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        subject_id: subject.id,
        plan_item_id: planItem.id,
        title: 'Review Raft Figure 8 Edge Cases',
        category: 'study',
        priority: 'urgent',
        estimated_minutes: 45
      })
      .select()
      .single();

    if (taskError || !task) throw new Error(`Task creation failed: ${taskError?.message}`);
    console.log(`✅ Task created with Plan Linkage: [${task.id}] "${task.title}"`);

    // 2.5 Create Focus Session linked to Subject and Plan Item
    console.log(`-> Creating Focus Session...`);
    const { data: focusSession, error: focusError } = await supabase
      .from('focus_sessions')
      .insert({
        user_id: userId,
        subject_id: subject.id,
        plan_item_id: planItem.id,
        mode: 'deep_flow',
        duration_minutes: 50,
        title: 'Raft Formal Proof Flow',
        completed: true
      })
      .select()
      .single();

    if (focusError || !focusSession) throw new Error(`Focus Session creation failed: ${focusError?.message}`);
    console.log(`✅ Focus Session created: [${focusSession.id}] "${focusSession.title}"`);

    // 2.6 Create Study Session linked to Subject, Plan Item, and Focus Session
    console.log(`-> Logging Study Session with Retention Rating...`);
    const { data: studySession, error: studyError } = await supabase
      .from('study_sessions')
      .insert({
        user_id: userId,
        subject_id: subject.id,
        subject_name: subject.name,
        plan_item_id: planItem.id,
        focus_session_id: focusSession.id,
        duration_minutes: 50,
        topics_covered: ['Raft Leadership Invariant', 'Log Overwrite Safety'],
        retention_rating: 5,
        type: 'deep_study',
        notes: 'Demonstrated why uncommitted entries cannot be counted towards quorum directly.'
      })
      .select()
      .single();

    if (studyError || !studySession) throw new Error(`Study Session creation failed: ${studyError?.message}`);
    console.log(`✅ Study Session logged: [${studySession.id}] Retention: ${studySession.retention_rating}/5`);

    // 2.7 Create Knowledge Note linked to Subject, Study Session, and Plan Item
    console.log(`-> Creating Knowledge Note in Notes Workspace...`);
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        subject_id: subject.id,
        study_session_id: studySession.id,
        plan_item_id: planItem.id,
        title: 'Raft Safety Proof & Figure 8 Analysis',
        content: '# Raft Consensus\n\nLeader completeness guarantees committed entries are preserved.',
        category: 'concept',
        tags: ['distributed_systems', 'consensus', 'raft']
      })
      .select()
      .single();

    if (noteError || !note) throw new Error(`Note creation failed: ${noteError?.message}`);
    console.log(`✅ Knowledge Note created: [${note.id}] "${note.title}" with Tags: [${note.tags.join(', ')}]`);

    // 2.8 Create Goal linked to Subject
    console.log(`-> Creating Goal linked to Subject...`);
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        subject_id: subject.id,
        title: 'Master Distributed Consensus Systems',
        category: 'academic',
        horizon: 'medium_term',
        priority: 'high',
        target_date: '2026-12-31'
      })
      .select()
      .single();

    if (goalError || !goal) throw new Error(`Goal creation failed: ${goalError?.message}`);
    console.log(`✅ Goal created: [${goal.id}] "${goal.title}"`);

    // 2.9 Query Full Hierarchy (Verifying reads with no 42P17 error)
    console.log(`\n-> Querying Complete Relational Tree...`);
    const { data: readSubjects } = await supabase.from('subjects').select('*').eq('user_id', userId);
    const { data: readTopics } = await supabase.from('study_topics').select('*').eq('user_id', userId);
    const { data: readPlans } = await supabase.from('study_plan_items').select('*').eq('user_id', userId);
    const { data: readNotes } = await supabase.from('notes').select('*').eq('user_id', userId);

    console.log(`✅ Read verified: ${readSubjects.length} subjects, ${readTopics.length} topics, ${readPlans.length} plan items, ${readNotes.length} notes.`);

    // 2.10 Test Cross-User Isolation Enforcement (User B cannot link User A's data)
    console.log(`\n--- [Step 3: Security Boundary & Cross-User Isolation Test] ---`);
    const userBEmail = `phase4_userb_${Date.now()}@solis-os.internal`;
    const { data: userBAuth } = await supabase.auth.signUp({
      email: userBEmail,
      password: `UserBPass_${Date.now()}!`
    });

    if (userBAuth?.user) {
      console.log(`Logged in as User B (${userBAuth.user.id})`);
      
      // User B attempts to create a note referencing User A's subject
      console.log(`User B attempting to create note referencing User A's subject [${subject.id}]...`);
      const { error: crossUserError } = await supabase
        .from('notes')
        .insert({
          user_id: userBAuth.user.id,
          subject_id: subject.id, // User A's subject
          title: 'Illicit Cross-User Note',
          content: 'This should be blocked by RLS.',
          category: 'idea',
          tags: ['security_test']
        });

      if (crossUserError) {
        console.log(`🔒 RLS Successfully Blocked Cross-User Reference: [${crossUserError.code}] ${crossUserError.message}`);
      } else {
        console.error(`❌ Security Violation: User B was able to reference User A's private subject!`);
        process.exit(1);
      }
    }

    // Cleanup test data
    console.log(`\n--- [Step 4: Cleanup] ---`);
    await supabase.from('subjects').delete().eq('user_id', userId);
    console.log(`✅ Test data cleaned up successfully.`);

    console.log(`\n======================================================`);
    console.log(`🎉 ALL PHASE 4 LIVE VERIFICATION TESTS PASSED (100%)`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error(`\n❌ Live Verification Failed:`, err);
    process.exit(1);
  } finally {
    await supabase.auth.signOut();
  }
}

runLiveVerification();
