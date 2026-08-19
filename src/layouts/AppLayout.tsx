import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { Sidebar } from '../components/layout/Sidebar/Sidebar';
import { AppHeader } from '../components/layout/AppHeader/AppHeader';
import { MobileNav } from '../components/layout/MobileNav/MobileNav';
import { AtmosphereCanvas } from '../components/layout/AtmosphereCanvas/AtmosphereCanvas';
import { CommandPalette } from '../components/layout/CommandPalette/CommandPalette';
import { OfflineBanner } from '../components/feedback/OfflineBanner/OfflineBanner';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { FocusProvider } from '../context/FocusContext';
import { isFocusRoute } from '../constants/navigation';
import { cn } from '../utils/classNames';
import './AppLayout.css';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isFocus = isFocusRoute(location.pathname);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useKeyboardShortcuts({
    onOpenCommandPalette: () => setIsCommandOpen(true),
    onNewNote: () => navigate('/app/notes?action=new'),
    onNewTask: () => navigate('/app/tasks?action=new'),
    onStartFocus: () => navigate('/app/focus')
  });

  return (
    <ProtectedRoute>
      <FocusProvider>
        <div className={cn('solis-app-shell', isFocus && 'solis-app-shell--focus')}>
          <AtmosphereCanvas intensity="subtle" />
          
          {!isFocus && <Sidebar />}

          <div className="solis-app-main-wrapper">
            <OfflineBanner />
            {!isFocus && <AppHeader onOpenSearch={() => setIsCommandOpen(true)} />}
            <main className={cn('solis-app-view', isFocus && 'solis-app-view--focus')}>
              <Outlet />
            </main>
          </div>

          {!isFocus && <MobileNav />}

          <CommandPalette
            isOpen={isCommandOpen}
            onClose={() => setIsCommandOpen(false)}
          />
        </div>
      </FocusProvider>
    </ProtectedRoute>
  );
};
