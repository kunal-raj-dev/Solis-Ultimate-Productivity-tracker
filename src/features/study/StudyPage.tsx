import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  BookOpen,
  Clock,
  Trash2,
  AlertCircle,
  Play,
  Calendar,
  Sparkles,
  Archive,
  RotateCcw,
  Layers,
  ListTodo,
  Flame,
  FileEdit,
  BrainCircuit,
  Repeat,
  Bookmark,
  MoreVertical,
  Edit2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '../../components/layout/SectionHeader/SectionHeader';
import { Button } from '../../components/ui/Button/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card/Card';
import { Progress } from '../../components/ui/Progress/Progress';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { Modal } from '../../components/feedback/Modal/Modal';
import { Input } from '../../components/ui/Input/Input';
import { CustomSelect } from '../../components/ui/Select/CustomSelect';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Checkbox } from '../../components/ui/Checkbox/Checkbox';
import { ParallaxScene, ParallaxLayer, AtmosphericOrb } from '../../components/parallax';
import { FlashcardReviewModal } from '../../components/features/Flashcards/FlashcardReviewModal';
import { FlashcardCreateModal } from '../../components/features/Flashcards/FlashcardCreateModal';
import { ResourceLibraryModal } from '../../components/features/Resources/ResourceLibraryModal';
import { useToast } from '../../context/ToastContext';
import { dataService } from '../../services/dataService';
import {
  StudySubject,
  StudySession,
  StudyPlanItem,
  StudyTopic,
  StudySessionType,
  PlanPriority,
  TopicMasteryLevel
} from '../../types/study';
import { Flashcard, ReviewQueueItem, CardRating } from '../../types/learning';
import { StudyResource, ReadingStatus } from '../../types/resource';
import { ValidationError } from '../../utils/validation';
import './StudyPage.css';

