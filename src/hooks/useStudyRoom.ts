import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase/supabaseClient';
import dataService from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import {
  StudyRoom,
  RoomParticipant,
  RoomMessage,
  RoomPresenceUser,
  ParticipantStatus,
  RoomTimelineEvent,
  RoomEventType
} from '../types/room';
import { playFocusCompletionChime } from '../utils/timer';
import { RealtimeChannel } from '@supabase/supabase-js';
import { mapStudyRoom } from '../services/supabase/supabaseMappers';

export interface UseStudyRoomResult {
  room: StudyRoom | null;
  participants: RoomParticipant[];
  presenceUsers: RoomPresenceUser[];
  messages: RoomMessage[];
  events: RoomTimelineEvent[];
  remainingSeconds: number;
  progressPercent: number;
  isHost: boolean;
  isLoading: boolean;
  isReconnecting: boolean;
  error: string | null;
  startTimer: (targetDuration?: number) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resetTimer: (targetDuration?: number) => Promise<void>;
  startBreak: (breakDurationSeconds?: number) => Promise<void>;
  endBreak: () => Promise<void>;
  updateStatus: (status: ParticipantStatus) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  sendTimelineEvent: (type: RoomEventType, message?: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  deleteRoom: () => Promise<void>;
  refreshRoom: () => Promise<void>;
}

export function computeAuthoritativeRemaining(room: StudyRoom | null): number {
  if (!room) return 0;

  const target = room.isBreak
    ? (room.breakDurationSeconds || 300)
    : (room.targetDurationSeconds || 1500);
  const pausedElapsed = room.pausedElapsedSeconds || 0;

  if (room.timerState === 'idle') {
    return target;
  }

  if (room.timerState === 'paused') {
    return Math.max(0, Math.ceil(target - pausedElapsed));
  }

  if (room.timerState === 'running') {
    if (!room.startedAt) return target;
    const startMs = new Date(room.startedAt).getTime();
    const elapsedSinceStart = (Date.now() - startMs) / 1000;
    const remaining = target - pausedElapsed - elapsedSinceStart;
    return Math.max(0, Math.ceil(remaining));
  }

  return target;
}

export function useStudyRoom(roomId: string | undefined): UseStudyRoomResult {
  const { user } = useAuth();
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [presenceUsers, setPresenceUsers] = useState<RoomPresenceUser[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [events, setEvents] = useState<RoomTimelineEvent[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(1500);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const hasTriggeredChimeRef = useRef<boolean>(false);
  const myStatusRef = useRef<ParticipantStatus>('focusing');
  const roomRef = useRef<StudyRoom | null>(null);

  // Sync ref to avoid stale closures in tick loops
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  const isHost = Boolean(user && room && user.id === room.hostId);

  // Fetch initial room data & messages & timeline events
  const fetchRoomData = useCallback(async () => {
    if (!roomId) return;
    try {
      setError(null);
      const [roomData, partsData, msgsData, eventsData] = await Promise.all([
        dataService.rooms.getRoom(roomId),
        dataService.rooms.getParticipants(roomId),
        dataService.rooms.getMessages(roomId),
        dataService.rooms.getRoomEvents(roomId)
      ]);

      if (!roomData) {
        setError('Study Sanctuary not found or has been closed.');
        setIsLoading(false);
        return;
      }

      setRoom(roomData);
      setParticipants(partsData);
      setMessages(msgsData);
      setEvents(eventsData || []);

      const initialRemaining = computeAuthoritativeRemaining(roomData);
      setRemainingSeconds(initialRemaining);
      if (roomData.timerState !== 'running' || initialRemaining > 0) {
        hasTriggeredChimeRef.current = false;
      }
    } catch (err: any) {
      console.error('Failed to load study room:', err);
      setError(err?.message || 'Unable to connect to Study Sanctuary.');
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  // High-performance Authoritative Epoch Timer calculation loop
  useEffect(() => {
    const updateRemaining = () => {
      const current = roomRef.current;
      if (!current) return;

      const remaining = computeAuthoritativeRemaining(current);
      setRemainingSeconds(remaining);

      // Trigger completion chime once when transitioning to 0 in running state
      if (current.timerState === 'running' && remaining === 0 && !hasTriggeredChimeRef.current) {
        hasTriggeredChimeRef.current = true;
        playFocusCompletionChime();
      } else if (remaining > 0) {
        hasTriggeredChimeRef.current = false;
      }
    };

    // Run immediately on dependency update
    updateRemaining();

    // 500ms heartbeat interval avoids clock jitter while remaining CPU efficient
    const interval = setInterval(updateRemaining, 500);
    return () => clearInterval(interval);
  }, [room?.timerState, room?.startedAt, room?.pausedElapsedSeconds, room?.targetDurationSeconds]);

  // Setup Real-time Channel (Supabase Realtime + Presence + Postgres Changes)
  useEffect(() => {
    if (!roomId || !user) return;

    // Join room in database as participant
    dataService.rooms.joinRoom(roomId, myStatusRef.current).catch((err) => {
      console.warn('Auto-join participant error:', err);
    });

    if (!isSupabaseConfigured()) {
      // Development Mock Channel fallback
      const unsubscribe = dataService.subscribe(() => {
        fetchRoomData();
      });
      return () => {
        unsubscribe();
      };
    }

    const channelName = `room:${roomId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id
        }
      }
    });

    channelRef.current = channel;

    // 1. Listen for Presence State Changes
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const usersList: RoomPresenceUser[] = [];
      Object.keys(state).forEach((key) => {
        const presences = state[key] as any[];
        if (presences && presences.length > 0) {
          const latest = presences[presences.length - 1];
          usersList.push({
            userId: latest.userId || key,
            name: latest.name || 'Solis Scholar',
            status: latest.status || 'focusing',
            joinedAt: latest.joinedAt || new Date().toISOString()
          });
        }
      });
      setPresenceUsers(usersList);
    });

    // 2. Listen for Postgres Changes on study_rooms
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'study_rooms',
        filter: `id=eq.${roomId}`
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          setError('The host has closed this Study Sanctuary.');
          setRoom(null);
          return;
        }
        if (payload.new) {
          setRoom((prev) => {
            const mapped = mapStudyRoom(payload.new, prev?.hostName, prev?.participantsCount);
            return {
              ...prev,
              ...mapped,
              subjectName: prev?.subjectName || mapped.subjectName
            };
          });
        }
      }
    );

    // 3. Listen for Postgres Changes on room_messages
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'room_messages',
        filter: `room_id=eq.${roomId}`
      },
      async (payload) => {
        if (payload.new) {
          // Fetch user profile name for incoming message if needed
          const newMsgRow = payload.new as any;
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', newMsgRow.user_id)
            .maybeSingle();

          const newMsg: RoomMessage = {
            id: newMsgRow.id,
            roomId: newMsgRow.room_id,
            userId: newMsgRow.user_id,
            userName: profile?.name || 'Solis Scholar',
            content: newMsgRow.content,
            createdAt: newMsgRow.created_at
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      }
    );

    // 4. Listen for Postgres Changes on room_participants
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'room_participants',
        filter: `room_id=eq.${roomId}`
      },
      () => {
        dataService.rooms.getParticipants(roomId).then(setParticipants).catch(console.error);
      }
    );

    // 5. Listen for Postgres Changes on study_room_events
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'study_room_events',
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        if (payload.new) {
          const evRow = payload.new as any;
          const mapped: RoomTimelineEvent = {
            id: evRow.id,
            roomId: evRow.room_id,
            userId: evRow.user_id,
            userName: evRow.user_name || 'Scholar',
            eventType: evRow.event_type,
            message: evRow.message,
            createdAt: evRow.created_at
          };
          setEvents((prev) => (prev.some((e) => e.id === mapped.id) ? prev : [...prev, mapped]));
        }
      }
    );

    // Subscribe to the channel & track initial presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsReconnecting(false);
        await channel.track({
          userId: user.id,
          name: user.name || 'Solis Scholar',
          status: myStatusRef.current,
          joinedAt: new Date().toISOString()
        });
      } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
        setIsReconnecting(true);
      } else if (status === 'CLOSED') {
        setIsReconnecting(true);
      }
    });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, user, fetchRoomData]);

  // Actions
  const startTimer = useCallback(
    async (targetDuration?: number) => {
      if (!roomId) return;
      try {
        const updated = await dataService.rooms.updateTimerState(roomId, 'running', targetDuration);
        setRoom(updated);
        await dataService.rooms.sendRoomEvent(roomId, 'session_start', `Host started session timer (${Math.round((targetDuration || updated.targetDurationSeconds) / 60)}m)`);
      } catch (err: any) {
        console.error('Failed to start timer:', err);
        setError(err?.message || 'Only the room host can start the session timer.');
      }
    },
    [roomId]
  );

  const pauseTimer = useCallback(async () => {
    if (!roomId) return;
    try {
      const updated = await dataService.rooms.updateTimerState(roomId, 'paused');
      setRoom(updated);
      await dataService.rooms.sendRoomEvent(roomId, 'session_pause', 'Session timer paused.');
    } catch (err: any) {
      console.error('Failed to pause timer:', err);
      setError(err?.message || 'Only the room host can pause the session timer.');
    }
  }, [roomId]);

  const resetTimer = useCallback(
    async (targetDuration?: number) => {
      if (!roomId) return;
      try {
        const updated = await dataService.rooms.updateTimerState(roomId, 'idle', targetDuration);
        setRoom(updated);
      } catch (err: any) {
        console.error('Failed to reset timer:', err);
        setError(err?.message || 'Only the room host can reset the session timer.');
      }
    },
    [roomId]
  );

  const startBreak = useCallback(
    async (breakSeconds?: number) => {
      if (!roomId) return;
      try {
        const updated = await dataService.rooms.startBreak(roomId, breakSeconds);
        setRoom(updated);
        await dataService.rooms.sendRoomEvent(roomId, 'break_start', `Intermission started (${Math.round((breakSeconds || 300) / 60)}m)`);
      } catch (err: any) {
        console.error('Failed to start break:', err);
        setError(err?.message || 'Only the room host can start break mode.');
      }
    },
    [roomId]
  );

  const endBreak = useCallback(async () => {
    if (!roomId) return;
    try {
      const updated = await dataService.rooms.endBreak(roomId);
      setRoom(updated);
      await dataService.rooms.sendRoomEvent(roomId, 'break_end', 'Intermission ended. Deep focus resumed.');
    } catch (err: any) {
      console.error('Failed to end break:', err);
      setError(err?.message || 'Could not resume from break.');
    }
  }, [roomId]);

  const sendTimelineEvent = useCallback(
    async (type: RoomEventType, message?: string) => {
      if (!roomId) return;
      try {
        const ev = await dataService.rooms.sendRoomEvent(roomId, type, message);
        setEvents((prev) => (prev.some((e) => e.id === ev.id) ? prev : [...prev, ev]));
      } catch (err: any) {
        console.error('Failed to send room event:', err);
      }
    },
    [roomId]
  );

  const updateStatus = useCallback(
    async (status: ParticipantStatus) => {
      if (!roomId || !user) return;
      myStatusRef.current = status;
      try {
        const updated = await dataService.rooms.updateParticipantStatus(roomId, status);
        setParticipants((prev) =>
          prev.map((p) => (p.userId === user.id ? { ...p, status: updated.status } : p))
        );
        if (channelRef.current) {
          await channelRef.current.track({
            userId: user.id,
            name: user.name || 'Solis Scholar',
            status,
            joinedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Failed to update status:', err);
      }
    },
    [roomId, user]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!roomId || !content.trim()) return;
      try {
        const msg = await dataService.rooms.sendMessage(roomId, content);
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } catch (err: any) {
        console.error('Failed to send message:', err);
        throw err;
      }
    },
    [roomId]
  );

  const leaveRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      await dataService.rooms.leaveRoom(roomId);
    } catch (err) {
      console.error('Failed to leave room:', err);
    }
  }, [roomId]);

  const deleteRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      await dataService.rooms.deleteRoom(roomId);
    } catch (err: any) {
      console.error('Failed to delete room:', err);
      throw err;
    }
  }, [roomId]);

  const targetDuration = room?.targetDurationSeconds || 1500;
  const progressPercent = targetDuration > 0
    ? Math.min(100, Math.max(0, ((targetDuration - remainingSeconds) / targetDuration) * 100))
    : 0;

  return {
    room,
    participants,
    presenceUsers: presenceUsers.length > 0 ? presenceUsers : (participants as unknown as RoomPresenceUser[]),
    messages,
    events,
    remainingSeconds,
    progressPercent,
    isHost,
    isLoading,
    isReconnecting,
    error,
    startTimer,
    pauseTimer,
    resetTimer,
    startBreak,
    endBreak,
    updateStatus,
    sendMessage,
    sendTimelineEvent,
    leaveRoom,
    deleteRoom,
    refreshRoom: fetchRoomData
  };
}
