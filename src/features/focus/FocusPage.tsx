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
  BookOpen
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
import { useToast } from '../../context/ToastContext';
import { useGuide } from '../../context/GuideContext';
import { useFocus, FocusPreset } from '../../context/FocusContext';
import { SoundscapeType } from '../../types/focus';
import { formatSecondsToTimer } from '../../utils/formatters';
import { SOUNDSCAPE_PRESETS } from '../../utils/focus/soundscapeEngine';
import './FocusPage.css';

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
    focusTitle,
    targetOutcome,
    selectedSubjectId,
    soundscape,
    soundscapeVolume,
    isMuted,
    checkpointAcknowledged,
    isReflectionModalOpen,
    completedSessionMinutes,
    subjects,
    selectedSubject,
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
    setSoundscape,
    setSoundscapeVolume,
    toggleMute,
    setCheckpointAcknowledged,
    setIsReflectionModalOpen,
    testAudioChime,
    saveReflection
  } = useFocus();

  const location = useLocation();

  // Query params & navigation state setup on entry
  useEffect(() => {
    const locState = location.state as { subjectId?: string; topic?: string; durationMinutes?: number } | null;
    const paramSubjectId = searchParams.get('subjectId') || locState?.subjectId;
    const paramPlanId = searchParams.get('planId');
    const paramTitle = searchParams.get('title') || searchParams.get('topicTitle') || locState?.topic;
    const paramDuration = searchParams.get('duration') || searchParams.get('durationMinutes') || locState?.durationMinutes;

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
  }, [searchParams, location.state, setSelectedSubjectId, setSelectedPlanItemId, setFocusTitle, selectPreset]);

  // Custom preset modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customMinutesInput, setCustomMinutesInput] = useState('45');
  const [isAbortConfirmOpen, setIsAbortConfirmOpen] = useState(false);

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

  const subjectOptions = [
    { value: '', label: 'No Subject Associated' },
    ...subjects.filter((s) => s.status !== 'archived').map((s) => ({
      value: s.id,
      label: s.name,
      badge: s.code
    }))
  ];

  const soundscapeOptions = [
    { value: 'none', label: '🔇 Silent Sanctuary', sublabel: 'Mute ambient audio' },
    ...SOUNDSCAPE_PRESETS.map((p) => ({
      value: p.id,
      label: `🎵 ${p.label}`,
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
      ? `Focus session running: ${formatSecondsToTimer(secondsRemaining)} remaining`
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

      {/* FULL ENVIRONMENT IMMERSIVE FOCUS SANCTUARY */}
      <div className={`solis-focus-sanctuary solis-focus-sanctuary--${status}`}>
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
                <span>Exit Sanctuary</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<BookOpen size={14} />}
                  onClick={() => openGuide('focus-sanctuary')}
                  style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  title="Learn how Focus Sanctuary works"
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
            <div className="solis-soundscape-bar">
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
                </div>
              )}
            </div>

            {/* Top preset switcher & Acoustic bell */}
            <div
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

            {/* Custom Subject Selector (Subject Worlds) */}
            <div style={{ width: '100%', maxWidth: '360px', marginBottom: 'var(--space-md)', position: 'relative', zIndex: 10 }}>
              <CustomSelect
                variant="dark"
                value={selectedSubjectId}
                onChange={setSelectedSubjectId}
                options={subjectOptions}
                placeholder="Choose Knowledge Discipline..."
              />
            </div>

            {/* Intention & Micro-Outcome Lock */}
            {status === 'idle' ? (
              <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={focusTitle}
                  onChange={(e) => setFocusTitle(e.target.value)}
                  placeholder="What is your singular intention for this block?"
                  className="solis-focus-intention-input"
                />
                <input
                  type="text"
                  value={targetOutcome}
                  onChange={(e) => setTargetOutcome(e.target.value)}
                  placeholder="Specific output target (e.g. Prove Raft leader election)"
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

            {/* Floating Time Typography */}
            <div className="solis-focus-time-display" aria-label={`Time remaining: ${formatSecondsToTimer(secondsRemaining)}`}>
              {formatSecondsToTimer(secondsRemaining)}
            </div>

            {/* Sanctuary Actions */}
            <div className="solis-focus-actions">
              {status === 'idle' && (
                <Button
                  variant="accent"
                  size="lg"
                  className="tactile-press"
                  leftIcon={<Play size={18} />}
                  onClick={startTimer}
                  style={{ minWidth: '180px' }}
                >
                  Enter Sanctuary
                </Button>
              )}

              {status === 'running' && (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    className="tactile-press"
                    leftIcon={<Pause size={18} />}
                    onClick={pauseTimer}
                    style={{ minWidth: '140px', borderColor: 'rgba(255, 255, 255, 0.3)', color: '#fff' }}
                  >
                    Pause Flow
                  </Button>
                  <Button
                    variant="accent"
                    size="md"
                    className="tactile-press"
                    leftIcon={<Check size={16} />}
                    onClick={completeTimer}
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
                    onClick={startTimer}
                    style={{ minWidth: '140px' }}
                  >
                    Resume Flow
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    className="tactile-press"
                    leftIcon={<Check size={16} />}
                    onClick={completeTimer}
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
        onSaveSession={saveReflection}
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
