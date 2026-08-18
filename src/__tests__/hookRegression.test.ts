import { describe, it, expect } from 'vitest';
import { generateSolisIntelligenceReport } from '../utils/intelligence';
import { calculateDailySummary } from '../utils/productivity';

describe('React Hook & Data Layer Stability Suite', () => {
  it('handles empty and initial states in intelligence engine without throwing', () => {
    // Tests that before data resolves (during initial render / loading), intelligence derivation is completely stable
    const emptyReport = generateSolisIntelligenceReport(
      {
        sessions: [],
        planItems: [],
        subjects: [],
        topics: [],
        focusSessions: [],
        tasks: [],
        habits: []
      },
      'today'
    );

    expect(emptyReport).toBeDefined();
    expect(emptyReport.recommendations).toBeDefined();
    expect(emptyReport.recommendations.length).toBeGreaterThan(0);
    expect(emptyReport.rhythm.dominantTimeOfDay).toBeNull();
    expect(emptyReport.execution.planningRealismVerdict).toBe('no_plan');
  });

  it('handles empty data in calculateDailySummary without throwing', () => {
    const result = calculateDailySummary({
      tasks: [],
      studySessions: [],
      focusSessions: [],
      habits: []
    });

    expect(result).toBeDefined();
    expect(result.summary.momentumScore).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.totalMomentumScore).toBeGreaterThanOrEqual(0);
  });

  it('ensures intelligence derivation returns identical stable shapes across repeated renders', () => {
    const inputData = {
      sessions: [],
      planItems: [],
      subjects: [],
      topics: [],
      focusSessions: [],
      tasks: [],
      habits: []
    };

    const report1 = generateSolisIntelligenceReport(inputData, 'today');
    const report2 = generateSolisIntelligenceReport(inputData, 'today');

    expect(report1.recommendations[0].title).toBe(report2.recommendations[0].title);
    expect(report1.rhythm.activeStudyDaysCount).toBe(report2.rhythm.activeStudyDaysCount);
    expect(report1.execution.planAdherenceRate).toBe(report2.execution.planAdherenceRate);
  });
});
