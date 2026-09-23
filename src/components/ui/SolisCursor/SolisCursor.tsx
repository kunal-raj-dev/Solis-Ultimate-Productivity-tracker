import React, { useEffect, useState, useRef } from 'react';
import './SolisCursor.css';

export const SolisCursor: React.FC = () => {
  const [cursorType, setCursorType] = useState<'default' | 'action' | 'examine' | 'drag' | 'zen'>('default');
  const [isVisible, setIsVisible] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Only run on fine pointer devices (desktop mouse/trackpad)
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Check hovered element cursor data attribute or tag
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const cursorAttr = target.closest('[data-cursor]')?.getAttribute('data-cursor');
      if (cursorAttr === 'action' || cursorAttr === 'examine' || cursorAttr === 'drag' || cursorAttr === 'zen') {
        setCursorType(cursorAttr as any);
      } else if (target.closest('button, a, input[type="submit"], [role="button"]')) {
        setCursorType('action');
      } else {
        setCursorType('default');
      }
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      ref={cursorRef}
      className={`solis-custom-cursor solis-cursor-${cursorType}`}
      aria-hidden="true"
    >
      <div className="solis-cursor-dot" />
      <div className="solis-cursor-ring" />
      {cursorType === 'examine' && <span className="solis-cursor-label">VIEW</span>}
      {cursorType === 'drag' && <span className="solis-cursor-label">↔</span>}
    </div>
  );
};
