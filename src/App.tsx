import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { MarketingLayout } from './layouts/MarketingLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AppLayout } from './layouts/AppLayout';
import { RouteFallback } from './components/feedback/RouteFallback/RouteFallback';

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
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route index element={<Navigate to="/auth/login" replace />} />
            </Route>

            {/* Main Application Shell Routes */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="study" element={<StudyPage />} />
              <Route path="focus" element={<FocusPage />} />
              <Route path="habits" element={<HabitsPage />} />
              <Route path="goals" element={<GoalsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="review" element={<WeeklyReviewPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="guides" element={<GuideCenterRoute />} />
              <Route path="guides/:guideId" element={<GuideCenterRoute />} />
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
