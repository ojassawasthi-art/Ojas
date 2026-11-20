import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {useEffect, useRef} from 'react';
import {siteContent} from '../content/site';

gsap.registerPlugin(ScrollTrigger);

export function JourneyTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !containerRef.current || !lineRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineRef.current,
        {scaleY: 0},
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 75%',
            end: 'bottom 70%',
            scrub: 0.6,
          },
        },
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative mt-14 pl-8 sm:pl-12">
      {/* Background track */}
      <div
        aria-hidden="true"
        className="absolute top-2 bottom-2 left-2 w-px bg-[var(--border)] sm:left-3"
      />
      {/* Animated scroll-drawn line */}
      <div
        ref={lineRef}
        aria-hidden="true"
        style={{transformOrigin: 'top center'}}
        className="absolute top-2 bottom-2 left-2 w-px bg-[var(--accent)] sm:left-3"
      />

      <div className="space-y-10">
        {siteContent.journeyTimeline.map((entry) => (
          <div key={entry.id} className="relative">
            {/* Timeline node */}
            <span
              aria-hidden="true"
              className={`absolute top-2 -left-[29px] h-2.5 w-2.5 rounded-full sm:-left-[41px] ${
                entry.highlight
                  ? 'bg-[var(--accent)] ring-4 ring-[var(--accent-soft)]'
                  : 'border-2 border-[var(--accent)] bg-[var(--surface)]'
              }`}
            />

            {entry.highlight ? (
              <div className="card-elevated bg-[var(--surface)] p-7 sm:p-10">
                <p className="font-mono-tabular text-xs text-[var(--accent-text)]">
                  {entry.period} · {entry.organization}
                </p>
                <h3 className="mt-2 font-serif-display text-3xl tracking-tight text-[var(--text)] sm:text-4xl">
                  {entry.title}
                </h3>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--muted)]">
                  {siteContent.experience.vaxn.story.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
                {entry.quote && (
                  <blockquote className="mt-6 border-t border-[var(--border)] pt-5 font-serif-display text-2xl italic text-[var(--text)]">
                    &ldquo;{entry.quote}&rdquo;
                  </blockquote>
                )}
                {entry.skills && entry.skills.length > 0 && (
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[var(--muted)]">Skills:</span>
                    {entry.skills.map((skill) => (
                      <span key={skill} className="tag-pill">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="card-elevated bg-[var(--surface)] p-6 sm:p-8">
                <p className="font-mono-tabular text-xs text-[var(--accent-text)]">
                  {entry.period} · {entry.organization}
                </p>
                <h3 className="mt-1.5 font-serif-display text-2xl tracking-tight text-[var(--text)] sm:text-3xl">
                  {entry.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {entry.summary}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
