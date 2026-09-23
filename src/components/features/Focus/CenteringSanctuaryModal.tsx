import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, ArrowRight, Volume2, VolumeX, Wind } from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import './CenteringSanctuaryModal.css';

export type BreathingProtocol = 'coherent' | 'box' | 'relax_478';

export interface CenteringSanctuaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBeginFocus: () => void;
}

interface PhaseConfig {
  name: 'inhale' | 'hold' | 'exhale' | 'rest';
  label: string;
  subtext: string;
  durationSeconds: number;
}

const PROTOCOLS: Record<BreathingProtocol, { label: string; description: string; phases: PhaseConfig[] }> = {
  coherent: {
    label: 'Resonant Coherence (5.5s)',
    description: 'Harmonizes heart rate variability (HRV) and cerebral oxygenation.',
    phases: [
      { name: 'inhale', label: 'Inhale deeply', subtext: 'Slowly through your nose, expanding your diaphragm', durationSeconds: 5.5 },
      { name: 'exhale', label: 'Exhale slowly', subtext: 'Gently release through the mouth, letting shoulders drop', durationSeconds: 5.5 }
    ]
  },
  box: {
    label: 'Box Breathing (4-4-4-4)',
    description: 'Navy SEAL grounding practice to eliminate mental turbulence.',
    phases: [
      { name: 'inhale', label: 'Inhale', subtext: 'Fill the lungs evenly', durationSeconds: 4 },
      { name: 'hold', label: 'Hold breath', subtext: 'Maintain gentle stillness without tension', durationSeconds: 4 },
      { name: 'exhale', label: 'Exhale', subtext: 'Smooth, steady emptying of breath', durationSeconds: 4 },
      { name: 'rest', label: 'Hold empty', subtext: 'Rest peacefully in empty stillness', durationSeconds: 4 }
    ]
  },
  relax_478: {
    label: '4-7-8 Deep Calm',
    description: 'Fast parasympathetic vagal stimulation to dissolve tension.',
    phases: [
      { name: 'inhale', label: 'Inhale', subtext: 'Quietly through the nose for 4 counts', durationSeconds: 4 },
      { name: 'hold', label: 'Hold breath', subtext: 'Retain the oxygen gently for 7 counts', durationSeconds: 7 },
      { name: 'exhale', label: 'Exhale completely', subtext: 'Whoosh out through your mouth for 8 counts', durationSeconds: 8 }
    ]
  }
};

export const CenteringSanctuaryModal: React.FC<CenteringSanctuaryModalProps> = ({
  isOpen,
  onClose,
  onBeginFocus
}) => {
  const [protocol, setProtocol] = useState<BreathingProtocol>('coherent');
  const [isActive, setIsActive] = useState(true);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseSecondsRemaining, setPhaseSecondsRemaining] = useState<number>(5.5);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const activeConfig = PROTOCOLS[protocol];
  const activePhase = activeConfig.phases[currentPhaseIndex] || activeConfig.phases[0];

  // Zero-asset gentle bell tone synthesized via Web Audio API
  const playPhaseChime = useCallback((frequency = 432) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.25);
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled]);

  // Clean up Web Audio Context on unmount to prevent resource leaks
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  // Reset phase when protocol changes
  useEffect(() => {
    setCurrentPhaseIndex(0);
    setPhaseSecondsRemaining(PROTOCOLS[protocol].phases[0].durationSeconds);
    setCompletedCycles(0);
  }, [protocol]);

  // Advance phase helper called outside render state setters
  const advancePhase = useCallback(() => {
    const nextIndex = (currentPhaseIndex + 1) % activeConfig.phases.length;
    if (nextIndex === 0) {
      setCompletedCycles((c) => c + 1);
    }
    setCurrentPhaseIndex(nextIndex);
    const nextPhase = activeConfig.phases[nextIndex];
    setPhaseSecondsRemaining(nextPhase.durationSeconds);
    // Chime frequency: Inhale 432Hz, Exhale 324Hz, Hold 384Hz
    const freq = nextPhase.name === 'inhale' ? 432 : nextPhase.name === 'exhale' ? 324 : 384;
    playPhaseChime(freq);
  }, [currentPhaseIndex, activeConfig.phases, playPhaseChime]);

  // Interval timer for breathing loop
  useEffect(() => {
    if (!isOpen || !isActive) return;

    const interval = setInterval(() => {
      setPhaseSecondsRemaining((prev) => {
        const next = Math.round((prev - 0.1) * 10) / 10;
        return next <= 0 ? 0 : next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isActive]);

  // When phase seconds hit 0, advance phase cleanly
  useEffect(() => {
    if (phaseSecondsRemaining <= 0 && isOpen && isActive) {
      advancePhase();
    }
  }, [phaseSecondsRemaining, isOpen, isActive, advancePhase]);

  if (!isOpen) return null;

  return (
    <div
      className="solis-centering-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Centering Sanctuary Breathwork Pacer"
    >
      <div className="solis-centering-modal">
        {/* Header */}
        <div className="solis-centering-header">
          <div className="solis-centering-title-wrap">
            <Wind size={18} style={{ color: 'var(--color-sage-400, #4A7C59)' }} aria-hidden="true" />
            <span className="solis-centering-title">Centering Sanctuary</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="solis-drift-pad__close"
              onClick={() => setSoundEnabled((v) => !v)}
              title={soundEnabled ? 'Mute Chime' : 'Unmute Chime'}
              aria-label={soundEnabled ? 'Mute Chime' : 'Unmute Chime'}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              type="button"
              className="solis-drift-pad__close"
              onClick={onClose}
              aria-label="Close Centering Modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Protocol Selector */}
        <div className="solis-centering-protocol-pills">
          {(Object.keys(PROTOCOLS) as BreathingProtocol[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`solis-protocol-pill ${protocol === key ? 'solis-protocol-pill--active' : ''}`}
              onClick={() => setProtocol(key)}
            >
              {PROTOCOLS[key].label}
            </button>
          ))}
        </div>

        {/* Animated Sacred Geometry Breathing Orb */}
        <div className="solis-breath-stage">
          <div className="solis-breath-ring-outer" />
          <div className={`solis-breath-orb solis-breath-orb--${activePhase.name}`}>
            <span className="solis-breath-seconds">{Math.ceil(phaseSecondsRemaining)}s</span>
          </div>
        </div>

        {/* Phase Instruction */}
        <div className="solis-breath-instruction">{activePhase.label}</div>
        <div className="solis-breath-subtext">{activePhase.subtext}</div>

        {/* Footer with Controls and Seamless Focus Entry */}
        <div className="solis-centering-footer">
          <div className="solis-centering-cycle-info">
            {completedCycles === 0
              ? 'Cycle 1 in progress'
              : `${completedCycles} ${completedCycles === 1 ? 'cycle' : 'cycles'} completed • Cycle ${completedCycles + 1}`}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsActive((a) => !a)}
              leftIcon={isActive ? <Pause size={14} /> : <Play size={14} />}
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              {isActive ? 'Pause' : 'Resume'}
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={() => {
                onClose();
                onBeginFocus();
              }}
              rightIcon={<ArrowRight size={14} />}
            >
              Enter Focus Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
