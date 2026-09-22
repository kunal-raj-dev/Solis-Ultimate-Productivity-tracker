import React, { useState, useRef, useEffect } from 'react';
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
  KeyRound
} from 'lucide-react';
import { useStudyRoom } from '../../hooks/useStudyRoom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { ConfirmationDialog } from '../../components/feedback/ConfirmationDialog/ConfirmationDialog';
import { ParticipantStatus } from '../../types/room';
import { formatSecondsToTimer } from '../../utils/formatters';
import { RoomReflectionModal } from './RoomReflectionModal';
import './ActiveRoomView.css';

const DURATION_PRESETS = [
  { label: '15m', seconds: 900 },
  { label: '25m', seconds: 1500 },
  { label: '45m', seconds: 2700 },
  { label: '50m', seconds: 3000 },
  { label: '60m', seconds: 3600 }
];

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

  const [activeTab, setActiveTab] = useState<'presence' | 'chat' | 'timeline'>('presence');
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [myStatus, setMyStatus] = useState<ParticipantStatus>('focusing');
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to latest
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      addToast({
        title: 'Room Link Copied',
        description: 'Share with study partners to join this synchronized sanctuary.',
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
    try {
      await sendTimelineEvent('reaction', emoji);
      addToast({
        title: 'Reaction Shared',
        description: `Broadcasted ${emoji} to the sanctuary.`,
        type: 'success'
      });
    } catch {
      addToast({ title: 'Could not send reaction', type: 'error' });
    }
  };

  const handleCloseSanctuary = async () => {
    try {
      await deleteRoom();
      addToast({
        title: 'Sanctuary Closed',
        description: 'The study room has been disbanded securely.',
        type: 'info'
      });
      navigate('/app/rooms');
    } catch (err: any) {
      addToast({
        title: 'Action Failed',
        description: err?.message || 'Failed to close study room.',
        type: 'error'
      });
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 size={36} className="solis-spin" style={{ color: 'var(--color-coral-500, #ff6b4a)' }} />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '500px', margin: '0 auto' }}>
        <Shield size={48} color="var(--color-rose-500, #e11d48)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: 'var(--text-heading-3)', color: 'var(--text-primary)', marginBottom: '8px' }}>
          {error || 'Sanctuary Inaccessible'}
        </h2>
        <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          This study sanctuary may have ended or you do not have permission to access it.
        </p>
        <Button variant="primary" onClick={() => navigate('/app/rooms')} leftIcon={<ArrowLeft size={16} />}>
          Return to Study Rooms
        </Button>
      </div>
    );
  }

  const isCompleted = room.timerState === 'running' && remainingSeconds === 0;

  return (
    <div className="solis-active-room">
      {/* Topbar */}
      <div className="solis-active-room__topbar">
        <div className="solis-active-room__topbar-left">
          <button
            type="button"
            className="solis-active-room__back-btn"
            onClick={async () => {
              await leaveRoom();
              navigate('/app/rooms');
            }}
          >
            <ArrowLeft size={14} />
            Directory
          </button>

          <div className="solis-active-room__title-area">
            <h2 className="solis-active-room__title">
              <Radio size={18} color="var(--color-coral-500, #ff6b4a)" />
              {room.title}
              {room.roomCode && (
                <button
                  type="button"
                  className="solis-room-header__code-chip"
                  onClick={handleCopyCode}
                  title="Click to copy 6-digit Room Code"
                >
                  <KeyRound size={12} />
                  <span>#{room.roomCode}</span>
                </button>
              )}
            </h2>
            <span className="solis-active-room__host-tag">
              Host: {room.hostName || 'Solis Scholar'} {isHost && ' (You)'}
              {room.subjectName ? ` • ${room.subjectName}` : ''}
              {room.sessionType ? ` • ${room.sessionType.replace('_', ' ')}` : ''}
            </span>
          </div>
        </div>

        <div className="solis-active-room__topbar-right">
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

          <Button
            variant="subtle"
            size="sm"
            onClick={handleCopyLink}
            leftIcon={isCopied ? <Check size={14} /> : <Copy size={14} />}
          >
            {isCopied ? 'Copied' : 'Share Link'}
          </Button>

          <Button
            variant="subtle"
            size="sm"
            onClick={() => setIsReflectionModalOpen(true)}
            leftIcon={<Brain size={14} color="var(--color-coral-500)" />}
          >
            Reflect & Log
          </Button>

          {isHost && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsCloseDialogOpen(true)}
              leftIcon={<Trash2 size={14} />}
            >
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Shared Objective Focal Banner */}
      {room.sharedObjective && (
        <div className="solis-room-shared-objective-banner">
          <Target size={18} color="var(--color-coral-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <span className="solis-room-objective-label">Shared Pod Objective</span>
            <p className="solis-room-objective-text">"{room.sharedObjective}"</p>
          </div>
        </div>
      )}

      {/* Break Mode Ambient Indicator */}
      {room.isBreak && (
        <div className="solis-room-break-banner">
          <Coffee size={16} />
          <span>Intermission in Progress — Step away, hydrate, and stretch. Focus resumes shortly.</span>
        </div>
      )}

      {/* Main Focus Canvas + Sidebar Grid */}
      <div className="solis-active-room__layout">
        {/* Main Center Focus Panel */}
        <div className="solis-active-room__center">
          {/* Synchronized Epoch Countdown Card */}
          <div className={`solis-room-timer-card ${room.isBreak ? 'solis-room-timer-card--break' : ''} ${room.timerState === 'running' ? 'solis-room-timer-card--active' : ''}`}>
            <div className="solis-room-timer-card__status">
              <span className={`solis-presence-dot solis-presence-dot--${room.timerState === 'running' ? 'focusing' : 'idle'}`} />
              <span className="solis-room-timer-card__state-label">
                {room.isBreak
                  ? 'Intermission Break'
                  : room.timerState === 'running'
                  ? 'Synchronized Focus Flow'
                  : room.timerState === 'paused'
                  ? 'Session Paused by Host'
                  : 'Sanctuary Open (Ready to Flow)'}
              </span>
            </div>

            {/* Countdown Digits */}
            <div className="solis-room-timer-card__digits">
              {formatSecondsToTimer(remainingSeconds)}
            </div>

            {/* Authoritative Progress Track */}
            <div className="solis-room-timer-card__track">
              <div
                className="solis-room-timer-card__fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {isCompleted && (
              <div className="solis-room-timer-card__complete-banner">
                <Sparkles size={16} color="var(--color-coral-500)" />
                <span>Session Target Reached! Well done scholars.</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsReflectionModalOpen(true)}
                  style={{ marginLeft: '10px' }}
                >
                  Record Reflection
                </Button>
              </div>
            )}

            {/* Host Master Controls */}
            {isHost ? (
              <>
                <div className="solis-room-controls-row">
                  {room.timerState !== 'running' ? (
                    <Button
                      variant="primary"
                      size="lg"
                      className="tactile-press"
                      onClick={() => startTimer()}
                      leftIcon={<Play size={18} fill="currentColor" />}
                    >
                      {remainingSeconds === 0
                        ? 'Start New Cycle'
                        : room.timerState === 'paused'
                        ? 'Resume Session'
                        : 'Start Focus Flow'}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="lg"
                      className="tactile-press"
                      onClick={() => pauseTimer()}
                      leftIcon={<Pause size={18} />}
                    >
                      Pause Flow
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => resetTimer()}
                    leftIcon={<RotateCcw size={16} />}
                    title="Reset to target duration"
                  >
                    Reset
                  </Button>

                  <Button
                    variant={room.isBreak ? 'accent' : 'subtle'}
                    size="md"
                    onClick={handleToggleBreak}
                    leftIcon={<Coffee size={16} />}
                  >
                    {room.isBreak ? 'End Break' : 'Start Break'}
                  </Button>
                </div>

                {/* Preset Switcher (Available when idle or paused) */}
                {room.timerState !== 'running' && (
                  <div className="solis-room-presets-row">
                    <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                      Presets:
                    </span>
                    {DURATION_PRESETS.map((preset) => (
                      <button
                        key={preset.seconds}
                        type="button"
                        onClick={() => resetTimer(preset.seconds)}
                        className="solis-room-preset-btn"
                        style={{
                          background: room.targetDurationSeconds === preset.seconds ? 'rgba(255, 107, 74, 0.15)' : undefined,
                          borderColor: room.targetDurationSeconds === preset.seconds ? 'var(--color-coral-500)' : undefined,
                          color: room.targetDurationSeconds === preset.seconds ? 'var(--color-coral-500)' : undefined
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="solis-room-host-indicator">
                <Clock size={16} color="var(--color-coral-500)" />
                <span>
                  <strong>{room.hostName || 'Host'}</strong> controls the master session timer. Focus synchronously.
                </span>
              </div>
            )}

            {/* Peer Reactions Row */}
            <div className="solis-room-reactions-bar">
              <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', marginRight: '6px' }}>
                Cheer Peers:
              </span>
              {['👏', '🧠', '⚡', '☕', '🔥'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="solis-room-reaction-btn"
                  onClick={() => handleSendReaction(emoji)}
                  title={`Send ${emoji} reaction to the room`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Self-Presence Status Switcher */}
          <div className="solis-room-status-bar">
            <span className="solis-room-status-label">Your Status:</span>
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
              Break
            </button>
            <button
              type="button"
              className={`solis-room-status-pill ${
                myStatus === 'idle' ? 'solis-room-status-pill--active-idle' : ''
              }`}
              onClick={() => handleStatusChange('idle')}
            >
              <span className="solis-presence-dot solis-presence-dot--idle" />
              Idle
            </button>
          </div>
        </div>

        {/* Sidebar: Presence & Chat & Timeline Panels */}
        <div className="solis-active-room__sidebar">
          <div className="solis-active-room__tabs">
            <button
              type="button"
              className={`solis-active-room__tab ${activeTab === 'presence' ? 'solis-active-room__tab--active' : ''}`}
              onClick={() => setActiveTab('presence')}
            >
              <Users size={15} />
              Scholars ({presenceUsers.length})
            </button>
            <button
              type="button"
              className={`solis-active-room__tab ${activeTab === 'chat' ? 'solis-active-room__tab--active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare size={15} />
              Chat ({messages.length})
            </button>
            <button
              type="button"
              className={`solis-active-room__tab ${activeTab === 'timeline' ? 'solis-active-room__tab--active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              <Sparkles size={15} />
              Events ({events.length})
            </button>
          </div>

          {/* Presence Tab Panel */}
          {activeTab === 'presence' && (
            <div className="solis-active-room__panel">
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-micro)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  Live Presence
                </span>
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                  {presenceUsers.length} in sanctuary
                </span>
              </div>

              <div className="solis-presence-list">
                {presenceUsers.map((pUser) => {
                  const isUserHost = room && pUser.userId === room.hostId;
                  const isMe = user && pUser.userId === user.id;

                  return (
                    <div key={pUser.userId} className="solis-presence-user-row">
                      <div className="solis-presence-user-info">
                        <span
                          className={`solis-presence-dot solis-presence-dot--${pUser.status || 'focusing'}`}
                        />
                        <Avatar name={pUser.name || 'Scholar'} size="sm" />
                        <div>
                          <div style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {pUser.name || 'Solis Scholar'}
                            {isMe && <span style={{ color: 'var(--color-coral-500)', fontSize: 'var(--text-micro)' }}>(You)</span>}
                            {isUserHost && <span title="Session Host">👑</span>}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`solis-presence-chip solis-presence-chip--${pUser.status || 'focusing'}`}
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
              <div className="solis-chat-thread">
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-caption)', margin: 'auto 0' }}>
                    No messages yet. Say hello to your study peers! 👋
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
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isSendingMessage}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!chatInput.trim() || isSendingMessage}
                  leftIcon={<Send size={15} />}
                >
                  Send
                </Button>
              </form>
            </div>
          )}

          {/* Timeline Events Tab Panel */}
          {activeTab === 'timeline' && (
            <div className="solis-active-room__panel">
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-micro)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  Live Event Feed
                </span>
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                  {events.length} events
                </span>
              </div>

              <div className="solis-room-events-list">
                {events.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-caption)', padding: '30px 0' }}>
                    No events logged yet. Start timer, pause, break, or cheer peers with reactions!
                  </div>
                ) : (
                  events.map((ev) => (
                    <div key={ev.id} className="solis-room-event-row">
                      <span>
                        {ev.eventType === 'session_start' ? '🚀' : ev.eventType === 'session_pause' ? '⏸️' : ev.eventType === 'break_start' ? '☕' : ev.eventType === 'break_end' ? '⚡' : ev.eventType === 'reaction' ? ev.message || '👏' : '📌'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{ev.userName}</strong> {ev.eventType === 'reaction' ? `reacted with ${ev.message}` : ev.message}
                      </div>
                      <span className="solis-room-event-time">
                        {new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for ending room */}
      <ConfirmationDialog
        isOpen={isCloseDialogOpen}
        title="Disband Study Sanctuary?"
        description="This will end the session for all connected participants and close the room."
        confirmLabel="Disband Room"
        cancelLabel="Keep Open"
        onConfirm={handleCloseSanctuary}
        onClose={() => setIsCloseDialogOpen(false)}
        variant="danger"
      />

      {/* Calm Reflective Closing Synthesis Sheet */}
      <RoomReflectionModal
        isOpen={isReflectionModalOpen}
        room={room}
        onClose={() => setIsReflectionModalOpen(false)}
      />
    </div>
  );
};
