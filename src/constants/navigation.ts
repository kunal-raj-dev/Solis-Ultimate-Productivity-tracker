import { NavSectionConfig, NavItemConfig } from '../types/navigation';

export const APP_NAVIGATION: NavSectionConfig[] = [
  {
    id: 'today',
    title: 'Today',
    items: [
      {
        id: 'dashboard',
        label: 'Daily Flow',
        path: '/app/dashboard',
        iconName: 'Compass',
        description: 'Context, momentum, and daily arrival'
      },
      {
        id: 'tasks',
        label: 'Task Sanctuary',
        path: '/app/tasks',
        iconName: 'CheckCircle2',
        description: 'Intentional decision surface'
      },
      {
        id: 'study',
        label: 'Study Studio',
        path: '/app/study',
        iconName: 'BookOpen',
        description: 'Living syllabus & topic roadmap'
      },
      {
        id: 'focus',
        label: 'Focus Sanctuary',
        path: '/app/focus',
        iconName: 'Flame',
        description: 'Immersive distraction-free room'
      }
    ]
  },
  {
    id: 'knowledge',
    title: 'Knowledge',
    items: [
      {
        id: 'notes',
        label: 'Knowledge Studio',
        path: '/app/notes',
        iconName: 'FileText',
        description: 'External memory & intellectual synthesis'
      }
    ]
  },
  {
    id: 'horizons',
    title: 'Horizons',
    items: [
      {
        id: 'habits',
        label: 'Rituals & Consistency',
        path: '/app/habits',
        iconName: 'Repeat',
        description: 'Daily consistency matrix'
      },
      {
        id: 'goals',
        label: 'Goal Horizons',
        path: '/app/goals',
        iconName: 'Target',
        description: 'Milestone progression trajectories'
      },
      {
        id: 'analytics',
        label: 'Cognitive Rhythm',
        path: '/app/analytics',
        iconName: 'BarChart3',
        description: 'Study velocity & intensity constellation'
      },
      {
        id: 'review',
        label: 'Weekly Review',
        path: '/app/review',
        iconName: 'Sparkles',
        description: '5-pillar reflection & calibration ritual'
      }
    ]
  },
  {
    id: 'system',
    title: 'System',
    items: [
      {
        id: 'settings',
        label: 'Preferences',
        path: '/app/settings',
        iconName: 'Sliders',
        description: 'Study parameters & learner profile'
      }
    ]
  }
];

export const MOBILE_NAVIGATION: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Overview',
    path: '/app/dashboard',
    iconName: 'Compass'
  },
  {
    id: 'tasks',
    label: 'Tasks',
    path: '/app/tasks',
    iconName: 'CheckCircle2'
  },
  {
    id: 'study',
    label: 'Study',
    path: '/app/study',
    iconName: 'BookOpen'
  },
  {
    id: 'focus',
    label: 'Focus',
    path: '/app/focus',
    iconName: 'Flame'
  },
  {
    id: 'notes',
    label: 'Notes',
    path: '/app/notes',
    iconName: 'FileText'
  }
];

export const MARKETING_NAVIGATION = [
  { label: 'Philosophy', href: '/#philosophy' },
  { label: 'Experience', href: '/#experience' },
  { label: 'Sanctuary', href: '/#sanctuary' },
  { label: 'Manifesto', href: '/#manifesto' }
];

export function isFocusRoute(pathname: string): boolean {
  return pathname === '/app/focus' || pathname.startsWith('/app/focus/');
}

export function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith('/auth');
}

export function isMarketingRoute(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/#');
}
