/**
 * Solis - Study Rooms & Real-Time Presence Types
 * Phase 2: Collaborative Study Sanctuary & Authoritative Synchronized Timer
 */

export type RoomTimerState = 'idle' | 'running' | 'paused';

export type ParticipantStatus = 'focusing' | 'break' | 'idle' | 'brainstorming';

export type RoomSessionType = 'deep_focus' | 'pomodoro' | 'exam_cram' | 'silent_reading' | 'code_review';

export interface StudyRoom {
  id: string;
  hostId: string;
  hostName?: string;
  roomCode?: string; // 6-character unique join code e.g. "SOL789"
  title: string;
  subjectId?: string;
  subjectName?: string;
  topic?: string;
  sessionType?: RoomSessionType;
  sharedObjective?: string;
  timerState: RoomTimerState;
  targetDurationSeconds: number;
  breakDurationSeconds?: number;
  isBreak?: boolean;
  isPrivate?: boolean;
  startedAt: string | null;
  pausedElapsedSeconds: number;
  createdAt: string;
  updatedAt: string;
  participantsCount?: number;
}

export interface RoomParticipant {
  roomId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  status: ParticipantStatus;
  joinedAt: string;
  personalObjective?: string;
  isReady?: boolean;
}

export type RoomEventType =
  | 'session_start'
  | 'session_pause'
  | 'session_resume'
  | 'break_start'
  | 'break_end'
  | 'session_end'
  | 'objective_achieved'
  | 'nudge'
  | 'reaction';

export interface RoomTimelineEvent {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  eventType: RoomEventType;
  message?: string;
  createdAt: string;
}

export interface RoomReflection {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  roomTitle: string;
  subjectId?: string;
  subjectName?: string;
  durationSeconds: number;
  objectiveAchieved: boolean;
  reflectionText: string;
  nextStep?: string;
  retentionRating?: number;
  createdAt: string;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  userId: string;
  userName?: string;
  content: string;
  createdAt: string;
}

export interface CreateRoomPayload {
  title: string;
  targetDurationSeconds?: number;
  breakDurationSeconds?: number;
  subjectId?: string;
  subjectName?: string;
  topic?: string;
  sessionType?: RoomSessionType;
  sharedObjective?: string;
  isPrivate?: boolean;
  roomCode?: string;
}

export interface RoomPresenceUser {
  userId: string;
  name: string;
  status: ParticipantStatus;
  joinedAt: string;
  personalObjective?: string;
  isReady?: boolean;
}

