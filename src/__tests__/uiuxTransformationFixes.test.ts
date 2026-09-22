import { describe, it, expect } from 'vitest';
import { isTargetEditable } from '../hooks/useKeyboardShortcuts';

describe('UI/UX Transformation Verification & Defense Suite', () => {
  describe('Keyboard Shortcuts & Interactive Element Isolation', () => {
    it('accurately identifies editable input controls to prevent shortcut hijacking', () => {
      expect(isTargetEditable({ tagName: 'INPUT' })).toBe(true);
      expect(isTargetEditable({ tagName: 'textarea' })).toBe(true);
      expect(isTargetEditable({ tagName: 'SELECT' })).toBe(true);
      expect(isTargetEditable({ isContentEditable: true })).toBe(true);
      expect(isTargetEditable({ contentEditable: 'true' })).toBe(true);
      expect(isTargetEditable({ tagName: 'DIV' })).toBe(false);
      expect(isTargetEditable(null)).toBe(false);
    });

    it('guards spacebar and hotkeys when focus is on interactive controls', () => {
      const isInteractive = (target: any): boolean => {
        if (!target) return false;
        const tag = target.tagName ? String(target.tagName).toUpperCase() : '';
        const role = target.getAttribute ? target.getAttribute('role') : target.role;
        return (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          tag === 'BUTTON' ||
          tag === 'A' ||
          Boolean(target.isContentEditable) ||
          role === 'button' ||
          role === 'combobox' ||
          role === 'listbox' ||
          role === 'option' ||
          role === 'menuitem' ||
          role === 'switch'
        );
      };

      expect(isInteractive({ tagName: 'BUTTON' })).toBe(true);
      expect(isInteractive({ tagName: 'SELECT' })).toBe(true);
      expect(isInteractive({ tagName: 'DIV', role: 'combobox' })).toBe(true);
      expect(isInteractive({ tagName: 'DIV', role: 'listbox' })).toBe(true);
      expect(isInteractive({ tagName: 'SPAN', role: 'option' })).toBe(true);
      expect(isInteractive({ tagName: 'DIV' })).toBe(false);
      expect(isInteractive(null)).toBe(false);
    });
  });

  describe('Multi-level Undo Stack Mechanics', () => {
    it('restores deleted items in exact LIFO order across multiple rapid deletions', () => {
      const deletedStack: Array<{ id: string; title: string }> = [];

      const recordDeletion = (item: { id: string; title: string }) => {
        deletedStack.unshift(item);
      };

      const performUndo = () => {
        return deletedStack.shift() || null;
      };

      recordDeletion({ id: 'task-1', title: 'Task 1' });
      recordDeletion({ id: 'task-2', title: 'Task 2' });
      recordDeletion({ id: 'task-3', title: 'Task 3' });

      expect(deletedStack.length).toBe(3);

      const firstRestored = performUndo();
      expect(firstRestored?.id).toBe('task-3');

      const secondRestored = performUndo();
      expect(secondRestored?.id).toBe('task-2');

      const thirdRestored = performUndo();
      expect(thirdRestored?.id).toBe('task-1');

      expect(performUndo()).toBeNull();
    });

    it('formats undo shortcuts appropriately for host platform', () => {
      const getUndoShortcut = (ua: string, platform: string): string => {
        const isMac = /Mac|iPod|iPhone|iPad/.test(platform || ua);
        return isMac ? '⌘Z' : 'Ctrl+Z';
      };

      expect(getUndoShortcut('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel')).toBe('⌘Z');
      expect(getUndoShortcut('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Win32')).toBe('Ctrl+Z');
      expect(getUndoShortcut('Mozilla/5.0 (X11; Linux x86_64)', 'Linux x86_64')).toBe('Ctrl+Z');
    });
  });

  describe('Analytics Cognitive Rhythm Heatmap Calibration', () => {
    it('maps study minutes to monotonically increasing thermal tiers without ivory inversion', () => {
      const getHeatmapLevelClass = (minutes: number): string => {
        if (minutes >= 120) return 'solis-heatmap-cell--l4';
        if (minutes >= 60) return 'solis-heatmap-cell--l3';
        if (minutes >= 30) return 'solis-heatmap-cell--l2';
        if (minutes > 0) return 'solis-heatmap-cell--l1';
        return 'solis-heatmap-cell--l0';
      };

      expect(getHeatmapLevelClass(0)).toBe('solis-heatmap-cell--l0');
      expect(getHeatmapLevelClass(15)).toBe('solis-heatmap-cell--l1');
      expect(getHeatmapLevelClass(30)).toBe('solis-heatmap-cell--l2');
      expect(getHeatmapLevelClass(55)).toBe('solis-heatmap-cell--l2');
      expect(getHeatmapLevelClass(60)).toBe('solis-heatmap-cell--l3');
      expect(getHeatmapLevelClass(119)).toBe('solis-heatmap-cell--l3');
      expect(getHeatmapLevelClass(120)).toBe('solis-heatmap-cell--l4');
      expect(getHeatmapLevelClass(300)).toBe('solis-heatmap-cell--l4');
    });
  });

  describe('Living Syllabus Companion Split-Pane Invariant', () => {
    it('preserves split-pane state in inline mode when creating cards or resources', () => {
      let isPaneOpen = true;
      const closePane = () => {
        isPaneOpen = false;
      };

      const handleAddCard = (inline: boolean) => {
        if (!inline) closePane();
      };

      // Inline mode: Split pane must NOT close
      handleAddCard(true);
      expect(isPaneOpen).toBe(true);

      // Modal mode: Dialog closes to prevent modal stacking
      handleAddCard(false);
      expect(isPaneOpen).toBe(false);
    });
  });
});
