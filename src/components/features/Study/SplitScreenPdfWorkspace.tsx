import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Brain,
  Quote,
  CheckSquare,
  Save,
  Bold,
  Italic,
  List,
  Code,
  Eye,
  Edit3,
  BookOpen,
  Sparkles,
  Upload
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { Badge } from '../../ui/Badge/Badge';
import { useToast } from '../../../context/ToastContext';
import { dataService } from '../../../services/dataService';
import { StudySubject, StudyTopic } from '../../../types/study';
import { StudyResource } from '../../../types/resource';
import './SplitScreenPdfWorkspace.css';

export interface LectureSlide {
  pageNumber: number;
  title: string;
  bullets: string[];
  callout?: string;
  formula?: string;
  footnote?: string;
}

export interface SplitScreenPdfWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  resource?: StudyResource | null;
  subject?: StudySubject | null;
  topic?: StudyTopic | null;
  subjects?: StudySubject[];
  topics?: StudyTopic[];
}

const SAMPLE_LECTURES: Record<string, { title: string; slides: LectureSlide[] }> = {
  physics: {
    title: 'Kinematics & Conservation Laws',
    slides: [
      {
        pageNumber: 1,
        title: 'Lecture 04: Classical Mechanics & Motion',
        bullets: [
          'Kinematics describes motion without considering the forces causing it.',
          'Position vector r(t), instantaneous velocity v(t) = dr/dt, and acceleration a(t) = dv/dt.',
          'Constant acceleration trajectories follow parabolic paths in uniform gravitational fields.'
        ],
        formula: 'v_f^2 = v_i^2 + 2a\\Delta x',
        callout: 'Core Axiom: In the absence of net external force, momentum is conserved in all reference frames.',
        footnote: 'Physics Dept. • Prof. E. H. Bennett'
      },
      {
        pageNumber: 2,
        title: 'Work-Energy Theorem & Conservative Fields',
        bullets: [
          'The work done by a net force equals the change in kinetic energy of the particle.',
          'Potential energy functions U(x) only exist for curl-free conservative force fields.',
          'Mechanical energy E = K + U remains constant when only conservative forces do work.'
        ],
        formula: 'W_{net} = \\Delta K = \\int_{x_i}^{x_f} F(x)\\,dx',
        callout: 'Key Insight: Friction converts organized mechanical work into microscopic thermal entropy.',
        footnote: 'Physics Dept. • Lecture p. 2'
      },
      {
        pageNumber: 3,
        title: 'Rotational Dynamics & Angular Momentum',
        bullets: [
          'Rotational inertia I depends on mass distribution relative to the axis of rotation.',
          'Torque τ = r × F is the rotational analogue of force.',
          'Angular momentum L = Iω is conserved in the absence of net external torque.'
        ],
        formula: 'L = r \\times p = I \\omega',
        callout: 'Exam Highlight: Ice skater spin acceleration directly proves conservation of L as I decreases.',
        footnote: 'Physics Dept. • Lecture p. 3'
      }
    ]
  },
  default: {
    title: 'Foundations of Deep Learning & Neural Networks',
    slides: [
      {
        pageNumber: 1,
        title: 'Module 01: Perceptrons & Activation Functions',
        bullets: [
          'Artificial neurons compute a weighted sum of inputs followed by a non-linear activation.',
          'Without non-linearity, deep multilayer networks collapse to a single linear transformation.',
          'ReLU (Rectified Linear Unit) avoids vanishing gradients for positive activations.'
        ],
        formula: 'f(x) = \\max(0, W^T x + b)',
        callout: 'Vital Note: Modern LLMs rely heavily on SwiGLU and GELU activations for smoother backpropagation.',
        footnote: 'Computer Science Dept. • CS-229'
      },
      {
        pageNumber: 2,
        title: 'Gradient Descent & Backpropagation Algorithm',
        bullets: [
          'Backpropagation uses the calculus chain rule to calculate ∂L/∂W across layers.',
          'Stochastic Gradient Descent (SGD) computes noisy gradient estimates over mini-batches.',
          'Momentum and Adam optimizer track exponentially decaying moving averages of past gradients.'
        ],
        formula: 'W_{t+1} = W_t - \\eta \\nabla_W L(W_t)',
        callout: 'Leech Concept: Overfitting occurs when empirical train loss approaches 0 while validation loss diverges.',
        footnote: 'Computer Science Dept. • CS-229'
      },
      {
        pageNumber: 3,
        title: 'Attention Mechanism & Transformers',
        bullets: [
          'Self-attention maps queries Q, keys K, and values V into dynamic weighted context vectors.',
          'Scaled dot-product attention divides dot products by √d_k to prevent vanishing softmax gradients.',
          'Multi-head attention allows the model to attend to information at different representation subspaces.'
        ],
        formula: 'Attention(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V',
        callout: 'Breakthrough: Attention removes recurrence constraints, unlocking massive GPU parallelism.',
        footnote: 'Computer Science Dept. • CS-229'
      }
    ]
  }
};

