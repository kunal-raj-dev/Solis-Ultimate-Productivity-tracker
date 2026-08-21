import { ActivationState, ActivationStep, NextBestAction } from '../types/activation';

const ACTIVATION_STORAGE_KEY_PREFIX = 'solis_activation_state_v1';
const ACTIVATION_STEPS_KEY_PREFIX = 'solis_activation_steps_v1';

function getStorageKey(prefix: string, userId?: string): string {
  return userId ? `${prefix}_${userId}` : prefix;
}

export function getActivationState(userId?: string): ActivationState {
  if (typeof window === 'undefined') return 'not_started';
  const val = localStorage.getItem(getStorageKey(ACTIVATION_STORAGE_KEY_PREFIX, userId));
  if (!val) return 'not_started';
  return val as ActivationState;
}

export function setActivationState(state: ActivationState, userId?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getStorageKey(ACTIVATION_STORAGE_KEY_PREFIX, userId), state);
}

export function getCompletedActivationSteps(userId?: string): string[] {
  if (typeof window === 'undefined') return [];
  const val = localStorage.getItem(getStorageKey(ACTIVATION_STEPS_KEY_PREFIX, userId));
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
}

export function markActivationStepCompleted(stepId: string, userId?: string): void {
  if (typeof window === 'undefined') return;
  const current = getCompletedActivationSteps(userId);
  if (!current.includes(stepId)) {
    const updated = [...current, stepId];
    localStorage.setItem(getStorageKey(ACTIVATION_STEPS_KEY_PREFIX, userId), JSON.stringify(updated));
  }
}

export function resetActivation(userId?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getStorageKey(ACTIVATION_STORAGE_KEY_PREFIX, userId));
  localStorage.removeItem(getStorageKey(ACTIVATION_STEPS_KEY_PREFIX, userId));
}

export interface WorkspaceEntityCounts {
  subjects: number;
  tasks: number;
  focusSessions: number;
  notes: number;
  habits?: number;
  goals?: number;
}

export function computeActivationSteps(counts: WorkspaceEntityCounts, manualCompleted: string[] = []): ActivationStep[] {
  return [
    {
      id: 'understand_loop',
      title: 'Understand the Solis Mental Model',
      description: 'The 5-stage loop: Decide → Do → Capture → Recall → Reflect.',
      targetPath: '/app/dashboard',
      isCompleted: manualCompleted.includes('understand_loop'),
      actionLabel: 'Review Model'
    },
    {
      id: 'create_subject',
      title: 'Create what you are learning',
      description: 'Establish your first Study Subject container.',
      targetPath: '/app/study?action=new',
      isCompleted: counts.subjects > 0 || manualCompleted.includes('create_subject'),
      actionLabel: counts.subjects > 0 ? 'View Subjects' : 'Add Subject'
    },
    {
      id: 'plan_task',
      title: 'Decide today\'s focal action',
      description: 'Create a meaningful task in Task Sanctuary.',
      targetPath: '/app/tasks?action=new',
      isCompleted: counts.tasks > 0 || manualCompleted.includes('plan_task'),
      actionLabel: counts.tasks > 0 ? 'View Tasks' : 'Create Task'
    },
    {
      id: 'start_focus',
      title: 'Run your first Focus session',
      description: 'Execute deep work inside Focus Sanctuary.',
      targetPath: '/app/focus',
      isCompleted: counts.focusSessions > 0 || manualCompleted.includes('start_focus'),
      actionLabel: counts.focusSessions > 0 ? 'View Sessions' : 'Start Focus'
    },
    {
      id: 'capture_knowledge',
      title: 'Capture your first synthesis note',
      description: 'Record an insight, lecture note, or reflection in Knowledge Studio.',
      targetPath: '/app/notes?action=new',
      isCompleted: counts.notes > 0 || manualCompleted.includes('capture_knowledge'),
      actionLabel: counts.notes > 0 ? 'View Notes' : 'Draft Note'
    }
  ];
}

export function calculateNextBestAction(counts: WorkspaceEntityCounts): NextBestAction {
  // Step 1: No subjects created yet
  if (counts.subjects === 0) {
    return {
      id: 'action_create_subject',
      title: 'Define what you are learning',
      description: 'Every task, note, and study session anchors to a Subject. Create your first subject to begin building your living syllabus.',
      actionLabel: 'Create First Subject',
      targetPath: '/app/study?action=new',
      iconName: 'BookOpen',
      reason: 'No study subjects established yet'
    };
  }

  // Step 2: Subject exists, but no tasks created
  if (counts.tasks === 0) {
    return {
      id: 'action_plan_task',
      title: 'Decide today\'s priority task',
      description: 'You have a subject container ready. Now define the single most important action you need to execute today.',
      actionLabel: 'Plan First Task',
      targetPath: '/app/tasks?action=new',
      iconName: 'CheckCircle2',
      reason: 'No planned tasks in your sanctuary'
    };
  }

  // Step 3: Tasks exist, but no focus sessions completed
  if (counts.focusSessions === 0) {
    return {
      id: 'action_start_focus',
      title: 'Enter Focus Sanctuary',
      description: 'Your task is ready. Launch a 25-minute distraction-free focus block with ambient soundscapes to build initial momentum.',
      actionLabel: 'Start First Focus Session',
      targetPath: '/app/focus',
      iconName: 'Flame',
      reason: 'First deep work block pending execution'
    };
  }

  // Step 4: Focus session completed, but no notes created
  if (counts.notes === 0) {
    return {
      id: 'action_capture_note',
      title: 'Synthesize what you learned',
      description: 'Turn your recent focus time into permanent knowledge. Capture your key takeaways or lecture notes in Knowledge Studio.',
      actionLabel: 'Draft First Note',
      targetPath: '/app/notes?action=new',
      iconName: 'FileText',
      reason: 'Session completed without intellectual synthesis'
    };
  }

  // Step 5: Advanced learner — Recommend weekly review or routine optimization
  return {
    id: 'action_continue_flow',
    title: 'Maintain your study rhythm',
    description: 'All core study loops are initialized. Continue time-blocking your day or run your Weekly Review calibration.',
    actionLabel: 'Continue Daily Flow',
    targetPath: '/app/dashboard',
    iconName: 'Compass',
    reason: 'Active study routine in progress'
  };
}
