import {ArrowUp, Check, Loader2} from 'lucide-react';
import {useEffect, useState} from 'react';
import {siteContent} from '../content/site';
import {useRouter} from '../context/RouterContext';

export function Footer() {
  const {navigate} = useRouter();
  const [istTime, setIstTime] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: newsletterEmail.trim()}),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({
          type: 'error',
          text: data.error || `Could not subscribe right now. Email ${siteContent.contact.email}.`,
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: data.message || 'Subscribed to updates.',
        });
        setNewsletterEmail('');
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: `Unable to connect. Feel free to email ${siteContent.contact.email}.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg)] py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              className="font-serif-display text-2xl tracking-tight text-[var(--text)]"
            >
              {siteContent.profile.name}
            </a>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
              Official website of {siteContent.profile.name}.{' '}
              {siteContent.profile.siteHeadline}
            </p>
            <p className="mt-4 text-xs text-[var(--muted)]">
              {siteContent.profile.location}
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="text-xs font-medium text-[var(--text)]">Pages</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-[var(--muted)]">
              {[
                {label: 'Home', path: '/'},
                {label: 'About', path: '/about'},
                {label: 'Education', path: '/education'},
                {label: 'Services', path: '/services'},
                {label: 'Work', path: '/work'},
                {label: 'Books', path: '/books'},
                {label: 'Articles', path: '/blog'},
                {label: 'Press Kit', path: '/press-kit'},
                {label: 'Links', path: '/links'},
                {label: 'Contact', path: '/contact'},
                {label: 'Admin', path: '/admin'},
              ].map((link) => (
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

          <div className="md:col-span-4">
            <p className="text-xs font-medium text-[var(--text)]">
              Newsletter
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
              Occasional notes on web builds, strategy, and writing.
            </p>
            <form onSubmit={handleSubscribe} className="mt-4 flex gap-2">
              <label htmlFor="footer-newsletter" className="sr-only">
                Email address for newsletter
              </label>
              <input
                id="footer-newsletter"
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="you@example.com"
                className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-transparent px-3.5 py-2 text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-xl bg-[#0A0A0A] px-4 py-2 text-xs font-medium text-[#FAFAF8] whitespace-nowrap shrink-0 transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-[#F5F5F2] dark:text-[#0A0A0A]"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  'Subscribe'
                )}
              </button>
            </form>
            {statusMessage && (
              <p
                className={`mt-2 flex items-center gap-1.5 text-xs ${
                  statusMessage.type === 'success'
                    ? 'text-[var(--accent-text)]'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {statusMessage.type === 'success' && (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{statusMessage.text}</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)] sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <span>© 2026 {siteContent.profile.name}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">Lucknow, {istTime}</span>
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
