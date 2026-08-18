/**
 * Solis Intelligent Route Prefetching
 * Preloads chunk bundles when user hovers or focuses on navigation links.
 */

const prefetchMap: Record<string, () => Promise<any>> = {
  dashboard: () => import('../features/dashboard/DashboardPage'),
  tasks: () => import('../features/tasks/TasksPage'),
  study: () => import('../features/study/StudyPage'),
  focus: () => import('../features/focus/FocusPage'),
  habits: () => import('../features/habits/HabitsPage'),
  goals: () => import('../features/goals/GoalsPage'),
  analytics: () => import('../features/analytics/AnalyticsPage'),
  notes: () => import('../features/notes/NotesPage'),
  settings: () => import('../features/settings/SettingsPage'),
  login: () => import('../features/auth/LoginPage'),
  signup: () => import('../features/auth/SignupPage')
};

const prefetchedSet = new Set<string>();

export function prefetchRoute(routeName: string): void {
  const key = routeName.toLowerCase().replace(/^\/app\//, '').replace(/^\/auth\//, '').replace(/^\//, '') || 'dashboard';
  if (prefetchedSet.has(key)) return;

  const importer = prefetchMap[key];
  if (importer) {
    prefetchedSet.add(key);
    importer().catch(() => {
      prefetchedSet.delete(key);
    });
  }
}
