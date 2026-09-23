import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Plus,
  Search,
  Trash2,
  FileText,
  Tag as TagIcon,
  X,
  BrainCircuit,
  Bookmark,
  ArrowLeft,
  BookOpen,
  Save,
  Download,
  Flame,
  Sparkles,
  CheckSquare
} from 'lucide-react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Input } from '../../components/ui/Input/Input';
import { CustomSelect } from '../../components/ui/Select/CustomSelect';
import { SegmentedControl } from '../../components/ui/SegmentedControl/SegmentedControl';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { ContextualHelp } from '../../components/ui/ContextualHelp/ContextualHelp';
import { EmptyState } from '../../components/feedback/EmptyState/EmptyState';
import { ConfirmationDialog } from '../../components/feedback/ConfirmationDialog/ConfirmationDialog';
import { FlashcardCreateModal } from '../../components/features/Flashcards/FlashcardCreateModal';
import { ResourceLibraryModal } from '../../components/features/Resources/ResourceLibraryModal';
import { AIGenerationModal } from '../../components/features/Notes/AIGenerationModal';
import { AITakeQuizModal } from '../../components/features/Notes/AITakeQuizModal';
import { MarkdownReadingView } from '../../components/features/Notes/MarkdownReadingView';
import { calculateNoteMetrics, serializeNoteToMarkdown } from '../../utils/notes/markdownParser';
import { useToast } from '../../context/ToastContext';
import { useGuide } from '../../context/GuideContext';
import { dataService } from '../../services/dataService';
import { Note, NoteCategory } from '../../types/note';
import { StudySubject, StudyTopic } from '../../types/study';
import { StudyResource } from '../../types/resource';
import { formatFriendlyDate } from '../../utils/date';
import { formatErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/classNames';
import './NotesPage.css';

const CATEGORIES: { value: NoteCategory; label: string }[] = [
  { value: 'concept', label: 'Concept' },
  { value: 'lecture', label: 'Lecture' },
  { value: 'problem_solving', label: 'Problem' },
  { value: 'revision', label: 'Revision' },
  { value: 'idea', label: 'Idea' },
  { value: 'reflection', label: 'Reflection' },
  { value: 'reference', label: 'Reference' }
];

export const NotesPage: React.FC = () => {
  const { addToast } = useToast();
  const { openGuide } = useGuide();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [mobileView, setMobileView] = useState<'index' | 'editor'>('index');
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isAIGenModalOpen, setIsAIGenModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || searchParams.get('search') || '');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');

  // Canvas State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>('concept');
  const [subjectId, setSubjectId] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [noteViewMode, setNoteViewMode] = useState<'edit' | 'read' | 'split'>('edit');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && notes.length > 0) {
      const match = notes.find((n) => n.title.toLowerCase() === q.toLowerCase());
      if (match && selectedNote?.id !== match.id) {
        handleSelectNote(match);
      }
    }
  }, [searchParams, notes, selectedNote]);

  useEffect(() => {
    const paramId = searchParams.get('id') || searchParams.get('noteId');
    if (paramId && notes.length > 0) {
      const match = notes.find((n) => n.id === paramId);
      if (match && selectedNote?.id !== match.id) {
        handleSelectNote(match);
      }
    }
  }, [searchParams, notes, selectedNote]);

  const noteMetrics = useMemo(() => calculateNoteMetrics(content), [content]);

  const handleExportMarkdown = () => {
    if (!selectedNote) return;
    const currentSubject = subjects.find((s) => s.id === subjectId);
    const md = serializeNoteToMarkdown({
      title: title || 'Untitled Note',
      content,
      category,
      subjectName: currentSubject?.name,
      tags,
      updatedAt: selectedNote.updatedAt
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'solis-note').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ title: 'Markdown Exported', description: 'Downloaded note as .md document.', type: 'success' });
  };

  const [initialLoadStatus, setInitialLoadStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [isRetrying, setIsRetrying] = useState(false);

  const hasInitializedSelectionRef = useRef(false);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = 'auto';
      titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`;
    }
  }, [title, selectedNote]);

  const handleCreateFlashcardFromNote = async (cardData: any) => {
    try {
      await dataService.flashcards.createFlashcard(cardData);
      addToast({ title: 'Flashcard Generated from Note', description: cardData.frontPrompt.substring(0, 40) + '...', type: 'success' });
    } catch (err) {
      addToast({ title: 'Could not create flashcard', type: 'error' });
    }
  };

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleConvertToTask = async () => {
    if (!selectedNote) return;

    let taskTitle = '';
    const textarea = contentTextareaRef.current;
    if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
      taskTitle = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
    }

    if (!taskTitle) {
      const lines = content.split('\n');
      const actionLine = lines.find((l) => /^(\s*[-*]\s*\[\s*\]|\s*[-*]\s*TODO:?|\s*TODO:?)/i.test(l));
      if (actionLine) {
        taskTitle = actionLine.replace(/^(\s*[-*]\s*\[\s*\]|\s*[-*]\s*TODO:?|\s*TODO:?)/i, '').trim();
      }
    }

    if (!taskTitle) {
      taskTitle = `Review note: ${title || 'Knowledge Note'}`;
    }

    try {
      const newTask = await dataService.tasks.createTask({
        title: taskTitle,
        description: `Generated from Knowledge Note: "${title || 'Untitled'}" (ID: ${selectedNote.id})`,
        priority: 'medium',
        status: 'todo',
        subjectId: subjectId || undefined
      });

      addToast({
        title: 'Task Created from Note',
        description: `"${newTask.title}" added to your task pipeline.`,
        type: 'success'
      });
    } catch (err) {
      addToast({
        title: 'Task Creation Failed',
        description: formatErrorMessage(err),
        type: 'error'
      });
    }
  };

  const handleCiteResource = (res: StudyResource) => {
    setContent((prev) => `${prev}\n\n> **Reference Citation**: [${res.title}](${res.url || '#'}) — *${res.author || 'Unknown'}*\n> ${res.notes || ''}\n`);
    setSaveStatus('unsaved');
    setIsResourceModalOpen(false);
    addToast({ title: 'Citation Appended', description: `Referenced "${res.title}" in active canvas.`, type: 'info' });
  };

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoadStatus('loading');
    else setSyncStatus('syncing');

    try {
      const [notesRes, subjectsRes, resourcesRes] = await Promise.allSettled([
        dataService.notes.getNotes({
          searchQuery,
          category: filterCategory === 'all' ? undefined : (filterCategory as NoteCategory),
          subjectId: filterSubjectId === 'all' ? undefined : filterSubjectId
        }),
        dataService.study.getSubjects(),
        dataService.resources ? dataService.resources.getResources() : Promise.resolve([])
      ]);

      if (notesRes.status === 'fulfilled') {
        const notesData = notesRes.value;
        setNotes(notesData);
        setInitialLoadStatus('success');
        setSyncStatus('idle');

        // Handle initial note selection without dependency loop
        const paramId = searchParams.get('id') || searchParams.get('noteId');
        const paramAction = searchParams.get('action');
        const paramSubjectId = searchParams.get('subjectId');
        const paramTitle = searchParams.get('title');
        const locState = location.state as { newNote?: Partial<Note> } | null;

        if (locState?.newNote && !hasInitializedSelectionRef.current) {
          hasInitializedSelectionRef.current = true;
          const notePayload = locState.newNote;
          dataService.notes.createNote({
            title: notePayload.title || 'Untitled Thought',
            content: notePayload.content || '',
            category: notePayload.category || 'concept',
            subjectId: notePayload.subjectId || undefined,
            tags: notePayload.tags || []
          }).then((created) => {
            setNotes((prev) => [created, ...prev]);
            handleSelectNote(created);
          }).catch((err) => {
            console.error('Failed to create note from state:', err);
          });
        } else if (paramId && !hasInitializedSelectionRef.current) {
          hasInitializedSelectionRef.current = true;
          const matchingNote = notesData.find((n) => n.id === paramId);
          if (matchingNote) {
            handleSelectNote(matchingNote);
          } else if (notesData.length > 0) {
            handleSelectNote(notesData[0]);
          }
        } else if ((paramAction === 'new' || paramTitle) && !hasInitializedSelectionRef.current) {
          hasInitializedSelectionRef.current = true;
          handleCreateNote(paramTitle || 'Untitled Note', paramSubjectId || '');
        } else if (!hasInitializedSelectionRef.current && notesData.length > 0) {
          hasInitializedSelectionRef.current = true;
          const initialNote = notesData[0];
          setSelectedNote(initialNote);
          setTitle(initialNote.title);
          setContent(initialNote.content);
          setCategory(initialNote.category);
          setSubjectId(initialNote.subjectId || '');
          setTags(initialNote.tags || []);
          if (initialNote.subjectId) {
            dataService.study.getTopics(initialNote.subjectId).then(setTopics).catch(() => {});
          }
        }
      } else {
        console.error('Failed to load primary notes:', notesRes.reason);
        throw notesRes.reason;
      }

      if (subjectsRes.status === 'fulfilled') setSubjects(subjectsRes.value);
      if (resourcesRes.status === 'fulfilled') setResources(resourcesRes.value);

    } catch (err) {
      console.error('Failed to load notes data:', err);
      setNotes((current) => {
        if (current.length === 0) setInitialLoadStatus('error');
        else setSyncStatus('error');
        return current;
      });
    }
  }, [searchQuery, filterCategory, filterSubjectId, searchParams]);

  useEffect(() => {
    loadData(true);
    const unsubscribe = dataService.subscribe(() => {
      loadData(false);
    });
    return () => unsubscribe();
  }, [loadData]);

  const handleRetry = async () => {
    setIsRetrying(true);
    await loadData(notes.length === 0);
    setIsRetrying(false);
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);

    // Check for uncommitted local draft
    const draftRaw = localStorage.getItem(`solis_note_draft_${note.id}`);
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        if (draft.content !== undefined && draft.content !== note.content) {
          setTitle(draft.title || note.title);
          setContent(draft.content);
          setCategory(note.category);
          setSubjectId(note.subjectId || '');
          setTags(note.tags || []);
          setSaveStatus('unsaved');
          addToast({
            title: 'Unsaved Draft Restored',
            description: 'Restored your latest local edits from storage.',
            type: 'info'
          });
          return;
        }
      } catch {
        // ignore
      }
    }

    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setSubjectId(note.subjectId || '');
    setTags(note.tags || []);
    setSaveStatus('saved');
    setMobileView('editor');
  };

  const handleCreateNote = async (initialTitle?: string, initialSubId?: string) => {
    try {
      const newNote = await dataService.notes.createNote({
        title: initialTitle || 'Untitled Thought',
        content: '',
        category: 'concept',
        subjectId: initialSubId || undefined,
        tags: []
      });

      setNotes((prev) => [newNote, ...prev]);
      handleSelectNote(newNote);
      setMobileView('editor');
      setInitialLoadStatus('success');
      setSyncStatus('idle');
      addToast({ title: 'New note created', type: 'info' });
    } catch (err) {
      addToast({
        title: 'Could not create note',
        description: formatErrorMessage(err),
        type: 'error'
      });
    }
  };

  const handleDeleteNote = async (id: string) => {
    const prevNotes = notes;
    const prevSelected = selectedNote;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNote?.id === id) {
      const remaining = notes.filter((n) => n.id !== id);
      if (remaining.length > 0) {
        handleSelectNote(remaining[0]);
      } else {
        setSelectedNote(null);
        setTitle('');
        setContent('');
        setMobileView('index');
      }
    }

    try {
      await dataService.notes.deleteNote(id);
      addToast({ title: 'Note removed', type: 'info' });
    } catch (err) {
      setNotes(prevNotes);
      setSelectedNote(prevSelected);
      addToast({
        title: 'Could not delete note',
        description: formatErrorMessage(err),
        type: 'error'
      });
    }
  };

  const handleManualSave = async () => {
    if (!selectedNote) return;
    setSaveStatus('saving');
    try {
      await dataService.notes.updateNote(selectedNote.id, {
        title,
        content,
        category,
        subjectId: subjectId || undefined,
        tags
      });
      setSaveStatus('saved');
      addToast({
        title: 'Note Saved',
        description: `"${title || 'Untitled Thought'}" saved successfully.`,
        type: 'success'
      });
    } catch (err) {
      setSaveStatus('unsaved');
      addToast({
        title: 'Save failed',
        description: formatErrorMessage(err),
        type: 'error'
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNote, title, content, category, subjectId, tags]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSaveStatus('unsaved');
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    setSaveStatus('unsaved');
  };

  const handleToggleMarkdownTask = (taskIndex: number, completed: boolean) => {
    let currentMatchIndex = 0;
    const updatedContent = content.replace(
      /^([-*]\s+\[)([ xX])(\]\s+.*)$/gm,
      (match, prefix, _check, suffix) => {
        if (currentMatchIndex === taskIndex) {
          currentMatchIndex++;
          return `${prefix}${completed ? 'x' : ' '}${suffix}`;
        }
        currentMatchIndex++;
        return match;
      }
    );

    handleContentChange(updatedContent);
  };

  const handleCategoryChange = (val: string) => {
    const cat = val as NoteCategory;
    setCategory(cat);
    setSaveStatus('unsaved');
  };

  const handleSubjectChange = (val: string) => {
    setSubjectId(val);
    setSaveStatus('unsaved');
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const updated = Array.from(new Set([...tags, newTagInput.trim()]));
      setTags(updated);
      setNewTagInput('');
      setSaveStatus('unsaved');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    setSaveStatus('unsaved');
  };

  const subjectSelectOptions = [
    { value: '', label: 'General Knowledge' },
    ...subjects.filter((s) => s.status !== 'archived').map((s) => ({
      value: s.id,
      label: s.name,
      badge: s.code
    }))
  ];

  const categorySelectOptions = CATEGORIES.map((c) => ({
    value: c.value,
    label: c.label
  }));

  return (
    <div className={cn('solis-notes-studio', mobileView === 'editor' ? 'solis-notes-studio--editor' : 'solis-notes-studio--index')}>
      {/* --------------------------------------------------------------------
          LEFT PANE: KNOWLEDGE INDEX
          -------------------------------------------------------------------- */}
      <aside className="solis-notes-index">
        <div className="solis-notes-index__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h2 className="solis-notes-index__title">Study Notes</h2>
            <ContextualHelp
              title="What are Study Notes?"
              content="Your clean place to write class notes, formulas, lecture summaries, and revision ideas."
              example="Write down key formulas or concepts, then generate quick flashcards to review later."
              guideId="knowledge-studio"
              onOpenGuide={openGuide}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<BookOpen size={14} />}
              onClick={() => openGuide('knowledge-studio')}
              title="Learn how Knowledge Studio works"
            >
              Guide
            </Button>
            <Button
              variant="accent"
              size="sm"
              className="tactile-press"
              leftIcon={<Plus size={14} />}
              onClick={() => handleCreateNote()}
            >
              New Note
            </Button>
          </div>
        </div>

        {/* Search */}
        <div>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts, tags, text..."
            leftIcon={<Search size={14} />}
            aria-label="Search notes"
          />
        </div>

        {/* Category Pills */}
        <SegmentedControl
          variant="pills"
          size="sm"
          value={filterCategory}
          onChange={setFilterCategory}
          options={[
            { value: 'all', label: 'All' },
            { value: 'concept', label: 'Concept' },
            { value: 'lecture', label: 'Lecture' },
            { value: 'problem_solving', label: 'Problem' },
            { value: 'idea', label: 'Idea' }
          ]}
        />

        {/* Discipline Filter */}
        <CustomSelect
          variant="subtle"
          value={filterSubjectId}
          onChange={setFilterSubjectId}
          options={[
            { value: 'all', label: 'All Disciplines' },
            ...subjects.filter((s) => s.status !== 'archived').map((s) => ({
              value: s.id,
              label: s.name,
              badge: s.code
            }))
          ]}
        />

        {/* Notes Stream */}
        {syncStatus === 'error' && notes.length > 0 && (
          <div
            style={{
              padding: '6px 10px',
              backgroundColor: 'var(--status-warning-bg)',
              border: '1px solid var(--status-warning)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-micro)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px'
            }}
          >
            <span>Sync hiccup — Showing saved draft</span>
            <button onClick={handleRetry} style={{ background: 'none', border: 'none', color: 'var(--color-coral-500)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-micro)' }}>
              Retry
            </button>
          </div>
        )}

        {initialLoadStatus === 'loading' && notes.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton height="80px" />
            <Skeleton height="80px" />
            <Skeleton height="80px" />
          </div>
        ) : initialLoadStatus === 'error' && notes.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <p style={{ color: 'var(--status-error)', fontSize: 'var(--text-body-sm)', fontWeight: 600 }}>
              Could not load knowledge notes.
            </p>
            <Button variant="outline" size="sm" onClick={handleRetry} isLoading={isRetrying} style={{ marginTop: '8px' }}>
              Retry
            </Button>
          </div>
        ) : notes.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: 'var(--text-body-sm)' }}>
              Capture the first idea worth keeping.
            </p>
          </div>
        ) : (
          <div className="solis-notes-stream">
            {notes.map((note) => {
              const isSelected = selectedNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  className={`solis-note-card ${isSelected ? 'solis-note-card--active' : ''}`}
                  onClick={() => handleSelectNote(note)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Badge variant="neutral" style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                      {note.category.replace('_', ' ')}
                    </Badge>
                    <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                      {formatFriendlyDate(note.updatedAt)}
                    </span>
                  </div>

                  <div className="solis-note-card__title">{note.title || 'Untitled Note'}</div>

                  <p className="solis-note-card__snippet">
                    {note.content || 'Empty thinking card...'}
                  </p>

                  <div className="solis-note-card__footer">
                    <span>{note.subjectName || 'General'}</span>
                    {note.tags && note.tags.length > 0 && (
                      <span style={{ color: 'var(--color-coral-500)' }}>#{note.tags[0]}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </aside>

      {/* --------------------------------------------------------------------
          RIGHT PANE: EDITORIAL THINKING CANVAS
          -------------------------------------------------------------------- */}
      <main className="solis-notes-canvas">
        {selectedNote ? (
          <>
            {/* Canvas Meta Topbar */}
            <div className="solis-notes-canvas__topbar">
              <div className="solis-notes-canvas__meta">
                <button
                  type="button"
                  className="solis-notes-canvas__back-btn"
                  onClick={() => setMobileView('index')}
                  aria-label="Back to Knowledge Index"
                >
                  <ArrowLeft size={15} />
                  <span>Notes</span>
                </button>

                <div style={{ width: '130px' }}>
                  <CustomSelect
                    variant="subtle"
                    value={category}
                    onChange={handleCategoryChange}
                    options={categorySelectOptions}
                  />
                </div>

                <div style={{ width: '190px' }}>
                  <CustomSelect
                    variant="subtle"
                    value={subjectId}
                    onChange={handleSubjectChange}
                    options={subjectSelectOptions}
                    placeholder="General Knowledge"
                  />
                </div>
              </div>

              {/* Right: Explicit Save & Quick Tools */}
              <div className="solis-notes-canvas__actions">
                <Button
                  variant={saveStatus === 'unsaved' ? 'accent' : 'outline'}
                  size="sm"
                  leftIcon={<Save size={13} />}
                  onClick={handleManualSave}
                  isLoading={saveStatus === 'saving'}
                  title="Save Note (⌘S)"
                >
                  Save
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Flame size={13} color="var(--color-coral-500)" />}
                  onClick={() => {
                    const query = new URLSearchParams();
                    if (subjectId) query.set('subjectId', subjectId);
                    query.set('title', `Study Note: ${title || 'Knowledge Note'}`);
                    navigate(`/app/focus?${query.toString()}`);
                  }}
                  title="Deep Focus on this Note"
                >
                  Focus
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<CheckSquare size={13} color="var(--color-emerald-500, #10b981)" />}
                  onClick={handleConvertToTask}
                  title="Convert selected text or note to actionable Task"
                >
                  + Task
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<BrainCircuit size={13} />}
                  onClick={() => setIsCardModalOpen(true)}
                  style={{ color: 'var(--color-coral-500)' }}
                  title="Create Flashcard Manually"
                >
                  + Card
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Sparkles size={13} />}
                  onClick={() => setIsAIGenModalOpen(true)}
                  style={{ color: 'var(--color-amber-500)' }}
                  title="Generate Flashcards with AI"
                >
                  Auto-Gen
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Sparkles size={13} />}
                  onClick={() => setIsQuizModalOpen(true)}
                  style={{ color: 'var(--color-lavender-500)' }}
                  title="Generate Quiz with AI"
                >
                  Quiz
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Bookmark size={13} />}
                  onClick={() => setIsResourceModalOpen(true)}
                  title="Attach & Cite Study Resource"
                >
                  + Cite
                </Button>

                <button
                  type="button"
                  onClick={() => setDeletingNoteId(selectedNote.id)}
                  className="solis-note-delete-btn"
                  title="Delete note"
                  aria-label="Delete active note"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Title Input */}
            <textarea
              ref={titleTextareaRef}
              value={title}
              onChange={(e) => {
                handleTitleChange(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              rows={1}
              placeholder="Title of this thinking piece..."
              className="solis-notes-canvas__title-input"
            />

            {/* Tag Management */}
            <div className="solis-note-tag-strip">
              <TagIcon size={14} color="var(--text-muted)" />
              {tags.map((t) => (
                <span key={t} className="solis-note-tag-item">
                  #{t}
                  <button type="button" onClick={() => handleRemoveTag(t)}>
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="+ Add tag..."
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontFamily: 'var(--font-interface)',
                  fontSize: 'var(--text-caption)',
                  outline: 'none',
                  minWidth: '80px'
                }}
              />
            </div>

            {/* Editorial Reading & Mode Toolbar */}
            <div className="solis-notes-toolbar">
              <div className="solis-notes-toolbar__left">
                <SegmentedControl
                  variant="pills"
                  size="sm"
                  value={noteViewMode}
                  onChange={(val) => setNoteViewMode(val as 'edit' | 'read' | 'split')}
                  options={[
                    { value: 'edit', label: 'Edit' },
                    { value: 'read', label: 'Read' },
                    { value: 'split', label: 'Split' }
                  ]}
                />
                <span className="solis-notes-toolbar__metrics">
                  {noteMetrics.wordCount} words • ~{noteMetrics.readingTimeMinutes}m read
                </span>
              </div>

              <div className="solis-notes-toolbar__right">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Download size={13} />}
                  onClick={handleExportMarkdown}
                  title="Export note as formatted .md file"
                >
                  Export .md
                </Button>
              </div>
            </div>

            {/* Thinking Body according to active mode */}
            {noteViewMode === 'edit' && (
              <textarea
                ref={contentTextareaRef}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Write structured insights, mathematical derivations, architecture proofs, or lecture syntheses..."
                className="solis-notes-canvas__body"
              />
            )}

            {noteViewMode === 'read' && (
              <div style={{ minHeight: '480px' }}>
                <MarkdownReadingView
                  content={content}
                  onToggleTask={handleToggleMarkdownTask}
                  onWikilinkClick={(target) => navigate(`/app/notes?q=${encodeURIComponent(target)}`)}
                />
              </div>
            )}

            {noteViewMode === 'split' && (
              <div className="solis-notes-split-container">
                <div className="solis-notes-split-pane">
                  <textarea
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Write structured markdown..."
                    className="solis-notes-canvas__body"
                    style={{ minHeight: '480px' }}
                  />
                </div>
                <div className="solis-notes-split-pane solis-notes-split-pane--preview">
                  <MarkdownReadingView
                    content={content}
                    onToggleTask={handleToggleMarkdownTask}
                    onWikilinkClick={(target) => navigate(`/app/notes?q=${encodeURIComponent(target)}`)}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            illustration="notes"
            icon={FileText}
            title="Your Thinking Sanctuary"
            description="Select an existing insight or create a new thinking canvas to begin distillation."
            actionLabel="New Note"
            onAction={() => handleCreateNote()}
          />
        )}
      </main>

      {/* Flashcard Create Modal from Note */}
      {selectedNote && (
        <FlashcardCreateModal
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
          subjects={subjects}
          topics={topics}
          defaultSubjectId={selectedNote.subjectId || ''}
          defaultNoteId={selectedNote.id}
          defaultPrompt={selectedNote.title || ''}
          defaultAnswer={selectedNote.content || ''}
          onCreateCard={handleCreateFlashcardFromNote}
        />
      )}

      {/* Study Resources Library Modal */}
      <ResourceLibraryModal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        resources={resources}
        subjects={subjects}
        topics={topics}
        selectedSubjectId={selectedNote?.subjectId}
        onCreateResource={async (resData) => {
          try {
            await dataService.resources.createResource(resData);
            addToast({ title: 'Resource Cataloged', description: resData.title, type: 'success' });
            await loadData();
          } catch {
            addToast({ title: 'Failed to catalog resource', type: 'error' });
          }
        }}
        onUpdateStatus={async (id, status) => {
          try {
            await dataService.resources.updateResource(id, { status });
            await loadData();
          } catch {
            addToast({ title: 'Update failed', type: 'error' });
          }
        }}
        onDeleteResource={async (id) => {
          try {
            await dataService.resources.deleteResource(id);
            addToast({ title: 'Resource removed', type: 'info' });
            await loadData();
          } catch {
            addToast({ title: 'Delete failed', type: 'error' });
          }
        }}
        onStudyResource={(res) => {
          setIsResourceModalOpen(false);
          // Insert citation into note
          handleCiteResource(res);
        }}
        onSynthesizeNote={(res) => {
          handleCiteResource(res);
        }}
      />

      {/* Delete Note Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(deletingNoteId)}
        onClose={() => setDeletingNoteId(null)}
        onConfirm={async () => {
          if (deletingNoteId) {
            const id = deletingNoteId;
            setDeletingNoteId(null);
            await handleDeleteNote(id);
          }
        }}
        title="Delete Knowledge Note"
        description="Are you sure you want to permanently delete this note? All synthesis, citations, and markdown content will be removed."
        confirmLabel="Delete Note"
        variant="danger"
      />

      {/* AI Flashcard Generator Modal */}
      {selectedNote && (
        <>
          <AIGenerationModal
            isOpen={isAIGenModalOpen}
            onClose={() => setIsAIGenModalOpen(false)}
            noteTitle={title}
            noteContent={content}
            subjectId={subjectId}
            noteId={selectedNote.id}
          />
          
          <AITakeQuizModal
            isOpen={isQuizModalOpen}
            onClose={() => setIsQuizModalOpen(false)}
            noteTitle={title}
            noteContent={content}
          />
        </>
      )}
    </div>
  );
};
