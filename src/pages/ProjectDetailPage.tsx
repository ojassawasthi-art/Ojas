import {ArrowLeft, ArrowRight, ArrowUpRight} from 'lucide-react';
import {ProjectThumbnail} from '../components/ProjectThumbnail';
import {SeoHead} from '../components/SeoHead';
import {useRouter} from '../context/RouterContext';
import {buildPageSeoData} from '../lib/routeSeo';
import {extractDomain, getProjectThumbnailUrl} from '../lib/screenshot';
import {getCanonicalBaseUrl} from '../lib/seo';
import type {Project} from '../types/database';

interface ProjectDetailPageProps {
  slug: string;
  projects: Project[];
  loading: boolean;
}

export function ProjectDetailPage({
  slug,
  projects,
  loading,
}: ProjectDetailPageProps) {
  const {navigate} = useRouter();
  const published = projects.filter((p) => p.published);
  const currentIndex = published.findIndex((p) => p.slug === slug);
  const project = currentIndex >= 0 ? published[currentIndex] : null;
  const nextProject =
    published.length > 1 && currentIndex >= 0
      ? published[(currentIndex + 1) % published.length]
      : null;

  if (loading && !project) {
    return (
      <section className="pt-32 pb-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="h-96 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
        </div>
      </section>
    );
  }

  if (!project) {
    return (
      <>
        <SeoHead
          title="Project Not Found | Ojas Awasthi"
          description="The requested project case study could not be found on Ojas Awasthi portfolio."
          path="/404"
          noIndex
        />
        <section className="pt-36 pb-28">
          <div className="mx-auto max-w-[1200px] px-6 text-center">
            <h1 className="font-serif-display text-5xl text-[var(--text)]">
              Project not found
            </h1>
            <p className="mt-4 text-sm text-[var(--muted)]">
              This case study may have been unpublished or moved.
            </p>
            <button
              type="button"
              onClick={() => navigate('/work')}
              className="btn-secondary mt-8 px-6 py-2.5 text-sm font-medium"
            >
              Return to Work
            </button>
          </div>
        </section>
      </>
    );
  }

  const baseUrl = getCanonicalBaseUrl();
  const seo = buildPageSeoData(`/work/${project.slug}`, baseUrl, published);
  const domain = extractDomain(project.live_url);
  const autoPreview = getProjectThumbnailUrl(
    project.thumbnail_url,
    project.live_url,
  );
  const galleryImages =
    project.images && project.images.length > 0
      ? project.images
      : autoPreview
        ? [autoPreview]
        : [];

  return (
    <>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path={`/work/${project.slug}`}
        ogImage={seo.ogImage}
        schemas={seo.schemas}
      />

      <article className="pt-32 pb-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <a
            href="/work"
            onClick={(e) => {
              e.preventDefault();
              navigate('/work');
            }}
            className="group inline-flex items-center gap-2 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--accent-text)]"
          >
            <ArrowLeft
              className="h-3.5 w-3.5 transition-colors group-hover:text-[var(--accent-text)]"
              aria-hidden="true"
            />
            <span>Back to all work</span>
          </a>

          <header className="mt-8 border-b border-[var(--border)] pb-10">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
              <span>{project.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">{project.year}</span>
              {project.status_tag && (
                <span className="tag-pill">{project.status_tag}</span>
              )}
            </div>

            <h1 className="mt-3 font-serif-display text-5xl tracking-tight text-[var(--text)] sm:text-7xl">
              {project.title}
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
              {project.description}
            </p>

            {(project.live_url || project.github_url) && (
              <div className="mt-8 flex flex-wrap gap-4">
                {project.live_url && (
                  <a
                    href={project.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary group inline-flex items-center gap-2 px-6 py-3 text-sm font-medium"
                  >
                    <span>Visit live site</span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </a>
                )}

                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary group inline-flex items-center gap-2 px-6 py-3 text-sm font-medium"
                  >
                    <span>Source repository</span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </a>
                )}
              </div>
            )}
          </header>

          {/* Metadata grid — hides empty fields automatically */}
          {(project.role ||
            (project.tech_stack && project.tech_stack.length > 0) ||
            project.long_description) && (
            <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12">
              {project.long_description && (
                <div className="lg:col-span-8">
                  <h2 className="font-serif-display text-3xl text-[var(--text)]">
                    Overview
                  </h2>
                  <p className="mt-4 text-base leading-relaxed whitespace-pre-line text-[var(--muted)]">
                    {project.long_description}
                  </p>
                </div>
              )}

              {(project.role ||
                (project.tech_stack && project.tech_stack.length > 0)) && (
                <aside className="card-elevated space-y-6 bg-[var(--surface)] p-7 lg:col-span-4">
                  {project.role && (
                    <div>
                      <p className="text-xs text-[var(--muted)]">Role</p>
                      <p className="mt-1 text-sm font-medium text-[var(--text)]">
                        {project.role}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-[var(--muted)]">Year</p>
                    <p className="font-mono-tabular mt-1 text-sm text-[var(--text)]">
                      {project.year}
                    </p>
                  </div>
                  {project.tech_stack && project.tech_stack.length > 0 && (
                    <div>
                      <p className="text-xs text-[var(--muted)]">
                        Stack &amp; Focus
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {project.tech_stack.map((item) => (
                          <span key={item} className="tag-pill">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </aside>
              )}
            </div>
          )}

          {/* Browser-window mockup showcase */}
          <div className="mt-14 space-y-8">
            <div className="card-elevated overflow-hidden bg-[var(--surface)] shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--pop)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--border)]" />
                </div>
                <span className="font-mono-tabular text-[11px] text-[var(--muted)]">
                  {domain || project.slug}
                </span>
                <span className="w-10" />
              </div>

              <ProjectThumbnail
                project={project}
                className="aspect-[16/9] w-full"
              />
            </div>

            {galleryImages.length > 1 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {galleryImages.slice(1).map((imgUrl, idx) => (
                  <div
                    key={`${imgUrl}-${idx}`}
                    className="card-elevated overflow-hidden bg-[var(--surface)]"
                  >
                    <img
                      src={imgUrl}
                      alt={`${project.title} — showcase image ${idx + 2} by Ojas Awasthi`}
                      width={1200}
                      height={750}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="aspect-[16/10] w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {nextProject && (
            <div className="mt-20 border-t border-[var(--border)] pt-10">
              <p className="text-xs text-[var(--muted)]">Next project</p>
              <a
                href={`/work/${nextProject.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/work/${nextProject.slug}`);
                }}
                className="group mt-2 flex items-center justify-between gap-4"
              >
                <span className="font-serif-display text-3xl text-[var(--text)] transition-colors group-hover:text-[var(--accent-text)] sm:text-5xl">
                  {nextProject.title}
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="h-6 w-6 text-[var(--text)] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[var(--accent-text)]"
                />
              </a>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
