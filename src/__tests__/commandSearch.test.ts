import { describe, it, expect } from 'vitest';
import { searchWorkspace, DEFAULT_NAVIGATION_COMMANDS } from '../utils/commandSearch';
import { Task } from '../types/task';
import { Note } from '../types/note';
import { StudySubject, StudyTopic } from '../types/study';
import { Goal } from '../types/goal';

describe('Solis Workspace Search & Command Suite', () => {
  const mockTasks: Task[] = [
    {
      id: 't-1',
      title: 'Analyze Raft Protocol',
      category: 'study',
      priority: 'high',
      status: 'todo',
      subTasks: [],
      tags: ['distributed-systems'],
      createdAt: '2026-08-17',
      updatedAt: '2026-08-17'
    }
  ];

  const mockNotes: Note[] = [
    {
      id: 'n-1',
      title: 'Paxos vs Raft Consensus',
      content: 'Comparison of state machine replication approaches.',
      category: 'concept',
      tags: ['algorithms'],
      createdAt: '2026-08-17',
      updatedAt: '2026-08-17'
    }
  ];

  const mockSubjects: StudySubject[] = [
    {
      id: 'sub-1',
      name: 'Distributed Systems',
      color: 'coral',
      targetHoursPerWeek: 8,
      completedHoursThisWeek: 3,
      status: 'active',
      notesCount: 2,
      createdAt: '2026-08-17',
      updatedAt: '2026-08-17'
    }
  ];

  const mockTopics: StudyTopic[] = [
    {
      id: 'top-1',
      subjectId: 'sub-1',
      title: 'Vector Clocks',
      masteryLevel: 'mastered',
      orderIndex: 0,
      createdAt: '2026-08-17',
      updatedAt: '2026-08-17'
    }
  ];

  const mockGoals: Goal[] = [
    {
      id: 'g-1',
      title: 'Master Systems Architecture',
      horizon: 'medium_term',
      category: 'academic',
      priority: 'high',
      status: 'active',
      targetDate: '2026-12-31',
      progressPercentage: 40,
      color: 'amber',
      milestones: [],
      createdAt: '2026-08-17',
      updatedAt: '2026-08-17'
    }
  ];

  it('returns empty array when search query is empty', () => {
    const results = searchWorkspace('', { tasks: mockTasks });
    expect(results).toEqual([]);
  });

  it('finds tasks matching query by title or tag', () => {
    const results = searchWorkspace('raft', { tasks: mockTasks });
    expect(results.some((r) => r.title === 'Analyze Raft Protocol')).toBe(true);
    expect(results[0].type).toBe('task');
  });

  it('finds notes matching query by title or content', () => {
    const results = searchWorkspace('replication', { notes: mockNotes });
    expect(results.some((r) => r.title === 'Paxos vs Raft Consensus')).toBe(true);
    expect(results[0].type).toBe('note');
  });

  it('finds subjects and topics', () => {
    const results = searchWorkspace('vector', { topics: mockTopics, subjects: mockSubjects });
    expect(results.some((r) => r.title === 'Vector Clocks')).toBe(true);
    expect(results[0].type).toBe('topic');
  });

  it('finds goals matching title', () => {
    const results = searchWorkspace('systems architecture', { goals: mockGoals });
    expect(results.some((r) => r.title === 'Master Systems Architecture')).toBe(true);
    expect(results[0].type).toBe('goal');
  });

  it('finds navigation commands matching keyword', () => {
    const results = searchWorkspace('focus', {});
    expect(results.some((r) => r.title === 'Go to Focus Sanctuary')).toBe(true);
  });

  it('contains valid default navigation commands', () => {
    expect(DEFAULT_NAVIGATION_COMMANDS.length).toBeGreaterThanOrEqual(7);
    expect(DEFAULT_NAVIGATION_COMMANDS.some((c) => c.actionUrl === '/app/dashboard')).toBe(true);
  });
});
