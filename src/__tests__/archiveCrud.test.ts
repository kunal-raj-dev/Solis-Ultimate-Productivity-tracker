import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockDataService } from '../services/mock/mockService';

describe('Study Studio Reliability, Subject Lifecycle & Archive Suite', () => {
  let service: MockDataService;

  beforeEach(() => {
    service = new MockDataService();
  });

  it('notifies subscribers synchronously upon Subject mutations without dropping listeners', async () => {
    const listener = vi.fn();
    const unsubscribe = service.subscribe(listener);

    // 1. Create triggers listener
    const subject = await service.study.createSubject({
      name: 'Quantum Computing',
      code: 'PHYS400',
      color: 'lavender',
      targetHoursPerWeek: 15
    });
    expect(listener).toHaveBeenCalledTimes(1);

    // 2. Edit triggers listener
    await service.study.updateSubject(subject.id, {
      name: 'Advanced Quantum Computing'
    });
    expect(listener).toHaveBeenCalledTimes(2);

    // 3. Archive triggers listener
    await service.study.archiveSubject(subject.id);
    expect(listener).toHaveBeenCalledTimes(3);

    // 4. Restore triggers listener
    await service.study.restoreSubject(subject.id);
    expect(listener).toHaveBeenCalledTimes(4);

    // 5. Delete triggers listener
    await service.study.deleteSubject(subject.id);
    expect(listener).toHaveBeenCalledTimes(5);

    unsubscribe();
    await service.study.createSubject({ name: 'Linear Algebra', code: 'MATH200' });
    expect(listener).toHaveBeenCalledTimes(5); // No more calls after unsubscribe
  });

  it('updates subject properties accurately during Edit workflow', async () => {
    const subject = await service.study.createSubject({
      name: 'Operating Systems',
      code: 'CS301',
      color: 'coral',
      targetHoursPerWeek: 10
    });

    const updated = await service.study.updateSubject(subject.id, {
      name: 'Advanced Operating Systems & Microkernels',
      code: 'CS501',
      color: 'amber',
      targetHoursPerWeek: 18,
      description: 'Microkernel IPC, seL4 proofs, virtual memory architecture'
    });

    expect(updated.name).toBe('Advanced Operating Systems & Microkernels');
    expect(updated.code).toBe('CS501');
    expect(updated.color).toBe('amber');
    expect(updated.targetHoursPerWeek).toBe(18);
    expect(updated.description).toBe('Microkernel IPC, seL4 proofs, virtual memory architecture');
    expect(updated.status).toBe('active');
  });

  it('archives subject non-destructively while preserving related topics, notes and sessions', async () => {
    // 1. Create a subject
    const subject = await service.study.createSubject({
      name: 'Distributed Systems',
      code: 'CS440',
      color: 'coral',
      targetHoursPerWeek: 12
    });

    // 2. Create related topic, note, and study session
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

    const session = await service.study.logSession({
      subjectId: subject.id,
      subjectName: subject.name,
      type: 'deep_study',
      durationMinutes: 90,
      topicsCovered: ['Raft Consensus Algorithm'],
      retentionRating: 5
    });

    expect(subject.status).toBe('active');

    // 3. Archive the subject
    const archived = await service.study.archiveSubject(subject.id);
    expect(archived.status).toBe('archived');

    // 4. Verify Active query excludes archived subject
    const activeSubjects = await service.study.getSubjects(false);
    expect(activeSubjects.some((s) => s.id === subject.id)).toBe(false);

    // 5. Verify Archived query includes it
    const allSubjects = await service.study.getSubjects(true);
    const foundArchived = allSubjects.find((s) => s.id === subject.id);
    expect(foundArchived).toBeDefined();
    expect(foundArchived?.status).toBe('archived');

    // 6. Verify related knowledge graph is 100% intact
    const topics = await service.study.getTopics(subject.id);
    expect(topics.some((t) => t.id === topic.id)).toBe(true);

    const notes = await service.notes.getNotes({ subjectId: subject.id });
    expect(notes.some((n) => n.id === note.id)).toBe(true);

    const sessions = await service.study.getRecentSessions();
    expect(sessions.some((s) => s.id === session.id)).toBe(true);
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

  it('excludes archived subjects from active Focus / Task selection dropdowns', async () => {
    const subActive = await service.study.createSubject({ name: 'Active Subject', code: 'ACT1' });
    const subArchived = await service.study.createSubject({ name: 'Archived Subject', code: 'ARC1' });

    await service.study.archiveSubject(subArchived.id);

    const activeForDropdown = (await service.study.getSubjects(true)).filter(
      (s) => s.status !== 'archived'
    );

    expect(activeForDropdown.some((s) => s.id === subActive.id)).toBe(true);
    expect(activeForDropdown.some((s) => s.id === subArchived.id)).toBe(false);

    // Restore makes it selectable again
    await service.study.restoreSubject(subArchived.id);
    const refreshedDropdown = (await service.study.getSubjects(true)).filter(
      (s) => s.status !== 'archived'
    );
    expect(refreshedDropdown.some((s) => s.id === subArchived.id)).toBe(true);
  });

  it('deletes subject permanently while keeping decoupled notes and sessions safe', async () => {
    const subject = await service.study.createSubject({
      name: 'Temporary Subject',
      code: 'TMP100',
      color: 'sage'
    });

    const note = await service.notes.createNote({
      subjectId: subject.id,
      title: 'Decoupled Note Content',
      content: 'Important thoughts that outlive the subject syllabus.',
      category: 'reflection'
    });

    // Delete subject
    await service.study.deleteSubject(subject.id);

    // Subject is completely gone
    const allSubjects = await service.study.getSubjects(true);
    expect(allSubjects.some((s) => s.id === subject.id)).toBe(false);

    // Note exists in the student repository
    const notes = await service.notes.getNotes();
    expect(notes.some((n) => n.id === note.id)).toBe(true);
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
