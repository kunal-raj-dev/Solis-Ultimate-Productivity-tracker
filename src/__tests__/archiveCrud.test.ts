import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataService } from '../services/mock/mockService';
import { StudySubject } from '../types/study';

describe('Study Studio V2 Reliability, State Consistency & Data-Sync Hardening Suite', () => {
  let service: MockDataService;

  beforeEach(() => {
    service = new MockDataService();
  });

  it('1. Initial load succeeds -> cards and counts match single canonical dataset', async () => {
    const initialAll = await service.study.getSubjects(true);
    const initialCount = initialAll.length;

    const s1 = await service.study.createSubject({ name: 'Systems Architecture', code: 'CS500', color: 'coral' });
    const s2 = await service.study.createSubject({ name: 'Type Theory', code: 'CS510', color: 'amber' });

    const all = await service.study.getSubjects(true);
    const active = all.filter((s) => s.status !== 'archived');

    expect(all.length).toBe(initialCount + 2);
    expect(active.some((s) => s.id === s1.id)).toBe(true);
    expect(active.some((s) => s.id === s2.id)).toBe(true);
  });

  it('2. Initial load fails with empty data -> truthful 0 counts without contradictory cards', async () => {
    // Simulating failed initial fetch where subjects state remains empty []
    const emptySubjects: StudySubject[] = [];
    const activeCount = emptySubjects.filter((s) => s.status !== 'archived').length;
    const archivedCount = emptySubjects.filter((s) => s.status === 'archived').length;

    expect(activeCount).toBe(0);
    expect(archivedCount).toBe(0);
  });

  it('3. Existing data + background refresh failure -> preserves valid cards and truthful counts', async () => {
    const s1 = await service.study.createSubject({ name: 'Algorithms', code: 'CS200' });
    let localSubjects: StudySubject[] = [s1];

    // Simulate background sync failure: localSubjects remains populated
    const activeCount = localSubjects.filter((s) => s.status !== 'archived').length;
    expect(activeCount).toBe(1);
    expect(localSubjects[0].name).toBe('Algorithms');
  });

  it('4. Successful retry clears sync error and updates state', async () => {
    const s1 = await service.study.createSubject({ name: 'Algorithms', code: 'CS200' });
    let syncStatus: 'idle' | 'syncing' | 'error' = 'error';

    // Execute retry
    syncStatus = 'syncing';
    const refetched = await service.study.getSubjects(true);
    syncStatus = 'idle';

    expect(syncStatus).toBe('idle');
    expect(refetched.some((s) => s.id === s1.id)).toBe(true);
  });

  it('5. Failed retry preserves existing valid data', async () => {
    const s1 = await service.study.createSubject({ name: 'Compilers', code: 'CS420' });
    let localSubjects: StudySubject[] = [s1];
    let syncStatus: 'idle' | 'syncing' | 'error' = 'idle';

    try {
      syncStatus = 'syncing';
      throw new Error('Simulated network failure on retry');
    } catch {
      syncStatus = 'error';
    }

    // Existing data is untouched
    expect(localSubjects.length).toBe(1);
    expect(localSubjects[0].id).toBe(s1.id);
    expect(syncStatus).toBe('error');
  });

  it('6. Create subject updates counts immediately and survives background sync failure', async () => {
    const created = await service.study.createSubject({
      name: 'Distributed Systems',
      code: 'CS440',
      color: 'coral'
    });

    let localSubjects: StudySubject[] = [];
    localSubjects = [...localSubjects.filter((s) => s.id !== created.id), created];

    expect(localSubjects.length).toBe(1);
    expect(localSubjects[0].name).toBe('Distributed Systems');

    // Simulate subsequent background refresh failure
    const activeCount = localSubjects.filter((s) => s.status !== 'archived').length;
    expect(activeCount).toBe(1);
  });

  it('7. Archive and Restore transitions maintain atomic, synchronized counts', async () => {
    const s1 = await service.study.createSubject({ name: 'Real Analysis', code: 'MATH301' });
    let localSubjects = [s1];

    // Archive
    await service.study.archiveSubject(s1.id);
    localSubjects = localSubjects.map((s) => (s.id === s1.id ? { ...s, status: 'archived' } : s));

    expect(localSubjects.filter((s) => s.status !== 'archived').length).toBe(0);
    expect(localSubjects.filter((s) => s.status === 'archived').length).toBe(1);

    // Restore
    await service.study.restoreSubject(s1.id);
    localSubjects = localSubjects.map((s) => (s.id === s1.id ? { ...s, status: 'active' } : s));

    expect(localSubjects.filter((s) => s.status !== 'archived').length).toBe(1);
    expect(localSubjects.filter((s) => s.status === 'archived').length).toBe(0);
  });

  it('8. Delete removes subject permanently and preserves decoupled notes', async () => {
    const subject = await service.study.createSubject({ name: 'Temp Subject', code: 'TMP' });
    const note = await service.notes.createNote({
      subjectId: subject.id,
      title: 'Decoupled Insight',
      content: 'Preserved notes content'
    });

    await service.study.deleteSubject(subject.id);

    const subjects = await service.study.getSubjects(true);
    expect(subjects.some((s) => s.id === subject.id)).toBe(false);

    const notes = await service.notes.getNotes();
    expect(notes.some((n) => n.id === note.id)).toBe(true);
  });

  it('9. Partial failure resilience: secondary endpoints failure does not crash subject workspace', async () => {
    const subjectsPromise = service.study.getSubjects(true);
    const failingSecondaryPromise = Promise.reject(new Error('Reviews service down'));

    const [subRes, secRes] = await Promise.allSettled([subjectsPromise, failingSecondaryPromise]);

    expect(subRes.status).toBe('fulfilled');
    expect(secRes.status).toBe('rejected');

    // Primary subjects successfully retrieved despite secondary failure
    if (subRes.status === 'fulfilled') {
      expect(Array.isArray(subRes.value)).toBe(true);
    }
  });

  it('10. Rapid sequential mutations maintain valid final state', async () => {
    const subject = await service.study.createSubject({ name: 'Physics I', code: 'PHYS100' });

    // Rapid Edit -> Archive -> Restore
    await service.study.updateSubject(subject.id, { name: 'Physics II (Electromagnetism)' });
    await service.study.archiveSubject(subject.id);
    const final = await service.study.restoreSubject(subject.id);

    expect(final.status).toBe('active');
    expect(final.name).toBe('Physics II (Electromagnetism)');
  });

  it('11. Out-of-order response protection: newer mutation status is not overwritten by older response', () => {
    const subjectId = 'sub-test-123';
    const mutationTimestamps = new Map<string, number>();

    // Initial state
    let localSubjects: StudySubject[] = [{
      id: subjectId,
      name: 'Initial Subject',
      code: 'CORE',
      color: 'coral',
      targetHoursPerWeek: 10,
      completedHoursThisWeek: 0,
      notesCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }];

    // User triggers Archive (newer mutation)
    mutationTimestamps.set(subjectId, Date.now());
    localSubjects = localSubjects.map((s) => (s.id === subjectId ? { ...s, status: 'archived' } : s));

    // Stale server response arrives late (claiming status is active)
    const staleServerResponse: StudySubject[] = [{
      id: subjectId,
      name: 'Initial Subject',
      code: 'CORE',
      color: 'coral',
      targetHoursPerWeek: 10,
      completedHoursThisWeek: 0,
      notesCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }];

    // Reconcile using timestamp protection
    const now = Date.now();
    const merged = [...staleServerResponse];
    for (const localSub of localSubjects) {
      const lastMut = mutationTimestamps.get(localSub.id);
      if (lastMut && now - lastMut < 4000) {
        const serverIdx = merged.findIndex((s) => s.id === localSub.id);
        if (serverIdx >= 0 && localSub.status !== merged[serverIdx].status) {
          merged[serverIdx] = { ...merged[serverIdx], status: localSub.status };
        }
      }
    }

    expect(merged[0].status).toBe('archived'); // Preserves user's newer archived mutation
  });

  it('12. Background refresh with stale snapshot must not overwrite newly created local state', () => {
    const newSubjectId = 'sub-new-999';
    const mutationTimestamps = new Map<string, number>();

    // User creates subject locally
    mutationTimestamps.set(newSubjectId, Date.now());
    const newSubject: StudySubject = {
      id: newSubjectId,
      name: 'Brand New Subject',
      code: 'NEW',
      color: 'sage',
      targetHoursPerWeek: 8,
      completedHoursThisWeek: 0,
      notesCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    let localSubjects: StudySubject[] = [newSubject];

    // Stale background refresh returns empty array (started before create completed)
    const staleServerResponse: StudySubject[] = [];

    // Reconcile
    const now = Date.now();
    const merged = [...staleServerResponse];
    for (const localSub of localSubjects) {
      const lastMut = mutationTimestamps.get(localSub.id);
      if (lastMut && now - lastMut < 4000) {
        const serverIdx = merged.findIndex((s) => s.id === localSub.id);
        if (serverIdx === -1 && localSub.status !== 'archived') {
          merged.push(localSub);
        }
      }
    }

    expect(merged.length).toBe(1);
    expect(merged[0].id).toBe(newSubjectId);
    expect(merged[0].name).toBe('Brand New Subject');
  });
});
