import {ArrowUp, ArrowUpRight} from 'lucide-react';
import {useEffect, useState} from 'react';
import {siteContent} from '../content/site';
import {useRouter} from '../context/RouterContext';
import {getNewsletterUrl} from '../lib/newsletter';
import {Wordmark} from './Wordmark';

export function Footer() {
  const {navigate} = useRouter();
  const [istTime, setIstTime] = useState('');
  const newsletterUrl = getNewsletterUrl();

  useEffect(() => {
    const formatIst = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(now);
        setIstTime(`${formatted} IST`);
      } catch {
        setIstTime('Lucknow, IST');
      }
    };

    formatIst();
    const timer = setInterval(formatIst, 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  const footerPages = [
    {label: 'Home', path: '/'},
    {label: 'About', path: '/about'},
    {label: 'Education', path: '/education'},
    {label: 'Services', path: '/services'},
    {label: 'Work', path: '/work'},
    {label: 'Books', path: '/books'},
    {label: 'Articles', path: '/blog'},
    {label: 'Press Kit', path: '/press-kit'},
    {label: 'Links', path: '/links'},
    ...(newsletterUrl ? [{label: 'Newsletter', path: '/#newsletter'}] : []),
    {label: 'Contact', path: '/contact'},
    {label: 'Privacy', path: '/privacy'},
    {label: 'Admin', path: '/admin'},
  ];

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg)] py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className={newsletterUrl ? 'md:col-span-5' : 'md:col-span-7'}>
            <a
              href="/"
              aria-label={siteContent.profile.name}
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              className="inline-block text-[var(--text)]"
            >
              <span className="sr-only">{siteContent.profile.name}</span>
              <Wordmark variant="footer" />
            </a>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
              Official website of {siteContent.profile.name}.{' '}
              {siteContent.profile.siteHeadline}
            </p>
            <p className="mt-4 text-xs text-[var(--muted)]">
              {siteContent.profile.location}
            </p>
          </div>

          <div className={newsletterUrl ? 'md:col-span-3' : 'md:col-span-5'}>
            <p className="text-xs font-medium text-[var(--text)]">Pages</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-[var(--muted)]">
              {footerPages.map((link) => (
                <li key={link.path}>
                  <a
                    href={link.path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(link.path);
                    }}
                    className="transition-colors hover:text-[var(--text)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {newsletterUrl && (
            <div className="md:col-span-4">
              <p className="text-xs font-medium text-[var(--text)]">
                Newsletter
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                Occasional emails on web development, digital marketing and
                psychology. Unsubscribe anytime.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href={newsletterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A0A0A] px-4 py-2.5 text-xs font-medium text-[#FAFAF8] whitespace-nowrap shrink-0 transition-opacity hover:opacity-90 dark:bg-[#F5F5F2] dark:text-[#0A0A0A]"
                >
                  <span>Subscribe on beehiiv</span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                  />
                </a>
                <a
                  href="/#newsletter"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/#newsletter');
                  }}
                  className="text-xs text-[var(--muted)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:text-[var(--text)] hover:decoration-[var(--accent)]"
                >
                  Newsletter
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)] sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <span>© 2026 {siteContent.profile.name}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">Lucknow, {istTime}</span>
            <span aria-hidden="true">·</span>
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                navigate('/privacy');
              }}
              className="transition-colors hover:text-[var(--text)]"
            >
              Privacy
            </a>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text)] transition-opacity hover:opacity-75"
          >
            <span>Back to top</span>
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}
