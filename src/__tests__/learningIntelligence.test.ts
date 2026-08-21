import { describe, it, expect } from 'vitest';
import {
  deriveTopicHistories,
  RawLearningRecords
} from '../utils/intelligence/topicHistory';
import { evaluateEvidenceFeatures } from '../utils/intelligence/sufficiencyModel';
import { evaluateTopicMastery } from '../utils/intelligence/masteryEngine';
import { evaluateTopicRetention } from '../utils/intelligence/retentionEngine';
import { createLearningIntelligenceSnapshot } from '../utils/intelligence';
import { StudySubject, StudyTopic, StudySession } from '../types/study';
import { Flashcard } from '../types/learning';

describe('Solis Phase 11 — Study Graph & Learning Intelligence Engine', () => {
  const BASE_DATE = new Date('2026-08-20T12:00:00Z');

  const mockSubjectDSA: StudySubject = {
    id: 'subj-dsa',
    name: 'Data Structures & Algorithms',
    code: 'CS201',
    color: 'coral',
    targetHoursPerWeek: 10,
    completedHoursThisWeek: 4,
    status: 'active',
    notesCount: 2,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  };

  const mockTopics: StudyTopic[] = [
    {
      id: 'top-arrays',
      subjectId: 'subj-dsa',
      title: 'Arrays & Dynamic Sizing',
      orderIndex: 1,
      masteryLevel: 'unstudied',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z'
    },
    {
      id: 'top-trees',
      subjectId: 'subj-dsa',
      title: 'Binary Search Trees',
      orderIndex: 2,
      masteryLevel: 'unstudied',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z'
    },
    {
      id: 'top-graphs',
      subjectId: 'subj-dsa',
      title: 'Graph Traversal',
      orderIndex: 3,
      masteryLevel: 'unstudied',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z'
    },
    {
      id: 'top-dp',
      subjectId: 'subj-dsa',
      title: 'Dynamic Programming',
      orderIndex: 4,
      masteryLevel: 'unstudied',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z'
    }
  ];

  // --------------------------------------------------------------------------
  // 1. TOPIC IDENTITY RESOLUTION & AMBIGUITY HANDLING
  // --------------------------------------------------------------------------
  describe('1. Topic Identity Resolution & Ambiguity Handling', () => {
    it('matches sessions by exact topic ID authoritatively', () => {
      const sessions: StudySession[] = [
        {
          id: 'sess-1',
          subjectId: 'subj-dsa',
          subjectName: 'Data Structures & Algorithms',
          topicsCovered: ['top-trees'],
          durationMinutes: 45,
          type: 'deep_study',
          retentionRating: 4,
          completedAt: '2026-08-18T10:00:00Z',
          createdAt: '2026-08-18T10:00:00Z',
          updatedAt: '2026-08-18T10:00:00Z'
        }
      ];

      const records: RawLearningRecords = {
        subjects: [mockSubjectDSA],
        topics: mockTopics,
        sessions,
        flashcards: [],
        reviews: [],
        notes: [],
        resources: [],
        planItems: [],
        referenceDate: BASE_DATE
      };

      const histories = deriveTopicHistories(records);
      const treeHistory = histories.get('top-trees');

      expect(treeHistory).toBeDefined();
      expect(treeHistory?.totalSessionsCount).toBe(1);
      expect(treeHistory?.totalStudyMinutes).toBe(45);
      expect(treeHistory?.unresolvedEventCount).toBe(0);
    });

    it('matches sessions by title as fallback when unambiguous in subject', () => {
      const sessions: StudySession[] = [
        {
          id: 'sess-2',
          subjectId: 'subj-dsa',
          subjectName: 'Data Structures & Algorithms',
          topicsCovered: ['Binary Search Trees'], // Exact title match
          durationMinutes: 30,
          type: 'deep_study',
          retentionRating: 5,
          completedAt: '2026-08-18T10:00:00Z',
          createdAt: '2026-08-18T10:00:00Z',
          updatedAt: '2026-08-18T10:00:00Z'
        }
      ];

      const records: RawLearningRecords = {
        subjects: [mockSubjectDSA],
        topics: mockTopics,
        sessions,
        flashcards: [],
        reviews: [],
        notes: [],
        resources: [],
        planItems: [],
        referenceDate: BASE_DATE
      };

      const histories = deriveTopicHistories(records);
      const treeHistory = histories.get('top-trees');

      expect(treeHistory?.totalSessionsCount).toBe(1);
      expect(treeHistory?.totalStudyMinutes).toBe(30);
    });

    it('does NOT guess when multiple topics share the same title (ambiguity safeguard)', () => {
      const duplicateTopics: StudyTopic[] = [
        ...mockTopics,
        {
          id: 'top-trees-advanced',
          subjectId: 'subj-dsa',
          title: 'Binary Search Trees', // Duplicate title
          orderIndex: 5,
          masteryLevel: 'unstudied',
          createdAt: '2026-08-01T00:00:00Z',
          updatedAt: '2026-08-01T00:00:00Z'
        }
      ];

      const ambiguousSessions: StudySession[] = [
        {
          id: 'sess-ambiguous',
          subjectId: 'subj-dsa',
          subjectName: 'Data Structures & Algorithms',
          topicsCovered: ['Binary Search Trees'],
          durationMinutes: 40,
          type: 'deep_study',
          retentionRating: 4,
          completedAt: '2026-08-18T10:00:00Z',
          createdAt: '2026-08-18T10:00:00Z',
          updatedAt: '2026-08-18T10:00:00Z'
        }
      ];

      const records: RawLearningRecords = {
        subjects: [mockSubjectDSA],
        topics: duplicateTopics,
        sessions: ambiguousSessions,
        flashcards: [],
        reviews: [],
        notes: [],
        resources: [],
        planItems: [],
        referenceDate: BASE_DATE
      };

      const histories = deriveTopicHistories(records);
      const tree1 = histories.get('top-trees');
      const tree2 = histories.get('top-trees-advanced');

      // Neither should falsely claim the ambiguous session
      expect(tree1?.totalSessionsCount).toBe(0);
      expect(tree2?.totalSessionsCount).toBe(0);
      // Both track the unresolved event
      expect(tree1?.unresolvedEventCount).toBe(1);
      expect(tree2?.unresolvedEventCount).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // 2. EVIDENCE SUFFICIENCY VS QUALITY CONFIDENCE
  // --------------------------------------------------------------------------
  describe('2. Evidence Sufficiency vs. Quality Confidence', () => {
    it('evaluates unstudied topic with NO_DATA and LOW confidence', () => {
      const records: RawLearningRecords = {
        subjects: [mockSubjectDSA],
        topics: [mockTopics[3]], // DP (no sessions)
        sessions: [],
        flashcards: [],
        reviews: [],
        notes: [],
        resources: [],
        planItems: [],
        referenceDate: BASE_DATE
      };

      const histories = deriveTopicHistories(records);
      const dpHistory = histories.get('top-dp')!;
      const features = evaluateEvidenceFeatures(dpHistory);
      const mastery = evaluateTopicMastery(dpHistory);

      expect(features.sufficiency).toBe('NO_DATA');
      expect(features.confidence).toBe('LOW');
      expect(mastery.state).toBe('NOT_ASSESSED');
      expect(mastery.summary).toBe('Not enough evidence yet.');
    });

    it('distinguishes clustered flashcards (LOW/MEDIUM confidence) from spaced reviews (HIGH confidence)', () => {
      // Clustered: 6 cards created/reviewed on same day
      const clusteredHistory = {
        topicId: 'top-arrays',
        topicTitle: 'Arrays',
        subjectId: 'subj-dsa',
        subjectName: 'DSA',
        subjectColor: 'coral',
        manualStatus: 'unstudied' as const,
        firstSeenAt: '2026-08-20T10:00:00Z',
        lastStudiedAt: '2026-08-20T10:30:00Z', // Same day
        daysSinceLastStudied: 0,
        lastReviewedAt: '2026-08-20T10:30:00Z',
        daysSinceLastReviewed: 0,
        totalSessionsCount: 0,
        totalStudyMinutes: 0,
        averageRetentionRating: null,
        latestRetentionRating: null,
        flashcardsCount: 6,
        totalRecallAttempts: 6,
        successfulRecallCount: 6,
        failedRecallCount: 0,
        recallAccuracyRate: 1.0,
        averageEaseFactor: 2.5,
        dueFlashcardsCount: 0,
        notesCount: 0,
        resourcesCount: 0,
        unresolvedEventCount: 0
      };

      const clusteredFeatures = evaluateEvidenceFeatures(clusteredHistory);
      expect(clusteredFeatures.sufficiency).toBe('HIGH_DATA');
      expect(clusteredFeatures.isSpacedOverTime).toBe(false);
      expect(clusteredFeatures.confidence).toBe('MEDIUM'); // Not high because temporal spread < 2 days

      // Spaced: 6 cards reviewed across 10 days
      const spacedHistory = {
        ...clusteredHistory,
        firstSeenAt: '2026-08-10T10:00:00Z',
        lastStudiedAt: '2026-08-20T10:00:00Z' // 10 days spread
      };

      const spacedFeatures = evaluateEvidenceFeatures(spacedHistory);
      expect(spacedFeatures.sufficiency).toBe('HIGH_DATA');
      expect(spacedFeatures.isSpacedOverTime).toBe(true);
      expect(spacedFeatures.confidence).toBe('HIGH');
    });
  });

  // --------------------------------------------------------------------------
  // 3. DETERMINISTIC RETENTION POLICY (Single Source of Truth)
  // --------------------------------------------------------------------------
  describe('3. Deterministic Retention Health Policy', () => {
    it('produces UNSTUDIED when 0 sessions recorded', () => {
      const history = {
        topicId: 'top-dp',
        topicTitle: 'Dynamic Programming',
        subjectId: 'subj-dsa',
        subjectName: 'DSA',
        subjectColor: 'coral',
        manualStatus: 'unstudied' as const,
        firstSeenAt: null,
        lastStudiedAt: null,
        daysSinceLastStudied: null,
        lastReviewedAt: null,
        daysSinceLastReviewed: null,
        totalSessionsCount: 0,
        totalStudyMinutes: 0,
        averageRetentionRating: null,
        latestRetentionRating: null,
        flashcardsCount: 0,
        totalRecallAttempts: 0,
        successfulRecallCount: 0,
        failedRecallCount: 0,
        recallAccuracyRate: null,
        averageEaseFactor: null,
        dueFlashcardsCount: 0,
        notesCount: 0,
        resourcesCount: 0,
        unresolvedEventCount: 0
      };

      const ret = evaluateTopicRetention(history);
      expect(ret.signal).toBe('UNSTUDIED');
      expect(ret.daysElapsed).toBeNull();
    });

    it('produces FRESH for 0–3 days with good retention', () => {
      const history = {
        topicId: 'top-arrays',
        topicTitle: 'Arrays',
        subjectId: 'subj-dsa',
        subjectName: 'DSA',
        subjectColor: 'coral',
        manualStatus: 'learning' as const,
        firstSeenAt: '2026-08-10T00:00:00Z',
        lastStudiedAt: '2026-08-18T12:00:00Z',
        daysSinceLastStudied: 2, // 2 days ago
        lastReviewedAt: null,
        daysSinceLastReviewed: null,
        totalSessionsCount: 2,
        totalStudyMinutes: 60,
        averageRetentionRating: 4.5,
        latestRetentionRating: 5,
        flashcardsCount: 0,
        totalRecallAttempts: 0,
        successfulRecallCount: 0,
        failedRecallCount: 0,
        recallAccuracyRate: null,
        averageEaseFactor: null,
        dueFlashcardsCount: 0,
        notesCount: 0,
        resourcesCount: 0,
        unresolvedEventCount: 0
      };

      const ret = evaluateTopicRetention(history);
      expect(ret.signal).toBe('FRESH');
      expect(ret.daysElapsed).toBe(2);
    });

    it('produces DUE_FOR_REVIEW for 4–7 days elapsed', () => {
      const history = {
        topicId: 'top-trees',
        topicTitle: 'Trees',
        subjectId: 'subj-dsa',
        subjectName: 'DSA',
        subjectColor: 'coral',
        manualStatus: 'learning' as const,
        firstSeenAt: '2026-08-01T00:00:00Z',
        lastStudiedAt: '2026-08-15T12:00:00Z',
        daysSinceLastStudied: 5, // 5 days ago (in 4-7 range)
        lastReviewedAt: null,
        daysSinceLastReviewed: null,
        totalSessionsCount: 3,
        totalStudyMinutes: 90,
        averageRetentionRating: 4.0,
        latestRetentionRating: 4,
        flashcardsCount: 0,
        totalRecallAttempts: 0,
        successfulRecallCount: 0,
        failedRecallCount: 0,
        recallAccuracyRate: null,
        averageEaseFactor: null,
        dueFlashcardsCount: 0,
        notesCount: 0,
        resourcesCount: 0,
        unresolvedEventCount: 0
      };

      const ret = evaluateTopicRetention(history);
      expect(ret.signal).toBe('DUE_FOR_REVIEW');
      expect(ret.daysElapsed).toBe(5);
    });

    it('produces NEEDS_ATTENTION for 8–14 days elapsed', () => {
      const history = {
        topicId: 'top-graphs',
        topicTitle: 'Graphs',
        subjectId: 'subj-dsa',
        subjectName: 'DSA',
        subjectColor: 'coral',
        manualStatus: 'learning' as const,
        firstSeenAt: '2026-08-01T00:00:00Z',
        lastStudiedAt: '2026-08-10T12:00:00Z',
        daysSinceLastStudied: 10, // 10 days ago (in 8-14 range)
        lastReviewedAt: null,
        daysSinceLastReviewed: null,
        totalSessionsCount: 2,
        totalStudyMinutes: 50,
        averageRetentionRating: 3.5,
        latestRetentionRating: 3,
        flashcardsCount: 0,
        totalRecallAttempts: 0,
        successfulRecallCount: 0,
        failedRecallCount: 0,
        recallAccuracyRate: null,
        averageEaseFactor: null,
        dueFlashcardsCount: 0,
        notesCount: 0,
        resourcesCount: 0,
        unresolvedEventCount: 0
      };

      const ret = evaluateTopicRetention(history);
      expect(ret.signal).toBe('NEEDS_ATTENTION');
      expect(ret.daysElapsed).toBe(10);
    });

    it('produces OVERDUE for > 14 days elapsed', () => {
      const history = {
        topicId: 'top-graphs',
        topicTitle: 'Graphs',
        subjectId: 'subj-dsa',
        subjectName: 'DSA',
        subjectColor: 'coral',
        manualStatus: 'learning' as const,
        firstSeenAt: '2026-07-01T00:00:00Z',
        lastStudiedAt: '2026-08-01T12:00:00Z',
        daysSinceLastStudied: 19, // 19 days ago (> 14)
        lastReviewedAt: null,
        daysSinceLastReviewed: null,
        totalSessionsCount: 2,
        totalStudyMinutes: 50,
        averageRetentionRating: 3.5,
        latestRetentionRating: 3,
        flashcardsCount: 0,
        totalRecallAttempts: 0,
        successfulRecallCount: 0,
        failedRecallCount: 0,
        recallAccuracyRate: null,
        averageEaseFactor: null,
        dueFlashcardsCount: 0,
        notesCount: 0,
        resourcesCount: 0,
        unresolvedEventCount: 0
      };

      const ret = evaluateTopicRetention(history);
      expect(ret.signal).toBe('OVERDUE');
      expect(ret.daysElapsed).toBe(19);
    });

    it('immediately flags NEEDS_ATTENTION on poor retention rating (<= 2/5) even if recent', () => {
      const history = {
        topicId: 'top-trees',
        topicTitle: 'Trees',
        subjectId: 'subj-dsa',
        subjectName: 'DSA',
        subjectColor: 'coral',
        manualStatus: 'learning' as const,
        firstSeenAt: '2026-08-19T00:00:00Z',
        lastStudiedAt: '2026-08-20T00:00:00Z',
        daysSinceLastStudied: 0, // Today
        lastReviewedAt: null,
        daysSinceLastReviewed: null,
        totalSessionsCount: 1,
        totalStudyMinutes: 30,
        averageRetentionRating: 2.0,
        latestRetentionRating: 2, // Poor retention <= 2
        flashcardsCount: 0,
        totalRecallAttempts: 0,
        successfulRecallCount: 0,
        failedRecallCount: 0,
        recallAccuracyRate: null,
        averageEaseFactor: null,
        dueFlashcardsCount: 0,
        notesCount: 0,
        resourcesCount: 0,
        unresolvedEventCount: 0
      };

      const ret = evaluateTopicRetention(history);
      expect(ret.signal).toBe('NEEDS_ATTENTION');
      expect(ret.whyExplanation).toContain('retention was low (2/5)');
    });
  });

  // --------------------------------------------------------------------------
  // 4. MASTERY EVALUATION & EXPLAINABILITY
  // --------------------------------------------------------------------------
  describe('4. Mastery Evaluation & Explainability', () => {
    it('evaluates STRONG mastery for high study exposure, high retention/recall, and temporal spacing', () => {
      const history = {
        topicId: 'top-arrays',
        topicTitle: 'Arrays',
        subjectId: 'subj-dsa',
        subjectName: 'DSA',
        subjectColor: 'coral',
        manualStatus: 'mastered' as const,
        firstSeenAt: '2026-08-01T00:00:00Z',
        lastStudiedAt: '2026-08-18T00:00:00Z',
        daysSinceLastStudied: 2,
        lastReviewedAt: '2026-08-18T00:00:00Z',
        daysSinceLastReviewed: 2,
        totalSessionsCount: 4,
        totalStudyMinutes: 120,
        averageRetentionRating: 4.6,
        latestRetentionRating: 5,
        flashcardsCount: 8,
        totalRecallAttempts: 8,
        successfulRecallCount: 7,
        failedRecallCount: 1,
        recallAccuracyRate: 0.88,
        averageEaseFactor: 2.6,
        dueFlashcardsCount: 0,
        notesCount: 2,
        resourcesCount: 1,
        unresolvedEventCount: 0
      };

      const mastery = evaluateTopicMastery(history);
      expect(mastery.state).toBe('STRONG');
      expect(mastery.whyExplanation).toContain('Demonstrated across 4 sessions');
      expect(mastery.evidenceFactors.studyExposure).toBe('4 sessions (120 min)');
      expect(mastery.evidenceFactors.recallPerformance).toContain('88% accuracy');
    });

    it('evaluates STABLE mastery for moderate exposure and steady retention', () => {
      const history = {
        topicId: 'top-trees',
        topicTitle: 'Trees',
        subjectId: 'subj-dsa',
        subjectName: 'DSA',
        subjectColor: 'coral',
        manualStatus: 'learning' as const,
        firstSeenAt: '2026-08-05T00:00:00Z',
        lastStudiedAt: '2026-08-15T00:00:00Z',
        daysSinceLastStudied: 5,
        lastReviewedAt: null,
        daysSinceLastReviewed: null,
        totalSessionsCount: 2,
        totalStudyMinutes: 45,
        averageRetentionRating: 3.8,
        latestRetentionRating: 4,
        flashcardsCount: 0,
        totalRecallAttempts: 0,
        successfulRecallCount: 0,
        failedRecallCount: 0,
        recallAccuracyRate: null,
        averageEaseFactor: null,
        dueFlashcardsCount: 0,
        notesCount: 1,
        resourcesCount: 0,
        unresolvedEventCount: 0
      };

      const mastery = evaluateTopicMastery(history);
      expect(mastery.state).toBe('STABLE');
      expect(mastery.whyExplanation).toContain('Supported by 2 study sessions (45 min)');
    });
  });

  // --------------------------------------------------------------------------
  // 5. SUBJECT HEALTH AGGREGATION & RECOMMENDATIONS
  // --------------------------------------------------------------------------
  describe('5. Subject Learning Health & Recommendations', () => {
    it('aggregates multi-topic distribution accurately without fake percentages', () => {
      const sessions: StudySession[] = [
        // Arrays: Strong
        {
          id: 's1',
          subjectId: 'subj-dsa',
          subjectName: 'DSA',
          topicsCovered: ['top-arrays'],
          durationMinutes: 120,
          type: 'deep_study',
          retentionRating: 5,
          completedAt: '2026-08-18T10:00:00Z',
          createdAt: '2026-08-01T10:00:00Z',
          updatedAt: '2026-08-18T10:00:00Z'
        },
        // Trees: Needs attention (studied 10 days ago)
        {
          id: 's2',
          subjectId: 'subj-dsa',
          subjectName: 'DSA',
          topicsCovered: ['top-trees'],
          durationMinutes: 45,
          type: 'deep_study',
          retentionRating: 3,
          completedAt: '2026-08-10T10:00:00Z',
          createdAt: '2026-08-05T10:00:00Z',
          updatedAt: '2026-08-10T10:00:00Z'
        }
      ];

      const flashcards: Flashcard[] = [
        {
          id: 'card-1',
          subjectId: 'subj-dsa',
          topicId: 'top-arrays',
          frontPrompt: 'Array random access complexity?',
          backAnswer: 'O(1)',
          cardType: 'standard',
          difficultyRating: 'good',
          repetitionCount: 4,
          intervalDays: 6,
          easeFactor: 2.6,
          nextReviewDate: '2026-08-25',
          lastReviewedAt: '2026-08-18T10:00:00Z',
          createdAt: '2026-08-01T10:00:00Z',
          updatedAt: '2026-08-18T10:00:00Z'
        }
      ];

      const snapshot = createLearningIntelligenceSnapshot({
        subjects: [mockSubjectDSA],
        topics: mockTopics,
        sessions,
        flashcards,
        reviews: [],
        notes: [],
        resources: [],
        planItems: [],
        referenceDate: BASE_DATE
      });

      const dsaHealth = snapshot.subjectHealths.get('subj-dsa');
      expect(dsaHealth).toBeDefined();
      expect(dsaHealth?.totalTopicsCount).toBe(4);
      expect(dsaHealth?.topicsAssessedCount).toBe(2); // Arrays & Trees
      expect(dsaHealth?.notAssessedCount).toBe(2);    // Graphs & DP

      // Recommendations should prioritize reviewing Trees
      expect(snapshot.recommendations.length).toBeGreaterThan(0);
      const topRec = snapshot.recommendations[0];
      expect(topRec.actionPayload.topicId).toBe('top-trees');
      expect(topRec.whyExplanation).toBeTruthy();
    });
  });
});
