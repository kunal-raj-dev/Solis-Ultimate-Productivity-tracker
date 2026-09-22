import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataService } from '../services/mock/mockService';
import { TimeBlockReviewPayload } from '../types/task';
import { getISODateString, addDays } from '../utils/date';

describe('Solis Hourly Planner & 24h Time-Block Grid System', () => {
  let service: MockDataService;
  const testDate = getISODateString();

  beforeEach(() => {
    service = new MockDataService();
  });

  it('creates and retrieves time blocks for a specific date', async () => {
    const block1 = await service.tasks.createTimeBlock({
      taskTitle: 'Distributed Systems Lecture Notes',
      date: testDate,
      startHour: 9,
      durationMinutes: 60,
      priority: 'high'
    });

    const block2 = await service.tasks.createTimeBlock({
      taskTitle: 'Solve LeetCode Hard Dynamic Programming',
      date: testDate,
      startHour: 14,
      durationMinutes: 90,
      priority: 'urgent'
    });

    expect(block1.id).toBeDefined();
    expect(block1.startHour).toBe(9);
    expect(block1.status).toBe('planned');

    expect(block2.id).toBeDefined();
    expect(block2.startHour).toBe(14);
    expect(block2.durationMinutes).toBe(90);

    const dateBlocks = await service.tasks.getTimeBlocks(testDate);
    expect(dateBlocks.length).toBeGreaterThanOrEqual(2);
    expect(dateBlocks.some((b) => b.id === block1.id)).toBe(true);
    expect(dateBlocks.some((b) => b.id === block2.id)).toBe(true);
  });

  it('isolates time blocks by date', async () => {
    const dateA = getISODateString();
    const dateB = getISODateString(addDays(new Date(), 1));

    const blockA = await service.tasks.createTimeBlock({
      taskTitle: 'Morning Deep Work Block A',
      date: dateA,
      startHour: 10,
      durationMinutes: 60,
      priority: 'medium'
    });

    const blockB = await service.tasks.createTimeBlock({
      taskTitle: 'Morning Deep Work Block B',
      date: dateB,
      startHour: 10,
      durationMinutes: 60,
      priority: 'medium'
    });

    const blocksForDateA = await service.tasks.getTimeBlocks(dateA);
    const blocksForDateB = await service.tasks.getTimeBlocks(dateB);

    expect(blocksForDateA.some((b) => b.id === blockA.id)).toBe(true);
    expect(blocksForDateA.some((b) => b.id === blockB.id)).toBe(false);

    expect(blocksForDateB.some((b) => b.id === blockB.id)).toBe(true);
    expect(blocksForDateB.some((b) => b.id === blockA.id)).toBe(false);
  });

  it('updates time block status, duration, and progress', async () => {
    const block = await service.tasks.createTimeBlock({
      taskTitle: 'Refactor Auth Pipeline',
      date: testDate,
      startHour: 11,
      durationMinutes: 60,
      priority: 'high'
    });

    const updated = await service.tasks.updateTimeBlock(block.id, {
      status: 'completed',
      progressPercent: 100,
      actualMinutes: 55,
      reflection: 'Clean separation achieved.'
    });

    expect(updated.status).toBe('completed');
    expect(updated.progressPercent).toBe(100);
    expect(updated.actualMinutes).toBe(55);
    expect(updated.reflection).toBe('Clean separation achieved.');
  });

  it('deletes a time block correctly', async () => {
    const block = await service.tasks.createTimeBlock({
      taskTitle: 'Temporary Planning Scratch',
      date: testDate,
      startHour: 16,
      durationMinutes: 45,
      priority: 'low'
    });

    const deleted = await service.tasks.deleteTimeBlock(block.id);
    expect(deleted).toBe(true);

    const blocksAfter = await service.tasks.getTimeBlocks(testDate);
    expect(blocksAfter.some((b) => b.id === block.id)).toBe(false);
  });

  it('processes frictionless hour review with completion and reflection', async () => {
    const block = await service.tasks.createTimeBlock({
      taskTitle: 'Master Raft Consensus Proof',
      date: testDate,
      startHour: 13,
      durationMinutes: 60,
      priority: 'urgent'
    });

    const reviewPayload: TimeBlockReviewPayload = {
      status: 'completed',
      actualMinutes: 60,
      progressPercent: 100,
      reflection: 'Verified leader election and log replication safety theorems.'
    };

    const reviewResult = await service.tasks.reviewTimeBlock(block.id, reviewPayload);

    expect(reviewResult.updatedBlock.status).toBe('completed');
    expect(reviewResult.updatedBlock.actualMinutes).toBe(60);
    expect(reviewResult.updatedBlock.progressPercent).toBe(100);
    expect(reviewResult.updatedBlock.reflection).toContain('leader election');
    expect(reviewResult.rescheduledBlock).toBeUndefined();
  });

  it('processes hour review with partial completion and 1-click reschedule to next hour', async () => {
    const block = await service.tasks.createTimeBlock({
      taskTitle: 'Implement Distributed Hash Ring',
      date: testDate,
      startHour: 14,
      durationMinutes: 60,
      priority: 'high'
    });

    const reviewPayload: TimeBlockReviewPayload = {
      status: 'partial',
      actualMinutes: 45,
      progressPercent: 60,
      reflection: 'Hash function done, virtual nodes pending.',
      rescheduleToHour: 15
    };

    const reviewResult = await service.tasks.reviewTimeBlock(block.id, reviewPayload);

    expect(reviewResult.updatedBlock.status).toBe('partial');
    expect(reviewResult.updatedBlock.progressPercent).toBe(60);

    // Rescheduled block should exist for hour 15
    expect(reviewResult.rescheduledBlock).toBeDefined();
    expect(reviewResult.rescheduledBlock?.startHour).toBe(15);
    expect(reviewResult.rescheduledBlock?.taskTitle).toBe(block.taskTitle);
    expect(reviewResult.rescheduledBlock?.status).toBe('planned');
    expect(reviewResult.rescheduledBlock?.date).toBe(testDate);

    // Both blocks should exist in today's grid
    const allBlocks = await service.tasks.getTimeBlocks(testDate);
    expect(allBlocks.some((b) => b.id === block.id)).toBe(true);
    expect(allBlocks.some((b) => b.id === reviewResult.rescheduledBlock?.id)).toBe(true);
  });

  it('processes hour review with missed status and reschedule to next day', async () => {
    const block = await service.tasks.createTimeBlock({
      taskTitle: 'Database Migration Testing',
      date: testDate,
      startHour: 17,
      durationMinutes: 60,
      priority: 'high'
    });

    const tomorrow = '2026-09-23';
    const reviewPayload: TimeBlockReviewPayload = {
      status: 'missed',
      actualMinutes: 0,
      progressPercent: 0,
      reflection: 'Interrupted by team meeting.',
      rescheduleToDate: tomorrow,
      rescheduleToHour: 10
    };

    const reviewResult = await service.tasks.reviewTimeBlock(block.id, reviewPayload);

    expect(reviewResult.updatedBlock.status).toBe('missed');
    expect(reviewResult.rescheduledBlock).toBeDefined();
    expect(reviewResult.rescheduledBlock?.date).toBe(tomorrow);
    expect(reviewResult.rescheduledBlock?.startHour).toBe(10);
    expect(reviewResult.rescheduledBlock?.status).toBe('planned');
  });

  it('reschedules time block to another hour or date directly', async () => {
    const block = await service.tasks.createTimeBlock({
      taskTitle: 'Review Peer PRs',
      date: testDate,
      startHour: 10,
      durationMinutes: 30,
      priority: 'medium'
    });

    const moved = await service.tasks.rescheduleTimeBlock(block.id, testDate, 16);
    expect(moved.startHour).toBe(16);
    expect(moved.date).toBe(testDate);

    const blocks = await service.tasks.getTimeBlocks(testDate);
    const found = blocks.find((b) => b.id === block.id);
    expect(found?.startHour).toBe(16);
  });
});
