/**
 * Global Keyboard Shortcut Hook for Solis
 * Listens for global shortcuts while safely ignoring keystrokes when the user is typing in form controls.
 */

import { useEffect } from 'react';

export interface ShortcutHandlers {
  onOpenCommandPalette: () => void;
  onToggleSidebar?: () => void;
  onNewNote?: () => void;
  onNewTask?: () => void;
  onStartFocus?: () => void;
  disabled?: boolean;
}

export function isTargetEditable(element: any): boolean {
  if (!element) return false;
  const tag = element.tagName ? String(element.tagName).toLowerCase() : '';
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    Boolean(element.isContentEditable) ||
    element.contentEditable === 'true'
  );
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    if (handlers.disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused = isTargetEditable(activeElement);

      // 1. Cmd+K / Ctrl+K or '/' (when not typing in input)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handlers.onOpenCommandPalette();
        return;
      }

      // 2. Cmd+\ / Ctrl+\: Toggle Sidebar Collapse
      if ((e.metaKey || e.ctrlKey) && (e.key === '\\' || e.code === 'Backslash')) {
        e.preventDefault();
        handlers.onToggleSidebar?.();
        return;
      }

      if (isInputFocused) {
        return; // Do not intercept single-key shortcuts when typing
      }

      if (e.key === '/') {
        e.preventDefault();
        handlers.onOpenCommandPalette();
        return;
      }

      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey && handlers.onNewNote) {
        e.preventDefault();
        handlers.onNewNote();
      } else if ((e.key.toLowerCase() === 't' || e.key.toLowerCase() === 'c') && !e.metaKey && !e.ctrlKey && !e.altKey && handlers.onNewTask) {
        e.preventDefault();
        handlers.onNewTask();
      } else if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey && !e.altKey && handlers.onStartFocus) {
        e.preventDefault();
        handlers.onStartFocus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
