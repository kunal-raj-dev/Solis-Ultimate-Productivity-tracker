import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import {
  ScholarObservatoryIllustration,
  StudySanctuaryEmptyIllustration,
  NotesEmptyIllustration,
  TasksEmptyIllustration,
  FocusZenIllustration
} from '../components/illustrations';
import { EmptyState } from '../components/feedback/EmptyState/EmptyState';

describe('Editorial Art & Vector Illustration Suite', () => {
  describe('Handcrafted Vector Illustrations', () => {
    it('renders ScholarObservatoryIllustration with SVG geometry and celestial details', () => {
      const html = renderToStaticMarkup(
        React.createElement(ScholarObservatoryIllustration, {
          className: 'custom-scholar-class',
          width: 500,
          height: 340
        })
      );

      expect(html).toContain('<svg');
      expect(html).toContain('viewBox="0 0 480 320"');
      expect(html).toContain('width="500"');
      expect(html).toContain('height="340"');
      expect(html).toContain('custom-scholar-class');
      expect(html).toContain('solis-illustration--floating');
      expect(html).toContain('solis-obs-lamp-glow');
      expect(html).toContain('solis-obs-brass');
      expect(html).toContain('solis-obs-coral');
      expect(html).toContain('solis-illustration--pulsing');
      expect(html).toContain('aria-label="Solis Scholar Observatory — A quiet sanctuary for ambitious minds"');
    });

    it('renders StudySanctuaryEmptyIllustration with syllabus nodes and folios', () => {
      const html = renderToStaticMarkup(
        React.createElement(StudySanctuaryEmptyIllustration, {
          className: 'test-study-empty'
        })
      );

      expect(html).toContain('<svg');
      expect(html).toContain('viewBox="0 0 240 180"');
      expect(html).toContain('test-study-empty');
      expect(html).toContain('solis-illustration--floating');
      expect(html).toContain('solis-study-aura');
      expect(html).toContain('aria-label="Empty Study Syllabus Illustration"');
    });

    it('renders NotesEmptyIllustration with parchment codex and fountain pen', () => {
      const html = renderToStaticMarkup(
        React.createElement(NotesEmptyIllustration, {
          className: 'test-notes-empty'
        })
      );

      expect(html).toContain('<svg');
      expect(html).toContain('viewBox="0 0 240 180"');
      expect(html).toContain('test-notes-empty');
      expect(html).toContain('solis-notes-glow');
      expect(html).toContain('aria-label="Empty Knowledge Notes Illustration"');
    });

    it('renders TasksEmptyIllustration with dawn horizon and balance quadrant', () => {
      const html = renderToStaticMarkup(
        React.createElement(TasksEmptyIllustration, {
          className: 'test-tasks-empty'
        })
      );

      expect(html).toContain('<svg');
      expect(html).toContain('viewBox="0 0 240 180"');
      expect(html).toContain('test-tasks-empty');
      expect(html).toContain('solis-task-dawn');
      expect(html).toContain('aria-label="Empty Tasks Horizon Illustration"');
    });

    it('renders FocusZenIllustration with concentric cymatics focal rings', () => {
      const html = renderToStaticMarkup(
        React.createElement(FocusZenIllustration, {
          className: 'test-focus-zen'
        })
      );

      expect(html).toContain('<svg');
      expect(html).toContain('viewBox="0 0 240 180"');
      expect(html).toContain('test-focus-zen');
      expect(html).toContain('solis-zen-glow');
      expect(html).toContain('aria-label="Focus Zen Sanctuary Flow Illustration"');
    });
  });

  describe('EmptyState Integration with Handcrafted Artwork', () => {
    const renderWithRouter = (ui: React.ReactElement) => {
      return renderToStaticMarkup(React.createElement(MemoryRouter, null, ui));
    };

    it('renders study illustration when illustration="study" is supplied', () => {
      const html = renderWithRouter(
        React.createElement(EmptyState, {
          illustration: 'study',
          title: 'No study subjects yet',
          description: 'Create your first subject to begin'
        })
      );

      expect(html).toContain('solis-empty-state__illustration-wrap');
      expect(html).toContain('solis-illustration');
      expect(html).toContain('solis-study-aura');
      expect(html).toContain('No study subjects yet');
      expect(html).toContain('Create your first subject to begin');
    });

    it('renders notes illustration when illustration="notes" is supplied', () => {
      const html = renderWithRouter(
        React.createElement(EmptyState, {
          illustration: 'notes',
          title: 'No notes in this collection',
          description: 'Draft your first insight'
        })
      );

      expect(html).toContain('solis-empty-state__illustration-wrap');
      expect(html).toContain('solis-notes-glow');
      expect(html).toContain('No notes in this collection');
    });

    it('renders tasks illustration when illustration="tasks" is supplied', () => {
      const html = renderWithRouter(
        React.createElement(EmptyState, {
          illustration: 'tasks',
          title: 'Clear horizon',
          description: 'No pending tasks in this view'
        })
      );

      expect(html).toContain('solis-empty-state__illustration-wrap');
      expect(html).toContain('solis-task-dawn');
      expect(html).toContain('Clear horizon');
    });

    it('renders focus zen illustration when illustration="focus" is supplied', () => {
      const html = renderWithRouter(
        React.createElement(EmptyState, {
          illustration: 'focus',
          title: 'Deep quietude',
          description: 'Start a focus sanctuary session'
        })
      );

      expect(html).toContain('solis-empty-state__illustration-wrap');
      expect(html).toContain('solis-zen-glow');
      expect(html).toContain('Deep quietude');
    });

    it('falls back to icon rendering when no illustration is provided', () => {
      const html = renderWithRouter(
        React.createElement(EmptyState, {
          icon: Sparkles,
          title: 'Standard Empty State',
          description: 'No illustration used'
        })
      );

      expect(html).not.toContain('solis-empty-state__illustration-wrap');
      expect(html).toContain('solis-empty-state__icon-wrap');
      expect(html).toContain('lucide-sparkles');
      expect(html).toContain('Standard Empty State');
    });
  });
});
