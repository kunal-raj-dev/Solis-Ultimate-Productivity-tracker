import { IRoomService } from '../../api.interface';
import {
  StudyRoom,
  RoomParticipant,
  RoomMessage,
  CreateRoomPayload,
  RoomTimerState,
  ParticipantStatus,
  RoomTimelineEvent,
  RoomEventType,
  RoomReflection
} from '../../../types/room';
import { mapStudyRoom, mapRoomParticipant, mapRoomMessage, mapRoomTimelineEvent, mapRoomReflection } from '../supabaseMappers';

import { queryCache } from '../../cache';
import { SupabaseServiceContext } from './types';

export class SupabaseRoomsService implements IRoomService {
  constructor(private ctx: SupabaseServiceContext) {}

  getRooms = async (): Promise<StudyRoom[]> => {
    const cacheKey = 'study_rooms_list';
    const cached = queryCache.get<StudyRoom[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.ctx.client
      .from('study_rooms')
      .select(`
        *,
        profiles:host_id (id, name),
        room_participants (user_id)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const result = (data || []).map((row: any) =>
      mapStudyRoom(row, row.profiles?.name, row.room_participants ? row.room_participants.length : 0)
    );

    queryCache.set(cacheKey, result);
    return result;
  };

  getRoom = async (roomId: string): Promise<StudyRoom | null> => {
    const { data, error } = await this.ctx.client
      .from('study_rooms')
      .select(`
        *,
        profiles:host_id (id, name),
        room_participants (user_id)
      `)
      .eq('id', roomId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapStudyRoom(data, data.profiles?.name, data.room_participants ? data.room_participants.length : 0);
  };

  getRoomByCode = async (code: string): Promise<StudyRoom | null> => {
    const clean = code.trim().toUpperCase();
    const { data, error } = await this.ctx.client
      .from('study_rooms')
      .select(`
        *,
        profiles:host_id (id, name),
        room_participants (user_id)
      `)
      .ilike('room_code', clean)
      .maybeSingle();

    if (error || !data) return null;
    return mapStudyRoom(data, data.profiles?.name, data.room_participants ? data.room_participants.length : 0);
  };

  createRoom = async (payload: CreateRoomPayload): Promise<StudyRoom> => {
    const userId = await this.ctx.getUserId();
    const duration = payload.targetDurationSeconds && payload.targetDurationSeconds > 0
      ? payload.targetDurationSeconds
      : 1500;
    const generatedCode = payload.roomCode || `SOL${Math.floor(100 + Math.random() * 900)}`;

    const { data, error } = await this.ctx.client
      .from('study_rooms')
      .insert({
        host_id: userId,
        room_code: generatedCode,
        title: payload.title.trim(),
        subject_id: payload.subjectId || null,
        topic: payload.topic || null,
        session_type: payload.sessionType || 'deep_focus',
        shared_objective: payload.sharedObjective?.trim() || null,
        target_duration_seconds: duration,
        break_duration_seconds: payload.breakDurationSeconds || 300,
        is_break: false,
        is_private: payload.isPrivate ?? false,
        timer_state: 'idle',
        paused_elapsed_seconds: 0
      })
      .select(`
        *,
        profiles:host_id (id, name)
      `)
      .single();

    if (error || !data) throw error || new Error('Failed to create study room');

    // Automatically join creator as focusing participant.
    // joined_at is intentionally omitted: the column default stamps the first
    // join and a conflict-update leaves it untouched — it is the Phase 6.2
    // "oldest remaining participant" host-election key and must never move.
    await this.ctx.client
      .from('room_participants')
      .upsert({
        room_id: data.id,
        user_id: userId,
        status: 'focusing'
      });

    // Record creation event in room timeline
    try {
      await this.ctx.client
        .from('study_room_events')
        .insert({
          room_id: data.id,
          user_id: userId,
          user_name: data.profiles?.name || 'Host',
          event_type: 'session_start',
          message: `Sanctuary created: ${payload.title}`
        });
    } catch (e) {
      // Non-critical event insert error
    }

    queryCache.invalidate('study_rooms_list');
    this.ctx.notify();
    return mapStudyRoom(data, data.profiles?.name, 1);
  };


  updateTimerState = async (
    roomId: string,
    newState: RoomTimerState,
    targetDuration?: number
  ): Promise<StudyRoom> => {
    // 1. Fetch current room state for epoch calculation
    const { data: currentRoom, error: fetchErr } = await this.ctx.client
      .from('study_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (fetchErr || !currentRoom) throw fetchErr || new Error('Study room not found');

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (newState === 'paused') {
      let additionalElapsed = 0;
      if (currentRoom.timer_state === 'running' && currentRoom.started_at) {
        const startMs = new Date(currentRoom.started_at).getTime();
        additionalElapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      }
      updatePayload.timer_state = 'paused';
      updatePayload.paused_elapsed_seconds = (currentRoom.paused_elapsed_seconds || 0) + additionalElapsed;
      updatePayload.started_at = null;
    } else if (newState === 'running') {
      updatePayload.timer_state = 'running';
      updatePayload.started_at = new Date().toISOString();
      if (targetDuration && targetDuration > 0) {
        updatePayload.target_duration_seconds = targetDuration;
        updatePayload.paused_elapsed_seconds = 0;
      } else if (currentRoom.timer_state === 'idle' || (currentRoom.paused_elapsed_seconds || 0) >= (currentRoom.target_duration_seconds || 1500)) {
        updatePayload.paused_elapsed_seconds = 0;
      }
    } else if (newState === 'idle') {
      updatePayload.timer_state = 'idle';
      updatePayload.started_at = null;
      updatePayload.paused_elapsed_seconds = 0;
      if (targetDuration && targetDuration > 0) {
        updatePayload.target_duration_seconds = targetDuration;
      }
    }

    const { data, error } = await this.ctx.client
      .from('study_rooms')
      .update(updatePayload)
      .eq('id', roomId)
      .select(`
        *,
        profiles:host_id (id, name),
        room_participants (user_id)
      `)
      .single();

    if (error || !data) throw error || new Error('Failed to update room timer state');

    queryCache.invalidate('study_rooms_list');
    this.ctx.notify();
    return mapStudyRoom(data, data.profiles?.name, data.room_participants ? data.room_participants.length : 0);
  };

  joinRoom = async (roomId: string, status: ParticipantStatus = 'focusing'): Promise<RoomParticipant> => {
    const userId = await this.ctx.getUserId();

    // joined_at is intentionally omitted from the upsert (see createRoom):
    // rejoining must not reset the Phase 6.2 host-election key.
    const { data, error } = await this.ctx.client
      .from('room_participants')
      .upsert(
        {
          room_id: roomId,
          user_id: userId,
          status
        },
        { onConflict: 'room_id,user_id' }
      )
      .select(`
        *,
        profiles:user_id (id, name, email)
      `)
      .single();

    if (error || !data) throw error || new Error('Failed to join study room');

    this.ctx.notify();
    return mapRoomParticipant(data, data.profiles?.name, data.profiles?.email);
  };

  leaveRoom = async (roomId: string): Promise<boolean> => {
    const userId = await this.ctx.getUserId();

    const { error } = await this.ctx.client
      .from('room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) throw error;
    this.ctx.notify();
    return true;
  };

  updateParticipantStatus = async (
    roomId: string,
    status: ParticipantStatus
  ): Promise<RoomParticipant> => {
    const userId = await this.ctx.getUserId();

    const { data, error } = await this.ctx.client
      .from('room_participants')
      .update({ status })
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .select(`
        *,
        profiles:user_id (id, name, email)
      `)
      .single();

    if (error || !data) throw error || new Error('Failed to update participant status');

    this.ctx.notify();
    return mapRoomParticipant(data, data.profiles?.name, data.profiles?.email);
  };

  getParticipants = async (roomId: string): Promise<RoomParticipant[]> => {
    const { data, error } = await this.ctx.client
      .from('room_participants')
      .select(`
        *,
        profiles:user_id (id, name, email)
      `)
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) =>
      mapRoomParticipant(row, row.profiles?.name, row.profiles?.email)
    );
  };

  getMessages = async (roomId: string, limit = 100): Promise<RoomMessage[]> => {
    const { data, error } = await this.ctx.client
      .from('room_messages')
      .select(`
        *,
        profiles:user_id (id, name)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((row: any) => mapRoomMessage(row, row.profiles?.name));
  };

  sendMessage = async (roomId: string, content: string): Promise<RoomMessage> => {
    const userId = await this.ctx.getUserId();

    const { data, error } = await this.ctx.client
      .from('room_messages')
      .insert({
        room_id: roomId,
        user_id: userId,
        content: content.trim()
      })
      .select(`
        *,
        profiles:user_id (id, name)
      `)
      .single();

    if (error || !data) throw error || new Error('Failed to send room message');

    return mapRoomMessage(data, data.profiles?.name);
  };

  startBreak = async (roomId: string, breakDurationSeconds?: number): Promise<StudyRoom> => {
    const updatePayload: Record<string, any> = {
      is_break: true,
      timer_state: 'paused',
      updated_at: new Date().toISOString()
    };
    if (breakDurationSeconds && breakDurationSeconds > 0) {
      updatePayload.break_duration_seconds = breakDurationSeconds;
    }

    const { data, error } = await this.ctx.client
      .from('study_rooms')
      .update(updatePayload)
      .eq('id', roomId)
      .select(`*, profiles:host_id (id, name), room_participants (user_id)`)
      .single();

    if (error || !data) throw error || new Error('Failed to start break');

    const userId = await this.ctx.getUserId();
    try {
      await this.ctx.client.from('study_room_events').insert({
        room_id: roomId,
        user_id: userId,
        event_type: 'break_start',
        message: `Group break started (${Math.round((data.break_duration_seconds || 300) / 60)}m)`
      });
    } catch {}

    this.ctx.notify();
    return mapStudyRoom(data, data.profiles?.name, data.room_participants ? data.room_participants.length : 0);
  };

  endBreak = async (roomId: string): Promise<StudyRoom> => {
    const { data, error } = await this.ctx.client
      .from('study_rooms')
      .update({ is_break: false, updated_at: new Date().toISOString() })
      .eq('id', roomId)
      .select(`*, profiles:host_id (id, name), room_participants (user_id)`)
      .single();

    if (error || !data) throw error || new Error('Failed to end break');

    const userId = await this.ctx.getUserId();
    try {
      await this.ctx.client.from('study_room_events').insert({
        room_id: roomId,
        user_id: userId,
        event_type: 'break_end',
        message: 'Group break ended'
      });
    } catch {}

    this.ctx.notify();
    return mapStudyRoom(data, data.profiles?.name, data.room_participants ? data.room_participants.length : 0);
  };

  getRoomEvents = async (roomId: string): Promise<RoomTimelineEvent[]> => {
    const { data, error } = await this.ctx.client
      .from('study_room_events')
      .select(`*, profiles:user_id (name)`)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.warn('Could not query study_room_events:', error.message);
      return [];
    }

    return (data || []).map((row: any) => mapRoomTimelineEvent(row, row.profiles?.name || row.user_name));
  };

  sendRoomEvent = async (
    roomId: string,
    eventType: RoomEventType,
    message?: string
  ): Promise<RoomTimelineEvent> => {
    const userId = await this.ctx.getUserId();
    const { data: profile } = await this.ctx.client.from('profiles').select('name').eq('id', userId).maybeSingle();

    const { data, error } = await this.ctx.client
      .from('study_room_events')
      .insert({
        room_id: roomId,
        user_id: userId,
        user_name: profile?.name || 'Solis Scholar',
        event_type: eventType,
        message: message || null
      })
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to record room event');
    this.ctx.notify();
    return mapRoomTimelineEvent(data, profile?.name);
  };

  saveRoomReflection = async (reflection: Partial<RoomReflection>): Promise<RoomReflection> => {
    const userId = await this.ctx.getUserId();
    const { data: profile } = await this.ctx.client.from('profiles').select('name').eq('id', userId).maybeSingle();

    const { data, error } = await this.ctx.client
      .from('study_room_reflections')
      .insert({
        room_id: reflection.roomId,
        user_id: userId,
        user_name: profile?.name || 'Solis Scholar',
        room_title: reflection.roomTitle || 'Study Sanctuary',
        subject_id: reflection.subjectId || null,
        subject_name: reflection.subjectName || null,
        duration_seconds: reflection.durationSeconds || 1500,
        objective_achieved: reflection.objectiveAchieved ?? true,
        reflection_text: reflection.reflectionText?.trim() || 'Session concluded successfully.',
        next_step: reflection.nextStep?.trim() || null,
        retention_rating: reflection.retentionRating ?? 5
      })
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to save room reflection');

    // Also log study session in study history if duration >= 60 seconds
    if ((reflection.durationSeconds || 0) >= 60) {
      try {
        await this.ctx.client.from('study_sessions').insert({
          user_id: userId,
          subject_id: reflection.subjectId || null,
          subject_name: reflection.subjectName || reflection.roomTitle || 'Study Sanctuary',
          duration_minutes: Math.max(1, Math.round((reflection.durationSeconds || 0) / 60)),
          notes: reflection.reflectionText || 'Study Room Session Completed',
          retention_rating: reflection.retentionRating || 5
        });
      } catch (err) {
        console.warn('Could not auto-log study session:', err);
      }
    }

    this.ctx.notify();
    return mapRoomReflection(data, profile?.name, reflection.roomTitle);
  };

  getRoomReflections = async (roomId: string): Promise<RoomReflection[]> => {
    const { data, error } = await this.ctx.client
      .from('study_room_reflections')
      .select(`*, profiles:user_id (name)`)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not query study_room_reflections:', error.message);
      return [];
    }

    return (data || []).map((row: any) => mapRoomReflection(row, row.profiles?.name));
  };

