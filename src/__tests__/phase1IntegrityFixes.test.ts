import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockDataService } from '../services/mock/mockService';
import { calculateWorkload } from '../utils/tasks/workloadCalculator';
import { SupabaseFocusService } from '../services/supabase/modules/focus.service';
import { SupabaseHabitService } from '../services/supabase/modules/habits.service';
import { SupabaseGoalService } from '../services/supabase/modules/goals.service';
import { queryCache } from '../services/cache';

const mockStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStore[key] ?? null,
  setItem: (key: string, value: string) => {
    mockStore[key] = String(value);
  },
  removeItem: (key: string) => {
    delete mockStore[key];
  },
  clear: () => {
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
  }
};

describe('Phase 1 — Critical Data Integrity, Security & Database Fixes', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    // @ts-ignore
    global.window = { localStorage: mockLocalStorage } as any;
    // @ts-ignore
    global.localStorage = mockLocalStorage as any;
    queryCache.invalidate();
  });

  it('persists profile and timer/capacity preferences via auth.updateProfile and localStorage', async () => {
    const mockService = new MockDataService();
    const updated = await mockService.auth.updateProfile({
      name: 'Ada Lovelace',
      email: 'ada@analytical.engine',
      focusField: 'Symbolic Computation',
      preferences: {
        defaultFocusDurationMinutes: 45,
        defaultBreakDurationMinutes: 10,
        dailyStudyGoalMinutes: 240,
        soundEnabled: false
      }
    });

    expect(updated.name).toBe('Ada Lovelace');
    expect(updated.email).toBe('ada@analytical.engine');
    expect(updated.focusField).toBe('Symbolic Computation');
    expect(updated.preferences.defaultFocusDurationMinutes).toBe(45);
    expect(updated.preferences.defaultBreakDurationMinutes).toBe(10);
    expect(updated.preferences.dailyStudyGoalMinutes).toBe(240);
    expect(updated.preferences.soundEnabled).toBe(false);

    const current = await mockService.auth.getCurrentUser();
    expect(current?.name).toBe('Ada Lovelace');
    expect(current?.preferences.dailyStudyGoalMinutes).toBe(240);
  });

  it('uses saved dailyStudyGoalMinutes in calculateWorkload when dailyCapacityMinutes is omitted', () => {
    localStorage.setItem(
      'solis_user_preferences',
      JSON.stringify({ dailyStudyGoalMinutes: 200 })
    );

    const summary = calculateWorkload({
      date: '2026-09-25',
      tasks: [],
      timeBlocks: []
    });

    expect(summary.dailyCapacityMinutes).toBe(200);
    expect(summary.remainingCapacityMinutes).toBe(200);
  });

  it('retries saveFocusSession without task_id if PostgREST returns PGRST204 for unmigrated schema', async () => {
    const insertCalls: any[] = [];
    const mockClient = {
      from: vi.fn().mockImplementation(() => ({
        insert: vi.fn().mockImplementation((payload: any) => {
          insertCalls.push(payload);
          return {
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(async () => {
                if ('task_id' in payload) {
                  return {
                    data: null,
                    error: {
                      code: 'PGRST204',
                      message: "Could not find the 'task_id' column of 'focus_sessions' in the schema cache"
                    }
                  };
                }
                return {
                  data: {
                    id: 'focus_123',
                    user_id: 'user_1',
                    mode: payload.mode,
                    duration_minutes: payload.duration_minutes,
                    title: payload.title,
                    completed: true,
                    created_at: new Date().toISOString()
                  },
                  error: null
                };
              })
            })
          };
        })
      }))
    };

    const focusService = new SupabaseFocusService({
      client: mockClient as any,
      getUserId: async () => 'user_1',
      notify: vi.fn(),
      getServices: () => ({
        study: {
          getSubjects: vi.fn().mockResolvedValue([])
        }
      } as any)
    });

    const saved = await focusService.saveFocusSession({
      mode: 'pomodoro',
      durationMinutes: 25,
      taskId: 'task_abc',
      title: 'Deep Focus'
    });

    expect(insertCalls.length).toBe(2);
    expect(insertCalls[0].task_id).toBe('task_abc');
    expect(insertCalls[1].task_id).toBeUndefined();
    expect(saved.id).toBe('focus_123');
    expect(saved.taskId).toBe('task_abc');
  });

  it('invalidates habits cache before reading getHabits() in toggleHabitDate', async () => {
    // Seed stale cache
    queryCache.set('habits_all', [{ id: 'hab_1', title: 'Stale Habit' }]);

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
              })
            })
          })
        }),
        insert: vi.fn().mockResolvedValue({ error: null })
      })
    };

    const habitService = new SupabaseHabitService({
      client: mockClient as any,
      getUserId: async () => 'user_1',
      notify: () => queryCache.invalidate(),
      getServices: () => ({} as any)
    });

    let cacheWasClearedBeforeGetHabits = false;
    habitService.getHabits = vi.fn().mockImplementation(async () => {
      cacheWasClearedBeforeGetHabits = queryCache.get('habits_all') === null;
      return [
        {
          id: 'hab_1',
          title: 'Fresh Habit From DB',
          category: 'study',
          frequency: 'daily',
          color: 'coral',
          currentStreak: 1,
          longestStreak: 1,
          completedToday: true,
          history: { '2026-09-25': true },
          createdAt: '2026-09-25T00:00:00Z',
          updatedAt: '2026-09-25T00:00:00Z'
        }
      ];
    });

    const updated = await habitService.toggleHabitDate('hab_1', '2026-09-25');
    expect(cacheWasClearedBeforeGetHabits).toBe(true);
    expect(updated.title).toBe('Fresh Habit From DB');
    expect(updated.history['2026-09-25']).toBe(true);
  });

  it('invalidates goals cache before reading getGoals() in toggleMilestone', async () => {
    // Seed stale cache
    queryCache.set('goals_all', [{ id: 'goal_1', title: 'Stale Goal' }]);

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'm_1', completed: false }, error: null })
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
      })
    };

    const goalService = new SupabaseGoalService({
      client: mockClient as any,
      getUserId: async () => 'user_1',
      notify: () => queryCache.invalidate(),
      getServices: () => ({} as any)
    });

    let cacheWasClearedBeforeGetGoals = false;
    goalService.getGoals = vi.fn().mockImplementation(async () => {
      cacheWasClearedBeforeGetGoals = queryCache.get('goals_all') === null;
      return [
        {
          id: 'goal_1',
          title: 'Fresh Goal From DB',
          horizon: 'medium_term',
          category: 'academic',
          experienceType: 'standard',
          status: 'completed',
          progressPercentage: 100,
          milestones: [{ id: 'm_1', title: 'M1', completed: true }],
          createdAt: '2026-09-25T00:00:00Z',
          updatedAt: '2026-09-25T00:00:00Z'
        }
      ];
    });

    const updated = await goalService.toggleMilestone('goal_1', 'm_1');
    expect(cacheWasClearedBeforeGetGoals).toBe(true);
    expect(updated.title).toBe('Fresh Goal From DB');
    expect(updated.progressPercentage).toBe(100);
  });
});
