import React from 'react';
import { Clock, Trash2, AlertCircle, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card/Card';
import { Badge } from '../../../components/ui/Badge/Badge';
import { Button } from '../../../components/ui/Button/Button';
import { Modal } from '../../../components/feedback/Modal/Modal';
import { Input } from '../../../components/ui/Input/Input';
import { Textarea } from '../../../components/ui/Textarea/Textarea';
import { CustomSelect } from '../../../components/ui/Select/CustomSelect';
import { Checkbox } from '../../../components/ui/Checkbox/Checkbox';
import { StudySession, StudySubject, StudyPlanItem, StudySessionType } from '../../../types/study';

export interface StudyResourceGridProps {
  sessions: StudySession[];
  subjects: StudySubject[];
  studyPlan: StudyPlanItem[];
  isLogSessionModalOpen: boolean;
  onCloseLogSessionModal: () => void;
  sessionSubjectId: string;
  onSessionSubjectIdChange: (val: string) => void;
  sessionPlanItemId: string;
  onSessionPlanItemIdChange: (val: string) => void;
  sessionType: StudySessionType;
  onSessionTypeChange: (val: StudySessionType) => void;
  sessionDuration: string;
  onSessionDurationChange: (val: string) => void;
  sessionTopics: string;
  onSessionTopicsChange: (val: string) => void;
  sessionNotes: string;
  onSessionNotesChange: (val: string) => void;
  createNoteFromSession: boolean;
  onToggleCreateNoteFromSession: () => void;
  sessionRetention: string;
  onSessionRetentionChange: (val: string) => void;
  sessionError: string | null;
  isSubmitting: boolean;
  onLogSession: (e: React.FormEvent) => void;
  onDeleteSession: (id: string) => void;
}

export const StudyResourceGrid: React.FC<StudyResourceGridProps> = ({
  sessions,
  subjects,
  studyPlan,
  isLogSessionModalOpen,
  onCloseLogSessionModal,
  sessionSubjectId,
  onSessionSubjectIdChange,
  sessionPlanItemId,
  onSessionPlanItemIdChange,
  sessionType,
  onSessionTypeChange,
  sessionDuration,
  onSessionDurationChange,
  sessionTopics,
  onSessionTopicsChange,
  sessionNotes,
  onSessionNotesChange,
  createNoteFromSession,
  onToggleCreateNoteFromSession,
  sessionRetention,
  onSessionRetentionChange,
  sessionError,
  isSubmitting,
  onLogSession,
  onDeleteSession
}) => {
  return (
    <>
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
                      onClick={() => onDeleteSession(session.id)}
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

      {/* Log Session Modal */}
      <Modal
        isOpen={isLogSessionModalOpen}
        onClose={onCloseLogSessionModal}
        title="Log Study Session"
      >
        <form onSubmit={onLogSession} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sessionError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
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
            onChange={onSessionSubjectIdChange}
            options={subjects.filter((s) => s.status !== 'archived').map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
          />

          {studyPlan.length > 0 && (
            <CustomSelect
              label="Associated Study Plan Item (Optional)"
              value={sessionPlanItemId}
              onChange={onSessionPlanItemIdChange}
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
              onChange={(val) => onSessionTypeChange(val as StudySessionType)}
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSessionDurationChange(e.target.value)}
              required
            />
          </div>

          <Input
            label="Topics Covered (Comma separated)"
            placeholder="e.g. Raft Leader Election, Heartbeats, Log Matching"
            value={sessionTopics}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSessionTopicsChange(e.target.value)}
            required
            autoFocus
          />

          <Textarea
            label="Synthesis / Key Takeaways"
            placeholder="Insights, confusing edge-cases, notes for flashcards..."
            value={sessionNotes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onSessionNotesChange(e.target.value)}
            style={{ minHeight: '68px' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0' }}>
            <Checkbox
              checked={createNoteFromSession}
              onChange={onToggleCreateNoteFromSession}
              label="Also save these insights as a permanent Knowledge Note"
            />
          </div>

          <CustomSelect
            label="Retention Self-Rating"
            value={sessionRetention}
            onChange={onSessionRetentionChange}
            options={[
              { value: '5', label: '5 — Complete mastery & effortless recall' },
              { value: '4', label: '4 — Solid comprehension' },
              { value: '3', label: '3 — Moderate recall, needs spaced review' },
              { value: '2', label: '2 — Struggling with core concepts' },
              { value: '1', label: '1 — Needs re-reading and fundamental help' }
            ]}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <Button variant="ghost" type="button" onClick={onCloseLogSessionModal}>
              Cancel
            </Button>
            <Button variant="accent" type="submit" isLoading={isSubmitting} leftIcon={<Sparkles size={14} />}>
              Save Study Log
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
