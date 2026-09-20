import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';
import { StudySubject } from '../types/study';
import { Task } from '../types/task';
import { SoundscapeType, ParkedThought } from '../types/focus';
import { dataService } from '../services/dataService';
import { useToast } from './ToastContext';
import { playFocusCompletionChime, calculateTimerRemaining } from '../utils/timer';
import { soundscapeEngine } from '../utils/focus/soundscapeEngine';

export type FocusPreset = 'pomodoro' | 'deep_flow' | 'short_break' | 'custom';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';

const STORAGE_KEY = 'solis_focus_session_v1';

export interface FocusContextValue {
  preset: FocusPreset;
  totalDurationSeconds: number;
  secondsRemaining: number;
  status: TimerStatus;
  focusTitle: string;
  targetOutcome: string;
  selectedSubjectId: string;
  selectedPlanItemId: string;
  selectedTaskId: string;
  soundscape: SoundscapeType;
  soundscapeVolume: number;
  isMuted: boolean;
  checkpointAcknowledged: boolean;
  isReflectionModalOpen: boolean;
  completedSessionMinutes: number;
  subjects: StudySubject[];
  selectedSubject: StudySubject | undefined;
  tasks: Task[];
  activeTask: Task | undefined;
  parkedThoughts: ParkedThought[];

  // Actions
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  cancelTimer: () => void;
  completeTimer: () => void;
  selectPreset: (preset: FocusPreset, customMinutes?: number) => void;
  setFocusTitle: (title: string) => void;
  setTargetOutcome: (outcome: string) => void;
  setSelectedSubjectId: (id: string) => void;
  setSelectedPlanItemId: (id: string) => void;
  setSelectedTaskId: (id: string) => void;
  setSoundscape: (soundscape: SoundscapeType) => void;
  setSoundscapeVolume: (volume: number) => void;
  toggleMute: () => void;
  setCheckpointAcknowledged: (acknowledged: boolean) => void;
  setIsReflectionModalOpen: (open: boolean) => void;
  testAudioChime: () => void;
  parkThought: (text: string, type: 'task' | 'note' | 'question') => Promise<void>;
  clearParkedThoughts: () => void;
  saveReflection: (data: {
    flowQuality: number;
    interruptionsCount: number;
    notes?: string;
    synthesizeNote: boolean;
    completeLinkedTask?: boolean;
    completePlanItem?: boolean;
  }) => Promise<void>;
}

