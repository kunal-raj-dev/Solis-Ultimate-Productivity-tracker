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
  IRoomService
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

export class SupabaseDataService implements IDataService {
  private listeners: Set<() => void> = new Set();

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

  constructor() {
    const ctx: SupabaseServiceContext = {
      client: supabase,
      getUserId: () => this.getRequiredUserId(),
      notify: () => this.notify(),
      getServices: () => this
    };

    this.auth = new SupabaseAuthService(ctx);
    this.tasks = new SupabaseTaskService(ctx);
    this.study = new SupabaseStudyService(ctx);
    this.notes = new SupabaseNoteService(ctx);
    this.focus = new SupabaseFocusService(ctx);
    this.habits = new SupabaseHabitService(ctx);
    this.goals = new SupabaseGoalService(ctx);
    this.analytics = new SupabaseAnalyticsService(ctx);
    this.flashcards = new SupabaseFlashcardService(ctx);
    this.reviews = new SupabaseReviewService(ctx);
    this.routines = new SupabaseRoutineService(ctx);
    this.resources = new SupabaseResourceService(ctx);
    this.reflections = new SupabaseReflectionService(ctx);
    this.rooms = new SupabaseRoomsService(ctx);
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    // Invalidate client-side query cache on any mutation
    queryCache.invalidate();
    for (const listener of this.listeners) {
      try {
        listener();
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
