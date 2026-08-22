import { BaseEntity, ID } from './common';

export type FocusModeType = 'pomodoro' | 'deep_flow' | 'custom_timer' | 'stopwatch';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'break' | 'completed' | 'cancelled';

export type SoundscapeType = 'none' | 'pink_noise' | 'brown_noise' | 'binaural_alpha' | 'binaural_theta' | 'rain' | 'deep_drone';

export interface AmbientSound {
  id: string;
  name: string;
  category: 'nature' | 'white_noise' | 'rain' | 'binaural';
  volume: number;
}

export interface FocusSession extends BaseEntity {
  mode: FocusModeType;
  durationMinutes: number;
  breakDurationMinutes?: number;
  taskId?: ID;
  subjectId?: ID;
  subjectName?: string;
  planItemId?: ID;
  topic?: string;
  title: string;
  completed: boolean;
  interruptionsCount: number;
  notes?: string;
  flowQuality?: number; // 1 to 5
  soundscapeType?: SoundscapeType;
  targetOutcome?: string;
  checkpointCompleted?: boolean;
}

export interface FocusTimerState {
  status: TimerStatus;
  mode: FocusModeType;
  totalSeconds: number;
  remainingSeconds: number;
  currentInterval: number;
  totalIntervals: number;
  activeTaskId?: ID;
  activeSubjectId?: ID;
}
