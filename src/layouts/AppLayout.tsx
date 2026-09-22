import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { Sidebar } from '../components/layout/Sidebar/Sidebar';
import { AppHeader } from '../components/layout/AppHeader/AppHeader';
import { MobileNav } from '../components/layout/MobileNav/MobileNav';
import { AtmosphereCanvas } from '../components/layout/AtmosphereCanvas/AtmosphereCanvas';
import { CommandPalette } from '../components/layout/CommandPalette/CommandPalette';
import { AskSolisDrawer } from '../components/layout/AskSolisDrawer/AskSolisDrawer';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useCircadianCanvas } from '../hooks/useCircadianCanvas';
import { FocusProvider } from '../context/FocusContext';
import { MiniFocusPlayer } from '../components/layout/MiniFocusPlayer/MiniFocusPlayer';
import { isFocusRoute } from '../constants/navigation';
import { cn } from '../utils/classNames';
import './AppLayout.css';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isFocus = isFocusRoute(location.pathname);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isAskSolisOpen, setIsAskSolisOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('solis_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useCircadianCanvas();

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('solis_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const isTasksRoute = location.pathname.startsWith('/app/tasks');

  useKeyboardShortcuts({
    onOpenCommandPalette: () => setIsCommandOpen(true),
    onToggleSidebar: handleToggleSidebar,
    onNewNote: isTasksRoute ? undefined : () => navigate('/app/notes?action=new'),
    onNewTask: isTasksRoute ? undefined : () => navigate('/app/tasks?action=new'),
    onStartFocus: () => navigate('/app/focus')
  });

  return (
    <ProtectedRoute>
      <FocusProvider>
        <div className={cn('solis-app-shell', isFocus && 'solis-app-shell--focus')}>
          <AtmosphereCanvas intensity="subtle" />
          
          {!isFocus && (
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={handleToggleSidebar}
            />
          )}

          <div className="solis-app-main-wrapper">
            {!isFocus && <AppHeader onOpenSearch={() => setIsCommandOpen(true)} />}
            <main className={cn('solis-app-view', isFocus && 'solis-app-view--focus')}>
              <Outlet />
            </main>
          </div>

          {!isFocus && <MobileNav />}
          {!isFocus && <MiniFocusPlayer />}

          <CommandPalette
            isOpen={isCommandOpen}
            onClose={() => setIsCommandOpen(false)}
          />
          
          {/* Ask Solis FAB */}
          {!isFocus && (
            <button
              className="solis-ask-fab"
              onClick={() => setIsAskSolisOpen(true)}
              aria-label="Ask Solis Intelligence"
              title="Ask Solis (Chat & Search)"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
              </svg>
            </button>
          )}

          <AskSolisDrawer
            isOpen={isAskSolisOpen}
            onClose={() => setIsAskSolisOpen(false)}
          />
        </div>
      </FocusProvider>
    </ProtectedRoute>
  );
};
