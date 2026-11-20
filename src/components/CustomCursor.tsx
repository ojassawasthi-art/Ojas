import {useEffect, useRef, useState} from 'react';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [cursorMode, setCursorMode] = useState<'default' | 'pointer' | 'view'>('default');

  useEffect(() => {
    const isTouch =
      window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || reduced) return;

    setEnabled(true);

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let rafId = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }

      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-cursor="view"]')) {
        setCursorMode('view');
      } else if (target.closest('a, button, input, textarea, select, [role="button"]')) {
        setCursorMode('pointer');
      } else {
        setCursorMode('default');
      }
    };

    const animate = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove, {passive: true});
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 z-50 -mt-1 -ml-1 h-2 w-2 rounded-full bg-[var(--accent)] transition-opacity duration-150 ${
          cursorMode === 'view' ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 z-50 flex items-center justify-center rounded-full border transition-[width,height,margin,background-color,border-color] duration-200 ease-out ${
          cursorMode === 'view'
            ? '-mt-8 -ml-8 h-16 w-16 border-[var(--accent)] bg-[var(--pop)] text-[var(--pop-contrast)] shadow-md'
            : cursorMode === 'pointer'
              ? '-mt-6 -ml-6 h-12 w-12 border-[var(--accent)] bg-[var(--pop)]/45'
              : '-mt-4 -ml-4 h-8 w-8 border-[var(--accent)]/80'
        }`}
      >
        {cursorMode === 'view' && (
          <span className="text-[11px] font-semibold tracking-wider">View</span>
        )}
      </div>
    </>
  );
}
