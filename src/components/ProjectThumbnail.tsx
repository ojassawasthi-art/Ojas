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
          alt={`${project.title} preview`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  // Graceful editorial gradient card fallback when Microlink fails or no live URL exists
  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#F3F1EC] via-[#EAE5DC] to-[#DFD5C6] p-7 text-[#0A0A0A] dark:from-[#161513] dark:via-[#1B1915] dark:to-[#242019] dark:text-[#F5F5F2] ${className}`}
    >
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span className="font-mono-tabular">
          {domain || project.category}
        </span>
        {project.status_tag && (
          <span className="font-medium text-[var(--accent-text)]">
            {project.status_tag}
          </span>
        )}
      </div>

      <div className="my-auto py-4">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#0A0A0A]/10 dark:border-[#F5F5F2]/15">
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

      <div className="flex items-center justify-between border-t border-[#0A0A0A]/10 pt-3 text-xs text-[var(--muted)] dark:border-[#F5F5F2]/10">
        <span>{project.year}</span>
        <span>Case Study</span>
      </div>
    </div>
  );
}