  getUserRoomHistory = async (): Promise<RoomReflection[]> => {
    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('study_room_reflections')
      .select(`*, study_rooms (title)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not query user room reflections:', error.message);
      return [];
    }

    return (data || []).map((row: any) => mapRoomReflection(row, undefined, row.study_rooms?.title));
  };

  deleteRoom = async (roomId: string): Promise<boolean> => {
    const { error } = await this.ctx.client
      .from('study_rooms')
      .delete()
      .eq('id', roomId);

    if (error) throw error;

    queryCache.invalidate('study_rooms_list');
    this.ctx.notify();
    return true;
  };

  /**
   * Host failover (plan §6.2): the `study_rooms_update_host` RLS policy only
   * lets the current host update the row, so a remaining participant cannot
   * promote itself with a plain UPDATE. The SECURITY DEFINER RPC
   * `promote_next_study_room_host` performs the deterministic promotion
   * (oldest remaining participant by joined_at) after verifying the caller is
   * a participant and the host is genuinely gone.
   */
  promoteNextHost = async (roomId: string): Promise<StudyRoom | null> => {
    const { data: promoted, error: rpcError } = await this.ctx.client
      .rpc('promote_next_study_room_host', { p_room_id: roomId });

    if (rpcError) throw rpcError;
    if (!promoted || promoted.length === 0) return null;

    // Cache invalidation law: the RPC mutated the room, so invalidate BEFORE
    // the follow-up read below.
    queryCache.invalidate('study_rooms_list');

    const { data, error } = await this.ctx.client
      .from('study_rooms')
      .select(`
        *,
        profiles:host_id (id, name),
        room_participants (user_id)
      `)
      .eq('id', roomId)
      .single();

    if (error || !data) throw error || new Error('Failed to load promoted study room');

    this.ctx.notify();
    return mapStudyRoom(data, data.profiles?.name, data.room_participants ? data.room_participants.length : 0);
  };
}

