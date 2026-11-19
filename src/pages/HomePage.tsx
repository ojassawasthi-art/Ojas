import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {ArrowDown, ArrowUpRight, Check, Copy} from 'lucide-react';
import {motion} from 'motion/react';
import {useEffect, useMemo, useRef, useState} from 'react';
import {AnimatedCounter} from '../components/AnimatedCounter';
import {BookCover} from '../components/BookCover';
import {ContactForm} from '../components/ContactForm';
import {JourneyTimeline} from '../components/JourneyTimeline';
import {AnimatedArrow, MagneticButton} from '../components/MagneticButton';
import {PortraitArch} from '../components/PortraitArch';
import {ProjectCard} from '../components/ProjectCard';
import {SeoHead} from '../components/SeoHead';
import {TestimonialsSection} from '../components/TestimonialsSection';
import {siteContent} from '../content/site';
import {useRouter} from '../context/RouterContext';
import {getNewsletterUrl} from '../lib/newsletter';
import {buildPageSeoData} from '../lib/routeSeo';
import {getCanonicalBaseUrl} from '../lib/seo';
import type {Project, SiteSettingsMap, Testimonial} from '../types/database';

gsap.registerPlugin(ScrollTrigger);

interface HomePageProps {
  projects: Project[];
  testimonials: Testimonial[];
  settings: SiteSettingsMap;
  loading: boolean;
  introDone: boolean;
}

