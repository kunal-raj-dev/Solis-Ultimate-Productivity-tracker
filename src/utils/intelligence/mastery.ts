/**
 * Solis Intelligence Engine — Mastery Intelligence Module
 * Multi-factor Solis Study Mastery Signal and Spaced Review Candidate detection.
 */

import {
  IntelligenceSourceData,
  MasteryIntelligenceInsight,
  TopicMasterySignal
} from './types';

export function computeTopicMastery(
  data: IntelligenceSourceData,
  referenceDate = new Date()
): MasteryIntelligenceInsight {
  const { topics, subjects, sessions } = data;
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const refTime = referenceDate.getTime();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const topicSignals: TopicMasterySignal[] = topics.map((topic) => {
    const parentSubject = subjectMap.get(topic.subjectId);
    const subjectName = parentSubject?.name || 'General Topic';
    const subjectColor = parentSubject?.color || 'coral';

    // Find sessions covering this topic (either explicitly by title/topicId or in topicsCovered array)
    const topicSessions = sessions.filter((s) => {
      if (s.subjectId !== topic.subjectId) return false;
      if (s.topicsCovered && Array.isArray(s.topicsCovered)) {
        return s.topicsCovered.some(
          (t) => t.toLowerCase() === topic.title.toLowerCase() || t === topic.id
        );
      }
      return false;
    });

    const topicCards = (data.flashcards || []).filter((c) => c.topicId === topic.id);
    const topicReviews = (data.reviews || []).filter((r) => r.topicId === topic.id);
    const flashcardRepetitions = topicCards.reduce((acc, c) => acc + (c.repetitionCount || 0), 0);
    const reviewAttempts = topicReviews.length;

    const studyCount = topicSessions.length;
    const totalMinutesInvested = topicSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

    // Calculate Average Retention Rating (1-5) across sessions, reviews, and flashcards
    let averageRetentionRating = 3.0; // neutral default
    let latestRetentionRating = 3;
    let totalRatingsSum = 0;
    let totalRatingsCount = 0;

    if (topicSessions.length > 0) {
      const sumRatings = topicSessions.reduce((acc, s) => acc + (s.retentionRating || 3), 0);
      totalRatingsSum += sumRatings;
      totalRatingsCount += topicSessions.length;

      // Latest session
      const sortedByDate = [...topicSessions].sort(
        (a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime()
      );
      latestRetentionRating = sortedByDate[0].retentionRating || 3;
    }

    if (topicCards.length > 0) {
      const ratedCards = topicCards.filter((c) => c.difficultyRating);
      if (ratedCards.length > 0) {
        const difficultyToRating: Record<string, number> = { easy: 5, good: 4, hard: 2, again: 1 };
        const sumCardRatings = ratedCards.reduce((acc, c) => acc + (difficultyToRating[c.difficultyRating || 'good'] || 3), 0);
        totalRatingsSum += sumCardRatings;
        totalRatingsCount += ratedCards.length;
      }
    } else if (topicReviews.length > 0) {
      const completedReviews = topicReviews.filter((r) => r.completed);
      totalRatingsSum += completedReviews.length * 4 + (topicReviews.length - completedReviews.length) * 2;
      totalRatingsCount += topicReviews.length;
    }

    if (totalRatingsCount > 0) {
      averageRetentionRating = +(totalRatingsSum / totalRatingsCount).toFixed(1);
    }

    // Days since last engagement (sessions, flashcards, or reviews)
    let daysSinceLastReview: number | null = null;
    let lastStudiedAt: string | null = null;

    const cardTimestamps = topicCards
      .map((c) => (c.lastReviewedAt ? new Date(c.lastReviewedAt).getTime() : 0))
      .filter((t) => t > 0);
    const reviewTimestamps = topicReviews
      .map((r) => (r.completedAt ? new Date(r.completedAt).getTime() : r.createdAt ? new Date(r.createdAt).getTime() : 0))
      .filter((t) => t > 0);
    const allTimestamps = [
      ...topicSessions.map((s) => new Date(s.completedAt || s.createdAt).getTime()),
      ...cardTimestamps,
      ...reviewTimestamps
    ].filter((t) => !isNaN(t) && t > 0);

    if (allTimestamps.length > 0) {
      const latestTimestamp = Math.max(...allTimestamps);
      daysSinceLastReview = Math.max(0, Math.floor((refTime - latestTimestamp) / MS_PER_DAY));
      lastStudiedAt = new Date(latestTimestamp).toISOString();
    }

    // Mathematical Component 1: State Score (0 - 100)
    let stateScore = 0;
    if (topic.masteryLevel === 'mastered') {
      stateScore = 100;
    } else if (topic.masteryLevel === 'learning') {
      stateScore = 50;
    } else {
      stateScore = 0;
    }

    // Mathematical Component 2: Repetition Depth (0 - 100, 5 sessions = 100)
    const repetitionScore = Math.min(
      100,
      studyCount * 20 + flashcardRepetitions * 10 + reviewAttempts * 10
    );

    // Mathematical Component 3: Retention Score (0 - 100)
    const hasEvidence = studyCount > 0 || topicCards.length > 0 || topicReviews.length > 0;
    const retentionScore = hasEvidence
      ? Math.round((averageRetentionRating / 5) * 100)
      : 0;

    // Mathematical Component 4: Recency Decay Function (0 - 100)
    // Formula: 100 * e^(-0.05 * days)
    let recencyScore = 0;
    if (daysSinceLastReview !== null) {
      recencyScore = Math.round(100 * Math.exp(-0.05 * daysSinceLastReview));
    }

    // Composite Solis Study Mastery Signal:
    // 30% State + 25% Repetition + 25% Retention + 20% Recency
    const compositeMasterySignal = Math.min(
      100,
      Math.round(
        stateScore * 0.3 +
        repetitionScore * 0.25 +
        retentionScore * 0.25 +
        recencyScore * 0.2
      )
    );

    // Review trigger logic
    let isReviewRecommended = false;
    let reviewReason: string | undefined = undefined;

    // Flashcard overdue check
    const overdueCards = topicCards.filter(
      (c) => c.nextReviewDate && new Date(c.nextReviewDate).getTime() <= refTime
    );

    if (overdueCards.length > 0) {
      isReviewRecommended = true;
      reviewReason = `${overdueCards.length} flashcard${overdueCards.length > 1 ? 's' : ''} due for spaced retrieval review.`;
    } else if (daysSinceLastReview !== null && daysSinceLastReview >= 7 && compositeMasterySignal >= 35) {
      isReviewRecommended = true;
      reviewReason = `Last studied ${daysSinceLastReview} days ago. Spaced repetition suggested to preserve neural retention.`;
    } else if (studyCount > 0 && latestRetentionRating <= 2) {
      isReviewRecommended = true;
      reviewReason = `Last retention rating was ${latestRetentionRating}/5. Recommended for immediate active recall.`;
    }

    return {
      topicId: topic.id,
      topicTitle: topic.title,
      subjectId: topic.subjectId,
      subjectName,
      subjectColor,
      state: topic.masteryLevel,
      studyCount,
      totalMinutesInvested,
      averageRetentionRating,
      daysSinceLastReview,
      lastStudiedAt,
      stateScore,
      repetitionScore,
      retentionScore,
      recencyScore,
      compositeMasterySignal,
      isReviewRecommended,
      reviewReason
    };
  });

  const masteredCount = topicSignals.filter((t) => t.state === 'mastered').length;
  const learningCount = topicSignals.filter((t) => t.state === 'learning').length;
  const unstudiedCount = topicSignals.filter((t) => t.state === 'unstudied').length;

  const totalScores = topicSignals.reduce((acc, t) => acc + t.compositeMasterySignal, 0);
  const averageMasteryScore = topicSignals.length > 0
    ? Math.round(totalScores / topicSignals.length)
    : 0;

  const reviewQueue = topicSignals
    .filter((t) => t.isReviewRecommended)
    .sort((a, b) => {
      // Prioritize low retention, then high days since review
      if (a.averageRetentionRating !== b.averageRetentionRating) {
        return a.averageRetentionRating - b.averageRetentionRating;
      }
      return (b.daysSinceLastReview || 0) - (a.daysSinceLastReview || 0);
    });

  return {
    topics: topicSignals,
    masteredCount,
    learningCount,
    unstudiedCount,
    averageMasteryScore,
    reviewQueue,
    hasSufficientData: topics.length > 0
  };
}
