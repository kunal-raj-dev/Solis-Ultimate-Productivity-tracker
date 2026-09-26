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
  RoomTimerState,
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
  /** True when this client was auto-promoted to host after the host left (plan §6.2). */
  promotedToHost: boolean;
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

/**
 * Plan §6.2 Local Demo Sync: message envelope for the per-room
 * BroadcastChannel (`solis_room_${roomId}`) that mirrors host actions and
 * timer state across tabs in mock mode, where each tab holds its own
 * in-memory workspace.
 */
interface RoomSyncMessage {
  kind:
    | 'room_sync_request'
    | 'room_sync_state'
    | 'room_timer'
    | 'room_break'
    | 'room_join'
    | 'room_status'
    | 'room_message'
    | 'room_event';
  timerState?: RoomTimerState;
  isBreak?: boolean;
  targetDurationSeconds?: number;
  breakDurationSeconds?: number;
  startedAt?: string | null;
  pausedElapsedSeconds?: number;
  status?: ParticipantStatus;
  content?: string;
  eventType?: RoomEventType;
  message?: string;
  phase?: 'start' | 'end';
}

/**
 * Event types the data service itself records for timer/break/join
 * mutations. Applying such a mutation in a receiving demo tab makes that
 * service emit its own timeline entry, so these are never re-broadcast
 * (otherwise demo timelines would show every transition twice).
 */
const SERVICE_EMITTED_EVENT_TYPES: RoomEventType[] = [
  'session_start',
  'session_pause',
  'session_resume',
  'session_end',
  'break_start',
  'break_end'
];

/**
 * Pure diff for the demo sync handshake (plan §6.2): the fields of `msg`
 * that differ from `current` and should be adopted as local hook state.
 */
