import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  Send,
  Copy,
  Check,
  Users,
  MessageSquare,
  ArrowLeft,
  Radio,
  Trash2,
  Shield,
  Clock,
  Sparkles,
  Coffee,
  Loader2,
  WifiOff,
  Target,
  Brain,
  KeyRound,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Circle,
  Plus,
  Minus,
  ListTodo,
  ChevronDown,
  Crown,
  X
} from 'lucide-react';
import { useStudyRoom } from '../../hooks/useStudyRoom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { ConfirmationDialog } from '../../components/feedback/ConfirmationDialog/ConfirmationDialog';
import { ParticipantStatus } from '../../types/room';
import { Task } from '../../types/task';
import { SoundscapeType } from '../../types/focus';
import { formatSecondsToTimer } from '../../utils/formatters';
import { RoomReflectionModal } from './RoomReflectionModal';
import { soundscapeEngine, SOUNDSCAPE_PRESETS } from '../../utils/focus/soundscapeEngine';
import dataService from '../../services/dataService';
import './ActiveRoomView.css';

const DURATION_PRESETS = [
  { label: '15m Sprint', seconds: 900 },
  { label: '25m Pomodoro', seconds: 1500 },
  { label: '45m Deep Flow', seconds: 2700 },
  { label: '50m Standard', seconds: 3000 },
  { label: '60m Marathon', seconds: 3600 }
];

const REACTION_EMOJIS = [
  { emoji: '👏', label: 'Cheer' },
  { emoji: '🧠', label: 'Big Brain' },
  { emoji: '⚡', label: 'High Voltage' },
  { emoji: '☕', label: 'Coffee Break' },
  { emoji: '🔥', label: 'On Fire' },
  { emoji: '🎯', label: 'Target Locked' }
];

interface FloatingReaction {
  id: string;
  emoji: string;
  leftPercent: number;
}

