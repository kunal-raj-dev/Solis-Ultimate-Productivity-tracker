import { StudySubject, StudySession, StudyTopic } from '../../types/study';

export interface AdaptiveSubjectContext {
  id: string;
  name: string;
  completedHoursThisWeek: number;
  targetHoursPerWeek: number;
  status: string;
}

export interface AdaptiveSessionContext {
  subjectId: string;
  duration: number;
  completedAt: string;
}

export interface AdaptiveStudyContext {
  subjects: AdaptiveSubjectContext[];
  recentSessions: AdaptiveSessionContext[];
}

export interface SubjectGapAnalysis {
  subjectId: string;
  subjectName: string;
  targetHours: number;
  completedHours: number;
  deficitHours: number;
  completionRatio: number;
}

export interface StudyActionRecommendation {
  type: 'review_flashcards' | 'study_topic' | 'take_quiz' | 'review_note';
  title: string;
  reason: string;
  actionPayload: Record<string, any>;
}

/**
 * Builds lightweight serialized context for LLM or rule-based adaptive analysis.
 */
export function buildAdaptiveStudyContext(
  subjects: StudySubject[],
  sessions: StudySession[],
  recentLimit: number = 5
): AdaptiveStudyContext {
  return {
    subjects: (subjects || []).map((s) => ({
      id: s.id,
      name: s.name,
      completedHoursThisWeek: s.completedHoursThisWeek || 0,
      targetHoursPerWeek: s.targetHoursPerWeek || 0,
      status: s.status || 'active'
    })),
    recentSessions: (sessions || []).slice(0, recentLimit).map((s) => ({
      subjectId: s.subjectId,
      duration: s.durationMinutes || 0,
      completedAt: s.completedAt || ''
    }))
  };
}

/**
 * Identifies subjects with weekly hour deficits and ranks them by severity.
 */
export function detectSubjectGaps(subjects: StudySubject[]): SubjectGapAnalysis[] {
  if (!subjects || subjects.length === 0) return [];

  const analysis: SubjectGapAnalysis[] = subjects
    .filter((s) => s.status !== 'archived')
    .map((s) => {
      const target = s.targetHoursPerWeek || 0;
      const completed = s.completedHoursThisWeek || 0;
      const deficit = Math.max(0, target - completed);
      const ratio = target > 0 ? completed / target : 1;
      return {
        subjectId: s.id,
        subjectName: s.name,
        targetHours: target,
        completedHours: completed,
        deficitHours: Math.round(deficit * 10) / 10,
        completionRatio: Math.round(ratio * 100) / 100
      };
    });

  // Sort: largest deficit first, then lowest ratio
  return analysis.sort((a, b) => {
    if (b.deficitHours !== a.deficitHours) {
      return b.deficitHours - a.deficitHours;
    }
    return a.completionRatio - b.completionRatio;
  });
}

/**
 * Detects weak or unmastered topics from syllabus topics and past study session ratings.
 */
export function detectWeakTopics(
  topics: StudyTopic[],
  sessions: StudySession[] = []
): Array<{ topicId: string; title: string; subjectId: string; status: 'unstudied' | 'learning' | 'low_retention' }> {
  if (!topics || topics.length === 0) return [];

  // Index low-retention topics from recent sessions (rating 1 or 2)
  const lowRetentionNames = new Set(
    sessions
      .filter((s) => s.retentionRating && s.retentionRating <= 2)
      .flatMap((s) => s.topicsCovered || [])
      .map((t) => t.toLowerCase().trim())
  );

  const results: Array<{ topicId: string; title: string; subjectId: string; status: 'unstudied' | 'learning' | 'low_retention' }> = [];

  for (const topic of topics) {
    if (lowRetentionNames.has(topic.title.toLowerCase().trim())) {
      results.push({
        topicId: topic.id,
        title: topic.title,
        subjectId: topic.subjectId,
        status: 'low_retention'
      });
    } else if (topic.masteryLevel === 'unstudied') {
      results.push({
        topicId: topic.id,
        title: topic.title,
        subjectId: topic.subjectId,
        status: 'unstudied'
      });
    } else if (topic.masteryLevel === 'learning') {
      results.push({
        topicId: topic.id,
        title: topic.title,
        subjectId: topic.subjectId,
        status: 'learning'
      });
    }
  }

  // Prioritize low_retention first, then unstudied, then learning
  const priorityOrder = { low_retention: 0, unstudied: 1, learning: 2 };
  return results.sort((a, b) => priorityOrder[a.status] - priorityOrder[b.status]);
}

