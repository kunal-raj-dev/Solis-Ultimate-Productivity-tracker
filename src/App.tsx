import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { MarketingLayout } from './layouts/MarketingLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AppLayout } from './layouts/AppLayout';
import { RouteFallback } from './components/feedback/RouteFallback/RouteFallback';
import { RouteErrorBoundary } from './components/feedback/RouteErrorBoundary';

// Route-level code splitting
const LandingPage = lazy(() => import('./features/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./features/auth/SignupPage').then(m => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('./features/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./features/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const TasksPage = lazy(() => import('./features/tasks/TasksPage').then(m => ({ default: m.TasksPage })));
const StudyPage = lazy(() => import('./features/study/StudyPage').then(m => ({ default: m.StudyPage })));
const FocusPage = lazy(() => import('./features/focus/FocusPage').then(m => ({ default: m.FocusPage })));
const HabitsPage = lazy(() => import('./features/habits/HabitsPage').then(m => ({ default: m.HabitsPage })));
const GoalsPage = lazy(() => import('./features/goals/GoalsPage').then(m => ({ default: m.GoalsPage })));
const AnalyticsPage = lazy(() => import('./features/analytics/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const NotesPage = lazy(() => import('./features/notes/NotesPage').then(m => ({ default: m.NotesPage })));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const WeeklyReviewPage = lazy(() => import('./features/review/WeeklyReviewPage').then(m => ({ default: m.WeeklyReviewPage })));
const GuideCenterRoute = lazy(() => import('./features/guides/GuideCenterRoute').then(m => ({ default: m.GuideCenterRoute })));
const RoomsPage = lazy(() => import('./features/rooms/RoomsPage').then(m => ({ default: m.RoomsPage })));
const ActiveRoomView = lazy(() => import('./features/rooms/ActiveRoomView').then(m => ({ default: m.ActiveRoomView })));

/**
 * Phase 0 (P0-08): per-route error containment. Every feature page is wrapped
 * in its own RouteErrorBoundary so a crash in one page is contained to that
 * page — the app shell, navigation and all other routes stay reachable.
 */
const bounded = (element: React.ReactNode) => <RouteErrorBoundary>{element}</RouteErrorBoundary>;

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<RootLayout />}>
            {/* Marketing Public Routes */}
            <Route element={<MarketingLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            {/* Authentication Routes */}
            <Route path="/auth" element={<AuthLayout />}>
              <Route path="login" element={bounded(<LoginPage />)} />
              <Route path="signup" element={bounded(<SignupPage />)} />
              <Route path="forgot-password" element={bounded(<ForgotPasswordPage />)} />
              <Route path="reset-password" element={bounded(<ResetPasswordPage />)} />
              <Route index element={<Navigate to="/auth/login" replace />} />
            </Route>

            {/* Main Application Shell Routes */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={bounded(<DashboardPage />)} />
              <Route path="today" element={bounded(<DashboardPage />)} />
              <Route path="tasks" element={bounded(<TasksPage />)} />
              <Route path="study" element={bounded(<StudyPage />)} />
              <Route path="focus" element={bounded(<FocusPage />)} />
              <Route path="habits" element={bounded(<HabitsPage />)} />
              <Route path="goals" element={bounded(<GoalsPage />)} />
              <Route path="analytics" element={bounded(<AnalyticsPage />)} />
              <Route path="notes" element={bounded(<NotesPage />)} />
              <Route path="review" element={bounded(<WeeklyReviewPage />)} />
              <Route path="rooms" element={bounded(<RoomsPage />)} />
              <Route path="rooms/:roomId" element={bounded(<ActiveRoomView />)} />
              <Route path="settings" element={bounded(<SettingsPage />)} />
              <Route path="guides" element={bounded(<GuideCenterRoute />)} />
              <Route path="guides/:guideId" element={bounded(<GuideCenterRoute />)} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
