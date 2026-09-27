import { dataService } from '../../services/dataService';

/**
 * Phase 4 (P4.4) — study → habit auto-toggle.
 * When a recall/review study session is logged, any habit whose title marks
 * it as a review ritual ("review flashcards", "SRS", "daily recall"…) is
 * auto-completed for today. Idempotent: habits already completed today are
 * skipped, and failures never surface to the caller's flow.
 */

const STUDY_HABIT_KEYWORDS = ['review', 'flashcard', 'flash card', 'srs', 'recall', 'anki'];

export async function autoToggleReviewHabits(): Promise<number> {
  try {
    const habits = await dataService.habits.getHabits();
    const candidates = habits.filter(
      (h) =>
        !h.completedToday &&
        h.history[new Date().toISOString().slice(0, 10)] !== true &&
        STUDY_HABIT_KEYWORDS.some((k) => h.title.toLowerCase().includes(k))
    );
    for (const habit of candidates) {
      await dataService.habits.toggleHabitToday(habit.id);
    }
    return candidates.length;
  } catch {
    // Auto-toggle is a convenience layer — never break the session flow.
    return 0;
  }
}
