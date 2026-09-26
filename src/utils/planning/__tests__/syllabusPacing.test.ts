import { describe, it, expect } from 'vitest';
import {
  calculateDaysToExam,
  calculateRemainingSyllabusHours,
  calculateDynamicSyllabusPacing,
  MAX_SUSTAINABLE_DAILY_HOURS
} from '../syllabusPacing';
import { StudyTopic } from '../../../types/study';

describe('Dynamic Syllabus Pacing & Burnout-Aware Target Engine (Feature 3.5)', () => {
  const mockTopics: StudyTopic[] = [
    {
      id: 'top-1',
      subjectId: 'sub-bio',
      title: 'Cell Membranes',
      orderIndex: 1,
      masteryLevel: 'mastered',
      level: 'unit',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z'
    },
    {
      id: 'top-2',
      subjectId: 'sub-bio',
      title: 'Active Transport Mechanisms',
      orderIndex: 2,
      masteryLevel: 'learning',
      level: 'chapter',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z'
    },
    {
      id: 'top-3',
      subjectId: 'sub-bio',
      title: 'Sodium Potassium Pump Details',
      orderIndex: 3,
      masteryLevel: 'unstudied',
      level: 'concept',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z'
    },
    {
      id: 'top-4',
      subjectId: 'sub-bio',
      title: 'Secondary Active Transport Cotransporters',
      orderIndex: 4,
      masteryLevel: 'unstudied',
      level: 'concept',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z'
    }
  ];

  describe('calculateDaysToExam', () => {
    it('accurately computes calendar day differences', () => {
      const base = new Date(2026, 8, 27); // Sept 27 2026
      expect(calculateDaysToExam('2026-09-30', base)).toBe(3);
      expect(calculateDaysToExam('2026-09-27', base)).toBe(0);
      expect(calculateDaysToExam('2026-09-20', base)).toBe(0); // in past clamped to 0
    });
  });

  describe('calculateRemainingSyllabusHours', () => {
    it('disregards mastered topics and weights learning topics at 50%', () => {
      // top-1: mastered (0h)
      // top-2: learning (0.75h)
      // top-3: unstudied (1.5h)
      // top-4: unstudied (1.5h)
      // Total = 0 + 0.75 + 1.5 + 1.5 = 3.75 hours
      const remaining = calculateRemainingSyllabusHours(mockTopics);
      expect(remaining).toBe(3.75);
    });
  });

  describe('calculateDynamicSyllabusPacing', () => {
    it('identifies sustainable pace when days to exam allow comfortable daily load', () => {
      const base = new Date(2026, 8, 27);
      const pace = calculateDynamicSyllabusPacing({
        targetExamDate: '2026-10-07', // 10 days away
        topics: mockTopics,
        baseDate: base
      });

      expect(pace.daysRemaining).toBe(10);
      expect(pace.estimatedRemainingHours).toBe(3.75);
      expect(pace.rawRequiredDailyHours).toBe(0.4);
      expect(pace.isPaceCapped).toBe(false);
      expect(pace.burnoutRisk).toBe('sustainable');
      expect(pace.advisoryHeadline).toContain('Sustainable Cadence');
    });

    it('identifies elevated pace when required daily hours are high but within limits', () => {
      const manyTopics: StudyTopic[] = Array.from({ length: 8 }, (_, i) => ({
        id: `t-${i}`,
        subjectId: 'sub-chem',
        title: `Topic ${i}`,
        orderIndex: i,
        masteryLevel: 'unstudied',
        level: 'chapter',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z'
      })); // 8 * 1.5h = 12 hours

      const base = new Date(2026, 8, 27);
      const pace = calculateDynamicSyllabusPacing({
        targetExamDate: '2026-09-30', // 3 days away -> 12 / 3 = 4h/day
        topics: manyTopics,
        baseDate: base
      });

      expect(pace.rawRequiredDailyHours).toBe(4.0);
      expect(pace.burnoutRisk).toBe('elevated');
      expect(pace.isPaceCapped).toBe(false);
      expect(pace.advisoryHeadline).toContain('Intensive Pace');
    });

    it('caps pace at 5.5h and triages topics when syllabus load causes burnout risk', () => {
      // 20 unstudied topics = 30 hours remaining with only 2 days left -> 15h/day required!
      const overloadTopics: StudyTopic[] = Array.from({ length: 20 }, (_, i) => ({
        id: `top-overload-${i}`,
        subjectId: 'sub-phys',
        title: `Heavy Concept ${i}`,
        orderIndex: i,
        masteryLevel: 'unstudied',
        level: i < 3 ? 'unit' : i < 8 ? 'chapter' : 'concept',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z'
      }));

      const base = new Date(2026, 8, 27);
      const pace = calculateDynamicSyllabusPacing({
        targetExamDate: '2026-09-29', // 2 days
        topics: overloadTopics,
        baseDate: base
      });

      expect(pace.rawRequiredDailyHours).toBe(15.0);
      expect(pace.isPaceCapped).toBe(true);
      expect(pace.cappedSafeDailyHours).toBe(MAX_SUSTAINABLE_DAILY_HOURS);
      expect(pace.burnoutRisk).toBe('critical');
      expect(pace.burnoutScore).toBeGreaterThanOrEqual(75);
      expect(pace.advisoryHeadline).toContain('Burnout Guard');

      // Triage checks: Units and chapters are preserved; excess concepts are deprioritized
      expect(pace.deprioritizedTopics.length).toBeGreaterThan(0);
      expect(pace.recommendedTopicsToPrioritize.length).toBeGreaterThan(0);
      expect(pace.compassionateAdvice).toContain('protect your cognitive stamina');
    });
  });
});
