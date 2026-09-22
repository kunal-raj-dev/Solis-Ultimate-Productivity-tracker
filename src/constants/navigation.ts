import { NavSectionConfig, NavItemConfig } from '../types/navigation';

export const APP_NAVIGATION: NavSectionConfig[] = [
  {
    id: 'today',
    title: 'Today',
    items: [
      {
        id: 'dashboard',
        label: 'Today',
        path: '/app/dashboard',
        iconName: 'Compass',
        description: 'Daily operating system & intentional schedule'
      },
      {
        id: 'tasks',
        label: 'Tasks',
        path: '/app/tasks',
        iconName: 'CheckCircle2',
        description: 'Focused execution & task management'
      },
      {
        id: 'study',
        label: 'Study & Syllabus',
        path: '/app/study',
        iconName: 'BookOpen',
        description: 'Living syllabus & topic roadmap'
      },
      {
        id: 'focus',
        label: 'Focus Room',
        path: '/app/focus',
        iconName: 'Flame',
        description: 'Immersive distraction-free deep work timer'
      },
      {
        id: 'rooms',
        label: 'Study Rooms',
        path: '/app/rooms',
        iconName: 'Users',
        description: 'Synchronized collaborative focus pods'
      }
    ]
  },
  {
    id: 'knowledge',
    title: 'Knowledge',
    items: [
      {
        id: 'notes',
        label: 'Knowledge & Notes',
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
        label: 'Habits & Rituals',
        path: '/app/habits',
        iconName: 'Repeat',
        description: 'Daily consistency matrix & streak tracking'
      },
      {
        id: 'goals',
        label: 'Goals',
        path: '/app/goals',
        iconName: 'Target',
        description: 'Milestone progression trajectories'
      },
      {
        id: 'analytics',
        label: 'Analytics',
        path: '/app/analytics',
        iconName: 'BarChart3',
        description: 'Study velocity, trends & time distribution'
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
        label: 'Settings',
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
