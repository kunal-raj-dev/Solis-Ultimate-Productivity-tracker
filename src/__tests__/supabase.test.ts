import { describe, it, expect } from 'vitest';
import {
  mapProfile,
  mapTask,
  mapHabit,
  mapGoal,
  mapMilestone
} from '../services/supabase/supabaseMappers';
import { isSupabaseConfigured } from '../services/supabase/supabaseClient';

describe('Supabase Data Mappers & Model Isolation', () => {
  it('maps database profile row into domain UserProfile', () => {
    const dbRow = {
      id: 'usr_uuid_123',
      name: 'Kunal Sharma',
      email: 'kunal@solis.space',
      focus_field: 'Distributed Systems',
      created_at: '2026-08-17T00:00:00.000Z',
      updated_at: '2026-08-17T08:00:00.000Z',
      preferences: {
        theme: 'dark',
        dailyStudyGoalMinutes: 240
      }
    };

    const mapped = mapProfile(dbRow);
    expect(mapped.id).toBe('usr_uuid_123');
    expect(mapped.name).toBe('Kunal Sharma');
    expect(mapped.focusField).toBe('Distributed Systems');
    expect(mapped.preferences.theme).toBe('dark');
    expect(mapped.preferences.dailyStudyGoalMinutes).toBe(240);
  });

  it('maps database task and subtasks rows into domain Task', () => {
    const taskRow = {
      id: 'task_uuid_1',
      title: 'Master Raft Consensus',
      description: 'Review invariants',
      status: 'in_progress',
      priority: 'high',
      category: 'deep_work',
      due_date: '2026-08-17',
      due_time: '18:00',
      estimated_minutes: 60,
      completed_minutes: 20,
      tags: ['Distributed', 'Consensus'],
      created_at: '2026-08-17T00:00:00.000Z',
      updated_at: '2026-08-17T01:00:00.000Z'
    };

    const subtaskRows = [
      { id: 'sub_1', title: 'Leader election proofs', completed: true, created_at: '2026-08-17T00:10:00.000Z' },
      { id: 'sub_2', title: 'Log compaction mechanics', completed: false, created_at: '2026-08-17T00:15:00.000Z' }
    ];

    const mapped = mapTask(taskRow, subtaskRows);
    expect(mapped.id).toBe('task_uuid_1');
    expect(mapped.title).toBe('Master Raft Consensus');
    expect(mapped.status).toBe('in_progress');
    expect(mapped.dueDate).toBe('2026-08-17');
    expect(mapped.subTasks.length).toBe(2);
    expect(mapped.subTasks[0].completed).toBe(true);
    expect(mapped.subTasks[1].completed).toBe(false);
  });

  it('derives habit streaks dynamically from immutable history records during mapping', () => {
    const habitRow = {
      id: 'hab_uuid_1',
      title: 'Morning Deep Study Block',
      category: 'study',
      frequency: 'daily',
      color: 'coral',
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: '2026-08-17T00:00:00.000Z'
    };

    const history = {
      '2026-08-15': true,
      '2026-08-16': true,
      '2026-08-17': true
    };

    const mapped = mapHabit(habitRow, history);
    expect(mapped.id).toBe('hab_uuid_1');
    expect(mapped.currentStreak).toBeGreaterThanOrEqual(1);
    expect(mapped.history).toEqual(history);
  });

  it('derives goal progress percentage dynamically from milestones during mapping', () => {
    const goalRow = {
      id: 'gol_uuid_1',
      title: 'Publish Distributed Systems Whitepaper',
      horizon: 'medium_term',
      status: 'active',
      category: 'career',
      target_date: '2026-12-31',
      priority: 'high',
      color: 'coral',
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: '2026-08-17T00:00:00.000Z'
    };

    const milestones = [
      mapMilestone({ id: 'm1', title: 'Survey literature', completed: true }),
      mapMilestone({ id: 'm2', title: 'Draft benchmarks', completed: true }),
      mapMilestone({ id: 'm3', title: 'Peer review', completed: false }),
      mapMilestone({ id: 'm4', title: 'Final release', completed: false })
    ];

    const mapped = mapGoal(goalRow, milestones);
    expect(mapped.progressPercentage).toBe(50);
    expect(mapped.milestones.length).toBe(4);
  });

  it('verifies environment configuration detector', () => {
    // In test environment without production keys, isSupabaseConfigured returns false
    const configured = isSupabaseConfigured();
    expect(typeof configured).toBe('boolean');
  });
});
