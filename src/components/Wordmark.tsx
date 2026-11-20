import {motion} from 'motion/react';
import {useCallback, useEffect, useRef, useState} from 'react';

export type WordmarkVariant = 'hero' | 'loader' | 'footer';

interface WordmarkProps {
  variant: WordmarkVariant;
  animateIn?: boolean;
}

const FIRST_WORD = 'Ojas'.split('');
const SECOND_WORD = 'Awasthi'.split('');
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const STAGGER_SEC = 0.04;
const SECOND_WORD_DELAY_OFFSET_SEC = 0.27; // "Ojas" (0..0.12s) enters first, "Awasthi" 150ms later
const LETTER_DURATION_SEC = 0.58; // 0.27 + 6*0.04 + 0.58 = 1.09s total

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

function SparkleGlyph({className}: {className: string}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`wordmark-sparkle inline-block shrink-0 text-[var(--accent)] ${className}`}
    >
      <path d="M12 1.5C12.7 7.4 16.6 11.3 22.5 12C16.6 12.7 12.7 16.6 12 22.5C11.3 16.6 7.4 12.7 1.5 12C7.4 11.3 11.3 7.4 12 1.5Z" />
    </svg>
  );
}

export function Wordmark({variant, animateIn = true}: WordmarkProps) {
  const reducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLSpanElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const centersRef = useRef<{x: number; y: number}[]>([]);
  const rafRef = useRef<number>(0);
  const touchResetTimerRef = useRef<number | null>(null);
  const [entranceSettled, setEntranceSettled] = useState(
    () => reducedMotion || variant === 'footer',
  );

  const isHero = variant === 'hero';
  const isLoader = variant === 'loader';
  const isFooter = variant === 'footer';
  const enableWave = (isHero || isFooter) && !reducedMotion;
  const baseDelaySec = isLoader ? 0.28 : 0.04;

  // Enable post-entrance shimmer on Hero once entrance settles (~1.15s)
  useEffect(() => {
    if (!isHero) return;
    if (reducedMotion) {
      setEntranceSettled(true);
      return;
    }
    if (!animateIn) {
      setEntranceSettled(false);
      return;
    }
    const timer = window.setTimeout(() => setEntranceSettled(true), 1180);
    return () => window.clearTimeout(timer);
  }, [isHero, animateIn, reducedMotion]);

  // Subtle GPU-only scroll parallax on Hero (max 24px slower than page scroll)
  useEffect(() => {
    if (!isHero || reducedMotion) {
      if (rootRef.current) {
        rootRef.current.style.transform = '';
      }
      return;
    }

    let scrollRaf = 0;
    const updateParallax = () => {
      scrollRaf = 0;
      const el = rootRef.current;
      if (!el) return;
      const offset = Math.min(24, Math.max(0, window.scrollY * 0.06));
      el.style.transform =
        offset > 0.05 ? `translate3d(0, ${offset.toFixed(2)}px, 0)` : '';
    };

    const onScroll = () => {
      if (!scrollRaf) {
        scrollRaf = requestAnimationFrame(updateParallax);
      }
    };

    updateParallax();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      if (rootRef.current) {
        rootRef.current.style.transform = '';
      }
    };
  }, [isHero, reducedMotion]);

  const measureCenters = useCallback(() => {
    centersRef.current = letterRefs.current.map((el) => {
      if (!el) return {x: -9999, y: -9999};
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    });
  }, []);

  const resetWave = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    for (const el of letterRefs.current) {
      if (el) {
        el.style.transform = '';
      }
    }
  }, []);

  const applyWaveAt = useCallback(
    (clientX: number, clientY: number) => {
      if (!enableWave) return;
      if (centersRef.current.length === 0) {
        measureCenters();
      }
      const radius = isHero ? 120 : 68;
      const maxLift = isHero ? 8 : 5;
      const maxScale = 0.04;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        letterRefs.current.forEach((el, idx) => {
          if (!el) return;
          const center = centersRef.current[idx];
          if (!center) return;
          const dist = Math.hypot(clientX - center.x, clientY - center.y);
          if (dist < radius) {
            const norm = dist / radius;
            const strength = Math.pow(Math.cos((norm * Math.PI) / 2), 2);
            const lift = -(maxLift * strength);
            const scale = 1 + maxScale * strength;
            el.style.transform = `translate3d(0, ${lift.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
          } else {
            el.style.transform = '';
          }
        });
      });
    },
    [enableWave, isHero, measureCenters],
  );

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (touchResetTimerRef.current) {
        window.clearTimeout(touchResetTimerRef.current);
      }
    };
  }, []);

  const handlePointerEnter = () => {
    if (!enableWave) return;
    measureCenters();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (!enableWave) return;
    applyWaveAt(e.clientX, e.clientY);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (!enableWave) return;
    measureCenters();
    applyWaveAt(e.clientX, e.clientY);
    if (e.pointerType === 'touch') {
      if (touchResetTimerRef.current) {
        window.clearTimeout(touchResetTimerRef.current);
      }
      touchResetTimerRef.current = window.setTimeout(() => {
        resetWave();
      }, 650);
    }
  };

  const handlePointerLeave = () => {
    if (!enableWave) return;
    centersRef.current = [];
    resetWave();
  };

  const renderLetter = (
    char: string,
    globalIdx: number,
    delaySec: number,
    extraClassName = '',
  ) => {
    const shimmerClass =
      isHero && entranceSettled && !reducedMotion ? 'wordmark-shimmer' : '';
    const shimmerStyle =
      isHero && entranceSettled && !reducedMotion
        ? {animationDelay: `${(globalIdx * 0.045).toFixed(3)}s`}
        : undefined;

    if (isFooter || reducedMotion) {
      return (
        <span
          key={`${char}-${globalIdx}`}
          ref={(el) => {
            letterRefs.current[globalIdx] = el;
          }}
          className={`wordmark-wave-letter inline-block ${extraClassName}`}
        >
          <span className={`inline-block ${shimmerClass}`} style={shimmerStyle}>
            {char}
          </span>
        </span>
      );
    }

    return (
      <span
        key={`${char}-${globalIdx}`}
        ref={(el) => {
          letterRefs.current[globalIdx] = el;
        }}
        className={`wordmark-wave-letter inline-block ${extraClassName}`}
      >
        <span className="inline-block overflow-hidden align-baseline px-[0.07em] -mx-[0.07em] pt-[0.08em] -mt-[0.08em] pb-[0.16em] -mb-[0.16em]">
          <motion.span
            initial={{
              y: '110%',
              rotate: 4,
              opacity: 0,
              filter: 'blur(6px)',
            }}
            animate={
              animateIn
                ? {y: '0%', rotate: 0, opacity: 1, filter: 'blur(0px)'}
                : {y: '110%', rotate: 4, opacity: 0, filter: 'blur(6px)'}
            }
            transition={{
              duration: LETTER_DURATION_SEC,
              delay: baseDelaySec + delaySec,
              ease: EASE_OUT_EXPO,
            }}
            style={shimmerStyle}
            className={`inline-block will-change-transform ${shimmerClass}`}
          >
            {char}
          </motion.span>
        </span>
      </span>
    );
  };

  // Size tokens per variant
  const containerClass = isHero
    ? 'inline-flex max-w-full flex-col items-start gap-y-1 sm:flex-row sm:flex-nowrap sm:items-baseline sm:gap-x-[0.22em] text-[clamp(4rem,11vw,6.15rem)] xl:text-[6.75rem] leading-[0.98] will-change-transform'
    : isLoader
      ? 'inline-flex flex-wrap items-baseline justify-center gap-x-[0.22em] text-[clamp(2.75rem,8vw,4.5rem)] leading-[1.02]'
      : 'inline-flex flex-nowrap items-baseline gap-x-[0.2em] text-[1.75rem] leading-none';

  const sparkleClass = isHero
    ? 'ml-[0.18em] h-[0.26em] w-[0.26em] self-center sm:self-auto sm:-translate-y-[0.38em]'
    : isLoader
      ? 'ml-[0.16em] h-[0.25em] w-[0.25em] -translate-y-[0.34em]'
      : 'ml-[0.16em] h-[0.32em] w-[0.32em] -translate-y-[0.26em]';

  const content = (
    <span
      ref={rootRef}
      aria-hidden="true"
      onPointerEnter={enableWave ? handlePointerEnter : undefined}
      onPointerMove={enableWave ? handlePointerMove : undefined}
      onPointerDown={enableWave ? handlePointerDown : undefined}
      onPointerLeave={enableWave ? handlePointerLeave : undefined}
      onPointerCancel={enableWave ? handlePointerLeave : undefined}
      className={`select-none ${containerClass}`}
    >
      {/* First word: Instrument Serif Italic */}
      <span className="font-wordmark-serif inline-flex whitespace-nowrap tracking-[-0.025em]">
        {FIRST_WORD.map((char, idx) =>
          renderLetter(char, idx, idx * STAGGER_SEC),
        )}
      </span>

      {/* Second word: Bricolage Grotesque 800 (optical cap-height match) + underline + sparkle */}
      <span className="inline-flex items-baseline whitespace-nowrap">
        <span className="font-wordmark-grotesk relative inline-flex text-[0.78em] tracking-[-0.04em]">
          {SECOND_WORD.map((char, idx) =>
            renderLetter(
              char,
              FIRST_WORD.length + idx,
              SECOND_WORD_DELAY_OFFSET_SEC + idx * STAGGER_SEC,
            ),
          )}

          {/* Hand-drawn accent underline under "Awasthi" (Hero only) */}
          {isHero && (
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 240 16"
              fill="none"
              preserveAspectRatio="none"
              className="pointer-events-none absolute right-[-0.02em] -bottom-[0.16em] left-[-0.01em] h-[0.18em] w-[calc(100%+0.03em)] overflow-visible"
            >
              <path
                d="M 2 11.8 C 52 4.4, 122 3.2, 182 7.8 C 206 9.6, 224 8.3, 238 4.8"
                stroke="var(--accent)"
                strokeWidth="2.6"
                strokeLinecap="round"
                pathLength={1}
                className={`wordmark-underline-path ${
                  animateIn || reducedMotion
                    ? 'wordmark-underline-path--drawn'
                    : ''
                }`}
              />
            </svg>
          )}
        </span>

        {/* Tilted slowly rotating accent sparkle glyph */}
        {isFooter || reducedMotion ? (
          <SparkleGlyph className={sparkleClass} />
        ) : (
          <motion.span
            initial={{opacity: 0, scale: 0.6}}
            animate={
              animateIn ? {opacity: 1, scale: 1} : {opacity: 0, scale: 0.6}
            }
            transition={{
              duration: 0.45,
              delay: baseDelaySec + 0.72,
              ease: EASE_OUT_EXPO,
            }}
            className="inline-flex items-center"
          >
            <SparkleGlyph className={sparkleClass} />
          </motion.span>
        )}
      </span>
    </span>
  );

  if (isFooter && !reducedMotion) {
    return (
      <motion.span
        initial={{opacity: 0, y: 12}}
        whileInView={{opacity: 1, y: 0}}
        viewport={{once: true, amount: 0.4}}
        transition={{duration: 0.55, ease: EASE_OUT_EXPO}}
        className="inline-block"
      >
        {content}
      </motion.span>
    );
  }

  return content;
}
