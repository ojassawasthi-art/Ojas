import {motion} from 'motion/react';
import {useEffect, useState} from 'react';
import {siteContent} from '../content/site';

interface LoadingCurtainProps {
  onComplete: () => void;
}

const LETTERS = 'OJAS AWASTHI'.split('');

export function LoadingCurtain({onComplete}: LoadingCurtainProps) {
  const [shouldShow, setShouldShow] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isCrawler =
      Boolean(navigator.webdriver) ||
      /bot|googlebot|crawler|spider|bingbot|lighthouse|pagespeed|duckduckbot|yandex|baiduspider|slurp|headless/i.test(
        navigator.userAgent || '',
      );
    if (isCrawler) return false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return false;
    try {
      return !sessionStorage.getItem('oa_intro_seen');
    } catch {
      return false;
    }
  });

  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!shouldShow) {
      onComplete();
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const startTime = performance.now();
    const countDuration = 2200; // ms for 0 -> 100
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const ratio = Math.min(1, elapsed / countDuration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - ratio, 3);
      setProgress(Math.round(eased * 100));

      if (ratio < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setExiting(true);
          try {
            sessionStorage.setItem('oa_intro_seen', '1');
          } catch {
            // Ignore
          }
          setTimeout(() => {
            document.body.style.overflow = previousOverflow;
            setShouldShow(false);
            onComplete();
          }, 820);
        }, 380);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      document.body.style.overflow = previousOverflow;
    };
  }, [shouldShow, onComplete]);

  if (!shouldShow) {
    return null;
  }

  return (
    <motion.div
      aria-hidden="true"
      initial={{y: 0}}
      animate={{y: exiting ? '-100%' : 0}}
      transition={{duration: 0.8, ease: [0.76, 0, 0.24, 1]}}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A] px-6 text-[#F5F5F2]"
    >
      <div className="w-full max-w-xl">
        {/* 1. Thin center line drawing across */}
        <div className="relative h-px w-full overflow-hidden bg-[#1F1F1F]">
          <motion.div
            initial={{scaleX: 0}}
            animate={{scaleX: 1}}
            transition={{duration: 0.9, ease: [0.16, 1, 0.3, 1]}}
            style={{transformOrigin: 'left center'}}
            className="h-full w-full bg-[#C8A97E]"
          />
        </div>

        {/* 2. OJAS AWASTHI masked letter-by-letter reveal */}
        <div className="my-8 flex flex-wrap items-center justify-center overflow-hidden">
          {LETTERS.map((char, idx) => (
            <span key={`${char}-${idx}`} className="inline-block overflow-hidden">
              <motion.span
                initial={{y: '115%', opacity: 0}}
                animate={{y: '0%', opacity: 1}}
                transition={{
                  duration: 0.65,
                  delay: 0.35 + idx * 0.045,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="inline-block font-serif-display text-4xl tracking-wide sm:text-6xl"
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            </span>
          ))}
        </div>

        {/* 3. Synced progress line & 0-100% counter */}
        <div className="flex items-center gap-4">
          <div className="relative h-px flex-1 overflow-hidden bg-[#1F1F1F]">
            <div
              className="h-full w-full bg-[#F5F5F2] transition-transform duration-75"
              style={{
                transform: `scaleX(${progress / 100})`,
                transformOrigin: 'left center',
              }}
            />
          </div>
          <span className="font-mono-tabular w-12 text-right text-xs text-[#C8A97E]">
            {progress}%
          </span>
        </div>

        {/* 4. Tagline fade-in */}
        <motion.p
          initial={{opacity: 0, y: 8}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.6, delay: 1.25, ease: [0.16, 1, 0.3, 1]}}
          className="mt-6 text-center text-xs tracking-widest text-[#8A8A85]"
        >
          {siteContent.profile.loaderTagline}
        </motion.p>
      </div>
    </motion.div>
  );
}
