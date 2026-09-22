import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildAdaptiveStudyContext,
  detectSubjectGaps,
  detectWeakTopics,
  resolveStudySuggestionRoute,
  generateDeterministicStudyRecommendations
} from '../utils/study/adaptivePlanner';
import { aiService } from '../services/ai/ai.service';
import { StudySubject, StudySession, StudyTopic } from '../types/study';

const createMockSubject = (overrides: Partial<StudySubject>): StudySubject => ({
  id: `sbj-${Math.random().toString(36).slice(2, 6)}`,
  name: 'Computer Architecture',
  color: 'coral',
  targetHoursPerWeek: 5,
  completedHoursThisWeek: 2,
  status: 'active',
  notesCount: 4,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...overrides
});

const createMockSession = (overrides: Partial<StudySession>): StudySession => ({
  id: `ses-${Math.random().toString(36).slice(2, 6)}`,
  subjectId: 'sbj-arch',
  subjectName: 'Computer Architecture',
  type: 'deep_study',
  durationMinutes: 45,
  topicsCovered: ['Pipelining'],
  retentionRating: 4,
  completedAt: '2026-09-22T10:00:00.000Z',
  createdAt: '2026-09-22T10:00:00.000Z',
  updatedAt: '2026-09-22T10:00:00.000Z',
  ...overrides
});

const createMockTopic = (overrides: Partial<StudyTopic>): StudyTopic => ({
  id: `top-${Math.random().toString(36).slice(2, 6)}`,
  subjectId: 'sbj-arch',
  title: 'Branch Prediction',
  orderIndex: 1,
  masteryLevel: 'learning',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...overrides
});

