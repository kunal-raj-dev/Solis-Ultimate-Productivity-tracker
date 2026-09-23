import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/classNames';

export interface ScrollRevealProps {
  children: React.ReactNode;
  delayMs?: number;
  direction?: 'up' | 'down' | 'none';
  threshold?: number;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delayMs = 0,
  direction = 'up',
  threshold = 0.1,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    if (mediaQuery.matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const getTransform = () => {
    if (prefersReducedMotion || isVisible) return 'none';
    if (direction === 'up') return 'translateY(20px)';
    if (direction === 'down') return 'translateY(-20px)';
    return 'none';
  };

  return (
    <div
      ref={elementRef}
      className={cn('solis-reveal-layer', className)}
      style={{
        opacity: isVisible || prefersReducedMotion ? 1 : 0,
        transform: getTransform(),
        transition: prefersReducedMotion
          ? 'none'
          : `opacity 0.5s var(--ease-out-expo) ${delayMs}ms, transform 0.5s var(--ease-out-expo) ${delayMs}ms`,
        willChange: prefersReducedMotion ? 'auto' : 'opacity, transform'
      }}
    >
      {children}
    </div>
  );
};
