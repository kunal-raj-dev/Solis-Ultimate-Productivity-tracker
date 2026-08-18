import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataService } from '../services/mock/mockService';

describe('Knowledge Core — Study Resources & Citations Suite', () => {
  let mockService: MockDataService;

  beforeEach(() => {
    mockService = new MockDataService();
  });

  it('retrieves default cataloged study resources', async () => {
    const resources = await mockService.resources.getResources();
    expect(resources.length).toBeGreaterThanOrEqual(4);
    const raftPaper = resources.find((r) => r.title.includes('Raft Paper'));
    expect(raftPaper).toBeDefined();
    expect(raftPaper?.subjectName).toBe('Distributed Systems');
    expect(raftPaper?.type).toBe('paper');
    expect(raftPaper?.status).toBe('in_progress');
  });

  it('filters resources by subject, topic, type, and reading status', async () => {
    // Subject filter
    const distSysResources = await mockService.resources.getResources({ subjectId: 'sbj_1' });
    expect(distSysResources.every((r) => r.subjectId === 'sbj_1')).toBe(true);

    // Type filter
    const books = await mockService.resources.getResources({ type: 'book' });
    expect(books.every((b) => b.type === 'book')).toBe(true);
    expect(books.length).toBeGreaterThanOrEqual(2);

    // Status filter
    const completed = await mockService.resources.getResources({ status: 'completed' });
    expect(completed.every((c) => c.status === 'completed')).toBe(true);

    // Search query filter
    const searchResults = await mockService.resources.getResources({ search: 'kleppmann' });
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].author).toContain('Martin Kleppmann');
  });

  it('validates mandatory fields on resource creation', async () => {
    await expect(
      mockService.resources.createResource({
        title: '',
        subjectId: 'sbj_1'
      })
    ).rejects.toThrow('Resource requires a title and associated study subject.');

    await expect(
      mockService.resources.createResource({
        title: 'Valid Title',
        subjectId: ''
      })
    ).rejects.toThrow('Resource requires a title and associated study subject.');
  });

  it('catalogs a new study resource and updates subject/topic references', async () => {
    const created = await mockService.resources.createResource({
      subjectId: 'sbj_2',
      topicId: 'top_3',
      title: 'Graph Algorithms in the Real World',
      author: 'Robert Sedgewick (Princeton)',
      url: 'https://algs4.cs.princeton.edu',
      type: 'book',
      status: 'unread',
      tags: ['princeton', 'sedgewick', 'graphs']
    });

    expect(created.id).toBeDefined();
    expect(created.subjectName).toBe('Advanced Algorithms');
    expect(created.topicTitle).toBe('Topological Sort & DAGs');
    expect(created.tags).toContain('sedgewick');

    const fetched = await mockService.resources.getResourceById(created.id);
    expect(fetched?.title).toBe('Graph Algorithms in the Real World');
  });

  it('updates reading status and ratings on existing resources', async () => {
    const resources = await mockService.resources.getResources();
    const target = resources[0];

    const updated = await mockService.resources.updateResource(target.id, {
      status: 'completed',
      rating: 5,
      notes: 'Fully read and distilled into permanent note.'
    });

    expect(updated.status).toBe('completed');
    expect(updated.rating).toBe(5);
    expect(updated.notes).toContain('distilled into permanent note');
  });

  it('deletes a cataloged resource cleanly', async () => {
    const created = await mockService.resources.createResource({
      subjectId: 'sbj_1',
      title: 'Temporary Whitepaper',
      type: 'paper'
    });

    const deleted = await mockService.resources.deleteResource(created.id);
    expect(deleted).toBe(true);

    const fetched = await mockService.resources.getResourceById(created.id);
    expect(fetched).toBeNull();
  });
});
