import {ArrowUpRight} from 'lucide-react';
import {SeoHead} from '../components/SeoHead';
import {siteContent} from '../content/site';
import {useRouter} from '../context/RouterContext';
import {buildPageSeoData} from '../lib/routeSeo';
import {getCanonicalBaseUrl} from '../lib/seo';

export function LinksPage() {
  const {navigate} = useRouter();
  const baseUrl = getCanonicalBaseUrl();
  const seo = buildPageSeoData('/links', baseUrl, []);

  const internalHighlights = [
    {label: 'Official Portfolio', description: 'Main site & overview', path: '/'},
    {label: 'About & FAQ', description: 'Biography, experience & questions', path: '/about'},
    {label: 'Education', description: "St. Xavier's Gonda & University of Lucknow", path: '/education'},
    {label: 'Services', description: 'Web development, SEO & digital marketing', path: '/services'},
    {label: 'Selected Work', description: 'Nutstridinida & The Vaxn Store', path: '/work'},
    {label: 'Articles', description: 'Writing & technical notes', path: '/blog'},
    {label: 'Press Kit', description: 'Bios & reference assets', path: '/press-kit'},
    {label: 'Contact Form', description: 'Send a direct message', path: '/contact'},
  ];

  return (
    <>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path="/links"
        ogImage={seo.ogImage}
        schemas={seo.schemas}
      />

      <section className="pt-32 pb-28">
        <div className="mx-auto max-w-2xl px-6">
          <div className="text-center">
            <p className="text-xs tracking-widest text-[var(--accent-text)]">
              Official Directory
            </p>
            <h1 className="mt-2 font-serif-display text-5xl tracking-tight text-[var(--text)]">
              {siteContent.profile.name}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {siteContent.profile.siteHeadline}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {siteContent.profile.location}
            </p>
          </div>

          <div className="mt-10 space-y-3">
            <h2 className="text-xs font-medium tracking-widest text-[var(--accent-text)]">
              Social &amp; Contact
            </h2>
            {siteContent.contact.socials.map((s) => {
              const isHttp = s.url.startsWith('http');
              return (
                <a
                  key={s.name}
                  href={s.url}
                  target={isHttp ? '_blank' : undefined}
                  rel={isHttp ? 'noopener noreferrer' : undefined}
                  className="card-elevated group flex items-center justify-between bg-[var(--surface)] px-6 py-4"
                >
                  <div>
                    <p className="font-medium text-[var(--text)]">{s.name}</p>
                    <p className="text-xs text-[var(--muted)]">{s.handle}</p>
                  </div>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-4 w-4 text-[var(--muted)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--accent-text)]"
                  />
                </a>
              );
            })}
          </div>

          <div className="mt-10 space-y-3">
            <h2 className="text-xs font-medium tracking-widest text-[var(--accent-text)]">
              Books
            </h2>
            {siteContent.books.map((book) => {
              const primaryUrl = book.buyUrl || book.links[0]?.url || '/books';
              return (
                <a
                  key={book.id}
                  href={primaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-elevated group flex items-center justify-between bg-[var(--surface)] px-6 py-4"
                >
                  <div>
                    <p className="font-medium text-[var(--text)]">{book.title}</p>
                    <p className="text-xs text-[var(--muted)]">{book.publisher}</p>
                  </div>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-4 w-4 text-[var(--muted)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--accent-text)]"
                  />
                </a>
              );
            })}
          </div>

          <div className="mt-10 space-y-3">
            <h2 className="text-xs font-medium tracking-widest text-[var(--accent-text)]">
              Verified Certificates
            </h2>
            {siteContent.certifications
              .filter((c) => Boolean(c.verifyUrl))
              .map((cert) => (
                <a
                  key={cert.id}
                  href={cert.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-elevated group flex items-center justify-between bg-[var(--surface)] px-6 py-4"
                >
                  <div>
                    <p className="font-medium text-[var(--text)]">{cert.title}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {cert.issuer} · {cert.issued}
                    </p>
                  </div>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-4 w-4 text-[var(--muted)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--accent-text)]"
                  />
                </a>
              ))}
          </div>

          <div className="mt-10 space-y-3">
            <h2 className="text-xs font-medium tracking-widest text-[var(--accent-text)]">
              Website Pages
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {internalHighlights.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                  className="card-elevated group bg-[var(--surface)] px-5 py-3.5"
                >
                  <p className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--accent-text)]">
                    {item.label}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{item.description}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
