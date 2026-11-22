import {ArrowUpRight, Mail} from 'lucide-react';
import {useMemo} from 'react';
import {AnimatedArrow} from '../components/MagneticButton';
import {ProjectCard} from '../components/ProjectCard';
import {SeoHead} from '../components/SeoHead';
import {
  LOCAL_SEO_PAGES,
  type LocalSeoPageData,
} from '../content/localSeoPages';
import {siteContent} from '../content/site';
import {useRouter} from '../context/RouterContext';
import {buildPageSeoData} from '../lib/routeSeo';
import {getCanonicalBaseUrl} from '../lib/seo';
import type {Project} from '../types/database';

interface LocalSeoPageProps {
  page: LocalSeoPageData;
  projects: Project[];
  loading: boolean;
}

const PORTFOLIO_SELF_PROJECT: Project = {
  id: 'work-ojasawasthii-portfolio',
  title: 'Ojas Awasthi Portfolio & SEO Platform',
  slug: 'ojas-awasthi-portfolio',
  description:
    'Pre-rendered Vite, React, TypeScript, and Supabase personal platform with dynamic XML sitemap, Schema.org structured data, private admin panel, and fast mobile loading.',
  long_description: null,
  live_url: 'https://ojasawasthii.vercel.app',
  github_url: null,
  thumbnail_url: null,
  images: [],
  tech_stack: ['React', 'Vite', 'Tailwind CSS', 'Supabase', 'Technical SEO'],
  category: 'Web',
  year: '2026',
  featured: true,
  sort_order: 3,
  published: true,
  created_at: '2026-08-01T00:00:00.000Z',
  status_tag: 'Live',
  role: 'Designer & Developer',
};