export const StudyPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [allTopics, setAllTopics] = useState<StudyTopic[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlanItem[]>([]);
  const [reviews, setReviews] = useState<ReviewQueueItem[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Subject View State: 'active' | 'archived'
  const [subjectViewTab, setSubjectViewTab] = useState<'active' | 'archived'>('active');

  // Modals
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isEditSubjectModalOpen, setIsEditSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<StudySubject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<StudySubject | null>(null);
  const [activeActionMenuSubjectId, setActiveActionMenuSubjectId] = useState<string | null>(null);
  const [showAddSubjectOptions, setShowAddSubjectOptions] = useState(false);

  const [isLogSessionModalOpen, setIsLogSessionModalOpen] = useState(false);
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [isTopicsModalOpen, setIsTopicsModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCreateFlashcardModalOpen, setIsCreateFlashcardModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

  // Active Flashcard Deck Session
  const [activeDeckCards, setActiveDeckCards] = useState<Flashcard[]>([]);
  const [cardDefaultSubjectId, setCardDefaultSubjectId] = useState('');
  const [cardDefaultTopicId, setCardDefaultTopicId] = useState('');

  // Resource Library Modal Targeting
  const [resourceDefaultSubjectId, setResourceDefaultSubjectId] = useState('');
  const [resourceDefaultTopicId, setResourceDefaultTopicId] = useState('');

  // Topics Manager
  const [selectedSubjectForTopics, setSelectedSubjectForTopics] = useState<StudySubject | null>(null);
  const [topicsList, setTopicsList] = useState<StudyTopic[]>([]);
  const [newTopicTitle, setNewTopicTitle] = useState('');

  // Log Session Form
  const [sessionSubjectId, setSessionSubjectId] = useState('');
  const [sessionPlanItemId, setSessionPlanItemId] = useState('');
  const [sessionType, setSessionType] = useState<StudySessionType>('deep_study');
  const [sessionDuration, setSessionDuration] = useState('45');
  const [sessionTopics, setSessionTopics] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionRetention, setSessionRetention] = useState('5');
  const [createNoteFromSession, setCreateNoteFromSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Add Subject Form
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subColor, setSubColor] = useState('coral');
  const [subTargetHours, setSubTargetHours] = useState('10');
  const [subError, setSubError] = useState<string | null>(null);

  // Edit Subject Form
  const [editSubName, setEditSubName] = useState('');
  const [editSubCode, setEditSubCode] = useState('');
  const [editSubDesc, setEditSubDesc] = useState('');
  const [editSubColor, setEditSubColor] = useState('coral');
  const [editSubTargetHours, setEditSubTargetHours] = useState('10');
  const [editSubError, setEditSubError] = useState<string | null>(null);

  // Add Plan Form
  const [planTitle, setPlanTitle] = useState('');
  const [planSubjectId, setPlanSubjectId] = useState('');
  const [planPriority, setPlanPriority] = useState<PlanPriority>('medium');
  const [planMinutes, setPlanMinutes] = useState('45');
  const [planTime, setPlanTime] = useState('02:00 PM');
  const [planError, setPlanError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stable loadData with NO identity thrashing
  const loadData = useCallback(async () => {
    try {
      const [subList, sesList, planList, revList, cardList, resList] = await Promise.all([
        dataService.study.getSubjects(true), // get all including archived
        dataService.study.getRecentSessions(),
        dataService.study.getTodayPlan(),
        dataService.reviews ? dataService.reviews.getDueReviewItems() : Promise.resolve([]),
        dataService.flashcards ? dataService.flashcards.getFlashcards() : Promise.resolve([]),
        dataService.resources ? dataService.resources.getResources() : Promise.resolve([])
      ]);
      setSubjects(subList);
      setSessions(sesList);
      setStudyPlan(planList);
      setReviews(revList);
      setFlashcards(cardList);
      setResources(resList);

      const topicArrays = await Promise.all(subList.map((s) => dataService.study.getTopics(s.id)));
      setAllTopics(topicArrays.flat());

      const activeSubs = subList.filter((s) => s.status !== 'archived');
      if (activeSubs.length > 0) {
        setSessionSubjectId((prev) => prev || activeSubs[0].id);
        setPlanSubjectId((prev) => prev || activeSubs[0].id);
      }
      setIsError(false);
    } catch (err) {
      console.error('Failed to load study data:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = dataService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  // Click outside listener for subject action menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.solis-subject-action-menu-container')) {
        setActiveActionMenuSubjectId(null);
      }
    };
    if (activeActionMenuSubjectId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeActionMenuSubjectId]);

  const displayedSubjects = subjects.filter((s) =>
    subjectViewTab === 'active' ? s.status !== 'archived' : s.status === 'archived'
  );

  const handleOpenTopicsModal = async (subject: StudySubject) => {
    setSelectedSubjectForTopics(subject);
    try {
      const topics = await dataService.study.getTopics(subject.id);
      setTopicsList(topics);
      setIsTopicsModalOpen(true);
    } catch (err) {
      addToast({ title: 'Could not load topics', type: 'error' });
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectForTopics || !newTopicTitle.trim()) return;

    try {
      const created = await dataService.study.createTopic({
        subjectId: selectedSubjectForTopics.id,
        title: newTopicTitle.trim(),
        masteryLevel: 'unstudied'
      });
      setTopicsList((prev) => [...prev, created]);
      setNewTopicTitle('');
      addToast({ title: 'Topic Added to Syllabus', description: created.title, type: 'success' });
    } catch (err) {
      addToast({ title: 'Could not add topic', type: 'error' });
    }
  };

  const handleToggleMastery = async (topic: StudyTopic) => {
    const nextLevel: TopicMasteryLevel =
      topic.masteryLevel === 'unstudied'
        ? 'learning'
        : topic.masteryLevel === 'learning'
        ? 'mastered'
        : 'unstudied';

    try {
      const updated = await dataService.study.updateTopic(topic.id, { masteryLevel: nextLevel });
      setTopicsList((prev) => prev.map((t) => (t.id === topic.id ? updated : t)));
    } catch {
      addToast({ title: 'Update failed', type: 'error' });
    }
  };

  const handleDeleteTopic = async (id: string) => {
    try {
      await dataService.study.deleteTopic(id);
      setTopicsList((prev) => prev.filter((t) => t.id !== id));
      addToast({ title: 'Topic removed', type: 'info' });
    } catch {
      addToast({ title: 'Delete failed', type: 'error' });
    }
  };

  const handleTopicFocus = (topic: StudyTopic) => {
    setIsTopicsModalOpen(false);
    navigate(`/app/focus?subjectId=${topic.subjectId}&title=${encodeURIComponent(topic.title)}`);
  };

  const handleTopicNote = (topic: StudyTopic) => {
    setIsTopicsModalOpen(false);
    navigate(`/app/notes?action=new&subjectId=${topic.subjectId}&title=${encodeURIComponent(topic.title)}`);
  };

  const handleOpenCardCreator = (subjectId?: string, topicId?: string) => {
    setCardDefaultSubjectId(subjectId || (subjects[0]?.id ?? ''));
    setCardDefaultTopicId(topicId || '');
    setIsCreateFlashcardModalOpen(true);
  };

  const handleStartActiveRecall = (customCards?: Flashcard[]) => {
    const cardsToReview = customCards && customCards.length > 0
      ? customCards
      : flashcards.length > 0
      ? flashcards
      : [];

    if (cardsToReview.length === 0) {
      addToast({ title: 'No Flashcards Available', description: 'Create your first active recall card to begin drilling.', type: 'info' });
      handleOpenCardCreator();
      return;
    }

    setActiveDeckCards(cardsToReview);
    setIsReviewModalOpen(true);
  };

  const handleRecordCardAttempt = async (cardId: string, rating: CardRating) => {
    try {
      await dataService.flashcards.recordCardAttempt(cardId, rating);
      await loadData();
    } catch (err) {
      console.error('Failed to record card attempt:', err);
    }
  };

  const handleCreateFlashcard = async (cardData: any) => {
    try {
      await dataService.flashcards.createFlashcard(cardData);
      addToast({ title: 'Flashcard Created', description: cardData.frontPrompt.substring(0, 40) + '...', type: 'success' });
      await loadData();
    } catch (err) {
      addToast({ title: 'Could not create card', type: 'error' });
    }
  };

  const handleArchiveSubject = async (id: string) => {
    try {
      await dataService.study.archiveSubject(id);
      setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'archived' } : s)));
      addToast({
        title: 'Subject Archived',
        description: 'Moved to archived view. All syllabus topics, notes, and sessions remain preserved.',
        type: 'info'
      });
    } catch {
      addToast({ title: 'Could not archive subject', type: 'error' });
    }
  };

  const handleRestoreSubject = async (id: string) => {
    try {
      await dataService.study.restoreSubject(id);
      setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'active' } : s)));
      addToast({
        title: 'Subject Restored',
        description: 'Restored to active study workspace and focus selectors.',
        type: 'success'
      });
    } catch {
      addToast({ title: 'Could not restore subject', type: 'error' });
    }
  };

  const handleOpenEditSubject = (subject: StudySubject) => {
    setEditingSubject(subject);
    setEditSubName(subject.name);
    setEditSubCode(subject.code || 'CORE');
    setEditSubDesc(subject.description || '');
    setEditSubColor(subject.color || 'coral');
    setEditSubTargetHours(String(subject.targetHoursPerWeek || 10));
    setEditSubError(null);
    setIsEditSubjectModalOpen(true);
  };

  const handleEditSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    setEditSubError(null);
    setIsSubmitting(true);

    try {
      const updated = await dataService.study.updateSubject(editingSubject.id, {
        name: editSubName.trim(),
        code: editSubCode.trim().toUpperCase() || 'CORE',
        description: editSubDesc.trim() || undefined,
        color: editSubColor,
        targetHoursPerWeek: parseFloat(editSubTargetHours) || 10
      });

      setSubjects((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      setIsEditSubjectModalOpen(false);
      setEditingSubject(null);
      addToast({
        title: 'Subject Updated',
        description: updated.name,
        type: 'success'
      });
    } catch (err) {
      if (err instanceof ValidationError) setEditSubError(err.message);
      else setEditSubError(err instanceof Error ? err.message : 'Failed to update subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteSubject = async () => {
    if (!deletingSubject) return;
    setIsSubmitting(true);
    try {
      await dataService.study.deleteSubject(deletingSubject.id);
      setSubjects((prev) => prev.filter((s) => s.id !== deletingSubject.id));
      setDeletingSubject(null);
      addToast({
        title: 'Subject Deleted',
        description: 'Subject and syllabus removed. Associated notes and logs remain preserved.',
        type: 'info'
      });
    } catch {
      addToast({ title: 'Could not delete subject', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionError(null);
    setIsSubmitting(true);

    const selectedSub = subjects.find((s) => s.id === sessionSubjectId);
    const subjectName = selectedSub ? selectedSub.name : 'General Study';

    const topicList = sessionTopics
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const logged = await dataService.study.logSession({
        subjectId: sessionSubjectId,
        subjectName,
        planItemId: sessionPlanItemId || undefined,
        type: sessionType,
        durationMinutes: parseInt(sessionDuration, 10) || 45,
        topicsCovered: topicList.length > 0 ? topicList : ['Core syllabus review'],
        notes: sessionNotes.trim() || undefined,
        retentionRating: (parseInt(sessionRetention, 10) as any) || 5
      });

      if (createNoteFromSession && sessionNotes.trim()) {
        await dataService.notes.createNote({
          subjectId: sessionSubjectId,
          studySessionId: logged.id,
          title: `${subjectName} — ${topicList[0] || 'Study Insights'}`,
          content: sessionNotes.trim(),
          category: 'reflection',
          tags: topicList
        });
      }

      setIsLogSessionModalOpen(false);
      setSessionTopics('');
      setSessionNotes('');
      setSessionPlanItemId('');
      addToast({
        title: 'Study Session Logged',
        description: `${logged.subjectName} (${logged.durationMinutes}m)`,
        type: 'success'
      });
    } catch (err) {
      if (err instanceof ValidationError) setSessionError(err.message);
      else setSessionError(err instanceof Error ? err.message : 'Failed to log session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubError(null);
    setIsSubmitting(true);

    try {
      const created = await dataService.study.createSubject({
        name: subName.trim(),
        code: subCode.trim().toUpperCase() || 'CORE',
        description: subDesc.trim() || undefined,
        color: subColor,
        targetHoursPerWeek: parseFloat(subTargetHours) || 10
      });

      setSubjects((prev) => [...prev.filter((s) => s.id !== created.id), created]);
      setIsAddSubjectModalOpen(false);
      setShowAddSubjectOptions(false);
      setSubName('');
      setSubCode('');
      setSubDesc('');
      setSubColor('coral');
      setSubTargetHours('10');
      addToast({
        title: 'Subject Created',
        description: `${created.name} (${created.code})`,
        type: 'success'
      });
    } catch (err) {
      if (err instanceof ValidationError) setSubError(err.message);
      else setSubError(err instanceof Error ? err.message : 'Failed to create subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateResource = async (resourceData: Partial<StudyResource>) => {
    try {
      await dataService.resources.createResource(resourceData);
      addToast({ title: 'Resource Cataloged', description: resourceData.title, type: 'success' });
      await loadData();
    } catch {
      addToast({ title: 'Failed to catalog resource', type: 'error' });
    }
  };

  const handleUpdateResourceStatus = async (id: string, status: ReadingStatus) => {
    try {
      await dataService.resources.updateResource(id, { status });
      await loadData();
    } catch {
      addToast({ title: 'Status update failed', type: 'error' });
    }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      await dataService.resources.deleteResource(id);
      addToast({ title: 'Resource removed', type: 'info' });
      await loadData();
    } catch {
      addToast({ title: 'Delete failed', type: 'error' });
    }
  };

  const handleStudyResource = (resource: StudyResource) => {
    setIsResourceModalOpen(false);
    navigate(`/app/focus?subjectId=${resource.subjectId}&title=${encodeURIComponent(`Deep Reading: ${resource.title}`)}`);
  };

  const handleSynthesizeNote = (resource: StudyResource) => {
    setIsResourceModalOpen(false);
    navigate('/app/notes', {
      state: {
        newNote: {
          subjectId: resource.subjectId,
          title: `Synthesis: ${resource.title}`,
          content: `# Synthesis: ${resource.title}\n\n**Source / Author**: ${resource.author || 'Unknown'}\n**Link**: ${resource.url || 'None'}\n\n## Key Invariants & Insights\n- `,
          tags: [...resource.tags, 'citation', 'resource']
        }
      }
    });
  };

  const handleCreatePlanItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanError(null);
    setIsSubmitting(true);

    const selectedSub = subjects.find((s) => s.id === planSubjectId);

    try {
      const created = await dataService.study.createPlanItem({
        title: planTitle,
        subjectId: planSubjectId,
        subjectName: selectedSub ? selectedSub.name : 'General Study',
        targetMinutes: parseInt(planMinutes, 10) || 45,
        scheduledTime: planTime,
        priority: planPriority
      });

      setIsAddPlanModalOpen(false);
      setPlanTitle('');
      addToast({
        title: 'Study Plan Queued',
        description: created.title,
        type: 'success'
      });
    } catch (err) {
      if (err instanceof ValidationError) setPlanError(err.message);
      else setPlanError(err instanceof Error ? err.message : 'Failed to add plan item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePlanItem = async (id: string) => {
    try {
      await dataService.study.togglePlanItem(id);
    } catch {
      addToast({ title: 'Could not toggle plan item', type: 'error' });
    }
  };

  const handleConvertPlanToTask = async (item: StudyPlanItem) => {
    try {
      const created = await dataService.tasks.createTask({
        title: item.title,
        subjectId: item.subjectId,
        planItemId: item.id,
        category: 'study',
        priority: item.priority === 'urgent' ? 'urgent' : item.priority === 'high' ? 'high' : 'medium',
        estimatedMinutes: item.targetMinutes
      });

      await dataService.study.updatePlanItem(item.id, { linkedTaskId: created.id });

      addToast({
        title: 'Task Created from Study Plan',
        description: `Linked to ${item.title}`,
        type: 'success'
      });
    } catch (err) {
      addToast({ title: 'Could not convert to task', type: 'error' });
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await dataService.study.deleteSession(id);
      addToast({ title: 'Session log removed', type: 'info' });
    } catch {
      addToast({ title: 'Could not delete session', type: 'error' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
      <ParallaxScene className="depth-1" style={{ borderRadius: 'var(--radius-2xl)', padding: 'var(--space-xl) var(--space-lg)' }}>
        <ParallaxLayer speed={0.04} isAbsolute>
          <AtmosphericOrb color="amber" sizePx={260} top="-30px" right="-20px" opacity={0.3} />
        </ParallaxLayer>
        <ParallaxLayer speed={0}>
          <SectionHeader
            tag={<Badge variant="amber">Study Architecture</Badge>}
            title="Study Sessions & Planning"
            subtitle="Manage subject syllabi, log focused cognitive blocks, and track weekly hour targets."
            actions={
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button
                  variant="outline"
                  size="md"
                  className="tactile-press"
                  leftIcon={<Bookmark size={16} />}
                  onClick={() => {
                    setResourceDefaultSubjectId('');
                    setResourceDefaultTopicId('');
                    setIsResourceModalOpen(true);
                  }}
                >
                  Resource Library ({resources.length})
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="tactile-press"
                  leftIcon={<Plus size={16} />}
                  onClick={() => setIsAddSubjectModalOpen(true)}
                >
                  Add Subject
                </Button>
                <Button
                  variant="accent"
                  size="md"
                  className="tactile-press"
                  leftIcon={<Plus size={16} />}
                  onClick={() => setIsLogSessionModalOpen(true)}
                >
                  Log Session
                </Button>
              </div>
            }
          />
        </ParallaxLayer>
      </ParallaxScene>

      {/* Active vs Archived Subjects Tabs */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSubjectViewTab('active')}
              className="tactile-press"
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontSize: 'var(--text-body-sm)',
                border: '1px solid',
                borderColor: subjectViewTab === 'active' ? 'var(--color-coral-500)' : 'var(--border-subtle)',
                background: subjectViewTab === 'active' ? 'var(--color-coral-500)' : 'var(--bg-surface-secondary)',
                color: subjectViewTab === 'active' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Active Subjects ({subjects.filter((s) => s.status !== 'archived').length})
            </button>
            <button
              onClick={() => setSubjectViewTab('archived')}
              className="tactile-press"
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontSize: 'var(--text-body-sm)',
                border: '1px solid',
                borderColor: subjectViewTab === 'archived' ? 'var(--color-coral-500)' : 'var(--border-subtle)',
                background: subjectViewTab === 'archived' ? 'var(--color-coral-500)' : 'var(--bg-surface-secondary)',
                color: subjectViewTab === 'archived' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Archived ({subjects.filter((s) => s.status === 'archived').length})
            </button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <Skeleton height="180px" />
            <Skeleton height="180px" />
            <Skeleton height="180px" />
          </div>
        ) : isError ? (
          <Card className="depth-1" style={{ textAlign: 'center', padding: '36px 16px' }}>
            <AlertCircle size={28} color="var(--status-error)" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)', color: 'var(--text-primary)' }}>
              We couldn't load your study subjects.
            </div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '14px' }}>
              A network or synchronization error occurred.
            </div>
            <Button variant="outline" size="sm" onClick={() => loadData()}>
              Retry
            </Button>
          </Card>
        ) : displayedSubjects.length === 0 ? (
          <Card className="depth-1" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <BookOpen size={28} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
            {subjectViewTab === 'active' ? (
              subjects.filter((s) => s.status === 'archived').length > 0 ? (
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>
                    No active subjects right now.
                  </div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '14px' }}>
                    You have {subjects.filter((s) => s.status === 'archived').length} archived subject(s) preserved in your repository.
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <Button variant="outline" size="sm" onClick={() => setSubjectViewTab('archived')}>
                      View Archived ({subjects.filter((s) => s.status === 'archived').length})
                    </Button>
                    <Button variant="accent" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsAddSubjectModalOpen(true)}>
                      Add Subject
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>
                    No active subjects yet.
                  </div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '14px' }}>
                    Create your first subject to begin building your study system.
                  </div>
                  <Button variant="accent" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsAddSubjectModalOpen(true)}>
                    + Add Subject
                  </Button>
                </div>
              )
            ) : (
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>
                  No archived subjects
                </div>
                <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Active subjects you archive will be stored here with full syllabus and notes history.
                </div>
              </div>
            )}
          </Card>
        ) : (
          <div className="solis-subject-worlds-grid">
            {displayedSubjects.map((subject) => (
              <div
                key={subject.id}
                className={`solis-subject-world-tile solis-subject-world-tile--${subject.color || 'coral'}`}
                style={{ opacity: subject.status === 'archived' ? 0.85 : 1 }}
              >
                <div>
                  <div className="solis-subject-world-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Badge variant={(subject.color as BadgeVariant) || 'coral'}>
                        {subject.code || 'CORE'}
                      </Badge>
                      {subject.status === 'archived' && (
                        <Badge variant="neutral">Archived</Badge>
                      )}
                    </div>

                    {/* Contextual Action Menu */}
                    <div className="solis-subject-action-menu-container" style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setActiveActionMenuSubjectId(activeActionMenuSubjectId === subject.id ? null : subject.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        aria-label={`Subject actions for ${subject.name}`}
                        title="Subject Actions"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeActionMenuSubjectId === subject.id && (
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            marginTop: '4px',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-dropdown)',
                            padding: '4px',
                            zIndex: 50,
                            minWidth: '180px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveActionMenuSubjectId(null);
                              handleOpenTopicsModal(subject);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 10px',
                              background: 'none',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 'var(--text-caption)',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              width: '100%'
                            }}
                          >
                            <Layers size={14} color="var(--text-secondary)" />
                            <span>Manage Syllabus</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveActionMenuSubjectId(null);
                              handleOpenEditSubject(subject);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 10px',
                              background: 'none',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 'var(--text-caption)',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              width: '100%'
                            }}
                          >
                            <Edit2 size={14} color="var(--text-secondary)" />
                            <span>Edit Subject</span>
                          </button>

                          {subject.status === 'archived' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveActionMenuSubjectId(null);
                                handleRestoreSubject(subject.id);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 10px',
                                background: 'none',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 'var(--text-caption)',
                                color: 'var(--color-sage-500)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                width: '100%'
                              }}
                            >
                              <RotateCcw size={14} color="var(--color-sage-500)" />
                              <span>Restore to Active</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveActionMenuSubjectId(null);
                                handleArchiveSubject(subject.id);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 10px',
                                background: 'none',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 'var(--text-caption)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                width: '100%'
                              }}
                            >
                              <Archive size={14} color="var(--text-secondary)" />
                              <span>Archive Subject</span>
                            </button>
                          )}

                          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '2px 0' }} />

                          <button
                            type="button"
                            onClick={() => {
                              setActiveActionMenuSubjectId(null);
                              setDeletingSubject(subject);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 10px',
                              background: 'none',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 'var(--text-caption)',
                              color: 'var(--status-error)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              width: '100%'
                            }}
                          >
                            <Trash2 size={14} color="var(--status-error)" />
                            <span>Delete Subject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="solis-subject-world-title">
                    {subject.name}
                  </h3>

                  {subject.description && (
                    <p className="solis-subject-world-desc">
                      {subject.description}
                    </p>
                  )}
                </div>

                <div>
                  <div style={{ margin: '12px 0 8px' }}>
                    <Progress
                      value={subject.completedHoursThisWeek}
                      max={subject.targetHoursPerWeek}
                      variant={subject.color === 'amber' ? 'amber' : subject.color === 'lavender' ? 'lavender' : 'coral'}
                      label={`Weekly Goal: ${subject.completedHoursThisWeek} / ${subject.targetHoursPerWeek} hrs`}
                      showValueText
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                    <span>{subject.notesCount} thoughts synthesized</span>
                    {subject.status === 'archived' ? (
                      <Button
                        variant="subtle"
                        size="sm"
                        leftIcon={<RotateCcw size={13} />}
                        onClick={() => handleRestoreSubject(subject.id)}
                      >
                        Unarchive
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenTopicsModal(subject)}
                      >
                        Syllabus Roadmap →
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spaced Reviews & Flashcards Sanctuary Hub */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrainCircuit size={18} color="var(--color-coral-500)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-3)' }}>
              Spaced Retrieval & Active Recall
            </h3>
            {reviews.length > 0 && (
              <Badge variant="coral">{reviews.length} Due</Badge>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => handleOpenCardCreator()}
            >
              New Flashcard
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Sparkles size={14} />}
              onClick={() => handleStartActiveRecall()}
            >
              Start Recall Drill ({flashcards.length})
            </Button>
          </div>
        </div>

        {reviews.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {reviews.map((rev) => (
              <div
                key={rev.id}
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'var(--bg-surface-primary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge variant={rev.priority === 'urgent' ? 'coral' : rev.priority === 'high' ? 'amber' : 'neutral'}>
                    {rev.priority} Priority
                  </Badge>
                  <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>Due Today</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>{rev.topicTitle}</div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', margin: 0 }}>
                  {rev.subjectName} • {rev.reason}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <Button
                    variant="subtle"
                    size="sm"
                    leftIcon={<Play size={12} />}
                    onClick={() => {
                      const topicCards = flashcards.filter((c) => c.topicId === rev.topicId);
                      handleStartActiveRecall(topicCards.length > 0 ? topicCards : flashcards);
                    }}
                  >
                    Drill Recall
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '16px 20px', backgroundColor: 'var(--bg-surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ fontWeight: 500, fontSize: 'var(--text-body-sm)', margin: 0 }}>
                All Spaced Retention Intervals Current
              </p>
              <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                {flashcards.length} active flashcards in your workspace. Retention signals will automatically alert you when spaced reviews become due.
              </p>
            </div>
            {flashcards.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => handleStartActiveRecall()}>
                Practice Deck ({flashcards.length}) →
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Grid: Study Plan Queue (Left) + Recent Sessions (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Today's Study Queue */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--color-amber-500)" />
              <CardTitle>Today&apos;s Planned Queue</CardTitle>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Repeat size={14} />}
                onClick={async () => {
                  try {
                    const added = await dataService.routines.materializeRoutinesForToday();
                    if (added.length > 0) {
                      addToast({ title: 'Routines Synced', description: `${added.length} study routine block(s) added to Today.`, type: 'success' });
                    } else {
                      addToast({ title: 'Queue Up to Date', description: 'All active routines for today are already queued.', type: 'info' });
                    }
                    await loadData();
                  } catch {
                    addToast({ title: 'Sync failed', type: 'error' });
                  }
                }}
              >
                Sync Routines
              </Button>
              <Button variant="ghost" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsAddPlanModalOpen(true)}>
                Queue Topic
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {studyPlan.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: 'var(--text-body-sm)' }}>
                No study topics planned for today.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {studyPlan.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-surface-secondary)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <Checkbox
                        checked={item.completed}
                        onChange={() => handleTogglePlanItem(item.id)}
                        aria-label={`Toggle study plan ${item.title}`}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)', textDecoration: item.completed ? 'line-through' : 'none' }}>
                            {item.title}
                          </span>
                          <Badge variant={item.priority === 'urgent' ? 'coral' : item.priority === 'high' ? 'amber' : 'neutral'}>
                            {item.priority}
                          </Badge>
                        </div>
                        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {item.subjectName || 'General'} • {item.targetMinutes}m planned
                          {item.actualMinutesLogged ? ` • ${item.actualMinutesLogged}m logged` : ''} {item.scheduledTime ? `(${item.scheduledTime})` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {!item.linkedTaskId && (
                        <button
                          onClick={() => handleConvertPlanToTask(item)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          title="Convert to Task"
                        >
                          <ListTodo size={14} />
                        </button>
                      )}
                      <Button
                        variant="subtle"
                        size="sm"
                        leftIcon={<Play size={12} />}
                        onClick={() => navigate(`/app/focus?subjectId=${item.subjectId}&planId=${item.id}&title=${encodeURIComponent(item.title)}`)}
                      >
                        Focus
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Study Sessions Log */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--color-coral-500)" />
              <CardTitle>Recent Focus Logs</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: 'var(--text-body-sm)' }}>
                No study sessions logged yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-surface-secondary)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>
                          {session.subjectName}
                        </span>
                        <Badge variant="neutral">{session.type.replace('_', ' ')}</Badge>
                      </div>
                      <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                        {session.topicsCovered.join(', ')} {session.notes ? `• "${session.notes}"` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-coral-500)' }}>
                          {session.durationMinutes}m
                        </div>
                        <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                          ★ {session.retentionRating}/5
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        style={{ color: 'var(--text-muted)', padding: '2px', background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Delete log"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Topics / Syllabus Modal */}
      <Modal
        isOpen={isTopicsModalOpen}
        onClose={() => setIsTopicsModalOpen(false)}
        title={`Syllabus Topics — ${selectedSubjectForTopics?.name || ''}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <form onSubmit={handleAddTopic} style={{ display: 'flex', gap: '8px' }}>
            <Input
              placeholder="Add new syllabus topic..."
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              required
            />
            <Button variant="accent" type="submit">
              Add
            </Button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {topicsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: 'var(--text-body-sm)' }}>
                No topics defined for this subject yet.
              </div>
            ) : (
              topicsList.map((topic) => (
                <div
                  key={topic.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-surface-secondary)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 500 }}>
                    {topic.title}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleTopicFocus(topic)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-coral-500)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                      title={`Start Focus Block on ${topic.title}`}
                    >
                      <Flame size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTopicNote(topic)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-lavender-500)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                      title={`Draft Note on ${topic.title}`}
                    >
                      <FileEdit size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setIsTopicsModalOpen(false);
                        handleOpenCardCreator(topic.subjectId, topic.id);
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '2px 6px',
                        fontSize: 'var(--text-micro)',
                        color: 'var(--color-coral-500)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                      title="Create Active Recall Flashcard"
                    >
                      + Card
                    </button>
                    <button
                      onClick={() => {
                        setIsTopicsModalOpen(false);
                        setResourceDefaultSubjectId(topic.subjectId);
                        setResourceDefaultTopicId(topic.id);
                        setIsResourceModalOpen(true);
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '2px 6px',
                        fontSize: 'var(--text-micro)',
                        color: 'var(--color-amber-500)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                      title="Attach Study Resource"
                    >
                      + Resource
                    </button>
                    <button
                      onClick={() => handleToggleMastery(topic)}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-micro)',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background:
                          topic.masteryLevel === 'mastered'
                            ? 'var(--color-sage-500)'
                            : topic.masteryLevel === 'learning'
                            ? 'var(--color-amber-500)'
                            : 'var(--bg-surface)',
                        color: topic.masteryLevel === 'unstudied' ? 'var(--text-secondary)' : '#fff'
                      }}
                    >
                      {topic.masteryLevel}
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(topic.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Log Session Modal */}
      <Modal
        isOpen={isLogSessionModalOpen}
        onClose={() => setIsLogSessionModalOpen(false)}
        title="Log Study Session"
      >
        <form onSubmit={handleLogSession} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sessionError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'var(--status-error-bg)',
                color: 'var(--status-error)',
                fontSize: 'var(--text-caption)'
              }}
            >
              <AlertCircle size={14} />
              <span>{sessionError}</span>
            </div>
          )}

          <CustomSelect
            label="Subject"
            value={sessionSubjectId}
            onChange={setSessionSubjectId}
            options={subjects.filter((s) => s.status !== 'archived').map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
          />

          {studyPlan.length > 0 && (
            <CustomSelect
              label="Associated Study Plan Item (Optional)"
              value={sessionPlanItemId}
              onChange={setSessionPlanItemId}
              options={[
                { value: '', label: 'None (Ad-hoc study block)' },
                ...studyPlan.map((p) => ({ value: p.id, label: `${p.title} (${p.subjectName})` }))
              ]}
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <CustomSelect
              label="Session Type"
              value={sessionType}
              onChange={(val) => setSessionType(val as StudySessionType)}
              options={[
                { value: 'deep_study', label: 'Deep Study' },
                { value: 'active_recall', label: 'Active Recall' },
                { value: 'spaced_repetition', label: 'Spaced Repetition' },
                { value: 'problem_solving', label: 'Problem Solving' },
                { value: 'reading', label: 'Reading & Synthesis' }
              ]}
            />
            <Input
              label="Duration (Minutes)"
              type="number"
              value={sessionDuration}
              onChange={(e) => setSessionDuration(e.target.value)}
              required
            />
          </div>

          <Input
            label="Topics Covered (Comma separated)"
            placeholder="e.g. Raft Leader Election, Heartbeats, Log Matching"
            value={sessionTopics}
            onChange={(e) => setSessionTopics(e.target.value)}
            required
            autoFocus
          />

          <Textarea
            label="Synthesis / Key Takeaways"
            placeholder="Insights, confusing edge-cases, notes for flashcards..."
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Checkbox
              checked={createNoteFromSession}
              onChange={() => setCreateNoteFromSession(!createNoteFromSession)}
              label="Also save these insights as a permanent Knowledge Note"
            />
          </div>

          <CustomSelect
            label="Retention Self-Rating"
            value={sessionRetention}
            onChange={setSessionRetention}
            options={[
              { value: '5', label: '5 — Complete mastery & effortless recall' },
              { value: '4', label: '4 — Solid comprehension' },
              { value: '3', label: '3 — Moderate recall, needs spaced review' },
              { value: '2', label: '2 — Struggling with core concepts' },
              { value: '1', label: '1 — Needs re-reading and fundamental help' }
            ]}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button variant="ghost" type="button" onClick={() => setIsLogSessionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" type="submit" isLoading={isSubmitting} leftIcon={<Sparkles size={14} />}>
              Save Study Log
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Subject Modal */}
      <Modal
        isOpen={isAddSubjectModalOpen}
        onClose={() => setIsAddSubjectModalOpen(false)}
        title="Create Study Subject"
      >
        <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {subError && (
            <div style={{ color: 'var(--status-error)', fontSize: 'var(--text-caption)' }}>
              {subError}
            </div>
          )}

          <Input
            label="Subject Title"
            placeholder="e.g. Distributed Consensus Systems"
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            required
            autoFocus
          />

          <div>
            <button
              type="button"
              onClick={() => setShowAddSubjectOptions(!showAddSubjectOptions)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-coral-500)',
                fontSize: 'var(--text-caption)',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {showAddSubjectOptions ? '− Hide Additional Options' : '+ Additional Options (Course Code, Target, Color)'}
            </button>

            {showAddSubjectOptions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <Input
                  label="Description / Scope"
                  placeholder="e.g. Fault-tolerant state machines, quorum invariants"
                  value={subDesc}
                  onChange={(e) => setSubDesc(e.target.value)}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <Input
                    label="Course Code"
                    placeholder="e.g. CS 440"
                    value={subCode}
                    onChange={(e) => setSubCode(e.target.value)}
                  />
                  <Input
                    label="Weekly Goal (Hours)"
                    type="number"
                    value={subTargetHours}
                    onChange={(e) => setSubTargetHours(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Subject color
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {[
                      { id: 'coral', label: 'Coral', color: 'var(--color-coral-500)' },
                      { id: 'amber', label: 'Amber', color: 'var(--color-amber-500)' },
                      { id: 'lavender', label: 'Lavender', color: 'var(--color-lavender-500)' },
                      { id: 'sage', label: 'Sage', color: 'var(--color-sage-500)' }
                    ].map((c) => {
                      const isSelected = subColor === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSubColor(c.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-md)',
                            border: isSelected ? `2px solid ${c.color}` : '1px solid var(--border-subtle)',
                            background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: 'var(--text-caption)',
                            fontWeight: isSelected ? 600 : 400,
                            cursor: 'pointer'
                          }}
                        >
                          <span
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: c.color,
                              display: 'inline-block'
                            }}
                          />
                          <span>{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button variant="ghost" type="button" onClick={() => setIsAddSubjectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" type="submit" isLoading={isSubmitting}>
              Save Subject
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Subject Modal */}
      <Modal
        isOpen={isEditSubjectModalOpen}
        onClose={() => {
          setIsEditSubjectModalOpen(false);
          setEditingSubject(null);
        }}
        title="Edit Subject"
      >
        <form onSubmit={handleEditSubject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {editSubError && (
            <div style={{ color: 'var(--status-error)', fontSize: 'var(--text-caption)' }}>
              {editSubError}
            </div>
          )}

          <Input
            label="Subject Title"
            value={editSubName}
            onChange={(e) => setEditSubName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Description / Scope"
            value={editSubDesc}
            onChange={(e) => setEditSubDesc(e.target.value)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <Input
              label="Course Code"
              value={editSubCode}
              onChange={(e) => setEditSubCode(e.target.value)}
            />
            <Input
              label="Weekly Goal (Hours)"
              type="number"
              value={editSubTargetHours}
              onChange={(e) => setEditSubTargetHours(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Subject color
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { id: 'coral', label: 'Coral', color: 'var(--color-coral-500)' },
                { id: 'amber', label: 'Amber', color: 'var(--color-amber-500)' },
                { id: 'lavender', label: 'Lavender', color: 'var(--color-lavender-500)' },
                { id: 'sage', label: 'Sage', color: 'var(--color-sage-500)' }
              ].map((c) => {
                const isSelected = editSubColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setEditSubColor(c.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? `2px solid ${c.color}` : '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-caption)',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer'
                    }}
                  >
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: c.color,
                        display: 'inline-block'
                      }}
                    />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setIsEditSubjectModalOpen(false);
                setEditingSubject(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="accent" type="submit" isLoading={isSubmitting}>
              Update Subject
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Subject Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingSubject)}
        onClose={() => setDeletingSubject(null)}
        title="Delete Subject"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            Are you sure you want to permanently delete <strong>{deletingSubject?.name}</strong>?
          </p>
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-secondary)',
              border: '1px solid var(--border-subtle)',
              fontSize: 'var(--text-caption)',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}
          >
            <strong>Consequences:</strong>
            <ul style={{ paddingLeft: '18px', marginTop: '6px' }}>
              <li>The subject and its syllabus roadmap will be deleted.</li>
              <li>Your notes, flashcards, and completed study logs will remain safely in your library.</li>
              <li>To keep the syllabus roadmap and course structure, choose <em>Archive Instead</em>.</li>
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                if (deletingSubject) {
                  handleArchiveSubject(deletingSubject.id);
                  setDeletingSubject(null);
                }
              }}
            >
              Archive Instead
            </Button>
            <Button variant="ghost" type="button" onClick={() => setDeletingSubject(null)}>
              Cancel
            </Button>
            <Button variant="destructive" type="button" isLoading={isSubmitting} onClick={handleConfirmDeleteSubject}>
              Delete Subject
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Plan Modal */}
      <Modal
        isOpen={isAddPlanModalOpen}
        onClose={() => setIsAddPlanModalOpen(false)}
        title="Queue Today's Study Topic"
      >
        <form onSubmit={handleCreatePlanItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {planError && (
            <div style={{ color: 'var(--status-error)', fontSize: 'var(--text-caption)' }}>
              {planError}
            </div>
          )}

          <Input
            label="Topic Statement"
            placeholder="e.g. LLVM Intermediate Representation Optimizations"
            value={planTitle}
            onChange={(e) => setPlanTitle(e.target.value)}
            required
            autoFocus
          />

          <CustomSelect
            label="Subject"
            value={planSubjectId}
            onChange={setPlanSubjectId}
            options={subjects.filter((s) => s.status !== 'archived').map((s) => ({ value: s.id, label: s.name }))}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <Input
              label="Planned Duration (Mins)"
              type="number"
              value={planMinutes}
              onChange={(e) => setPlanMinutes(e.target.value)}
              required
            />
            <Input
              label="Scheduled Time"
              placeholder="e.g. 03:00 PM"
              value={planTime}
              onChange={(e) => setPlanTime(e.target.value)}
            />
            <CustomSelect
              label="Priority"
              value={planPriority}
              onChange={(val) => setPlanPriority(val as PlanPriority)}
              options={[
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' }
              ]}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button variant="ghost" type="button" onClick={() => setIsAddPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" type="submit" isLoading={isSubmitting}>
              Add to Queue
            </Button>
          </div>
        </form>
      </Modal>

      {/* Active Recall Review Modal */}
      <FlashcardReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        cards={activeDeckCards}
        onRecordAttempt={handleRecordCardAttempt}
      />

      {/* Create Flashcard Modal */}
      <FlashcardCreateModal
        isOpen={isCreateFlashcardModalOpen}
        onClose={() => setIsCreateFlashcardModalOpen(false)}
        subjects={subjects.filter((s) => s.status !== 'archived')}
        topics={topicsList}
        defaultSubjectId={cardDefaultSubjectId}
        defaultTopicId={cardDefaultTopicId}
        onCreateCard={handleCreateFlashcard}
      />

      {/* Knowledge Library & Resource Citations Modal */}
      <ResourceLibraryModal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        resources={resources}
        subjects={subjects.filter((s) => s.status !== 'archived')}
        topics={allTopics}
        selectedSubjectId={resourceDefaultSubjectId}
        selectedTopicId={resourceDefaultTopicId}
        onCreateResource={handleCreateResource}
        onUpdateStatus={handleUpdateResourceStatus}
        onDeleteResource={handleDeleteResource}
        onStudyResource={handleStudyResource}
        onSynthesizeNote={handleSynthesizeNote}
      />
    </div>
  );
};
