import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataService } from '../services/mock/mockService';
import { searchWorkspace } from '../utils/commandSearch';
import { Note } from '../types/note';
import { StudySubject } from '../types/study';

describe('Phase 13 Product Completion & Integration Suite', () => {
  let mockService: MockDataService;

  beforeEach(() => {
    mockService = new MockDataService();
  });

  it('verifies study plan item full lifecycle including deletePlanItem', async () => {
    const subjects = await mockService.study.getSubjects();
    const activeSub = subjects[0];
    expect(activeSub).toBeDefined();

    // Create a plan item
    const created = await mockService.study.createPlanItem({
      subjectId: activeSub.id,
      subjectName: activeSub.name,
      title: 'Compiler Optimization Techniques',
      targetMinutes: 60,
      priority: 'high'
    });
    expect(created.id).toBeDefined();
    expect(created.title).toBe('Compiler Optimization Techniques');

    // Toggle plan item
    const toggled = await mockService.study.togglePlanItem(created.id);
    expect(toggled.completed).toBe(true);

    // Delete plan item
    const deleted = await mockService.study.deletePlanItem(created.id);
    expect(deleted).toBe(true);

    // Verify it is removed from today plan
    const todayPlan = await mockService.study.getTodayPlan();
    expect(todayPlan.some((p) => p.id === created.id)).toBe(false);
  });

  it('verifies command palette entity results generate exact deep links for notes', () => {
    const mockNotes: Note[] = [
      {
        id: 'note-123',
        title: 'Distributed Consensus Algorithm',
        content: 'Raft and Paxos notes',
        category: 'concept',
        tags: ['distributed-systems'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const results = searchWorkspace('Distributed Consensus', { notes: mockNotes });
    expect(results.length).toBeGreaterThan(0);
    const noteResult = results.find((r) => r.id === 'note-note-123');
    expect(noteResult).toBeDefined();
    expect(noteResult?.actionUrl).toBe('/app/notes?id=note-123');
  });

  it('verifies subject search in command palette deep links with subjectId', () => {
    const mockSubjects: StudySubject[] = [
      {
        id: 'sub-456',
        name: 'Quantum Physics',
        code: 'PHYS401',
        color: 'lavender',
        targetHoursPerWeek: 12,
        completedHoursThisWeek: 0,
        notesCount: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const results = searchWorkspace('Quantum Physics', { subjects: mockSubjects });
    expect(results.length).toBeGreaterThan(0);
    const subResult = results.find((r) => r.id === 'subject-sub-456');
    expect(subResult).toBeDefined();
    expect(subResult?.actionUrl).toBe('/app/study?subjectId=sub-456');
  });
});
