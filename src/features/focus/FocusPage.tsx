import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  XCircle,
  Check,
  ArrowLeft,
  Lock,
  Headphones,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Zap,
  Maximize2,
  Minimize2,
  Target,
  X,
  Wind,
  BatteryLow,
  Activity,
  Rocket,
  PieChart,
  Hash,
  Shield,
  BellOff
} from 'lucide-react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Modal } from '../../components/feedback/Modal/Modal';
import { ConfirmationDialog } from '../../components/feedback/ConfirmationDialog/ConfirmationDialog';
import { CustomSelect } from '../../components/ui/Select/CustomSelect';
import { SegmentedControl } from '../../components/ui/SegmentedControl/SegmentedControl';
import { ContextualHelp } from '../../components/ui/ContextualHelp/ContextualHelp';
import { ParallaxScene, ParallaxLayer, AtmosphericOrb } from '../../components/parallax';
import { PostFocusReflectionModal } from '../../components/features/Focus/PostFocusReflectionModal';
import { CognitiveDriftPad } from '../../components/features/Focus/CognitiveDriftPad';
import { CenteringSanctuaryModal } from '../../components/features/Focus/CenteringSanctuaryModal';
import { AnalogPieTimer } from '../../components/features/Focus/AnalogPieTimer';
import { useToast } from '../../context/ToastContext';
import { useGuide } from '../../context/GuideContext';
import { useFocus, FocusPreset } from '../../context/FocusContext';
import { SoundscapeType, PreSessionEnergy } from '../../types/focus';
import { formatSecondsToTimer } from '../../utils/formatters';
import { SOUNDSCAPE_PRESETS } from '../../utils/focus/soundscapeEngine';
import { hapticsEngine } from '../../utils/focus/hapticsEngine';
import './FocusPage.css';

// Plan §5.1: 3-tap pre-session energy calibration — each level applies its
// deterministic duration recommendation on tap.
const ENERGY_CHECKIN_OPTIONS: Array<{
  value: PreSessionEnergy;
  label: string;
  hint: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'low',
    label: 'Low',
    hint: 'Gentle 15m session — or an easy flashcard review instead',
    icon: <BatteryLow size={18} />
  },
  {
    value: 'steady',
    label: 'Steady',
    hint: 'Standard 25m Pomodoro',
    icon: <Activity size={18} />
  },
  {
    value: 'sharp',
    label: 'Sharp',
    hint: 'Challenge yourself: 90m deep-work block',
    icon: <Rocket size={18} />
  }
];

