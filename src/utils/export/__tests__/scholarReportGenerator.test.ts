import { describe, it, expect } from 'vitest';
import {
  computeProofOfStudyHash,
  buildScholarReportMetrics,
  generateScholarReportSvg,
  generateScholarReportMarkdown
} from '../scholarReportGenerator';
import { generateSolisIntelligenceReport } from '../../intelligence';

describe('Feature 4.3: Exportable Semester Reflection & Proof-of-Study Artifacts', () => {
  it('computes a deterministic SOLIS-XXXX-XXXX verification fingerprint', () => {
    const hash1 = computeProofOfStudyHash('Ada Lovelace|2026-09-01|2026-09-27|1200|24|92|15|14');
    const hash2 = computeProofOfStudyHash('Ada Lovelace|2026-09-01|2026-09-27|1200|24|92|15|14');
    const hashDiff = computeProofOfStudyHash('Ada Lovelace|2026-09-01|2026-09-27|1205|24|92|15|14');

    expect(hash1).toMatch(/^SOLIS-[0-9A-F]{4}-[0-9A-F]{4}$/);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashDiff);
  });

  it('builds ScholarReportMetrics and renders valid SVG & Markdown Proof-of-Study artifacts', () => {
    const now = new Date('2026-09-27T12:00:00Z');
    const report = generateSolisIntelligenceReport(
      {
        subjects: [
          {
            id: 'sub-1',
            name: 'Distributed Systems',
            code: 'CS-402',
            color: 'coral',
            targetHoursPerWeek: 8,
            completedHoursThisWeek: 4,
            status: 'active',
            notesCount: 3,
            createdAt: '2026-09-01T00:00:00Z',
            updatedAt: '2026-09-27T00:00:00Z'
          }
        ],
        topics: [
          {
            id: 'top-1',
            subjectId: 'sub-1',
            title: 'Raft Consensus Algorithm',
            orderIndex: 0,
            masteryLevel: 'mastered',
            createdAt: '2026-09-01T00:00:00Z',
            updatedAt: '2026-09-27T00:00:00Z'
          }
        ],
        sessions: [
          {
            id: 'sess-1',
            subjectId: 'sub-1',
            subjectName: 'Distributed Systems',
            type: 'deep_study',
            durationMinutes: 120,
            topicsCovered: ['Raft Consensus Algorithm'],
            retentionRating: 5,
            completedAt: '2026-09-26T14:00:00Z',
            createdAt: '2026-09-26T14:00:00Z',
            updatedAt: '2026-09-26T14:00:00Z'
          }
        ],
        planItems: [],
        focusSessions: [
          {
            id: 'foc-1',
            title: 'Raft Leader Election Proof',
            subjectId: 'sub-1',
            durationMinutes: 50,
            mode: 'deep_flow',
            completed: true,
            interruptionsCount: 0,
            createdAt: '2026-09-26T10:50:00Z',
            updatedAt: '2026-09-26T10:50:00Z'
          }
        ],
        tasks: [],
        habits: []
      },
      '28_days',
      now
    );

    const metrics = buildScholarReportMetrics({
      report,
      scholarName: 'Ada Lovelace',
      periodLabel: 'Autumn Semester 2026',
      consistencyStreakDays: 12,
      now
    });

    expect(metrics.scholarName).toBe('Ada Lovelace');
    expect(metrics.totalStudyHours).toBe(2);
    expect(metrics.completedFocusSessions).toBe(1);
    expect(metrics.masteredTopicsCount).toBe(1);
    expect(metrics.verificationHash).toMatch(/^SOLIS-[0-9A-F]{4}-[0-9A-F]{4}$/);

    const svg = generateScholarReportSvg(metrics);
    expect(svg).toContain('<svg');
    expect(svg).toContain('Ada Lovelace');
    expect(svg).toContain('Distributed Systems');
    expect(svg).toContain(metrics.verificationHash);

    const md = generateScholarReportMarkdown(metrics);
    expect(md).toContain('# Solis Scholar Report — Proof of Study');
    expect(md).toContain('Ada Lovelace');
    expect(md).toContain(metrics.verificationHash);
    expect(md).toContain('| Distributed Systems |');
  });
});