const FocusContext = createContext<FocusContextValue | undefined>(undefined);

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();

  // Load initial state from sessionStorage if available
  const [persisted] = useState(() => {
    try {
      const item = sessionStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  });

  const [preset, setPresetState] = useState<FocusPreset>(persisted?.preset || 'pomodoro');
  const [totalDurationSeconds, setTotalDurationSeconds] = useState<number>(persisted?.totalDurationSeconds || 25 * 60);
  const [status, setStatus] = useState<TimerStatus>(persisted?.status === 'running' ? 'running' : persisted?.status === 'paused' ? 'paused' : 'idle');
  const [targetEndTimeMs, setTargetEndTimeMs] = useState<number | null>(persisted?.targetEndTimeMs || null);
  const [pausedRemainingMs, setPausedRemainingMs] = useState<number | null>(persisted?.pausedRemainingMs || null);

  const [focusTitle, setFocusTitle] = useState<string>(persisted?.focusTitle || 'Deep Study & Architectural Flow');
  const [targetOutcome, setTargetOutcome] = useState<string>(persisted?.targetOutcome || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(persisted?.selectedSubjectId || '');
  const [selectedPlanItemId, setSelectedPlanItemId] = useState<string>(persisted?.selectedPlanItemId || '');
  const [selectedTaskId, setSelectedTaskIdState] = useState<string>(persisted?.selectedTaskId || '');

  const [soundscape, setSoundscapeState] = useState<SoundscapeType>(persisted?.soundscape || 'none');
  const [soundscapeVolume, setSoundscapeVolumeState] = useState<number>(persisted?.soundscapeVolume ?? 0.5);
  const [isMuted, setIsMuted] = useState<boolean>(persisted?.isMuted || false);
  const [checkpointAcknowledged, setCheckpointAcknowledged] = useState<boolean>(persisted?.checkpointAcknowledged || false);
  const [parkedThoughts, setParkedThoughts] = useState<ParkedThought[]>(persisted?.parkedThoughts || []);

  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [completedSessionMinutes, setCompletedSessionMinutes] = useState(25);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Calculate initial seconds remaining
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (persisted?.status === 'running' && persisted?.targetEndTimeMs) {
      const rem = Math.max(0, Math.ceil((persisted.targetEndTimeMs - Date.now()) / 1000));
      return rem;
    }
    if (persisted?.status === 'paused' && persisted?.pausedRemainingMs) {
      return Math.ceil(persisted.pausedRemainingMs / 1000);
    }
    return persisted?.totalDurationSeconds || 25 * 60;
  });

  const animFrameRef = useRef<number | null>(null);

  // Sync to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          preset,
          totalDurationSeconds,
          status,
          targetEndTimeMs,
          pausedRemainingMs,
          focusTitle,
          targetOutcome,
          selectedSubjectId,
          selectedPlanItemId,
          selectedTaskId,
          soundscape,
          soundscapeVolume,
          isMuted,
          checkpointAcknowledged,
          parkedThoughts
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [
    preset,
    totalDurationSeconds,
    status,
    targetEndTimeMs,
    pausedRemainingMs,
    focusTitle,
    targetOutcome,
    selectedSubjectId,
    selectedPlanItemId,
    selectedTaskId,
    soundscape,
    soundscapeVolume,
    isMuted,
    checkpointAcknowledged,
    parkedThoughts
  ]);

  // Load subjects (stable single subscription)
  const loadSubjects = useCallback(async () => {
    try {
      const subs = await dataService.study.getSubjects();
      setSubjects(subs);
      setSelectedSubjectId((prev) => prev || (subs.length > 0 ? subs[0].id : ''));
    } catch (err) {
      console.error('Failed to load focus subjects:', err);
    }
  }, []);

  // Load tasks
  const loadTasks = useCallback(async () => {
    try {
      const allTasks = await dataService.tasks.getTasks();
      setTasks(allTasks);
    } catch (err) {
      console.error('Failed to load focus tasks:', err);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
    loadTasks();
    const unsubscribe = dataService.subscribe(() => {
      loadSubjects();
      loadTasks();
    });
    return () => unsubscribe();
  }, [loadSubjects, loadTasks]);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const activeTask = tasks.find((t) => t.id === selectedTaskId);

  const setSelectedTaskId = useCallback((id: string) => {
    setSelectedTaskIdState(id);
    if (!id) return;
    const found = tasks.find((t) => t.id === id);
    if (found) {
      if (found.subjectId) setSelectedSubjectId(found.subjectId);
      if (found.title) setFocusTitle(found.title);
      if (found.estimatedMinutes) {
        if (found.estimatedMinutes === 25) selectPreset('pomodoro');
        else if (found.estimatedMinutes === 50) selectPreset('deep_flow');
        else selectPreset('custom', found.estimatedMinutes);
      }
    }
  }, [tasks]);

  // Synchronize task details once tasks load asynchronously
  useEffect(() => {
    if (!selectedTaskId || tasks.length === 0) return;
    const found = tasks.find((t) => t.id === selectedTaskId);
    if (found) {
      if (found.subjectId && !selectedSubjectId) {
        setSelectedSubjectId(found.subjectId);
      }
      if (found.title && (!focusTitle || focusTitle === 'Deep Study & Architectural Flow')) {
        setFocusTitle(found.title);
      }
      if (found.estimatedMinutes && preset === 'pomodoro') {
        if (found.estimatedMinutes === 25) selectPreset('pomodoro');
        else if (found.estimatedMinutes === 50) selectPreset('deep_flow');
        else selectPreset('custom', found.estimatedMinutes);
      }
    }
  }, [selectedTaskId, tasks, selectedSubjectId, focusTitle, preset]);

  const completeTimer = useCallback(() => {
    soundscapeEngine.stop();
    setStatus('completed');
    setSecondsRemaining(0);
    setTargetEndTimeMs(null);
    setPausedRemainingMs(null);

    playFocusCompletionChime();
    const mins = Math.max(1, Math.round(totalDurationSeconds / 60));
    setCompletedSessionMinutes(mins);
    setIsReflectionModalOpen(true);
  }, [totalDurationSeconds]);

  // Precision RAF loop
  useEffect(() => {
    if (status !== 'running' || targetEndTimeMs === null) {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const tick = () => {
      const remainingSeconds = calculateTimerRemaining(
        targetEndTimeMs,
        pausedRemainingMs,
        status,
        totalDurationSeconds
      );

      setSecondsRemaining((prev) => (prev !== remainingSeconds ? remainingSeconds : prev));

      if (remainingSeconds <= 0) {
        completeTimer();
      } else {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [status, targetEndTimeMs, pausedRemainingMs, totalDurationSeconds, completeTimer]);

  const startTimer = () => {
    const now = Date.now();
    let targetEnd: number;

    if (status === 'paused' && pausedRemainingMs !== null) {
      targetEnd = now + pausedRemainingMs;
    } else {
      targetEnd = now + totalDurationSeconds * 1000;
      setCheckpointAcknowledged(false);
      setParkedThoughts([]);
    }

    setTargetEndTimeMs(targetEnd);
    setPausedRemainingMs(null);
    setStatus('running');

    if (soundscape !== 'none' && !isMuted) {
      soundscapeEngine.setSoundscape(soundscape, soundscapeVolume);
    }
  };

  const pauseTimer = () => {
    if (status !== 'running' || targetEndTimeMs === null) return;
    const now = Date.now();
    const remainingMs = Math.max(0, targetEndTimeMs - now);

    soundscapeEngine.stop();
    setPausedRemainingMs(remainingMs);
    setTargetEndTimeMs(null);
    setStatus('paused');
  };

  const resetTimer = () => {
    soundscapeEngine.stop();
    setStatus('idle');
    setSecondsRemaining(totalDurationSeconds);
    setTargetEndTimeMs(null);
    setPausedRemainingMs(null);
    setCheckpointAcknowledged(false);
    setParkedThoughts([]);
  };

  const cancelTimer = () => {
    soundscapeEngine.stop();
    setStatus('cancelled');
    setSecondsRemaining(totalDurationSeconds);
    setTargetEndTimeMs(null);
    setPausedRemainingMs(null);
    setCheckpointAcknowledged(false);
    setParkedThoughts([]);
    addToast({ title: 'Session cancelled', description: 'Session was not logged.', type: 'info' });
  };

  const selectPreset = (newPreset: FocusPreset, customMinutes?: number) => {
    setStatus('idle');
    setPresetState(newPreset);
    let sec = 25 * 60;
    if (newPreset === 'deep_flow') sec = 50 * 60;
    if (newPreset === 'short_break') sec = 5 * 60;
    if (newPreset === 'custom' && customMinutes) sec = customMinutes * 60;

    setTotalDurationSeconds(sec);
    setSecondsRemaining(sec);
    setTargetEndTimeMs(null);
    setPausedRemainingMs(null);
    setCheckpointAcknowledged(false);
  };

  const setSoundscape = (type: SoundscapeType) => {
    setSoundscapeState(type);
    if (status === 'running') {
      if (type === 'none' || isMuted) {
        soundscapeEngine.stop();
      } else {
        soundscapeEngine.setSoundscape(type, soundscapeVolume);
      }
    }
  };

  const setSoundscapeVolume = (vol: number) => {
    setSoundscapeVolumeState(vol);
    if (!isMuted && status === 'running') {
      soundscapeEngine.setVolume(vol);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (status === 'running') {
      if (nextMuted) soundscapeEngine.stop();
      else if (soundscape !== 'none') soundscapeEngine.setSoundscape(soundscape, soundscapeVolume);
    }
  };

  const testAudioChime = () => {
    playFocusCompletionChime();
    addToast({ title: 'Acoustic chime test', description: 'Tranquil harmonic resonance.', type: 'info' });
  };

  const parkThought = useCallback(async (text: string, type: 'task' | 'note' | 'question') => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newThought: ParkedThought = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'pt-' + Date.now() + Math.random().toString(36).substring(2, 6),
      text: trimmed,
      type,
      timestamp: new Date().toISOString()
    };
    setParkedThoughts((prev) => [...prev, newThought]);

    try {
      if (type === 'task') {
        await dataService.tasks.createTask({
          title: trimmed,
          priority: 'medium',
          subjectId: selectedSubjectId || undefined,
          tags: ['focus-drift']
        });
      } else if (type === 'note') {
        await dataService.notes.createNote({
          title: `Focus Spark: ${trimmed.slice(0, 45)}`,
          content: trimmed,
          category: 'idea',
          subjectId: selectedSubjectId || undefined,
          tags: ['focus-drift', selectedSubject?.name || 'general']
        });
      } else if (type === 'question') {
        await dataService.notes.createNote({
          title: `Question: ${trimmed.slice(0, 45)}`,
          content: `### Parked Curiosity\n${trimmed}\n\n*Captured during active focus block for post-session investigation.*`,
          category: 'idea',
          subjectId: selectedSubjectId || undefined,
          tags: ['focus-drift', 'research-question', selectedSubject?.name || 'general']
        });
      }
    } catch (err) {
      console.error('Failed to anchor parked thought to background data layer:', err);
    }
  }, [selectedSubjectId, selectedSubject?.name]);

  const clearParkedThoughts = useCallback(() => {
    setParkedThoughts([]);
  }, []);

  const saveReflection = async (data: {
    flowQuality: number;
    interruptionsCount: number;
    notes?: string;
    synthesizeNote: boolean;
    completeLinkedTask?: boolean;
    completePlanItem?: boolean;
  }) => {
    try {
      await dataService.focus.saveFocusSession({
        mode: preset === 'pomodoro' ? 'pomodoro' : preset === 'deep_flow' ? 'deep_flow' : 'custom_timer',
        durationMinutes: completedSessionMinutes,
        subjectId: selectedSubjectId || undefined,
        subjectName: selectedSubject?.name,
        planItemId: selectedPlanItemId || undefined,
        taskId: selectedTaskId || undefined,
        topic: focusTitle || 'Deep Focus Pod Session',
        title: focusTitle || 'Deep Focus Pod Session',
        completed: true,
        interruptionsCount: Math.max(data.interruptionsCount, parkedThoughts.length),
        flowQuality: data.flowQuality,
        soundscapeType: soundscape,
        targetOutcome: targetOutcome || undefined,
        notes: data.notes,
        parkedThoughts: parkedThoughts.length > 0 ? parkedThoughts : undefined
      });

      // Complete linked task if requested
      if (data.completeLinkedTask && selectedTaskId) {
        try {
          const currentCompletedMinutes = activeTask?.completedMinutes || 0;
          await dataService.tasks.updateTask(selectedTaskId, {
            status: 'completed',
            completedMinutes: currentCompletedMinutes + completedSessionMinutes,
            completedAt: new Date().toISOString()
          });
          addToast({
            title: 'Task Completed',
            description: `"${activeTask?.title || 'Linked task'}" marked complete.`,
            type: 'success'
          });
        } catch (err) {
          console.error('Failed to mark linked task complete:', err);
        }
      }

      // Complete linked study plan item if requested
      if (data.completePlanItem && selectedPlanItemId) {
        try {
          await dataService.study.updatePlanItem(selectedPlanItemId, { completed: true });
        } catch (err) {
          console.error('Failed to complete study plan item:', err);
        }
      }

      if (data.synthesizeNote && data.notes) {
        const taskTag = activeTask?.title ? `task:${activeTask.title.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}` : '';
        await dataService.notes.createNote({
          title: `${focusTitle} — Distillation`,
          content: `${data.notes}\n\n**Session Details:**\n- Duration: ${completedSessionMinutes}m\n- Flow Quality: ${data.flowQuality}/5\n- Target Outcome: ${targetOutcome || 'N/A'}${
            activeTask ? `\n- Linked Task: ${activeTask.title}` : ''
          }${parkedThoughts.length > 0 ? `\n- Parked Thoughts: ${parkedThoughts.length}` : ''}`,
          category: 'concept',
          subjectId: selectedSubjectId || undefined,
          tags: ['focus-distillation', selectedSubject?.name || 'general', ...(taskTag ? [taskTag] : [])]
        });
      }

      addToast({
        title: 'Focus Session Completed & Recorded',
        description: `${focusTitle} (${completedSessionMinutes}m) logged.`,
        type: 'success'
      });
      clearParkedThoughts();
      setSelectedTaskIdState('');
      setSelectedPlanItemId('');
      resetTimer();
    } catch (err) {
      console.error('Failed to save focus reflection:', err);
      addToast({ title: 'Failed to record session', type: 'error' });
    }
  };

  const value: FocusContextValue = {
    preset,
    totalDurationSeconds,
    secondsRemaining,
    status,
    focusTitle,
    targetOutcome,
    selectedSubjectId,
    selectedPlanItemId,
    selectedTaskId,
    soundscape,
    soundscapeVolume,
    isMuted,
    checkpointAcknowledged,
    isReflectionModalOpen,
    completedSessionMinutes,
    subjects,
    selectedSubject,
    tasks,
    activeTask,
    parkedThoughts,

    startTimer,
    pauseTimer,
    resetTimer,
    cancelTimer,
    completeTimer,
    selectPreset,
    setFocusTitle,
    setTargetOutcome,
    setSelectedSubjectId,
    setSelectedPlanItemId,
    setSelectedTaskId,
    setSoundscape,
    setSoundscapeVolume,
    toggleMute,
    setCheckpointAcknowledged,
    setIsReflectionModalOpen,
    testAudioChime,
    parkThought,
    clearParkedThoughts,
    saveReflection
  };

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
};

export const useFocus = (): FocusContextValue => {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
};
