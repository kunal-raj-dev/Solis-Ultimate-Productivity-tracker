import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} from 'react';
import { StudySubject } from '../types/study';
import { Task } from '../types/task';
import { SoundscapeType, ParkedThought, PreSessionEnergy, InterruptionEvent, InterruptionType } from '../types/focus';
import { dataService } from '../services/dataService';
import { useToast } from './ToastContext';
import { playFocusCompletionChime, calculateTimerRemaining } from '../utils/timer';
import { soundscapeEngine } from '../utils/focus/soundscapeEngine';
import { hapticsEngine } from '../utils/focus/hapticsEngine';
import { createInterruptionEvent } from '../utils/focus/interruptionTracker';

export type FocusPreset = 'pomodoro' | 'deep_flow' | 'short_break' | 'custom';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';

/** Plan §5.3: 'analog' renders the pie-sweep timer instead of digital numerals. */
export type FocusTimerDisplayStyle = 'digital' | 'analog';

/** Plan §5.2: countdown sessions end at a target; stopwatch sessions count up. */
export type FocusTimerMode = 'countdown' | 'stopwatch';

const STORAGE_KEY = 'solis_focus_session_v1';

export interface FocusContextValue {
  preset: FocusPreset;
  totalDurationSeconds: number;
  secondsRemaining: number;
  status: TimerStatus;
  /** Plan §5.2: countdown sessions end at a target epoch; stopwatch sessions count up from zero. */
  timerMode: FocusTimerMode;
  /** Plan §5.2: seconds elapsed in the current stopwatch session (count-up). */
  stopwatchElapsedSeconds: number;
  focusTitle: string;
  targetOutcome: string;
  selectedSubjectId: string;
  selectedPlanItemId: string;
  selectedTaskId: string;
  selectedBlockId: string;
  soundscape: SoundscapeType;
  soundscapeVolume: number;
  isMuted: boolean;
  checkpointAcknowledged: boolean;
  isReflectionModalOpen: boolean;
  completedSessionMinutes: number;
  /** Plan §5.1: 3-tap pre-session energy calibration for the active session. */
  preSessionEnergy: PreSessionEnergy | null;
  subjects: StudySubject[];
  selectedSubject: StudySubject | undefined;
  tasks: Task[];
  activeTask: Task | undefined;
  parkedThoughts: ParkedThought[];
  /** Feature 2.5: Distraction counter & interruption tracking */
  interruptionsLog: InterruptionEvent[];
  internalInterruptionsCount: number;
  externalInterruptionsCount: number;

  // Actions
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  cancelTimer: () => void;
  completeTimer: () => void;
  selectPreset: (preset: FocusPreset, customMinutes?: number) => void;
  /** Plan §5.2: one-tap count-up stopwatch bound to a subject — no modal configuration. */
  startQuickStopwatch: (subjectId: string) => void;
  setFocusTitle: (title: string) => void;
  setTargetOutcome: (outcome: string) => void;
  setSelectedSubjectId: (id: string) => void;
  setSelectedPlanItemId: (id: string) => void;
  setSelectedTaskId: (id: string) => void;
  setSelectedBlockId: (id: string) => void;
  setSoundscape: (soundscape: SoundscapeType) => void;
  setSoundscapeVolume: (volume: number) => void;
  toggleMute: () => void;
  setCheckpointAcknowledged: (acknowledged: boolean) => void;
  setPreSessionEnergy: (energy: PreSessionEnergy | null) => void;
  setIsReflectionModalOpen: (open: boolean) => void;
  testAudioChime: () => void;
  parkThought: (text: string, type: 'task' | 'note' | 'question') => Promise<void>;
  clearParkedThoughts: () => void;
  recordInterruption: (type: InterruptionType, note?: string) => void;
  clearInterruptions: () => void;
  saveReflection: (data: {
    flowQuality: number;
    interruptionsCount: number;
    internalInterruptionsCount?: number;
    externalInterruptionsCount?: number;
    notes?: string;
    synthesizeNote: boolean;
    completeLinkedTask?: boolean;
    completePlanItem?: boolean;
  }) => Promise<void>;
}

const FocusContext = createContext<FocusContextValue | undefined>(undefined);

