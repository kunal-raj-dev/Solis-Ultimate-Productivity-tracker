export type ActivationState =
  | 'not_started'
  | 'welcome'
  | 'mental_model'
  | 'checklist'
  | 'completed'
  | 'dismissed';

export interface ActivationStep {
  id: 'understand_loop' | 'create_subject' | 'plan_task' | 'start_focus' | 'capture_knowledge';
  title: string;
  description: string;
  targetPath: string;
  isCompleted: boolean;
  actionLabel: string;
}

export interface NextBestAction {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  targetPath: string;
  iconName: string;
  reason: string;
}
