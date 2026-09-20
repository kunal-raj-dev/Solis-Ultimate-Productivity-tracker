import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, GraduationCap, FolderGit2, Target, X } from 'lucide-react';
import { Goal, GoalHorizon, GoalExperienceType } from '../../../types/goal';
import { StudySubject } from '../../../types/study';
import { PriorityLevel } from '../../../types/common';
import { Modal } from '../../../components/feedback/Modal/Modal';
import { Input } from '../../../components/ui/Input/Input';
import { Textarea } from '../../../components/ui/Textarea/Textarea';
import { DatePicker } from '../../../components/ui/DatePicker';
import { CustomSelect } from '../../../components/ui/Select/CustomSelect';
import { Button } from '../../../components/ui/Button/Button';
import { Badge } from '../../../components/ui/Badge/Badge';

export interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGoal: Goal | null;
  activeSubjects: StudySubject[];
  onSave: (goalData: Partial<Goal>) => Promise<void>;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  editingGoal,
  activeSubjects,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'strategic' | 'workspace' | 'milestones'>('strategic');

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [horizon, setHorizon] = useState<GoalHorizon>('medium_term');
  const [category, setCategory] = useState<'academic' | 'career' | 'skill' | 'personal'>('academic');
  const [experienceType, setExperienceType] = useState<GoalExperienceType>('standard');
  const [subjectId, setSubjectId] = useState('');
  const [targetDate, setTargetDate] = useState('2026-12-31');
  const [priority, setPriority] = useState<PriorityLevel>('high');

  // Exam fields
  const [targetScore, setTargetScore] = useState('95%');
  const [examWeight, setExamWeight] = useState('40');

  // Project fields
  const [projectRepoUrl, setProjectRepoUrl] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [newDeliverableInput, setNewDeliverableInput] = useState('');

  // Initial milestones (for create mode)
  const [initialMilestones, setInitialMilestones] = useState<{ title: string; targetDate?: string }[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form when modal opens or editingGoal changes
  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title);
      setDescription(editingGoal.description || '');
      setHorizon(editingGoal.horizon);
      setCategory(editingGoal.category);
      setExperienceType(editingGoal.experienceType || 'standard');
      setSubjectId(editingGoal.subjectId || '');
      setTargetDate(editingGoal.targetDate);
      setPriority(editingGoal.priority);
      setTargetScore(editingGoal.targetScore || '95%');
      setExamWeight(editingGoal.examWeight !== undefined && editingGoal.examWeight !== null ? String(editingGoal.examWeight) : '40');
      setProjectRepoUrl(editingGoal.projectRepositoryUrl || '');
      setDeliverables(editingGoal.deliverables || []);
      setInitialMilestones([]);
    } else {
      setTitle('');
      setDescription('');
      setHorizon('medium_term');
      setCategory('academic');
      setExperienceType('standard');
      setSubjectId('');
      setTargetDate('2026-12-31');
      setPriority('high');
      setTargetScore('95%');
      setExamWeight('40');
      setProjectRepoUrl('');
      setDeliverables([]);
      setInitialMilestones([]);
    }
    setNewDeliverableInput('');
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
    setFormError(null);
    setActiveTab('strategic');
  }, [editingGoal, isOpen, activeSubjects]);

  const handleAddDeliverable = () => {
    const trimmed = newDeliverableInput.trim();
    if (trimmed && !deliverables.includes(trimmed)) {
      setDeliverables((prev) => [...prev, trimmed]);
      setNewDeliverableInput('');
    }
  };

  const handleRemoveDeliverable = (index: number) => {
    setDeliverables((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddInitialMilestone = () => {
    const trimmed = newMilestoneTitle.trim();
    if (trimmed) {
      setInitialMilestones((prev) => [
        ...prev,
        { title: trimmed, targetDate: newMilestoneDate || undefined }
      ]);
      setNewMilestoneTitle('');
      setNewMilestoneDate('');
    }
  };

  const handleRemoveInitialMilestone = (index: number) => {
    setInitialMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Goal title is required.');
      setActiveTab('strategic');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const parsedExamWeight = examWeight.trim() !== '' && !isNaN(Number(examWeight))
        ? Number(examWeight)
        : 40;

      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        horizon,
        category,
        experienceType,
        subjectId: subjectId || null,
        targetDate,
        priority,
        color: experienceType === 'exam' ? 'coral' : experienceType === 'project' ? 'amber' : 'sage',
        targetScore: experienceType === 'exam' ? targetScore.trim() : null,
        examWeight: experienceType === 'exam' ? parsedExamWeight : null,
        projectRepositoryUrl: experienceType === 'project' ? projectRepoUrl.trim() : null,
        deliverables: experienceType === 'project' ? deliverables : []
      };

      if (!editingGoal && initialMilestones.length > 0) {
        payload.milestones = initialMilestones.map((m, idx) => ({
          id: `m_init_${Date.now()}_${idx}`,
          title: m.title,
          targetDate: m.targetDate || '',
          completed: false
        }));
      }

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save goal horizon');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingGoal ? 'Edit Goal Horizon' : 'Establish Strategic Horizon'}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {formError && (
          <div className="solis-goal-modal__error-banner" role="alert">
            {formError}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="solis-goal-modal__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'strategic'}
            className={`solis-goal-modal__tab ${activeTab === 'strategic' ? 'solis-goal-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('strategic')}
          >
            1. Horizon & Core
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'workspace'}
            className={`solis-goal-modal__tab ${activeTab === 'workspace' ? 'solis-goal-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('workspace')}
          >
            2. Mode & Workspace
          </button>
          {!editingGoal && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'milestones'}
              className={`solis-goal-modal__tab ${activeTab === 'milestones' ? 'solis-goal-modal__tab--active' : ''}`}
              onClick={() => setActiveTab('milestones')}
            >
              3. Initial Checkpoints ({initialMilestones.length})
            </button>
          )}
        </div>

        {/* TAB 1: Strategic & Core */}
        {activeTab === 'strategic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input
              label="Goal Horizon Statement"
              placeholder="e.g. Master Distributed Systems Architecture & Capstone"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />

            <Textarea
              label="Vision / Objective"
              placeholder="Why this horizon matters to your intellectual momentum and long-term trajectory..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="solis-goals-form-grid">
              <CustomSelect
                label="Horizon Period"
                value={horizon}
                onChange={(val) => setHorizon(val as GoalHorizon)}
                options={[
                  { value: 'short_term', label: 'Short-Term (1-3 months)' },
                  { value: 'medium_term', label: 'Medium-Term (Semester)' },
                  { value: 'long_term', label: 'Long-Term (1-2 years)' },
                  { value: 'vision', label: 'Life Vision' }
                ]}
              />

              <CustomSelect
                label="Category"
                value={category}
                onChange={(val) => setCategory(val as any)}
                options={[
                  { value: 'academic', label: 'Academic & Courses' },
                  { value: 'career', label: 'Career & Industry' },
                  { value: 'skill', label: 'Cognitive Skill' },
                  { value: 'personal', label: 'Personal Growth' }
                ]}
              />
            </div>

            <div className="solis-goals-form-grid">
              {activeSubjects.length > 0 ? (
                <CustomSelect
                  label="Associated Study Subject"
                  value={subjectId}
                  onChange={setSubjectId}
                  options={[
                    { value: '', label: 'General / No Subject' },
                    ...activeSubjects.map((s) => ({ value: s.id, label: s.name }))
                  ]}
                />
              ) : (
                <div />
              )}

              <CustomSelect
                label="Priority"
                value={priority}
                onChange={(val) => setPriority(val as PriorityLevel)}
                options={[
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' }
                ]}
              />
            </div>

            <div>
              <DatePicker
                label="Target Completion Date"
                value={targetDate}
                onChange={setTargetDate}
              />
            </div>
          </div>
        )}

        {/* TAB 2: Mode & Workspace */}
        {activeTab === 'workspace' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="solis-goal-modal__label">Goal Experience Mode</label>
              <div className="solis-goal-modal__mode-selector">
                <button
                  type="button"
                  className={`solis-goal-modal__mode-card ${
                    experienceType === 'standard' ? 'solis-goal-modal__mode-card--active' : ''
                  }`}
                  onClick={() => setExperienceType('standard')}
                >
                  <Target size={20} className="solis-goal-modal__mode-icon" />
                  <span className="solis-goal-modal__mode-title">Standard Goal</span>
                  <span className="solis-goal-modal__mode-desc">
                    Milestone checklist, progress tracking, and daily focus sessions.
                  </span>
                </button>

                <button
                  type="button"
                  className={`solis-goal-modal__mode-card ${
                    experienceType === 'exam' ? 'solis-goal-modal__mode-card--active' : ''
                  }`}
                  onClick={() => setExperienceType('exam')}
                >
                  <GraduationCap size={20} className="solis-goal-modal__mode-icon solis-goal-modal__mode-icon--coral" />
                  <span className="solis-goal-modal__mode-title">Exam Workspace</span>
                  <span className="solis-goal-modal__mode-desc">
                    Exam readiness score, syllabus topic mastery, and active recall drills.
                  </span>
                </button>

                <button
                  type="button"
                  className={`solis-goal-modal__mode-card ${
                    experienceType === 'project' ? 'solis-goal-modal__mode-card--active' : ''
                  }`}
                  onClick={() => setExperienceType('project')}
                >
                  <FolderGit2 size={20} className="solis-goal-modal__mode-icon solis-goal-modal__mode-icon--amber" />
                  <span className="solis-goal-modal__mode-title">Project Workspace</span>
                  <span className="solis-goal-modal__mode-desc">
                    Repository links, core engineering deliverables, and active project tasks.
                  </span>
                </button>
              </div>
            </div>

            {/* Exam Mode Settings */}
            {experienceType === 'exam' && (
              <div className="solis-goals-form-grid--nested">
                <Input
                  label="Target Exam Score / Grade"
                  placeholder="e.g. 95% (Distinction)"
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                />
                <Input
                  label="Exam Weight (% of Final Grade)"
                  type="number"
                  placeholder="e.g. 40"
                  value={examWeight}
                  onChange={(e) => setExamWeight(e.target.value)}
                />
              </div>
            )}

            {/* Project Mode Settings */}
            {experienceType === 'project' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Input
                  label="Project Repository / Research URL"
                  placeholder="https://github.com/scholar/storage-engine"
                  value={projectRepoUrl}
                  onChange={(e) => setProjectRepoUrl(e.target.value)}
                />

                {/* Deliverables Manager */}
                <div className="solis-goal-modal__deliverables-section">
                  <label className="solis-goal-modal__label">
                    Core Technical Deliverables ({deliverables.length})
                  </label>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Add key deliverable (e.g. Raft consensus cluster)..."
                      value={newDeliverableInput}
                      onChange={(e) => setNewDeliverableInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDeliverable();
                        }
                      }}
                      className="solis-goal-card__inline-input"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={handleAddDeliverable}
                      leftIcon={<Plus size={13} />}
                    >
                      Add
                    </Button>
                  </div>

                  {deliverables.length > 0 && (
                    <div className="solis-goal-modal__deliverables-list">
                      {deliverables.map((item, idx) => (
                        <div key={idx} className="solis-goal-modal__deliverable-item">
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDeliverable(idx)}
                            className="solis-goal-modal__item-remove"
                            aria-label="Remove deliverable"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Initial Milestones */}
        {activeTab === 'milestones' && !editingGoal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              Deconstruct your horizon into key milestones now. You can always add or adjust steps later.
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Milestone title (e.g. Complete Topic 1 Syllabus)..."
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                className="solis-goal-card__inline-input"
                style={{ flex: 1, minWidth: '200px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInitialMilestone();
                  }
                }}
              />
              <input
                type="date"
                value={newMilestoneDate}
                onChange={(e) => setNewMilestoneDate(e.target.value)}
                className="solis-goal-card__inline-date"
                title="Target date"
              />
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={handleAddInitialMilestone}
                leftIcon={<Plus size={13} />}
              >
                Add Step
              </Button>
            </div>

            {initialMilestones.length > 0 ? (
              <div className="solis-goal-modal__milestones-preview">
                {initialMilestones.map((m, idx) => (
                  <div key={idx} className="solis-goal-modal__milestone-preview-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="solis-goal-modal__step-num">{idx + 1}</span>
                      <span style={{ fontWeight: 500, fontSize: 'var(--text-body-sm)' }}>{m.title}</span>
                      {m.targetDate && (
                        <Badge variant="neutral" style={{ fontSize: '11px' }}>
                          {m.targetDate}
                        </Badge>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveInitialMilestone(idx)}
                      className="solis-goal-modal__item-remove"
                      aria-label="Remove milestone"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="solis-goal-card__milestones-empty">
                No initial checkpoints added yet.
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="solis-goal-modal__footer">
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab !== 'strategic' && (
              <Button
                variant="ghost"
                type="button"
                onClick={() =>
                  setActiveTab(activeTab === 'milestones' ? 'workspace' : 'strategic')
                }
              >
                ← Back
              </Button>
            )}
            {activeTab !== (!editingGoal ? 'milestones' : 'workspace') && (
              <Button
                variant="secondary"
                type="button"
                onClick={() =>
                  setActiveTab(activeTab === 'strategic' ? 'workspace' : 'milestones')
                }
              >
                Next →
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="accent"
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<Sparkles size={14} />}
            >
              {editingGoal ? 'Update Horizon' : 'Establish Horizon'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
