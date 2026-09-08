/**
 * Solis - Study Rooms & Real-Time Presence Types
 * Phase 2: Collaborative Study Sanctuary & Authoritative Synchronized Timer
 */

export type RoomTimerState = 'idle' | 'running' | 'paused';

export type ParticipantStatus = 'focusing' | 'break' | 'idle';

export interface StudyRoom {
  id: string;
  hostId: string;
  hostName?: string;
  title: string;
  timerState: RoomTimerState;
  targetDurationSeconds: number;
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
}

export interface RoomPresenceUser {
  userId: string;
  name: string;
  status: ParticipantStatus;
  joinedAt: string;
}
