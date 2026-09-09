import React from 'react';
import { useToast } from '../../context/ToastContext';
import { dataService } from '../../services/dataService';
import { FlashcardReviewModal } from '../../components/features/Flashcards/FlashcardReviewModal';
import { FlashcardCreateModal } from '../../components/features/Flashcards/FlashcardCreateModal';
import { ResourceLibraryModal } from '../../components/features/Resources/ResourceLibraryModal';
import { TopicIntelligenceDrawer } from './TopicIntelligenceDrawer';
import { useStudyPage } from './hooks/useStudyPage';

// Modular Subcomponents
import { SubjectListHeader } from './components/SubjectListHeader';
import { SubjectDetailHeader } from './components/SubjectDetailHeader';
import { SpacedReviewsSanctuary } from './components/SpacedReviewsSanctuary';
import { StudyPlanAgenda } from './components/StudyPlanAgenda';
import { StudyResourceGrid } from './components/StudyResourceGrid';
import { SyllabusTopicTree } from './components/SyllabusTopicTree';
import { SubjectFormModals } from './components/SubjectFormModals';
import './StudyPage.css';

export const StudyPage: React.FC = () => {
  const { addToast } = useToast();
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

      <SpacedReviewsSanctuary
        reviews={reviews}
        flashcards={flashcards}
        onOpenGuide={openGuide}
        onOpenCardCreator={handleOpenCardCreator}
        onStartActiveRecall={handleStartActiveRecall}
      />

      {/* Grid: Study Plan Queue (Left) + Recent Sessions (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
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
      />

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
        onClose={() => setIsReviewModalOpen(false)}
        cards={activeDeckCards}
        onRecordAttempt={handleRecordCardAttempt}
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
