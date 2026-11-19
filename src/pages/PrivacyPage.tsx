import {ArrowLeft, Mail} from 'lucide-react';
import {useMemo} from 'react';
import {SeoHead} from '../components/SeoHead';
import {siteContent} from '../content/site';
import {useRouter} from '../context/RouterContext';
import {buildPageSeoData} from '../lib/routeSeo';
import {getCanonicalBaseUrl} from '../lib/seo';

export function PrivacyPage() {
  const {navigate} = useRouter();
  const baseUrl = getCanonicalBaseUrl();
  const seo = useMemo(() => buildPageSeoData('/privacy', baseUrl, []), [baseUrl]);

  return (
    <>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path="/privacy"
        schemas={seo.schemas}
      />

      <section className="pt-28 pb-24 sm:pt-36">
        <div className="mx-auto max-w-[820px] px-6">
          <nav
            aria-label="Breadcrumb"
            className="mb-8 flex items-center gap-2 text-xs text-[var(--muted)]"
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
            <span className="text-[var(--text)]">Privacy Policy</span>
          </nav>

          <p className="text-xs tracking-widest text-[var(--accent-text)]">
            Privacy
          </p>
          <h1 className="mt-2 font-serif-display text-5xl leading-[1.02] tracking-tight text-[var(--text)] sm:text-6xl">
            Privacy policy
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
            A short, plain summary of how newsletter signups and personal
            details are handled on this website.
          </p>

          <div className="mt-12 space-y-10 border-t border-[var(--border)] pt-10">
            <section>
              <h2 className="font-serif-display text-3xl tracking-tight text-[var(--text)]">
                Newsletter signups via beehiiv
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                Email signups for {siteContent.profile.name}&apos;s newsletter
                are handled directly by{' '}
                <strong className="font-medium text-[var(--text)]">
                  beehiiv
                </strong>
                . Your email address is used solely to send occasional emails on
                web development, digital marketing, and psychology.
              </p>
            </section>

            <section>
              <h2 className="font-serif-display text-3xl tracking-tight text-[var(--text)]">
                Unsubscribe anytime
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                You can unsubscribe from any email with a single click using the
                unsubscribe link at the bottom of every newsletter issue, or by
                emailing{' '}
                <a
                  href={`mailto:${siteContent.contact.email}?subject=Privacy%20or%20unsubscribe%20request`}
                  className="inline-flex items-center gap-1 font-medium text-[var(--text)] underline decoration-[var(--accent)] underline-offset-4 transition-colors hover:text-[var(--accent-text)]"
                >
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{siteContent.contact.email}</span>
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="font-serif-display text-3xl tracking-tight text-[var(--text)]">
                No selling or sharing
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                Your contact information is never sold, rented, or shared with
                third-party marketers or data brokers.
              </p>
            </section>
          </div>

          <div className="mt-14 border-t border-[var(--border)] pt-8">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              className="inline-flex items-center gap-2 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--text)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Back to home</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