describe('SOLIS PART 2 — Adaptive Study Intelligence & Recommendation Engine', () => {
  /* =========================================================================
     1. Adaptive Context Extraction (buildAdaptiveStudyContext)
     ========================================================================= */
  describe('Adaptive Context Extraction (buildAdaptiveStudyContext)', () => {
    it('normalizes subjects and recent sessions into a lightweight payload', () => {
      const subjects: StudySubject[] = [
        createMockSubject({ id: 's1', name: 'Operating Systems', targetHoursPerWeek: 6, completedHoursThisWeek: 3.5 })
      ];
      const sessions: StudySession[] = [
        createMockSession({ subjectId: 's1', durationMinutes: 50, completedAt: '2026-09-22T09:00:00Z' }),
        createMockSession({ subjectId: 's1', durationMinutes: 30, completedAt: '2026-09-21T09:00:00Z' })
      ];

      const context = buildAdaptiveStudyContext(subjects, sessions);

      expect(context.subjects).toHaveLength(1);
      expect(context.subjects[0]).toEqual({
        id: 's1',
        name: 'Operating Systems',
        completedHoursThisWeek: 3.5,
        targetHoursPerWeek: 6,
        status: 'active'
      });
      expect(context.recentSessions).toHaveLength(2);
      expect(context.recentSessions[0].duration).toBe(50);
    });

    it('caps recent sessions to the specified limit (defaults to 5)', () => {
      const subjects = [createMockSubject({})];
      const sessions = Array.from({ length: 10 }, (_, i) =>
        createMockSession({ id: `ses-${i}`, durationMinutes: 30 })
      );

      const defaultContext = buildAdaptiveStudyContext(subjects, sessions);
      expect(defaultContext.recentSessions).toHaveLength(5);

      const customContext = buildAdaptiveStudyContext(subjects, sessions, 3);
      expect(customContext.recentSessions).toHaveLength(3);
    });

    it('handles empty subjects and sessions gracefully without throwing', () => {
      const emptyContext = buildAdaptiveStudyContext([], []);
      expect(emptyContext.subjects).toEqual([]);
      expect(emptyContext.recentSessions).toEqual([]);
    });
  });

  /* =========================================================================
     2. Subject Deficit & Gap Analysis (detectSubjectGaps)
     ========================================================================= */
  describe('Subject Deficit & Gap Analysis (detectSubjectGaps)', () => {
    it('calculates weekly hour deficits and completion ratios accurately', () => {
      const subjects: StudySubject[] = [
        createMockSubject({
          id: 'sbj-on-track',
          name: 'Distributed Systems',
          targetHoursPerWeek: 5,
          completedHoursThisWeek: 5
        }),
        createMockSubject({
          id: 'sbj-lagging',
          name: 'Compiler Engineering',
          targetHoursPerWeek: 6,
          completedHoursThisWeek: 1.5
        })
      ];

      const gaps = detectSubjectGaps(subjects);
      expect(gaps).toHaveLength(2);

      // sbj-lagging has deficit of 4.5h (6 - 1.5) -> should rank first
      expect(gaps[0].subjectId).toBe('sbj-lagging');
      expect(gaps[0].deficitHours).toBe(4.5);
      expect(gaps[0].completionRatio).toBe(0.25);

      // sbj-on-track has deficit of 0h -> ranks second
      expect(gaps[1].subjectId).toBe('sbj-on-track');
      expect(gaps[1].deficitHours).toBe(0);
      expect(gaps[1].completionRatio).toBe(1);
    });

    it('handles subjects with zero target hours safely without division by zero', () => {
      const subjects: StudySubject[] = [
        createMockSubject({ id: 's-zero', name: 'Open Exploration', targetHoursPerWeek: 0, completedHoursThisWeek: 2 })
      ];

      const gaps = detectSubjectGaps(subjects);
      expect(gaps[0].deficitHours).toBe(0);
      expect(gaps[0].completionRatio).toBe(1);
    });

    it('filters out archived subjects from active planning gaps', () => {
      const subjects: StudySubject[] = [
        createMockSubject({ id: 's-archived', name: 'Old Subject', status: 'archived', targetHoursPerWeek: 10, completedHoursThisWeek: 0 }),
        createMockSubject({ id: 's-active', name: 'Active Subject', status: 'active', targetHoursPerWeek: 4, completedHoursThisWeek: 2 })
      ];

      const gaps = detectSubjectGaps(subjects);
      expect(gaps).toHaveLength(1);
      expect(gaps[0].subjectId).toBe('s-active');
    });
  });

  /* =========================================================================
     3. Weak Topic & Recall Deficit Detection (detectWeakTopics)
     ========================================================================= */
  describe('Weak Topic & Recall Deficit Detection (detectWeakTopics)', () => {
    it('detects low retention topics from past sessions with recall ratings <= 2', () => {
      const topics: StudyTopic[] = [
        createMockTopic({ id: 't1', title: 'Virtual Memory Paging', masteryLevel: 'learning' }),
        createMockTopic({ id: 't2', title: 'Cache Coherence Protocols', masteryLevel: 'mastered' })
      ];

      const sessions: StudySession[] = [
        createMockSession({
          topicsCovered: ['Virtual Memory Paging'],
          retentionRating: 2 // Low retention signal
        })
      ];

      const weakTopics = detectWeakTopics(topics, sessions);
      expect(weakTopics).toHaveLength(1);
      expect(weakTopics[0].title).toBe('Virtual Memory Paging');
      expect(weakTopics[0].status).toBe('low_retention');
    });

    it('prioritizes low_retention above unstudied, and unstudied above learning', () => {
      const topics: StudyTopic[] = [
        createMockTopic({ id: 't-learning', title: 'Branch Prediction', masteryLevel: 'learning' }),
        createMockTopic({ id: 't-unstudied', title: 'Out of Order Execution', masteryLevel: 'unstudied' }),
        createMockTopic({ id: 't-struggling', title: 'TLB Miss Handling', masteryLevel: 'learning' })
      ];

      const sessions: StudySession[] = [
        createMockSession({ topicsCovered: ['TLB Miss Handling'], retentionRating: 1 })
      ];

      const ranked = detectWeakTopics(topics, sessions);
      expect(ranked).toHaveLength(3);
      expect(ranked[0].status).toBe('low_retention');
      expect(ranked[0].title).toBe('TLB Miss Handling');
      expect(ranked[1].status).toBe('unstudied');
      expect(ranked[1].title).toBe('Out of Order Execution');
      expect(ranked[2].status).toBe('learning');
      expect(ranked[2].title).toBe('Branch Prediction');
    });

    it('ignores mastered topics that have high retention ratings', () => {
      const topics: StudyTopic[] = [
        createMockTopic({ id: 't-mastered', title: 'Boolean Algebra', masteryLevel: 'mastered' })
      ];
      const sessions: StudySession[] = [
        createMockSession({ topicsCovered: ['Boolean Algebra'], retentionRating: 5 })
      ];

      const weakTopics = detectWeakTopics(topics, sessions);
      expect(weakTopics).toHaveLength(0);
    });
  });

  /* =========================================================================
     4. Suggestion Payload Routing (resolveStudySuggestionRoute)
     ========================================================================= */
  describe('Suggestion Payload Routing (resolveStudySuggestionRoute)', () => {
    it('routes review_flashcards and take_quiz directly to /app/study', () => {
      expect(resolveStudySuggestionRoute({ type: 'review_flashcards' })).toBe('/app/study');
      expect(resolveStudySuggestionRoute({ type: 'take_quiz' })).toBe('/app/study');
    });

    it('routes review_note with noteId to /app/notes?id=... and fallback to /app/notes', () => {
      expect(
        resolveStudySuggestionRoute({
          type: 'review_note',
          actionPayload: { noteId: 'note-123' }
        })
      ).toBe('/app/notes?id=note-123');

      expect(resolveStudySuggestionRoute({ type: 'review_note' })).toBe('/app/notes');
    });

    it('routes study_topic and unknown types to /app/focus', () => {
      expect(
        resolveStudySuggestionRoute({
          type: 'study_topic',
          actionPayload: { subjectId: 'sbj-1' }
        })
      ).toBe('/app/focus');

      expect(resolveStudySuggestionRoute({ type: 'unknown_action' as any })).toBe('/app/focus');
    });
  });

  /* =========================================================================
     5. Deterministic Recommendation Engine (generateDeterministicStudyRecommendations)
     ========================================================================= */
  describe('Deterministic Recommendation Engine (generateDeterministicStudyRecommendations)', () => {
    it('produces exactly 3 high-yield explainable action items', () => {
      const subjects: StudySubject[] = [
        createMockSubject({ id: 's1', name: 'Operating Systems', targetHoursPerWeek: 5, completedHoursThisWeek: 1 }),
        createMockSubject({ id: 's2', name: 'Algorithms', targetHoursPerWeek: 4, completedHoursThisWeek: 3 })
      ];

      const topics: StudyTopic[] = [
        createMockTopic({ id: 't1', subjectId: 's1', title: 'Virtual Memory', masteryLevel: 'unstudied' })
      ];

      const recommendations = generateDeterministicStudyRecommendations({
        subjects,
        recentSessions: [],
        topics
      });

      expect(recommendations).toHaveLength(3);

      // Item 1: Weak or unstudied topic
      expect(recommendations[0].type).toBe('study_topic');
      expect(recommendations[0].title).toContain('Virtual Memory');
      expect(recommendations[0].actionPayload.topicId).toBe('t1');

      // Item 2: Catch up on worst-deficit subject
      expect(recommendations[1].type).toBe('study_topic');
      expect(recommendations[1].title).toContain('Operating Systems');
      expect(recommendations[1].reason).toContain('4h remaining');

      // Item 3: Formative Quiz
      expect(recommendations[2].type).toBe('take_quiz');
      expect(recommendations[2].title).toContain('Self-Assessment');
    });

    it('suggests flashcard review when no topics are weak or unstudied', () => {
      const subjects: StudySubject[] = [
        createMockSubject({ id: 's1', name: 'Mathematics', targetHoursPerWeek: 4, completedHoursThisWeek: 4 })
      ];

      const recommendations = generateDeterministicStudyRecommendations({
        subjects,
        recentSessions: [],
        topics: []
      });

      expect(recommendations).toHaveLength(3);
      expect(recommendations[0].type).toBe('review_flashcards');
      expect(recommendations[0].title).toBe('Spaced Repetition Review');
    });
  });

  /* =========================================================================
     6. AIService Integration for Adaptive Suggestions
     ========================================================================= */
  describe('AIService Integration for Adaptive Suggestions', () => {
    beforeEach(() => {
      vi.stubGlobal('localStorage', {
        getItem: () => 'AIzaSyAdaptiveTestKey',
        setItem: () => {},
        removeItem: () => {},
        clear: () => {}
      });
    });

    it('queries Gemini API and parses recommendations array cleanly', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify([
                        {
                          type: 'study_topic',
                          title: 'Deep Dive: Distributed Snapshots',
                          reason: 'Chandy-Lamport algorithm has 0 recorded study minutes.',
                          actionPayload: { subjectId: 'sbj-dist', topicId: 'top-snap' }
                        },
                        {
                          type: 'review_flashcards',
                          title: 'Recall Drill: Networks',
                          reason: '18 flashcards due for revision.',
                          actionPayload: { mode: 'due' }
                        },
                        {
                          type: 'take_quiz',
                          title: 'Quick Check: TCP Congestion Control',
                          reason: 'Verify comprehension of AIMD dynamics.',
                          actionPayload: { subjectId: 'sbj-net' }
                        }
                      ])
                    }
                  ]
                }
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const subjects = [createMockSubject({ id: 'sbj-dist', name: 'Distributed Systems' })];
      const context = buildAdaptiveStudyContext(subjects, []);
      const suggestions = await aiService.suggestNextStudyActions(context);

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0].title).toContain('Distributed Snapshots');
      expect(resolveStudySuggestionRoute(suggestions[0])).toBe('/app/focus');
      expect(resolveStudySuggestionRoute(suggestions[1])).toBe('/app/study');
      expect(resolveStudySuggestionRoute(suggestions[2])).toBe('/app/study');
    });
  });
});
