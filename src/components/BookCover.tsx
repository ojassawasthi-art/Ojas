import {useRef, useState} from 'react';

interface BookCoverProps {
  title: string;
  subtitle?: string;
  author: string;
  coverImage?: string;
  motif: 'axis' | 'rings';
  publisher: string;
}

export function BookCover({
  title,
  subtitle,
  author,
  coverImage,
  motif,
  publisher,
}: BookCoverProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({rx: 0, ry: 0});
  const [imgError, setImgError] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({rx: -py * 8, ry: px * 10});
  };

  const handleMouseLeave = () => {
    setTilt({rx: 0, ry: 0});
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition:
          tilt.rx === 0 && tilt.ry === 0
            ? 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
            : 'transform 0.1s linear',
      }}
      className="relative aspect-[3/4] w-full max-w-[260px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[#111110] text-[#F5F5F2] shadow-lg"
    >
      {coverImage && !imgError ? (
        <img
          src={coverImage}
          alt={`${title} by ${author} book cover`}
          width={520}
          height={693}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="relative flex h-full w-full flex-col justify-between p-6">
          {/* Spine shadow line */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 left-3 w-px bg-white/10"
          />

          {/* Minimal geometric SVG motif */}
          <svg
            viewBox="0 0 180 180"
            aria-hidden="true"
            className="pointer-events-none absolute right-0 bottom-10 h-44 w-44 opacity-20"
          >
            {motif === 'axis' ? (
              <g stroke="#C8A97E" fill="none" strokeWidth="1">
                <circle cx="110" cy="90" r="56" />
                <circle cx="110" cy="90" r="34" />
                <line x1="20" y1="90" x2="170" y2="90" />
                <line x1="110" y1="15" x2="110" y2="165" />
              </g>
            ) : (
              <g stroke="#C8A97E" fill="none" strokeWidth="1">
                <circle cx="88" cy="90" r="46" />
                <circle cx="116" cy="90" r="46" />
                <circle cx="102" cy="90" r="22" />
              </g>
            )}
          </svg>

          <div className="relative z-10 pl-2">
            <p className="text-[11px] tracking-widest text-[#C8A97E]">
              {publisher}
            </p>
          </div>

          <div className="relative z-10 pl-2">
            <h4 className="font-serif-display text-2xl leading-tight text-[#F5F5F2] sm:text-[28px]">
              {title}
            </h4>
            {subtitle && (
              <p className="mt-2 text-xs leading-relaxed text-[#A8A8A2]">
                {subtitle}
              </p>
            )}
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-3 pl-2 text-xs text-[#C8A97E]">
            <span>{author}</span>
            <span className="font-serif-display italic">OA</span>
          </div>
        </div>
      )}
    </div>
  );
}
