import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Modal } from '../../components/feedback/Modal/Modal';
import { CustomSelect } from '../../components/ui/Select/CustomSelect';
import { SegmentedControl } from '../../components/ui/SegmentedControl/SegmentedControl';
import { ParallaxScene, ParallaxLayer, AtmosphericOrb } from '../../components/parallax';
import { PostFocusReflectionModal } from '../../components/features/Focus/PostFocusReflectionModal';
import { useToast } from '../../context/ToastContext';
import { dataService } from '../../services/dataService';
import { StudySubject } from '../../types/study';
import { SoundscapeType } from '../../types/focus';
import { formatSecondsToTimer } from '../../utils/formatters';
import { playFocusCompletionChime, calculateTimerRemaining } from '../../utils/timer';
import { soundscapeEngine, SOUNDSCAPE_PRESETS } from '../../utils/focus/soundscapeEngine';
import './FocusPage.css';

type FocusPreset = 'pomodoro' | 'deep_flow' | 'short_break' | 'custom';
type TimerStatus = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';

export const FocusPage: React.FC = () => {
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Query params
  const paramSubjectId = searchParams.get('subjectId');
  const paramPlanId = searchParams.get('planId');
  const paramTitle = searchParams.get('title');

  const [preset, setPreset] = useState<FocusPreset>('pomodoro');
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(25 * 60);
  const [status, setStatus] = useState<TimerStatus>('idle');

  // Study context & Subject Worlds
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(paramSubjectId || '');
  const [selectedPlanItemId] = useState<string>(paramPlanId || '');

  // Soundscape Synthetic Engine State
  const [soundscape, setSoundscape] = useState<SoundscapeType>('none');
  const [soundscapeVolume, setSoundscapeVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  // Intent Lock & Checkpoint State
  const [focusTitle, setFocusTitle] = useState(paramTitle || 'Deep Study & Architectural Flow');
  const [targetOutcome, setTargetOutcome] = useState('');
  const [checkpointAcknowledged, setCheckpointAcknowledged] = useState(false);

  // Timestamp anchors for correctness
  const [targetEndTimeMs, setTargetEndTimeMs] = useState<number | null>(null);
  const [pausedRemainingMs, setPausedRemainingMs] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);

  // Post-Focus Auto-Reflection Modal
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [completedSessionMinutes, setCompletedSessionMinutes] = useState(25);

  // Custom preset modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customMinutesInput, setCustomMinutesInput] = useState('45');

  // Screen reader announcement buffer
  const [accessibleAnnouncement, setAccessibleAnnouncement] = useState('');

  const animFrameRef = useRef<number | null>(null);

  const loadHistoryAndSubjects = useCallback(async () => {
    try {
      const subs = await dataService.study.getSubjects();
      setSubjects(subs);

      if (!selectedSubjectId && subs.length > 0) {
        setSelectedSubjectId(subs[0].id);
      }
    } catch (err) {
      console.error('Failed to load focus subjects:', err);
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    loadHistoryAndSubjects();
    const unsubscribe = dataService.subscribe(() => {
      loadHistoryAndSubjects();
    });
    return () => unsubscribe();
  }, [loadHistoryAndSubjects]);

  useEffect(() => {
    return () => {
      soundscapeEngine.stop();
    };
  }, []);

  const handleSessionComplete = useCallback(async () => {
    soundscapeEngine.stop();
    setStatus('completed');
    setSecondsRemaining(0);
    setTargetEndTimeMs(null);
    setPausedRemainingMs(null);

    playFocusCompletionChime();
    setAccessibleAnnouncement('Focus interval completed. Take a calm rest.');

    const mins = Math.max(1, Math.round(totalDurationSeconds / 60));
    setCompletedSessionMinutes(mins);
    setIsReflectionModalOpen(true);
  }, [totalDurationSeconds]);

  // Precision RAF loop
  useEffect(() => {
    if (status !== 'running' || targetEndTimeMs === null) {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const tick = () => {
      const remainingSeconds = calculateTimerRemaining(
        targetEndTimeMs,
        pausedRemainingMs,
        status,
        totalDurationSeconds
      );

      // Bail out if seconds have not changed to eliminate 60-120 FPS React re-render thrashing
      setSecondsRemaining((prev) => (prev !== remainingSeconds ? remainingSeconds : prev));

      if (remainingSeconds <= 0) {
        handleSessionComplete();
      } else {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [status, targetEndTimeMs, pausedRemainingMs, totalDurationSeconds, handleSessionComplete]);

  const handleSelectPreset = (newPreset: FocusPreset) => {
    if (newPreset === 'custom') {
      setIsCustomModalOpen(true);
      return;
    }

    setStatus('idle');
    setPreset(newPreset);
    let sec = 25 * 60;
    if (newPreset === 'deep_flow') sec = 50 * 60;
    if (newPreset === 'short_break') sec = 5 * 60;

    setTotalDurationSeconds(sec);
    setSecondsRemaining(sec);
    setTargetEndTimeMs(null);
    setPausedRemainingMs(null);
    setCheckpointAcknowledged(false);
    setAccessibleAnnouncement(`Selected preset: ${newPreset}`);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = Math.max(1, Math.min(180, parseInt(customMinutesInput, 10) || 30));
    const sec = mins * 60;

    setStatus('idle');
    setPreset('custom');
    setTotalDurationSeconds(sec);
    setSecondsRemaining(sec);
    setTargetEndTimeMs(null);
    setPausedRemainingMs(null);
    setCheckpointAcknowledged(false);
    setIsCustomModalOpen(false);
    addToast({ title: `Custom Focus set to ${mins}m`, type: 'info' });
  };

  const handleStart = () => {
    const now = Date.now();
    let targetEnd: number;

    if (status === 'paused' && pausedRemainingMs !== null) {
      targetEnd = now + pausedRemainingMs;
    } else {
      targetEnd = now + totalDurationSeconds * 1000;
      setCheckpointAcknowledged(false);
    }

    setTargetEndTimeMs(targetEnd);
    setPausedRemainingMs(null);
    setStatus('running');

    if (soundscape !== 'none' && !isMuted) {
      soundscapeEngine.setSoundscape(soundscape, soundscapeVolume);
    }

    setAccessibleAnnouncement('Focus timer started.');
  };

  const handlePause = () => {
    if (status !== 'running' || targetEndTimeMs === null) return;
    const now = Date.now();
    const remainingMs = Math.max(0, targetEndTimeMs - now);

    soundscapeEngine.stop();
    setPausedRemainingMs(remainingMs);
    setTargetEndTimeMs(null);
    setStatus('paused');
    setAccessibleAnnouncement('Focus timer paused.');
  };

  const handleReset = () => {
    soundscapeEngine.stop();
    setStatus('idle');
    setSecondsRemaining(totalDurationSeconds);
    setTargetEndTimeMs(null);
    setPausedRemainingMs(null);
    setCheckpointAcknowledged(false);
    setAccessibleAnnouncement('Timer reset.');
  };

  const handleCancel = () => {
    soundscapeEngine.stop();
    setStatus('cancelled');
    setSecondsRemaining(totalDurationSeconds);
    setTargetEndTimeMs(null);
    setPausedRemainingMs(null);
    setCheckpointAcknowledged(false);
    addToast({ title: 'Session cancelled', description: 'Session was not logged.', type: 'info' });
    setAccessibleAnnouncement('Timer cancelled.');
  };

  const handleSoundscapeChange = (type: SoundscapeType) => {
    setSoundscape(type);
    if (status === 'running') {
      if (type === 'none' || isMuted) {
        soundscapeEngine.stop();
      } else {
        soundscapeEngine.setSoundscape(type, soundscapeVolume);
      }
    }
  };

  const handleVolumeChange = (vol: number) => {
    setSoundscapeVolume(vol);
    if (!isMuted && status === 'running') {
      soundscapeEngine.setVolume(vol);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (status === 'running') {
      if (nextMuted) soundscapeEngine.stop();
      else if (soundscape !== 'none') soundscapeEngine.setSoundscape(soundscape, soundscapeVolume);
    }
  };

  const testAudioChime = () => {
    playFocusCompletionChime();
    addToast({ title: 'Acoustic chime test', description: 'Tranquil harmonic resonance.', type: 'info' });
  };

  const handleSaveReflectionFromModal = async (data: {
    flowQuality: number;
    interruptionsCount: number;
    notes?: string;
    synthesizeNote: boolean;
  }) => {
    try {
      const selectedSub = subjects.find((s) => s.id === selectedSubjectId);
      await dataService.focus.saveFocusSession({
        mode: preset === 'pomodoro' ? 'pomodoro' : preset === 'deep_flow' ? 'deep_flow' : 'custom_timer',
        durationMinutes: completedSessionMinutes,
        subjectId: selectedSubjectId || undefined,
        subjectName: selectedSub?.name,
        planItemId: selectedPlanItemId || undefined,
        topic: focusTitle || 'Deep Focus Pod Session',
        title: focusTitle || 'Deep Focus Pod Session',
        completed: true,
        interruptionsCount: data.interruptionsCount,
        flowQuality: data.flowQuality,
        soundscapeType: soundscape,
        targetOutcome: targetOutcome || undefined,
        notes: data.notes
      });

      if (data.synthesizeNote && data.notes) {
        await dataService.notes.createNote({
          title: `${focusTitle} — Distillation`,
          content: `${data.notes}\n\n**Session Details:**\n- Duration: ${completedSessionMinutes}m\n- Flow Quality: ${data.flowQuality}/5\n- Target Outcome: ${targetOutcome || 'N/A'}`,
          category: 'concept',
          subjectId: selectedSubjectId || undefined,
          tags: ['focus-distillation', selectedSub?.name || 'general']
        });
      }

      addToast({
        title: 'Focus Session Completed & Recorded',
        description: `${focusTitle} (${completedSessionMinutes}m) logged.`,
        type: 'success'
      });
      handleReset();
    } catch (err) {
      console.error('Failed to save focus reflection:', err);
      addToast({ title: 'Failed to record session', type: 'error' });
    }
  };

  const selectedSub = subjects.find((s) => s.id === selectedSubjectId);
  const subjectOptions = [
    { value: '', label: 'No Subject Associated' },
    ...subjects.filter((s) => s.status !== 'archived').map((s) => ({
      value: s.id,
      label: s.name,
      badge: s.code
    }))
  ];

  // Dynamic Subject World Atmosphere Palette
  const worldOrbColor: 'coral' | 'amber' | 'lavender' | 'sage' =
    status === 'completed'
      ? 'sage'
      : status === 'paused'
      ? 'lavender'
      : (selectedSub?.color as any) || (status === 'running' ? 'coral' : 'amber');

  return (
    <div style={{ paddingBottom: 'var(--space-3xl)' }}>
      {/* Screen Reader Announcement Live Region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {accessibleAnnouncement}
      </div>

      {/* FULL ENVIRONMENT FOCUS SANCTUARY */}
      <div className={`solis-focus-sanctuary solis-focus-sanctuary--${status}`}>
        <ParallaxScene style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ParallaxLayer speed={0.05} isAbsolute>
            <AtmosphericOrb
              color={worldOrbColor}
              sizePx={480}
              top="8%"
              right="20%"
              opacity={status === 'running' ? 0.55 : 0.3}
            />
          </ParallaxLayer>

          <ParallaxLayer speed={1.0} style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Top Sanctuary Navigation Zone */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-lg)',
                padding: '0 var(--space-xs)'
              }}
            >
              <button
                type="button"
                onClick={() => navigate('/app/dashboard')}
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

              <span
                style={{
                  fontFamily: 'var(--font-interface)',
                  fontSize: 'var(--text-micro)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.45)'
                }}
              >
                Focus Room • Distraction Free
              </span>
            </div>

            {/* Soundscape Synthesizer Bar */}
            <div className="solis-soundscape-bar">
              <Headphones size={15} style={{ color: soundscape !== 'none' ? 'var(--color-coral-400)' : 'rgba(255, 255, 255, 0.4)' }} />
              <select
                value={soundscape}
                onChange={(e) => handleSoundscapeChange(e.target.value as SoundscapeType)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontFamily: 'var(--font-interface)',
                  fontSize: 'var(--text-caption)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="none" style={{ background: '#161413', color: '#fff' }}>🔇 Silent Focus</option>
                {SOUNDSCAPE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id} style={{ background: '#161413', color: '#fff' }}>
                    🎵 {preset.label}
                  </option>
                ))}
              </select>

              {soundscape !== 'none' && (
                <>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundscapeVolume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    style={{ width: '70px', accentColor: 'var(--color-coral-500)', cursor: 'pointer' }}
                    aria-label="Soundscape Volume"
                  />
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: isMuted ? 'var(--color-coral-400)' : 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                </>
              )}
            </div>

            {/* Top preset switcher & Acoustic bell */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 'var(--space-md) 0 var(--space-lg)' }}>
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
            <div style={{ width: '100%', maxWidth: '360px', marginBottom: 'var(--space-md)' }}>
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
                  onClick={handleStart}
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
                    onClick={handlePause}
                    style={{ minWidth: '140px', borderColor: 'rgba(255, 255, 255, 0.3)', color: '#fff' }}
                  >
                    Pause Flow
                  </Button>
                  <Button
                    variant="accent"
                    size="md"
                    className="tactile-press"
                    leftIcon={<Check size={16} />}
                    onClick={handleSessionComplete}
                    style={{ minWidth: '140px' }}
                  >
                    Complete
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    className="tactile-press"
                    leftIcon={<XCircle size={16} />}
                    onClick={handleCancel}
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
                    Resume Flow
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    className="tactile-press"
                    leftIcon={<Check size={16} />}
                    onClick={handleSessionComplete}
                    style={{ minWidth: '140px', borderColor: 'rgba(255, 255, 255, 0.3)', color: '#fff' }}
                  >
                    Complete
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    className="tactile-press"
                    leftIcon={<RotateCcw size={16} />}
                    onClick={handleReset}
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
                    onClick={handleReset}
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
        subjectName={selectedSub?.name}
        topicTitle={focusTitle}
        targetOutcome={targetOutcome}
        onSaveSession={handleSaveReflectionFromModal}
      />

      {/* Custom Duration Modal */}
      <Modal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        title="Custom Focus Duration"
      >
        <form onSubmit={handleApplyCustom} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Duration in Minutes (1 – 180 min)"
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
    </div>
  );
};
