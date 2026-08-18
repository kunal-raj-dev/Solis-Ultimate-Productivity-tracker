import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import './ParallaxScene.css';

interface ParallaxContextValue {
  progress: number; // -1 to 1 (normalized scroll position relative to viewport)
  reducedMotion: boolean;
}

const ParallaxContext = createContext<ParallaxContextValue>({
  progress: 0,
  reducedMotion: false
});

export const useParallax = () => useContext(ParallaxContext);

export interface ParallaxSceneProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Damping factor to smooth out rapid scrolls */
  damping?: number;
}

export const ParallaxScene: React.FC<ParallaxSceneProps> = ({
  children,
  className = '',
  style
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const isVisibleRef = useRef(true);
  const rafIdRef = useRef<number | null>(null);

  // Check reduced-motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Use IntersectionObserver to stop scroll processing when off-screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Passive, non-blocking scroll handler using requestAnimationFrame
  useEffect(() => {
    if (reducedMotion) return;

    const handleScroll = () => {
      if (!isVisibleRef.current || !containerRef.current) return;

      if (rafIdRef.current !== null) return;

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight || 800;

        // Calculate progress where 0 is centered in viewport
        const center = rect.top + rect.height / 2;
        const normalized = (center - viewportHeight / 2) / (viewportHeight / 2);
        const clamped = Math.max(-1.5, Math.min(1.5, normalized));

        // Sub-pixel threshold check to avoid micro-scroll virtual DOM thrashing
        setProgress((prev) => {
          if (Math.abs(prev - clamped) < 0.008) return prev;
          return clamped;
        });
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [reducedMotion]);

  const contextValue = React.useMemo(
    () => ({ progress, reducedMotion }),
    [progress, reducedMotion]
  );

  return (
    <ParallaxContext.Provider value={contextValue}>
      <div ref={containerRef} className={`solis-parallax-scene ${className}`} style={style}>
        {children}
      </div>
    </ParallaxContext.Provider>
  );
};
