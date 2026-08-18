import { describe, it, expect } from 'vitest';
import {
  validateTaskInput,
  validateStudySessionInput,
  validateHabitInput,
  validateGoalInput
} from '../utils/validation';

describe('Domain Validation Layer', () => {
  it('rejects empty or whitespace-only task titles', () => {
    const emptyResult = validateTaskInput({ title: '' });
    expect(emptyResult.success).toBe(false);
    if (!emptyResult.success) {
      expect(emptyResult.field).toBe('title');
    }

    const spaceResult = validateTaskInput({ title: '   ' });
    expect(spaceResult.success).toBe(false);
  });

  it('accepts valid task input', () => {
    const validResult = validateTaskInput({
      title: 'Master Raft Consensus Invariants',
      category: 'study',
      priority: 'high',
      estimatedMinutes: 60,
      dueDate: '2026-08-17'
    });
    expect(validResult.success).toBe(true);
  });

  it('validates study session duration and topics', () => {
    const invalidDuration = validateStudySessionInput({
      subjectName: 'Distributed Systems',
      durationMinutes: 0,
      topicsCovered: ['Raft']
    });
    expect(invalidDuration.success).toBe(false);

    const emptyTopics = validateStudySessionInput({
      subjectName: 'Distributed Systems',
      durationMinutes: 45,
      topicsCovered: []
    });
    expect(emptyTopics.success).toBe(false);

    const valid = validateStudySessionInput({
      subjectName: 'Distributed Systems',
      durationMinutes: 45,
      topicsCovered: ['Leader Election']
    });
    expect(valid.success).toBe(true);
  });

  it('validates habit title requirement', () => {
    expect(validateHabitInput({ title: '' }).success).toBe(false);
    expect(validateHabitInput({ title: 'Morning Deep Study' }).success).toBe(true);
  });

  it('validates goal title requirement', () => {
    expect(validateGoalInput({ title: '' }).success).toBe(false);
    expect(validateGoalInput({ title: 'Publish Systems Whitepaper' }).success).toBe(true);
  });
});
