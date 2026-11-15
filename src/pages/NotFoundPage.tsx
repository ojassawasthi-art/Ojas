import {SeoHead} from '../components/SeoHead';
import {siteContent} from '../content/site';
import {useRouter} from '../context/RouterContext';

export function NotFoundPage() {
  const {navigate} = useRouter();

  return (
    <>
      <SeoHead
        title={`Page Not Found | ${siteContent.profile.name}`}
        description="The requested page could not be found."
        noIndex
      />

      <section className="flex min-h-[75vh] items-center pt-24 pb-20">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <p className="font-mono-tabular text-xs text-[var(--accent-text)]">
            404
          </p>
          <h1 className="mt-3 font-serif-display text-6xl tracking-tight text-[var(--text)] sm:text-7xl">
            Page not found
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-[var(--muted)]">
            The page you requested does not exist or has moved.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-xl bg-[#0A0A0A] px-6 py-3 text-sm font-medium text-[#FAFAF8] dark:bg-[#F5F5F2] dark:text-[#0A0A0A]"
            >
              Back to Home
            </button>
            <button
              type="button"
              onClick={() => navigate('/work')}
              className="rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--text)]"
            >
              View Work
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
