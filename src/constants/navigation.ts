import { NavSectionConfig, NavItemConfig } from '../types/navigation';

export const APP_NAVIGATION: NavSectionConfig[] = [
  {
    id: 'today',
    title: 'Daily Dashboard',
    items: [
      {
        id: 'dashboard',
        label: 'Today',
        path: '/app/dashboard',
        iconName: 'Compass',
        description: 'Your daily study plan & schedule at a glance'
      },
      {
        id: 'tasks',
        label: 'Tasks',
        path: '/app/tasks',
        iconName: 'CheckCircle2',
        description: 'Your to-do list & study tasks for today'
      },
      {
        id: 'study',
        label: 'Study & Syllabus',
        path: '/app/study',
        iconName: 'BookOpen',
        description: 'Your subjects, exam goals & topic checklists'
      },
      {
        id: 'focus',
        label: 'Focus Room',
        path: '/app/focus',
        iconName: 'Flame',
        description: 'Distraction-free 25m or 50m study timer'
      },
      {
        id: 'rooms',
        label: 'Study Rooms',
        path: '/app/rooms',
        iconName: 'Users',
        description: 'Study together with friends in quiet rooms'
      }
    ]
  },
  {
    id: 'knowledge',
    title: 'Notes & Learning',
    items: [
      {
        id: 'notes',
        label: 'Knowledge & Notes',
        path: '/app/notes',
        iconName: 'FileText',
        description: 'Save your study notes, summaries & ideas'
      }
    ]
  },
  {
    id: 'horizons',
    title: 'Progress & Goals',
    items: [
      {
        id: 'habits',
        label: 'Habits & Rituals',
        path: '/app/habits',
        iconName: 'Repeat',
        description: 'Build daily study habits & track your streaks'
      },
      {
        id: 'goals',
        label: 'Goals',
        path: '/app/goals',
        iconName: 'Target',
        description: 'Set exam targets & long-term study goals'
      },
      {
        id: 'analytics',
        label: 'Analytics',
        path: '/app/analytics',
        iconName: 'BarChart3',
        description: 'See how much time you studied & your brain balance'
      },
      {
        id: 'review',
        label: 'Weekly Review',
        path: '/app/review',
        iconName: 'Sparkles',
        description: '5-minute weekly reflection on your progress'
      }
    ]
  },
  {
    id: 'system',
    title: 'Account & Settings',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        path: '/app/settings',
        iconName: 'Sliders',
        description: 'Customize theme, notifications & preferences'
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
