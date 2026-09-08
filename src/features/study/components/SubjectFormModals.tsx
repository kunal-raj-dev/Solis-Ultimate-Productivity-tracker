import React from 'react';
import { Modal } from '../../../components/feedback/Modal/Modal';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { StudySubject } from '../../../types/study';

export interface SubjectFormModalsProps {
  // Add Subject Modal
  isAddSubjectModalOpen: boolean;
  onCloseAddSubjectModal: () => void;
  subName: string;
  onSubNameChange: (val: string) => void;
  subCode: string;
  onSubCodeChange: (val: string) => void;
  subDesc: string;
  onSubDescChange: (val: string) => void;
  subColor: string;
  onSubColorChange: (val: string) => void;
  subTargetHours: string;
  onSubTargetHoursChange: (val: string) => void;
  subError: string | null;
  showAddSubjectOptions: boolean;
  onToggleAddSubjectOptions: () => void;
  onCreateSubject: (e: React.FormEvent) => void;

  // Edit Subject Modal
  isEditSubjectModalOpen: boolean;
  onCloseEditSubjectModal: () => void;
  editSubName: string;
  onEditSubNameChange: (val: string) => void;
  editSubCode: string;
  onEditSubCodeChange: (val: string) => void;
  editSubDesc: string;
  onEditSubDescChange: (val: string) => void;
  editSubColor: string;
  onEditSubColorChange: (val: string) => void;
  editSubTargetHours: string;
  onEditSubTargetHoursChange: (val: string) => void;
  editSubError: string | null;
  onEditSubject: (e: React.FormEvent) => void;

  // Delete Subject Modal
  deletingSubject: StudySubject | null;
  onCloseDeleteSubjectModal: () => void;
  onArchiveSubjectInstead: (id: string) => void;
  onConfirmDeleteSubject: () => void;

  isSubmitting: boolean;
}

const colorOptions = [
  { id: 'coral', label: 'Coral', color: 'var(--color-coral-500)' },
  { id: 'amber', label: 'Amber', color: 'var(--color-amber-500)' },
  { id: 'lavender', label: 'Lavender', color: 'var(--color-lavender-500)' },
  { id: 'sage', label: 'Sage', color: 'var(--color-sage-500)' }
];

export const SubjectFormModals: React.FC<SubjectFormModalsProps> = ({
  isAddSubjectModalOpen,
  onCloseAddSubjectModal,
  subName,
  onSubNameChange,
  subCode,
  onSubCodeChange,
  subDesc,
  onSubDescChange,
  subColor,
  onSubColorChange,
  subTargetHours,
  onSubTargetHoursChange,
  subError,
  showAddSubjectOptions,
  onToggleAddSubjectOptions,
  onCreateSubject,

  isEditSubjectModalOpen,
  onCloseEditSubjectModal,
  editSubName,
  onEditSubNameChange,
  editSubCode,
  onEditSubCodeChange,
  editSubDesc,
  onEditSubDescChange,
  editSubColor,
  onEditSubColorChange,
  editSubTargetHours,
  onEditSubTargetHoursChange,
  editSubError,
  onEditSubject,

  deletingSubject,
  onCloseDeleteSubjectModal,
  onArchiveSubjectInstead,
  onConfirmDeleteSubject,

  isSubmitting
}) => {
  return (
    <>
      {/* Add Subject Modal */}
      <Modal
        isOpen={isAddSubjectModalOpen}
        onClose={onCloseAddSubjectModal}
        title="Create Study Subject"
      >
        <form onSubmit={onCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {subError && (
            <div style={{ color: 'var(--status-error)', fontSize: 'var(--text-caption)' }}>
              {subError}
            </div>
          )}

          <Input
            label="Subject Title"
            placeholder="e.g. Distributed Consensus Systems"
            value={subName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSubNameChange(e.target.value)}
            required
            autoFocus
          />

          <div>
            <button
              type="button"
              onClick={onToggleAddSubjectOptions}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSubDescChange(e.target.value)}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <Input
                    label="Course Code"
                    placeholder="e.g. CS 440"
                    value={subCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSubCodeChange(e.target.value)}
                  />
                  <Input
                    label="Weekly Goal (Hours)"
                    type="number"
                    value={subTargetHours}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSubTargetHoursChange(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Subject color
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(68px, 1fr))', gap: '8px' }}>
                    {colorOptions.map((c) => {
                      const isSelected = subColor === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => onSubColorChange(c.id)}
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
            <Button variant="ghost" type="button" onClick={onCloseAddSubjectModal}>
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
        onClose={onCloseEditSubjectModal}
        title="Edit Subject"
      >
        <form onSubmit={onEditSubject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {editSubError && (
            <div style={{ color: 'var(--status-error)', fontSize: 'var(--text-caption)' }}>
              {editSubError}
            </div>
          )}

          <Input
            label="Subject Title"
            value={editSubName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onEditSubNameChange(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Description / Scope"
            value={editSubDesc}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onEditSubDescChange(e.target.value)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <Input
              label="Course Code"
              value={editSubCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onEditSubCodeChange(e.target.value)}
            />
            <Input
              label="Weekly Goal (Hours)"
              type="number"
              value={editSubTargetHours}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onEditSubTargetHoursChange(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Subject color
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(68px, 1fr))', gap: '8px' }}>
              {colorOptions.map((c) => {
                const isSelected = editSubColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onEditSubColorChange(c.id)}
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
              onClick={onCloseEditSubjectModal}
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
        onClose={onCloseDeleteSubjectModal}
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
                  onArchiveSubjectInstead(deletingSubject.id);
                }
              }}
            >
              Archive Instead
            </Button>
            <Button variant="ghost" type="button" onClick={onCloseDeleteSubjectModal}>
              Cancel
            </Button>
            <Button variant="destructive" type="button" isLoading={isSubmitting} onClick={onConfirmDeleteSubject}>
              Delete Subject
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
