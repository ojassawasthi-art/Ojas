import {ArrowUpRight} from 'lucide-react';
import {useRef, useState, type ReactNode} from 'react';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  ariaLabel?: string;
}

export function MagneticButton({
  children,
  className = '',
  onClick,
  href,
  target,
  rel,
  type = 'button',
  disabled = false,
  ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState({x: 0, y: 0});

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) * 0.18;
    const y = (e.clientY - (rect.top + rect.height / 2)) * 0.18;
    setOffset({x, y});
  };

  const handleMouseLeave = () => {
    setOffset({x: 0, y: 0});
  };

  const style = {
    transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
    transition:
      offset.x === 0 && offset.y === 0
        ? 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        : 'transform 0.08s linear',
  };

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={style}
        aria-label={ariaLabel}
        className={`group inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 ${className}`}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      aria-label={ariaLabel}
      className={`group inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 ${className}`}
    >
      {children}
    </button>
  );
}

export function AnimatedArrow({className = 'h-4 w-4'}: {className?: string}) {
  return (
    <ArrowUpRight
      aria-hidden="true"
      className={`${className} transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5`}
    />
  );
}
