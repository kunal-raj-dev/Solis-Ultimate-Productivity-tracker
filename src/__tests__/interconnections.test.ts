import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataService } from '../services/mock/mockService';

describe('Phase 4 — Cross-Domain Interconnections', () => {
  let service: MockDataService;

  beforeEach(() => {
    service = new MockDataService();
  });

  it('connects Study Plan Items with Tasks, Focus Sessions, and Knowledge Notes', async () => {
    // 1. Create a new Subject
    const subject = await service.study.createSubject({
      name: 'Quantum Computing Systems',
      code: 'QC 800',
      color: 'lavender',
      targetHoursPerWeek: 12
    });
    expect(subject.id).toBeDefined();

    // 2. Create a Canonical Syllabus Topic
    const topic = await service.study.createTopic({
      subjectId: subject.id,
      title: 'Shor Algorithm & Quantum Fourier Transform',
      masteryLevel: 'unstudied'
    });
    expect(topic.id).toBeDefined();
    expect(topic.masteryLevel).toBe('unstudied');

    // 3. Queue a Study Plan Item referencing the Subject & Topic
    const planItem = await service.study.createPlanItem({
      subjectId: subject.id,
      topicId: topic.id,
      title: 'QFT Circuit Decomposition',
      targetMinutes: 60,
      priority: 'high'
    });
    expect(planItem.id).toBeDefined();

    // 4. Launch Focus Session referencing the Subject and Plan Item
    const focusSession = await service.focus.saveFocusSession({
      subjectId: subject.id,
      planItemId: planItem.id,
      mode: 'deep_flow',
      durationMinutes: 50,
      title: 'QFT Circuit Decomposition Flow'
    });
    expect(focusSession.subjectId).toBe(subject.id);
    expect(focusSession.planItemId).toBe(planItem.id);

    // 5. Log Study Session with Retention Rating and Plan Linkage
    const studySession = await service.study.logSession({
      subjectId: subject.id,
      planItemId: planItem.id,
      focusSessionId: focusSession.id,
      durationMinutes: 50,
      topicsCovered: ['QFT Phase Estimation', 'Hadamard Gates'],
      retentionRating: 5,
      notes: 'Key realization: QFT achieves exponential speedup by operating on state amplitudes.'
    });
    expect(studySession.planItemId).toBe(planItem.id);
    expect(studySession.retentionRating).toBe(5);

    // 6. Create Knowledge Note linked to the Study Session and Subject
    const note = await service.notes.createNote({
      subjectId: subject.id,
      studySessionId: studySession.id,
      planItemId: planItem.id,
      title: 'QFT Amplitude Transformation Proof',
      content: '# QFT Proof\n\nLinear transformation on n qubits.',
      category: 'concept',
      tags: ['quantum', 'qft', 'algorithms']
    });
    expect(note.subjectId).toBe(subject.id);
    expect(note.studySessionId).toBe(studySession.id);
    expect(note.tags).toEqual(['quantum', 'qft', 'algorithms']);

    // 7. Verify dynamic planned vs actual derivation without manual column updates
    const todayPlan = await service.study.getTodayPlan();
    const matchedPlan = todayPlan.find((p) => p.id === planItem.id);
    expect(matchedPlan).toBeDefined();
    expect(matchedPlan?.actualMinutesLogged).toBe(50);
  });

  it('preserves subject archiving lifecycle without breaking relational links', async () => {
    const subject = await service.study.createSubject({
      name: 'Archived Subject Test',
      color: 'amber'
    });

    // Archive
    const archived = await service.study.archiveSubject(subject.id);
    expect(archived.status).toBe('archived');

    // Get active subjects
    const activeSubs = await service.study.getSubjects(false);
    expect(activeSubs.some((s) => s.id === subject.id)).toBe(false);

    // Get all including archived
    const allSubs = await service.study.getSubjects(true);
    expect(allSubs.some((s) => s.id === subject.id)).toBe(true);

    // Restore
    const restored = await service.study.restoreSubject(subject.id);
    expect(restored.status).toBe('active');
  });
});
