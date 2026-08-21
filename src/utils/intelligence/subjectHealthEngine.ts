/**
 * Solis Learning Intelligence — Subject Learning Health Aggregator
 * 
 * Aggregates topic-level signals into transparent subject-level distribution metrics
 * (e.g., "2 Strong, 3 Developing, 1 Needs Review, 1 Not assessed") without mysterious single percentages.
 */

import { ID } from '../../types/common';
import { StudySubject } from '../../types/study';
import {
  TopicLearningHistory,
  TopicMasteryEvaluation,
  TopicRetentionSignal,
  SubjectLearningHealth
} from '../../types/learningIntelligence';

export function computeSubjectLearningHealths(
  subjects: StudySubject[],
  topicHistories: Map<ID, TopicLearningHistory>,
  masteryEvaluations: Map<ID, TopicMasteryEvaluation>,
  retentionSignals: Map<ID, TopicRetentionSignal>
): Map<ID, SubjectLearningHealth> {
  const result = new Map<ID, SubjectLearningHealth>();

  for (const subject of subjects) {
    // Find all topics belonging to this subject
    const subjectTopicHistories: TopicLearningHistory[] = [];
    for (const history of topicHistories.values()) {
      if (history.subjectId === subject.id) {
        subjectTopicHistories.push(history);
      }
    }

    let strongCount = 0;
    let stableCount = 0;
    let developingCount = 0;
    let emergingCount = 0;
    let notAssessedCount = 0;

    let freshCount = 0;
    let dueForReviewCount = 0;
    let needsAttentionCount = 0;
    let overdueCount = 0;
    let unstudiedCount = 0;

    const topicsNeedingReview: SubjectLearningHealth['topTopicsNeedingReview'] = [];

    for (const h of subjectTopicHistories) {
      const mastery = masteryEvaluations.get(h.topicId);
      const retention = retentionSignals.get(h.topicId);

      // Mastery distribution
      switch (mastery?.state) {
        case 'STRONG':
          strongCount++;
          break;
        case 'STABLE':
          stableCount++;
          break;
        case 'DEVELOPING':
          developingCount++;
          break;
        case 'EMERGING':
          emergingCount++;
          break;
        default:
          notAssessedCount++;
          break;
      }

      // Retention distribution
      switch (retention?.signal) {
        case 'FRESH':
          freshCount++;
          break;
        case 'DUE_FOR_REVIEW':
          dueForReviewCount++;
          topicsNeedingReview.push({
            topicId: h.topicId,
            topicTitle: h.topicTitle,
            signal: 'DUE_FOR_REVIEW',
            daysElapsed: retention.daysElapsed
          });
          break;
        case 'NEEDS_ATTENTION':
          needsAttentionCount++;
          topicsNeedingReview.push({
            topicId: h.topicId,
            topicTitle: h.topicTitle,
            signal: 'NEEDS_ATTENTION',
            daysElapsed: retention.daysElapsed
          });
          break;
        case 'OVERDUE':
          overdueCount++;
          topicsNeedingReview.push({
            topicId: h.topicId,
            topicTitle: h.topicTitle,
            signal: 'OVERDUE',
            daysElapsed: retention.daysElapsed
          });
          break;
        default:
          unstudiedCount++;
          break;
      }
    }

    // Sort topics needing review by urgency (OVERDUE > NEEDS_ATTENTION > DUE_FOR_REVIEW)
    topicsNeedingReview.sort((a, b) => {
      const order = { OVERDUE: 3, NEEDS_ATTENTION: 2, DUE_FOR_REVIEW: 1, FRESH: 0, UNSTUDIED: 0 };
      return (order[b.signal] || 0) - (order[a.signal] || 0);
    });

    const totalTopicsCount = subjectTopicHistories.length;
    const topicsAssessedCount = totalTopicsCount - notAssessedCount;

    // Human-readable summary
    let overallStatusText = 'No topics assessed';
    if (totalTopicsCount === 0) {
      overallStatusText = 'No topics defined';
    } else if (topicsAssessedCount === 0) {
      overallStatusText = 'Syllabus unstudied';
    } else if (overdueCount > 0 || needsAttentionCount > 0) {
      const count = overdueCount + needsAttentionCount;
      overallStatusText = `${count} topic${count > 1 ? 's' : ''} need recall attention`;
    } else if (strongCount + stableCount >= topicsAssessedCount && topicsAssessedCount > 0) {
      overallStatusText = 'Rhythm & retention strong';
    } else {
      overallStatusText = 'Active curriculum learning';
    }

    result.set(subject.id, {
      subjectId: subject.id,
      subjectName: subject.name,
      subjectColor: subject.color,
      totalTopicsCount,
      topicsAssessedCount,
      strongCount,
      stableCount,
      developingCount,
      emergingCount,
      notAssessedCount,
      freshCount,
      dueForReviewCount,
      needsAttentionCount,
      overdueCount,
      unstudiedCount,
      topTopicsNeedingReview: topicsNeedingReview.slice(0, 3),
      overallStatusText
    });
  }

  return result;
}
