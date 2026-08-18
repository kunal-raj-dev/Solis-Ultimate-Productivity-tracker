import { describe, it, expect } from 'vitest';
import { validateStudyPlanInput, calculatePlannedVsActual, calculateSubjectWeeklyProgress } from '../utils/study';
import { StudyPlanItem, StudySession, StudySubject } from '../types/study';
import { ValidationError } from '../utils/validation';

describe('Phase 4 — Study Domain & Pure Calculations', () => {
  describe('validateStudyPlanInput', () => {
    it('accepts valid study plan input', () => {
      expect(() =>
        validateStudyPlanInput({
          title: 'Raft Log Replication Invariants',
          subjectId: 'sbj_1',
          targetMinutes: 60
        })
      ).not.toThrow();
    });

    it('rejects empty title', () => {
      expect(() =>
        validateStudyPlanInput({
          title: '',
          subjectId: 'sbj_1'
        })
      ).toThrow(ValidationError);
    });

    it('rejects missing subjectId', () => {
      expect(() =>
        validateStudyPlanInput({
          title: 'Valid Topic',
          subjectId: ''
        })
      ).toThrow(ValidationError);
    });

    it('rejects out-of-bounds target minutes', () => {
      expect(() =>
        validateStudyPlanInput({
          title: 'Valid Topic',
          subjectId: 'sbj_1',
          targetMinutes: 0
        })
      ).toThrow(ValidationError);

      expect(() =>
        validateStudyPlanInput({
          title: 'Valid Topic',
          subjectId: 'sbj_1',
          targetMinutes: 1000
        })
      ).toThrow(ValidationError);
    });
  });

  describe('calculatePlannedVsActual', () => {
    it('derives actual minutes dynamically from linked study sessions without database mutation', () => {
      const planItems: StudyPlanItem[] = [
        {
          id: 'plan_1',
          subjectId: 'sbj_1',
          subjectName: 'Distributed Systems',
          title: 'Raft Invariants',
          targetMinutes: 60,
          priority: 'high',
          completed: false
        },
        {
          id: 'plan_2',
          subjectId: 'sbj_2',
          subjectName: 'Algorithms',
          title: 'Graph DFS',
          targetMinutes: 45,
          priority: 'medium',
          completed: false
        }
      ];

      const sessions: StudySession[] = [
        {
          id: 'ses_1',
          subjectId: 'sbj_1',
          subjectName: 'Distributed Systems',
          planItemId: 'plan_1',
          type: 'deep_study',
          durationMinutes: 50,
          topicsCovered: ['Raft Invariants'],
          retentionRating: 5,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const { enrichedPlan, totalPlannedMinutes, totalActualMinutes, adherencePercentage } =
        calculatePlannedVsActual(planItems, sessions);

      expect(totalPlannedMinutes).toBe(105);
      expect(totalActualMinutes).toBe(50);
      expect(adherencePercentage).toBe(48); // Math.round(50/105 * 100) = 48
      expect(enrichedPlan[0].actualMinutesLogged).toBe(50);
      expect(enrichedPlan[1].actualMinutesLogged).toBe(0);
    });
  });

  describe('calculateSubjectWeeklyProgress', () => {
    it('derives weekly hours from sessions completed this week', () => {
      const subject: StudySubject = {
        id: 'sbj_1',
        name: 'Distributed Systems',
        color: 'coral',
        targetHoursPerWeek: 10,
        completedHoursThisWeek: 0,
        status: 'active',
        notesCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const now = new Date().toISOString();
      const sessions: StudySession[] = [
        {
          id: 'ses_1',
          subjectId: 'sbj_1',
          subjectName: 'Distributed Systems',
          type: 'deep_study',
          durationMinutes: 90,
          topicsCovered: ['Raft'],
          retentionRating: 5,
          completedAt: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'ses_2',
          subjectId: 'sbj_1',
          subjectName: 'Distributed Systems',
          type: 'active_recall',
          durationMinutes: 30,
          topicsCovered: ['Paxos'],
          retentionRating: 4,
          completedAt: now,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'ses_3',
          subjectId: 'sbj_other',
          subjectName: 'Other',
          type: 'deep_study',
          durationMinutes: 60,
          topicsCovered: ['Other'],
          retentionRating: 5,
          completedAt: now,
          createdAt: now,
          updatedAt: now
        }
      ];

      const weeklyHours = calculateSubjectWeeklyProgress(subject, sessions);
      expect(weeklyHours).toBe(2.0); // 120 minutes = 2.0 hours
    });
  });
});
