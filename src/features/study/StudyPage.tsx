import React, { useState } from 'react';
import { Flame, Sparkles, FileText, BookOpen } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { useToast } from '../../context/ToastContext';
import { dataService } from '../../services/dataService';
import { FlashcardReviewModal } from '../../components/features/Flashcards/FlashcardReviewModal';
import { FlashcardCreateModal } from '../../components/features/Flashcards/FlashcardCreateModal';
import { ExamCramModal } from '../../components/features/Flashcards/ExamCramModal';
import { ResourceLibraryModal } from '../../components/features/Resources/ResourceLibraryModal';
import { ImportModal } from '../../components/features/ImportModal/ImportModal';
import { SplitScreenPdfWorkspace } from '../../components/features/Study/SplitScreenPdfWorkspace';
import { TopicIntelligenceDrawer } from './TopicIntelligenceDrawer';
import { useStudyPage } from './hooks/useStudyPage';
import { createAnkiPackageApkg, downloadFile } from '../../utils/export/ankiExporter';
import { formatErrorMessage } from '../../utils/errors';
import { StudyResource } from '../../types/resource';

// Modular Subcomponents
import { SubjectListHeader } from './components/SubjectListHeader';
import { SubjectDetailHeader } from './components/SubjectDetailHeader';
import { SpacedReviewsSanctuary } from './components/SpacedReviewsSanctuary';
import { AdaptiveStudySuggester } from '../../components/features/Study/AdaptiveStudySuggester';
import { StudyPlanAgenda } from './components/StudyPlanAgenda';
import { StudyResourceGrid } from './components/StudyResourceGrid';
import { SyllabusTopicTree } from './components/SyllabusTopicTree';
import { SubjectFormModals } from './components/SubjectFormModals';
import { ExamHorizonBar } from '../../components/features/Goals/ExamHorizonBar';
import './StudyPage.css';

