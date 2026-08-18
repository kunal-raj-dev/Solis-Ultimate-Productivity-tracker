import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  BookOpen,
  ArrowRight,
  Flame
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { SegmentedControl } from '../../components/ui/SegmentedControl/SegmentedControl';
import { CognitiveLoadAlert } from '../../components/features/Analytics/CognitiveLoadAlert';
import { ExamReadinessCard } from '../../components/features/Analytics/ExamReadinessCard';
import { RetentionForecastGraph } from '../../components/features/Analytics/RetentionForecastGraph';
import { dataService } from '../../services/dataService';
import { StudySession, StudyPlanItem, StudySubject, StudyTopic } from '../../types/study';
import { FocusSession } from '../../types/focus';
import { Task } from '../../types/task';
import { Habit } from '../../types/habit';
import { Goal } from '../../types/goal';
import { Flashcard } from '../../types/learning';
import { DailyReflection } from '../../types/reflection';
import {
  generateSolisIntelligenceReport,
  TimeRangeScope,
  SolisIntelligenceReport
} from '../../utils/intelligence';
import {
  evaluateCognitiveLoad,
  calculateExamReadiness,
  calculateTopicRetentionForecast
} from '../../utils/intelligence/masteryIntelligence';
import { queryCache } from '../../services/cache';
import './AnalyticsPage.css';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [scope, setScope] = useState<TimeRangeScope>('this_week');

  const cachedSubjects = queryCache.get<StudySubject[]>('subjects:false');
  const cachedSessions = queryCache.get<StudySession[]>('study_sessions_recent');
  const cachedPlan = queryCache.get<StudyPlanItem[]>('study_plan_today');
  const cachedFocus = queryCache.get<FocusSession[]>('focus_sessions_recent');
  const cachedTasks = queryCache.get<Task[]>('tasks:{}');
  const cachedHabits = queryCache.get<Habit[]>('habits_all');

  const [isLoading, setIsLoading] = useState(() => !cachedSubjects && !cachedSessions);

  // Raw domain source state
  const [sessions, setSessions] = useState<StudySession[]>(() => cachedSessions || []);
  const [planItems, setPlanItems] = useState<StudyPlanItem[]>(() => cachedPlan || []);
  const [subjects, setSubjects] = useState<StudySubject[]>(() => cachedSubjects || []);
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => cachedFocus || []);
  const [tasks, setTasks] = useState<Task[]>(() => cachedTasks || []);
  const [habits, setHabits] = useState<Habit[]>(() => cachedHabits || []);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [reflections, setReflections] = useState<DailyReflection[]>([]);

  const loadAllAnalyticsData = useCallback(async () => {
    try {
      const [
        loadedSubjects,
        loadedSessions,
        loadedPlan,
        loadedFocus,
        loadedTasks,
        loadedHabits,
        loadedGoals,
        loadedCards,
        loadedReflections
      ] = await Promise.all([
        dataService.study.getSubjects(),
        dataService.study.getRecentSessions(),
        dataService.study.getTodayPlan(),
        dataService.focus.getRecentSessions(),
        dataService.tasks.getTasks(),
        dataService.habits.getHabits(),
        dataService.goals ? dataService.goals.getGoals() : Promise.resolve([]),
        dataService.flashcards ? dataService.flashcards.getFlashcards() : Promise.resolve([]),
        dataService.reflections ? dataService.reflections.getReflections(10) : Promise.resolve([])
      ]);

      setSubjects(loadedSubjects);
      setSessions(loadedSessions);
      setPlanItems(loadedPlan);
      setFocusSessions(loadedFocus);
      setTasks(loadedTasks);
      setHabits(loadedHabits);
      setGoals(loadedGoals);
      setFlashcards(loadedCards);
      setReflections(loadedReflections);

      // Load topics for all subjects
      const allTopicPromises = loadedSubjects.map((s: StudySubject) => dataService.study.getTopics(s.id));
      const topicArrays = await Promise.all(allTopicPromises);
      setTopics(topicArrays.flat());
    } catch (err) {
      console.error('Failed to load intelligence data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllAnalyticsData();
  }, [loadAllAnalyticsData]);

  // Derived Pure Intelligence Report
  const report: SolisIntelligenceReport = useMemo(() => {
    return generateSolisIntelligenceReport(
      {
        sessions,
        planItems,
        subjects,
        topics,
        focusSessions,
        tasks,
        habits
      },
      scope
    );
  }, [sessions, planItems, subjects, topics, focusSessions, tasks, habits, scope]);

  // Mastery Intelligence 2.0 Calculations
  const cognitiveReport = useMemo(() => {
    return evaluateCognitiveLoad({
      focusSessions,
      studySessions: sessions,
      reflections,
      topics
    });
  }, [focusSessions, sessions, reflections, topics]);

  const examReadinessList = useMemo(() => {
    return goals
      .filter((g) => g.experienceType === 'exam' || g.category === 'academic')
      .map((g) => ({
        goal: g,
        readiness: calculateExamReadiness({
          goal: g,
          topics,
          flashcards,
          habits
        })
      }));
  }, [goals, topics, flashcards, habits]);

  const retentionForecasts = useMemo(() => {
    return topics.slice(0, 4).map((top) => ({
      topic: top,
      forecast: calculateTopicRetentionForecast(top, flashcards)
    }));
  }, [topics, flashcards]);

  const handleActionClick = (actionPayload?: {
    type: string;
    subjectId?: string;
    subjectName?: string;
    topicId?: string;
    topicTitle?: string;
    suggestedDurationMinutes?: number;
  }) => {
    if (!actionPayload) return;
    if (actionPayload.type === 'start_focus') {
      navigate('/app/focus', {
        state: {
          subjectId: actionPayload.subjectId,
          subjectName: actionPayload.subjectName,
          topic: actionPayload.topicTitle,
          durationMinutes: actionPayload.suggestedDurationMinutes || 30
        }
      });
    } else if (actionPayload.type === 'open_study_plan') {
      navigate('/app/study');
    }
  };

  const getHeatmapColor = (minutes: number) => {
    if (minutes >= 120) return 'var(--color-coral-500)';
    if (minutes >= 60) return 'var(--color-coral-400)';
    if (minutes >= 30) return 'var(--color-amber-400)';
    if (minutes > 0) return 'var(--color-ivory-300)';
    return 'var(--bg-surface-secondary)';
  };

  return (
    <div className="solis-analytics-view">
      {/* 01 // EDITORIAL HEADER & TIME SCOPE SELECTOR */}
      <header className="solis-analytics-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Badge variant="coral">Mastery Intelligence & Cognitive Analytics</Badge>
            <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
              Deterministic & Traceable
            </span>
          </div>
          <h1 className="solis-analytics-title">
            Where your intellectual effort concentrated.
          </h1>
          <p className="solis-analytics-subtitle">
            Understand your deep flow cycles, planning realism, topic mastery signals, and spaced review queues.
          </p>
        </div>

        <div>
          <SegmentedControl
            options={[
              { value: 'today', label: 'Today' },
              { value: 'this_week', label: 'This Week' },
              { value: '28_days', label: '28 Days' }
            ]}
            value={scope}
            onChange={(val) => setScope(val as TimeRangeScope)}
            variant="contained"
          />
        </div>
      </header>

      {/* 01.5 // COGNITIVE LOAD & BURNOUT RESILIENCE BANNER */}
      {!isLoading && (
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <CognitiveLoadAlert report={cognitiveReport} />
        </div>
      )}

      {/* 02 // OVERVIEW METRIC TILES */}
      {isLoading ? (
        <div className="solis-analytics-metrics-grid">
          <Skeleton height="140px" />
          <Skeleton height="140px" />
          <Skeleton height="140px" />
          <Skeleton height="140px" />
        </div>
      ) : (
        <div className="solis-analytics-metrics-grid">
          {/* Study Volume */}
          <div className="solis-metric-card">
            <div className="solis-metric-card__header">
              <span>Study Volume</span>
              <BookOpen size={16} color="var(--color-coral-500)" />
            </div>
            <div className="solis-metric-card__value-row">
              <span className="solis-metric-card__value">{report.rhythm.totalStudyHours}</span>
              <span className="solis-metric-card__unit">hours</span>
            </div>
            <div className="solis-metric-card__subtext">
              {report.rhythm.totalStudyMinutes} total minutes across {report.rhythm.activeStudyDaysCount} active days.
            </div>
          </div>

          {/* Planning Realism & Adherence */}
          <div className="solis-metric-card">
            <div className="solis-metric-card__header">
              <span>Plan Adherence</span>
              <Target size={16} color="var(--color-amber-500)" />
            </div>
            <div className="solis-metric-card__value-row">
              <span className="solis-metric-card__value">{report.execution.planAdherenceRate}%</span>
            </div>
            <div className="solis-metric-card__subtext">
              {report.execution.planningRealismVerdict === 'calibrated'
                ? 'Healthy calibration between planned and actual study time.'
                : report.execution.planningRealismVerdict === 'over_planning'
                ? 'Planned volume exceeds execution. Consider smaller daily blocks.'
                : report.execution.planningRealismVerdict === 'under_planning'
                ? 'Executed more than planned.'
                : 'No scheduled plan items in this window.'}
            </div>
          </div>

          {/* Deep Focus Velocity */}
          <div className="solis-metric-card">
            <div className="solis-metric-card__header">
              <span>Focus Depth</span>
              <Flame size={16} color="var(--color-coral-500)" />
            </div>
            <div className="solis-metric-card__value-row">
              <span className="solis-metric-card__value">{report.attention.completedFocusSessions}</span>
              <span className="solis-metric-card__unit">sessions</span>
            </div>
            <div className="solis-metric-card__subtext">
              {report.attention.averageFocusDurationMinutes}m average duration • {report.attention.completionRate}% completion rate.
            </div>
          </div>

          {/* Average Topic Mastery Signal */}
          <div className="solis-metric-card">
            <div className="solis-metric-card__header">
              <span>Mastery Progression</span>
              <Sparkles size={16} color="var(--color-lavender-500)" />
            </div>
            <div className="solis-metric-card__value-row">
              <span className="solis-metric-card__value">{report.mastery.averageMasteryScore}%</span>
            </div>
            <div className="solis-metric-card__subtext">
              {report.mastery.masteredCount} Mastered • {report.mastery.learningCount} Learning • {report.mastery.unstudiedCount} Unstudied topics.
            </div>
          </div>
        </div>
      )}

      {/* 03 // ACTIONABLE RECOMMENDATIONS LAYER */}
      <section className="solis-recommendations-layer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-2)', fontWeight: 400, color: 'var(--text-primary)', margin: 0 }}>
              Actionable Intelligence
            </h2>
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Evidence-based recommendations derived deterministically from your study logs.
            </p>
          </div>
        </div>

        <div className="solis-recommendations-grid">
          {report.recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`solis-recommendation-card solis-recommendation-card--${rec.priority}`}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Badge variant={rec.type === 'spaced_review' ? 'amber' : rec.type === 'neglect_rebalance' ? 'coral' : 'neutral'}>
                    {rec.type === 'spaced_review'
                      ? 'Spaced Review'
                      : rec.type === 'neglect_rebalance'
                      ? 'Neglect Rebalance'
                      : rec.type === 'plan_calibration'
                      ? 'Plan Calibration'
                      : 'Continuity Step'}
                  </Badge>
                  {rec.priority === 'primary' && (
                    <span style={{ fontSize: 'var(--text-micro)', fontWeight: 700, color: 'var(--color-coral-500)', textTransform: 'uppercase' }}>
                      Primary Focus
                    </span>
                  )}
                </div>

                <h3 className="solis-recommendation-card__title">{rec.title}</h3>

                <div className="solis-recommendation-step">
                  <span className="solis-recommendation-step__label">Signal</span>
                  <span className="solis-recommendation-step__text">{rec.signal}</span>
                </div>

                <div className="solis-recommendation-step">
                  <span className="solis-recommendation-step__label">Evidence</span>
                  <span className="solis-recommendation-step__evidence">{rec.evidence}</span>
                </div>
              </div>

              <div>
                <Button
                  variant={rec.priority === 'primary' ? 'primary' : 'secondary'}
                  size="md"
                  isFullWidth
                  rightIcon={<ArrowRight size={14} />}
                  onClick={() => handleActionClick(rec.actionPayload)}
                >
                  {rec.action}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 04 // COGNITIVE RHYTHM & CONCENTRATION */}
      <section className="solis-rhythm-section">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Calendar size={18} color="var(--color-coral-500)" />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-2)', fontWeight: 400, color: 'var(--text-primary)', margin: 0 }}>
              Cognitive Rhythm & 28-Day Constellation
            </h2>
          </div>
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', margin: 0 }}>
            Visual intensity of completed study minutes over the last 28 days.
          </p>
        </div>

        {/* Heatmap Grid */}
        <div>
          <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Intensity Matrix (Recent 28 Days)
          </div>
          <div className="solis-heatmap-grid">
            {Array.from({ length: 28 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (27 - i));
              const dateStr = d.toISOString().split('T')[0];
              const dayMins = sessions
                .filter((s) => (s.completedAt || s.createdAt).startsWith(dateStr))
                .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

              return (
                <div
                  key={dateStr}
                  className="solis-heatmap-cell"
                  style={{ backgroundColor: getHeatmapColor(dayMins) }}
                  title={`${dateStr}: ${dayMins} mins studied`}
                />
              );
            })}
          </div>
        </div>

        {/* Breakdown Row: Time of Day & Day of Week */}
        <div className="solis-rhythm-breakdown-row">
          {/* Time of Day */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-3)', fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 12px' }}>
              Time-of-Day Concentration
            </h3>
            {report.rhythm.timeOfDay.map((bucket) => (
              <div key={bucket.bucket} className="solis-time-bucket-item">
                <div className="solis-time-bucket-header">
                  <span>{bucket.label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {bucket.hours}h ({bucket.percentage}%)
                  </span>
                </div>
                <div className="solis-progress-track">
                  <div
                    className="solis-progress-fill"
                    style={{
                      width: `${bucket.percentage}%`,
                      backgroundColor: bucket.bucket === report.rhythm.dominantTimeOfDay ? 'var(--color-coral-500)' : 'var(--color-amber-400)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Day of Week */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-3)', fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 12px' }}>
              Weekly Velocity by Day
            </h3>
            {report.rhythm.dayOfWeek.map((day) => (
              <div key={day.dayName} className="solis-time-bucket-item">
                <div className="solis-time-bucket-header">
                  <span>{day.dayName}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {day.hours}h ({day.percentage}%)
                  </span>
                </div>
                <div className="solis-progress-track">
                  <div
                    className="solis-progress-fill"
                    style={{ width: `${day.percentage}%`, backgroundColor: 'var(--color-lavender-500)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 05 // EFFORT DISTRIBUTION & NEGLECT DETECTION */}
      <section className="solis-effort-section">
        {/* Subject Share Comparison */}
        <div className="solis-effort-card">
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-3)', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
              Discipline Effort Share
            </h3>
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Actual study volume vs planned syllabus targets.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {report.rhythm.subjectEfforts.map((subj) => (
              <div key={subj.subjectId} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-body-sm)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{subj.subjectName}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {subj.actualHours}h actual ({subj.actualSharePercentage}%) • {subj.plannedHours}h planned
                  </span>
                </div>
                <div className="solis-progress-track">
                  <div
                    className="solis-progress-fill"
                    style={{
                      width: `${subj.actualSharePercentage}%`,
                      backgroundColor: `var(--subject-${subj.color}-accent, var(--color-coral-500))`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Neglect Alerts & Interventions */}
        <div className="solis-effort-card">
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-3)', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
              Balance & Neglect Monitoring
            </h3>
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Identifies subjects with significant divergence from intended trajectory.
            </p>
          </div>

          {report.attention.neglectAlerts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {report.attention.neglectAlerts.map((alert) => (
                <div key={alert.subjectId} className="solis-neglect-alert-banner">
                  <AlertTriangle size={18} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: 'var(--text-caption)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {alert.subjectName} Under-Served
                    </div>
                    <div>{alert.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--text-body-sm)', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-lg)' }}>
              <CheckCircle2 size={24} color="var(--color-sage-500)" style={{ margin: '0 auto 8px' }} />
              <div>All active subjects are on healthy study trajectories.</div>
            </div>
          )}
        </div>
      </section>

      {/* 06 // MASTERY INTELLIGENCE & REVIEW QUEUE */}
      <section className="solis-mastery-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Sparkles size={18} color="var(--color-lavender-500)" />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-2)', fontWeight: 400, color: 'var(--text-primary)', margin: 0 }}>
                Solis Study Mastery Signals
              </h2>
            </div>
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', margin: 0 }}>
              Multi-factor calculation: 30% Topic State + 25% Repetition + 25% Retention Rating + 20% Recency Memory Decay.
            </p>
          </div>
        </div>

        {/* Topics Mastery Table */}
        <div className="solis-mastery-topics-table">
          {report.mastery.topics.length > 0 ? (
            report.mastery.topics.map((topic) => (
              <div key={topic.topicId} className="solis-mastery-topic-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Badge variant={topic.subjectColor as any}>
                    {topic.subjectName}
                  </Badge>
                  <div>
                    <div style={{ fontFamily: 'var(--font-interface)', fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-body-sm)' }}>
                      {topic.topicTitle}
                    </div>
                    <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Studied {topic.studyCount} times • Avg retention {topic.averageRetentionRating}/5 • {topic.daysSinceLastReview !== null ? `Reviewed ${topic.daysSinceLastReview}d ago` : 'Never studied'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {topic.isReviewRecommended && (
                    <Badge variant="amber">
                      Review Needed
                    </Badge>
                  )}

                  <div className="solis-mastery-score-badge">
                    <span>Mastery</span>
                    <span style={{ color: topic.compositeMasterySignal >= 75 ? 'var(--color-sage-600)' : topic.compositeMasterySignal >= 40 ? 'var(--color-amber-600)' : 'var(--text-muted)' }}>
                      {topic.compositeMasterySignal}%
                    </span>
                  </div>

                  <Button
                    variant="subtle"
                    size="sm"
                    rightIcon={<ArrowRight size={12} />}
                    onClick={() => handleActionClick({
                      type: 'start_focus',
                      subjectId: topic.subjectId,
                      subjectName: topic.subjectName,
                      topicTitle: topic.topicTitle,
                      suggestedDurationMinutes: 30
                    })}
                  >
                    Focus
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--text-body-sm)' }}>
              No syllabus topics added yet. Add topics in Study Studio to activate mastery tracking.
            </div>
          )}
        </div>
      </section>

      {/* 07 // EXAM READINESS COMMAND SANCTUARY */}
      {examReadinessList.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Target size={18} color="var(--color-coral-500)" />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-2)', fontWeight: 400, color: 'var(--text-primary)', margin: 0 }}>
                Exam & Academic Readiness
              </h2>
            </div>
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', margin: 0 }}>
              Deterministic Readiness Index combining Syllabus Coverage (35%), SM-2 Recall (30%), Consistency Habits (20%), and Milestones (15%).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-md)' }}>
            {examReadinessList.map((item) => (
              <ExamReadinessCard key={item.goal.id} result={item.readiness} goalTitle={item.goal.title} />
            ))}
          </div>
        </section>
      )}

      {/* 08 // EBBINGHAUS FORGETTING CURVE FORECASTING */}
      {retentionForecasts.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Sparkles size={18} color="var(--color-amber-500)" />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-2)', fontWeight: 400, color: 'var(--text-primary)', margin: 0 }}>
                Ebbinghaus Retention Decay Projections
              </h2>
            </div>
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', margin: 0 }}>
              Exponential forgetting curve mathematical model R(t) = exp(-t / S). Anticipate memory decay before retrieval failure occurs.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
            {retentionForecasts.map((rf) => (
              <RetentionForecastGraph key={rf.topic.id} topicTitle={rf.topic.title} forecast={rf.forecast} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
