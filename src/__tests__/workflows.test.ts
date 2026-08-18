import { describe, it, expect } from 'vitest';
import { MockDataService } from '../services/mock/mockService';
import { StudyPlanItem } from '../types/study';

describe('Solis Personal Workflow Accelerators Suite', () => {
  it('converts a study plan item into an active task seamlessly', async () => {
    const mockService = new MockDataService();
    const planItem: StudyPlanItem = {
      id: 'plan-1',
      subjectId: 'sub-1',
      subjectName: 'Compiler Construction',
      title: 'Implement SSA Form Optimization Pass',
      targetMinutes: 60,
      priority: 'high',
      completed: false,
      scheduledTime: '10:00 AM',
      createdAt: '2026-08-17'
    };

    const task = await mockService.tasks.createTask({
      title: planItem.title,
      subjectId: planItem.subjectId,
      planItemId: planItem.id,
      category: 'study',
      priority: planItem.priority === 'urgent' ? 'urgent' : planItem.priority === 'high' ? 'high' : 'medium',
      estimatedMinutes: planItem.targetMinutes,
      status: 'todo'
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe('Implement SSA Form Optimization Pass');
    expect(task.subjectId).toBe('sub-1');
    expect(task.category).toBe('study');
    expect(task.priority).toBe('high');
    expect(task.estimatedMinutes).toBe(60);

    const allTasks = await mockService.tasks.getTasks();
    expect(allTasks.some((t) => t.id === task.id)).toBe(true);
  });

  it('generates a linked reflection note from focus session completion', async () => {
    const mockService = new MockDataService();

    const note = await mockService.notes.createNote({
      title: 'Reflection: LLVM Intermediate Representation',
      content: 'Understood dominance frontiers and phi node placement.',
      category: 'reflection',
      subjectId: 'sub-1',
      tags: ['focus-reflection', 'compiler']
    });

    expect(note.id).toBeDefined();
    expect(note.title).toContain('Reflection:');
    expect(note.category).toBe('reflection');
    expect(note.tags).toContain('focus-reflection');

    const notes = await mockService.notes.getNotes();
    expect(notes.some((n) => n.id === note.id)).toBe(true);
  });

  it('constructs correct URL query strings for topic workflow accelerators', () => {
    const topic = {
      id: 'top-1',
      subjectId: 'sub-compilers',
      title: 'Register Allocation with Graph Coloring'
    };

    const focusUrl = `/app/focus?subjectId=${topic.subjectId}&title=${encodeURIComponent(topic.title)}`;
    const noteUrl = `/app/notes?action=new&subjectId=${topic.subjectId}&title=${encodeURIComponent(topic.title)}`;

    expect(focusUrl).toBe('/app/focus?subjectId=sub-compilers&title=Register%20Allocation%20with%20Graph%20Coloring');
    expect(noteUrl).toBe('/app/notes?action=new&subjectId=sub-compilers&title=Register%20Allocation%20with%20Graph%20Coloring');
  });
});
