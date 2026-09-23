import React from 'react';
import { Player } from '@remotion/player';
import { Modal } from '../../feedback/Modal/Modal';
import { CircadianFocusReel } from '../../../remotion/compositions/CircadianFocusReel';
import { Film, Sparkles, CheckCircle2 } from 'lucide-react';

export interface CircadianFocusReelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CircadianFocusReelModal: React.FC<CircadianFocusReelModalProps> = ({
  isOpen,
  onClose
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Circadian Focus Reel — Archival Motion Showcase"
      className="solis-focus-reel-modal"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Editorial Subheader */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: 'var(--bg-surface-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: 'var(--text-body-xs)',
            color: 'var(--text-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Film size={15} color="var(--accent-terracotta)" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              10-Second Programmatic Remotion Composition
            </span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
            1920×1080 • 30 FPS • 300 FRAMES
          </span>
        </div>

        {/* Remotion Embedded Player */}
        <div
          style={{
            width: '100%',
            overflow: 'hidden',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-floating)',
            backgroundColor: '#141210',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <Player
            component={CircadianFocusReel}
            durationInFrames={300}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={30}
            controls
            autoPlay
            loop
            style={{
              width: '100%',
              aspectRatio: '16/9'
            }}
          />
        </div>

        {/* Motion Architecture Breakdown */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-sm)',
            marginTop: '4px'
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-surface-secondary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
              <Sparkles size={12} color="var(--accent-terracotta)" />
              Premium Archetype
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Cubic-bezier(0.4, 0, 0.2, 1) signature curves with 0% overshoot.
            </p>
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-surface-secondary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
              <CheckCircle2 size={12} color="var(--status-success)" />
              3 Motion Layers
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Primary chronometer, secondary drop shadows, ambient breathing waves.
            </p>
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-surface-secondary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
              <Film size={12} color="var(--accent-ochre)" />
              1/3 Choreography
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Bounded screen traversal and stagger budgets strictly under 400ms.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
