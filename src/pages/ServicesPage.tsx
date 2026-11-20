import {AnimatedArrow} from '../components/MagneticButton';
import {SeoHead} from '../components/SeoHead';
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
        </div>
      </section>
    </>
  );
}
