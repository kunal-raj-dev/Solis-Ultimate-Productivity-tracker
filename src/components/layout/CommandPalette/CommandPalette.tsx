import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  CheckSquare,
  FileText,
  Clock,
  Compass,
  Moon,
  Sun,
  Flame,
  ArrowRight,
  Plus
} from 'lucide-react';
import {
  searchWorkspace,
  DEFAULT_NAVIGATION_COMMANDS,
  CommandItem,
  WorkspaceDataSources
} from '../../../utils/commandSearch';
import { useTheme } from '../../../context/ThemeContext';
import { dataService } from '../../../services/dataService';
import './CommandPalette.css';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sources, setSources] = useState<WorkspaceDataSources>({});

  // Fetch workspace data on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      Promise.all([
        dataService.tasks.getTasks().catch(() => []),
        dataService.notes.getNotes().catch(() => []),
        dataService.study.getSubjects().catch(() => []),
        dataService.goals.getGoals().catch(() => [])
      ]).then(([tasks, notes, subjects, goals]) => {
        setSources({ tasks, notes, subjects, goals });
      });
    }
  }, [isOpen]);

  const quickActions: CommandItem[] = [
    {
      id: 'action-new-task',
      title: 'Create New Task',
      subtitle: 'Add to today or upcoming schedule',
      type: 'action',
      shortcut: 'T',
      actionUrl: '/app/tasks?action=new'
    },
    {
      id: 'action-new-note',
      title: 'Draft Knowledge Note',
      subtitle: 'Capture a concept, summary, or reflection',
      type: 'action',
      shortcut: 'N',
      actionUrl: '/app/notes?action=new'
    },
    {
      id: 'action-start-focus',
      title: 'Start Focus Sanctuary Block',
      subtitle: 'Enter deep flow mode with ambient sound',
      type: 'action',
      shortcut: 'F',
      actionUrl: '/app/focus'
    },
    {
      id: 'action-log-study',
      title: 'Log Study Session',
      subtitle: 'Record subject, topics, and duration',
      type: 'action',
      shortcut: 'S',
      actionUrl: '/app/study?action=log'
    },
    {
      id: 'action-toggle-theme',
      title: theme === 'dark' ? 'Switch to Warm Ivory (Day)' : 'Switch to Deep Charcoal (Night)',
      subtitle: 'Toggle global atmosphere theme',
      type: 'action',
      shortcut: 'M',
      onSelect: () => toggleTheme()
    }
  ];

  const searchResults = query.trim()
    ? searchWorkspace(query, sources)
    : [];

  const itemsToDisplay: CommandItem[] = query.trim()
    ? searchResults
    : [...quickActions, ...DEFAULT_NAVIGATION_COMMANDS];

  const handleSelect = useCallback(
    (item: CommandItem) => {
      onClose();
      if (item.onSelect) {
        item.onSelect();
      } else if (item.actionUrl) {
        navigate(item.actionUrl);
      }
    },
    [navigate, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, itemsToDisplay.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + itemsToDisplay.length) % Math.max(1, itemsToDisplay.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = itemsToDisplay[selectedIndex];
        if (selected) {
          handleSelect(selected);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [itemsToDisplay, selectedIndex, handleSelect, onClose]
  );

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const renderIcon = (item: CommandItem) => {
    switch (item.type) {
      case 'task':
        return <CheckSquare size={16} color="var(--color-emerald-500)" />;
      case 'note':
        return <FileText size={16} color="var(--color-lavender-500)" />;
      case 'subject':
      case 'topic':
        return <BookOpen size={16} color="var(--color-coral-500)" />;
      case 'goal':
        return <Compass size={16} color="var(--color-amber-500)" />;
      case 'action':
        if (item.id === 'action-toggle-theme') {
          return theme === 'dark' ? <Sun size={16} color="var(--color-amber-500)" /> : <Moon size={16} color="var(--color-coral-500)" />;
        }
        return <Plus size={16} color="var(--color-coral-500)" />;
      case 'navigation':
        return <ArrowRight size={16} color="var(--text-secondary)" />;
      default:
        return <Flame size={16} color="var(--color-coral-500)" />;
    }
  };

  return (
    <div
      className="solis-command-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="solis-command-dialog">
        {/* Search Input Bar */}
        <div className="solis-command-input-wrapper">
          <Search size={18} className="solis-command-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="solis-command-input"
            placeholder="Type a command or search workspace... (Cmd+K)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="solis-command-esc-kbd" onClick={onClose}>ESC</kbd>
        </div>

        {/* Results / Commands List */}
        <div ref={listRef} className="solis-command-list" role="listbox">
          {itemsToDisplay.length === 0 ? (
            <div className="solis-command-empty">
              <Clock size={24} style={{ opacity: 0.5, marginBottom: '8px' }} />
              <p>No matching commands or workspace records found for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            itemsToDisplay.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`solis-command-item ${isSelected ? 'solis-command-item--selected' : ''}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="solis-command-item__icon-box">
                    {renderIcon(item)}
                  </div>
                  <div className="solis-command-item__text">
                    <span className="solis-command-item__title">{item.title}</span>
                    {item.subtitle && (
                      <span className="solis-command-item__subtitle">{item.subtitle}</span>
                    )}
                  </div>
                  {item.badge && (
                    <span className="solis-command-item__badge">{item.badge}</span>
                  )}
                  {item.shortcut && (
                    <kbd className="solis-command-item__shortcut">{item.shortcut}</kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="solis-command-footer">
          <span><kbd>&uarr;</kbd> <kbd>&darr;</kbd> Navigate</span>
          <span><kbd>&crarr;</kbd> Select</span>
          <span><kbd>ESC</kbd> Close</span>
        </div>
      </div>
    </div>
  );
};
