import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  AlertCircle,
  Clock,
  Compass,
  ArrowRight,
  ArrowLeft,
  Save
} from 'lucide-react';
import { SectionHeader } from '../../components/layout/SectionHeader/SectionHeader';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card/Card';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Input } from '../../components/ui/Input/Input';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useGuide } from '../../context/GuideContext';
import { Task } from '../../types/task';
import { StudySubject, StudySession } from '../../types/study';
import { Note } from '../../types/note';
import { Habit } from '../../types/habit';
import { FocusSession } from '../../types/focus';
import { generateSolisIntelligenceReport } from '../../utils/intelligence';
import './WeeklyReviewPage.css';

export const WeeklyReviewPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { openGuide } = useGuide();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);

  // Raw domain state
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);

  // Reflection inputs
  const [breakthroughs, setBreakthroughs] = useState('');
  const [frictionPoints, setFrictionPoints] = useState('');
  const [nextWeekCommitment, setNextWeekCommitment] = useState('');
  const [nextWeekTargetHours, setNextWeekTargetHours] = useState('20');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [
        sessRes,
        focusRes,
        taskRes,
        noteRes,
        subRes,
        habitRes
      ] = await Promise.allSettled([
        dataService.study.getRecentSessions(),
        dataService.focus.getRecentSessions(),
        dataService.tasks.getTasks(),
        dataService.notes.getNotes(),
        dataService.study.getSubjects(),
        dataService.habits.getHabits()
      ]);

      if (sessRes.status === 'fulfilled') setSessions(sessRes.value);
      if (focusRes.status === 'fulfilled') setFocusSessions(focusRes.value);
      if (taskRes.status === 'fulfilled') setTasks(taskRes.value);
      if (noteRes.status === 'fulfilled') setNotes(noteRes.value);
      if (subRes.status === 'fulfilled') setSubjects(subRes.value);
      if (habitRes.status === 'fulfilled') setHabits(habitRes.value);

    } catch (err) {
      console.error('Failed to load review data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = dataService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  // Derived intelligence (memoized to prevent rerender stutter)
  const intelReport = useMemo(() => {
    return generateSolisIntelligenceReport(
      {
        sessions,
        planItems: [],
        subjects,
        topics: [],
        focusSessions,
        tasks,
        habits
      },
      'this_week'
    );
  }, [sessions, subjects, focusSessions, tasks, habits]);

  const totalStudyMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const pendingTasks = tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress');

  const topRecommendation = intelReport.recommendations[0]?.title || 'Maintain balanced rhythm';

  const handleSaveToNotes = async () => {
    setIsSavingNote(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const markdownContent = `## Weekly Study & Productivity Review (${dateStr})

### 1. Accomplished Momentum
- **Total Study Hours Logged**: ${totalStudyHours} hrs
- **Focus Blocks Completed**: ${focusSessions.length}
- **Tasks Finished**: ${completedTasks.length}
- **Consistency**: ${intelReport.rhythm.consistencyPercentage.toFixed(0)}%

### 2. Intellectual Breakthroughs & Knowledge Synthesis
${breakthroughs.trim() || '_No specific breakthroughs noted._'}

### 3. Friction & Calibration
${frictionPoints.trim() || '_No major friction reported._'}

### 4. Attention & Cognitive Distribution
- **Planning Realism Ratio**: ${intelReport.execution.planningRealismRatio.toFixed(2)}x
- **Focus Block Completion Rate**: ${intelReport.attention.completionRate.toFixed(0)}%

### 5. Next Week's Primary Commitments
- **Target Study Hours**: ${nextWeekTargetHours} hrs
- **Primary Commitment**: ${nextWeekCommitment.trim() || user?.focusField || 'Continuous Mastery'}
`;

      await dataService.notes.createNote({
        title: `Weekly Review — ${dateStr}`,
        content: markdownContent,
        category: 'reflection',
        tags: ['weekly-review', 'reflection', 'momentum']
      });

      addToast({
        title: 'Weekly Review Synthesized',
        description: 'Saved as a permanent Knowledge Note in your studio.',
        type: 'success'
      });

      navigate('/app/notes');
    } catch (err) {
      console.error('Failed to save weekly review note:', err);
      addToast({
        title: 'Save Failed',
        description: 'Could not save review note. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="solis-review-page">
      <SectionHeader
        tag={<Badge variant="coral">Weekly Ritual</Badge>}
        title="Weekly Review & Strategic Calibration"
        subtitle="Step back, synthesize your momentum, calibrate attention, and set clear intentions for the upcoming week."
        guideId="weekly-review"
        onOpenGuide={openGuide}
      />

      {/* Step Indicators */}
      <div className="solis-review-steps">
        {[
          { num: 1, label: 'Momentum' },
          { num: 2, label: 'Knowledge' },
          { num: 3, label: 'Friction' },
          { num: 4, label: 'Attention' },
          { num: 5, label: 'Intentions' }
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            className={`solis-review-step-btn ${step === s.num ? 'solis-review-step-btn--active' : ''} ${step > s.num ? 'solis-review-step-btn--completed' : ''}`}
            onClick={() => setStep(s.num)}
          >
            <span className="solis-review-step-num">{s.num}</span>
            <span className="solis-review-step-label">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="solis-review-content">
        {/* Step 1: Momentum */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--color-coral-500)" />
                <CardTitle>Pillar 1: Momentum & Accomplished Hours</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="solis-review-grid">
                <div className="solis-review-stat-box">
                  <span className="solis-review-stat-num">{totalStudyHours} hrs</span>
                  <span className="solis-review-stat-lbl">Study Time Logged</span>
                </div>
                <div className="solis-review-stat-box">
                  <span className="solis-review-stat-num">{focusSessions.length}</span>
                  <span className="solis-review-stat-lbl">Focus Blocks</span>
                </div>
                <div className="solis-review-stat-box">
                  <span className="solis-review-stat-num">{completedTasks.length}</span>
                  <span className="solis-review-stat-lbl">Tasks Completed</span>
                </div>
                <div className="solis-review-stat-box">
                  <span className="solis-review-stat-num">{notes.length}</span>
                  <span className="solis-review-stat-lbl">Thoughts Synthesized</span>
                </div>
              </div>

              <div className="solis-review-intel-banner">
                <strong>Mastery Signal:</strong> {intelReport.rhythm.hasSufficientData ? 'Study momentum active and measured.' : 'Initial study calibration cycle in progress.'}
              </div>

              <div className="solis-review-actions">
                <Button type="button" variant="accent" size="md" rightIcon={<ArrowRight size={16} />} onClick={() => setStep(2)}>
                  Continue to Knowledge Synthesis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Knowledge Synthesis */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} color="var(--color-lavender-500)" />
                <CardTitle>Pillar 2: Knowledge Synthesis & Breakthroughs</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Reflect on your primary conceptual takeaways. What models, theorems, or skills clicked this week?
              </p>
              <Textarea
                label="Key Breakthroughs & Insights"
                placeholder="e.g. Mastered Raft consensus election timeouts and state machine safety..."
                value={breakthroughs}
                onChange={(e) => setBreakthroughs(e.target.value)}
                rows={5}
                autoFocus
              />

              <div className="solis-review-actions">
                <Button type="button" variant="outline" size="md" leftIcon={<ArrowLeft size={16} />} onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="button" variant="accent" size="md" rightIcon={<ArrowRight size={16} />} onClick={() => setStep(3)}>
                  Continue to Friction Calibration
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Friction Calibration */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} color="var(--color-amber-500)" />
                <CardTitle>Pillar 3: Friction, Postponements & Calibration</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Pending / Postponed Items ({pendingTasks.length})
                </span>
                <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 500 }}>
                  Planning Realism Ratio: <strong>{intelReport.execution.planningRealismRatio.toFixed(2)}x</strong>
                </span>
              </div>

              <Textarea
                label="What caused friction or delay this week?"
                placeholder="e.g. Underestimated difficulty of GPU compiler optimizations; need shorter daily milestones..."
                value={frictionPoints}
                onChange={(e) => setFrictionPoints(e.target.value)}
                rows={4}
                autoFocus
              />

              <div className="solis-review-actions">
                <Button type="button" variant="outline" size="md" leftIcon={<ArrowLeft size={16} />} onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="button" variant="accent" size="md" rightIcon={<ArrowRight size={16} />} onClick={() => setStep(4)}>
                  Continue to Attention Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Attention Analysis */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="var(--color-coral-500)" />
                <CardTitle>Pillar 4: Attention Calibration & Rhythm</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="solis-review-grid" style={{ marginBottom: '20px' }}>
                <div className="solis-review-stat-box">
                  <span className="solis-review-stat-num">{intelReport.attention.completionRate.toFixed(0)}%</span>
                  <span className="solis-review-stat-lbl">Focus Completion</span>
                </div>
                <div className="solis-review-stat-box">
                  <span className="solis-review-stat-num">{intelReport.attention.totalInterruptions}</span>
                  <span className="solis-review-stat-lbl">Interruptions</span>
                </div>
                <div className="solis-review-stat-box">
                  <span className="solis-review-stat-num">{intelReport.rhythm.consistencyPercentage.toFixed(0)}%</span>
                  <span className="solis-review-stat-lbl">Consistency</span>
                </div>
              </div>

              <div className="solis-review-intel-banner">
                <strong>Attention Recommendation:</strong> {topRecommendation}
              </div>

              <div className="solis-review-actions">
                <Button type="button" variant="outline" size="md" leftIcon={<ArrowLeft size={16} />} onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button type="button" variant="accent" size="md" rightIcon={<ArrowRight size={16} />} onClick={() => setStep(5)}>
                  Set Next Week&apos;s Intentions
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Next Week Intentions */}
        {step === 5 && (
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={18} color="var(--color-coral-500)" />
                <CardTitle>Pillar 5: Next Week&apos;s Intentions & Commitments</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Input
                  label="Target Study Hours Next Week"
                  type="number"
                  value={nextWeekTargetHours}
                  onChange={(e) => setNextWeekTargetHours(e.target.value)}
                  required
                />
                <Textarea
                  label="Primary Academic / Engineering Commitment"
                  placeholder="e.g. Finalize Raft state machine replication engine and deploy 3-node cluster..."
                  value={nextWeekCommitment}
                  onChange={(e) => setNextWeekCommitment(e.target.value)}
                  rows={4}
                  required
                  autoFocus
                />

                <div className="solis-review-actions">
                  <Button type="button" variant="outline" size="md" leftIcon={<ArrowLeft size={16} />} onClick={() => setStep(4)}>
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="accent"
                    size="lg"
                    leftIcon={isSavingNote ? undefined : <Save size={16} />}
                    onClick={handleSaveToNotes}
                    isLoading={isSavingNote}
                  >
                    Synthesize Review into Knowledge Note
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
