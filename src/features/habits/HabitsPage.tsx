import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Flame,
  Trash2,
  Edit2,
  Sparkles,
  Minus,
  Check,
  Shield,
  Target
} from 'lucide-react';
import { SectionHeader } from '../../components/layout/SectionHeader/SectionHeader';
import { Button } from '../../components/ui/Button/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge/Badge';
import { Card } from '../../components/ui/Card/Card';
import { Input } from '../../components/ui/Input/Input';
import { CustomSelect } from '../../components/ui/Select/CustomSelect';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Modal } from '../../components/feedback/Modal/Modal';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { EmptyState } from '../../components/feedback/EmptyState/EmptyState';
import { useToast } from '../../context/ToastContext';
import { useGuide } from '../../context/GuideContext';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { dataService } from '../../services/dataService';
import { Habit, HabitFrequency, HabitKind } from '../../types/habit';
import { Goal } from '../../types/goal';
import { getPastNDaysISO, isToday } from '../../utils/date';
import { ValidationError } from '../../utils/validation';
import { hapticsEngine } from '../../utils/focus/hapticsEngine';
import {
  evaluateHabitTier,
  getTierMeta,
  getTierProgressInfo
} from '../../utils/habits/tieredHabits';
import './HabitsPage.css';

export const HabitsPage: React.FC = () => {
  const { addToast } = useToast();
  const { openGuide } = useGuide();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [initialLoadStatus, setInitialLoadStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [isRetrying, setIsRetrying] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);

  // Form State
  const [habitTitle, setHabitTitle] = useState('');
  const [habitDesc, setHabitDesc] = useState('');
  const [habitGoalId, setHabitGoalId] = useState('');
  const [habitCat, setHabitCat] = useState<'study' | 'wellness' | 'mindset' | 'routine'>('study');
  const [habitFreq, setHabitFreq] = useState<HabitFrequency>('daily');
  const [habitColor, setHabitColor] = useState('coral');
  const [habitKind, setHabitKind] = useState<HabitKind>('boolean');
  const [habitUnit, setHabitUnit] = useState('');
  const [habitTargetValue, setHabitTargetValue] = useState('20');
  const [habitBaseTierValue, setHabitBaseTierValue] = useState('');
  const [habitStretchTierValue, setHabitStretchTierValue] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Quick Capture State
  const [quickTitle, setQuickTitle] = useState('');
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);

  // Plan §7.1: on viewports < 768px the 14-day matrix collapses into a
  // 7-day rolling window (M T W T F S S) so every column fits a 375px screen.
  const isMobileViewport = useIsMobile();

  const matrixDays = getPastNDaysISO(isMobileViewport ? 7 : 14);

  // Plan §3.5: top summary pill — calm daily progress, never guilt.
  const ritualsCompletedToday = habits.filter((h) => h.completedToday).length;

  /**
   * Plan §3.5 "Rhythm Story": completions this month framed as a positive
   * rhythm title. Deterministic and encouragement-only — no tier shames a
   * low count.
   */
  const getRhythmStory = useCallback((habit: Habit): { completions: number; title: string } => {
    const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const completions = Object.entries(habit.history || {}).filter(
      ([date, completed]) => completed === true && date.startsWith(monthKey)
    ).length;
    const title =
      completions >= 12
        ? 'Consistent Scholar'
        : completions >= 6
        ? 'Steady Rhythm'
        : completions >= 2
        ? 'Building Momentum'
        : completions >= 1
        ? 'Gentle Return'
        : 'Ready When You Are';
    return { completions, title };
  }, []);

  const loadHabits = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoadStatus('loading');
    else setSyncStatus('syncing');

    try {
      const [habitsRes, goalsRes] = await Promise.allSettled([
        dataService.habits.getHabits(),
        dataService.goals.getGoals()
      ]);

      if (habitsRes.status === 'fulfilled') {
        setHabits(habitsRes.value);
        setInitialLoadStatus('success');
        setSyncStatus('idle');
      } else {
        console.error('Primary habits fetch failed:', habitsRes.reason);
        throw habitsRes.reason;
      }

      if (goalsRes.status === 'fulfilled') {
        setGoals(goalsRes.value);
      }
    } catch (err) {
      console.error('Failed to load habits:', err);
      setHabits((current) => {
        if (current.length === 0) setInitialLoadStatus('error');
        else setSyncStatus('error');
        return current;
      });
    }
  }, []);

  useEffect(() => {
    loadHabits(true);
    // Plan §6.1 scoped entity pub/sub: this page renders habits only, so it
    // subscribes strictly to the 'habits' channel instead of every mutation.
    const unsubscribe = dataService.subscribe(() => {
      loadHabits(false);
    }, ['habits']);
    return () => unsubscribe();
  }, [loadHabits]);

  const handleRetry = async () => {
    setIsRetrying(true);
    await loadHabits(habits.length === 0);
    setIsRetrying(false);
  };

  const handleToggleDay = async (habitId: string, dateStr: string) => {
    const prevHabits = habits;
    try {
      const updated = await dataService.habits.toggleHabitDate(habitId, dateStr);
      setHabits((prev) => prev.map((h) => (h.id === habitId ? updated : h)));

      // Plan §3.5: haptic fires only AFTER a confirmed successful toggle —
      // never before the request, avoiding false sensory feedback.
      hapticsEngine.playMechanicalTick();

      if (isToday(dateStr)) {
        addToast({
          title: updated.completedToday ? 'Ritual Checked In' : 'Ritual Reset',
          description: `${updated.title} • Current streak: ${updated.currentStreak} days`,
          type: 'info'
        });
      }
    } catch {
      setHabits(prevHabits);
      addToast({ title: 'Could not update habit record', type: 'error' });
    }
  };

  const handleLogProgress = async (habitId: string, value: number, dateStr?: string) => {
    const prevHabits = habits;
    try {
      const updated = await dataService.habits.logHabitProgress(habitId, value, dateStr);
      setHabits((prev) => prev.map((h) => (h.id === habitId ? updated : h)));

      hapticsEngine.playMechanicalTick();

      const tier = evaluateHabitTier(value, updated);
      const meta = getTierMeta(tier);
      addToast({
        title: meta.label,
        description: `${updated.title} • ${value} ${updated.unit || 'units'} logged. ${meta.description}`,
        type: tier ? 'success' : 'info'
      });
    } catch {
      setHabits(prevHabits);
      addToast({ title: 'Could not log habit progress', type: 'error' });
    }
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) return;
    setIsQuickSubmitting(true);
    try {
      const created = await dataService.habits.createHabit({
        title: trimmed,
        category: 'study',
        frequency: 'daily',
        color: 'coral',
        kind: 'boolean'
      });
      setHabits((prev) => [...prev, created]);
      setQuickTitle('');
      addToast({ title: 'Ritual Captured', description: created.title, type: 'success' });
    } catch {
      addToast({ title: 'Could not capture ritual', type: 'error' });
    } finally {
      setIsQuickSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setHabitTitle('');
    setHabitDesc('');
    setHabitGoalId('');
    setHabitCat('study');
    setHabitFreq('daily');
    setHabitColor('coral');
    setHabitKind('boolean');
    setHabitUnit('');
    setHabitTargetValue('20');
    setHabitBaseTierValue('');
    setHabitStretchTierValue('');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (h: Habit) => {
    setEditingHabit(h);
    setHabitTitle(h.title);
    setHabitDesc(h.description || '');
    setHabitGoalId(h.goalId || '');
    setHabitCat(h.category);
    setHabitFreq(h.frequency);
    setHabitColor(h.color);
    setHabitKind(h.kind || 'boolean');
    setHabitUnit(h.unit || '');
    setHabitTargetValue(h.targetValue !== undefined ? String(h.targetValue) : '20');
    setHabitBaseTierValue(h.baseTierValue !== undefined ? String(h.baseTierValue) : '');
    setHabitStretchTierValue(h.stretchTierValue !== undefined ? String(h.stretchTierValue) : '');
    setFormError(null);
  };

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const prevHabits = habits;

    const targetGoal = goals.find((g) => g.id === habitGoalId);

    const isQuant = habitKind === 'quantitative';
    const parsedTarget = isQuant ? Math.max(1, Number(habitTargetValue) || 1) : undefined;
    const parsedBase = isQuant && habitBaseTierValue ? Math.max(1, Number(habitBaseTierValue)) : undefined;
    const parsedStretch = isQuant && habitStretchTierValue ? Math.max(parsedTarget || 1, Number(habitStretchTierValue)) : undefined;

    const payload = {
      title: habitTitle,
      description: habitDesc,
      category: habitCat,
      frequency: habitFreq,
      color: habitColor,
      goalId: habitGoalId || undefined,
      goalTitle: targetGoal?.title,
      kind: habitKind,
      unit: isQuant ? (habitUnit.trim() || 'units') : undefined,
      targetValue: parsedTarget,
      baseTierValue: parsedBase,
      stretchTierValue: parsedStretch
    };

    try {
      if (editingHabit) {
        const updated = await dataService.habits.updateHabit(editingHabit.id, payload);
        setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
        setEditingHabit(null);
        addToast({ title: 'Ritual Updated', description: updated.title, type: 'success' });
      } else {
        const created = await dataService.habits.createHabit(payload);
        setHabits((prev) => [...prev, created]);
        setIsCreateModalOpen(false);
        addToast({ title: 'Ritual Created', description: created.title, type: 'success' });
      }
    } catch (err) {
      setHabits(prevHabits);
      if (err instanceof ValidationError) setFormError(err.message);
      else setFormError(err instanceof Error ? err.message : 'Error saving habit');
    }
  };

  const handleDeleteHabit = async () => {
    if (!deletingHabitId) return;
    const prevHabits = habits;
    const id = deletingHabitId;
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setDeletingHabitId(null);

    try {
      await dataService.habits.deleteHabit(id);
      addToast({ title: 'Habit Removed', type: 'info' });
    } catch {
      setHabits(prevHabits);
      addToast({ title: 'Could not delete habit', type: 'error' });
    }
  };

  return (
    <div>
      <SectionHeader
        tag={<Badge variant="sage">Rituals & Consistency</Badge>}
        title="Habit Constellation"
        subtitle="Deterministic streaks derived from daily records. Small commitments compounded over time."
        guideId="rituals-and-consistency"
        onOpenGuide={openGuide}
        actions={
          <Button variant="accent" size="md" leftIcon={<Plus size={16} />} onClick={openCreateModal}>
            New Ritual
          </Button>
        }
      />

      {syncStatus === 'error' && habits.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            backgroundColor: 'var(--status-warning-bg)',
            border: '1px solid var(--status-warning)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-md)',
            fontSize: 'var(--text-caption)',
            color: 'var(--text-primary)',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={14} color="var(--color-amber-500)" />
            <span>Couldn't sync latest rituals with server. Displaying last saved version.</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleRetry} isLoading={isRetrying}>
            Retry Sync
          </Button>
        </div>
      )}

      {initialLoadStatus === 'loading' && habits.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Skeleton height="120px" />
          <Skeleton height="120px" />
          <Skeleton height="120px" />
        </div>
      ) : initialLoadStatus === 'error' && habits.length === 0 ? (
        <Card className="depth-1" style={{ textAlign: 'center', padding: '36px 16px' }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)', color: 'var(--text-primary)' }}>
            We couldn't load your habit constellation.
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '14px' }}>
            A network or server connectivity error occurred.
          </div>
          <Button variant="outline" size="sm" onClick={handleRetry} isLoading={isRetrying}>
            Retry
          </Button>
        </Card>
      ) : habits.length === 0 ? (
        <EmptyState
          illustration="focus"
          icon={Flame}
          title="No daily rituals configured yet"
          description="Rituals in Solis focus on long-term consistency over streak anxiety. Form an atomic study or wellness habit to build steady daily momentum."
          actionLabel="Create First Ritual"
          onAction={openCreateModal}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Quick Habit Capture Row */}
          <form onSubmit={handleQuickCreate} className="solis-habit-quick-capture">
            <Flame size={16} color="var(--color-coral-500)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Capture an atomic ritual... (e.g. 25m LeetCode or Morning Deep Flow, press Enter)"
              className="solis-habit-quick-input"
              disabled={isQuickSubmitting}
              aria-label="Quick capture ritual"
            />
            <Button
              type="submit"
              variant="accent"
              size="sm"
              disabled={!quickTitle.trim() || isQuickSubmitting}
              isLoading={isQuickSubmitting}
            >
              Capture
            </Button>
          </form>

          {/* Plan §3.5: daily completion summary pill */}
          {habits.length > 0 && (
            <div className="solis-habits-summary-row" aria-live="polite">
              <span className="solis-habits-summary-pill">
                {ritualsCompletedToday} of {habits.length} ritual
                {habits.length === 1 ? '' : 's'} complete today
              </span>
            </div>
          )}

          {habits.map((habit) => (
            <div key={habit.id} className="solis-habit-row">
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                {/* Top Row: Info + Streaks + Actions */}
                <div className="solis-habit-card-header">
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <Badge variant={(habit.color as BadgeVariant) || 'coral'}>
                        {habit.category}
                      </Badge>
                      <Badge variant="neutral">{habit.frequency.replace('_', ' ')}</Badge>
                      {habit.goalTitle && <Badge variant="amber">{habit.goalTitle}</Badge>}
                    </div>

                    <h3
                      style={{
                        fontFamily: 'var(--font-interface)',
                        fontSize: 'var(--text-heading-3)',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginTop: '4px'
                      }}
                    >
                      {habit.title}
                    </h3>
                    {habit.description && (
                      <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {habit.description}
                      </p>
                    )}
                  </div>

                  <div className="solis-habit-card-actions">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-heading-3)', fontWeight: 700, color: 'var(--color-coral-500)' }}>
                        <Flame size={18} />
                        <span>{habit.currentStreak} days</span>
                      </div>
                      {/* Plan §3.5: "Best" only surfaces when a real record exists
                          (not a fresh 0/0 habit) and the current streak matches or
                          beats it — never dangled over a low streak. */}
                      {habit.longestStreak > 0 && habit.currentStreak >= habit.longestStreak && (
                        <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                          Best: {habit.longestStreak} days
                        </div>
                      )}
                      {/* Plan §3.5: Rhythm Story — positive framing of this month's rhythm */}
                      {(() => {
                        const story = getRhythmStory(habit);
                        return (
                          <div
                            style={{
                              fontSize: 'var(--text-micro)',
                              color: 'var(--color-sage-600)',
                              fontWeight: 600,
                              marginTop: '2px',
                              maxWidth: '200px'
                            }}
                          >
                            {story.completions} completion{story.completions === 1 ? '' : 's'} this month • {story.title}
                          </div>
                        );
                      })()}
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(habit)} aria-label="Edit habit">
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingHabitId(habit.id)}
                        aria-label="Delete habit"
                        style={{ color: 'var(--status-error)' }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Quantitative Multi-Tier Progress Strip (Feature 2.6) */}
                {habit.kind === 'quantitative' && (() => {
                  const currentVal = habit.currentValueToday ?? 0;
                  const progressInfo = getTierProgressInfo(currentVal, habit);
                  const thresholds = progressInfo.thresholds;
                  const tierMeta = getTierMeta(progressInfo.tier);
                  const unit = habit.unit || 'units';

                  const stretchMax = Math.max(thresholds.stretch, currentVal);
                  const fillPercent = Math.min(100, Math.round((currentVal / stretchMax) * 100));
                  const basePos = Math.round((thresholds.base / stretchMax) * 100);
                  const targetPos = Math.round((thresholds.target / stretchMax) * 100);

                  return (
                    <div className="solis-habit-tier-container">
                      <div className="solis-habit-tier-header">
                        <div className="solis-habit-stepper-group">
                          <button
                            type="button"
                            className="solis-habit-stepper-btn"
                            onClick={() => handleLogProgress(habit.id, Math.max(0, currentVal - 1))}
                            title="Decrement 1"
                            aria-label="Decrement progress"
                          >
                            <Minus size={14} />
                          </button>
                          <div className="solis-habit-stepper-display">
                            <span className="solis-habit-stepper-val">{currentVal}</span>
                            <span className="solis-habit-stepper-target">/ {thresholds.target} {unit}</span>
                          </div>
                          <button
                            type="button"
                            className="solis-habit-stepper-btn"
                            onClick={() => handleLogProgress(habit.id, currentVal + 1)}
                            title="Increment 1"
                            aria-label="Increment progress"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="solis-habit-tier-presets">
                          <button
                            type="button"
                            className={`solis-habit-tier-preset-btn ${progressInfo.tier === 'base' ? 'active-base' : ''}`}
                            onClick={() => handleLogProgress(habit.id, thresholds.base)}
                            title={`Set to Base Tier (${thresholds.base} ${unit})`}
                          >
                            <Shield size={12} />
                            <span>Base ({thresholds.base})</span>
                          </button>
                          <button
                            type="button"
                            className={`solis-habit-tier-preset-btn ${progressInfo.tier === 'target' ? 'active-target' : ''}`}
                            onClick={() => handleLogProgress(habit.id, thresholds.target)}
                            title={`Set to Target Goal (${thresholds.target} ${unit})`}
                          >
                            <Check size={12} />
                            <span>Target ({thresholds.target})</span>
                          </button>
                          <button
                            type="button"
                            className={`solis-habit-tier-preset-btn ${progressInfo.tier === 'stretch' ? 'active-stretch' : ''}`}
                            onClick={() => handleLogProgress(habit.id, thresholds.stretch)}
                            title={`Set to Mastery Stretch (${thresholds.stretch} ${unit})`}
                          >
                            <Sparkles size={12} />
                            <span>Stretch ({thresholds.stretch})</span>
                          </button>
                        </div>

                        <div className="solis-habit-today-tier-badge">
                          <Badge variant={tierMeta.badgeVariant}>
                            {tierMeta.shortLabel === 'Stretch' && <Sparkles size={12} style={{ marginRight: '4px' }} />}
                            {tierMeta.shortLabel === 'Target' && <Check size={12} style={{ marginRight: '4px' }} />}
                            {tierMeta.shortLabel === 'Base' && <Shield size={12} style={{ marginRight: '4px' }} />}
                            {tierMeta.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="solis-habit-track-wrap">
                        <div className="solis-habit-track">
                          <div
                            className={`solis-habit-track-fill solis-habit-track-fill--${progressInfo.tier || 'empty'}`}
                            style={{ width: `${fillPercent}%` }}
                          />
                          <div className="solis-habit-track-marker" style={{ left: `${basePos}%` }} title={`Base Tier: ${thresholds.base} ${unit}`}>
                            <div className="solis-habit-marker-pin" />
                            <span className="solis-habit-marker-label">Base ({thresholds.base})</span>
                          </div>
                          <div className="solis-habit-track-marker" style={{ left: `${targetPos}%` }} title={`Target: ${thresholds.target} ${unit}`}>
                            <div className="solis-habit-marker-pin solis-habit-marker-pin--target" />
                            <span className="solis-habit-marker-label">Target ({thresholds.target})</span>
                          </div>
                          <div className="solis-habit-track-marker" style={{ left: '100%' }} title={`Mastery Stretch: ${thresholds.stretch} ${unit}`}>
                            <div className="solis-habit-marker-pin solis-habit-marker-pin--stretch" />
                            <span className="solis-habit-marker-label">Stretch ({thresholds.stretch})</span>
                          </div>
                        </div>
                      </div>

                      <div className="solis-habit-guidance-text">
                        <span>{progressInfo.statusMessage}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Bottom Row: Interactive Consistency Matrix (7-day on mobile, 14-day on desktop) */}
                <div className="solis-habits-matrix-container">
                  <span className="solis-habits-matrix-title">
                    {isMobileViewport ? '7-Day' : '14-Day'} Consistency Horizon
                  </span>

                  <div className="solis-habits-week-matrix">
                    {matrixDays.map((dateStr) => {
                      const isDone = habit.history[dateStr] === true;
                      // Plan §3.4/§3.5: amnesty-excused days are "Excused", not "Missed".
                      const isExcused = (habit.amnestyDates || []).includes(dateStr);
                      const isCurrToday = isToday(dateStr);
                      const d = new Date(dateStr + 'T00:00:00');
                      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
                      const dayNum = d.getDate();

                      const isQuant = habit.kind === 'quantitative';
                      const dayVal = habit.valueHistory?.[dateStr] ?? (isDone ? (habit.targetValue || 1) : 0);
                      const tier = isQuant ? evaluateHabitTier(dayVal, habit) : (isDone ? 'target' : null);

                      let statusText = '—';
                      let tierClassName = '';

                      if (isQuant && dayVal > 0) {
                        if (tier === 'stretch') {
                          statusText = `★ ${dayVal}`;
                          tierClassName = 'solis-habit-day-btn--stretch';
                        } else if (tier === 'target') {
                          statusText = `✓ ${dayVal}`;
                          tierClassName = 'solis-habit-day-btn--target';
                        } else if (tier === 'base') {
                          statusText = `▲ ${dayVal}`;
                          tierClassName = 'solis-habit-day-btn--base';
                        } else {
                          statusText = `${dayVal}`;
                          tierClassName = 'solis-habit-day-btn--partial';
                        }
                      } else if (isDone) {
                        statusText = '✓';
                        tierClassName = 'solis-habit-day-btn--done';
                      }

                      const onDayClick = () => {
                        if (isQuant && isCurrToday) {
                          const currentVal = habit.currentValueToday ?? 0;
                          const thresholds = getTierProgressInfo(currentVal, habit).thresholds;
                          if (currentVal === 0) {
                            handleLogProgress(habit.id, thresholds.base, dateStr);
                          } else if (currentVal < thresholds.target) {
                            handleLogProgress(habit.id, thresholds.target, dateStr);
                          } else if (currentVal < thresholds.stretch) {
                            handleLogProgress(habit.id, thresholds.stretch, dateStr);
                          } else {
                            handleLogProgress(habit.id, 0, dateStr);
                          }
                        } else {
                          handleToggleDay(habit.id, dateStr);
                        }
                      };

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={onDayClick}
                          title={`${d.toLocaleDateString('en-US', { weekday: 'short' })} ${dateStr}${isCurrToday ? ' (Today)' : ''}: ${isQuant ? `${dayVal} ${habit.unit || 'units'} (${tier ? getTierMeta(tier).label : 'Pending'})` : (isDone ? 'Completed' : isExcused ? 'Excused' : 'Missed')}`}
                          className={`solis-habit-day-btn press-tactile ${isCurrToday ? 'solis-habit-day-btn--today' : ''} ${tierClassName}`}
                        >
                          <span className="solis-habit-day-label">
                            {dayLabel} {dayNum}
                          </span>
                          <span className="solis-habit-day-status">
                            {statusText}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Habit Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || editingHabit !== null}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingHabit(null);
        }}
        title={editingHabit ? 'Edit Habit Ritual' : 'Create Habit Ritual'}
      >
        <form onSubmit={handleSaveHabit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {formError && (
            <div style={{ color: 'var(--status-error)', fontSize: 'var(--text-caption)' }}>
              {formError}
            </div>
          )}

          <Input
            label="Habit Statement"
            placeholder="e.g. Morning High-Cognition Deep Study Block"
            value={habitTitle}
            onChange={(e) => setHabitTitle(e.target.value)}
            required
            autoFocus
          />

          <Textarea
            label="Intention / Cue (Optional)"
            placeholder="e.g. 90 minutes before checking messages..."
            value={habitDesc}
            onChange={(e) => setHabitDesc(e.target.value)}
          />

          {/* Tracking Format Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Tracking Mode
            </label>
            <div className="solis-habit-kind-selector" role="group" aria-label="Tracking Format">
              <button
                type="button"
                className={`solis-habit-kind-tab ${habitKind === 'boolean' ? 'active' : ''}`}
                onClick={() => setHabitKind('boolean')}
              >
                <Check size={14} />
                <span>Simple Checkbox (Done / Not Done)</span>
              </button>
              <button
                type="button"
                className={`solis-habit-kind-tab ${habitKind === 'quantitative' ? 'active' : ''}`}
                onClick={() => setHabitKind('quantitative')}
              >
                <Target size={14} />
                <span>Quantitative & Multi-Tier (Pages, Mins, Units)</span>
              </button>
            </div>
          </div>

          {habitKind === 'quantitative' && (
            <div className="solis-habits-quantitative-config">
              <div className="solis-habits-form-grid">
                <Input
                  label="Unit of Measurement"
                  placeholder="e.g. pages, minutes, questions, problems"
                  value={habitUnit}
                  onChange={(e) => setHabitUnit(e.target.value)}
                  required={habitKind === 'quantitative'}
                />
                <Input
                  label="Target Goal (Tier 2 - Optimal Goal)"
                  type="number"
                  min="1"
                  placeholder="e.g. 20"
                  value={habitTargetValue}
                  onChange={(e) => setHabitTargetValue(e.target.value)}
                  required={habitKind === 'quantitative'}
                />
              </div>

              <div className="solis-habits-form-grid">
                <div>
                  <Input
                    label="Base Tier (Tier 1 - Streak Protection)"
                    type="number"
                    min="1"
                    placeholder={habitTargetValue ? `Suggested: ${Math.max(1, Math.round(Number(habitTargetValue) * 0.25))}` : 'e.g. 5'}
                    value={habitBaseTierValue}
                    onChange={(e) => setHabitBaseTierValue(e.target.value)}
                  />
                  <span className="solis-habit-field-hint">
                    Low-energy floor. Keeps streak intact on exhausting or exam days without guilt.
                  </span>
                </div>

                <div>
                  <Input
                    label="Stretch Goal (Tier 3 - Mastery Challenge)"
                    type="number"
                    min={habitTargetValue || "1"}
                    placeholder={habitTargetValue ? `Suggested: ${Math.round(Number(habitTargetValue) * 1.5)}` : 'e.g. 35'}
                    value={habitStretchTierValue}
                    onChange={(e) => setHabitStretchTierValue(e.target.value)}
                  />
                  <span className="solis-habit-field-hint">
                    Aspirational challenge for high-focus peak flow days.
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="solis-habits-form-grid">
            <CustomSelect
              label="Category"
              value={habitCat}
              onChange={(val) => setHabitCat(val as any)}
              options={[
                { value: 'study', label: 'Study & Cognition' },
                { value: 'routine', label: 'Daily Routine' },
                { value: 'wellness', label: 'Wellness & Energy' },
                { value: 'mindset', label: 'Mindset & Reflection' }
              ]}
            />

            <CustomSelect
              label="Frequency"
              value={habitFreq}
              onChange={(val) => setHabitFreq(val as HabitFrequency)}
              options={[
                { value: 'daily', label: 'Every Day' },
                { value: 'weekdays', label: 'Weekdays' },
                { value: 'weekends', label: 'Weekends' },
                { value: 'three_times_weekly', label: '3x Weekly' }
              ]}
            />
          </div>

          <CustomSelect
            label="Contributes to Goal / Exam"
            value={habitGoalId}
            onChange={setHabitGoalId}
            options={[
              { value: '', label: 'General Consistency Habit' },
              ...goals.map((g) => ({ value: g.id, label: g.title }))
            ]}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingHabit(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="accent" type="submit" leftIcon={<Sparkles size={14} />}>
              {editingHabit ? 'Update Habit' : 'Save Habit'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingHabitId !== null}
        onClose={() => setDeletingHabitId(null)}
        title="Delete Ritual"
      >
        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Are you sure you want to delete this ritual and its historical records?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={() => setDeletingHabitId(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleDeleteHabit}
            style={{ backgroundColor: 'var(--status-error)', color: '#FFFFFF' }}
          >
            Confirm Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};
