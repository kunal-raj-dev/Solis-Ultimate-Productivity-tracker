import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, Maximize2, Flame, Headphones, Coffee, X } from 'lucide-react';
import { useFocus } from '../../../context/FocusContext';
import { formatTime } from '../../../utils/timer';
import { cn } from '../../../utils/classNames';
import './MiniFocusPlayer.css';

export const MiniFocusPlayer: React.FC = () => {
  const {
    status,
    preset,
    secondsRemaining,
    focusTitle,
    selectedSubject,
    soundscape,
    startTimer,
    pauseTimer,
    cancelTimer
  } = useFocus();

  const navigate = useNavigate();
  const location = useLocation();

  // Do not show the mini player on the full Focus Sanctuary page or when idle/cancelled
  const isFocusPage = location.pathname.startsWith('/app/focus');
  const isActive = status === 'running' || status === 'paused';

  if (isFocusPage || !isActive) {
    return null;
  }

  const isRunning = status === 'running';
  const isBreak = preset === 'short_break';
  const displayTitle = isBreak
    ? 'Recharge & Eye Rest'
    : selectedSubject?.name || focusTitle || 'Deep Focus Session';

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const handleExpand = () => {
    navigate('/app/focus');
  };

  return (
    <aside
      className={cn(
        'solis-mini-player',
        !isRunning && 'solis-mini-player--paused',
        isRunning && !isBreak && 'solis-mini-player--running-focus',
        isRunning && isBreak && 'solis-mini-player--running-break'
      )}
      onClick={handleExpand}
      aria-label="Active Focus Session"
      role="region"
    >
      <div className="solis-mini-player__left">
        <span
          className={cn(
            'solis-mini-player__indicator',
            !isRunning && 'solis-mini-player__indicator--paused',
            isRunning && !isBreak && 'solis-mini-player__indicator--focus',
            isRunning && isBreak && 'solis-mini-player__indicator--break'
          )}
          aria-hidden="true"
        />

        <span className="solis-mini-player__icon">
          {soundscape !== 'none' ? (
            <Headphones size={15} />
          ) : isBreak ? (
            <Coffee size={15} />
          ) : (
            <Flame size={15} />
          )}
        </span>

        <div className="solis-mini-player__meta">
          <span className="solis-mini-player__status-label">
            {!isRunning
              ? isBreak
                ? 'Paused (Break)'
                : 'Paused'
              : isBreak
              ? 'Rest Break'
              : 'Focusing'}
          </span>
          <span className="solis-mini-player__title" title={displayTitle}>
            {displayTitle}
          </span>
        </div>
      </div>

      <div className="solis-mini-player__right">
        <div
          className="solis-mini-player__time"
          aria-label={`Time remaining: ${formatTime(secondsRemaining)}`}
        >
          {formatTime(secondsRemaining)}
        </div>

        <button
          type="button"
          className="solis-mini-player__btn solis-mini-player__btn--play"
          onClick={handleTogglePlay}
          title={isRunning ? 'Pause session' : 'Resume session'}
          aria-label={isRunning ? 'Pause session' : 'Resume session'}
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} className="solis-play-icon-offset" />}
        </button>

        <button
          type="button"
          className="solis-mini-player__btn solis-mini-player__btn--expand"
          onClick={(e) => {
            e.stopPropagation();
            handleExpand();
          }}
          title="Expand Focus Sanctuary"
          aria-label="Expand Focus Sanctuary"
        >
          <Maximize2 size={13} />
          <span className="solis-mini-player__expand-label">Expand</span>
        </button>

        <button
          type="button"
          className="solis-mini-player__btn solis-mini-player__btn--cancel"
          onClick={(e) => {
            e.stopPropagation();
            cancelTimer();
          }}
          title="Cancel & Dismiss Session"
          aria-label="Cancel and dismiss focus session"
        >
          <X size={14} />
        </button>
      </div>
    </aside>
  );
};
