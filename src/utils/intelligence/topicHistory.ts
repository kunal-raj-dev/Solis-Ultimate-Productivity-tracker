/**
 * Solis Learning Intelligence — Normalized Topic History Derivation
 * 
 * Reconstructs granular, verifiable topic learning history from raw learning events.
 * Uses strict authoritative topic matching and pre-indexed lookups to maintain performance.
 */

import { ID } from '../../types/common';
import { StudySubject, StudyTopic, StudySession, StudyPlanItem } from '../../types/study';
import { Flashcard, ReviewQueueItem } from '../../types/learning';
import { Note } from '../../types/note';
import { StudyResource } from '../../types/resource';
import { TopicLearningHistory } from '../../types/learningIntelligence';

export interface RawLearningRecords {
  subjects: StudySubject[];
  topics: StudyTopic[];
  sessions: StudySession[];
  flashcards: Flashcard[];
  reviews: ReviewQueueItem[];
  notes: Note[];
  resources: StudyResource[];
  planItems: StudyPlanItem[];
  referenceDate?: Date;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Normalizes and derives the complete topic learning history dataset.
 * Time complexity: O(Subjects + Topics + Sessions + Flashcards + Reviews + Notes + Resources)
 */
export function deriveTopicHistories(
  records: RawLearningRecords
): Map<ID, TopicLearningHistory> {
  const {
    subjects,
    topics,
    sessions,
    flashcards,
    reviews,
    notes,
    resources,
    planItems,
    referenceDate = new Date()
  } = records;

  const refTime = referenceDate.getTime();

  // 1. Build authoritative subject & topic lookup indexes
  const subjectMap = new Map<ID, StudySubject>();
  for (const s of subjects) {
    subjectMap.set(s.id, s);
  }

  const topicsBySubjectId = new Map<ID, StudyTopic[]>();
  const topicsById = new Map<ID, StudyTopic>();
  for (const t of topics) {
    topicsById.set(t.id, t);
    const list = topicsBySubjectId.get(t.subjectId) || [];
    list.push(t);
    topicsBySubjectId.set(t.subjectId, list);
  }

  // 2. Pre-index Plan Items by ID to resolve topicId
  const planItemToTopicMap = new Map<ID, ID>();
  for (const p of planItems) {
    if (p.topicId) {
      planItemToTopicMap.set(p.id, p.topicId);
    }
  }

  // 3. Pre-index Flashcards by Topic ID
  const flashcardsByTopic = new Map<ID, Flashcard[]>();
  for (const f of flashcards) {
    if (f.topicId) {
      const list = flashcardsByTopic.get(f.topicId) || [];
      list.push(f);
      flashcardsByTopic.set(f.topicId, list);
    }
  }

  // 4. Pre-index Reviews by Topic ID
  const reviewsByTopic = new Map<ID, ReviewQueueItem[]>();
  for (const r of reviews) {
    if (r.topicId) {
      const list = reviewsByTopic.get(r.topicId) || [];
      list.push(r);
      reviewsByTopic.set(r.topicId, list);
    }
  }

  // 5. Pre-index Resources by Topic ID
  const resourcesByTopic = new Map<ID, StudyResource[]>();
  for (const res of resources) {
    if (res.topicId) {
      const list = resourcesByTopic.get(res.topicId) || [];
      list.push(res);
      resourcesByTopic.set(res.topicId, list);
    }
  }

  // 6. Pre-index Notes by Topic ID (via planItem, tag, or session)
  const notesByTopic = new Map<ID, Note[]>();
  for (const n of notes) {
    let resolvedTopicId: ID | undefined = undefined;
    if (n.planItemId && planItemToTopicMap.has(n.planItemId)) {
      resolvedTopicId = planItemToTopicMap.get(n.planItemId);
    }
    if (resolvedTopicId) {
      const list = notesByTopic.get(resolvedTopicId) || [];
      list.push(n);
      notesByTopic.set(resolvedTopicId, list);
    }
  }

  // 7. Associate Sessions to Topics using strict unambiguous matching
  const sessionsByTopic = new Map<ID, StudySession[]>();
  const unresolvedSessionsCountByTopic = new Map<ID, number>();

  for (const sess of sessions) {
    const subjectTopics = topicsBySubjectId.get(sess.subjectId) || [];
    if (subjectTopics.length === 0) continue;

    // Check if session has a planItemId that explicitly maps to a topic
    if (sess.planItemId && planItemToTopicMap.has(sess.planItemId)) {
      const topicId = planItemToTopicMap.get(sess.planItemId)!;
      const list = sessionsByTopic.get(topicId) || [];
      list.push(sess);
      sessionsByTopic.set(topicId, list);
      continue;
    }

    // Inspect topicsCovered array
    if (sess.topicsCovered && Array.isArray(sess.topicsCovered)) {
      for (const coveredItem of sess.topicsCovered) {
        if (!coveredItem || typeof coveredItem !== 'string') continue;
        const trimmed = coveredItem.trim();
        if (!trimmed) continue;

        // Rule A: Exact Topic ID match (Authoritative)
        if (topicsById.has(trimmed) && topicsById.get(trimmed)!.subjectId === sess.subjectId) {
          const list = sessionsByTopic.get(trimmed) || [];
          list.push(sess);
          sessionsByTopic.set(trimmed, list);
          continue;
        }

        // Rule B: Title matching ONLY when unambiguous within the same subject
        const normalized = trimmed.toLowerCase();
        const matchingTopics = subjectTopics.filter(
          (t) => t.title.trim().toLowerCase() === normalized
        );

        if (matchingTopics.length === 1) {
          const matchedTopicId = matchingTopics[0].id;
          const list = sessionsByTopic.get(matchedTopicId) || [];
          list.push(sess);
          sessionsByTopic.set(matchedTopicId, list);
        } else if (matchingTopics.length > 1) {
          // Ambiguous: multiple topics share the same title within the subject
          // Do not guess. Track as unresolved.
          for (const ambTopic of matchingTopics) {
            unresolvedSessionsCountByTopic.set(
              ambTopic.id,
              (unresolvedSessionsCountByTopic.get(ambTopic.id) || 0) + 1
            );
          }
        }
      }
    }
  }

  // 8. Construct Normalized TopicLearningHistory for each topic
  const resultMap = new Map<ID, TopicLearningHistory>();

  for (const topic of topics) {
    const parentSubject = subjectMap.get(topic.subjectId);
    const subjectName = parentSubject?.name || 'General Subject';
    const subjectColor = parentSubject?.color || 'coral';

    const topicSessions = sessionsByTopic.get(topic.id) || [];
    const topicFlashcards = flashcardsByTopic.get(topic.id) || [];
    const topicReviews = reviewsByTopic.get(topic.id) || [];
    const topicNotes = notesByTopic.get(topic.id) || [];
    const topicResources = resourcesByTopic.get(topic.id) || [];
    const unresolvedCount = unresolvedSessionsCountByTopic.get(topic.id) || 0;

    // Temporal metrics from sessions & reviews
    let firstSeenTimestamp: number | null = null;
    let lastStudiedTimestamp: number | null = null;
    let lastReviewedTimestamp: number | null = null;

    if (topic.createdAt) {
      firstSeenTimestamp = new Date(topic.createdAt).getTime();
    }

    let totalStudyMinutes = 0;
    let sumRetentionRatings = 0;
    let validRetentionCount = 0;
    let latestRetentionRating: number | null = null;

    if (topicSessions.length > 0) {
      // Sort sessions chronologically
      const sortedSessions = [...topicSessions].sort(
        (a, b) => new Date(a.completedAt || a.createdAt).getTime() - new Date(b.completedAt || b.createdAt).getTime()
      );

      for (const s of sortedSessions) {
        totalStudyMinutes += s.durationMinutes || 0;
        if (s.retentionRating && s.retentionRating >= 1 && s.retentionRating <= 5) {
          sumRetentionRatings += s.retentionRating;
          validRetentionCount++;
          latestRetentionRating = s.retentionRating;
        }
        const sTime = new Date(s.completedAt || s.createdAt).getTime();
        if (firstSeenTimestamp === null || sTime < firstSeenTimestamp) {
          firstSeenTimestamp = sTime;
        }
        if (lastStudiedTimestamp === null || sTime > lastStudiedTimestamp) {
          lastStudiedTimestamp = sTime;
        }
      }
    }

    // Flashcard & Recall metrics
    let totalRecallAttempts = 0;
    let successfulRecallCount = 0;
    let failedRecallCount = 0;
    let sumEaseFactors = 0;
    let validEaseCount = 0;
    let dueFlashcardsCount = 0;

    const todayDateString = referenceDate.toISOString().slice(0, 10);

    for (const rev of topicReviews) {
      if (!rev.completed && rev.dueDate && rev.dueDate <= todayDateString) {
        dueFlashcardsCount++;
      }
    }

    for (const card of topicFlashcards) {
      if (card.lastReviewedAt) {
        const rTime = new Date(card.lastReviewedAt).getTime();
        if (lastReviewedTimestamp === null || rTime > lastReviewedTimestamp) {
          lastReviewedTimestamp = rTime;
        }
        if (lastStudiedTimestamp === null || rTime > lastStudiedTimestamp) {
          lastStudiedTimestamp = rTime;
        }
      }

      // Repetition count & recall estimations
      if (card.repetitionCount > 0) {
        totalRecallAttempts += card.repetitionCount;
        if (card.difficultyRating === 'good' || card.difficultyRating === 'easy') {
          successfulRecallCount += card.repetitionCount;
        } else {
          failedRecallCount += card.repetitionCount;
        }
      }

      if (card.easeFactor) {
        sumEaseFactors += Number(card.easeFactor);
        validEaseCount++;
      }

      if (card.nextReviewDate && card.nextReviewDate <= todayDateString) {
        dueFlashcardsCount++;
      }
    }

    // Days elapsed calculations
    const daysSinceLastStudied = lastStudiedTimestamp !== null
      ? Math.max(0, Math.floor((refTime - lastStudiedTimestamp) / MS_PER_DAY))
      : null;

    const daysSinceLastReviewed = lastReviewedTimestamp !== null
      ? Math.max(0, Math.floor((refTime - lastReviewedTimestamp) / MS_PER_DAY))
      : null;

    const averageRetentionRating = validRetentionCount > 0
      ? Number((sumRetentionRatings / validRetentionCount).toFixed(1))
      : null;

    const recallAccuracyRate = totalRecallAttempts > 0
      ? Number((successfulRecallCount / totalRecallAttempts).toFixed(2))
      : null;

    const averageEaseFactor = validEaseCount > 0
      ? Number((sumEaseFactors / validEaseCount).toFixed(2))
      : null;

    resultMap.set(topic.id, {
      topicId: topic.id,
      topicTitle: topic.title,
      subjectId: topic.subjectId,
      subjectName,
      subjectColor,
      manualStatus: topic.masteryLevel || 'unstudied',
      firstSeenAt: firstSeenTimestamp ? new Date(firstSeenTimestamp).toISOString() : null,
      lastStudiedAt: lastStudiedTimestamp ? new Date(lastStudiedTimestamp).toISOString() : null,
      daysSinceLastStudied,
      lastReviewedAt: lastReviewedTimestamp ? new Date(lastReviewedTimestamp).toISOString() : null,
      daysSinceLastReviewed,
      totalSessionsCount: topicSessions.length,
      totalStudyMinutes,
      averageRetentionRating,
      latestRetentionRating,
      flashcardsCount: topicFlashcards.length,
      totalRecallAttempts,
      successfulRecallCount,
      failedRecallCount,
      recallAccuracyRate,
      averageEaseFactor,
      dueFlashcardsCount,
      notesCount: topicNotes.length,
      resourcesCount: topicResources.length,
      unresolvedEventCount: unresolvedCount
    });
  }

  return resultMap;
}
