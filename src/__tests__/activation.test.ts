import { describe, it, expect, beforeEach } from 'vitest';
import {
  getActivationState,
  setActivationState,
  getCompletedActivationSteps,
  markActivationStepCompleted,
  resetActivation,
  computeActivationSteps,
  calculateNextBestAction
} from '../utils/activation';

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

describe('Solis Activation & Learnability System', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    // @ts-ignore
    global.window = { localStorage: mockLocalStorage } as any;
    // @ts-ignore
    global.localStorage = mockLocalStorage as any;
  });

  describe('State Machine & Persistence', () => {
    it('returns not_started by default for fresh users', () => {
      expect(getActivationState()).toBe('not_started');
      expect(getActivationState('user_123')).toBe('not_started');
    });

    it('persists and updates activation state per user', () => {
      setActivationState('welcome', 'user_123');
      expect(getActivationState('user_123')).toBe('welcome');
      expect(getActivationState('user_456')).toBe('not_started');

      setActivationState('mental_model', 'user_123');
      expect(getActivationState('user_123')).toBe('mental_model');

      setActivationState('completed', 'user_123');
      expect(getActivationState('user_123')).toBe('completed');
    });

    it('tracks completed checklist steps uniquely', () => {
      markActivationStepCompleted('understand_loop', 'user_123');
      markActivationStepCompleted('create_subject', 'user_123');
      markActivationStepCompleted('create_subject', 'user_123'); // duplicate

      const steps = getCompletedActivationSteps('user_123');
      expect(steps).toEqual(['understand_loop', 'create_subject']);
    });

    it('resets activation cleanly', () => {
      setActivationState('completed', 'user_123');
      markActivationStepCompleted('understand_loop', 'user_123');

      resetActivation('user_123');
      expect(getActivationState('user_123')).toBe('not_started');
      expect(getCompletedActivationSteps('user_123')).toEqual([]);
    });
  });

  describe('Adaptive Next Best Action Computation', () => {
    it('recommends creating a subject if subjects count is 0', () => {
      const nextAction = calculateNextBestAction({
        subjects: 0,
        tasks: 0,
        focusSessions: 0,
        notes: 0
      });

      expect(nextAction.id).toBe('action_create_subject');
      expect(nextAction.targetPath).toBe('/app/study?action=new');
      expect(nextAction.iconName).toBe('BookOpen');
    });

    it('recommends creating a task if subjects exist but tasks count is 0', () => {
      const nextAction = calculateNextBestAction({
        subjects: 2,
        tasks: 0,
        focusSessions: 0,
        notes: 0
      });

      expect(nextAction.id).toBe('action_plan_task');
      expect(nextAction.targetPath).toBe('/app/tasks?action=new');
      expect(nextAction.iconName).toBe('CheckCircle2');
    });

    it('recommends starting focus if tasks exist but focus sessions count is 0', () => {
      const nextAction = calculateNextBestAction({
        subjects: 2,
        tasks: 4,
        focusSessions: 0,
        notes: 0
      });

      expect(nextAction.id).toBe('action_start_focus');
      expect(nextAction.targetPath).toBe('/app/focus');
      expect(nextAction.iconName).toBe('Flame');
    });

    it('recommends drafting a note if focus session exists but notes count is 0', () => {
      const nextAction = calculateNextBestAction({
        subjects: 2,
        tasks: 4,
        focusSessions: 1,
        notes: 0
      });

      expect(nextAction.id).toBe('action_capture_note');
      expect(nextAction.targetPath).toBe('/app/notes?action=new');
      expect(nextAction.iconName).toBe('FileText');
    });

    it('indicates ongoing flow when all core loops have data', () => {
      const nextAction = calculateNextBestAction({
        subjects: 2,
        tasks: 4,
        focusSessions: 3,
        notes: 2
      });

      expect(nextAction.id).toBe('action_continue_flow');
      expect(nextAction.targetPath).toBe('/app/dashboard');
    });
  });

  describe('Adaptive Checklist Steps Computation', () => {
    it('computes completion dynamically based on real data counts', () => {
      const counts = {
        subjects: 1,
        tasks: 0,
        focusSessions: 2,
        notes: 0
      };
      const manualCompleted = ['understand_loop'];

      const steps = computeActivationSteps(counts, manualCompleted);

      expect(steps.find((s) => s.id === 'understand_loop')?.isCompleted).toBe(true);
      expect(steps.find((s) => s.id === 'create_subject')?.isCompleted).toBe(true);
      expect(steps.find((s) => s.id === 'plan_task')?.isCompleted).toBe(false);
      expect(steps.find((s) => s.id === 'start_focus')?.isCompleted).toBe(true);
      expect(steps.find((s) => s.id === 'capture_knowledge')?.isCompleted).toBe(false);
    });
  });
});
