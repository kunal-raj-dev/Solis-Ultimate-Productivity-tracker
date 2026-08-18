import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataService } from '../services/mock/mockService';
import { DailyReflection } from '../types/reflection';

describe('Stage D — Reflection Core & Habit-to-Goal Engine', () => {
  let service: MockDataService;

  beforeEach(() => {
    service = new MockDataService();
  });

  describe('Daily Reflection Service', () => {
    it('retrieves seeded daily reflections in descending date order', async () => {
      const reflections = await service.reflections.getReflections();
      expect(reflections.length).toBeGreaterThanOrEqual(2);
      // Date order verification
      for (let i = 0; i < reflections.length - 1; i++) {
        expect(reflections[i].date >= reflections[i + 1].date).toBe(true);
      }
    });

    it('saves a new structured daily reflection with metrics and intentions', async () => {
      const newRef: Partial<DailyReflection> = {
        date: '2026-08-17',
        energyScore: 5,
        focusScore: 4,
        wins: ['Completed SM-2 spaced repetition drills', 'Wrote compiler IR generator test'],
        frictionPoints: ['Late afternoon coffee slump'],
        tomorrowIntentions: ['Implement DAG Kahn algorithm', 'Review Raft paper'],
        synthesisNotes: 'Highly productive flow state in morning.',
        completedHabitsCount: 3,
        completedTasksCount: 5,
        studyMinutesLogged: 150,
        reviewCardsCompleted: 16
      };

      const saved = await service.reflections.saveDailyReflection(newRef);
      expect(saved.id).toBeDefined();
      expect(saved.date).toBe('2026-08-17');
      expect(saved.energyScore).toBe(5);
      expect(saved.focusScore).toBe(4);
      expect(saved.wins).toHaveLength(2);
      expect(saved.tomorrowIntentions).toHaveLength(2);
      expect(saved.studyMinutesLogged).toBe(150);

      // Verify retrieval by date
      const fetched = await service.reflections.getReflectionByDate('2026-08-17');
      expect(fetched).not.toBeNull();
      expect(fetched?.synthesisNotes).toContain('flow state');
    });

    it('updates an existing daily reflection without creating duplicate date records', async () => {
      await service.reflections.saveDailyReflection({
        date: '2026-08-18',
        energyScore: 3,
        wins: ['Initial win']
      });

      const updated = await service.reflections.saveDailyReflection({
        date: '2026-08-18',
        energyScore: 4,
        wins: ['Initial win', 'Evening breakthrough']
      });

      expect(updated.energyScore).toBe(4);
      expect(updated.wins).toHaveLength(2);

      const all = await service.reflections.getReflections();
      const recordsForDate = all.filter((r) => r.date === '2026-08-18');
      expect(recordsForDate).toHaveLength(1);
    });

    it('deletes a reflection entry cleanly', async () => {
      const saved = await service.reflections.saveDailyReflection({
        date: '2026-08-19',
        energyScore: 4
      });

      const deleted = await service.reflections.deleteReflection(saved.id);
      expect(deleted).toBe(true);

      const fetched = await service.reflections.getReflectionByDate('2026-08-19');
      expect(fetched).toBeNull();
    });
  });

  describe('Habit-to-Goal Momentum Synergy', () => {
    it('creates and links a daily habit to an active exam goal', async () => {
      const created = await service.habits.createHabit({
        title: 'Morning Raft Invariants Flashcards (20m)',
        category: 'study',
        frequency: 'daily',
        color: 'coral',
        goalId: 'gol_1',
        goalTitle: 'CS 440 Distributed Systems Final Exam'
      });

      expect(created.id).toBeDefined();
      expect(created.goalId).toBe('gol_1');
      expect(created.goalTitle).toBe('CS 440 Distributed Systems Final Exam');

      const allHabits = await service.habits.getHabits();
      const linked = allHabits.filter((h) => h.goalId === 'gol_1');
      expect(linked.length).toBeGreaterThanOrEqual(1);
    });

    it('updates an existing habit with a new goal linkage', async () => {
      const habits = await service.habits.getHabits();
      const targetHabit = habits[0];

      const updated = await service.habits.updateHabit(targetHabit.id, {
        goalId: 'gol_2',
        goalTitle: 'Compilers Project'
      });

      expect(updated.goalId).toBe('gol_2');
      expect(updated.goalTitle).toBe('Compilers Project');
    });
  });
});
