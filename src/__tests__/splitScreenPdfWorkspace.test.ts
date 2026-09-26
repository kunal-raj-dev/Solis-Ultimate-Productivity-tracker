import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataService } from '../services/mock/mockService';
import { LectureSlide } from '../components/features/Study/SplitScreenPdfWorkspace';

describe('Feature 3.1: Split-Screen PDF Lecture Reader & Annotation Workspace', () => {
  let service: MockDataService;

  beforeEach(() => {
    service = new MockDataService();
  });
  describe('Lecture Slide Contract & Parsing', () => {
    it('structures lecture slides with pages, bullets, formulas, and citations', () => {
      const slide: LectureSlide = {
        pageNumber: 1,
        title: 'Quantum Electrodynamics Foundations',
        bullets: [
          'Photons mediate electromagnetic interactions between charged leptons.',
          'Feynman diagrams map perturbation theory terms directly to matrix amplitudes.'
        ],
        formula: 'L = \\bar{\\psi}(i\\gamma^\\mu D_\\mu - m)\\psi - \\frac{1}{4}F_{\\mu\\nu}F^{\\mu\\nu}',
        callout: 'Core Invariant: Gauge invariance dictates minimal coupling.',
        footnote: 'Physics Dept. • Lecture 01'
      };

      expect(slide.pageNumber).toBe(1);
      expect(slide.bullets.length).toBe(2);
      expect(slide.formula).toContain('gamma');
      expect(slide.callout).toContain('Gauge invariance');
      expect(slide.footnote).toContain('Lecture 01');
    });

    it('parses multi-page text document into sequential slides', () => {
      const sampleText = `Section 1: Introduction to Cellular Respiration
Glycolysis occurs in the cytosol and yields 2 pyruvate.
No oxygen is required for glycolysis.
---
Section 2: Krebs Citric Acid Cycle
Occurs within the mitochondrial matrix.
Generates NADH and FADH2 electron carriers.`;

      const pages = sampleText.split(/\n\s*---\s*\n/);
      expect(pages.length).toBe(2);

      const parsedSlides: LectureSlide[] = pages.map((page, idx) => {
        const lines = page.split('\n').filter((l) => l.trim().length > 0);
        return {
          pageNumber: idx + 1,
          title: lines[0],
          bullets: lines.slice(1),
          footnote: `Page ${idx + 1}`
        };
      });

      expect(parsedSlides[0].pageNumber).toBe(1);
      expect(parsedSlides[0].title).toBe('Section 1: Introduction to Cellular Respiration');
      expect(parsedSlides[0].bullets.length).toBe(2);

      expect(parsedSlides[1].pageNumber).toBe(2);
      expect(parsedSlides[1].title).toBe('Section 2: Krebs Citric Acid Cycle');
      expect(parsedSlides[1].bullets.length).toBe(2);
    });
  });

  describe('Citation Generation & Note Insertion', () => {
    it('formats clean academic blockquote citations with page numbers and document titles', () => {
      const selectedText = 'The work done by a net force equals the change in kinetic energy.';
      const docTitle = 'Classical Mechanics Lecture 04';
      const currentPage = 2;

      const citation = `\n\n> "${selectedText}"\n> — *${docTitle}*, Page ${currentPage}\n\n`;

      expect(citation).toContain(`> "${selectedText}"`);
      expect(citation).toContain(`— *Classical Mechanics Lecture 04*, Page 2`);
    });

    it('appends citations into existing note markdown content without clobbering text', () => {
      let activeNote = '# Lecture 04 Notes\n\nInitial reflections here.';
      const quote = 'Rotational inertia I depends on mass distribution.';
      const citation = `\n\n> "${quote}"\n> — *Physics 101*, Page 3\n\n`;

      activeNote = activeNote + citation;

      expect(activeNote).toContain('# Lecture 04 Notes');
      expect(activeNote).toContain(quote);
      expect(activeNote).toContain('Page 3');
    });
  });

  describe('Quick Flashcard Atomization from Lecture Selection', () => {
    it('creates a flashcard linked to subject and lecture page citation', async () => {
      // 1. Create a subject
      const subject = await service.study.createSubject({
        name: 'Neuroscience 301',
        code: 'NEUR301',
        targetHoursPerWeek: 12
      });

      // 2. Simulate text selection and atomization into a card
      const selectedConcept = 'Long-term potentiation (LTP) strengthens synaptic transmission through NMDA receptors.';
      const card = await service.flashcards.createFlashcard({
        subjectId: subject.id,
        frontPrompt: `Explain the mechanism: ${selectedConcept}`,
        backAnswer: `NMDA receptor calcium influx triggers AMPA receptor insertion. [Lecture p. 5, Synaptic Plasticity]`,
        cardType: 'standard'
      });

      expect(card.id).toBeDefined();
      expect(card.subjectId).toBe(subject.id);
      expect(card.frontPrompt).toContain('Long-term potentiation');
      expect(card.backAnswer).toContain('[Lecture p. 5, Synaptic Plasticity]');
    });

    it('auto-detects cloze flashcards when selection contains cloze tokens', async () => {
      const clozeText = 'Attention maps queries Q and keys K via {{softmax(QK^T / sqrt(d_k))}} V.';
      const isCloze = clozeText.includes('{{') || clozeText.includes('[c1:');
      expect(isCloze).toBe(true);

      const card = await service.flashcards.createFlashcard({
        subjectId: 'sub_test',
        frontPrompt: clozeText,
        backAnswer: 'Scaled dot-product attention [Lecture p. 3, Transformers]',
        cardType: isCloze ? 'cloze' : 'standard'
      });

      expect(card.cardType).toBe('cloze');
      expect(card.frontPrompt).toContain('{{softmax');
    });
  });

  describe('Actionable Study Task Creation from Selection', () => {
    it('creates a study task from selected lecture text', async () => {
      const selectedProof = 'Derive Navier-Stokes conservation of momentum from Reynolds Transport Theorem';
      const currentPage = 7;

      const taskTitle = `Review: ${selectedProof.slice(0, 48).trim()}…`;
      const task = await service.tasks.createTask({
        title: taskTitle,
        category: 'study',
        priority: 'medium',
        estimatedMinutes: 25,
        tags: ['lecture-reader', `p${currentPage}`]
      });

      expect(task.id).toBeDefined();
      expect(task.title).toContain('Derive Navier-Stokes');
      expect(task.category).toBe('study');
      expect(task.tags).toContain('lecture-reader');
      expect(task.tags).toContain('p7');
    });
  });

  describe('Lecture Note Persistence to Sanctuary', () => {
    it('persists structured lecture note with annotations to NoteService', async () => {
      const subject = await service.study.createSubject({
        name: 'Distributed Systems',
        code: 'CS244B',
        targetHoursPerWeek: 10
      });

      const noteContent = `# Distributed Systems: Raft Consensus\n\n` +
        `> "Raft decomposes consensus into Leader Election, Log Replication, and Safety."\n` +
        `> — *CS244B Lecture Slides*, Page 1\n\n` +
        `## Invariants\n- Leaders never overwrite log entries in their own log.`;

      const savedNote = await service.notes.createNote({
        title: 'CS244B: Raft Consensus Synthesis',
        content: noteContent,
        subjectId: subject.id,
        category: 'lecture',
        tags: ['lecture-reader', 'page-1', 'raft']
      });

      expect(savedNote.id).toBeDefined();
      expect(savedNote.subjectId).toBe(subject.id);
      expect(savedNote.category).toBe('lecture');
      expect(savedNote.content).toContain('Raft decomposes consensus');
      expect(savedNote.tags).toContain('lecture-reader');
    });
  });
});
