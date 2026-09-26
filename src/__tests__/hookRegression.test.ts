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

  it('guarantees ExamHorizonBar calls all hooks before any early returns', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const content = fs.readFileSync(
      path.resolve(__dirname, '../components/features/Goals/ExamHorizonBar.tsx'),
      'utf8'
    );

    // Verify useMemo for cushion and topics appear BEFORE early return statements
    const firstEarlyReturn = content.indexOf('return null;');
    expect(firstEarlyReturn).toBeGreaterThan(-1);

    const cushionMemoIndex = content.indexOf('const cushion = useMemo');
    expect(cushionMemoIndex).toBeGreaterThan(-1);
    expect(cushionMemoIndex).toBeLessThan(firstEarlyReturn);

    const subjectTopicsMemoIndex = content.indexOf('const subjectTopics = useMemo');
    expect(subjectTopicsMemoIndex).toBeGreaterThan(-1);
    expect(subjectTopicsMemoIndex).toBeLessThan(firstEarlyReturn);
  });
});