export const SplitScreenPdfWorkspace: React.FC<SplitScreenPdfWorkspaceProps> = ({
  isOpen,
  onClose,
  resource,
  subject,
  topic,
  subjects = [],
  topics = []
}) => {
  const { addToast } = useToast();
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document state
  const [docTitle, setDocTitle] = useState(resource?.title || 'Lecture Slides');
  const [slides, setSlides] = useState<LectureSlide[]>(SAMPLE_LECTURES.default.slides);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Selected Subject & Topic
  const [selectedSubjectId, setSelectedSubjectId] = useState(subject?.id || resource?.subjectId || '');
  const [selectedTopicId, setSelectedTopicId] = useState(topic?.id || resource?.topicId || '');

  // Floating selection toolbar state
  const [selectedText, setSelectedText] = useState('');
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);

  // Markdown note editor state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteMode, setNoteMode] = useState<'edit' | 'preview'>('edit');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Mobile layout switch
  const [mobileTab, setMobileTab] = useState<'doc' | 'notes'>('doc');

  // Quick Flashcard Dialog state
  const [isQuickCardOpen, setIsQuickCardOpen] = useState(false);
  const [quickFront, setQuickFront] = useState('');
  const [quickBack, setQuickBack] = useState('');
  const [isCreatingCard, setIsCreatingCard] = useState(false);

  // Initialize slides & titles
  useEffect(() => {
    if (!isOpen) return;

    if (resource?.title) {
      setDocTitle(resource.title);
      setNoteTitle(`${resource.title} — Lecture Notes`);
    } else if (subject?.name) {
      setDocTitle(`${subject.name} Lecture Companion`);
      setNoteTitle(`${subject.name} — Lecture Synthesis`);
    } else {
      setDocTitle(SAMPLE_LECTURES.default.title);
      setNoteTitle('Lecture 01 Notes & Active Retrieval');
    }

    // Default lecture content
    const lectureKey = subject?.name?.toLowerCase().includes('phys') ? 'physics' : 'default';
    setSlides(SAMPLE_LECTURES[lectureKey].slides);
    setCurrentPage(1);
    setZoomLevel(100);
    setToolbarPos(null);
    setSelectedText('');

    // Pre-populate note starter template
    if (!noteContent) {
      setNoteContent(
        `# ${resource?.title || subject?.name || 'Lecture Notes'}\n\n` +
        `**Subject**: ${subject?.name || 'General'}\n` +
        `**Date**: ${new Date().toLocaleDateString()}\n\n` +
        `## Key Insights & Annotations\n` +
        `- Highlight any text in the left lecture slide to automatically quote with citation or generate flashcards.\n\n`
      );
    }
  }, [isOpen, resource, subject]);

  // Handle Text Selection in Document Pane
  const handleDocumentMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setToolbarPos(null);
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length < 2) {
      setToolbarPos(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (leftPaneRef.current) {
      const paneRect = leftPaneRef.current.getBoundingClientRect();
      const relativeX = rect.left - paneRect.left + rect.width / 2;
      const relativeY = rect.top - paneRect.top;

      setSelectedText(text);
      setToolbarPos({
        x: Math.max(120, Math.min(paneRect.width - 120, relativeX)),
        y: Math.max(40, relativeY)
      });
    }
  }, []);

  // Quick Action 1: Add to Note with Citation
  const handleAddCitationToNote = () => {
    if (!selectedText) return;
    const citation = `\n\n> "${selectedText}"\n> — *${docTitle}*, Page ${currentPage}\n\n`;
    setNoteContent((prev) => prev + citation);
    addToast({
      title: 'Citation Added to Note',
      description: `Quoted text with Page ${currentPage} reference.`,
      type: 'success'
    });
    setToolbarPos(null);
    window.getSelection()?.removeAllRanges();
  };

  // Quick Action 2: Open Quick Flashcard Creator
  const handleOpenQuickCard = () => {
    if (!selectedText) return;
    setQuickFront(selectedText);
    setQuickBack(`[Lecture p. ${currentPage}, ${docTitle}]`);
    setIsQuickCardOpen(true);
    setToolbarPos(null);
  };

  // Quick Action 3: Create Task
  const handleCreateTaskFromSelection = async () => {
    if (!selectedText) return;
    try {
      const title = `Review: ${selectedText.slice(0, 48).trim()}${selectedText.length > 48 ? '…' : ''}`;
      await dataService.tasks.createTask({
        title,
        subjectId: selectedSubjectId || undefined,
        category: 'study',
        priority: 'medium',
        estimatedMinutes: 25,
        tags: ['lecture-reader', `p${currentPage}`]
      });
      addToast({
        title: 'Study Task Created',
        description: `Linked to "${title}".`,
        type: 'success'
      });
    } catch {
      addToast({ title: 'Could not create task', type: 'error' });
    } finally {
      setToolbarPos(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  // Save Flashcard from Quick Dialog
  const handleSaveQuickCard = async () => {
    if (!quickFront.trim() || !quickBack.trim()) {
      addToast({ title: 'Both front and back are required', type: 'warning' });
      return;
    }
    setIsCreatingCard(true);
    try {
      await dataService.flashcards.createFlashcard({
        subjectId: selectedSubjectId || (subjects[0]?.id ?? 'default'),
        topicId: selectedTopicId || undefined,
        frontPrompt: quickFront.trim(),
        backAnswer: quickBack.trim(),
        cardType: quickFront.includes('{{') || quickFront.includes('[c1:') ? 'cloze' : 'standard'
      });
      addToast({
        title: 'Flashcard Synthesized',
        description: `Added to review queue with Page ${currentPage} citation.`,
        type: 'success'
      });
      setIsQuickCardOpen(false);
      setQuickFront('');
      setQuickBack('');
    } catch {
      addToast({ title: 'Failed to create flashcard', type: 'error' });
    } finally {
      setIsCreatingCard(false);
      window.getSelection()?.removeAllRanges();
    }
  };

  // Save Active Note
  const handleSaveNote = async () => {
    if (!noteTitle.trim()) {
      addToast({ title: 'Note title required', type: 'warning' });
      return;
    }
    setIsSavingNote(true);
    try {
      await dataService.notes.createNote({
        title: noteTitle.trim(),
        content: noteContent,
        subjectId: selectedSubjectId || undefined,
        topicId: selectedTopicId || undefined,
        category: 'lecture',
        tags: ['lecture-reader', `page-${currentPage}`]
      });
      addToast({
        title: 'Note Saved to Sanctuary',
        description: `Saved "${noteTitle}" with all lecture citations.`,
        type: 'success'
      });
    } catch {
      addToast({ title: 'Failed to save note', type: 'error' });
    } finally {
      setIsSavingNote(false);
    }
  };

  // Custom File Upload (.txt / .md / .pdf)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocTitle(file.name);
    setNoteTitle(`${file.name.replace(/\.[^/.]+$/, '')} — Lecture Notes`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Split into pages by double newline chunks or form-feeds
      const pages = text.split(/\f|\n\s*---\s*\n/).filter(Boolean);
      if (pages.length > 1) {
        setSlides(
          pages.map((p, idx) => ({
            pageNumber: idx + 1,
            title: `Section ${idx + 1}`,
            bullets: p.split('\n').filter((l) => l.trim().length > 0).slice(0, 8),
            footnote: file.name
          }))
        );
      }
      addToast({
        title: 'Document Loaded',
        description: `Loaded ${file.name} into Lecture Reader.`,
        type: 'success'
      });
    };
    reader.readAsText(file);
  };

  // Markdown Helper Actions
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    setNoteContent((prev) => `${prev}${prefix}${suffix}`);
  };

  if (!isOpen) return null;

  const totalPages = slides.length;
  const currentSlide = slides[currentPage - 1] || slides[0];

  return (
    <div
      className="solis-split-workspace-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Split-Screen PDF Lecture Reader Workspace"
    >
      <div className="solis-split-workspace">
        {/* Workspace Top Navigation Bar */}
        <header className="solis-split-header">
          <div className="solis-split-header__left">
            <BookOpen size={18} color="var(--color-coral-400)" />
            <span className="solis-split-header__title" title={docTitle}>
              {docTitle}
            </span>
            <Badge variant="coral">Split Reader</Badge>
          </div>

          <div className="solis-split-header__center">
            {/* Page Navigation */}
            <div className="solis-split-page-controls">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                aria-label="Previous Page"
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="solis-split-page-counter">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                aria-label="Next Page"
              >
                <ChevronRight size={16} />
              </Button>
            </div>

            {/* Zoom Controls */}
            <div className="solis-split-zoom-controls">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </Button>
              <span className="solis-split-zoom-level">{zoomLevel}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </Button>
            </div>
          </div>

          <div className="solis-split-header__right">
            {/* Mobile Tab Switcher */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <Button
                variant={mobileTab === 'doc' ? 'subtle' : 'ghost'}
                size="sm"
                onClick={() => setMobileTab('doc')}
                title="View Lecture Slides"
              >
                Slides
              </Button>
              <Button
                variant={mobileTab === 'notes' ? 'subtle' : 'ghost'}
                size="sm"
                onClick={() => setMobileTab('notes')}
                title="View Notes & Synthesis"
              >
                Notes
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Upload size={14} />}
              onClick={() => fileInputRef.current?.click()}
              title="Upload PDF or notes to read"
            >
              Upload Doc
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close Workspace"
            >
              <X size={18} />
            </Button>
          </div>
        </header>

        {/* Split Screen Workspace Body */}
        <div className="solis-split-body">
          {/* Left Pane: Lecture Document Canvas */}
          <div
            className={`solis-split-pane-left ${mobileTab === 'notes' ? 'solis-mobile-hidden' : ''}`}
            ref={leftPaneRef}
            onMouseUp={handleDocumentMouseUp}
          >
            <div className="solis-split-pane-scroll">
              <div
                className="solis-slide-canvas"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              >
                <div className="solis-slide-canvas__header">
                  <h3 className="solis-slide-canvas__title">{currentSlide.title}</h3>
                  <span className="solis-slide-canvas__deck-name">Slide {currentPage}</span>
                </div>

                <div className="solis-slide-canvas__content">
                  {currentSlide.bullets.length > 0 && (
                    <ul className="solis-slide-canvas__bullets">
                      {currentSlide.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}

                  {currentSlide.formula && (
                    <div className="solis-slide-formula">
                      {currentSlide.formula}
                    </div>
                  )}

                  {currentSlide.callout && (
                    <div className="solis-slide-callout">
                      💡 {currentSlide.callout}
                    </div>
                  )}
                </div>

                <div className="solis-slide-canvas__footer">
                  <span>{currentSlide.footnote || docTitle}</span>
                  <span>Select any text to cite or atomize into flashcards</span>
                </div>
              </div>
            </div>

            {/* Floating Selection Toolbar */}
            {toolbarPos && (
              <div
                className="solis-selection-toolbar"
                style={{ top: `${toolbarPos.y}px`, left: `${toolbarPos.x}px` }}
              >
                <button
                  type="button"
                  className="solis-selection-toolbar__btn solis-selection-toolbar__btn--accent"
                  onClick={handleOpenQuickCard}
                  title="Atomize selection into an active recall flashcard"
                >
                  <Brain size={13} />
                  <span>Create Flashcard</span>
                </button>
                <div className="solis-selection-divider" />
                <button
                  type="button"
                  className="solis-selection-toolbar__btn"
                  onClick={handleAddCitationToNote}
                  title="Append quoted block with lecture citation to active note"
                >
                  <Quote size={13} />
                  <span>Add to Note</span>
                </button>
                <div className="solis-selection-divider" />
                <button
                  type="button"
                  className="solis-selection-toolbar__btn"
                  onClick={handleCreateTaskFromSelection}
                  title="Create actionable study task"
                >
                  <CheckSquare size={13} />
                  <span>Create Task</span>
                </button>
              </div>
            )}

            {/* Inline Quick Flashcard Creator Dialog */}
            {isQuickCardOpen && (
              <div className="solis-quick-card-dialog">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="var(--color-coral-400)" />
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>Quick Flashcard Synthesis</span>
                  </div>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    onClick={() => setIsQuickCardOpen(false)}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Front Prompt (Question / Cloze)
                  </label>
                  <textarea
                    rows={2}
                    value={quickFront}
                    onChange={(e) => setQuickFront(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      padding: '6px 8px',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Back Answer & Citation
                  </label>
                  <input
                    type="text"
                    value={quickBack}
                    onChange={(e) => setQuickBack(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      padding: '6px 8px',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsQuickCardOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={handleSaveQuickCard}
                    isLoading={isCreatingCard}
                  >
                    Save Flashcard
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Pane: Markdown Notes & Synthesis Workspace */}
          <div className={`solis-split-pane-right ${mobileTab === 'doc' ? 'solis-mobile-hidden' : ''}`}>
            {/* Note Formatting Toolbar */}
            <div className="solis-note-toolbar">
              <div className="solis-note-toolbar__format">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertMarkdown('**', '**')}
                  title="Bold"
                >
                  <Bold size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertMarkdown('*', '*')}
                  title="Italic"
                >
                  <Italic size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertMarkdown('- ')}
                  title="Bullet List"
                >
                  <List size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertMarkdown('> ')}
                  title="Blockquote"
                >
                  <Quote size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertMarkdown('```\n', '\n```')}
                  title="Code Block"
                >
                  <Code size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertMarkdown('[c1:', ']')}
                  title="Solis Cloze"
                >
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>[c1]</span>
                </Button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button
                  variant={noteMode === 'preview' ? 'subtle' : 'ghost'}
                  size="sm"
                  onClick={() => setNoteMode((m) => (m === 'edit' ? 'preview' : 'edit'))}
                  leftIcon={noteMode === 'preview' ? <Edit3 size={14} /> : <Eye size={14} />}
                >
                  {noteMode === 'preview' ? 'Edit' : 'Preview'}
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  leftIcon={<Save size={14} />}
                  onClick={handleSaveNote}
                  isLoading={isSavingNote}
                >
                  Save Note
                </Button>
              </div>
            </div>

            {/* Note Title Input */}
            <input
              type="text"
              className="solis-note-title-input"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Lecture Note Title…"
            />

            {/* Editor or Markdown Preview */}
            <div className="solis-note-editor-wrap">
              {noteMode === 'edit' ? (
                <textarea
                  className="solis-note-textarea"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Type your lecture notes, insights, and synthesis here..."
                />
              ) : (
                <div className="solis-note-preview">
                  {noteContent.split('\n\n').map((paragraph, idx) => {
                    if (paragraph.startsWith('>')) {
                      return (
                        <blockquote key={idx}>
                          {paragraph.replace(/^>\s*/gm, '')}
                        </blockquote>
                      );
                    }
                    if (paragraph.startsWith('#')) {
                      const level = paragraph.match(/^#+/)?.[0].length || 1;
                      const text = paragraph.replace(/^#+\s*/, '');
                      return level === 1 ? (
                        <h2 key={idx}>{text}</h2>
                      ) : (
                        <h3 key={idx}>{text}</h3>
                      );
                    }
                    if (paragraph.startsWith('-')) {
                      const items = paragraph.split('\n').map((line) => line.replace(/^-\s*/, ''));
                      return (
                        <ul key={idx} style={{ margin: '8px 0 8px 20px' }}>
                          {items.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={idx}>{paragraph}</p>;
                  })}
                </div>
              )}
            </div>

            {/* Note Footer with Character / Word Count & Subject Tag */}
            <footer className="solis-note-footer">
              <span>
                {noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0} words •{' '}
                {noteContent.length} characters
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {subjects.length > 0 && (
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setSelectedTopicId('');
                    }}
                    style={{
                      background: 'var(--bg-surface-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm, 4px)',
                      fontSize: '11px',
                      padding: '2px 6px'
                    }}
                  >
                    <option value="">No Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
                {topics.length > 0 && (
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    style={{
                      background: 'var(--bg-surface-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm, 4px)',
                      fontSize: '11px',
                      padding: '2px 6px'
                    }}
                  >
                    <option value="">No Topic</option>
                    {topics
                      .filter((t) => !selectedSubjectId || t.subjectId === selectedSubjectId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                  </select>
                )}
                <span>
                  {subject?.name ? `Subject: ${subject.name}` : selectedSubjectId ? '' : 'General Notes'}
                </span>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};
