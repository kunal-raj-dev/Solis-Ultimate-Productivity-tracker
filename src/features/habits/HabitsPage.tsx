import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Flame,
  Trash2,
  Edit2,
  Sparkles
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
import { dataService } from '../../services/dataService';
import { Habit, HabitFrequency } from '../../types/habit';
import { Goal } from '../../types/goal';
import { getPastNDaysISO, formatFriendlyDate, isToday } from '../../utils/date';
import { ValidationError } from '../../utils/validation';

export const HabitsPage: React.FC = () => {
  const { addToast } = useToast();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  const [formError, setFormError] = useState<string | null>(null);

  const past7Days = getPastNDaysISO(7);

  const loadHabits = useCallback(async () => {
    try {
      const [habitsData, goalsData] = await Promise.all([
        dataService.habits.getHabits(),
        dataService.goals.getGoals()
      ]);
      setHabits(habitsData);
      setGoals(goalsData);
    } catch (err) {
      console.error('Failed to load habits:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();
    const unsubscribe = dataService.subscribe(() => {
      loadHabits();
    });
    return () => unsubscribe();
  }, [loadHabits]);

  const handleToggleDay = async (habitId: string, dateStr: string) => {
    try {
      const updated = await dataService.habits.toggleHabitDate(habitId, dateStr);
      setHabits((prev) => prev.map((h) => (h.id === habitId ? updated : h)));

      if (isToday(dateStr)) {
        addToast({
          title: updated.completedToday ? 'Ritual Checked In' : 'Ritual Reset',
          description: `${updated.title} • Current streak: ${updated.currentStreak} days`,
          type: 'info'
        });
      }
    } catch {
      addToast({ title: 'Could not update habit record', type: 'error' });
    }
  };

  const openCreateModal = () => {
    setHabitTitle('');
    setHabitDesc('');
    setHabitGoalId('');
    setHabitCat('study');
    setHabitFreq('daily');
    setHabitColor('coral');
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
    setFormError(null);
  };

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const targetGoal = goals.find((g) => g.id === habitGoalId);

    try {
      if (editingHabit) {
        const updated = await dataService.habits.updateHabit(editingHabit.id, {
          title: habitTitle,
          description: habitDesc,
          category: habitCat,
          frequency: habitFreq,
          color: habitColor,
          goalId: habitGoalId || undefined,
          goalTitle: targetGoal?.title
        });
        setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
        setEditingHabit(null);
        addToast({ title: 'Ritual Updated', description: updated.title, type: 'success' });
      } else {
        const created = await dataService.habits.createHabit({
          title: habitTitle,
          description: habitDesc,
          category: habitCat,
          frequency: habitFreq,
          color: habitColor,
          goalId: habitGoalId || undefined,
          goalTitle: targetGoal?.title
        });
        setHabits((prev) => [...prev, created]);
        setIsCreateModalOpen(false);
        addToast({ title: 'Ritual Created', description: created.title, type: 'success' });
      }
    } catch (err) {
      if (err instanceof ValidationError) setFormError(err.message);
      else setFormError(err instanceof Error ? err.message : 'Error saving habit');
    }
  };

  const handleDeleteHabit = async () => {
    if (!deletingHabitId) return;
    try {
      await dataService.habits.deleteHabit(deletingHabitId);
      setHabits((prev) => prev.filter((h) => h.id !== deletingHabitId));
      setDeletingHabitId(null);
      addToast({ title: 'Habit Removed', type: 'info' });
    } catch {
      addToast({ title: 'Could not delete habit', type: 'error' });
    }
  };

  return (
    <div>
      <SectionHeader
        tag={<Badge variant="sage">Rituals & Consistency</Badge>}
        title="Habit Constellation"
        subtitle="Deterministic streaks derived from daily records. Small commitments compounded over time."
        actions={
          <Button variant="accent" size="md" leftIcon={<Plus size={16} />} onClick={openCreateModal}>
            New Ritual
          </Button>
        }
      />

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Skeleton height="120px" />
          <Skeleton height="120px" />
          <Skeleton height="120px" />
        </div>
      ) : habits.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="No daily rituals configured yet"
          description="Form an intentional study or wellness habit to build lasting daily momentum."
          actionLabel="Create First Ritual"
          onAction={openCreateModal}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {habits.map((habit) => (
            <Card key={habit.id}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                {/* Top Row: Info + Streaks + Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-heading-3)', fontWeight: 700, color: 'var(--color-coral-500)' }}>
                        <Flame size={18} />
                        <span>{habit.currentStreak} days</span>
                      </div>
                      <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                        Best: {habit.longestStreak} days
                      </div>
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

                {/* Bottom Row: 7-Day Interactive Matrix */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-surface-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    7-Day Check-in History
                  </span>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {past7Days.map((dateStr) => {
                      const isDone = habit.history[dateStr] === true;
                      const isCurrToday = isToday(dateStr);

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => handleToggleDay(habit.id, dateStr)}
                          title={`${dateStr} (${formatFriendlyDate(dateStr)}): ${isDone ? 'Completed' : 'Missed'}`}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 6px',
                            borderRadius: '6px',
                            background: isDone ? 'var(--color-coral-500)' : '#FFFFFF',
                            color: isDone ? '#FFFFFF' : 'var(--text-secondary)',
                            border: isCurrToday ? '1.5px solid var(--color-coral-500)' : '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          <span style={{ fontSize: '10px', fontWeight: 600 }}>
                            {formatFriendlyDate(dateStr).slice(0, 3)}
                          </span>
                          <span style={{ fontSize: '12px' }}>
                            {isDone ? '✓' : '—'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
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
