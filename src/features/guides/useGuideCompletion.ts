import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { dataService } from '../../services/dataService';

export function useGuideCompletion() {
  const { refreshCount } = useData();
  const [completionState, setCompletionState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchState = async () => {
      try {
        const [
          subjects,
          tasks,
          focusSessions,
          notes,
          habits,
          goals,
          flashcards
        ] = await Promise.all([
          dataService.study.getSubjects(),
          dataService.tasks.getTasks(),
          dataService.focus.getRecentSessions(),
          dataService.notes.getNotes(),
          dataService.habits.getHabits(),
          dataService.goals.getGoals(),
          dataService.flashcards.getFlashcards()
        ]);

        setCompletionState({
          'has-subject': subjects.length > 0,
          'has-task': tasks.length > 0,
          'has-focus-session': focusSessions.length > 0,
          'has-note': notes.length > 0,
          'has-habit': habits.length > 0,
          'has-goal': goals.length > 0,
          'has-flashcard': flashcards.length > 0,
        });
      } catch (e) {
        console.error('Failed to fetch completion state for guides', e);
      }
    };
    
    fetchState();
  }, [refreshCount]);

  /**
   * Check if a step's completion condition is satisfied by real app state.
   * Returns true if the condition is met, false otherwise.
   * Returns undefined if the check key is unknown (treat as manual-only step) or data isn't loaded yet.
   */
  const checkStepCompletion = (completionCheck: string): boolean | undefined => {
    if (completionCheck in completionState) {
      return completionState[completionCheck];
    }
    return undefined;
  };
  
  return { checkStepCompletion };
}
