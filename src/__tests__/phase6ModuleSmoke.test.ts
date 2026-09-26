/**
 * Phase 6 smoke test — every module modified or created by
 * "Architecture Hardening & Performance Scaling" must load cleanly.
 * (Import graph + transform check for the touched TSX modules, which the
 * service-level phase tests cannot reach.)
 */
import { describe, it, expect } from 'vitest';
import { PartialDataWarningBanner } from '../components/feedback/PartialDataWarningBanner';
import { HabitsPage } from '../features/habits/HabitsPage';
import { NotesPage } from '../features/notes/NotesPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { AnalyticsPage } from '../features/analytics/AnalyticsPage';
import { useStudyRoom, computeAuthoritativeRemaining } from '../hooks/useStudyRoom';
import { ActiveRoomView } from '../features/rooms/ActiveRoomView';

describe('Phase 6 modified modules load cleanly', () => {
  it('exposes the scoped pub/sub page components', () => {
    expect(HabitsPage).toBeDefined();
    expect(NotesPage).toBeDefined();
    expect(DashboardPage).toBeDefined();
    expect(AnalyticsPage).toBeDefined();
  });

  it('exposes the partial fetch failure banner', () => {
    expect(PartialDataWarningBanner).toBeDefined();
  });

  it('exposes the study room hook with failover-aware surface', () => {
    expect(useStudyRoom).toBeDefined();
    expect(computeAuthoritativeRemaining).toBeDefined();
    expect(ActiveRoomView).toBeDefined();
  });
});