export function HomePage({
  projects,
  testimonials,
  settings,
  loading,
  introDone,
}: HomePageProps) {
  const {navigate, scrollToSection} = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedCredId, setCopiedCredId] = useState<string | null>(null);
  const bioRef = useRef<HTMLDivElement>(null);

  const publishedProjects = useMemo(
    () => projects.filter((p) => p.published),
    [projects],
  );

  const categories = useMemo(() => {
    const set = new Set<string>(['All', 'Web', 'E-commerce']);
    publishedProjects.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [publishedProjects]);

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'All') return publishedProjects;
    return publishedProjects.filter(
      (p) => p.category.toLowerCase() === activeCategory.toLowerCase(),
    );
  }, [publishedProjects, activeCategory]);

  // Word-by-word scroll reveal in About bio
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !bioRef.current) return;

    const words = bioRef.current.querySelectorAll('.bio-word');
    if (words.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        {opacity: 0.25},
        {
          opacity: 1,
          stagger: 0.03,
          ease: 'none',
          scrollTrigger: {
            trigger: bioRef.current,
            start: 'top 80%',
            end: 'bottom 55%',
            scrub: 0.5,
          },
        },
      );
    }, bioRef);

    return () => ctx.revert();
  }, []);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(siteContent.contact.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2200);
    } catch {
      // Clipboard blocked in some sandboxes
    }
  };

  const handleCopyCredential = async (credId: string) => {
    try {
      await navigator.clipboard.writeText(credId);
      setCopiedCredId(credId);
      setTimeout(() => setCopiedCredId(null), 2200);
    } catch {
      // Clipboard fallback
    }
  };

  const baseUrl = getCanonicalBaseUrl();
  const seo = useMemo(
    () => buildPageSeoData('/', baseUrl, publishedProjects),
    [baseUrl, publishedProjects],
  );

  const heroHeadline =
    settings.hero?.headline || siteContent.profile.siteHeadline;
  const newsletterUrl = getNewsletterUrl();

  return (
    <>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path="/"
        ogImage={seo.ogImage}
        schemas={seo.schemas}
      />

      {/* 1. HERO SECTION */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              {settings.availability?.enabled && (
                <motion.p
                  initial={{opacity: 0, y: 10}}
                  animate={introDone ? {opacity: 1, y: 0} : {opacity: 0, y: 10}}
                  transition={{duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1]}}
                  className="text-xs tracking-wide text-[var(--accent-text)]"
                >
                  {settings.availability.text} · {siteContent.profile.location}
                </motion.p>
              )}

              <div className="mt-4 overflow-hidden">
                <motion.h1
                  initial={{y: '100%', opacity: 0}}
                  animate={introDone ? {y: '0%', opacity: 1} : {y: '100%', opacity: 0}}
                  transition={{duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1]}}
                  className="font-serif-display text-[clamp(3.25rem,9vw,7.5rem)] leading-[0.94] tracking-tight text-[var(--text)]"
                >
                  {siteContent.profile.name}
                </motion.h1>
              </div>

              <motion.p
                initial={{opacity: 0, y: 14}}
                animate={introDone ? {opacity: 1, y: 0} : {opacity: 0, y: 14}}
                transition={{duration: 0.6, delay: 0.24, ease: [0.16, 1, 0.3, 1]}}
                className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)] sm:text-xl"
              >
                {heroHeadline}
              </motion.p>

              <motion.div
                initial={{opacity: 0, y: 14}}
                animate={introDone ? {opacity: 1, y: 0} : {opacity: 0, y: 14}}
                transition={{duration: 0.6, delay: 0.34, ease: [0.16, 1, 0.3, 1]}}
                className="mt-9 flex flex-wrap items-center gap-4"
              >
                <MagneticButton
                  onClick={() => scrollToSection('work')}
                  className="rounded-xl bg-[#0A0A0A] px-6 py-3.5 text-sm font-medium text-[#FAFAF8] transition-opacity hover:opacity-90 dark:bg-[#F5F5F2] dark:text-[#0A0A0A]"
                >
                  <span>View My Work</span>
                  <AnimatedArrow />
                </MagneticButton>

                <MagneticButton
                  onClick={() => scrollToSection('contact')}
                  className="rounded-xl border border-[var(--border)] bg-transparent px-6 py-3.5 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--accent)]"
                >
                  <span>Contact Me</span>
                </MagneticButton>
              </motion.div>
            </div>

            <motion.div
              initial={{opacity: 0, scale: 0.96}}
              animate={
                introDone ? {opacity: 1, scale: 1} : {opacity: 0, scale: 0.96}
              }
              transition={{duration: 0.7, delay: 0.22, ease: [0.16, 1, 0.3, 1]}}
              className="lg:col-span-5"
            >
              <PortraitArch />
            </motion.div>
          </div>

          {/* Stats row placed cleanly below hero split */}
          <div className="mt-16 grid grid-cols-2 gap-6 border-y border-[var(--border)] py-8 sm:grid-cols-3 lg:grid-cols-6">
            {siteContent.stats.map((stat) => (
              <div key={stat.id}>
                <p className="text-2xl font-medium tracking-tight text-[var(--text)] sm:text-3xl">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">{stat.label}</p>
              </div>
            ))}
            {publishedProjects.length > 0 && (
              <div>
                <p className="text-2xl font-medium tracking-tight text-[var(--text)] sm:text-3xl">
                  <AnimatedCounter target={publishedProjects.length} />
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Websites built
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between text-xs text-[var(--muted)]">
            <button
              type="button"
              onClick={() => scrollToSection('work')}
              className="inline-flex items-center gap-2 transition-colors hover:text-[var(--text)]"
            >
              <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Scroll to selected work</span>
            </button>
            <span className="hidden sm:inline">
              {siteContent.profile.linkedinHeadline}
            </span>
          </div>
        </div>
      </section>

      {/* 2. SELECTED WORK SECTION */}
      <section
        id="work"
        aria-labelledby="work-heading"
        className="border-t border-[var(--border)] py-28"
      >
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs tracking-widest text-[var(--accent-text)]">
                Selected Work
              </p>
              <h2
                id="work-heading"
                className="mt-2 font-serif-display text-4xl tracking-tight text-[var(--text)] sm:text-5xl"
              >
                Websites &amp; brand builds
              </h2>
            </div>

            <div
              role="tablist"
              aria-label="Filter projects by category"
              className="inline-flex w-fit items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1"
            >
              {categories.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                      active
                        ? 'bg-[var(--bg)] text-[var(--text)] shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-[420px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
                />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
              <p className="text-sm text-[var(--muted)]">
                No published projects found in this category.
              </p>
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          <div className="mt-10 flex justify-end">
            <a
              href="/work"
              onClick={(e) => {
                e.preventDefault();
                navigate('/work');
              }}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text)] transition-colors hover:text-[var(--accent-text)]"
            >
              <span>Browse all work</span>
              <AnimatedArrow />
            </a>
          </div>
        </div>
      </section>

      {/* 3. INFINITE SKILLS MARQUEE */}
      <div
        aria-label="Core skills"
        className="marquee-wrapper overflow-hidden border-y border-[var(--border)] bg-[var(--surface)] py-5"
      >
        <div className="animate-marquee items-center">
          {[...siteContent.skillsMarquee, ...siteContent.skillsMarquee].map(
            (skill, idx) => (
              <span
                key={`${skill}-${idx}`}
                className="flex items-center text-sm tracking-wide text-[var(--text)] whitespace-nowrap"
              >
                <span className="px-5">{skill}</span>
                <span aria-hidden="true" className="text-[var(--accent)]">
                  ·
                </span>
              </span>
            ),
          )}
        </div>
      </div>

      {/* 4. SERVICES SECTION */}
      <section
        id="services"
        aria-labelledby="services-heading"
        className="py-28"
      >
        <div className="mx-auto max-w-[1200px] px-6">
          <div>
            <p className="text-xs tracking-widest text-[var(--accent-text)]">
              Capabilities
            </p>
            <h2
              id="services-heading"
              className="mt-2 font-serif-display text-4xl tracking-tight text-[var(--text)] sm:text-5xl"
            >
              How I help brands grow
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {siteContent.services.map((service) => (
              <div
                key={service.index}
                className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-7 transition-colors hover:border-[var(--accent)]/60"
              >
                <div>
                  <span className="font-mono-tabular text-xs text-[var(--accent-text)]">
                    {service.index}.
                  </span>
                  <h3 className="mt-3 font-serif-display text-2xl tracking-tight text-[var(--text)]">
                    {service.title}
                  </h3>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
                  {service.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-end">
            <a
              href="/services"
              onClick={(e) => {
                e.preventDefault();
                navigate('/services');
              }}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text)] transition-colors hover:text-[var(--accent-text)]"
            >
              <span>Explore services &amp; stack</span>
              <AnimatedArrow />
            </a>
          </div>
        </div>
      </section>

      {/* 5. ABOUT SECTION */}
      <section
        id="about"
        aria-labelledby="about-heading"
        className="border-t border-[var(--border)] py-28"
      >
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-xs tracking-widest text-[var(--accent-text)]">
                About
              </p>
              <h2
                id="about-heading"
                className="mt-2 font-serif-display text-4xl tracking-tight text-[var(--text)] sm:text-5xl"
              >
                Commerce, code, and human behavior
              </h2>

              <div ref={bioRef} className="mt-8 space-y-5 text-base leading-relaxed text-[var(--text)] sm:text-lg">
                {siteContent.profile.bioParagraphs.map((paragraph, pIdx) => (
                  <p key={pIdx}>
                    {paragraph.split(' ').map((word, wIdx) => (
                      <span
                        key={`${pIdx}-${wIdx}`}
                        className="bio-word inline-block"
                      >
                        {word}&nbsp;
                      </span>
                    ))}
                  </p>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 sm:p-8">
                <h3 className="font-serif-display text-2xl tracking-tight text-[var(--text)]">
                  Quick facts
                </h3>
                <dl className="mt-6 divide-y divide-[var(--border)]">
                  {siteContent.profile.quickFacts.map((fact) => (
                    <div key={fact.label} className="py-4 first:pt-0 last:pb-0">
                      <dt className="text-xs text-[var(--muted)]">
                        {fact.label}
                      </dt>
                      <dd className="mt-1 text-sm leading-relaxed text-[var(--text)]">
                        {fact.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-6 border-t border-[var(--border)] pt-5">
                  <a
                    href="/about"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/about');
                    }}
                    className="group inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-text)]"
                  >
                    <span>Read full profile &amp; FAQ</span>
                    <AnimatedArrow />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. JOURNEY TIMELINE SECTION */}
      <section
        id="journey"
        aria-labelledby="journey-heading"
        className="border-t border-[var(--border)] py-28"
      >
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="max-w-2xl">
            <p className="text-xs tracking-widest text-[var(--accent-text)]">
              Journey
            </p>
            <h2
              id="journey-heading"
              className="mt-2 font-serif-display text-4xl tracking-tight text-[var(--text)] sm:text-5xl"
            >
              Experience &amp; education
            </h2>
          </div>

          <JourneyTimeline />
        </div>
      </section>

      {/* 7. BOOKS SECTION */}
      <section
        id="books"
        aria-labelledby="books-heading"
        className="border-t border-[var(--border)] py-28"
      >
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs tracking-widest text-[var(--accent-text)]">
                Publications
              </p>
              <h2
                id="books-heading"
                className="mt-2 font-serif-display text-4xl tracking-tight text-[var(--text)] sm:text-5xl"
              >
                Published books
              </h2>
            </div>

            <a
              href="/books"
              onClick={(e) => {
                e.preventDefault();
                navigate('/books');
              }}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text)] hover:text-[var(--accent-text)]"
            >
              <span>Dedicated books page</span>
              <AnimatedArrow />
            </a>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {siteContent.books.map((book) => {
              const effectiveLinks = book.buyUrl && book.id === 'echoes-of-love'
                ? [{label: 'Buy book', url: book.buyUrl}, ...book.links]
                : book.links;

              return (
                <article
                  key={book.id}
                  className="flex flex-col gap-8 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-7 sm:flex-row sm:p-8"
                >
                  <div className="shrink-0 sm:w-[210px]">
                    <BookCover
                      title={book.title}
                      subtitle={book.subtitle}
                      author={book.author}
                      coverImage={book.coverImage}
                      motif={book.motif}
                      publisher={book.publisher}
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                        <span>{book.publisher}</span>
                        {book.publishedDate && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-tabular">
                              {book.publishedDate}
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="mt-2 font-serif-display text-3xl tracking-tight text-[var(--text)]">
                        {book.title}
                      </h3>
                      {book.subtitle && (
                        <p className="mt-1 text-sm font-medium text-[var(--accent-text)]">
                          {book.subtitle}
                        </p>
                      )}

                      <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
                        {book.description}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3 border-t border-[var(--border)] pt-5">
                      {effectiveLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-text)]"
                        >
                          <span>{link.label}</span>
                          <ArrowUpRight
                            aria-hidden="true"
                            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. CREDENTIALS SECTION */}
      <section
        id="credentials"
        aria-labelledby="credentials-heading"
        className="border-t border-[var(--border)] py-28"
      >
        <div className="mx-auto max-w-[1200px] px-6">
          <div>
            <p className="text-xs tracking-widest text-[var(--accent-text)]">
              Certifications
            </p>
            <h2
              id="credentials-heading"
              className="mt-2 font-serif-display text-4xl tracking-tight text-[var(--text)] sm:text-5xl"
            >
              Verified credentials
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {siteContent.certifications.map((cert) => (
              <article
                key={cert.id}
                className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-7"
              >
                <div>
                  <p className="text-xs text-[var(--accent-text)]">
                    {cert.issuer}
                  </p>
                  <h3 className="mt-2 font-serif-display text-2xl tracking-tight text-[var(--text)]">
                    {cert.title}
                  </h3>
                  <p className="font-mono-tabular mt-2 text-xs text-[var(--muted)]">
                    {cert.issued}
                    {cert.expires ? ` · ${cert.expires}` : ''}
                  </p>

                  {cert.skills.length > 0 && (
                    <p className="mt-4 text-xs leading-relaxed text-[var(--muted)]">
                      {cert.skills.join(' · ')}
                    </p>
                  )}

                  {cert.credentialId && (
                    <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5">
                      <span className="font-mono-tabular truncate text-[11px] text-[var(--text)]">
                        {cert.credentialId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCredential(cert.credentialId)}
                        aria-label={`Copy credential ID ${cert.credentialId}`}
                        className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-[var(--accent-text)]"
                      >
                        {copiedCredId === cert.credentialId ? (
                          <>
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {cert.verifyUrl && (
                  <div className="mt-6 border-t border-[var(--border)] pt-4">
                    <a
                      href={cert.verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text)] transition-colors hover:text-[var(--accent-text)]"
                    >
                      <span>Verify credential</span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </a>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 9. TESTIMONIALS (automatically hidden when empty) */}
      <TestimonialsSection testimonials={testimonials} />

      {/* 10. NEWSLETTER SECTION (hidden when VITE_NEWSLETTER_URL is empty) */}
      {newsletterUrl && (
        <section
          id="newsletter"
          aria-labelledby="newsletter-heading"
          className="border-t border-[var(--border)] py-24"
        >
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="flex flex-col justify-between gap-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 sm:p-10 lg:flex-row lg:items-center">
              <div className="max-w-xl">
                <p className="text-xs tracking-widest text-[var(--accent-text)]">
                  Newsletter
                </p>
                <h2
                  id="newsletter-heading"
                  className="mt-2 font-serif-display text-3xl leading-[1.08] tracking-tight text-[var(--text)] sm:text-4xl"
                >
                  Get new posts by email
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                  Occasional emails on web development, digital marketing and
                  psychology. Unsubscribe anytime.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:shrink-0">
                <MagneticButton
                  href={newsletterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-[#0A0A0A] px-6 py-3.5 text-sm font-medium text-[#FAFAF8] transition-opacity hover:opacity-90 dark:bg-[#F5F5F2] dark:text-[#0A0A0A]"
                >
                  <span>Subscribe on beehiiv</span>
                  <AnimatedArrow />
                </MagneticButton>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 11. CONTACT SECTION */}
      <section
        id="contact"
        aria-labelledby="contact-heading"
        className="border-t border-[var(--border)] py-28"
      >
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-xs tracking-widest text-[var(--accent-text)]">
                Contact
              </p>
              <h2
                id="contact-heading"
                className="mt-2 font-serif-display text-5xl leading-[1.02] tracking-tight text-[var(--text)] sm:text-6xl"
              >
                Let&apos;s build something together
              </h2>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${siteContent.contact.email}`}
                  className="text-lg font-medium text-[var(--text)] underline decoration-[var(--accent)] underline-offset-4 transition-opacity hover:opacity-80 sm:text-xl"
                >
                  {siteContent.contact.email}
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition-colors hover:border-[var(--accent)]"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[var(--accent-text)]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                {siteContent.contact.socials.map((social) => {
                  const isExternal = social.url.startsWith('http');
                  return (
                    <a
                      key={social.name}
                      href={social.url}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                      className="group flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm transition-colors hover:border-[var(--accent)]"
                    >
                      <div>
                        <p className="font-medium text-[var(--text)]">
                          {social.name}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {social.handle}
                        </p>
                      </div>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="h-4 w-4 text-[var(--muted)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--text)]"
                      />
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-7 sm:p-10">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
