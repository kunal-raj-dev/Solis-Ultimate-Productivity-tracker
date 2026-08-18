import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/classNames';

export interface ParallaxLayerProps {
  speed?: number; // e.g. -0.1 to 0.3
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  speed = 0.1,
  children,
  className,
  style
}) => {
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      animationFrameId = requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        setOffsetY(scrolled * speed);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [speed]);

  return (
    <div
      className={cn('solis-parallax-layer', className)}
      style={{
        transform: `translate3d(0, ${offsetY}px, 0)`,
        transition: 'transform 0.1s ease-out',
        willChange: 'transform',
        ...style
      }}
    >
      {children}
    </div>
  );
};
