import { IProposalService } from '../../api.interface';
import { Proposal, ProposalStatus } from '../../../types/proposal';
import { mapProposal } from '../supabaseMappers';
import { SupabaseServiceContext } from './types';

/**
 * V2 Phase 1 (C5) — Supabase implementation of the proposal/approve-diff
 * layer. Open proposals dedupe on (user_id, dedupe_key) via the partial
 * unique index, so repeated insight write-backs never flood the triage inbox.
 */
export class SupabaseProposalService implements IProposalService {
  constructor(private ctx: SupabaseServiceContext) {}

  list = async (status?: ProposalStatus): Promise<Proposal[]> => {
    const userId = await this.ctx.getUserId();
    let query = this.ctx.client
      .from('proposals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((row: any) => mapProposal(row));
  };

  create = async (
    proposal: Partial<Proposal> & { title: string }
  ): Promise<Proposal> => {
    const userId = await this.ctx.getUserId();

    // Open-proposal dedupe: an insight that fires on every load must not
    // flood the inbox — one open proposal per dedupeKey.
    if (proposal.dedupeKey) {
      const { data: existing } = await this.ctx.client
        .from('proposals')
        .select('*')
        .eq('user_id', userId)
        .eq('dedupe_key', proposal.dedupeKey)
        .eq('status', 'open')
        .limit(1);
      if (existing && existing.length > 0) return mapProposal(existing[0]);
    }

    const { data, error } = await this.ctx.client
      .from('proposals')
      .insert({
        user_id: userId,
        kind: proposal.kind || 'insight_action',
        source: proposal.source || 'engine',
        title: proposal.title,
        evidence: proposal.evidence || null,
        diff: proposal.diff || null,
        status: 'open',
        dedupe_key: proposal.dedupeKey || null
      })
      .select()
      .single();

    if (error) throw error;
    this.ctx.notify();
    return mapProposal(data);
  };

  approve = async (id: string): Promise<Proposal> => {
    return this.decide(id, 'approved');
  };

  dismiss = async (id: string): Promise<Proposal> => {
    return this.decide(id, 'dismissed');
  };

  countOpen = async (): Promise<number> => {
    const userId = await this.ctx.getUserId();
    const { count, error } = await this.ctx.client
      .from('proposals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'open');
    if (error) throw error;
    return count || 0;
  };

  private decide = async (id: string, status: 'approved' | 'dismissed'): Promise<Proposal> => {
    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('proposals')
      .update({ status, decided_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    this.ctx.notify();
    return mapProposal(data);
  };
}
