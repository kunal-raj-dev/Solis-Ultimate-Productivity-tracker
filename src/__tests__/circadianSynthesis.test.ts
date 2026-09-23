import { describe, it, expect } from 'vitest';
import {
  calculateSolarPhase,
  synthesizeCircadianResonance
} from '../utils/intelligence/circadianSynthesis';
import { LearningIntelligenceSnapshot } from '../types/learningIntelligence';

describe('Circadian Creative Synthesis Engine Suite', () => {
  describe('Solar Chronobiology Calculation (calculateSolarPhase)', () => {
    it('correctly identifies Dawn phase and rising solar elevation', () => {
      const dawnDate = new Date(2026, 8, 24, 7, 30); // 07:30
      const result = calculateSolarPhase(dawnDate);

      expect(result.phase).toBe('dawn');
      expect(result.elevationDegrees).toBeGreaterThan(0);
      expect(result.solarTimestamp).toBe('07:30 SOLAR TIME');
    });

    it('correctly identifies Zenith phase with peak solar elevation near noon', () => {
      const zenithDate = new Date(2026, 8, 24, 13, 0); // 13:00 Solar Noon
      const result = calculateSolarPhase(zenithDate);

      expect(result.phase).toBe('zenith');
      expect(result.elevationDegrees).toBe(90);
      expect(result.solarTimestamp).toBe('13:00 SOLAR TIME');
    });

    it('correctly identifies Dusk phase during late afternoon consolidation', () => {
      const duskDate = new Date(2026, 8, 24, 18, 45); // 18:45
      const result = calculateSolarPhase(duskDate);

      expect(result.phase).toBe('dusk');
      expect(result.solarTimestamp).toBe('18:45 SOLAR TIME');
    });

    it('correctly identifies Night phase with negative solar nadir elevation', () => {
      const nightDate = new Date(2026, 8, 24, 23, 15); // 23:15
      const result = calculateSolarPhase(nightDate);

      expect(result.phase).toBe('night');
      expect(result.elevationDegrees).toBeLessThan(0);
      expect(result.solarTimestamp).toBe('23:15 SOLAR TIME');
    });
  });

  describe('Cognitive Resonance & Dynamic Multipliers (synthesizeCircadianResonance)', () => {
    it('boosts deep conceptual study during solar zenith', () => {
      const zenithDate = new Date(2026, 8, 24, 13, 30);
      const mockSnapshot: LearningIntelligenceSnapshot = {
        calculatedAt: zenithDate.toISOString(),
        topicHistories: new Map(),
        masteryEvaluations: new Map(),
        retentionSignals: new Map(),
        subjectHealths: new Map(),
        recommendations: [
          {
            id: 'rec-routine',
            type: 'routine_continuation',
            priority: 'routine',
            weight: 75,
            title: 'File weekly paperwork',
            signal: 'Routine due',
            evidence: 'Admin routine',
            whyExplanation: 'Keeps inbox clear',
            actionLabel: 'Complete',
            actionPayload: { type: 'create_task' }
          },
          {
            id: 'rec-deep',
            type: 'syllabus_continuation',
            priority: 'primary',
            weight: 75,
            title: 'Quantum Mechanics Problem Set',
            signal: 'Core curriculum commitment',
            evidence: 'High cognitive demand',
            whyExplanation: 'Advances exam milestone',
            actionLabel: 'Launch Focus',
            actionPayload: { type: 'start_focus', durationMinutes: 50 }
          }
        ]
      };

      const result = synthesizeCircadianResonance({
        currentDate: zenithDate,
        workload: { totalEstimatedMinutes: 120, dailyCapacityMinutes: 330 },
        snapshot: mockSnapshot
      });

      expect(result.phase).toBe('zenith');
      expect(result.archetype).toBe('deep_breakthrough');
      // Syllabus continuation should be boosted over routine continuation during zenith
      expect(result.primaryAction?.id).toBe('rec-deep');
      expect(result.resonanceMetrics.prefrontalBandwidth).toBe(95);
      expect(result.isCeilingReached).toBe(false);
    });

    it('boosts spaced retrieval and retention interventions during dusk', () => {
      const duskDate = new Date(2026, 8, 24, 19, 0);
      const mockSnapshot: LearningIntelligenceSnapshot = {
        calculatedAt: duskDate.toISOString(),
        topicHistories: new Map(),
        masteryEvaluations: new Map(),
        retentionSignals: new Map(),
        subjectHealths: new Map(),
        recommendations: [
          {
            id: 'rec-deep',
            type: 'concept_synthesis',
            priority: 'primary',
            weight: 80,
            title: 'Write 3000-word Essay',
            signal: 'Assignment due in 5 days',
            evidence: 'Heavy cognitive synthesis',
            whyExplanation: 'Substantial essay work',
            actionLabel: 'Write',
            actionPayload: { type: 'start_focus', durationMinutes: 60 }
          },
          {
            id: 'rec-retention',
            type: 'spaced_retrieval',
            priority: 'primary',
            weight: 75,
            title: 'Drill Organic Chemistry Flashcards',
            signal: 'Retention decay detected (R < 50%)',
            evidence: '8 cards overdue by 9 days',
            whyExplanation: 'Stabilizes decaying memory traces',
            actionLabel: 'Drill Cards',
            actionPayload: { type: 'drill_flashcards', durationMinutes: 20 }
          }
        ]
      };

      const result = synthesizeCircadianResonance({
        currentDate: duskDate,
        workload: { totalEstimatedMinutes: 180, dailyCapacityMinutes: 330 },
        snapshot: mockSnapshot
      });

      expect(result.phase).toBe('dusk');
      expect(result.archetype).toBe('spaced_consolidation');
      // Spaced retrieval should be boosted by 1.55x, overtaking concept_synthesis
      expect(result.primaryAction?.id).toBe('rec-retention');
    });

    it('flags cognitive ceiling limit when planned work exceeds 5.5 hours', () => {
      const result = synthesizeCircadianResonance({
        currentDate: new Date(2026, 8, 24, 15, 0),
        workload: { totalEstimatedMinutes: 360, dailyCapacityMinutes: 330 }, // 6 hours planned vs 5.5h ceiling
        tasks: [],
        studyPlan: []
      });

      expect(result.isCeilingReached).toBe(true);
      expect(result.capacityPercentUsed).toBe(100);
      expect(result.capacityRemainingMinutes).toBe(0);
    });

    it('generates graceful fallback action when snapshot has no recommendations', () => {
      const result = synthesizeCircadianResonance({
        currentDate: new Date(2026, 8, 24, 8, 30),
        workload: { totalEstimatedMinutes: 60, dailyCapacityMinutes: 330 },
        studyPlan: [
          {
            id: 'plan-1',
            subjectId: 'sub-1',
            subjectName: 'Neuroscience',
            topicId: 'top-1',
            title: 'Action Potentials',
            targetMinutes: 45,
            priority: 'high',
            completed: false
          }
        ]
      });

      expect(result.phase).toBe('dawn');
      expect(result.primaryAction).not.toBeNull();
      expect(result.primaryAction?.title).toContain('Action Potentials');
      expect(result.primaryAction?.actionLabel).toBe('Open Study Plan');
    });
  });
});
