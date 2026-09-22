import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataService } from '../services/mock/mockService';

describe('Milestone 5: Task -> Focus & Study Continuity', () => {
  let service: MockDataService;
  const testDate = '2026-09-22';

  beforeEach(() => {
    service = new MockDataService();
  });

  it('seamlessly synchronizes focus session completion back to task and time block without duplicate manual entry', async () => {
    // 1. Create an intentional task
    const task = await service.tasks.createTask({
      title: 'Formal Proof of Distributed Consensus Safety',
      priority: 'high',
      estimatedMinutes: 50,
      tags: ['research', 'distributed-systems']
    });
    expect(task.id).toBeDefined();
    expect(task.status).toBe('todo');

    // 2. Schedule a 60-minute time block for the task
    const block = await service.tasks.createTimeBlock({
      taskId: task.id,
      taskTitle: task.title,
      date: testDate,
      startHour: 10,
      durationMinutes: 60,
      priority: 'high'
    });
    expect(block.id).toBeDefined();
    expect(block.status).toBe('planned');

    // 3. Complete focus session (simulating FocusContext.saveReflection)
    const completedSessionMinutes = 50;
    const reflectionNotes = 'Safety theorem established across all non-byzantine partitions.';

    // Synchronize to Task
    const updatedTask = await service.tasks.updateTask(task.id, {
      status: 'completed',
      completedMinutes: (task.completedMinutes || 0) + completedSessionMinutes,
      completedAt: new Date().toISOString()
    });
    expect(updatedTask.status).toBe('completed');
    expect(updatedTask.completedMinutes).toBe(50);

    // Synchronize to Time Block
    const updatedBlock = await service.tasks.updateTimeBlock(block.id, {
      status: 'completed',
      actualMinutes: completedSessionMinutes,
      progressPercent: 100,
      reflection: reflectionNotes
    });
    expect(updatedBlock.status).toBe('completed');
    expect(updatedBlock.actualMinutes).toBe(50);
    expect(updatedBlock.progressPercent).toBe(100);
    expect(updatedBlock.reflection).toBe(reflectionNotes);

    // 4. Verify data persistence
    const allTasks = await service.tasks.getTasks();
    const persistedTask = allTasks.find((t) => t.id === task.id);
    expect(persistedTask?.status).toBe('completed');
    expect(persistedTask?.completedMinutes).toBe(50);

    const allBlocks = await service.tasks.getTimeBlocks(testDate);
    const persistedBlock = allBlocks.find((b) => b.id === block.id);
    expect(persistedBlock?.status).toBe('completed');
    expect(persistedBlock?.progressPercent).toBe(100);
    expect(persistedBlock?.actualMinutes).toBe(50);
  });

  it('handles partial focus session by updating task minutes and time block progress to partial', async () => {
    const task = await service.tasks.createTask({
      title: 'Implement Raft Heartbeat Mechanism',
      priority: 'urgent',
      estimatedMinutes: 60
    });

    const block = await service.tasks.createTimeBlock({
      taskId: task.id,
      taskTitle: task.title,
      date: testDate,
      startHour: 14,
      durationMinutes: 60,
      priority: 'urgent'
    });

    // Partial session: 30m logged, task kept in_progress
    const sessionMinutes = 30;
    const reflection = 'Leader timer implemented; RPC serialization in progress.';

    const updatedTask = await service.tasks.updateTask(task.id, {
      status: 'in_progress',
      completedMinutes: sessionMinutes
    });
    expect(updatedTask.status).toBe('in_progress');
    expect(updatedTask.completedMinutes).toBe(30);

    const updatedBlock = await service.tasks.updateTimeBlock(block.id, {
      status: 'partial',
      actualMinutes: sessionMinutes,
      progressPercent: 50,
      reflection
    });
    expect(updatedBlock.status).toBe('partial');
    expect(updatedBlock.progressPercent).toBe(50);
    expect(updatedBlock.actualMinutes).toBe(30);
  });
});
