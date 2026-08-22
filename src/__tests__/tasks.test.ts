import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataService } from '../services/mock/mockService';

describe('Task Engine Service & Subtasks Management', () => {
  let service: MockDataService;

  beforeEach(() => {
    service = new MockDataService();
  });

  it('creates task with valid data', async () => {
    const task = await service.tasks.createTask({
      title: 'Study Byzantine Fault Tolerance',
      category: 'study',
      priority: 'high',
      estimatedMinutes: 45
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe('Study Byzantine Fault Tolerance');
    expect(task.status).toBe('todo');
    expect(task.subTasks).toEqual([]);

    const fetched = await service.tasks.getTaskById(task.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe('Study Byzantine Fault Tolerance');
  });

  it('toggles task completion state', async () => {
    const task = await service.tasks.createTask({
      title: 'Review Raft Paper',
      status: 'todo'
    });

    const completed = await service.tasks.toggleTaskCompletion(task.id);
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeDefined();

    const reopened = await service.tasks.toggleTaskCompletion(task.id);
    expect(reopened.status).toBe('todo');
    expect(reopened.completedAt).toBeUndefined();
  });

  it('manages subtasks and cascades parent completion', async () => {
    const task = await service.tasks.createTask({
      title: 'Master Graph Algorithms',
      status: 'todo'
    });

    const sub1 = await service.tasks.addSubTask(task.id, 'Implement Dijkstra');
    const sub2 = await service.tasks.addSubTask(task.id, 'Implement Bellman-Ford');

    expect(sub1.id).toBeDefined();
    expect(sub2.id).toBeDefined();

    let updated = await service.tasks.getTaskById(task.id);
    expect(updated?.subTasks.length).toBe(2);

    // Complete first subtask
    updated = await service.tasks.toggleSubTask(task.id, sub1.id);
    expect(updated.status).toBe('todo');

    // Complete second subtask -> parent auto completes!
    updated = await service.tasks.toggleSubTask(task.id, sub2.id);
    expect(updated.status).toBe('completed');

    // Uncheck sub1 -> parent moves back to in_progress!
    updated = await service.tasks.toggleSubTask(task.id, sub1.id);
    expect(updated.status).toBe('in_progress');
  });

  it('deletes subtask cleanly', async () => {
    const task = await service.tasks.createTask({ title: 'Task with sub' });
    const sub = await service.tasks.addSubTask(task.id, 'Sub to delete');

    const updated = await service.tasks.deleteSubTask(task.id, sub.id);
    expect(updated.subTasks.find((s) => s.id === sub.id)).toBeUndefined();
  });

  it('edits subtask title successfully and rejects empty strings', async () => {
    const task = await service.tasks.createTask({ title: 'Task with sub to edit' });
    const sub = await service.tasks.addSubTask(task.id, 'Original Title');

    const updated = await service.tasks.editSubTask(task.id, sub.id, 'Updated Title');
    const editedSub = updated.subTasks.find((s) => s.id === sub.id);
    expect(editedSub?.title).toBe('Updated Title');

    // Reject empty
    await expect(service.tasks.editSubTask(task.id, sub.id, '   ')).rejects.toThrow(
      'Subtask title cannot be empty.'
    );
  });
});
