import { describe, it, expect } from 'vitest';
import { calculateDailySummary } from '../utils/productivity';
import { computeRecommendations } from '../utils/intelligence/recommendations';
import { computeExecutionIntelligence } from '../utils/intelligence/execution';
import { computeTopicMastery } from '../utils/intelligence/mastery';
import { computeAttentionIntelligence } from '../utils/intelligence/attention';
import { computeCognitiveRhythm, calculateDateWindow } from '../utils/intelligence/rhythm';
import { MockDataService } from '../services/mock/mockService';

describe('Phase 8 — Truthful State & Zero-Data Purity', () => {
  it('derives honest 0 momentum for brand-new users without data', () => {
    const { summary, breakdown } = calculateDailySummary({
      tasks: [],
      studySessions: [],
      focusSessions: [],
      habits: [],
      dailyStudyGoalMinutes: 180,
      targetFocusMinutes: 120
    });

    expect(summary.momentumScore).toBe(0);
    expect(summary.totalStudyMinutes).toBe(0);
    expect(summary.completedTasksCount).toBe(0);
    expect(summary.totalTasksCount).toBe(0);
    expect(summary.focusSessionsCount).toBe(0);
    expect(summary.habitsCompletedRatio).toBe('0/0');

    expect(breakdown.taskScore).toBe(0);
    expect(breakdown.studyScore).toBe(0);
    expect(breakdown.focusScore).toBe(0);
    expect(breakdown.habitScore).toBe(0);
    expect(breakdown.totalMomentumScore).toBe(0);
  });

  it('calculates truthful partial momentum when student completes 1 task out of 2', () => {
    const { summary, breakdown } = calculateDailySummary({
      tasks: [
        {
          id: 't1',
          title: 'Complete chapter 1',
          status: 'completed',
          priority: 'high',
          category: 'study',
          subTasks: [],
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 't2',
          title: 'Complete chapter 2',
          status: 'todo',
          priority: 'medium',
          category: 'study',
          subTasks: [],
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      studySessions: [],
      focusSessions: [],
      habits: [],
      dailyStudyGoalMinutes: 180,
      targetFocusMinutes: 120
    });

    // 50% task completion = 50 * 0.3 = 15 momentum score
    expect(breakdown.taskScore).toBe(50);
    expect(summary.completedTasksCount).toBe(1);
    expect(summary.totalTasksCount).toBe(2);
    expect(summary.momentumScore).toBe(15);
  });

  it('omits manufactured growth deltas when no historical comparison baseline exists', async () => {
    const service = new MockDataService();
    // Clear out data
    (service as any)._tasks = [];
    (service as any)._studySessions = [];
    (service as any)._focusSessions = [];
    (service as any)._habits = [];

    const metrics = await service.analytics.getProductivityMetrics();

    expect(metrics).toHaveLength(4);
    metrics.forEach((metric) => {
      expect(metric.changePercentage).toBeNull();
      expect(metric.trend).toBeNull();
    });
  });

  it('produces honest baseline recommendations for accounts with zero study history', () => {
    const emptyData = {
      subjects: [],
      topics: [],
      sessions: [],
      planItems: [],
      tasks: [],
      focusSessions: [],
      habits: [],
      reflections: []
    };

    const window = calculateDateWindow('this_week', new Date());
    const rhythm = computeCognitiveRhythm(emptyData, window);
    const execution = computeExecutionIntelligence(emptyData, window);
    const mastery = computeTopicMastery(emptyData, new Date());
    const attention = computeAttentionIntelligence(emptyData, window, new Date());

    const recommendations = computeRecommendations(emptyData, rhythm, execution, mastery, attention);

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].id).toBe('rec-onboarding');
    expect(recommendations[0].title).toBe('Establish Your Study Baseline');
    expect(recommendations[0].signal).toContain('cognitive rhythm');
  });
});
