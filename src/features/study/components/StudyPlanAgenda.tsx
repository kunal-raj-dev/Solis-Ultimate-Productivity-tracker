import React from 'react';
import { Calendar, Repeat, Plus, ListTodo, Trash2, Play } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { Checkbox } from '../../../components/ui/Checkbox/Checkbox';
import { Badge } from '../../../components/ui/Badge/Badge';
import { Modal } from '../../../components/feedback/Modal/Modal';
import { Input } from '../../../components/ui/Input/Input';
import { CustomSelect } from '../../../components/ui/Select/CustomSelect';
import { StudyPlanItem, StudySubject, PlanPriority } from '../../../types/study';

export interface StudyPlanAgendaProps {
  studyPlan: StudyPlanItem[];
  subjects: StudySubject[];
  isAddPlanModalOpen: boolean;
  onOpenAddPlanModal: () => void;
  onCloseAddPlanModal: () => void;
  planTitle: string;
  onPlanTitleChange: (val: string) => void;
  planSubjectId: string;
  onPlanSubjectIdChange: (val: string) => void;
  planPriority: PlanPriority;
  onPlanPriorityChange: (val: PlanPriority) => void;
  planMinutes: string;
  onPlanMinutesChange: (val: string) => void;
  planTime: string;
  onPlanTimeChange: (val: string) => void;
  planError: string | null;
  isSubmitting: boolean;
  onSyncRoutines: () => void;
  onCreatePlanItem: (e: React.FormEvent) => void;
  onTogglePlanItem: (id: string) => void;
  onDeletePlanItem: (id: string) => void;
  onConvertPlanToTask: (item: StudyPlanItem) => void;
  onStartFocus: (item: StudyPlanItem) => void;
}

export const StudyPlanAgenda: React.FC<StudyPlanAgendaProps> = ({
  studyPlan,
  subjects,
  isAddPlanModalOpen,
  onOpenAddPlanModal,
  onCloseAddPlanModal,
  planTitle,
  onPlanTitleChange,
  planSubjectId,
  onPlanSubjectIdChange,
  planPriority,
  onPlanPriorityChange,
  planMinutes,
  onPlanMinutesChange,
  planTime,
  onPlanTimeChange,
  planError,
  isSubmitting,
  onSyncRoutines,
  onCreatePlanItem,
  onTogglePlanItem,
  onDeletePlanItem,
  onConvertPlanToTask,
  onStartFocus
}) => {
  return (
    <>
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
              onClick={onSyncRoutines}
            >
              Sync Routines
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={onOpenAddPlanModal}
            >
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
                      onChange={() => onTogglePlanItem(item.id)}
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
                        type="button"
                        onClick={() => onConvertPlanToTask(item)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', minWidth: '28px', minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-xs)' }}
                        title="Convert to Task"
                        aria-label={`Convert ${item.title} to task`}
                      >
                        <ListTodo size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeletePlanItem(item.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', minWidth: '28px', minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-xs)' }}
                      title="Delete plan item"
                      aria-label={`Delete ${item.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                    <Button
                      variant="subtle"
                      size="sm"
                      leftIcon={<Play size={12} />}
                      onClick={() => onStartFocus(item)}
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

      {/* Add Plan Modal */}
      <Modal
        isOpen={isAddPlanModalOpen}
        onClose={onCloseAddPlanModal}
        title="Queue Today's Study Topic"
      >
        <form onSubmit={onCreatePlanItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {planError && (
            <div style={{ color: 'var(--status-error)', fontSize: 'var(--text-caption)' }}>
              {planError}
            </div>
          )}

          <Input
            label="Topic Statement"
            placeholder="e.g. LLVM Intermediate Representation Optimizations"
            value={planTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onPlanTitleChange(e.target.value)}
            required
            autoFocus
          />

          <CustomSelect
            label="Subject"
            value={planSubjectId}
            onChange={onPlanSubjectIdChange}
            options={subjects.filter((s) => s.status !== 'archived').map((s) => ({ value: s.id, label: s.name }))}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <Input
              label="Planned Duration (Mins)"
              type="number"
              value={planMinutes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onPlanMinutesChange(e.target.value)}
              required
            />
            <Input
              label="Scheduled Time"
              placeholder="e.g. 03:00 PM"
              value={planTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onPlanTimeChange(e.target.value)}
            />
            <CustomSelect
              label="Priority"
              value={planPriority}
              onChange={(val) => onPlanPriorityChange(val as PlanPriority)}
              options={[
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' }
              ]}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button variant="ghost" type="button" onClick={onCloseAddPlanModal}>
              Cancel
            </Button>
            <Button variant="accent" type="submit" isLoading={isSubmitting}>
              Add to Queue
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
