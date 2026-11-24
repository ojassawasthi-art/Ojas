import {ArrowUpRight} from 'lucide-react';
import {useRouter} from '../context/RouterContext';
import type {Project} from '../types/database';
import {ProjectThumbnail} from './ProjectThumbnail';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({project}: ProjectCardProps) {
  const {navigate} = useRouter();

  return (
    <article className="card-elevated group flex flex-col justify-between overflow-hidden bg-[var(--surface)]">
      <a
        href={`/work/${project.slug}`}
        data-cursor="view"
        onClick={(e) => {
          e.preventDefault();
          navigate(`/work/${project.slug}`);
        }}
        className="block focus:outline-none"
      >
        <ProjectThumbnail
          project={project}
          className="aspect-[16/10] w-full border-b border-[var(--border)]"
        />

        <div className="p-7 pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span>{project.category}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">{project.year}</span>
            {project.status_tag && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tag-pill">{project.status_tag}</span>
              </>
            )}
          </div>

          <h3 className="mt-2 font-serif-display text-3xl tracking-tight text-[var(--text)] transition-colors group-hover:text-[var(--accent-text)]">
            {project.title}
          </h3>

          <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted)]">
            {project.description}
          </p>

          {project.tech_stack && project.tech_stack.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.tech_stack.map((tech) => (
                <span key={tech} className="tag-pill">
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
      </a>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] px-7 py-4 text-xs">
        <a
          href={`/work/${project.slug}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/work/${project.slug}`);
          }}
          className="group/link inline-flex items-center gap-1.5 font-medium text-[var(--text)] transition-colors hover:text-[var(--accent-text)]"
        >
          <span>View case study</span>
          <ArrowUpRight
            aria-hidden="true"
            className="h-3.5 w-3.5 transition-all duration-200 group-hover/link:text-[var(--accent-text)] motion-safe:group-hover/link:translate-x-0.5 motion-safe:group-hover/link:-translate-y-0.5"
          />
        </a>

        {project.live_url && (
          <a
            href={project.live_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/ext inline-flex items-center gap-1.5 font-medium text-[var(--accent-text)] transition-opacity hover:opacity-80"
          >
            <span>Visit live site</span>
            <ArrowUpRight
              aria-hidden="true"
              className="h-3.5 w-3.5 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover/ext:translate-x-0.5 motion-safe:group-hover/ext:-translate-y-0.5"
            />
          </a>
        )}
      </div>
    </article>
  );
}
