import { describe, it, expect } from 'vitest';
import {
  SOLIS_GUIDES,
  GUIDE_CATEGORIES,
  findGuideById,
  searchGuides
} from '../data/guides';

describe('Solis Guide Center V2 — Content Model & Search', () => {
  it('contains all 18 structured guides across 6 categories', () => {
    expect(SOLIS_GUIDES.length).toBe(18);
    expect(GUIDE_CATEGORIES.length).toBe(6);

    const categoriesInGuides = new Set(SOLIS_GUIDES.map((g) => g.category));
    expect(categoriesInGuides.size).toBe(6);

    GUIDE_CATEGORIES.forEach((cat) => {
      const matchingGuides = SOLIS_GUIDES.filter((g) => g.category === cat.id);
      expect(matchingGuides.length).toBeGreaterThan(0);
    });
  });

  it('validates that every guide conforms to the V2 structural schema', () => {
    SOLIS_GUIDES.forEach((guide) => {
      expect(guide.id).toBeTruthy();
      expect(guide.title).toBeTruthy();
      expect(guide.summary).toBeTruthy();
      expect(guide.whenToUse).toBeTruthy();
      expect(guide.steps.length).toBeGreaterThanOrEqual(2);
      expect(guide.connection).toBeDefined();
      expect(guide.connection.explanation).toBeTruthy();

      // V2 required fields
      expect(guide.estimatedMinutes).toBeDefined();
      expect(typeof guide.estimatedMinutes).toBe('number');
      expect(guide.estimatedMinutes).toBeGreaterThan(0);

      expect(guide.relatedGuides).toBeDefined();
      expect(Array.isArray(guide.relatedGuides)).toBe(true);
      expect(guide.relatedGuides!.length).toBeGreaterThanOrEqual(1);

      // Check step numbering
      guide.steps.forEach((step, idx) => {
        expect(step.stepNumber).toBe(idx + 1);
        expect(step.title).toBeTruthy();
        expect(step.description).toBeTruthy();
      });

      // If action is present, verify target path starts with /app
      if (guide.action) {
        expect(guide.action.targetPath.startsWith('/app')).toBe(true);
        expect(guide.action.label).toBeTruthy();
      }
    });
  });

  it('validates relatedGuides references resolve to valid guides', () => {
    SOLIS_GUIDES.forEach((guide) => {
      if (guide.relatedGuides) {
        guide.relatedGuides.forEach((relatedId) => {
          const related = findGuideById(relatedId);
          expect(related).toBeDefined();
        });
      }
    });
  });

  it('validates step completionCheck keys are well-formed', () => {
    const validCheckKeys = [
      'has-subject',
      'has-task',
      'has-focus-session',
      'has-note',
      'has-habit',
      'has-goal',
      'has-flashcard'
    ];

    SOLIS_GUIDES.forEach((guide) => {
      guide.steps.forEach((step) => {
        if (step.completionCheck) {
          expect(validCheckKeys).toContain(step.completionCheck);
        }
      });
    });
  });

  it('validates step actions have typed action types', () => {
    const validActionTypes = [
      'navigate',
      'open-modal',
      'open-focus',
      'open-study',
      'open-task-creator',
      'open-note-creator'
    ];

    SOLIS_GUIDES.forEach((guide) => {
      guide.steps.forEach((step) => {
        if (step.action) {
          expect(step.action.label).toBeTruthy();
          expect(validActionTypes).toContain(step.action.type);
        }
      });
    });
  });

  it('Grow category has label "Consistency"', () => {
    const growCat = GUIDE_CATEGORIES.find((c) => c.id === 'grow');
    expect(growCat).toBeDefined();
    expect(growCat!.label).toBe('Consistency');
  });

  describe('findGuideById', () => {
    it('returns the exact guide when given a valid ID', () => {
      const guide = findGuideById('task-sanctuary');
      expect(guide).toBeDefined();
      expect(guide?.title).toContain('Task Sanctuary');
    });

    it('returns undefined when given a non-existent ID', () => {
      const guide = findGuideById('non-existent-guide');
      expect(guide).toBeUndefined();
    });

    it('finds all 18 guides by their IDs', () => {
      SOLIS_GUIDES.forEach((guide) => {
        const found = findGuideById(guide.id);
        expect(found).toBeDefined();
        expect(found?.id).toBe(guide.id);
      });
    });
  });

  describe('searchGuides — Weighted Scoring & Question Matching', () => {
    it('returns all guides when query is empty', () => {
      expect(searchGuides('').length).toBe(SOLIS_GUIDES.length);
      expect(searchGuides('   ').length).toBe(SOLIS_GUIDES.length);
    });

    it('returns results sorted by relevance (title matches first)', () => {
      const results = searchGuides('focus sanctuary');
      expect(results.length).toBeGreaterThan(0);
      // The guide with "Focus Sanctuary" in the title should come first
      expect(results[0].title.toLowerCase()).toContain('focus sanctuary');
    });

    it('answers "How do I study?"', () => {
      const results = searchGuides('how do i study');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((g) => g.id === 'study-studio' || g.id === 'your-first-study-day')).toBe(true);
    });

    it('answers "How do I start a timer?"', () => {
      const results = searchGuides('how to start a timer');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((g) => g.id === 'focus-sanctuary')).toBe(true);
    });

    it('answers "Why is my momentum empty?"', () => {
      const results = searchGuides('why is my momentum empty');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((g) => g.id === 'cognitive-rhythm')).toBe(true);
    });

    it('answers "How to remember" or "Active Recall"', () => {
      const results = searchGuides('how to remember');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((g) => g.id === 'active-recall-flashcards')).toBe(true);
    });

    it('answers "Theme" or "Dark Mode"', () => {
      const results = searchGuides('dark mode');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((g) => g.id === 'atmosphere-and-themes')).toBe(true);
    });

    it('answers "pomodoro"', () => {
      const results = searchGuides('pomodoro');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((g) => g.id === 'focus-sanctuary' || g.id === 'pomodoro-vs-deep-flow')).toBe(true);
    });

    it('answers "streak" or "consistency"', () => {
      const results = searchGuides('streak');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((g) => g.id === 'rituals-and-consistency')).toBe(true);
    });

    it('answers "weekly planning"', () => {
      const results = searchGuides('weekly planning');
      expect(results.length).toBeGreaterThan(0);
    });

    it('strips filler words from queries', () => {
      // "how do I start" → "start" after stripping fillers
      const results = searchGuides('how do i start');
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns no results for completely irrelevant query', () => {
      const results = searchGuides('xyznonexistentterm12345');
      expect(results.length).toBe(0);
    });
  });

  describe('Guide Content Quality', () => {
    it('no guide has more than 6 steps (keep guides concise)', () => {
      SOLIS_GUIDES.forEach((guide) => {
        expect(guide.steps.length).toBeLessThanOrEqual(6);
      });
    });

    it('all guide summaries are under 150 characters (scannable)', () => {
      SOLIS_GUIDES.forEach((guide) => {
        expect(guide.summary.length).toBeLessThanOrEqual(150);
      });
    });

    it('all guides have keywords for searchability', () => {
      SOLIS_GUIDES.forEach((guide) => {
        expect(guide.keywords).toBeDefined();
        expect(guide.keywords!.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('key activation guides have step actions', () => {
      const keyGuides = ['first-10-minutes', 'study-studio', 'task-sanctuary', 'focus-sanctuary'];
      keyGuides.forEach((id) => {
        const guide = findGuideById(id);
        expect(guide).toBeDefined();
        const stepsWithActions = guide!.steps.filter((s) => s.action);
        expect(stepsWithActions.length).toBeGreaterThan(0);
      });
    });

    it('key activation guides have completionCheck steps', () => {
      const keyGuides = ['first-10-minutes', 'task-sanctuary', 'study-studio', 'focus-sanctuary'];
      keyGuides.forEach((id) => {
        const guide = findGuideById(id);
        expect(guide).toBeDefined();
        const stepsWithChecks = guide!.steps.filter((s) => s.completionCheck);
        expect(stepsWithChecks.length).toBeGreaterThan(0);
      });
    });
  });
});
