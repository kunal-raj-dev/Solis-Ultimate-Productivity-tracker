/**
 * ============================================================================
 * SOLIS ARCHITECTURE: PRODUCTION DATA SERVICE (SUPABASE POSTGRESQL FACADE)
 * ============================================================================
 * 
 * Aggregates modular domain repositories implementing IDataService.
 * Coordinates shared auth session validation, queryCache invalidation,
 * and cross-domain reactive subscriber notifications.
 */

import {
  IDataService,
  IAuthService,
  ITaskService,
  IStudyService,
  INoteService,
  IFocusService,
  IHabitService,
  IGoalService,
  IAnalyticsService,
  IFlashcardService,
  IReviewService,
  IRoutineService,
  IResourceService,
  IReflectionService,
  IRoomService,
  IStudyPactService,
  IPresenceService,
  DataEntityChannel,
  matchesChannelFilter
} from '../api.interface';
import { supabase } from './supabaseClient';
import { queryCache } from '../cache';
import { SupabaseServiceContext } from './modules/types';
import { SupabaseAuthService } from './modules/auth.service';
import { SupabaseTaskService } from './modules/tasks.service';
import { SupabaseStudyService } from './modules/study.service';
import { SupabaseNoteService } from './modules/notes.service';
import { SupabaseFocusService } from './modules/focus.service';
import { SupabaseHabitService } from './modules/habits.service';
import { SupabaseGoalService } from './modules/goals.service';
import { SupabaseAnalyticsService } from './modules/analytics.service';
import { SupabaseFlashcardService } from './modules/flashcards.service';
import { SupabaseReviewService } from './modules/reviews.service';
import { SupabaseRoutineService } from './modules/routines.service';
import { SupabaseResourceService } from './modules/resources.service';
import { SupabaseReflectionService } from './modules/reflections.service';
import { SupabaseRoomsService } from './modules/rooms.service';
import { SupabaseStudyPactService } from './modules/studyPact.service';
import { SupabasePresenceService } from './modules/presence.service';

export class SupabaseDataService implements IDataService {
  private listeners: Set<{
    fn: (channel?: DataEntityChannel) => void;
    channels?: DataEntityChannel[];
  }> = new Set();

  public auth: IAuthService;
  public tasks: ITaskService;
  public study: IStudyService;
  public notes: INoteService;
  public focus: IFocusService;
  public habits: IHabitService;
  public goals: IGoalService;
  public analytics: IAnalyticsService;
  public flashcards: IFlashcardService;
  public reviews: IReviewService;
  public routines: IRoutineService;
  public resources: IResourceService;
  public reflections: IReflectionService;
  public rooms: IRoomService;
  public pacts: IStudyPactService;
  public presence: IPresenceService;

  constructor() {
    // Plan §6.1 scoped entity pub/sub: every domain module emits its own
    // entity channel, so a mutation only wakes subscribers of that channel.
    // Domains outside the canonical channel enum broadcast on 'all'.
    const ctxFor = (channel: DataEntityChannel): SupabaseServiceContext => ({
      client: supabase,
      getUserId: () => this.getRequiredUserId(),
      notify: () => this.notify(channel),
      getServices: () => this
    });

    this.tasks = new SupabaseTaskService(ctxFor('tasks'));
    this.study = new SupabaseStudyService(ctxFor('study'));
    this.notes = new SupabaseNoteService(ctxFor('notes'));
    this.focus = new SupabaseFocusService(ctxFor('focus'));
    this.habits = new SupabaseHabitService(ctxFor('habits'));
    this.goals = new SupabaseGoalService(ctxFor('goals'));
    this.pacts = new SupabaseStudyPactService(ctxFor('pacts'));
    this.presence = new SupabasePresenceService(ctxFor('presence'));

    const globalCtx = ctxFor('all');
    this.auth = new SupabaseAuthService(globalCtx);
    this.analytics = new SupabaseAnalyticsService(globalCtx);
    this.flashcards = new SupabaseFlashcardService(globalCtx);
    this.reviews = new SupabaseReviewService(globalCtx);
    this.routines = new SupabaseRoutineService(globalCtx);
    this.resources = new SupabaseResourceService(globalCtx);
    this.reflections = new SupabaseReflectionService(globalCtx);
    this.rooms = new SupabaseRoomsService(globalCtx);
  }

  public subscribe(
    listener: (channel?: DataEntityChannel) => void,
    channels?: DataEntityChannel[]
  ): () => void {
    const entry = { fn: listener, channels };
    this.listeners.add(entry);
    return () => {
      this.listeners.delete(entry);
    };
  }

  public notifySubscribers(channel: DataEntityChannel): void {
    this.notify(channel);
  }

  private notify(channel?: DataEntityChannel): void {
    // Cache invalidation law: invalidate the client-side query cache BEFORE
    // any listener performs a follow-up read.
    queryCache.invalidate();
    for (const entry of this.listeners) {
      if (!matchesChannelFilter(entry.channels, channel)) continue;
      try {
        entry.fn(channel);
      } catch (err) {
        console.error('Error in Solis repository listener:', err);
      }
    }
  }

  private async getRequiredUserId(): Promise<string> {
    // Fast path: retrieve local session user ID without HTTP roundtrip
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      return session.user.id;
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('Unauthorized: No active authenticated Supabase session.');
    }
    return user.id;
  }
}