function collectSyncAdoption(current: StudyRoom, msg: RoomSyncMessage): Partial<StudyRoom> {
  const adopted: Partial<StudyRoom> = {};
  if (msg.timerState && msg.timerState !== current.timerState) {
    adopted.timerState = msg.timerState;
  }
  if (typeof msg.isBreak === 'boolean' && msg.isBreak !== current.isBreak) {
    adopted.isBreak = msg.isBreak;
  }
  if (msg.targetDurationSeconds && msg.targetDurationSeconds !== current.targetDurationSeconds) {
    adopted.targetDurationSeconds = msg.targetDurationSeconds;
  }
  if (msg.breakDurationSeconds && msg.breakDurationSeconds !== current.breakDurationSeconds) {
    adopted.breakDurationSeconds = msg.breakDurationSeconds;
  }
  if (msg.startedAt !== undefined && msg.startedAt !== current.startedAt) {
    adopted.startedAt = msg.startedAt;
  }
  if (typeof msg.pausedElapsedSeconds === 'number' && msg.pausedElapsedSeconds !== current.pausedElapsedSeconds) {
    adopted.pausedElapsedSeconds = msg.pausedElapsedSeconds;
  }
  return adopted;
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
  const [promotedToHost, setPromotedToHost] = useState<boolean>(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const hasTriggeredChimeRef = useRef<boolean>(false);
  const myStatusRef = useRef<ParticipantStatus>('focusing');
  const roomRef = useRef<StudyRoom | null>(null);
  // Plan §6.2: demo multi-tab sync channel + host failover latch.
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const hostFailoverAttemptedRef = useRef<boolean>(false);
  // Holds a room_sync_state reply that raced ahead of the initial fetch so
  // the late tab still converges instead of keeping its seed timer state.
  const pendingSyncStateRef = useRef<RoomSyncMessage | null>(null);

  // Sync ref to avoid stale closures in tick loops
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  const isHost = Boolean(
    room && (
      (typeof window !== 'undefined' && localStorage.getItem(`solis_created_room_${room.id}`) === 'true') ||
      (user && (
        user.id === room.hostId ||
        (user.name && room.hostName && user.name.trim().toLowerCase() === room.hostName.trim().toLowerCase()) ||
        (user.email && room.hostName && user.email.toLowerCase().startsWith(room.hostName.toLowerCase()))
      ))
    )
  );

  const userId = user?.id;
  const userName = user?.name || 'Solis Scholar';
  const userNameRef = useRef(userName);
  useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  // Reset per-room state when navigating between rooms.
  useEffect(() => {
    hostFailoverAttemptedRef.current = false;
    setPromotedToHost(false);
    pendingSyncStateRef.current = null;
  }, [roomId]);

  /**
   * Plan §6.2 Host Failover: when the host is no longer among the room
   * participants, the oldest remaining participant auto-promotes to host.
   * Every tab computes the same deterministic election, but only the elected
   * client performs the promotion (the data service call is idempotent and
   * no-ops if the host has returned).
   */
  const maybePromoteNextHost = useCallback(
    async (roomData: StudyRoom, parts: RoomParticipant[]) => {
      if (hostFailoverAttemptedRef.current) return;
      if (parts.length === 0) return;
      if (parts.some((p) => p.userId === roomData.hostId)) return;

      const oldest = [...parts].sort(
        (a, b) => a.joinedAt.localeCompare(b.joinedAt) || a.userId.localeCompare(b.userId)
      )[0];
      if (!userId || oldest.userId !== userId) return;

      try {
        const promoted = await dataService.rooms.promoteNextHost(roomData.id);
        // Latch only once the attempt has resolved: a transient failure must
        // keep auto-promotion available for the next participants refresh
        // instead of silently disabling it for the whole session.
        hostFailoverAttemptedRef.current = true;
        if (promoted) {
          setRoom(promoted);
          setPromotedToHost(true);
          // Calm, blame-free handover note in the room timeline.
          dataService.rooms
            .sendRoomEvent(roomData.id, 'nudge', `${userNameRef.current} is now hosting this session.`)
            .catch(() => {});
        }
      } catch (err) {
        console.warn('Host failover check failed:', err);
      }
    },
    // Depend on the primitive userId, never the user object: AuthContext
    // re-syncs a fresh user object on every repository event, and an object
    // dependency here re-ran the realtime effect (which re-joins the room)
    // in a self-sustaining join → notify → re-run loop.
    [userId]
  );

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

      // A room_sync_state reply can race ahead of this initial fetch (the
      // handshake fires on channel open). Adopt any buffered state now so the
      // late tab converges with the other tabs instead of keeping seed data.
      const pendingSync = pendingSyncStateRef.current;
      if (pendingSync) {
        pendingSyncStateRef.current = null;
        const adopted = collectSyncAdoption(roomData, pendingSync);
        if (Object.keys(adopted).length > 0) {
          setRoom({ ...roomData, ...adopted });
        }
      }

      maybePromoteNextHost(roomData, partsData).catch((err) => {
        console.warn('Host failover check error:', err);
      });
    } catch (err: any) {
      console.error('Failed to load study room:', err);
      setError(err?.message || 'Unable to connect to Study Sanctuary.');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, maybePromoteNextHost]);

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

  const broadcastRoomMessage = useCallback((msg: RoomSyncMessage) => {
    const channel = broadcastChannelRef.current;
    if (!channel) return;
    try {
      channel.postMessage(msg);
    } catch {
      // Channel already closed — demo sync silently disabled.
    }
  }, []);

  /**
   * Plan §6.2 Local Demo Sync: applies a mirror of another tab's room action
   * to this tab. Timer/break/status/message intents go through the canonical
   * data service (so local mock state, events and notifications stay
   * consistent); a sync handshake adopts the live timer state as local hook
   * state only, so a late-opening demo tab never restarts a running session.
   */
  const applyRemoteRoomMessage = useCallback(
    (msg: RoomSyncMessage) => {
      if (!msg || typeof msg !== 'object' || !roomId) return;
      const current = roomRef.current;

      switch (msg.kind) {
        case 'room_sync_request': {
          if (!current) return;
          broadcastRoomMessage({
            kind: 'room_sync_state',
            timerState: current.timerState,
            isBreak: current.isBreak,
            targetDurationSeconds: current.targetDurationSeconds,
            breakDurationSeconds: current.breakDurationSeconds,
            startedAt: current.startedAt,
            pausedElapsedSeconds: current.pausedElapsedSeconds
          });
          return;
        }

        case 'room_sync_state': {
          if (!current) {
            // The reply raced ahead of this tab's initial fetch — buffer it;
            // fetchRoomData adopts it as soon as the room exists.
            pendingSyncStateRef.current = msg;
            return;
          }
          const adopted = collectSyncAdoption(current, msg);
          if (Object.keys(adopted).length === 0) return;
          setRoom((prev) => (prev ? { ...prev, ...adopted } : prev));
          return;
        }

        case 'room_timer': {
          if (!msg.timerState || !current || current.timerState === msg.timerState) return;
          dataService.rooms
            .updateTimerState(roomId, msg.timerState, msg.targetDurationSeconds)
            .catch((err) => console.warn('Demo room sync (timer) failed:', err));
          return;
        }

        case 'room_break': {
          if (!current) return;
          if (msg.phase === 'start' && !current.isBreak) {
            dataService.rooms.startBreak(roomId, msg.breakDurationSeconds).catch((err) => {
              console.warn('Demo room sync (break) failed:', err);
            });
          } else if (msg.phase === 'end' && current.isBreak) {
            dataService.rooms.endBreak(roomId).catch((err) => {
              console.warn('Demo room sync (break) failed:', err);
            });
          }
          return;
        }

        case 'room_join': {
          dataService.rooms.joinRoom(roomId, msg.status || 'focusing').catch((err) => {
            console.warn('Demo room sync (join) failed:', err);
          });
          return;
        }

        case 'room_status': {
          if (!msg.status) return;
          dataService.rooms.updateParticipantStatus(roomId, msg.status).catch((err) => {
            console.warn('Demo room sync (status) failed:', err);
          });
          return;
        }

        case 'room_message': {
          if (!msg.content || !msg.content.trim()) return;
          dataService.rooms.sendMessage(roomId, msg.content).catch((err) => {
            console.warn('Demo room sync (message) failed:', err);
          });
          return;
        }

        case 'room_event': {
          if (!msg.eventType) return;
          dataService.rooms.sendRoomEvent(roomId, msg.eventType, msg.message).catch((err) => {
            console.warn('Demo room sync (event) failed:', err);
          });
          return;
        }
      }
    },
    [roomId, broadcastRoomMessage]
  );

  // Setup Real-time Channel (Supabase Realtime + Presence + Postgres Changes)
  useEffect(() => {
    if (!roomId || !userId) return;

    let isSubscribed = true;
    let reconnectTimeout: any = null;

    // Join room in database as participant
    dataService.rooms.joinRoom(roomId, myStatusRef.current).catch((err) => {
      console.warn('Auto-join participant error:', err);
    });

    if (!isSupabaseConfigured()) {
      // Development Mock Channel fallback
      const unsubscribe = dataService.subscribe(() => {
        fetchRoomData();
      });

      // Plan §6.2 Local Demo Sync: demo rooms live in per-tab in-memory
      // state, so a per-room BroadcastChannel mirrors presence (join/status)
      // and timer actions between every tab with the same room open.
      let demoChannel: BroadcastChannel | null = null;
      if (typeof BroadcastChannel !== 'undefined') {
        demoChannel = new BroadcastChannel(`solis_room_${roomId}`);
        demoChannel.onmessage = (evt: MessageEvent) => {
          applyRemoteRoomMessage(evt.data as RoomSyncMessage);
        };
        broadcastChannelRef.current = demoChannel;
        // Converge with tabs that are already in the room instead of
        // replaying this tab's local seed state.
        demoChannel.postMessage({ kind: 'room_sync_request' });
        broadcastRoomMessage({ kind: 'room_join', status: myStatusRef.current });
      }

      return () => {
        unsubscribe();
        if (demoChannel) {
          demoChannel.onmessage = null;
          demoChannel.close();
        }
        broadcastChannelRef.current = null;
      };
    }

    const channelName = `room:${roomId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId
        }
      }
    });

    channelRef.current = channel;

    // 1. Listen for Presence State Changes
    channel.on('presence', { event: 'sync' }, () => {
      if (!isSubscribed) return;
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
        if (!isSubscribed) return;
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
        if (!isSubscribed) return;
        if (payload.new) {
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
        if (!isSubscribed) return;
        dataService.rooms.getParticipants(roomId).then((p) => {
          if (!isSubscribed) return;
          setParticipants(p);
          // Plan §6.2: a participant change can reveal the host has left.
          const current = roomRef.current;
          if (current) {
            maybePromoteNextHost(current, p).catch((err) => {
              console.warn('Host failover check error:', err);
            });
          }
        }).catch(console.error);
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
        if (!isSubscribed) return;
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

    // Subscribe to the channel & track initial presence with debounced reconnection indicator
    channel.subscribe(async (status) => {
      if (!isSubscribed) return;

      if (status === 'SUBSCRIBED') {
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
        setIsReconnecting(false);
        try {
          await channel.track({
            userId,
            name: userNameRef.current,
            status: myStatusRef.current,
            joinedAt: new Date().toISOString()
          });
        } catch {
          // ignore tracking error
        }
      } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
        // Debounce: only show "reconnecting" if disconnected for at least 3 seconds
        if (!reconnectTimeout && isSubscribed) {
          reconnectTimeout = setTimeout(() => {
            if (isSubscribed) {
              setIsReconnecting(true);
            }
          }, 3000);
        }
      }
    });

    // 5-second polling synchronization fallback to ensure timer states and rooms remain authoritative
    const pollTimer = setInterval(() => {
      if (!isSubscribed) return;
      dataService.rooms.getRoom(roomId).then((r) => {
        if (r && isSubscribed) {
          setRoom((prev) => {
            if (!prev) return r;
            if (
              prev.timerState !== r.timerState ||
              prev.startedAt !== r.startedAt ||
              prev.pausedElapsedSeconds !== r.pausedElapsedSeconds ||
              prev.isBreak !== r.isBreak ||
              prev.targetDurationSeconds !== r.targetDurationSeconds
            ) {
              return { ...prev, ...r };
            }
            return prev;
          });
        }
      }).catch(() => {});
    }, 5000);

    return () => {
      isSubscribed = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(pollTimer);
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, userId, fetchRoomData, maybePromoteNextHost, applyRemoteRoomMessage]);

  // Actions
  const startTimer = useCallback(
    async (targetDuration?: number) => {
      if (!roomId) return;
      try {
        const updated = await dataService.rooms.updateTimerState(roomId, 'running', targetDuration);
        setRoom(updated);
        broadcastRoomMessage({
          kind: 'room_timer',
          timerState: 'running',
          targetDurationSeconds: targetDuration
        });
        await dataService.rooms.sendRoomEvent(roomId, 'session_start', `Host started session timer (${Math.round((targetDuration || updated.targetDurationSeconds) / 60)}m)`);
      } catch (err: any) {
        console.error('Failed to start timer:', err);
        setError(err?.message || 'Only the room host can start the session timer.');
      }
    },
    [roomId, broadcastRoomMessage]
  );

  const pauseTimer = useCallback(async () => {
    if (!roomId) return;
    try {
      const updated = await dataService.rooms.updateTimerState(roomId, 'paused');
      setRoom(updated);
      broadcastRoomMessage({ kind: 'room_timer', timerState: 'paused' });
      await dataService.rooms.sendRoomEvent(roomId, 'session_pause', 'Session timer paused.');
    } catch (err: any) {
      console.error('Failed to pause timer:', err);
      setError(err?.message || 'Only the room host can pause the session timer.');
    }
  }, [roomId, broadcastRoomMessage]);

  const resetTimer = useCallback(
    async (targetDuration?: number) => {
      if (!roomId) return;
      try {
        const updated = await dataService.rooms.updateTimerState(roomId, 'idle', targetDuration);
        setRoom(updated);
        broadcastRoomMessage({
          kind: 'room_timer',
          timerState: 'idle',
          targetDurationSeconds: targetDuration
        });
      } catch (err: any) {
        console.error('Failed to reset timer:', err);
        setError(err?.message || 'Only the room host can reset the session timer.');
      }
    },
    [roomId, broadcastRoomMessage]
  );

  const startBreak = useCallback(
    async (breakSeconds?: number) => {
      if (!roomId) return;
      try {
        const updated = await dataService.rooms.startBreak(roomId, breakSeconds);
        setRoom(updated);
        broadcastRoomMessage({
          kind: 'room_break',
          phase: 'start',
          breakDurationSeconds: breakSeconds
        });
        await dataService.rooms.sendRoomEvent(roomId, 'break_start', `Intermission started (${Math.round((breakSeconds || 300) / 60)}m)`);
      } catch (err: any) {
        console.error('Failed to start break:', err);
        setError(err?.message || 'Only the room host can start break mode.');
      }
    },
    [roomId, broadcastRoomMessage]
  );

  const endBreak = useCallback(async () => {
    if (!roomId) return;
    try {
      const updated = await dataService.rooms.endBreak(roomId);
      setRoom(updated);
      broadcastRoomMessage({ kind: 'room_break', phase: 'end' });
      await dataService.rooms.sendRoomEvent(roomId, 'break_end', 'Intermission ended. Deep focus resumed.');
    } catch (err: any) {
      console.error('Failed to end break:', err);
      setError(err?.message || 'Could not resume from break.');
    }
  }, [roomId, broadcastRoomMessage]);

  const sendTimelineEvent = useCallback(
    async (type: RoomEventType, message?: string) => {
      if (!roomId) return;
      try {
        const ev = await dataService.rooms.sendRoomEvent(roomId, type, message);
        setEvents((prev) => (prev.some((e) => e.id === ev.id) ? prev : [...prev, ev]));
        // Timer/break transitions are re-created by the receiving tab's own
        // service call, so only participant-driven events are mirrored.
        if (!SERVICE_EMITTED_EVENT_TYPES.includes(type)) {
          broadcastRoomMessage({ kind: 'room_event', eventType: type, message });
        }
      } catch (err: any) {
        console.error('Failed to send room event:', err);
      }
    },
    [roomId, broadcastRoomMessage]
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
        broadcastRoomMessage({ kind: 'room_status', status });
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
    [roomId, user, broadcastRoomMessage]
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
        broadcastRoomMessage({ kind: 'room_message', content });
      } catch (err: any) {
        console.error('Failed to send message:', err);
        throw err;
      }
    },
    [roomId, broadcastRoomMessage]
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
    promotedToHost,
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
