import {AnimatedArrow} from '../components/MagneticButton';
import {SeoHead} from '../components/SeoHead';
import {LOCAL_SEO_PAGES} from '../content/localSeoPages';
import {siteContent} from '../content/site';
import {useRouter} from '../context/RouterContext';
import {buildPageSeoData} from '../lib/routeSeo';
import {getCanonicalBaseUrl} from '../lib/seo';

export function ServicesPage() {
  const {navigate} = useRouter();
  const baseUrl = getCanonicalBaseUrl();
  const seo = buildPageSeoData('/services', baseUrl, []);

  return (
    <>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path="/services"
        ogImage={seo.ogImage}
        schemas={seo.schemas}
      />

      <section className="pt-32 pb-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="max-w-3xl">
            <p className="text-xs tracking-widest text-[var(--accent-text)]">
              Capabilities · Lucknow, India
            </p>
            <h1 className="mt-2 font-serif-display text-5xl tracking-tight text-[var(--text)] sm:text-6xl">
              Web Development &amp; Digital Marketing Services
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
              Independent freelance web development, technical search engine
              optimization, inbound marketing setup, and lean e-commerce builds
              by {siteContent.profile.name} in Lucknow, Uttar Pradesh.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
            {siteContent.services.map((service) => (
              <article
                key={service.index}
                className="card-elevated flex flex-col justify-between bg-[var(--surface)] p-8"
              >
                <div>
                  <span className="font-mono-tabular text-xs text-[var(--accent-text)]">
                    {service.index}.
                  </span>
                  <h2 className="mt-3 font-serif-display text-3xl tracking-tight text-[var(--text)]">
                    {service.title}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
                    {service.description}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="card-elevated mt-14 bg-[var(--surface)] p-8 sm:p-10">
            <h2 className="font-serif-display text-3xl tracking-tight text-[var(--text)]">
              Technical stack &amp; approach
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--muted)]">
              Projects are built with React, Next.js, Tailwind CSS, and Supabase,
              pairing fast frontends with clean HTML semantics, pre-rendered SEO
              metadata, and clear user paths learned from operating The Vaxn
              Store across SEO, hosting, and promotions.
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <a
                href="/work"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/work');
                }}
                className="btn-secondary group inline-flex items-center gap-2 px-6 py-3 text-sm font-medium"
              >
                <span>View selected work</span>
                <AnimatedArrow />
              </a>
              <a
                href="/contact"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/contact');
                }}
                className="btn-primary group inline-flex items-center gap-2 px-6 py-3 text-sm font-medium"
              >
                <span>Start a conversation</span>
                <AnimatedArrow />
              </a>
            </div>
          </div>

          <section
            aria-labelledby="local-services-heading"
            className="mt-16 border-t border-[var(--border)] pt-14"
          >
            <div className="max-w-2xl">
              <p className="text-xs tracking-widest text-[var(--accent-text)]">
                Lucknow &amp; Gonda
              </p>
              <h2
                id="local-services-heading"
                className="mt-2 font-serif-display text-3xl tracking-tight text-[var(--text)] sm:text-4xl"
              >
                Local service guides
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                Detailed pages covering web development in Lucknow, remote
                website development for Gonda, technical SEO, and digital
                marketing across both cities.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {LOCAL_SEO_PAGES.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                  className="group flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--accent)]"
                >
                  <div>
                    <p className="text-xs text-[var(--accent-text)]">
                      {item.eyebrow}
                    </p>
                    <h3 className="mt-2 font-serif-display text-2xl tracking-tight text-[var(--text)]">
                      {item.h1}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                      {item.description}
                    </p>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text)] transition-colors group-hover:text-[var(--accent-text)]">
                    <span>Read service details</span>
                    <AnimatedArrow className="h-3.5 w-3.5" />
                  </span>
                </a>
              ))}
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