/**
 * Deterministically resolves navigation destination for an action recommendation.
 */
export function resolveStudySuggestionRoute(suggestion: { type: string; actionPayload?: any }): string {
  if (suggestion.type === 'review_flashcards') return '/app/study';
  if (suggestion.type === 'take_quiz') return '/app/study';
  if (suggestion.type === 'review_note') {
    return suggestion.actionPayload?.noteId
      ? `/app/notes?id=${encodeURIComponent(suggestion.actionPayload.noteId)}`
      : '/app/notes';
  }
  return '/app/focus';
}

/**
 * Deterministic fallback recommendation engine when AI is offline or disabled.
 * Produces exactly 3 high-yield, evidence-based study actions.
 */
export function generateDeterministicStudyRecommendations(options: {
  subjects: StudySubject[];
  recentSessions: StudySession[];
  topics?: StudyTopic[];
}): StudyActionRecommendation[] {
  const { subjects, recentSessions, topics = [] } = options;
  const recommendations: StudyActionRecommendation[] = [];

  const gaps = detectSubjectGaps(subjects);
  const weakTopics = detectWeakTopics(topics, recentSessions);

  // 1. Weak Topic or Retention Intervention
  if (weakTopics.length > 0) {
    const target = weakTopics[0];
    const reason = target.status === 'low_retention'
      ? `Recent recall rating dropped on "${target.title}". Active review recommended.`
      : `Topic "${target.title}" is currently ${target.status} in your syllabus.`;

    recommendations.push({
      type: 'study_topic',
      title: `Review Weak Concept: ${target.title}`,
      reason,
      actionPayload: { subjectId: target.subjectId, topicId: target.topicId }
    });
  } else {
    recommendations.push({
      type: 'review_flashcards',
      title: 'Spaced Repetition Review',
      reason: 'Reinforce retention curve across active syllabus flashcards.',
      actionPayload: { mode: 'all_due' }
    });
  }

  // 2. High-Deficit Subject Study Block
  if (gaps.length > 0 && gaps[0].deficitHours > 0) {
    const worst = gaps[0];
    recommendations.push({
      type: 'study_topic',
      title: `Catch Up on ${worst.subjectName}`,
      reason: `${worst.deficitHours}h remaining to hit your weekly target of ${worst.targetHours}h.`,
      actionPayload: { subjectId: worst.subjectId }
    });
  } else if (subjects.length > 0) {
    recommendations.push({
      type: 'study_topic',
      title: `Deep Study: ${subjects[0].name}`,
      reason: 'Continue building momentum in your primary active discipline.',
      actionPayload: { subjectId: subjects[0].id }
    });
  } else {
    recommendations.push({
      type: 'study_topic',
      title: 'Begin New Study Subject',
      reason: 'Establish your weekly learning horizon by adding a subject.',
      actionPayload: {}
    });
  }

  // 3. Formative Self-Quiz
  const quizSubject = gaps.length > 1 ? gaps[1] : gaps[0];
  if (quizSubject) {
    recommendations.push({
      type: 'take_quiz',
      title: `Self-Assessment: ${quizSubject.subjectName}`,
      reason: 'Evaluate comprehension with 4-question formative quiz.',
      actionPayload: { subjectId: quizSubject.subjectId }
    });
  } else {
    recommendations.push({
      type: 'take_quiz',
      title: 'Comprehensive Knowledge Check',
      reason: 'Test memory recall before weekend review cycle.',
      actionPayload: {}
    });
  }

  return recommendations.slice(0, 3);
}