function getSavedFocusPreferences(): {
  defaultFocusDurationMinutes: number;
  defaultBreakDurationMinutes: number;
  soundEnabled: boolean;
} {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('solis_user_preferences');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          defaultFocusDurationMinutes:
            typeof parsed.defaultFocusDurationMinutes === 'number' && parsed.defaultFocusDurationMinutes > 0
              ? parsed.defaultFocusDurationMinutes
              : 25,
          defaultBreakDurationMinutes:
            typeof parsed.defaultBreakDurationMinutes === 'number' && parsed.defaultBreakDurationMinutes > 0
              ? parsed.defaultBreakDurationMinutes
              : 5,
          soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true
        };
      }
    } catch {
      // Ignore storage errors
    }
  }
  return {
    defaultFocusDurationMinutes: 25,
    defaultBreakDurationMinutes: 5,
    soundEnabled: true
  };
}

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

  const initialFocusSeconds = getSavedFocusPreferences().defaultFocusDurationMinutes * 60;

  const [preset, setPresetState] = useState<FocusPreset>(persisted?.preset || 'pomodoro');
  const [timerMode, setTimerMode] = useState<FocusTimerMode>(persisted?.timerMode || 'countdown');
  const [stopwatchStartEpochMs, setStopwatchStartEpochMs] = useState<number | null>(
    persisted?.stopwatchStartEpochMs ?? null
  );
  const [stopwatchAccumulatedMs, setStopwatchAccumulatedMs] = useState<number>(
    persisted?.stopwatchAccumulatedMs || 0
  );
  const [stopwatchElapsedSeconds, setStopwatchElapsedSeconds] = useState<number>(
    persisted?.stopwatchElapsedSeconds || 0
  );
  const [totalDurationSeconds, setTotalDurationSeconds] = useState<number>(
    persisted?.totalDurationSeconds || initialFocusSeconds
  );
  const [status, setStatus] = useState<TimerStatus>(persisted?.status === 'running' ? 'running' : persisted?.status === 'paused' ? 'paused' : 'idle');
  const [targetEndTimeMs, setTargetEndTimeMs] = useState<number | null>(persisted?.targetEndTimeMs || null);
  const [pausedRemainingMs, setPausedRemainingMs] = useState<number | null>(persisted?.pausedRemainingMs || null);

  const [focusTitle, setFocusTitle] = useState<string>(persisted?.focusTitle || 'Deep Study & Architectural Flow');
  const [targetOutcome, setTargetOutcome] = useState<string>(persisted?.targetOutcome || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(persisted?.selectedSubjectId || '');
  const [selectedPlanItemId, setSelectedPlanItemId] = useState<string>(persisted?.selectedPlanItemId || '');
  const [selectedTaskId, setSelectedTaskIdState] = useState<string>(persisted?.selectedTaskId || '');
  const [selectedBlockId, setSelectedBlockIdState] = useState<string>(persisted?.selectedBlockId || '');

  const [soundscape, setSoundscapeState] = useState<SoundscapeType>(persisted?.soundscape || 'none');
  const [soundscapeVolume, setSoundscapeVolumeState] = useState<number>(persisted?.soundscapeVolume ?? 0.5);
  const [isMuted, setIsMuted] = useState<boolean>(persisted?.isMuted || false);
  const [checkpointAcknowledged, setCheckpointAcknowledged] = useState<boolean>(persisted?.checkpointAcknowledged || false);
  const [parkedThoughts, setParkedThoughts] = useState<ParkedThought[]>(persisted?.parkedThoughts || []);
  const [interruptionsLog, setInterruptionsLog] = useState<InterruptionEvent[]>(persisted?.interruptionsLog || []);
  const [preSessionEnergy, setPreSessionEnergy] = useState<PreSessionEnergy | null>(
    persisted?.preSessionEnergy ?? null
  );

  const internalInterruptionsCount = useMemo(
    () => interruptionsLog.filter((i) => i.type === 'internal').length,
    [interruptionsLog]
  );

  const externalInterruptionsCount = useMemo(
    () => interruptionsLog.filter((i) => i.type === 'external').length,
    [interruptionsLog]
  );

  const recordInterruption = useCallback((type: InterruptionType, note?: string) => {
    const newEvent = createInterruptionEvent(type, note);
    setInterruptionsLog((prev) => [...prev, newEvent]);
    hapticsEngine.playMechanicalTick();
  }, []);

  const clearInterruptions = useCallback(() => {
    setInterruptionsLog([]);
  }, []);

  // Plan §5.3: soft-landing chime fires once, ~2 minutes before a countdown ends.
  const softLandingPlayedRef = useRef(false);

  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [completedSessionMinutes, setCompletedSessionMinutes] = useState(
    getSavedFocusPreferences().defaultFocusDurationMinutes
  );
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
    return persisted?.totalDurationSeconds || initialFocusSeconds;
  });

  const animFrameRef = useRef<number | null>(null);

  // Sync to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          preset,
          timerMode,
          stopwatchStartEpochMs,
          stopwatchAccumulatedMs,
          stopwatchElapsedSeconds,
          totalDurationSeconds,
          status,
          targetEndTimeMs,
          pausedRemainingMs,
          focusTitle,
          targetOutcome,
          selectedSubjectId,
          selectedPlanItemId,
          selectedTaskId,
          selectedBlockId,
          soundscape,
          soundscapeVolume,
          isMuted,
          checkpointAcknowledged,
          parkedThoughts,
          interruptionsLog,
          preSessionEnergy
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [
    preset,
    timerMode,
    stopwatchStartEpochMs,
    stopwatchAccumulatedMs,
    stopwatchElapsedSeconds,
    totalDurationSeconds,
    status,
    targetEndTimeMs,
    pausedRemainingMs,
    focusTitle,
    targetOutcome,
    selectedSubjectId,
    selectedPlanItemId,
    selectedTaskId,
    selectedBlockId,
    soundscape,
    soundscapeVolume,
    isMuted,
    checkpointAcknowledged,
    parkedThoughts,
    interruptionsLog,
    preSessionEnergy
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
    // Plan §6.1 scoped entity pub/sub: the pre-session picker renders
    // subjects and tasks only.
    const unsubscribe = dataService.subscribe(() => {
      loadSubjects();
      loadTasks();
    }, ['tasks', 'study']);
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
      if (found.subjectId) {
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
  }, [selectedTaskId, tasks, focusTitle, preset]);

  const completeTimer = useCallback(() => {
    soundscapeEngine.stop();
    setStatus('completed');
    setTargetEndTimeMs(null);
    setPausedRemainingMs(null);

    if (timerMode === 'stopwatch') {
      const elapsedMs =
        stopwatchAccumulatedMs + (stopwatchStartEpochMs !== null ? Date.now() - stopwatchStartEpochMs : 0);
      setStopwatchStartEpochMs(null);
      setStopwatchAccumulatedMs(elapsedMs);
      setStopwatchElapsedSeconds(Math.floor(elapsedMs / 1000));
      const mins = Math.max(1, Math.round(elapsedMs / 60000));
      setCompletedSessionMinutes(mins);
    } else {
      setSecondsRemaining(0);
      const mins = Math.max(1, Math.round(totalDurationSeconds / 60));
      setCompletedSessionMinutes(mins);
    }

    if (getSavedFocusPreferences().soundEnabled) {
      playFocusCompletionChime();
    }
    setIsReflectionModalOpen(true);
  }, [timerMode, stopwatchAccumulatedMs, stopwatchStartEpochMs, totalDurationSeconds]);

  // Precision RAF loop
  useEffect(() => {
    if (status !== 'running') {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    // Plan §5.2: stopwatch sessions count up from their start epoch.
    if (timerMode === 'stopwatch') {
      if (stopwatchStartEpochMs === null) return;

      const tick = () => {
        const elapsedMs = stopwatchAccumulatedMs + (Date.now() - stopwatchStartEpochMs);
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        setStopwatchElapsedSeconds((prev) => (prev !== elapsedSeconds ? elapsedSeconds : prev));
        animFrameRef.current = requestAnimationFrame(tick);
      };

      animFrameRef.current = requestAnimationFrame(tick);

      return () => {
        if (animFrameRef.current !== null) {
          cancelAnimationFrame(animFrameRef.current);
        }
      };
    }

    if (targetEndTimeMs === null) return;

    const tick = () => {
      const remainingSeconds = calculateTimerRemaining(
        targetEndTimeMs,
        pausedRemainingMs,
        status,
        totalDurationSeconds
      );

      setSecondsRemaining((prev) => (prev !== remainingSeconds ? remainingSeconds : prev));

      // Plan §5.3: gentle "Soft Landing" chime ~2 minutes before conclusion,
      // once per session, for sessions long enough to land into.
      if (
        !softLandingPlayedRef.current &&
        totalDurationSeconds > 120 &&
        remainingSeconds > 0 &&
        remainingSeconds <= 120
      ) {
        softLandingPlayedRef.current = true;
        if (getSavedFocusPreferences().soundEnabled) {
          hapticsEngine.playSoftLandingChime();
        }
      }

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
  }, [status, timerMode, stopwatchStartEpochMs, stopwatchAccumulatedMs, targetEndTimeMs, pausedRemainingMs, totalDurationSeconds, completeTimer]);

  const startTimer = () => {
    // Plan §5.2: stopwatch resume simply re-anchors the count-up epoch.
    if (timerMode === 'stopwatch') {
      if (status === 'running') return;
      setStopwatchStartEpochMs(Date.now());
      setStatus('running');
      if (soundscape !== 'none' && !isMuted) {
        soundscapeEngine.setSoundscape(soundscape, soundscapeVolume);
      }
      return;
    }

    const now = Date.now();
    let targetEnd: number;

    if (status === 'paused' && pausedRemainingMs !== null) {
      targetEnd = now + pausedRemainingMs;
    } else {
      // Fresh session start only — a resume-from-pause must not re-arm the
      // once-per-session soft-landing chime (P5F3).
      softLandingPlayedRef.current = false;
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

    if (selectedTaskId && activeTask && activeTask.status === 'todo') {
      dataService.tasks.updateTask(selectedTaskId, { status: 'in_progress' }).catch((err) => {
        console.warn('Failed to set task in_progress on focus start:', err);
      });
    }
  };

  const pauseTimer = () => {
    if (status !== 'running') return;

    // Plan §5.2: freeze the stopwatch by banking elapsed time.
    if (timerMode === 'stopwatch') {
      if (stopwatchStartEpochMs === null) return;
      const now = Date.now();
      setStopwatchAccumulatedMs((prev) => prev + (now - stopwatchStartEpochMs));
      setStopwatchStartEpochMs(null);
      soundscapeEngine.stop();
      setStatus('paused');
      return;
    }

    if (targetEndTimeMs === null) return;
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
    clearInterruptions();
    softLandingPlayedRef.current = false;
    setTimerMode('countdown');
    setStopwatchStartEpochMs(null);
    setStopwatchAccumulatedMs(0);
    setStopwatchElapsedSeconds(0);
    // Plan §5.1: a new session re-runs the pre-session energy check-in.
    setPreSessionEnergy(null);
  };

  const cancelTimer = () => {
    soundscapeEngine.stop();
    setStatus('cancelled');
    setSecondsRemaining(totalDurationSeconds);
    setTargetEndTimeMs(null);
    setPausedRemainingMs(null);
    setCheckpointAcknowledged(false);
    setParkedThoughts([]);
    clearInterruptions();
    softLandingPlayedRef.current = false;
    setTimerMode('countdown');
    setStopwatchStartEpochMs(null);
    setStopwatchAccumulatedMs(0);
    setStopwatchElapsedSeconds(0);
    setPreSessionEnergy(null);
    addToast({ title: 'Session cancelled', description: 'Session was not logged.', type: 'info' });
  };

  // Plan §5.2: launch a count-up stopwatch bound to a subject in one tap —
  // no preset or modal configuration required. Deliberately a plain function
  // so the guards below always see fresh timer state.
  const startQuickStopwatch = (subjectId: string) => {
    // P5F2: an active stopwatch is never silently discarded — tapping the same
    // subject's stopwatch toggles pause/resume; a different subject is ignored.
    if (timerMode === 'stopwatch' && (status === 'running' || status === 'paused')) {
      if (selectedSubjectId === subjectId) {
        if (status === 'running') {
          pauseTimer();
        } else {
          startTimer();
        }
      }
      return;
    }

    const subject = subjects.find((s) => s.id === subjectId);
    setTimerMode('stopwatch');
    setSelectedSubjectId(subjectId);
    setFocusTitle(subject ? `Quick Stopwatch: ${subject.name}` : 'Quick Stopwatch Session');
    // P5F1: keep the previous countdown duration intact so Reset returns to a
    // valid idle countdown instead of a zero-length instant-complete one.
    setSecondsRemaining(totalDurationSeconds);
    setTargetEndTimeMs(null);
    setPausedRemainingMs(null);
    setStopwatchAccumulatedMs(0);
    setStopwatchElapsedSeconds(0);
    setStopwatchStartEpochMs(Date.now());
    setCheckpointAcknowledged(false);
    setParkedThoughts([]);
    // P5F4: stopwatch sessions have no pre-session check-in — clear stale values.
    setPreSessionEnergy(null);
    softLandingPlayedRef.current = false;
    setStatus('running');
  };

  const selectPreset = useCallback((newPreset: FocusPreset, customMinutes?: number) => {
    const savedPrefs = getSavedFocusPreferences();
    setStatus('idle');
    setPresetState(newPreset);
    let sec = savedPrefs.defaultFocusDurationMinutes * 60;
    if (newPreset === 'deep_flow') sec = 50 * 60;
    if (newPreset === 'short_break') sec = savedPrefs.defaultBreakDurationMinutes * 60;
    if (newPreset === 'custom' && customMinutes) sec = customMinutes * 60;

    setTotalDurationSeconds(sec);
    setSecondsRemaining(sec);
    setTargetEndTimeMs(null);
    setPausedRemainingMs(null);
    setCheckpointAcknowledged(false);
    // Choosing a preset returns the timer to normal countdown semantics.
    setTimerMode('countdown');
    setStopwatchStartEpochMs(null);
    setStopwatchAccumulatedMs(0);
    setStopwatchElapsedSeconds(0);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePrefsUpdate = () => {
      if (status === 'idle') {
        const savedPrefs = getSavedFocusPreferences();
        if (preset === 'pomodoro') {
          const sec = savedPrefs.defaultFocusDurationMinutes * 60;
          setTotalDurationSeconds(sec);
          setSecondsRemaining(sec);
        } else if (preset === 'short_break') {
          const sec = savedPrefs.defaultBreakDurationMinutes * 60;
          setTotalDurationSeconds(sec);
          setSecondsRemaining(sec);
        }
      }
    };
    window.addEventListener('solis:preferences-updated', handlePrefsUpdate);
    return () => window.removeEventListener('solis:preferences-updated', handlePrefsUpdate);
  }, [status, preset]);

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
    internalInterruptionsCount?: number;
    externalInterruptionsCount?: number;
    notes?: string;
    synthesizeNote: boolean;
    completeLinkedTask?: boolean;
    completePlanItem?: boolean;
  }) => {
    try {
      const finalInternal = data.internalInterruptionsCount ?? internalInterruptionsCount;
      const finalExternal = data.externalInterruptionsCount ?? externalInterruptionsCount;
      const finalTotal = data.interruptionsCount ?? (finalInternal + finalExternal);

      const savedFocusSession = await dataService.focus.saveFocusSession({
        mode: timerMode === 'stopwatch' ? 'stopwatch' : preset === 'pomodoro' ? 'pomodoro' : preset === 'deep_flow' ? 'deep_flow' : 'custom_timer',
        durationMinutes: completedSessionMinutes,
        subjectId: selectedSubjectId || undefined,
        subjectName: selectedSubject?.name,
        planItemId: selectedPlanItemId || undefined,
        taskId: selectedTaskId || undefined,
        topic: focusTitle || 'Deep Focus Pod Session',
        title: focusTitle || 'Deep Focus Pod Session',
        completed: true,
        interruptionsCount: Math.max(finalTotal, parkedThoughts.length),
        internalInterruptionsCount: finalInternal,
        externalInterruptionsCount: finalExternal,
        interruptionsLog: interruptionsLog.length > 0 ? interruptionsLog : undefined,
        flowQuality: data.flowQuality,
        soundscapeType: soundscape,
        targetOutcome: targetOutcome || undefined,
        // Plan §5.1: persist the 3-tap pre-session energy calibration.
        preSessionEnergy: preSessionEnergy || undefined,
        notes: data.notes,
        parkedThoughts: parkedThoughts.length > 0 ? parkedThoughts : undefined
      });

      // Focus Session → Study Log auto-bridge (plan §1.5): every submitted
      // reflection also logs a canonical StudySession linked back to the
      // FocusSession, with subject, duration, retention rating (1–5), notes,
      // and the covered topic — eliminating manual double-entry.
      if (selectedSubjectId) {
        try {
          const rating = (Math.min(5, Math.max(1, Math.round(data.flowQuality))) as 1 | 2 | 3 | 4 | 5) || 4;
          await dataService.study.logSession({
            subjectId: selectedSubjectId,
            subjectName: selectedSubject?.name || 'General Study',
            planItemId: selectedPlanItemId || undefined,
            focusSessionId: savedFocusSession?.id,
            type: preset === 'deep_flow' ? 'deep_study' : 'active_recall',
            durationMinutes: completedSessionMinutes,
            topicsCovered: focusTitle ? [focusTitle] : [],
            notes: data.notes || undefined,
            retentionRating: rating,
            completedAt: new Date().toISOString()
          });

          // Check if there is an unstudied syllabus topic matching this focus title and advance it to 'learning'
          if (focusTitle && focusTitle.trim()) {
            try {
              const subjectTopics = await dataService.study.getTopics(selectedSubjectId);
              const trimmed = focusTitle.trim().toLowerCase();
              const matchedTopic = subjectTopics.find(
                (t) => t.title && t.title.trim().toLowerCase() === trimmed
              );
              if (matchedTopic && matchedTopic.masteryLevel === 'unstudied') {
                await dataService.study.updateTopic(matchedTopic.id, { masteryLevel: 'learning' });
              }
            } catch {
              // Non-critical topic progression catch
            }
          }
        } catch (studyErr) {
          console.error('Failed to sync study session from focus:', studyErr);
        }
      }

      // Update linked task progress and/or completion
      if (selectedTaskId) {
        try {
          const currentCompletedMinutes = activeTask?.completedMinutes || 0;
          const nextCompletedMinutes = currentCompletedMinutes + completedSessionMinutes;
          if (data.completeLinkedTask) {
            await dataService.tasks.updateTask(selectedTaskId, {
              status: 'completed',
              completedMinutes: nextCompletedMinutes,
              completedAt: new Date().toISOString()
            });
            addToast({
              title: 'Task Completed',
              description: `"${activeTask?.title || 'Linked task'}" marked complete.`,
              type: 'success'
            });
          } else {
            await dataService.tasks.updateTask(selectedTaskId, {
              completedMinutes: nextCompletedMinutes,
              status: 'in_progress'
            });
          }
        } catch (err) {
          console.error('Failed to update linked task progress:', err);
        }
      }

      // Update linked study plan item if requested
      if (data.completePlanItem && selectedPlanItemId) {
        try {
          await dataService.study.updatePlanItem(selectedPlanItemId, { completed: true });
        } catch (err) {
          console.error('Failed to complete study plan item:', err);
        }
      }

      // Update linked time block progress and/or completion
      if (selectedBlockId) {
        try {
          await dataService.tasks.updateTimeBlock(selectedBlockId, {
            status: data.completeLinkedTask ? 'completed' : 'partial',
            actualMinutes: completedSessionMinutes,
            progressPercent: data.completeLinkedTask ? 100 : 50,
            reflection: data.notes || undefined
          });
        } catch (err) {
          console.error('Failed to update linked time block after focus session:', err);
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
      clearInterruptions();
      setSelectedTaskIdState('');
      setSelectedBlockIdState('');
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
    timerMode,
    stopwatchElapsedSeconds,
    focusTitle,
    targetOutcome,
    selectedSubjectId,
    selectedPlanItemId,
    selectedTaskId,
    selectedBlockId,
    soundscape,
    soundscapeVolume,
    isMuted,
    checkpointAcknowledged,
    isReflectionModalOpen,
    completedSessionMinutes,
    preSessionEnergy,
    subjects,
    selectedSubject,
    tasks,
    activeTask,
    parkedThoughts,
    interruptionsLog,
    internalInterruptionsCount,
    externalInterruptionsCount,

    startTimer,
    pauseTimer,
    resetTimer,
    cancelTimer,
    completeTimer,
    selectPreset,
    startQuickStopwatch,
    setFocusTitle,
    setTargetOutcome,
    setSelectedSubjectId,
    setSelectedPlanItemId,
    setSelectedTaskId,
    setSelectedBlockId: setSelectedBlockIdState,
    setSoundscape,
    setSoundscapeVolume,
    toggleMute,
    setCheckpointAcknowledged,
    setPreSessionEnergy,
    setIsReflectionModalOpen,
    testAudioChime,
    parkThought,
    clearParkedThoughts,
    recordInterruption,
    clearInterruptions,
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
