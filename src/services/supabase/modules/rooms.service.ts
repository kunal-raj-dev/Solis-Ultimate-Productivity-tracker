import { IRoomService } from '../../api.interface';
import { StudyRoom, RoomParticipant, RoomMessage, CreateRoomPayload, RoomTimerState, ParticipantStatus } from '../../../types/room';
import { mapStudyRoom, mapRoomParticipant, mapRoomMessage } from '../supabaseMappers';
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

  createRoom = async (payload: CreateRoomPayload): Promise<StudyRoom> => {
    const userId = await this.ctx.getUserId();
    const duration = payload.targetDurationSeconds && payload.targetDurationSeconds > 0
      ? payload.targetDurationSeconds
      : 1500;

    const { data, error } = await this.ctx.client
      .from('study_rooms')
      .insert({
        host_id: userId,
        title: payload.title.trim(),
        target_duration_seconds: duration,
        timer_state: 'idle',
        paused_elapsed_seconds: 0
      })
      .select(`
        *,
        profiles:host_id (id, name)
      `)
      .single();

    if (error || !data) throw error || new Error('Failed to create study room');

    // Automatically join creator as focusing participant
    await this.ctx.client
      .from('room_participants')
      .upsert({
        room_id: data.id,
        user_id: userId,
        status: 'focusing',
        joined_at: new Date().toISOString()
      });

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
      if (currentRoom.timer_state === 'idle') {
        updatePayload.paused_elapsed_seconds = 0;
        if (targetDuration && targetDuration > 0) {
          updatePayload.target_duration_seconds = targetDuration;
        }
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

    this.ctx.notify();
    return mapStudyRoom(data, data.profiles?.name, data.room_participants ? data.room_participants.length : 0);
  };

  joinRoom = async (roomId: string, status: ParticipantStatus = 'focusing'): Promise<RoomParticipant> => {
    const userId = await this.ctx.getUserId();

    const { data, error } = await this.ctx.client
      .from('room_participants')
      .upsert(
        {
          room_id: roomId,
          user_id: userId,
          status,
          joined_at: new Date().toISOString()
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

  deleteRoom = async (roomId: string): Promise<boolean> => {
    const { error } = await this.ctx.client
      .from('study_rooms')
      .delete()
      .eq('id', roomId);

    if (error) throw error;

    this.ctx.notify();
    return true;
  };
}
