import {ChevronLeft, ChevronRight} from 'lucide-react';
import {AnimatePresence, motion} from 'motion/react';
import {useState} from 'react';
import type {Testimonial} from '../types/database';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export function TestimonialsSection({testimonials}: TestimonialsSectionProps) {
  const [index, setIndex] = useState(0);

  // Automatically hide entire section when no approved testimonials exist
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const current = testimonials[index % testimonials.length];

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="border-t border-[var(--border)] py-28"
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs tracking-widest text-[var(--accent-text)]">
              Notes
            </p>
            <h2
              id="testimonials-heading"
              className="mt-2 font-serif-display text-4xl tracking-tight sm:text-5xl"
            >
              From people I&apos;ve worked with
            </h2>
          </div>

          {testimonials.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous testimonial"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text)] transition-colors hover:border-[var(--accent)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next testimonial"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text)] transition-colors hover:border-[var(--accent)]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-12">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={current.id}
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -10}}
              transition={{duration: 0.28, ease: [0.16, 1, 0.3, 1]}}
            >
              <p className="font-serif-display text-2xl leading-relaxed text-[var(--text)] sm:text-3xl">
                &ldquo;{current.quote}&rdquo;
              </p>
              <footer className="mt-8 flex items-center gap-4 border-t border-[var(--border)] pt-6">
                {current.avatar_url && (
                  <img
                    src={current.avatar_url}
                    alt={current.name}
                    referrerPolicy="no-referrer"
                    className="h-11 w-11 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">
                    {current.name}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {current.role}
                    {current.company ? ` · ${current.company}` : ''}
                  </p>
                </div>
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