export function LocalSeoPage({page, projects, loading}: LocalSeoPageProps) {
  const {navigate} = useRouter();
  const baseUrl = getCanonicalBaseUrl();

  const publishedProjects = useMemo(() => {
    const live = projects.filter((p) => p.published);
    return live.slice(0, 4);
  }, [projects]);

  // Show 3–4 real project examples from Work (supplementing with Ojas's own live portfolio build only when fewer than 3 projects are in fallback seed)
  const showPortfolioCard = !loading && publishedProjects.length < 3;

  const seo = useMemo(
    () => buildPageSeoData(page.path, baseUrl, publishedProjects),
    [page.path, baseUrl, publishedProjects],
  );

  const siblingPages = useMemo(
    () => LOCAL_SEO_PAGES.filter((item) => item.path !== page.path),
    [page.path],
  );

  return (
    <>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path={page.path}
        ogImage={seo.ogImage}
        schemas={seo.schemas}
      />

      <article className="pt-32 pb-28">
        <div className="mx-auto max-w-[1200px] px-6">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-8 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]"
          >
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              className="transition-colors hover:text-[var(--text)]"
            >
              Home
            </a>
            <span aria-hidden="true">/</span>
            <a
              href="/services"
              onClick={(e) => {
                e.preventDefault();
                navigate('/services');
              }}
              className="transition-colors hover:text-[var(--text)]"
            >
              Services
            </a>
            <span aria-hidden="true">/</span>
            <span className="text-[var(--text)]">{page.navLabel}</span>
          </nav>

          {/* Hero Intro */}
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="text-xs tracking-widest text-[var(--accent-text)]">
                {page.eyebrow}
              </p>
              <h1 className="mt-2 font-serif-display text-4xl leading-[1.04] tracking-tight text-[var(--text)] sm:text-6xl">
                {page.h1}
              </h1>

              <div className="mt-6 space-y-4 text-base leading-relaxed text-[var(--muted)]">
                {page.introParagraphs.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/contact');
                  }}
                  className="group inline-flex items-center gap-2 rounded-xl bg-[#0A0A0A] px-6 py-3.5 text-sm font-medium text-[#FAFAF8] transition-opacity hover:opacity-90 dark:bg-[#F5F5F2] dark:text-[#0A0A0A]"
                >
                  <span>Start a project conversation</span>
                  <AnimatedArrow />
                </a>
                <a
                  href={`mailto:${siteContent.contact.email}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-transparent px-5 py-3.5 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--accent)]"
                >
                  <Mail className="h-4 w-4 text-[var(--accent-text)]" aria-hidden="true" />
                  <span>{siteContent.contact.email}</span>
                </a>
              </div>
            </div>

            <aside className="lg:col-span-4">
              <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <img
                  src={siteContent.profile.photoPath}
                  alt={page.portraitAlt}
                  width={480}
                  height={600}
                  loading="eager"
                  decoding="async"
                  className="aspect-[4/5] w-full object-cover object-top"
                />
                <div className="border-t border-[var(--border)] p-5">
                  <p className="font-serif-display text-xl text-[var(--text)]">
                    {siteContent.profile.name}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                    {page.portraitCaption}
                  </p>
                </div>
              </div>
            </aside>
          </div>

          {/* What Ojas Does */}
          <section
            aria-labelledby="what-i-do-heading"
            className="mt-20 border-t border-[var(--border)] pt-16"
          >
            <div className="max-w-3xl">
              <p className="text-xs tracking-widest text-[var(--accent-text)]">
                Scope &amp; Deliverables
              </p>
              <h2
                id="what-i-do-heading"
                className="mt-2 font-serif-display text-3xl tracking-tight text-[var(--text)] sm:text-4xl"
              >
                {page.whatIDoHeading}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                {page.whatIDoIntro}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              {page.deliverables.map((item, idx) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7"
                >
                  <span className="font-mono-tabular text-xs text-[var(--accent-text)]">
                    0{idx + 1}.
                  </span>
                  <h3 className="mt-2 font-serif-display text-2xl tracking-tight text-[var(--text)]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-7 sm:p-9">
              <h3 className="font-serif-display text-2xl tracking-tight text-[var(--text)] sm:text-3xl">
                {page.contextHeading}
              </h3>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                {page.contextParagraphs.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
          </section>

          {/* 4-Step Process */}
          <section
            aria-labelledby="process-heading"
            className="mt-20 border-t border-[var(--border)] pt-16"
          >
            <div className="max-w-2xl">
              <p className="text-xs tracking-widest text-[var(--accent-text)]">
                Process
              </p>
              <h2
                id="process-heading"
                className="mt-2 font-serif-display text-3xl tracking-tight text-[var(--text)] sm:text-4xl"
              >
                {page.processHeading}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                {page.processIntro}
              </p>
            </div>

            <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {page.process.map((step) => (
                <li
                  key={step.number}
                  className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6"
                >
                  <div>
                    <span className="font-mono-tabular text-xs text-[var(--accent-text)]">
                      {step.number}.
                    </span>
                    <h3 className="mt-2 font-serif-display text-2xl tracking-tight text-[var(--text)]">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Real Project Examples from Work */}
          <section
            aria-labelledby="examples-heading"
            className="mt-20 border-t border-[var(--border)] pt-16"
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <p className="text-xs tracking-widest text-[var(--accent-text)]">
                  Selected Work
                </p>
                <h2
                  id="examples-heading"
                  className="mt-2 font-serif-display text-3xl tracking-tight text-[var(--text)] sm:text-4xl"
                >
                  {page.projectsHeading}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  {page.projectsIntro}
                </p>
              </div>

              <a
                href="/work"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/work');
                }}
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text)] transition-colors hover:text-[var(--accent-text)]"
              >
                <span>View all work</span>
                <AnimatedArrow />
              </a>
            </div>

            {loading ? (
              <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-[380px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
                  />
                ))}
              </div>
            ) : (
              <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
                {publishedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
                {showPortfolioCard && (
                  <article className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                        <span>{PORTFOLIO_SELF_PROJECT.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">
                          {PORTFOLIO_SELF_PROJECT.year}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{PORTFOLIO_SELF_PROJECT.status_tag}</span>
                      </div>
                      <h3 className="mt-3 font-serif-display text-3xl tracking-tight text-[var(--text)]">
                        {PORTFOLIO_SELF_PROJECT.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                        {PORTFOLIO_SELF_PROJECT.description}
                      </p>
                      <p className="mt-4 text-xs text-[var(--muted)]">
                        {PORTFOLIO_SELF_PROJECT.tech_stack.join(' · ')}
                      </p>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-4 text-xs">
                      <a
                        href="/blog/web-developer-in-lucknow-fast-websites"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/blog/web-developer-in-lucknow-fast-websites');
                        }}
                        className="group inline-flex items-center gap-1.5 font-medium text-[var(--text)] transition-colors hover:text-[var(--accent-text)]"
                      >
                        <span>Read technical breakdown</span>
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                      <a
                        href="/work"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/work');
                        }}
                        className="font-medium text-[var(--accent-text)] transition-opacity hover:opacity-80"
                      >
                        Browse Work section
                      </a>
                    </div>
                  </article>
                )}
              </div>
            )}
          </section>

          {/* Visible FAQ matching FAQPage JSON-LD */}
          <section
            aria-labelledby="faq-heading"
            className="mt-20 border-t border-[var(--border)] pt-16"
          >
            <div className="max-w-2xl">
              <p className="text-xs tracking-widest text-[var(--accent-text)]">
                Common Questions
              </p>
              <h2
                id="faq-heading"
                className="mt-2 font-serif-display text-3xl tracking-tight text-[var(--text)] sm:text-4xl"
              >
                Frequently asked questions
              </h2>
            </div>

            <dl className="mt-10 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 sm:px-8">
              {page.faqs.map((faq) => (
                <div key={faq.question} className="py-6">
                  <dt className="text-base font-medium text-[var(--text)]">
                    {faq.question}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Contact CTA */}
          <section
            aria-labelledby="cta-heading"
            className="mt-20 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-10"
          >
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <h2
                  id="cta-heading"
                  className="font-serif-display text-3xl tracking-tight text-[var(--text)] sm:text-4xl"
                >
                  {page.ctaHeading}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                  {page.ctaCopy}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:shrink-0">
                <a
                  href="/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/contact');
                  }}
                  className="group inline-flex items-center gap-2 rounded-xl bg-[#0A0A0A] px-6 py-3.5 text-sm font-medium text-[#FAFAF8] transition-opacity hover:opacity-90 dark:bg-[#F5F5F2] dark:text-[#0A0A0A]"
                >
                  <span>Contact Ojas Awasthi</span>
                  <AnimatedArrow />
                </a>
              </div>
            </div>
          </section>

          {/* Cross-links to sibling local service pages & Services overview */}
          <section
            aria-labelledby="related-services-heading"
            className="mt-16 border-t border-[var(--border)] pt-12"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2
                id="related-services-heading"
                className="font-serif-display text-2xl tracking-tight text-[var(--text)]"
              >
                Related services across Lucknow &amp; Gonda
              </h2>
              <a
                href="/services"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/services');
                }}
                className="text-xs font-medium text-[var(--accent-text)] transition-opacity hover:opacity-80"
              >
                All services overview
              </a>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {siblingPages.map((sibling) => (
                <a
                  key={sibling.path}
                  href={sibling.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(sibling.path);
                  }}
                  className="group flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 transition-colors hover:border-[var(--accent)]"
                >
                  <div>
                    <p className="text-xs text-[var(--accent-text)]">
                      {sibling.navLabel}
                    </p>
                    <p className="mt-1.5 font-serif-display text-xl text-[var(--text)]">
                      {sibling.h1}
                    </p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] transition-colors group-hover:text-[var(--text)]">
                    <span>Read details</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </a>
              ))}
            </div>
          </section>
        </div>
      </article>
    </>
  );
}
