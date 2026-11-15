import {useEffect, useRef, useState} from 'react';
import {siteContent} from '../content/site';

/**
 * PORTRAIT ARCH FRAME
 * ---------------------------------------------------------------------------
 * To swap the monogram fallback for a real portrait:
 * 1. Save your portrait image as `public/images/ojas.jpg` (recommended 4:5 ratio).
 * 2. The browser will automatically load `/images/ojas.jpg` and replace the "OA" frame.
 */
export function PortraitArch() {
  const [imgFailed, setImgFailed] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState({x: 0, y: 0});

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (reduced || isTouch) return;

    const onMouseMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      setParallax({x: nx * 14, y: ny * 14});
    };

    window.addEventListener('mousemove', onMouseMove, {passive: true});
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <div
      ref={frameRef}
      style={{
        transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)`,
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="relative mx-auto w-full max-w-[360px] lg:ml-auto lg:mr-0"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-full rounded-b-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        {!imgFailed ? (
          <img
            src={siteContent.profile.photoPath}
            alt={siteContent.profile.photoAlt}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-between bg-gradient-to-b from-[#F4F1EA] to-[#EAE4D8] p-8 text-[#0A0A0A] dark:from-[#151412] dark:to-[#0F0E0C] dark:text-[#F5F5F2]">
            <div className="pt-4 text-[11px] tracking-[0.2em] text-[var(--muted)]">
              {siteContent.profile.city} · {siteContent.profile.country}
            </div>

            <div className="flex flex-col items-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border border-[var(--accent)]/40">
                <span className="font-serif-display text-5xl tracking-tight">
                  {siteContent.profile.monogram}
                </span>
              </div>
              <p className="mt-5 font-serif-display text-2xl tracking-tight">
                {siteContent.profile.name}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {siteContent.profile.pronouns}
              </p>
            </div>

            <div className="w-full border-t border-[var(--border)] pt-3 text-center text-[11px] text-[var(--muted)]">
              Web Development · Strategy · Books
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
