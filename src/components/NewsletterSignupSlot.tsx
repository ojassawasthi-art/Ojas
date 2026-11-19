import {lazy, Suspense, useEffect, useRef, useState} from 'react';
import type {NewsletterSignupProps} from './NewsletterSignup';

const LazyNewsletterSignup = lazy(() => import('./NewsletterSignup'));

export function NewsletterSignupSlot({
  variant = 'section',
  source = 'website',
}: NewsletterSignupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return;
    }

    const node = containerRef.current;
    if (!node) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {rootMargin: '280px 0px'},
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  const minHeightClass =
    variant === 'footer' ? 'min-h-[138px]' : 'min-h-[124px]';

  const placeholder = (
    <div
      aria-hidden="true"
      className={`${minHeightClass} w-full rounded-xl border border-[var(--border)]/60 bg-[var(--surface)]/50`}
    />
  );

  return (
    <div ref={containerRef} className={minHeightClass}>
      {shouldLoad ? (
        <Suspense fallback={placeholder}>
          <LazyNewsletterSignup variant={variant} source={source} />
        </Suspense>
      ) : (
        placeholder
      )}
    </div>
  );
}
