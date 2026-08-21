/**
 * Solis Intelligence Engine — Type Definitions
 * Strict contracts for deterministic, explainable study intelligence.
 */

import { ID } from '../../types/common';
import { StudySession, StudyPlanItem, StudySubject, StudyTopic } from '../../types/study';
import { FocusSession } from '../../types/focus';
import { Task } from '../../types/task';
import { Habit } from '../../types/habit';

export type TimeRangeScope = 'today' | 'this_week' | '28_days';

export interface DateWindow {
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string;   // ISO date string (YYYY-MM-DD)
  daysCount: number;
}

// ----------------------------------------------------------------------------
// 1. COGNITIVE RHYTHM TYPES
// ----------------------------------------------------------------------------
export type TimeOfDayBucket = 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimeOfDayDistribution {
  bucket: TimeOfDayBucket;
  label: string;
  hours: number;
  percentage: number;
  sessionCount: number;
}

export interface DayOfWeekDistribution {
  dayIndex: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dayName: string;  // Mon, Tue, etc.
  minutes: number;
  hours: number;
  percentage: number;
  sessionCount: number;
}

export interface SubjectEffortShare {
  subjectId: ID;
  subjectName: string;
  color: string;
  actualMinutes: number;
  actualHours: number;
  plannedMinutes: number;
  plannedHours: number;
  actualSharePercentage: number;
  plannedSharePercentage: number;
  sessionCount: number;
}

export interface CognitiveRhythmInsight {
  totalStudyMinutes: number;
  totalStudyHours: number;
  totalFocusMinutes: number;
  totalFocusHours: number;
  activeStudyDaysCount: number;
  consistencyPercentage: number; // active days / total days in window * 100
  averageSessionDurationMinutes: number;
  timeOfDay: TimeOfDayDistribution[];
  dominantTimeOfDay: TimeOfDayBucket | null;
  dayOfWeek: DayOfWeekDistribution[];
  subjectEfforts: SubjectEffortShare[];
  hasSufficientData: boolean;
}

// ----------------------------------------------------------------------------
// 2. EXECUTION INTELLIGENCE & PLANNING REALISM
// ----------------------------------------------------------------------------
export interface PostponementAlert {
  planItemId: ID;
  title: string;
  subjectId: ID;
  subjectName: string;
  uncompletedCount: number;
  scheduledDates: string[];
}

export interface ExecutionIntelligenceInsight {
  planAdherenceRate: number;        // (actual minutes / planned minutes) * 100
  sessionCompletionRate: number;    // (completed sessions / total initiated) * 100
  taskExecutionRate: number;        // (completed tasks / due tasks) * 100
  plannedStudyMinutes: number;
  actualStudyMinutes: number;
  planningRealismRatio: number;     // actual / planned
  planningRealismVerdict: 'under_planning' | 'calibrated' | 'over_planning' | 'no_plan';
  postponementPatterns: PostponementAlert[];
  hasSufficientData: boolean;
}

// ----------------------------------------------------------------------------
// 3. MASTERY INTELLIGENCE TYPES
// ----------------------------------------------------------------------------
export interface TopicMasterySignal {
  topicId: ID;
  topicTitle: string;
  subjectId: ID;
  subjectName: string;
  subjectColor: string;
  state: 'unstudied' | 'learning' | 'mastered';
  studyCount: number;
  totalMinutesInvested: number;
  averageRetentionRating: number; // 1.0 to 5.0
  daysSinceLastReview: number | null;
  lastStudiedAt: string | null;
  
  // Mathematical components
  stateScore: number;       // 0 - 100 (30% weight)
  repetitionScore: number;  // 0 - 100 (25% weight)
  retentionScore: number;   // 0 - 100 (25% weight)
  recencyScore: number;     // 0 - 100 (20% weight)
  compositeMasterySignal: number; // 0 - 100%
  
  isReviewRecommended: boolean;
  reviewReason?: string;
}

export interface MasteryIntelligenceInsight {
  topics: TopicMasterySignal[];
  masteredCount: number;
  learningCount: number;
  unstudiedCount: number;
  averageMasteryScore: number;
  reviewQueue: TopicMasterySignal[];
  hasSufficientData: boolean;
}

// ----------------------------------------------------------------------------
// 4. ATTENTION INTELLIGENCE TYPES
// ----------------------------------------------------------------------------
export interface NeglectAlert {
  subjectId: ID;
  subjectName: string;
  color: string;
  plannedShare: number;
  actualShare: number;
  divergence: number;
  daysSinceLastStudied: number | null;
  reason: string;
}

export interface AttentionIntelligenceInsight {
  totalFocusSessions: number;
  completedFocusSessions: number;
  completionRate: number;
  averageFocusDurationMinutes: number;
  totalInterruptions: number;
  interruptionsPerHour: number;
  neglectAlerts: NeglectAlert[];
  hasSufficientData: boolean;
}

// ----------------------------------------------------------------------------
// 5. RECOMMENDATION TYPES (Signal → Evidence → Action)
// ----------------------------------------------------------------------------
export type RecommendationType =
  | 'spaced_review'
  | 'spaced_retrieval'
  | 'retention_intervention'
  | 'subject_rebalance'
  | 'neglect_rebalance'
  | 'plan_calibration'
  | 'continuity_resume'
  | 'syllabus_continuation'
  | 'concept_synthesis'
  | 'routine_continuation';

export interface StudyRecommendation {
  id: string;
  type: RecommendationType;
  priority: 'primary' | 'secondary' | 'routine';
  weight: number; // For deterministic ranking
  title: string;
  signal: string;   // What pattern was detected
  evidence: string; // The exact data backing it
  action: string;   // What the user should do
  whyExplanation?: string;
  actionLabel?: string;
  actionPayload?: {
    type: 'start_focus' | 'open_study_plan' | 'open_topic_notes' | 'adjust_plan' | 'drill_flashcards' | 'create_task';
    subjectId?: ID;
    subjectName?: string;
    topicId?: ID;
    topicTitle?: string;
    suggestedDurationMinutes?: number;
    durationMinutes?: number;
    targetRoute?: string;
  };
}

export interface SolisIntelligenceReport {
  scope: TimeRangeScope;
  window: DateWindow;
  rhythm: CognitiveRhythmInsight;
  execution: ExecutionIntelligenceInsight;
  mastery: MasteryIntelligenceInsight;
  attention: AttentionIntelligenceInsight;
  recommendations: StudyRecommendation[];
  hasOverallSufficientData: boolean;
}

// Raw source context passed into intelligence calculation
export interface IntelligenceSourceData {
  sessions: StudySession[];
  planItems: StudyPlanItem[];
  subjects: StudySubject[];
  topics: StudyTopic[];
  focusSessions: FocusSession[];
  tasks: Task[];
  habits: Habit[];
  currentDate?: Date;
}
