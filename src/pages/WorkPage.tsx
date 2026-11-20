import {useMemo, useState} from 'react';
import {ProjectCard} from '../components/ProjectCard';
import {SeoHead} from '../components/SeoHead';
import {siteContent} from '../content/site';
import {buildPageSeoData} from '../lib/routeSeo';
import {getCanonicalBaseUrl} from '../lib/seo';
import type {Project} from '../types/database';

interface WorkPageProps {
  projects: Project[];
  loading: boolean;
}

export function WorkPage({projects, loading}: WorkPageProps) {
  const [activeCategory, setActiveCategory] = useState('All');

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

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return publishedProjects;
    return publishedProjects.filter(
      (p) => p.category.toLowerCase() === activeCategory.toLowerCase(),
    );
  }, [publishedProjects, activeCategory]);

  const baseUrl = getCanonicalBaseUrl();
  const seo = useMemo(
    () => buildPageSeoData('/work', baseUrl, publishedProjects),
    [baseUrl, publishedProjects],
  );

  return (
    <>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path="/work"
        ogImage={seo.ogImage}
        schemas={seo.schemas}
      />

      <section className="pt-32 pb-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs tracking-widest text-[var(--accent-text)]">
                Portfolio
              </p>
              <h1 className="mt-2 font-serif-display text-5xl tracking-tight text-[var(--text)] sm:text-6xl">
                Selected work
              </h1>
              <p className="mt-4 max-w-xl text-base text-[var(--muted)]">
                Websites and e-commerce projects designed, built, and maintained by{' '}
                {siteContent.profile.name}.
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Filter projects"
              className="inline-flex w-fit items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1"
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
                    className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                      active
                        ? 'bg-[var(--accent-button)] text-[var(--accent-contrast)] shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--accent-text)]'
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
                  className="h-[420px] animate-pulse rounded-[22px] border border-[var(--border)] bg-[var(--surface)]"
                />
              ))}
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
              {filtered.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
