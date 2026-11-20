import {Globe} from 'lucide-react';
import {useState} from 'react';
import {extractDomain, getProjectThumbnailUrl} from '../lib/screenshot';
import type {Project} from '../types/database';

interface ProjectThumbnailProps {
  project: Project;
  className?: string;
}

export function ProjectThumbnail({project, className = ''}: ProjectThumbnailProps) {
  const imageUrl = getProjectThumbnailUrl(project.thumbnail_url, project.live_url);
  const [failed, setFailed] = useState(false);
  const domain = extractDomain(project.live_url);

  if (imageUrl && !failed) {
    return (
      <div
        className={`relative overflow-hidden bg-[var(--surface)] ${className}`}
      >
        <img
          src={imageUrl}
          alt={`${project.title} — website preview by Ojas Awasthi`}
          width={1280}
          height={720}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover object-top motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[var(--accent)]/20 via-transparent to-[var(--pop)]/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      </div>
    );
  }

  // Graceful editorial gradient card fallback when Microlink fails or no live URL exists
  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#FFF4F1] via-[#FFE7E2] to-[#FFDAD2] p-7 text-[#1A0F10] dark:from-[#1C1114] dark:via-[#26161B] dark:to-[#331B22] dark:text-[#FFF1EE] ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[var(--accent)]/12 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="relative z-10 flex items-center justify-between text-xs text-[var(--muted)]">
        <span className="font-mono-tabular">
          {domain || project.category}
        </span>
        {project.status_tag && (
          <span className="tag-pill">{project.status_tag}</span>
        )}
      </div>

      <div className="relative z-10 my-auto py-4">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)]">
          <Globe className="h-4 w-4 text-[var(--accent-text)]" aria-hidden="true" />
        </div>
        <p className="font-serif-display text-3xl tracking-tight sm:text-4xl">
          {project.title}
        </p>
        {domain && (
          <p className="font-mono-tabular mt-1 text-xs text-[var(--muted)]">
            {domain}
          </p>
        )}
      </div>

      <div className="relative z-10 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
        <span>{project.year}</span>
        <span>Case Study</span>
      </div>
    </div>
  );
}
