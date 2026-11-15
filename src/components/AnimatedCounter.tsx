import {useEffect, useRef, useState} from 'react';

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
}

export function AnimatedCounter({target, suffix = ''}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(target);
  const hasAnimated = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDisplayValue(target);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const duration = 1100;

          const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(1, elapsed / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.round(eased * target));
            if (progress < 1) {
              requestAnimationFrame(step);
            }
          };

          requestAnimationFrame(step);
        }
      },
      {threshold: 0.25},
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="font-mono-tabular">
      {displayValue}
      {suffix}
    </span>
  );
}
