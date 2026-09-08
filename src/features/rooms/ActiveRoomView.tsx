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
  Flame,
  ArrowLeft,
  Radio,
  Trash2,
  Shield,
  Clock,
  Sparkles,
  Coffee,
  Loader2,
  WifiOff
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
    remainingSeconds,
    progressPercent,
    isHost,
    isLoading,
    isReconnecting,
    error,
    startTimer,
    pauseTimer,
    resetTimer,
    updateStatus,
    sendMessage,
    leaveRoom,
    deleteRoom
  } = useStudyRoom(roomId);

  const [activeTab, setActiveTab] = useState<'presence' | 'chat'>('presence');
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [myStatus, setMyStatus] = useState<ParticipantStatus>('focusing');
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);

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
            </h2>
            <span className="solis-active-room__host-tag">
              Host: {room.hostName || 'Solis Scholar'} {isHost && ' (You)'}
            </span>
          </div>
        </div>

        <div className="solis-active-room__topbar-right">
          {isReconnecting ? (
            <span className="solis-active-room__sync-pill solis-active-room__sync-pill--reconnecting">
              <WifiOff size={11} />
              Reconnecting...
            </span>
          ) : (
            <span className="solis-active-room__sync-pill solis-active-room__sync-pill--live">
              <span className="solis-rooms-header__badge-dot" style={{ backgroundColor: 'var(--color-sage-500)' }} />
              Synchronized
            </span>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyLink}
            leftIcon={isCopied ? <Check size={14} color="var(--color-sage-500)" /> : <Copy size={14} />}
          >
            {isCopied ? 'Copied' : 'Share'}
          </Button>

          {isHost && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCloseDialogOpen(true)}
              leftIcon={<Trash2 size={14} color="var(--color-rose-500)" />}
              title="Close and disband sanctuary"
            >
              End Room
            </Button>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="solis-active-room__layout">
        {/* Central Stage: High-Contrast Authoritative Epoch Timer */}
        <div className="solis-active-room__stage">
          <div
            className={`solis-active-room__stage-glow solis-active-room__stage-glow--${room.timerState}`}
          />

          <div className="solis-room-timer-container">
            <div className="solis-room-timer-display">
              <span
                className={`solis-room-timer-state-badge solis-room-timer-state-badge--${
                  isCompleted ? 'completed' : room.timerState
                }`}
              >
                {isCompleted ? (
                  <>
                    <Sparkles size={12} />
                    Focus Block Completed
                  </>
                ) : room.timerState === 'running' ? (
                  <>
                    <Flame size={12} />
                    Focus Pod In Flow
                  </>
                ) : room.timerState === 'paused' ? (
                  <>
                    <Pause size={12} />
                    Session Paused
                  </>
                ) : (
                  <>
                    <Clock size={12} />
                    Ready for Takeoff
                  </>
                )}
              </span>

              <div className="solis-room-timer-digits">
                {formatSecondsToTimer(remainingSeconds)}
              </div>

              {/* Linear Progress Track */}
              <div className="solis-room-progress-track">
                <div
                  className="solis-room-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Controls: Host vs Non-Host */}
          <div className="solis-room-controls-pod">
            {isHost ? (
              <>
                <div className="solis-room-controls-actions">
                  {room.timerState !== 'running' ? (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => startTimer()}
                      leftIcon={<Play size={18} fill="currentColor" />}
                    >
                      {room.timerState === 'paused' ? 'Resume Session' : 'Start Focus Sprint'}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => pauseTimer()}
                      leftIcon={<Pause size={18} />}
                    >
                      Pause Session
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => resetTimer()}
                    leftIcon={<RotateCcw size={18} />}
                    title="Reset timer to target duration"
                  >
                    Reset
                  </Button>
                </div>

                {/* Duration adjusters when idle */}
                {room.timerState === 'idle' && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    {DURATION_PRESETS.map((preset) => (
                      <button
                        key={preset.seconds}
                        type="button"
                        onClick={() => resetTimer(preset.seconds)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border:
                            room.targetDurationSeconds === preset.seconds
                              ? '1px solid var(--color-coral-500)'
                              : '1px solid var(--border-subtle)',
                          backgroundColor:
                            room.targetDurationSeconds === preset.seconds
                              ? 'rgba(255, 107, 74, 0.15)'
                              : 'rgba(255, 255, 255, 0.04)',
                          color:
                            room.targetDurationSeconds === preset.seconds
                              ? 'var(--color-coral-500)'
                              : 'var(--text-secondary)',
                          fontSize: 'var(--text-micro)',
                          fontWeight: 600,
                          cursor: 'pointer'
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

        {/* Sidebar: Presence & Chat Panels */}
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
              Room Chat ({messages.length})
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
    </div>
  );
};
