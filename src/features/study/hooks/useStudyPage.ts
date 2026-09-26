import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../../services/dataService';
import { useToast } from '../../../context/ToastContext';
import { useGuide } from '../../../context/GuideContext';
import { StudySubject, StudySession, StudyPlanItem, StudyTopic, StudySessionType, PlanPriority } from '../../../types/study';
import { Flashcard, ReviewQueueItem, CardRating } from '../../../types/learning';
import { StudyResource, ReadingStatus } from '../../../types/resource';
import { LearningIntelligenceSnapshot } from '../../../types/learningIntelligence';
import { Note } from '../../../types/note';
import { createLearningIntelligenceSnapshot } from '../../../utils/intelligence';
import { getISODateString } from '../../../utils/date';

export function useStudyPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { openGuide } = useGuide();

  // Core Data
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlanItem[]>([]);
  const [reviews, setReviews] = useState<ReviewQueueItem[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [allTopics, setAllTopics] = useState<StudyTopic[]>([]);

  // State flags
  const [initialLoadStatus, setInitialLoadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isRetrying, setIsRetrying] = useState(false);
  const [subjectViewTab, setSubjectViewTab] = useState<'active' | 'archived'>('active');

  // Selected topic drawer
  const [selectedTopicIdForDrawer, setSelectedTopicIdForDrawer] = useState<string | null>(null);

  // Derived Counts and Views
  const activeCount = useMemo(() => subjects.filter((s) => s.status !== 'archived').length, [subjects]);
  const archivedCount = useMemo(() => subjects.filter((s) => s.status === 'archived').length, [subjects]);
  const displayedSubjects = useMemo(() => {
    return subjects.filter((s) => (subjectViewTab === 'active' ? s.status !== 'archived' : s.status === 'archived'));
  }, [subjects, subjectViewTab]);

  // Pure Deterministic Learning Intelligence Engine
  const learningSnapshot: LearningIntelligenceSnapshot = useMemo(() => {
    return createLearningIntelligenceSnapshot({
      subjects,
      topics: allTopics,
      sessions,
      flashcards,
      reviews,
      notes,
      resources,
      planItems: studyPlan
    });
  }, [subjects, allTopics, sessions, flashcards, reviews, notes, resources, studyPlan]);

  // Modals & form state
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
  const [isExamCramModalOpen, setIsExamCramModalOpen] = useState(false);
  const [isCramSessionActive, setIsCramSessionActive] = useState(false);

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

  // Resilient loadData with dependency classification and race condition protection
  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setInitialLoadStatus('loading');
    } else {
      setSyncStatus('syncing');
    }

    try {
      const subjectsPromise = dataService.study.getSubjects(true);
      const sessionsPromise = dataService.study.getRecentSessions().catch(() => []);
      const planPromise = dataService.study.getTodayPlan().catch(() => []);
      const reviewsPromise = dataService.reviews ? dataService.reviews.getDueReviewItems().catch(() => []) : Promise.resolve([]);
      const flashcardsPromise = dataService.flashcards ? dataService.flashcards.getFlashcards().catch(() => []) : Promise.resolve([]);
      const resourcesPromise = dataService.resources ? dataService.resources.getResources().catch(() => []) : Promise.resolve([]);
      const notesPromise = dataService.notes ? dataService.notes.getNotes().catch(() => []) : Promise.resolve([]);

      const [subRes, sesRes, planRes, revRes, cardRes, resRes, noteRes] = await Promise.allSettled([
        subjectsPromise,
        sessionsPromise,
        planPromise,
        reviewsPromise,
        flashcardsPromise,
        resourcesPromise,
        notesPromise
      ]);

      if (subRes.status === 'fulfilled') {
        const subs = subRes.value;
        setSubjects(subs);
        if (subs.length > 0) {
          if (!sessionSubjectId) setSessionSubjectId(subs[0].id);
          if (!planSubjectId) setPlanSubjectId(subs[0].id);

          const topicPromises = subs.map((s) => dataService.study.getTopics(s.id).catch(() => []));
          const allFetchedTopics = await Promise.all(topicPromises);
          setAllTopics(allFetchedTopics.flat());
        }
        setInitialLoadStatus('success');
        setSyncStatus('synced');
      } else {
        throw subRes.reason;
      }

      if (sesRes.status === 'fulfilled') setSessions(sesRes.value);
      if (planRes.status === 'fulfilled') setStudyPlan(planRes.value);
      if (revRes.status === 'fulfilled') setReviews(revRes.value);
      if (cardRes.status === 'fulfilled') setFlashcards(cardRes.value);
      if (resRes.status === 'fulfilled') setResources(resRes.value);
      if (noteRes.status === 'fulfilled') setNotes(noteRes.value);
    } catch {
      if (isInitial) {
        setInitialLoadStatus('error');
      } else {
        setSyncStatus('error');
      }
    }
  }, [planSubjectId, sessionSubjectId]);

  useEffect(() => {
    loadData(true);
    // Plan §6.1 scoped entity pub/sub: this hook renders study entities and
    // notes; reviews, flashcards, and resources broadcast on 'all'.
    const unsubscribe = dataService.subscribe(() => {
      loadData(false);
    }, ['study', 'notes']);
    return () => unsubscribe();
  }, [loadData]);

  const handleRetry = async () => {
    setIsRetrying(true);
    await loadData(false);
    setIsRetrying(false);
  };

  // Subject Operations
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubError(null);
    if (!subName.trim()) {
      setSubError('Subject name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await dataService.study.createSubject({
        name: subName.trim(),
        code: subCode.trim() || 'CORE',
        description: subDesc.trim() || undefined,
        color: subColor,
        targetHoursPerWeek: parseFloat(subTargetHours) || 10
      });

      addToast({
        title: 'Subject Workspace Created',
        description: `${created.name} (${created.code}) is now active.`,
        type: 'success'
      });

      setSubName('');
      setSubCode('');
      setSubDesc('');
      setSubColor('coral');
      setSubTargetHours('10');
      setShowAddSubjectOptions(false);
      setIsAddSubjectModalOpen(false);
      await loadData();
    } catch (err: any) {
      setSubError(err.message || 'Failed to create subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditSubject = (subject: StudySubject) => {
    setEditingSubject(subject);
    setEditSubName(subject.name);
    setEditSubCode(subject.code || 'CORE');
    setEditSubDesc(subject.description || '');
    setEditSubColor(subject.color || 'coral');
    setEditSubTargetHours(subject.targetHoursPerWeek.toString());
    setEditSubError(null);
    setIsEditSubjectModalOpen(true);
  };

  const handleEditSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    setEditSubError(null);

    if (!editSubName.trim()) {
      setEditSubError('Subject name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await dataService.study.updateSubject(editingSubject.id, {
        name: editSubName.trim(),
        code: editSubCode.trim() || 'CORE',
        description: editSubDesc.trim() || undefined,
        color: editSubColor,
        targetHoursPerWeek: parseFloat(editSubTargetHours) || 10
      });

      addToast({ title: 'Subject Updated', type: 'success' });
      setIsEditSubjectModalOpen(false);
      setEditingSubject(null);
      await loadData();
    } catch (err: any) {
      setEditSubError(err.message || 'Failed to update subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveSubject = async (id: string) => {
    try {
      await dataService.study.archiveSubject(id);
      addToast({ title: 'Subject Archived', description: 'Moved to Archived Subjects tab.', type: 'info' });
      await loadData();
    } catch (err: any) {
      addToast({ title: 'Archive Failed', description: err.message, type: 'error' });
    }
  };

  const handleRestoreSubject = async (id: string) => {
    try {
      await dataService.study.restoreSubject(id);
      addToast({ title: 'Subject Restored', description: 'Subject returned to Active state.', type: 'success' });
      await loadData();
    } catch (err: any) {
      addToast({ title: 'Restore Failed', description: err.message, type: 'error' });
    }
  };

  const handleConfirmDeleteSubject = async () => {
    if (!deletingSubject) return;
    setIsSubmitting(true);
    try {
      await dataService.study.deleteSubject(deletingSubject.id);
      addToast({ title: 'Subject Deleted', type: 'info' });
      setDeletingSubject(null);
      await loadData();
    } catch (err: any) {
      addToast({ title: 'Delete Failed', description: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Topic Operations
  const handleOpenTopicsModal = async (subject: StudySubject) => {
    setSelectedSubjectForTopics(subject);
    try {
      const topics = await dataService.study.getTopics(subject.id);
      setTopicsList(topics);
      setIsTopicsModalOpen(true);
    } catch {
      addToast({ title: 'Could not load topics', type: 'error' });
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectForTopics || !newTopicTitle.trim()) return;

    try {
      const newTopic = await dataService.study.createTopic({
        subjectId: selectedSubjectForTopics.id,
        title: newTopicTitle.trim(),
        orderIndex: topicsList.length
      });

      setTopicsList([...topicsList, newTopic]);
      setNewTopicTitle('');
      addToast({ title: 'Syllabus Topic Added', type: 'success' });
      await loadData();
    } catch {
      addToast({ title: 'Could not add topic', type: 'error' });
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    try {
      await dataService.study.deleteTopic(topicId);
      setTopicsList(topicsList.filter((t) => t.id !== topicId));
      addToast({ title: 'Topic removed', type: 'info' });
      await loadData();
    } catch {
      addToast({ title: 'Could not delete topic', type: 'error' });
    }
  };

  const handleToggleMastery = async (topic: StudyTopic) => {
    const nextLevel =
      topic.masteryLevel === 'unstudied'
        ? 'learning'
        : topic.masteryLevel === 'learning'
        ? 'mastered'
        : 'unstudied';

    try {
      const updated = await dataService.study.updateTopic(topic.id, { masteryLevel: nextLevel });
      setTopicsList(topicsList.map((t) => (t.id === topic.id ? updated : t)));
      await loadData();
    } catch {
      addToast({ title: 'Could not update mastery', type: 'error' });
    }
  };

  const handleTopicFocus = (topic: StudyTopic) => {
    setIsTopicsModalOpen(false);
    navigate(`/app/focus?subjectId=${topic.subjectId}&topicId=${topic.id}&title=${encodeURIComponent(topic.title)}`);
  };

  const handleTopicNote = (topic: StudyTopic) => {
    setIsTopicsModalOpen(false);
    navigate(`/app/notes?subjectId=${topic.subjectId}&topicId=${topic.id}&title=${encodeURIComponent(topic.title)}`);
  };

  // Study Session Operations
  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionError(null);
    if (!sessionSubjectId) {
      setSessionError('Please select a subject.');
      return;
    }
    if (!sessionTopics.trim()) {
      setSessionError('Please enter at least one topic covered.');
      return;
    }

    setIsSubmitting(true);
    try {
      const sub = subjects.find((s) => s.id === sessionSubjectId);
      const parsedTopics = sessionTopics
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const logged = await dataService.study.logSession({
        subjectId: sessionSubjectId,
        subjectName: sub?.name || 'General Study',
        planItemId: sessionPlanItemId || undefined,
        type: sessionType,
        durationMinutes: parseInt(sessionDuration, 10) || 45,
        topicsCovered: parsedTopics,
        notes: sessionNotes.trim() || undefined,
        retentionRating: (parseInt(sessionRetention, 10) as 1 | 2 | 3 | 4 | 5) || 5
      });

      if (createNoteFromSession && logged.notes) {
        await dataService.notes.createNote({
          title: `Study Session: ${logged.subjectName} (${getISODateString(new Date())})`,
          content: logged.notes,
          subjectId: logged.subjectId,
          studySessionId: logged.id,
          category: 'concept',
          tags: ['study-log', ...(logged.topicsCovered || [])]
        });
      }

      addToast({
        title: 'Study Session Logged',
        description: `Logged ${logged.durationMinutes}m for ${logged.subjectName}.`,
        type: 'success'
      });

      setIsLogSessionModalOpen(false);
      setSessionTopics('');
      setSessionNotes('');
      setCreateNoteFromSession(false);
      setSessionPlanItemId('');
      await loadData();
    } catch (err: any) {
      setSessionError(err.message || 'Failed to log study session.');
    } finally {
      setIsSubmitting(false);
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

  // Study Plan Operations
  const handleCreatePlanItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanError(null);
    if (!planTitle.trim()) {
      setPlanError('Topic title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const sub = subjects.find((s) => s.id === planSubjectId);
      await dataService.study.createPlanItem({
        title: planTitle.trim(),
        subjectId: planSubjectId || undefined,
        subjectName: sub?.name || 'General Study',
        targetMinutes: parseInt(planMinutes, 10) || 45,
        scheduledTime: planTime.trim() || '02:00 PM',
        priority: planPriority,
        scheduledDate: getISODateString(new Date())
      });

      addToast({ title: 'Topic Queued for Today', type: 'success' });
      setPlanTitle('');
      setIsAddPlanModalOpen(false);
      await loadData();
    } catch (err: any) {
      setPlanError(err.message || 'Failed to queue plan item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePlanItem = async (id: string) => {
    try {
      await dataService.study.togglePlanItem(id);
      await loadData();
    } catch {
      addToast({ title: 'Could not toggle plan item', type: 'error' });
    }
  };

  const handleDeletePlanItem = async (id: string) => {
    try {
      await dataService.study.deletePlanItem(id);
      addToast({ title: 'Plan item removed', type: 'info' });
      await loadData();
    } catch {
      addToast({ title: 'Could not delete plan item', type: 'error' });
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
        estimatedMinutes: item.targetMinutes,
        dueDate: item.scheduledDate || getISODateString(new Date()),
        dueTime: item.scheduledTime,
        tags: ['study-plan', item.subjectName || 'Study']
      });

      await dataService.study.updatePlanItem(item.id, { linkedTaskId: created.id });

      addToast({
        title: 'Task Created from Study Plan',
        description: `Linked to ${item.title}`,
        type: 'success'
      });
    } catch {
      addToast({ title: 'Could not convert to task', type: 'error' });
    }
  };

  // Spaced Retrieval Flashcard Callbacks
  const handleOpenCardCreator = (subjectId?: string, topicId?: string) => {
    setCardDefaultSubjectId(subjectId || subjects[0]?.id || '');
    setCardDefaultTopicId(topicId || '');
    setIsCreateFlashcardModalOpen(true);
  };

  const handleStartActiveRecall = (customDeck?: Flashcard[], isCram = false) => {
    const deck = customDeck || flashcards;
    if (deck.length === 0) {
      addToast({ title: 'No flashcards available in this deck', type: 'info' });
      return;
    }
    setActiveDeckCards(deck);
    setIsCramSessionActive(isCram);
    setIsReviewModalOpen(true);
  };

  const handleStartExamCram = (filteredDeck: Flashcard[]) => {
    handleStartActiveRecall(filteredDeck, true);
  };

  const handleCreateFlashcard = async (cardData: Partial<Flashcard>) => {
    try {
      await dataService.flashcards.createFlashcard(cardData);
      addToast({ title: 'Flashcard Synthesized', type: 'success' });
      await loadData();
    } catch (err: any) {
      addToast({ title: 'Failed to create flashcard', description: err.message, type: 'error' });
    }
  };

  const handleRecordCardAttempt = async (cardId: string, rating: CardRating) => {
    try {
      await dataService.flashcards.recordCardAttempt(cardId, rating);
      await loadData();
    } catch (err: any) {
      addToast({ title: 'Failed to record card review', description: err.message, type: 'error' });
    }
  };

  // Resource Library Callbacks
  const handleCreateResource = async (resourceData: Partial<StudyResource>) => {
    try {
      await dataService.resources.createResource(resourceData);
      addToast({ title: 'Study Resource Cataloged', type: 'success' });
      await loadData();
    } catch (err: any) {
      addToast({ title: 'Failed to add resource', description: err.message, type: 'error' });
    }
  };

  const handleUpdateResourceStatus = async (id: string, status: ReadingStatus) => {
    try {
      await dataService.resources.updateResource(id, { status });
      await loadData();
    } catch (err: any) {
      addToast({ title: 'Failed to update resource', description: err.message, type: 'error' });
    }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      await dataService.resources.deleteResource(id);
      addToast({ title: 'Resource Removed', type: 'info' });
      await loadData();
    } catch (err: any) {
      addToast({ title: 'Failed to delete resource', description: err.message, type: 'error' });
    }
  };

  const handleStudyResource = (resource: StudyResource) => {
    setIsResourceModalOpen(false);
    navigate(`/app/focus?subjectId=${resource.subjectId}&topicId=${resource.topicId || ''}&title=${encodeURIComponent(`Study: ${resource.title}`)}`);
  };

  const handleSynthesizeNote = (resource: StudyResource) => {
    setIsResourceModalOpen(false);
    navigate(`/app/notes?subjectId=${resource.subjectId}&topicId=${resource.topicId || ''}&title=${encodeURIComponent(`Synthesis: ${resource.title}`)}`);
  };

  return {
    navigate,
    openGuide,
    subjects,
    sessions,
    studyPlan,
    reviews,
    flashcards,
    resources,
    allTopics,
    initialLoadStatus,
    syncStatus,
    isRetrying,
    subjectViewTab,
    setSubjectViewTab,
    selectedTopicIdForDrawer,
    setSelectedTopicIdForDrawer,
    activeCount,
    archivedCount,
    displayedSubjects,
    learningSnapshot,
    isAddSubjectModalOpen,
    setIsAddSubjectModalOpen,
    isEditSubjectModalOpen,
    setIsEditSubjectModalOpen,
    editingSubject,
    setEditingSubject,
    deletingSubject,
    setDeletingSubject,
    activeActionMenuSubjectId,
    setActiveActionMenuSubjectId,
    showAddSubjectOptions,
    setShowAddSubjectOptions,
    isLogSessionModalOpen,
    setIsLogSessionModalOpen,
    isAddPlanModalOpen,
    setIsAddPlanModalOpen,
    isTopicsModalOpen,
    setIsTopicsModalOpen,
    isReviewModalOpen,
    setIsReviewModalOpen,
    isCreateFlashcardModalOpen,
    setIsCreateFlashcardModalOpen,
    isResourceModalOpen,
    setIsResourceModalOpen,
    isExamCramModalOpen,
    setIsExamCramModalOpen,
    isCramSessionActive,
    setIsCramSessionActive,
    handleStartExamCram,
    activeDeckCards,
    cardDefaultSubjectId,
    cardDefaultTopicId,
    resourceDefaultSubjectId,
    setResourceDefaultSubjectId,
    resourceDefaultTopicId,
    setResourceDefaultTopicId,
    selectedSubjectForTopics,
    topicsList,
    newTopicTitle,
    setNewTopicTitle,
    sessionSubjectId,
    setSessionSubjectId,
    sessionPlanItemId,
    setSessionPlanItemId,
    sessionType,
    setSessionType,
    sessionDuration,
    setSessionDuration,
    sessionTopics,
    setSessionTopics,
    sessionNotes,
    setSessionNotes,
    sessionRetention,
    setSessionRetention,
    createNoteFromSession,
    setCreateNoteFromSession,
    sessionError,
    subName,
    setSubName,
    subCode,
    setSubCode,
    subDesc,
    setSubDesc,
    subColor,
    setSubColor,
    subTargetHours,
    setSubTargetHours,
    subError,
    editSubName,
    setEditSubName,
    editSubCode,
    setEditSubCode,
    editSubDesc,
    setEditSubDesc,
    editSubColor,
    setEditSubColor,
    editSubTargetHours,
    setEditSubTargetHours,
    editSubError,
    planTitle,
    setPlanTitle,
    planSubjectId,
    setPlanSubjectId,
    planPriority,
    setPlanPriority,
    planMinutes,
    setPlanMinutes,
    planTime,
    setPlanTime,
    planError,
    isSubmitting,
    handleRetry,
    handleCreateSubject,
    handleOpenEditSubject,
    handleEditSubject,
    handleArchiveSubject,
    handleRestoreSubject,
    handleConfirmDeleteSubject,
    handleOpenTopicsModal,
    handleAddTopic,
    handleDeleteTopic,
    handleToggleMastery,
    handleTopicFocus,
    handleTopicNote,
    handleLogSession,
    handleDeleteSession,
    handleCreatePlanItem,
    handleTogglePlanItem,
    handleDeletePlanItem,
    handleConvertPlanToTask,
    handleOpenCardCreator,
    handleStartActiveRecall,
    handleCreateFlashcard,
    handleRecordCardAttempt,
    handleCreateResource,
    handleUpdateResourceStatus,
    handleDeleteResource,
    handleStudyResource,
    handleSynthesizeNote,
    loadData
  };
}