export const StudyPage: React.FC = () => {
  const { addToast } = useToast();
  const [isDeckImportOpen, setIsDeckImportOpen] = useState(false);
  const [isPdfWorkspaceOpen, setIsPdfWorkspaceOpen] = useState(false);
  const [pdfWorkspaceResource, setPdfWorkspaceResource] = useState<StudyResource | null>(null);
  const {
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
  } = useStudyPage();

  const handleExportDeck = async () => {
    if (flashcards.length === 0) {
      addToast({
        title: 'No Flashcards',
        description: 'Create or import some flashcards first before exporting.',
        type: 'warning'
      });
      return;
    }
    try {
      const subjectName = selectedSubjectForTopics?.name || 'Solis_Deck';
      const safeName = subjectName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const blob = await createAnkiPackageApkg(subjectName, flashcards);
      downloadFile(`${safeName}.apkg`, blob);
      addToast({
        title: 'Deck Exported',
        description: `Exported ${flashcards.length} cards to ${safeName}.apkg`,
        type: 'success'
      });
    } catch (err) {
      addToast({
        title: 'Export Failed',
        description: formatErrorMessage(err),
        type: 'error'
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
      <SubjectListHeader
        resources={resources}
        subjects={subjects}
        activeCount={activeCount}
        archivedCount={archivedCount}
        subjectViewTab={subjectViewTab}
        onSelectTab={setSubjectViewTab}
        onOpenResourceModal={() => {
          setResourceDefaultSubjectId('');
          setResourceDefaultTopicId('');
          setIsResourceModalOpen(true);
        }}
        onOpenAddSubjectModal={() => setIsAddSubjectModalOpen(true)}
        onOpenLogSessionModal={() => setIsLogSessionModalOpen(true)}
        onOpenGuide={openGuide}
        syncStatus={syncStatus}
        isRetrying={isRetrying}
        onRetry={handleRetry}
      />

      <ExamHorizonBar topics={allTopics} flashcards={flashcards} />

      <SubjectDetailHeader
        displayedSubjects={displayedSubjects}
        subjects={subjects}
        activeCount={activeCount}
        archivedCount={archivedCount}
        subjectViewTab={subjectViewTab}
        initialLoadStatus={initialLoadStatus}
        isRetrying={isRetrying}
        activeActionMenuSubjectId={activeActionMenuSubjectId}
        learningSnapshot={learningSnapshot}
        onRetry={handleRetry}
        onSelectTab={setSubjectViewTab}
        onOpenAddSubjectModal={() => setIsAddSubjectModalOpen(true)}
        onToggleActionMenu={setActiveActionMenuSubjectId}
        onOpenTopicsModal={handleOpenTopicsModal}
        onOpenEditSubject={handleOpenEditSubject}
        onRestoreSubject={handleRestoreSubject}
        onArchiveSubject={handleArchiveSubject}
        onSetDeletingSubject={setDeletingSubject}
      />

      {/* Living Split-Pane Master-Detail Syllabus Workspace (Zero-Modal Architecture) */}
      {selectedSubjectForTopics && isTopicsModalOpen && (
        <div className="solis-study-split-pane" id="study-split-pane">
          <div className="solis-syllabus-column">
            <SyllabusTopicTree
              isOpen={isTopicsModalOpen}
              onClose={() => setIsTopicsModalOpen(false)}
              subject={selectedSubjectForTopics}
              topicsList={topicsList}
              newTopicTitle={newTopicTitle}
              onNewTopicTitleChange={setNewTopicTitle}
              onAddTopic={handleAddTopic}
              learningSnapshot={learningSnapshot}
              onSelectTopicForDrawer={(topicId: string) => setSelectedTopicIdForDrawer(topicId)}
              onTopicFocus={handleTopicFocus}
              onTopicNote={handleTopicNote}
              onOpenCardCreator={(subId: string, topId: string) => handleOpenCardCreator(subId, topId)}
              onOpenResourceModal={(subId: string, topId: string) => {
                setResourceDefaultSubjectId(subId);
                setResourceDefaultTopicId(topId);
                setIsResourceModalOpen(true);
              }}
              onToggleMastery={handleToggleMastery}
              onDeleteTopic={handleDeleteTopic}
              inline={true}
            />
          </div>

          <div className="solis-workspace-column">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {selectedSubjectForTopics.name} Companion Workspace
                </h3>
                <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                  Code: {selectedSubjectForTopics.code || 'CORE'}
                </span>
              </div>
            </div>

            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', margin: '0 0 14px' }}>
              {selectedSubjectForTopics.description || 'Active syllabus roadmap, active recall flashcards, and dedicated focus triggers for this discipline.'}
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <Button
                variant="accent"
                size="sm"
                leftIcon={<Flame size={14} />}
                onClick={() => navigate(`/app/focus?subjectId=${selectedSubjectForTopics.id}&title=${encodeURIComponent(`Deep Focus: ${selectedSubjectForTopics.name}`)}`)}
              >
                Enter Focus
              </Button>
              <Button
                variant="subtle"
                size="sm"
                leftIcon={<Sparkles size={14} />}
                onClick={() => handleStartActiveRecall(flashcards.filter((f) => f.subjectId === selectedSubjectForTopics.id))}
              >
                Drill Cards ({flashcards.filter((f) => f.subjectId === selectedSubjectForTopics.id).length})
              </Button>
              {/* Plan §3.6: Notes tab in the Subject Workspace — opens the
                  Notes index pre-filtered to this subject */}
              <Button
                variant="subtle"
                size="sm"
                leftIcon={<FileText size={14} />}
                onClick={() => navigate(`/app/notes?subjectId=${selectedSubjectForTopics.id}`)}
              >
                Notes
              </Button>
              <Button
                variant="subtle"
                size="sm"
                leftIcon={<BookOpen size={14} />}
                onClick={() => {
                  setPdfWorkspaceResource(null);
                  setIsPdfWorkspaceOpen(true);
                }}
                title="Open Split-Screen PDF Lecture Reader & Annotation Workspace"
              >
                Lecture Reader
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setResourceDefaultSubjectId(selectedSubjectForTopics.id);
                  setResourceDefaultTopicId('');
                  setIsResourceModalOpen(true);
                }}
              >
                + Resource
              </Button>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-primary)' }}>Weekly Focus Target</span>
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-coral-500)', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}>
                  {selectedSubjectForTopics.completedHoursThisWeek} / {selectedSubjectForTopics.targetHoursPerWeek} hrs
                </span>
              </div>
              <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                {topicsList.filter((t) => t.masteryLevel === 'mastered').length} of {topicsList.length} topics mastered
              </div>
            </div>
          </div>
        </div>
      )}

      <SpacedReviewsSanctuary
        reviews={reviews}
        flashcards={flashcards}
        onOpenGuide={openGuide}
        onOpenCardCreator={handleOpenCardCreator}
        onStartActiveRecall={handleStartActiveRecall}
        onImportDeck={() => setIsDeckImportOpen(true)}
        onExportDeck={handleExportDeck}
        onOpenExamCram={() => setIsExamCramModalOpen(true)}
      />

      {/* Grid: Study Plan Queue (Left) + Recent Sessions (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
        <div>
          <AdaptiveStudySuggester />
          <StudyPlanAgenda
          studyPlan={studyPlan}
          subjects={subjects}
          isAddPlanModalOpen={isAddPlanModalOpen}
          onOpenAddPlanModal={() => setIsAddPlanModalOpen(true)}
          onCloseAddPlanModal={() => setIsAddPlanModalOpen(false)}
          planTitle={planTitle}
          onPlanTitleChange={setPlanTitle}
          planSubjectId={planSubjectId}
          onPlanSubjectIdChange={setPlanSubjectId}
          planPriority={planPriority}
          onPlanPriorityChange={setPlanPriority}
          planMinutes={planMinutes}
          onPlanMinutesChange={setPlanMinutes}
          planTime={planTime}
          onPlanTimeChange={setPlanTime}
          planError={planError}
          isSubmitting={isSubmitting}
          onSyncRoutines={async () => {
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
          onCreatePlanItem={handleCreatePlanItem}
          onTogglePlanItem={handleTogglePlanItem}
          onDeletePlanItem={handleDeletePlanItem}
          onConvertPlanToTask={handleConvertPlanToTask}
          onStartFocus={(item) => navigate(`/app/focus?subjectId=${item.subjectId}&planId=${item.id}&title=${encodeURIComponent(item.title)}`)}
        />
        </div>

        <StudyResourceGrid
          sessions={sessions}
          subjects={subjects}
          studyPlan={studyPlan}
          isLogSessionModalOpen={isLogSessionModalOpen}
          onCloseLogSessionModal={() => setIsLogSessionModalOpen(false)}
          sessionSubjectId={sessionSubjectId}
          onSessionSubjectIdChange={setSessionSubjectId}
          sessionPlanItemId={sessionPlanItemId}
          onSessionPlanItemIdChange={setSessionPlanItemId}
          sessionType={sessionType}
          onSessionTypeChange={setSessionType}
          sessionDuration={sessionDuration}
          onSessionDurationChange={setSessionDuration}
          sessionTopics={sessionTopics}
          onSessionTopicsChange={setSessionTopics}
          sessionNotes={sessionNotes}
          onSessionNotesChange={setSessionNotes}
          createNoteFromSession={createNoteFromSession}
          onToggleCreateNoteFromSession={() => setCreateNoteFromSession(!createNoteFromSession)}
          sessionRetention={sessionRetention}
          onSessionRetentionChange={setSessionRetention}
          sessionError={sessionError}
          isSubmitting={isSubmitting}
          onLogSession={handleLogSession}
          onDeleteSession={handleDeleteSession}
        />
      </div>

      <SubjectFormModals
        isAddSubjectModalOpen={isAddSubjectModalOpen}
        onCloseAddSubjectModal={() => setIsAddSubjectModalOpen(false)}
        subName={subName}
        onSubNameChange={setSubName}
        subCode={subCode}
        onSubCodeChange={setSubCode}
        subDesc={subDesc}
        onSubDescChange={setSubDesc}
        subColor={subColor}
        onSubColorChange={setSubColor}
        subTargetHours={subTargetHours}
        onSubTargetHoursChange={setSubTargetHours}
        subError={subError}
        showAddSubjectOptions={showAddSubjectOptions}
        onToggleAddSubjectOptions={() => setShowAddSubjectOptions(!showAddSubjectOptions)}
        onCreateSubject={handleCreateSubject}
        isEditSubjectModalOpen={isEditSubjectModalOpen}
        onCloseEditSubjectModal={() => {
          setIsEditSubjectModalOpen(false);
          setEditingSubject(null);
        }}
        editSubName={editSubName}
        onEditSubNameChange={setEditSubName}
        editSubCode={editSubCode}
        onEditSubCodeChange={setEditSubCode}
        editSubDesc={editSubDesc}
        onEditSubDescChange={setEditSubDesc}
        editSubColor={editSubColor}
        onEditSubColorChange={setEditSubColor}
        editSubTargetHours={editSubTargetHours}
        onEditSubTargetHoursChange={setEditSubTargetHours}
        editSubError={editSubError}
        onEditSubject={handleEditSubject}
        deletingSubject={deletingSubject}
        onCloseDeleteSubjectModal={() => setDeletingSubject(null)}
        onArchiveSubjectInstead={(id: string) => {
          handleArchiveSubject(id);
          setDeletingSubject(null);
        }}
        onConfirmDeleteSubject={handleConfirmDeleteSubject}
        isSubmitting={isSubmitting}
      />

      <FlashcardReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setIsCramSessionActive(false);
        }}
        cards={activeDeckCards}
        onRecordAttempt={handleRecordCardAttempt}
        isCramMode={isCramSessionActive}
      />

      <ExamCramModal
        isOpen={isExamCramModalOpen}
        onClose={() => setIsExamCramModalOpen(false)}
        flashcards={flashcards}
        subjects={subjects.filter((s) => s.status !== 'archived')}
        topics={allTopics}
        onStartCram={handleStartExamCram}
      />

      <FlashcardCreateModal
        isOpen={isCreateFlashcardModalOpen}
        onClose={() => setIsCreateFlashcardModalOpen(false)}
        subjects={subjects.filter((s) => s.status !== 'archived')}
        topics={topicsList}
        defaultSubjectId={cardDefaultSubjectId}
        defaultTopicId={cardDefaultTopicId}
        onCreateCard={handleCreateFlashcard}
      />

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
        onOpenLectureReader={(res) => {
          setIsResourceModalOpen(false);
          setPdfWorkspaceResource(res);
          setIsPdfWorkspaceOpen(true);
        }}
      />

      <SplitScreenPdfWorkspace
        isOpen={isPdfWorkspaceOpen}
        onClose={() => {
          setIsPdfWorkspaceOpen(false);
          setPdfWorkspaceResource(null);
        }}
        resource={pdfWorkspaceResource}
        subject={selectedSubjectForTopics}
        topic={selectedTopicIdForDrawer ? topicsList.find((t) => t.id === selectedTopicIdForDrawer) : null}
        subjects={subjects.filter((s) => s.status !== 'archived')}
        topics={allTopics}
      />

      {/* Plan §4.4: client-side Anki (.apkg) / Quizlet deck importer */}
      <ImportModal
        isOpen={isDeckImportOpen}
        onClose={() => setIsDeckImportOpen(false)}
        initialMode="deck"
        onSuccess={() => {
          void loadData();
        }}
      />

      <TopicIntelligenceDrawer
        isOpen={selectedTopicIdForDrawer !== null}
        onClose={() => setSelectedTopicIdForDrawer(null)}
        history={selectedTopicIdForDrawer ? learningSnapshot.topicHistories.get(selectedTopicIdForDrawer) : undefined}
        mastery={selectedTopicIdForDrawer ? learningSnapshot.masteryEvaluations.get(selectedTopicIdForDrawer) : undefined}
        retention={selectedTopicIdForDrawer ? learningSnapshot.retentionSignals.get(selectedTopicIdForDrawer) : undefined}
        onStartFlashcardDrill={(topicId) => {
          const topicCards = flashcards.filter((f) => f.topicId === topicId);
          if (topicCards.length > 0) {
            handleStartActiveRecall(topicCards);
          } else {
            addToast({ title: 'No flashcards created for this topic yet.', type: 'info' });
          }
        }}
        onOpenNotes={(subjectId, topicId) => {
          navigate(`/app/notes?subjectId=${subjectId}&topicId=${topicId}`);
        }}
      />
    </div>
  );
};
