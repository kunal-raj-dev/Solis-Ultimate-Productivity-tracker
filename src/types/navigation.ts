export type NavId =
  | 'dashboard'
  | 'tasks'
  | 'study'
  | 'focus'
  | 'habits'
  | 'goals'
  | 'analytics'
  | 'notes'
  | 'review'
  | 'settings'
  | 'guides';

export interface NavItemConfig {
  id: NavId;
  label: string;
  path: string;
  iconName: string;
  badge?: string | number;
  description?: string;
}

export interface NavSectionConfig {
  id: string;
  title?: string;
  items: NavItemConfig[];
}