export const ActiveRoomView: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const {
    room,
    presenceUsers,
    messages,
    events,
    remainingSeconds,
    progressPercent,
    isHost,
    isLoading,
    isReconnecting,
    error,
    promotedToHost,
    startTimer,
    pauseTimer,
    resetTimer,
    startBreak,
    endBreak,
    updateStatus,
    sendMessage,
    sendTimelineEvent,
    leaveRoom,
    deleteRoom
  } = useStudyRoom(roomId);

  // Navigation & UI states
  const [activeTab, setActiveTab] = useState<'presence' | 'chat' | 'timeline'>('presence');
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [myStatus, setMyStatus] = useState<ParticipantStatus>('focusing');
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  // Plan §6.2: calm, dismissible handover notice after host failover.
  const [showHostFailoverNotice, setShowHostFailoverNotice] = useState(true);

  // A dismissed notice must not suppress the banner for a failover in a
  // different room later in the same mounted session.
  useEffect(() => {
    setShowHostFailoverNotice(true);
  }, [roomId]);

  // Personal Outcome / Task Attachment
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(() => {
    return (roomId && localStorage.getItem(`solis_room_task_${roomId}`)) || '';
  });
  const [personalIntention, setPersonalIntention] = useState<string>(() => {
    return (roomId && localStorage.getItem(`solis_room_intention_${roomId}`)) || '';
  });
  const [isEditingIntention, setIsEditingIntention] = useState(false);
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false);

  // Soundscape state
  const [activeSoundscape, setActiveSoundscape] = useState<SoundscapeType>('none');
  const [soundscapeVolume, setSoundscapeVolume] = useState<number>(0.5);
  const [isSoundscapeOpen, setIsSoundscapeOpen] = useState(false);

  // Floating Reactions
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const lastProcessedEventIdRef = useRef<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const soundscapeMenuRef = useRef<HTMLDivElement>(null);
  const taskMenuRef = useRef<HTMLDivElement>(null);

  // Load user's tasks
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const fetchedTasks = await dataService.tasks.getTasks();
        setTasks(fetchedTasks);
      } catch (err) {
        console.warn('Could not fetch tasks for study room:', err);
      }
    };
    loadTasks();
  }, []);

  // Cleanup soundscape on unmount
  useEffect(() => {
    return () => {
      soundscapeEngine.stop();
    };
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (soundscapeMenuRef.current && !soundscapeMenuRef.current.contains(e.target as Node)) {
        setIsSoundscapeOpen(false);
      }
      if (taskMenuRef.current && !taskMenuRef.current.contains(e.target as Node)) {
        setIsTaskDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll chat to latest
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Sync floating reactions from live incoming timeline events
  useEffect(() => {
    if (events.length === 0) return;
    const latest = events[events.length - 1];
    if (latest.id !== lastProcessedEventIdRef.current) {
      lastProcessedEventIdRef.current = latest.id;
      if (latest.eventType === 'reaction' && latest.message) {
        triggerLocalFloatingReaction(latest.message);
      }
    }
  }, [events]);

  const triggerLocalFloatingReaction = useCallback((emoji: string) => {
    const newReaction: FloatingReaction = {
      id: `${Date.now()}_${Math.random()}`,
      emoji,
      leftPercent: 20 + Math.random() * 60
    };
    setFloatingReactions((prev) => [...prev.slice(-12), newReaction]);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2800);
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      addToast({
        title: 'Room Link Copied',
        description: 'Share with peers to collaborate in this sanctuary.',
        type: 'success'
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      addToast({
        title: 'Clipboard error',
        description: 'Could not copy URL to clipboard.',
        type: 'error'
      });
    }
  };

  const handleCopyCode = async () => {
    if (!room?.roomCode) return;
    try {
      await navigator.clipboard.writeText(room.roomCode);
      addToast({
        title: 'Room Code Copied',
        description: `#${room.roomCode} copied. Peers can enter via Room Code on the directory.`,
        type: 'success'
      });
    } catch {
      addToast({ title: 'Clipboard error', type: 'error' });
    }
  };

  const handleSaveIntention = () => {
    if (roomId) {
      localStorage.setItem(`solis_room_intention_${roomId}`, personalIntention.trim());
    }
    setIsEditingIntention(false);
    if (personalIntention.trim()) {
      sendTimelineEvent('reaction', `Set intention: "${personalIntention.trim()}"`);
      addToast({
        title: 'Focus Intention Committed',
        description: `Working on: "${personalIntention.trim()}"`,
        type: 'success'
      });
    }
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTaskId(task.id);
    if (roomId) {
      localStorage.setItem(`solis_room_task_${roomId}`, task.id);
    }
    setIsTaskDropdownOpen(false);
    sendTimelineEvent('reaction', `Focused on task: "${task.title}"`);
    addToast({
      title: 'Task Linked to Pod',
      description: `Targeting: ${task.title}`,
      type: 'info'
    });
  };

  const handleToggleTaskCompleted = async () => {
    if (!selectedTaskId) return;
    const task = tasks.find((t) => t.id === selectedTaskId);
    if (!task) return;

    const newCompleted = task.status !== 'completed';
    try {
      const updated = await dataService.tasks.updateTask(task.id, {
        status: newCompleted ? 'completed' : 'todo',
        completedAt: newCompleted ? new Date().toISOString() : undefined
      });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

      if (newCompleted) {
        triggerLocalFloatingReaction('🎯');
        await sendTimelineEvent('reaction', `Completed task: "${task.title}" 🎉`);
        addToast({
          title: 'Task Completed! 🏆',
          description: `Great focus sprint! "${task.title}" is marked complete.`,
          type: 'success'
        });
      }
    } catch (err: any) {
      addToast({
        title: 'Task Update Failed',
        description: err?.message || 'Could not update task status.',
        type: 'error'
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      setIsSendingMessage(true);
      const text = chatInput;
      setChatInput('');
      await sendMessage(text);
    } catch (err: any) {
      addToast({
        title: 'Message error',
        description: err?.message || 'Could not send chat message.',
        type: 'error'
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleQuickChatPrompt = (prompt: string) => {
    sendMessage(prompt).catch((err) => {
      addToast({ title: 'Chat error', description: err?.message, type: 'error' });
    });
  };

  const handleStatusChange = (status: ParticipantStatus) => {
    setMyStatus(status);
    updateStatus(status);
  };

  const handleToggleBreak = async () => {
    if (room?.isBreak) {
      await endBreak();
      addToast({
        title: 'Intermission Concluded',
        description: 'Deep focus flow resumed.',
        type: 'info'
      });
    } else {
      await startBreak(room?.breakDurationSeconds || 300);
      addToast({
        title: 'Intermission Started',
        description: `${Math.round((room?.breakDurationSeconds || 300) / 60)}m rest break underway.`,
        type: 'info'
      });
    }
  };

  const handleSendReaction = async (emoji: string) => {
    triggerLocalFloatingReaction(emoji);
    try {
      await sendTimelineEvent('reaction', emoji);
    } catch {
      // ignore
    }
  };

  const handleToggleSoundscape = (type: SoundscapeType) => {
    if (activeSoundscape === type) {
      soundscapeEngine.stop();
      setActiveSoundscape('none');
    } else {
      soundscapeEngine.setSoundscape(type, soundscapeVolume);
      setActiveSoundscape(type);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setSoundscapeVolume(newVolume);
    soundscapeEngine.setVolume(newVolume);
  };

  const handleAdjustDuration = async (deltaMinutes: number) => {
    if (!isHost || !room) return;
    const currentDuration = room.targetDurationSeconds || 1500;
    const newDuration = Math.max(300, Math.min(7200, currentDuration + deltaMinutes * 60));
    await resetTimer(newDuration);
    addToast({
      title: 'Target Duration Adjusted',
      description: `Pod session target set to ${Math.round(newDuration / 60)} minutes.`,
      type: 'info'
    });
  };

  const handleCloseSanctuary = async () => {
    try {
      await deleteRoom();
      try {
        localStorage.removeItem(`solis_created_room_${roomId}`);
      } catch {}
      addToast({
        title: 'Sanctuary Disbanded',
        description: 'The study room has been securely closed.',
        type: 'info'
      });
      navigate('/app/rooms');
    } catch (err: any) {
      addToast({
        title: 'Action Failed',
        description: err?.message || 'Failed to disband study room.',
        type: 'error'
      });
    }
  };

  const activeTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId);
  }, [tasks, selectedTaskId]);

  if (isLoading) {
    return (
      <div className="solis-room-loading-screen">
        <Loader2 size={40} className="solis-spin" style={{ color: 'var(--color-coral-500, #ff6b4a)' }} />
        <p className="solis-room-loading-text">Connecting to Study Sanctuary...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="solis-room-error-screen">
        <Shield size={52} color="var(--color-rose-500, #e11d48)" style={{ marginBottom: '16px' }} />
        <h2 className="solis-room-error-title">{error || 'Sanctuary Inaccessible'}</h2>
        <p className="solis-room-error-desc">
          This study sanctuary may have ended or you do not have permission to access it.
        </p>
        <Button variant="primary" onClick={() => navigate('/app/rooms')} leftIcon={<ArrowLeft size={16} />}>
          Return to Study Rooms
        </Button>
      </div>
    );
  }

  const isCompleted = room.timerState === 'running' && remainingSeconds === 0;
  const targetMins = Math.round((room.targetDurationSeconds || 1500) / 60);

  return (
    <div className={`solis-active-room ${isZenMode ? 'solis-active-room--zen' : ''}`}>
      {/* Floating Emojis Reaction Layer */}
      <div className="solis-room-floating-reactions-container">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="solis-room-floating-emoji"
            style={{ left: `${r.leftPercent}%` }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Atmospheric Topbar */}
      <header className="solis-active-room__topbar">
        <div className="solis-active-room__topbar-left">
          <button
            type="button"
            className="solis-active-room__back-btn"
            onClick={async () => {
              await leaveRoom();
              navigate('/app/rooms');
            }}
            title="Leave room and return to sanctuary directory"
          >
            <ArrowLeft size={14} />
            <span>Directory</span>
          </button>

          <div className="solis-active-room__title-area">
            <h1 className="solis-active-room__title">
              <span className="solis-active-room__live-indicator">
                <Radio size={16} />
              </span>
              <span>{room.title}</span>
              {room.roomCode && (
                <button
                  type="button"
                  className="solis-room-header__code-chip"
                  onClick={handleCopyCode}
                  title="Click to copy 6-digit Room Code"
                >
                  <KeyRound size={11} />
                  <span>#{room.roomCode}</span>
                </button>
              )}
            </h1>
            <div className="solis-active-room__meta-row">
              <span className="solis-active-room__host-tag">
                Host: <strong>{room.hostName || 'Solis Scholar'}</strong> {isHost && <span className="solis-host-badge">👑 (You)</span>}
              </span>
              {room.subjectName && (
                <span className="solis-active-room__meta-pill">{room.subjectName}</span>
              )}
              {room.sessionType && (
                <span className="solis-active-room__meta-pill">
                  {room.sessionType.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="solis-active-room__topbar-right">
          {/* Ambient Soundscapes Quick Control */}
          <div className="solis-soundscape-dropdown-wrapper" ref={soundscapeMenuRef}>
            <button
              type="button"
              className={`solis-soundscape-btn ${activeSoundscape !== 'none' ? 'solis-soundscape-btn--active' : ''}`}
              onClick={() => setIsSoundscapeOpen(!isSoundscapeOpen)}
              title="Ambient Soundscape Generator"
            >
              {activeSoundscape !== 'none' ? (
                <>
                  <Volume2 size={15} />
                  <div className="solis-soundscape-equalizer">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="solis-soundscape-btn-label">
                    {SOUNDSCAPE_PRESETS.find((p) => p.id === activeSoundscape)?.label.split(' ')[0]}
                  </span>
                </>
              ) : (
                <>
                  <VolumeX size={15} />
                  <span className="solis-soundscape-btn-label">Soundscape</span>
                </>
              )}
            </button>

            {isSoundscapeOpen && (
              <div className="solis-soundscape-popover">
                <div className="solis-soundscape-popover__header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Volume2 size={16} color="var(--color-coral-500)" />
                    <span style={{ fontWeight: 700, fontSize: 'var(--text-body-sm)' }}>
                      Ambient Soundscapes
                    </span>
                  </div>
                  {activeSoundscape !== 'none' && (
                    <button
                      type="button"
                      className="solis-soundscape-stop-btn"
                      onClick={() => handleToggleSoundscape('none')}
                    >
                      Mute
                    </button>
                  )}
                </div>

                <div className="solis-soundscape-presets-list">
                  {SOUNDSCAPE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`solis-soundscape-item ${
                        activeSoundscape === preset.id ? 'solis-soundscape-item--active' : ''
                      }`}
                      onClick={() => handleToggleSoundscape(preset.id)}
                    >
                      <div>
                        <div className="solis-soundscape-item-title">{preset.label}</div>
                        <div className="solis-soundscape-item-desc">{preset.description}</div>
                      </div>
                      {activeSoundscape === preset.id && <Check size={14} color="var(--color-coral-500)" />}
                    </button>
                  ))}
                </div>

                {activeSoundscape !== 'none' && (
                  <div className="solis-soundscape-volume-row">
                    <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                      Volume: {Math.round(soundscapeVolume * 100)}%
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={soundscapeVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="solis-soundscape-slider"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sync Status Badge */}
          {isReconnecting ? (
            <span className="solis-active-room__sync-pill solis-active-room__sync-pill--reconnecting">
              <WifiOff size={11} />
              Reconnecting
            </span>
          ) : (
            <span className="solis-active-room__sync-pill solis-active-room__sync-pill--live">
              <span className="solis-rooms-header__badge-dot" />
              Live Sync
            </span>
          )}

          {/* Zen Fullscreen Mode */}
          <button
            type="button"
            className="solis-active-room__icon-btn"
            onClick={() => setIsZenMode(!isZenMode)}
            title={isZenMode ? 'Exit Zen Mode' : 'Enter Zen Fullscreen Focus'}
          >
            {isZenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Share Link */}
          <Button
            variant="subtle"
            size="sm"
            onClick={handleCopyLink}
            leftIcon={isCopied ? <Check size={14} /> : <Copy size={14} />}
          >
            {isCopied ? 'Copied' : 'Share'}
          </Button>

          {/* Reflect & Log */}
          <Button
            variant="subtle"
            size="sm"
            onClick={() => setIsReflectionModalOpen(true)}
            leftIcon={<Brain size={14} color="var(--color-coral-500)" />}
          >
            Reflect
          </Button>

          {/* Host Sanctuary Disband Button */}
          {isHost && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsCloseDialogOpen(true)}
              leftIcon={<Trash2 size={14} />}
              title="Disband room and end session for everyone"
            >
              Disband Room
            </Button>
          )}
        </div>
      </header>

      {/* Plan §6.2: calm handover notice — the previous host stepped away and
          this scholar was auto-promoted. No blame, auto-hosting just works. */}
      {promotedToHost && showHostFailoverNotice && (
        <div className="solis-room-host-failover" role="status" aria-live="polite">
          <Crown size={14} aria-hidden="true" />
          <span>
            The previous host stepped away — you&rsquo;re now keeping this session on track.
          </span>
          <button
            type="button"
            className="solis-room-host-failover__dismiss"
            onClick={() => setShowHostFailoverNotice(false)}
            aria-label="Dismiss host handover notice"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Shared Objective & Personal Workspace Task Dock */}
      <div className="solis-room-workspace-dock">
        {/* Left: Shared Objective (if set) */}
        {room.sharedObjective && (
          <div className="solis-room-shared-objective-card">
            <Target size={16} color="var(--color-coral-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <span className="solis-room-objective-label">Shared Pod Objective</span>
              <p className="solis-room-objective-text">"{room.sharedObjective}"</p>
            </div>
          </div>
        )}

        {/* Right: Personal Focus Outcome & Linked Task */}
        <div className="solis-room-task-card">
          <div className="solis-room-task-card__left">
            <div className="solis-room-task-label-row">
              <Sparkles size={14} color="var(--color-amber-500)" />
              <span className="solis-room-task-label">Personal Outcome / Solis Task:</span>
            </div>

            {activeTask ? (
              <div className="solis-room-active-task-display">
                <button
                  type="button"
                  className="solis-room-task-checkbox"
                  onClick={handleToggleTaskCompleted}
                  title={activeTask.status === 'completed' ? 'Mark Incomplete' : 'Complete Task'}
                >
                  {activeTask.status === 'completed' ? (
                    <CheckCircle2 size={18} color="var(--color-sage-500)" />
                  ) : (
                    <Circle size={18} color="var(--text-muted)" />
                  )}
                </button>
                <span
                  className={`solis-room-task-name ${
                    activeTask.status === 'completed' ? 'solis-room-task-name--done' : ''
                  }`}
                >
                  {activeTask.title}
                </span>
              </div>
            ) : isEditingIntention ? (
              <Input
                value={personalIntention}
                onChange={(e) => setPersonalIntention(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveIntention()}
                placeholder="What will you accomplish in this session?"
                autoFocus
                className="solis-room-task-input"
              />
            ) : (
              <span className="solis-room-intention-text">
                {personalIntention ? `"${personalIntention}"` : 'No task attached. Declare your focus intention...'}
              </span>
            )}
          </div>

          <div className="solis-room-task-card__actions" ref={taskMenuRef}>
            {/* Task Selector Dropdown */}
            <div style={{ position: 'relative' }}>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => setIsTaskDropdownOpen(!isTaskDropdownOpen)}
                leftIcon={<ListTodo size={13} />}
                rightIcon={<ChevronDown size={12} />}
              >
                {activeTask ? 'Change Task' : 'Attach Task'}
              </Button>

              {isTaskDropdownOpen && (
                <div className="solis-room-task-dropdown">
                  <div className="solis-room-task-dropdown__header">
                    <span>Select Workspace Task</span>
                  </div>
                  <div className="solis-room-task-dropdown__list">
                    {tasks.filter((t) => t.status !== 'completed').length === 0 ? (
                      <div className="solis-room-task-dropdown__empty">
                        No pending tasks found. Set an intention manually!
                      </div>
                    ) : (
                      tasks
                        .filter((t) => t.status !== 'completed')
                        .map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            className="solis-room-task-dropdown__item"
                            onClick={() => handleSelectTask(task)}
                          >
                            <span className="solis-room-task-dropdown__title">{task.title}</span>
                            {task.priority && (
                              <span className={`solis-task-priority-tag solis-task-priority-tag--${task.priority}`}>
                                {task.priority}
                              </span>
                            )}
                          </button>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Custom Intention Edit */}
            {!activeTask && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isEditingIntention) handleSaveIntention();
                  else setIsEditingIntention(true);
                }}
              >
                {isEditingIntention ? 'Commit' : personalIntention ? 'Edit' : '+ Intention'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Break Mode Intermission Alert */}
      {room.isBreak && (
        <div className="solis-room-break-banner">
          <Coffee size={18} />
          <div style={{ flex: 1 }}>
            <strong>Intermission in Progress</strong> — Stand up, rest your eyes, and hydrate. Session resumes
            promptly.
          </div>
        </div>
      )}

      {/* Main Focus Canvas + Social Pod Dock */}
      <main className="solis-active-room__layout">
        {/* Main Center Focus Panel */}
        <section className="solis-active-room__center">
          <div
            className={`solis-room-timer-card ${
              room.isBreak
                ? 'solis-room-timer-card--break'
                : room.timerState === 'running'
                ? 'solis-room-timer-card--active'
                : room.timerState === 'paused'
                ? 'solis-room-timer-card--paused'
                : 'solis-room-timer-card--idle'
            }`}
          >
            {/* Ambient Background Aura */}
            <div
              className={`solis-room-stage-glow solis-room-stage-glow--${
                room.isBreak ? 'break' : room.timerState
              }`}
            />

            {/* Pod State Pill */}
            <div className="solis-room-timer-card__status">
              <span
                className={`solis-presence-dot solis-presence-dot--${
                  room.isBreak ? 'break' : room.timerState === 'running' ? 'focusing' : 'idle'
                }`}
              />
              <span className="solis-room-timer-card__state-label">
                {room.isBreak
                  ? 'INTERMISSION BREAK'
                  : room.timerState === 'running'
                  ? 'SYNCHRONIZED FOCUS FLOW'
                  : room.timerState === 'paused'
                  ? 'SESSION PAUSED BY HOST'
                  : 'SANCTUARY STANDBY (READY TO FLOW)'}
              </span>
            </div>

            {/* Huge Tabular Digits */}
            <div className="solis-room-timer-card__digits">
              {formatSecondsToTimer(remainingSeconds)}
            </div>

            {/* Synchronized Progress Track */}
            <div className="solis-room-timer-card__track">
              <div
                className="solis-room-timer-card__fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Session Stats Bar */}
            <div className="solis-room-timer-card__stats">
              <span className="solis-room-stat-chip">
                <Clock size={12} />
                Target: {targetMins}m
              </span>
              <span className="solis-room-stat-chip">
                <Users size={12} />
                {presenceUsers.length} In Pod
              </span>
              <span className="solis-room-stat-chip">
                <Sparkles size={12} />
                {Math.round(progressPercent)}% Elapsed
              </span>
            </div>

            {/* Completion Banner */}
            {isCompleted && (
              <div className="solis-room-timer-card__complete-banner">
                <Sparkles size={18} color="var(--color-coral-500)" />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>Focus Target Achieved! 🏆</div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                    Outstanding discipline. Log your notes and reflect on what you learned.
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsReflectionModalOpen(true)}
                >
                  Record Reflection
                </Button>
              </div>
            )}

            {/* Host Master Command Deck vs Participant Indicators */}
            {isHost ? (
              <div className="solis-room-host-deck">
                <div className="solis-room-host-deck__header">
                  <span className="solis-room-host-deck__title">
                    👑 Master Sanctuary Controls (Host Deck)
                  </span>
                  <div className="solis-room-host-deck__quick-adjust">
                    <button
                      type="button"
                      className="solis-adjust-btn"
                      onClick={() => handleAdjustDuration(-5)}
                      title="Decrease session by 5 minutes"
                      disabled={room.timerState === 'running'}
                    >
                      <Minus size={12} /> 5m
                    </button>
                    <button
                      type="button"
                      className="solis-adjust-btn"
                      onClick={() => handleAdjustDuration(5)}
                      title="Increase session by 5 minutes"
                      disabled={room.timerState === 'running'}
                    >
                      <Plus size={12} /> 5m
                    </button>
                  </div>
                </div>

                {/* Primary Master Action Buttons */}
                <div className="solis-room-controls-row">
                  {room.timerState !== 'running' ? (
                    <Button
                      variant="primary"
                      size="lg"
                      className="tactile-press solis-btn-hero"
                      onClick={() => startTimer()}
                      leftIcon={<Play size={18} fill="currentColor" />}
                    >
                      {remainingSeconds === 0
                        ? 'Start New Cycle'
                        : room.timerState === 'paused'
                        ? 'Resume Flow'
                        : 'Start Focus Flow'}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="lg"
                      className="tactile-press solis-btn-hero"
                      onClick={() => pauseTimer()}
                      leftIcon={<Pause size={18} />}
                    >
                      Pause Session
                    </Button>
                  )}

                  {/* Reset Flow Button */}
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setIsResetDialogOpen(true)}
                    leftIcon={<RotateCcw size={16} />}
                    title="Reset master timer back to starting duration"
                  >
                    Reset
                  </Button>

                  {/* Intermission Break Button */}
                  <Button
                    variant={room.isBreak ? 'accent' : 'subtle'}
                    size="md"
                    onClick={handleToggleBreak}
                    leftIcon={<Coffee size={16} />}
                  >
                    {room.isBreak ? 'End Break' : 'Take Break'}
                  </Button>
                </div>

                {/* Target Duration Presets Row */}
                {room.timerState !== 'running' && (
                  <div className="solis-room-presets-row">
                    <span className="solis-room-presets-label">Presets:</span>
                    {DURATION_PRESETS.map((preset) => (
                      <button
                        key={preset.seconds}
                        type="button"
                        onClick={() => resetTimer(preset.seconds)}
                        className={`solis-room-preset-btn ${
                          room.targetDurationSeconds === preset.seconds
                            ? 'solis-room-preset-btn--active'
                            : ''
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="solis-room-participant-deck">
                <Clock size={16} color="var(--color-coral-500)" />
                <span>
                  <strong>{room.hostName || 'Host'}</strong> orchestrates the master timer. Maintain
                  synchronized deep focus flow.
                </span>
              </div>
            )}

            {/* Peer Cheer Reactions Bar */}
            <div className="solis-room-reactions-dock">
              <span className="solis-room-reactions-label">Cheer Pod:</span>
              <div className="solis-room-reactions-group">
                {REACTION_EMOJIS.map((item) => (
                  <button
                    key={item.emoji}
                    type="button"
                    className="solis-room-reaction-btn"
                    onClick={() => handleSendReaction(item.emoji)}
                    title={`Send ${item.label} to the sanctuary`}
                  >
                    <span>{item.emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Participant Personal Presence Switcher */}
          <div className="solis-room-status-bar">
            <span className="solis-room-status-label">My Status:</span>
            <button
              type="button"
              className={`solis-room-status-pill ${
                myStatus === 'focusing' ? 'solis-room-status-pill--active-focusing' : ''
              }`}
              onClick={() => handleStatusChange('focusing')}
            >
              <span className="solis-presence-dot solis-presence-dot--focusing" />
              Focusing
            </button>
            <button
              type="button"
              className={`solis-room-status-pill ${
                myStatus === 'break' ? 'solis-room-status-pill--active-break' : ''
              }`}
              onClick={() => handleStatusChange('break')}
            >
              <Coffee size={13} />
              Intermission
            </button>
            <button
              type="button"
              className={`solis-room-status-pill ${
                myStatus === 'idle' ? 'solis-room-status-pill--active-idle' : ''
              }`}
              onClick={() => handleStatusChange('idle')}
            >
              <span className="solis-presence-dot solis-presence-dot--idle" />
              Idle / Away
            </button>
          </div>
        </section>

        {/* Sidebar Dock: Scholars Presence, Silent Chat, Activity Feed */}
        {!isZenMode && (
          <aside className="solis-active-room__sidebar">
            <div className="solis-active-room__tabs">
              <button
                type="button"
                className={`solis-active-room__tab ${
                  activeTab === 'presence' ? 'solis-active-room__tab--active' : ''
                }`}
                onClick={() => setActiveTab('presence')}
              >
                <Users size={14} />
                <span>Scholars ({presenceUsers.length})</span>
              </button>
              <button
                type="button"
                className={`solis-active-room__tab ${
                  activeTab === 'chat' ? 'solis-active-room__tab--active' : ''
                }`}
                onClick={() => setActiveTab('chat')}
              >
                <MessageSquare size={14} />
                <span>Chat ({messages.length})</span>
              </button>
              <button
                type="button"
                className={`solis-active-room__tab ${
                  activeTab === 'timeline' ? 'solis-active-room__tab--active' : ''
                }`}
                onClick={() => setActiveTab('timeline')}
              >
                <Sparkles size={14} />
                <span>Events ({events.length})</span>
              </button>
            </div>

            {/* Presence Tab Panel */}
            {activeTab === 'presence' && (
              <div className="solis-active-room__panel">
                <div className="solis-presence-panel-header">
                  <span className="solis-panel-header-title">Live Scholars</span>
                  <span className="solis-panel-header-count">{presenceUsers.length} in sanctuary</span>
                </div>

                <div className="solis-presence-list">
                  {presenceUsers.map((pUser) => {
                    const isUserHost = room && pUser.userId === room.hostId;
                    const isMe = user && pUser.userId === user.id;

                    return (
                      <div key={pUser.userId} className="solis-presence-user-row">
                        <div className="solis-presence-user-info">
                          <span
                            className={`solis-presence-dot solis-presence-dot--${
                              pUser.status || 'focusing'
                            }`}
                          />
                          <Avatar name={pUser.name || 'Scholar'} size="sm" />
                          <div className="solis-presence-user-text">
                            <div className="solis-presence-name-line">
                              <span className="solis-presence-user-name">
                                {pUser.name || 'Solis Scholar'}
                              </span>
                              {isMe && <span className="solis-me-badge">(You)</span>}
                              {isUserHost && <span className="solis-crown-badge" title="Sanctuary Host">👑</span>}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`solis-presence-chip solis-presence-chip--${
                            pUser.status || 'focusing'
                          }`}
                        >
                          {pUser.status || 'focusing'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chat Tab Panel */}
            {activeTab === 'chat' && (
              <div className="solis-active-room__panel">
                {/* Quick Chat Prompts */}
                <div className="solis-quick-prompts-bar">
                  <button
                    type="button"
                    className="solis-quick-prompt-btn"
                    onClick={() => handleQuickChatPrompt('Focus mode engaged! 🚀')}
                  >
                    🚀 Deep focus
                  </button>
                  <button
                    type="button"
                    className="solis-quick-prompt-btn"
                    onClick={() => handleQuickChatPrompt('Taking a quick 5m water break ☕')}
                  >
                    ☕ Quick break
                  </button>
                  <button
                    type="button"
                    className="solis-quick-prompt-btn"
                    onClick={() => handleQuickChatPrompt('Crushed my current task! 🎉')}
                  >
                    🎉 Finished task
                  </button>
                </div>

                <div className="solis-chat-thread">
                  {messages.length === 0 ? (
                    <div className="solis-chat-empty">
                      <MessageSquare size={28} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                      <p>No messages yet. Send a quiet cheer or update to your study peers!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = user && msg.userId === user.id;
                      const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <div
                          key={msg.id}
                          className={`solis-chat-message ${isMine ? 'solis-chat-message--mine' : ''}`}
                        >
                          <div className="solis-chat-message__header">
                            <span className="solis-chat-message__author">
                              {msg.userName || 'Scholar'}
                            </span>
                            <span>{timeStr}</span>
                          </div>
                          <div className="solis-chat-message__bubble">{msg.content}</div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="solis-chat-composer">
                  <Input
                    placeholder="Send a quiet note..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isSendingMessage}
                    className="solis-chat-input"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={!chatInput.trim() || isSendingMessage}
                    leftIcon={<Send size={14} />}
                  >
                    Send
                  </Button>
                </form>
              </div>
            )}

            {/* Timeline Events Tab Panel */}
            {activeTab === 'timeline' && (
              <div className="solis-active-room__panel">
                <div className="solis-presence-panel-header">
                  <span className="solis-panel-header-title">Live Event Stream</span>
                  <span className="solis-panel-header-count">{events.length} events logged</span>
                </div>

                <div className="solis-room-events-list">
                  {events.length === 0 ? (
                    <div className="solis-events-empty">
                      <Sparkles size={28} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                      <p>No events logged yet. Actions and peer cheers appear here in real-time.</p>
                    </div>
                  ) : (
                    events.map((ev) => (
                      <div key={ev.id} className="solis-room-event-row">
                        <span className="solis-room-event-icon">
                          {ev.eventType === 'session_start'
                            ? '🚀'
                            : ev.eventType === 'session_pause'
                            ? '⏸️'
                            : ev.eventType === 'break_start'
                            ? '☕'
                            : ev.eventType === 'break_end'
                            ? '⚡'
                            : ev.eventType === 'reaction'
                            ? ev.message?.includes('task') || ev.message?.includes('🎯')
                              ? '🏆'
                              : ev.message || '👏'
                            : '📌'}
                        </span>
                        <div className="solis-room-event-content">
                          <strong>{ev.userName}</strong>{' '}
                          {ev.eventType === 'reaction'
                            ? ev.message
                            : ev.message}
                        </div>
                        <span className="solis-room-event-time">
                          {new Date(ev.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </aside>
        )}
      </main>

      {/* Confirmation Dialog for Resetting Session */}
      <ConfirmationDialog
        isOpen={isResetDialogOpen}
        title="Reset Focus Flow?"
        description="This will reset the current countdown timer back to the beginning of the cycle."
        confirmLabel="Reset Cycle"
        cancelLabel="Continue Flow"
        onConfirm={async () => {
          setIsResetDialogOpen(false);
          await resetTimer();
          addToast({
            title: 'Cycle Reset',
            description: 'Master timer has been reset to the target duration.',
            type: 'info'
          });
        }}
        onClose={() => setIsResetDialogOpen(false)}
        variant="warning"
      />

      {/* Confirmation Dialog for Disbanding / Deleting Sanctuary */}
      <ConfirmationDialog
        isOpen={isCloseDialogOpen}
        title="Disband & Delete Sanctuary?"
        description="This will permanently disband the study room, disconnect all scholars, and remove it from the directory."
        confirmLabel="Disband & Delete Room"
        cancelLabel="Keep Open"
        onConfirm={handleCloseSanctuary}
        onClose={() => setIsCloseDialogOpen(false)}
        variant="danger"
      />

      {/* Room Reflection Modal */}
      <RoomReflectionModal
        isOpen={isReflectionModalOpen}
        room={room}
        onClose={() => setIsReflectionModalOpen(false)}
      />
    </div>
  );
};
