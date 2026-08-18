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
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    if (isVisible) return 'none';
    if (direction === 'up') return 'translateY(24px)';
    if (direction === 'down') return 'translateY(-24px)';
    return 'none';
  };

  return (
    <div
      ref={elementRef}
      className={cn('solis-reveal-layer', className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `opacity 0.7s var(--ease-out-expo) ${delayMs}ms, transform 0.7s var(--ease-out-expo) ${delayMs}ms`,
        willChange: 'opacity, transform'
      }}
    >
      {children}
    </div>
  );
};
