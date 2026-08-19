import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataService } from '../services/mock/mockService';

describe('Phase 8.2 & 8.3 — Subject Archive & Task Linkage Reliability Suite', () => {
  let service: MockDataService;

  beforeEach(() => {
    service = new MockDataService();
  });

  it('archives subject non-destructively while preserving related topics and notes', async () => {
    // 1. Create a subject
    const subject = await service.study.createSubject({
      name: 'Distributed Systems',
      code: 'CS440',
      color: 'coral',
      targetHoursPerWeek: 12
    });

    // 2. Create related topic and note
    const topic = await service.study.createTopic({
      subjectId: subject.id,
      title: 'Raft Consensus Algorithm',
      orderIndex: 1
    });

    const note = await service.notes.createNote({
      subjectId: subject.id,
      title: 'Raft Leader Election Proof',
      content: 'Leader election invariants and heartbeat timers.',
      category: 'concept',
      tags: ['raft', 'consensus']
    });

    expect(subject.status).toBe('active');

    // 3. Archive the subject
    const archived = await service.study.archiveSubject(subject.id);
    expect(archived.status).toBe('archived');

    // 4. Verify Active filter excludes archived subject
    const activeSubjects = await service.study.getSubjects(false);
    expect(activeSubjects.some((s) => s.id === subject.id)).toBe(false);

    // 5. Verify Archived filter includes it
    const allSubjects = await service.study.getSubjects(true);
    const foundArchived = allSubjects.find((s) => s.id === subject.id);
    expect(foundArchived).toBeDefined();
    expect(foundArchived?.status).toBe('archived');

    // 6. Verify related knowledge graph is 100% intact
    const topics = await service.study.getTopics(subject.id);
    expect(topics.some((t) => t.id === topic.id)).toBe(true);

    const notes = await service.notes.getNotes({ subjectId: subject.id });
    expect(notes.some((n) => n.id === note.id)).toBe(true);
  });

  it('unarchives subject cleanly back to active status', async () => {
    const subject = await service.study.createSubject({
      name: 'Real Analysis',
      code: 'MATH301',
      color: 'lavender',
      targetHoursPerWeek: 8
    });

    await service.study.archiveSubject(subject.id);
    const restored = await service.study.restoreSubject(subject.id);

    expect(restored.status).toBe('active');

    const activeSubjects = await service.study.getSubjects(false);
    expect(activeSubjects.some((s) => s.id === subject.id)).toBe(true);
  });

  it('persists task-to-subject linkage for cross-environment study graph', async () => {
    const subject = await service.study.createSubject({
      name: 'Compiler Engineering',
      code: 'CS420',
      color: 'amber',
      targetHoursPerWeek: 10
    });

    const task = await service.tasks.createTask({
      title: 'Implement LLVM Register Allocation Pass',
      category: 'study',
      priority: 'high',
      subjectId: subject.id,
      estimatedMinutes: 60,
      subTasks: [],
      tags: ['compiler', 'llvm']
    });

    expect(task.subjectId).toBe(subject.id);

    const retrieved = await service.tasks.getTaskById(task.id);
    expect(retrieved?.subjectId).toBe(subject.id);
  });
});
