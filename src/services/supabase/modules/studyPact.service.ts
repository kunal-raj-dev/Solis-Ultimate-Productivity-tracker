import { IStudyPactService } from '../../api.interface';
import {
  CloudStudyPact,
  CreateStudyPactPayload,
  StudyPactWeekSummary,
  generatePactInviteCode,
  getPactWeekWindow
} from '../../../types/studyPact';
import { mapStudyPact } from '../supabaseMappers';
import { queryCache } from '../../cache';
import { SupabaseServiceContext } from './types';

export class SupabaseStudyPactService implements IStudyPactService {
  constructor(private ctx: SupabaseServiceContext) {}

  getPacts = async (): Promise<CloudStudyPact[]> => {
    const userId = await this.ctx.getUserId();
    const cacheKey = `study_pacts_list_${userId}`;
    const cached = queryCache.get<CloudStudyPact[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.ctx.client
      .from('study_pacts')
      .select('*')
      .or(`created_by.eq.${userId},partner_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const result = (data || []).map(mapStudyPact);
    queryCache.set(cacheKey, result);
    return result;
  };

  getActivePact = async (): Promise<CloudStudyPact | null> => {
    const pacts = await this.getPacts();
    return pacts.find((p) => p.status === 'active' || p.status === 'pending') || null;
  };

  getPactById = async (id: string): Promise<CloudStudyPact | null> => {
    const { data, error } = await this.ctx.client
      .from('study_pacts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapStudyPact(data);
  };

  getPactByInviteCode = async (code: string): Promise<CloudStudyPact | null> => {
    const cleanCode = code.trim().toUpperCase();
    const { data, error } = await this.ctx.client
      .from('study_pacts')
      .select('*')
      .eq('invite_code', cleanCode)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapStudyPact(data);
  };

  createPact = async (payload: CreateStudyPactPayload): Promise<CloudStudyPact> => {
    const userId = await this.ctx.getUserId();
    const window = getPactWeekWindow();
    const inviteCode = payload.inviteCode || generatePactInviteCode();

    // Look up creator's profile display name
    let creatorName = 'Scholar';
    try {
      const { data: profile } = await this.ctx.client
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .maybeSingle();
      if (profile?.name) creatorName = profile.name;
    } catch {
      // Fallback to default
    }

    const newPactRow = {
      created_by: userId,
      creator_name: creatorName,
      partner_name: payload.partnerName?.trim() || 'Pending Peer',
      invite_code: inviteCode,
      shared_objective: payload.sharedObjective?.trim() || null,
      subject_id: payload.subjectId || null,
      subject_name: payload.subjectName || null,
      week_start_date: window.startKey,
      week_end_date: window.endKey,
      creator_target_minutes: Math.max(15, Math.round(payload.myWeeklyTargetMinutes)),
      partner_target_minutes: Math.max(15, Math.round(payload.partnerWeeklyTargetMinutes)),
      creator_confirmed_minutes: 0,
      partner_confirmed_minutes: 0,
      status: 'pending'
    };

    const { data, error } = await this.ctx.client
      .from('study_pacts')
      .insert(newPactRow)
      .select()
      .single();

    if (error) throw error;

    this.ctx.notify('pacts');
    return mapStudyPact(data);
  };

  joinPactByInviteCode = async (inviteCode: string, partnerName?: string): Promise<CloudStudyPact> => {
    const cleanCode = inviteCode.trim().toUpperCase();
    const cleanName = partnerName?.trim() || 'Peer Scholar';

    const { data, error } = await this.ctx.client.rpc('join_study_pact_by_code', {
      p_invite_code: cleanCode,
      p_partner_name: cleanName
    });

    if (error) {
      throw new Error(error.message || 'Failed to join study pact with this code.');
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      throw new Error('Study pact invite code not found or already claimed.');
    }

    this.ctx.notify('pacts');
    return mapStudyPact(row);
  };

  syncPactMinutes = async (pactId: string, minutes: number): Promise<CloudStudyPact> => {
    const userId = await this.ctx.getUserId();
    const pact = await this.getPactById(pactId);
    if (!pact) throw new Error(`Study pact not found: ${pactId}`);

    const safeMinutes = Math.max(0, Math.round(minutes));
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (pact.createdBy === userId) {
      updates.creator_confirmed_minutes = safeMinutes;
    } else if (pact.partnerId === userId) {
      updates.partner_confirmed_minutes = safeMinutes;
    } else {
      throw new Error('Unauthorized to update progress for this study pact.');
    }

    const { data, error } = await this.ctx.client
      .from('study_pacts')
      .update(updates)
      .eq('id', pactId)
      .select()
      .single();

    if (error) throw error;

    this.ctx.notify('pacts');
    return mapStudyPact(data);
  };

  completePact = async (pactId: string, summary?: StudyPactWeekSummary): Promise<CloudStudyPact> => {
    const updates: Record<string, any> = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.ctx.client
      .from('study_pacts')
      .update(updates)
      .eq('id', pactId)
      .select()
      .single();

    if (error) throw error;

    const pact = mapStudyPact(data);
    if (summary) {
      pact.summary = summary;
    }

    this.ctx.notify('pacts');
    return pact;
  };

  deletePact = async (pactId: string): Promise<boolean> => {
    const userId = await this.ctx.getUserId();
    const { error } = await this.ctx.client
      .from('study_pacts')
      .delete()
      .eq('id', pactId)
      .eq('created_by', userId);

    if (error) throw error;

    this.ctx.notify('pacts');
    return true;
  };
}