export const FocusPage: React.FC = () => {
  const { addToast } = useToast();
  const { openGuide } = useGuide();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    preset,
    totalDurationSeconds,
    secondsRemaining,
    status,
    timerMode,
    stopwatchElapsedSeconds,
    focusTitle,
    targetOutcome,
    selectedSubjectId,
    selectedPlanItemId,
    selectedTaskId,
    soundscape,
    soundscapeVolume,
    isMuted,
    checkpointAcknowledged,
    isReflectionModalOpen,
    completedSessionMinutes,
    preSessionEnergy,
    subjects,
    selectedSubject,
    tasks,
    activeTask,
    parkedThoughts,
    startTimer,
    pauseTimer,
    resetTimer,
    cancelTimer,
    completeTimer,
    selectPreset,
    setFocusTitle,
    setTargetOutcome,
    setSelectedSubjectId,
    setSelectedPlanItemId,
    setSelectedTaskId,
    setSelectedBlockId,
    setSoundscape,
    setSoundscapeVolume,
    toggleMute,
    setCheckpointAcknowledged,
    setPreSessionEnergy,
    setIsReflectionModalOpen,
    testAudioChime,
    interruptionsLog,
    internalInterruptionsCount,
    externalInterruptionsCount,
    recordInterruption,
    saveReflection
  } = useFocus();

  const location = useLocation();

  // Drift Pad, Centering, Zen, and Modal states
  const [isDriftPadOpen, setIsDriftPadOpen] = useState(false);
  const [isCenteringModalOpen, setIsCenteringModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customMinutesInput, setCustomMinutesInput] = useState('45');
  const [isAbortConfirmOpen, setIsAbortConfirmOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  // Plan §5.3: toggle between digital numerals and the analog pie sweep.
  const [timerDisplayStyle, setTimerDisplayStyle] = useState<'digital' | 'analog'>('digital');

  // Keyboard shortcut listener:
  // Alt+D or Ctrl+Shift+D opens Drift Pad during active flow
  // Z / z toggles Zen Immersion Mode
  // Space starts/pauses timer
  // Escape exits Zen Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCustomModalOpen || isAbortConfirmOpen || isCenteringModalOpen || isReflectionModalOpen) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const role = target?.getAttribute('role');
      const isInteractive =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        tag === 'BUTTON' ||
        tag === 'A' ||
        Boolean(target?.isContentEditable) ||
        role === 'button' ||
        role === 'combobox' ||
        role === 'listbox' ||
        role === 'option' ||
        role === 'menuitem' ||
        role === 'switch';

      if (e.key === 'Escape' && isZenMode) {
        e.preventDefault();
        setIsZenMode(false);
        return;
      }

      if ((e.key === 'z' || e.key === 'Z') && !e.ctrlKey && !e.metaKey && !e.altKey && !isInteractive) {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
        return;
      }

      // Space to start/pause focus session (when not interacting with any button or form control)
      if ((e.code === 'Space' || e.key === ' ') && !e.ctrlKey && !e.metaKey && !e.altKey && !isInteractive) {
        e.preventDefault();
        if (status === 'idle' || status === 'paused') {
          hapticsEngine.playMechanicalTick();
          startTimer();
        } else if (status === 'running') {
          hapticsEngine.playMechanicalTick();
          pauseTimer();
        }
        return;
      }

      if (status !== 'running' && status !== 'paused') return;

      if ((e.altKey && (e.key === 'd' || e.key === 'D')) || (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd'))) {
        e.preventDefault();
        setIsDriftPadOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, isCustomModalOpen, isAbortConfirmOpen, isCenteringModalOpen, isReflectionModalOpen, isZenMode, startTimer, pauseTimer]);

  // Audio chime / haptic bell on session completion
  useEffect(() => {
    if (status === 'completed') {
      hapticsEngine.playResonantBell();
    }
  }, [status]);

  // Query params & navigation state setup on entry
  useEffect(() => {
    const locState = location.state as { subjectId?: string; topic?: string; title?: string; taskId?: string; blockId?: string; durationMinutes?: number } | null;
    const paramSubjectId = searchParams.get('subjectId') || locState?.subjectId;
    const paramPlanId = searchParams.get('planId');
    const paramTaskId = searchParams.get('taskId') || locState?.taskId;
    const paramBlockId = searchParams.get('blockId') || locState?.blockId;
    const paramTitle = searchParams.get('title') || searchParams.get('topicTitle') || locState?.title || locState?.topic;
    const paramDuration = searchParams.get('duration') || searchParams.get('durationMinutes') || locState?.durationMinutes;

    if (paramTaskId) setSelectedTaskId(paramTaskId);
    if (paramBlockId) setSelectedBlockId(paramBlockId);
    if (paramSubjectId) setSelectedSubjectId(paramSubjectId);
    if (paramPlanId) setSelectedPlanItemId(paramPlanId);
    if (paramTitle) setFocusTitle(paramTitle);
    if (paramDuration) {
      const mins = typeof paramDuration === 'number' ? paramDuration : parseInt(paramDuration, 10);
      if (!isNaN(mins) && mins > 0) {
        if (mins === 25) {
          selectPreset('pomodoro');
        } else if (mins === 50) {
          selectPreset('deep_flow');
        } else {
          selectPreset('custom', mins);
        }
      }
    }
  }, [searchParams, location.state, setSelectedSubjectId, setSelectedPlanItemId, setSelectedTaskId, setSelectedBlockId, setFocusTitle, selectPreset]);

  const handleStart = () => {
    hapticsEngine.playMechanicalTick();
    startTimer();
  };

  const handlePause = () => {
    hapticsEngine.playMechanicalTick();
    pauseTimer();
  };

  const handleComplete = () => {
    hapticsEngine.playResonantBell();
    completeTimer();
  };

  const handleSelectPreset = (newPreset: FocusPreset) => {
    if (newPreset === 'custom') {
      setIsCustomModalOpen(true);
      return;
    }
    selectPreset(newPreset);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = Math.max(1, Math.min(180, parseInt(customMinutesInput, 10) || 30));
    selectPreset('custom', mins);
    setIsCustomModalOpen(false);
    addToast({ title: `Custom Focus set to ${mins}m`, type: 'info' });
  };

  // Plan §5.1: record the energy check-in and apply its duration recommendation.
  const handleEnergySelect = (energy: PreSessionEnergy) => {
    hapticsEngine.playMechanicalTick();
    if (energy === 'low') {
      selectPreset('custom', 15);
    } else if (energy === 'steady') {
      selectPreset('pomodoro');
    } else {
      selectPreset('custom', 90);
    }
    setPreSessionEnergy(energy);
  };

  // The pie sweep only carries meaning for countdown sessions.
  const isAnalogEligible = timerDisplayStyle === 'analog' && timerMode === 'countdown';
  const displaySeconds = timerMode === 'stopwatch' ? stopwatchElapsedSeconds : secondsRemaining;
  const remainingFraction =
    timerMode === 'countdown' && totalDurationSeconds > 0
      ? secondsRemaining / totalDurationSeconds
      : 0;

  const subjectOptions = [
    { value: '', label: 'No Subject Associated' },
    ...subjects.filter((s) => s.status !== 'archived').map((s) => ({
      value: s.id,
      label: s.name,
      badge: s.code
    }))
  ];

  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const taskOptions = [
    { value: '', label: 'No Task Link' },
    ...pendingTasks.map((t) => ({
      value: t.id,
      label: t.title,
      badge: t.estimatedMinutes ? `${t.estimatedMinutes}m` : t.priority
    }))
  ];

  const soundscapeOptions = [
    { value: 'none', label: 'Silent Sanctuary', sublabel: 'Mute ambient audio' },
    ...SOUNDSCAPE_PRESETS.map((p) => ({
      value: p.id,
      label: p.label,
      sublabel: p.description.split('.')[0]
    }))
  ];

  // Dynamic Subject World Atmosphere Palette
  const worldOrbColor: 'coral' | 'amber' | 'lavender' | 'sage' =
    status === 'completed'
      ? 'sage'
      : status === 'paused'
      ? 'lavender'
      : (selectedSubject?.color as any) || (status === 'running' ? 'coral' : 'amber');

  // Screen Reader live announcement
  const accessibleAnnouncement =
    status === 'running'
      ? timerMode === 'stopwatch'
        ? `Focus stopwatch running: ${formatSecondsToTimer(stopwatchElapsedSeconds)} elapsed`
        : `Focus session running: ${formatSecondsToTimer(secondsRemaining)} remaining`
      : status === 'paused'
      ? 'Focus session paused'
      : status === 'completed'
      ? 'Focus session completed. Reflection window open.'
      : '';

  return (
    <div className="solis-focus-page-root">
      {/* Screen Reader Announcement Live Region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {accessibleAnnouncement}
      </div>

      {/* Floating Zen Mode Quick Exit Bar */}
      {isZenMode && (
        <div className="solis-focus-zen-bar">
          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Zen Immersion
          </span>
          <button
            type="button"
            onClick={() => setIsZenMode(false)}
            className="tactile-press"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              color: '#fff',
              padding: '4px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Minimize2 size={12} />
            <span>Exit Zen (Esc)</span>
          </button>
        </div>
      )}

      {/* FULL ENVIRONMENT IMMERSIVE FOCUS SANCTUARY */}
      <div className={`solis-focus-sanctuary solis-focus-sanctuary--${status} ${isZenMode ? 'solis-focus-sanctuary--zen' : ''}`}>
        <ParallaxScene style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ParallaxLayer speed={0.04} isAbsolute>
            <AtmosphericOrb
              color={worldOrbColor}
              sizePx={520}
              top="6%"
              right="15%"
              opacity={status === 'running' ? 0.55 : 0.3}
            />
          </ParallaxLayer>

          <ParallaxLayer speed={0} style={{ width: '100%', maxWidth: '680px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Top Sanctuary Navigation Zone */}
            <div
              className="solis-focus-peripheral"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-lg)',
                padding: '0 var(--space-xs)',
                position: 'relative',
                zIndex: 60
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate('/app/dashboard');
                  }
                }}
                className="tactile-press"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 14px',
                  color: 'var(--color-ivory-100)',
                  fontSize: 'var(--text-caption)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={14} />
                <span>Exit Focus</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={isZenMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  onClick={() => setIsZenMode((prev) => !prev)}
                  style={{ color: isZenMode ? 'var(--color-coral-400)' : 'rgba(255, 255, 255, 0.7)' }}
                  title="Toggle Zen Immersion Mode (Z)"
                >
                  {isZenMode ? 'Exit Zen' : 'Zen Mode'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<BookOpen size={14} />}
                  onClick={() => openGuide('focus-sanctuary')}
                  style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  title="Learn how Focus Room works"
                >
                  Guide
                </Button>
                <span
                  style={{
                    fontFamily: 'var(--font-interface)',
                    fontSize: 'var(--text-micro)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.45)'
                  }}
                >
                  Focus Room
                </span>
              </div>
            </div>

            {/* Soundscape Synthesizer Bar */}
            <div className="solis-soundscape-bar solis-focus-peripheral">
              <Headphones size={15} style={{ color: soundscape !== 'none' ? 'var(--color-coral-400)' : 'rgba(255, 255, 255, 0.4)', flexShrink: 0 }} />
              <div style={{ width: '220px' }}>
                <CustomSelect
                  variant="dark"
                  value={soundscape}
                  onChange={(val) => setSoundscape(val as SoundscapeType)}
                  options={soundscapeOptions}
                  placeholder="Soundscape..."
                />
              </div>

              {soundscape !== 'none' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundscapeVolume}
                    onChange={(e) => setSoundscapeVolume(parseFloat(e.target.value))}
                    className="solis-soundscape-slider"
                    aria-label="Soundscape Volume"
                  />
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="tactile-press"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 'var(--radius-full)',
                      color: isMuted ? 'var(--color-coral-400)' : 'rgba(255, 255, 255, 0.8)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px'
                    }}
                    title={isMuted ? 'Unmute' : 'Mute'}
                    aria-label={isMuted ? 'Unmute soundscape' : 'Mute soundscape'}
                  >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>

                  {/* Soundscape Audio Pulse */}
                  {!isMuted && status === 'running' && (
                    <div className="solis-soundscape-pulse" title="Acoustic resonance active">
                      <div className="solis-soundscape-pulse__bar" />
                      <div className="solis-soundscape-pulse__bar" />
                      <div className="solis-soundscape-pulse__bar" />
                      <div className="solis-soundscape-pulse__bar" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Top preset switcher & Acoustic bell */}
            <div
              className="solis-focus-peripheral"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: 'var(--space-md) 0 var(--space-lg)',
                flexWrap: 'wrap',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 20
              }}
            >
              <SegmentedControl
                variant="contained"
                value={preset}
                onChange={(val) => handleSelectPreset(val as FocusPreset)}
                options={[
                  { value: 'pomodoro', label: 'Pomodoro 25m' },
                  { value: 'deep_flow', label: 'Deep Flow 50m' },
                  { value: 'short_break', label: 'Short Rest 5m' },
                  { value: 'custom', label: 'Custom' }
                ]}
              />

              <ContextualHelp
                title="Pomodoro vs Deep Flow"
                content="Pomodoro (25m) provides low-friction starts and rapid feedback. Deep Flow (50m–90m) provides immersive, uninterrupted continuity for complex architectures and deep problem solving."
                example="Use Pomodoro for flashcard drilling and problem sets; use Deep Flow for essays and coding."
                guideId="pomodoro-vs-deep-flow"
                onOpenGuide={openGuide}
              />

              {/* Plan §5.3: digital ⇄ analog pie display toggle (countdown only) */}
              {timerMode === 'countdown' && (
                <button
                  type="button"
                  onClick={() => setTimerDisplayStyle((prev) => (prev === 'digital' ? 'analog' : 'digital'))}
                  className="tactile-press"
                  title={timerDisplayStyle === 'digital' ? 'Switch to analog pie timer' : 'Switch to digital timer'}
                  aria-label={timerDisplayStyle === 'digital' ? 'Switch to analog pie timer' : 'Switch to digital timer'}
                  aria-pressed={timerDisplayStyle === 'analog'}
                  style={{
                    background: timerDisplayStyle === 'analog' ? 'rgba(230, 90, 65, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: timerDisplayStyle === 'analog' ? 'var(--color-coral-400)' : 'var(--color-ivory-50)',
                    cursor: 'pointer'
                  }}
                >
                  {timerDisplayStyle === 'digital' ? <PieChart size={16} /> : <Hash size={16} />}
                </button>
              )}

              <button
                type="button"
                onClick={testAudioChime}
                className="tactile-press"
                title="Test singing bowl acoustic resonance"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-ivory-50)',
                  cursor: 'pointer'
                }}
              >
                <Volume2 size={16} />
              </button>
            </div>

            {/* Custom Subject & Task Selector */}
            {status === 'idle' && (
              <div
                className="solis-focus-peripheral"
                style={{
                  width: '100%',
                  maxWidth: '480px',
                  marginBottom: 'var(--space-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 10
                }}
              >
                {activeTask ? (
                  <div className="solis-focus-task-pill">
                    <Target size={14} color="var(--color-coral-400)" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Task: <strong>{activeTask.title}</strong>
                    </span>
                    {activeTask.estimatedMinutes && (
                      <span className="solis-focus-task-est">{activeTask.estimatedMinutes}m est</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedTaskId('')}
                      className="solis-focus-task-clear"
                      title="Unlink task"
                      aria-label="Unlink task"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <div style={{ flex: 1 }}>
                      <CustomSelect
                        variant="dark"
                        value={selectedSubjectId}
                        onChange={setSelectedSubjectId}
                        options={subjectOptions}
                        placeholder="Select Subject..."
                      />
                    </div>
                    {pendingTasks.length > 0 && (
                      <div style={{ width: '160px' }}>
                        <CustomSelect
                          variant="dark"
                          value={selectedTaskId}
                          onChange={(val) => setSelectedTaskId(val)}
                          options={taskOptions}
                          placeholder="Link a To-Do Task..."
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Active Task indicator in running/paused mode */}
            {status !== 'idle' && activeTask && !isZenMode && (
              <div className="solis-focus-task-pill solis-focus-peripheral">
                <Target size={13} color="var(--color-coral-400)" />
                <span>Task: <strong>{activeTask.title}</strong></span>
              </div>
            )}

            {/* Intention & Micro-Outcome Lock */}
            {status === 'idle' ? (
              <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={focusTitle}
                  onChange={(e) => setFocusTitle(e.target.value)}
                  placeholder="What are you studying right now? (e.g. Math homework)"
                  className="solis-focus-intention-input"
                />
                <input
                  type="text"
                  value={targetOutcome}
                  onChange={(e) => setTargetOutcome(e.target.value)}
                  placeholder="Specific target (e.g. Solve 5 practice problems)"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px dashed rgba(255, 255, 255, 0.12)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: 'var(--font-interface)',
                    fontSize: 'var(--text-body-sm)',
                    textAlign: 'center',
                    padding: '4px 0',
                    width: '80%',
                    outline: 'none'
                  }}
                />
              </div>
            ) : (
              <div className="solis-locked-outcome-pill">
                <Lock size={13} color="var(--color-coral-400)" />
                <span>{targetOutcome ? `Target: ${targetOutcome}` : focusTitle}</span>
              </div>
            )}

            {/* Mid-Session Checkpoint Banner */}
            {status === 'running' && secondsRemaining <= totalDurationSeconds * 0.5 && !checkpointAcknowledged && (
              <div className="solis-focus-checkpoint-banner">
                <Sparkles size={16} color="var(--color-coral-400)" />
                <span>Halfway checkpoint: Maintain lock on target outcome?</span>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<CheckCircle2 size={13} />}
                  onClick={() => setCheckpointAcknowledged(true)}
                >
                  On Track
                </Button>
              </div>
            )}

            {/* Meditative Breathing Aura Rings */}
            <div className={`solis-focus-aura ${status === 'running' ? 'solis-focus-aura--pulsing' : ''}`}>
              <div className="solis-focus-aura__ring solis-focus-aura__ring--1" />
              <div className="solis-focus-aura__ring solis-focus-aura__ring--2" />
              <div className="solis-focus-aura__ring solis-focus-aura__ring--3" />
            </div>

            {/* Plan §5.1: Pre-Session Energy Check-In (3-tap calibration) */}
            {status === 'idle' && (
              <div
                className="solis-energy-checkin solis-focus-peripheral"
                style={{ position: 'relative', zIndex: 10 }}
              >
                <span className="solis-energy-checkin__label">How is your energy right now?</span>
                <div className="solis-energy-checkin__row" role="group" aria-label="Pre-session energy check-in">
                  {ENERGY_CHECKIN_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`solis-energy-checkin__option tactile-press ${
                        preSessionEnergy === option.value ? 'solis-energy-checkin__option--selected' : ''
                      }`}
                      onClick={() => handleEnergySelect(option.value)}
                      aria-pressed={preSessionEnergy === option.value}
                      title={option.hint}
                    >
                      <span className="solis-energy-checkin__icon">{option.icon}</span>
                      <span className="solis-energy-checkin__option-label">{option.label}</span>
                    </button>
                  ))}
                </div>
                <span className="solis-energy-checkin__hint" aria-live="polite">
                  {preSessionEnergy
                    ? ENERGY_CHECKIN_OPTIONS.find((o) => o.value === preSessionEnergy)?.hint
                    : 'Tap once to calibrate today\'s session length'}
                </span>
              </div>
            )}

            {/* Floating Time Typography */}
            {isAnalogEligible ? (
              <AnalogPieTimer
                remainingFraction={remainingFraction}
                label={formatSecondsToTimer(secondsRemaining)}
                ariaLabel={`Time remaining: ${formatSecondsToTimer(secondsRemaining)}`}
              />
            ) : (
              <div
                className="solis-focus-time-display"
                data-cursor="zen"
                aria-label={
                  timerMode === 'stopwatch'
                    ? `Elapsed time: ${formatSecondsToTimer(stopwatchElapsedSeconds)}`
                    : `Time remaining: ${formatSecondsToTimer(secondsRemaining)}`
                }
              >
                {formatSecondsToTimer(displaySeconds)}
              </div>
            )}

            {/* Sanctuary Actions */}
            <div className="solis-focus-actions">
              {status === 'idle' && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button
                    variant="accent"
                    size="lg"
                    className="tactile-press"
                    leftIcon={<Play size={18} />}
                    onClick={handleStart}
                    data-cursor="action"
                    style={{ minWidth: '180px' }}
                  >
                    Start Focus (Space)
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="tactile-press"
                    leftIcon={<Wind size={15} />}
                    onClick={() => setIsCenteringModalOpen(true)}
                    data-cursor="action"
                    style={{ minWidth: '160px', borderColor: 'rgba(255, 255, 255, 0.25)', color: '#FAF8F5' }}
                  >
                    Center Mind (2m)
                  </Button>
                </div>
              )}

              {status === 'running' && (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    className="tactile-press"
                    leftIcon={<Pause size={18} />}
                    onClick={handlePause}
                    style={{ minWidth: '140px', borderColor: 'rgba(255, 255, 255, 0.3)', color: '#fff' }}
                  >
                    Pause (Space)
                  </Button>
                  <Button
                    variant="accent"
                    size="md"
                    className="tactile-press"
                    leftIcon={<Check size={16} />}
                    onClick={handleComplete}
                    style={{ minWidth: '140px' }}
                  >
                    Complete
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    className="tactile-press"
                    leftIcon={<XCircle size={16} />}
                    onClick={() => setIsAbortConfirmOpen(true)}
                    style={{ color: 'var(--color-charcoal-400)' }}
                  >
                    Abort
                  </Button>
                </>
              )}

              {status === 'paused' && (
                <>
                  <Button
                    variant="accent"
                    size="lg"
                    className="tactile-press"
                    leftIcon={<Play size={18} />}
                    onClick={handleStart}
                    style={{ minWidth: '140px' }}
                  >
                    Resume (Space)
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    className="tactile-press"
                    leftIcon={<Check size={16} />}
                    onClick={handleComplete}
                    style={{ minWidth: '140px', borderColor: 'rgba(255, 255, 255, 0.3)', color: '#fff' }}
                  >
                    Complete
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    className="tactile-press"
                    leftIcon={<RotateCcw size={16} />}
                    onClick={resetTimer}
                    style={{ color: 'var(--color-charcoal-400)' }}
                  >
                    Reset
                  </Button>
                </>
              )}

              {status === 'completed' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button
                    variant="accent"
                    size="lg"
                    className="tactile-press"
                    leftIcon={<Sparkles size={18} />}
                    onClick={() => setIsReflectionModalOpen(true)}
                  >
                    Reflect on Session
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="tactile-press"
                    leftIcon={<RotateCcw size={18} />}
                    onClick={resetTimer}
                  >
                    New Block
                  </Button>
                </div>
              )}
            </div>

            {/* Feature 2.5: Distraction Counter & Interruption Tracking */}
            {(status === 'running' || status === 'paused') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    fontSize: 'var(--text-micro)',
                    color: 'var(--color-ivory-200)'
                  }}
                >
                  <Shield size={12} color={interruptionsLog.length === 0 ? 'var(--color-emerald-400, #34d399)' : 'var(--color-amber-400, #fbbf24)'} />
                  <span>
                    {interruptionsLog.length === 0
                      ? 'Pristine Focus (0 Distractions)'
                      : `Friction: ${internalInterruptionsCount} Drift • ${externalInterruptionsCount} External`}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => recordInterruption('internal')}
                    title="Log an internal urge, mind wandering, or distraction impulse (+1)"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(235, 94, 40, 0.12)',
                      border: '1px solid rgba(235, 94, 40, 0.28)',
                      color: 'var(--color-ivory-100)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 500,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Zap size={11} color="var(--color-coral-400)" />
                    <span>+1 Mind Drift</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => recordInterruption('external')}
                    title="Log external interruption: knock, call, noise, or alert (+1)"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(217, 119, 6, 0.12)',
                      border: '1px solid rgba(217, 119, 6, 0.28)',
                      color: 'var(--color-ivory-100)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 500,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <BellOff size={11} color="var(--color-amber-400)" />
                    <span>+1 External</span>
                  </button>

                  <button
                    type="button"
                    className="solis-focus-drift-trigger tactile-press"
                    onClick={() => setIsDriftPadOpen(true)}
                    title="Park intrusive thought into inbox (Alt+D)"
                    style={{ margin: 0 }}
                  >
                    <Zap size={13} color="var(--color-coral-400)" />
                    <span>Park Thought {parkedThoughts.length > 0 ? `(${parkedThoughts.length})` : ''}</span>
                    <span className="solis-drift-kbd">Alt+D</span>
                  </button>
                </div>
              </div>
            )}
          </ParallaxLayer>
        </ParallaxScene>
      </div>

      {/* Post-Focus Auto-Reflection Modal */}
      <PostFocusReflectionModal
        isOpen={isReflectionModalOpen}
        onClose={() => setIsReflectionModalOpen(false)}
        sessionMinutes={completedSessionMinutes}
        subjectName={selectedSubject?.name}
        topicTitle={focusTitle}
        targetOutcome={targetOutcome}
        taskId={selectedTaskId}
        taskTitle={activeTask?.title}
        planItemId={selectedPlanItemId}
        parkedThoughts={parkedThoughts}
        initialInternalCount={internalInterruptionsCount}
        initialExternalCount={externalInterruptionsCount}
        interruptionsLog={interruptionsLog}
        onSaveSession={saveReflection}
      />

      {/* Cognitive Drift Pad (Interruption Shield) */}
      <CognitiveDriftPad
        isOpen={isDriftPadOpen}
        onClose={() => setIsDriftPadOpen(false)}
      />

      {/* Centering Sanctuary Breathwork Pacer */}
      <CenteringSanctuaryModal
        isOpen={isCenteringModalOpen}
        onClose={() => setIsCenteringModalOpen(false)}
        onBeginFocus={startTimer}
      />

      {/* Custom Duration Modal */}
      <Modal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        title="Custom Focus Duration"
      >
        <form onSubmit={handleApplyCustom} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Quick Presets
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[15, 25, 45, 60, 90, 120].map((mins) => (
                <Button
                  key={mins}
                  type="button"
                  size="sm"
                  variant={customMinutesInput === String(mins) ? 'accent' : 'subtle'}
                  onClick={() => setCustomMinutesInput(String(mins))}
                >
                  {mins} min
                </Button>
              ))}
            </div>
          </div>

          <Input
            label="Custom Duration in Minutes (1 – 180 min)"
            type="number"
            value={customMinutesInput}
            onChange={(e) => setCustomMinutesInput(e.target.value)}
            required
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsCustomModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Apply Duration
            </Button>
          </div>
        </form>
      </Modal>

      {/* Abort Session Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isAbortConfirmOpen}
        onClose={() => setIsAbortConfirmOpen(false)}
        onConfirm={() => {
          setIsAbortConfirmOpen(false);
          cancelTimer();
          addToast({ title: 'Focus session cancelled', type: 'info' });
        }}
        title="Abort Active Focus Flow?"
        description="Are you sure you want to stop this focus block? Elapsed progress for this block will not be recorded in your daily momentum."
        confirmLabel="Abort Session"
        cancelLabel="Continue Flow"
        variant="danger"
      />
    </div>
  );
};
