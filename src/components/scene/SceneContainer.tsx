import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../../utils/classNames';
import './SceneContainer.css';

export interface SceneContainerProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
  variant?: 'canvas' | 'surface' | 'dark' | 'sanctuary';
  /** Optional narrative section label (e.g. '01 // ARRIVAL', '02 // MOMENTUM') */
  sceneNumber?: string;
  sceneTitle?: string;
  hasDivider?: boolean;
}

export const SceneContainer: React.FC<SceneContainerProps> = ({
  id,
  className,
  children,
  variant = 'surface',
  sceneNumber,
  sceneTitle,
  hasDivider = false
}) => {
  const containerRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={containerRef}
      id={id}
      className={cn(
        'solis-scene',
        `solis-scene--${variant}`,
        inView && 'solis-scene--in-view',
        hasDivider && 'solis-scene--with-divider',
        className
      )}
    >
      {(sceneNumber || sceneTitle) && (
        <div className="solis-scene__header">
          {sceneNumber && <span className="solis-scene__number">{sceneNumber}</span>}
          {sceneTitle && <span className="solis-scene__title">{sceneTitle}</span>}
        </div>
      )}
      <div className="solis-scene__body">{children}</div>
    </section>
  );
};
