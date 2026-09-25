import React, { useState, useEffect } from 'react';
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
import { dataService } from '../services/dataService';
import { getISODateString } from '../utils/date';
import { notificationService } from '../services/notifications/notification.service';
import { globalNotifiedStarts, globalNotifiedReviews } from '../hooks/useTimeBlockScheduler';
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

  // Global Time Block Monitor: ensures scheduled alerts fire across all views
  useEffect(() => {
    let isMounted = true;
    const checkTodaySchedule = async () => {
      try {
        const todayStr = getISODateString(new Date());
        const blocks = await dataService.tasks.getTimeBlocks(todayStr);
        if (!isMounted || !blocks || !blocks.length) return;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const nowTotalMins = currentHour * 60 + currentMinute;

        blocks.forEach((block) => {
          if (block.date !== todayStr) return;
          const blockKey = `${block.id}_${block.date}_${block.startHour}_${block.startMinute || 0}`;
          const totalStartMins = block.startHour * 60 + (block.startMinute || 0);
          const totalEndMins = totalStartMins + (block.durationMinutes || 60);
          const blockEndHour = Math.floor(totalEndMins / 60) % 24;

          const elapsedSinceStart = nowTotalMins - totalStartMins;
          if (elapsedSinceStart >= 0 && elapsedSinceStart <= 3 && block.status === 'planned') {
            if (!globalNotifiedStarts.has(blockKey)) {
              globalNotifiedStarts.add(blockKey);
              notificationService.notifyTimeBlockStart(block.taskTitle, block.durationMinutes);
            }
          }

          const elapsedSinceEnd = nowTotalMins - totalEndMins;
          if (elapsedSinceEnd >= 0 && elapsedSinceEnd <= 15 && (block.status === 'planned' || block.status === 'active')) {
            if (!globalNotifiedReviews.has(blockKey)) {
              globalNotifiedReviews.add(blockKey);
              notificationService.notifyHourReviewPrompt(blockEndHour, block.taskTitle);
            }
          }
        });
      } catch {
        // Silently skip background poll errors
      }
    };

    checkTodaySchedule();
    const interval = setInterval(checkTodaySchedule, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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
    onOpenAskSolis: () => setIsAskSolisOpen(true),
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
            {!isFocus && (
              <AppHeader
                onOpenSearch={() => setIsCommandOpen(true)}
                onOpenAskSolis={() => setIsAskSolisOpen(true)}
              />
            )}
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

          <AskSolisDrawer
            isOpen={isAskSolisOpen}
            onClose={() => setIsAskSolisOpen(false)}
          />
        </div>
      </FocusProvider>
    </ProtectedRoute>
  );
};
