import React from 'react';
import { useParallax } from './ParallaxScene';

export interface ParallaxLayerProps {
  children: React.ReactNode;
  /**
   * Depth speed multiplier:
   * 0.02 = distant background
   * 0.05 = atmospheric glow
   * 0.10 = decorative elements
   * 1.00 = standard content
   * 1.03 = subtle floating foreground
   */
  speed?: number;
  /** Maximum pixel translation bounds to avoid extreme displacement */
  maxOffsetPx?: number;
  direction?: 'vertical' | 'horizontal';
  isAbsolute?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  children,
  speed = 0.05,
  maxOffsetPx = 40,
  direction = 'vertical',
  isAbsolute = false,
  className = '',
  style
}) => {
  const { progress, reducedMotion } = useParallax();

  // If reduced motion is requested, render static layout
  if (reducedMotion || speed === 0) {
    return (
      <div
        className={`solis-parallax-layer ${isAbsolute ? 'solis-parallax-layer--absolute' : ''} ${className}`}
        style={style}
      >
        {children}
      </div>
    );
  }

  // Calculate subtle translation offset (damping extreme bounds)
  const offsetPx = Math.max(-maxOffsetPx, Math.min(maxOffsetPx, progress * speed * 100));
  const transform =
    direction === 'vertical'
      ? `translate3d(0, ${offsetPx.toFixed(2)}px, 0)`
      : `translate3d(${offsetPx.toFixed(2)}px, 0, 0)`;

  return (
    <div
      className={`solis-parallax-layer ${isAbsolute ? 'solis-parallax-layer--absolute' : ''} ${className}`}
      style={{
        ...style,
        transform
      }}
    >
      {children}
    </div>
  );
};
