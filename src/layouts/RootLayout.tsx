import React from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { DataProvider } from '../context/DataContext';
import { GuideProvider } from '../context/GuideContext';
import { ToastContainer } from '../components/feedback/Toast/ToastContainer';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary/ErrorBoundary';

export const RootLayout: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <ToastProvider>
              <GuideProvider>
                <Outlet />
                <ToastContainer />
              </GuideProvider>
            </ToastProvider>
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};
