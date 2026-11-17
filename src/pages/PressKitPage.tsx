import {ArrowUpRight, Check, Copy} from 'lucide-react';
import {useState} from 'react';
import {BookCover} from '../components/BookCover';
import {PortraitArch} from '../components/PortraitArch';
import {SeoHead} from '../components/SeoHead';
import {siteContent} from '../content/site';
import {buildPageSeoData} from '../lib/routeSeo';
import {getCanonicalBaseUrl} from '../lib/seo';

export function PressKitPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const baseUrl = getCanonicalBaseUrl();
  const seo = buildPageSeoData('/press-kit', baseUrl, []);

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  const bios = [
    {key: 'bio50', label: '50-word bio', text: siteContent.pressKit.bio50},
    {key: 'bio100', label: '100-word bio', text: siteContent.pressKit.bio100},
    {key: 'bio200', label: '200-word bio', text: siteContent.pressKit.bio200},
  ];

  return (
    <>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path="/press-kit"
        ogImage={seo.ogImage}
        schemas={seo.schemas}
      />

      <section className="pt-32 pb-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="max-w-3xl">
            <p className="text-xs tracking-widest text-[var(--accent-text)]">
              Media &amp; Reference
            </p>
            <h1 className="mt-2 font-serif-display text-5xl tracking-tight text-[var(--text)] sm:text-6xl">
              Press Kit — {siteContent.profile.name}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
              Approved short, medium, and full biographies, portrait frame, book
              artwork, and official contact channels for editorial features,
              interviews, and event listings.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Approved Biographies */}
            <div className="space-y-6 lg:col-span-7">
              {bios.map((item) => (
                <article
                  key={item.key}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-7"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-serif-display text-2xl text-[var(--text)]">
                      {item.label}
                    </h2>
                    <button
                      type="button"
                      onClick={() => copyText(item.key, item.text)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition-colors hover:border-[var(--accent)]"
                    >
                      {copiedKey === item.key ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[var(--accent-text)]" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-[var(--muted)]">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>

            {/* Portrait & Links */}
            <div className="space-y-8 lg:col-span-5">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7">
                <h2 className="font-serif-display text-2xl text-[var(--text)]">
                  Portrait
                </h2>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {siteContent.profile.photoAlt}
                </p>
                <div className="mt-6">
                  <PortraitArch />
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={siteContent.profile.photoPath}
                    download="ojas-awasthi-portrait.jpg"
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-xs font-medium text-[var(--text)] transition-colors hover:border-[var(--accent)]"
                  >
                    <span>Portrait asset (/images/ojas.jpg)</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-7">
                <h2 className="font-serif-display text-2xl text-[var(--text)]">
                  Official Links
                </h2>
                <ul className="mt-4 space-y-3 text-sm">
                  {siteContent.contact.socials.map((s) => (
                    <li key={s.name} className="flex items-center justify-between">
                      <span className="text-[var(--muted)]">{s.name}</span>
                      <a
                        href={s.url}
                        target={s.url.startsWith('http') ? '_blank' : undefined}
                        rel={
                          s.url.startsWith('http')
                            ? 'noopener noreferrer'
                            : undefined
                        }
                        className="font-medium text-[var(--text)] underline decoration-[var(--accent)] underline-offset-4 hover:text-[var(--accent-text)]"
                      >
                        {s.handle}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Book Covers */}
          <div className="mt-20 border-t border-[var(--border)] pt-16">
            <h2 className="font-serif-display text-3xl text-[var(--text)]">
              Published Book Artwork
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
              {siteContent.books.map((book) => (
                <article
                  key={book.id}
                  className="flex flex-col items-center gap-6 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-7 sm:flex-row"
                >
                  <div className="shrink-0 sm:w-[180px]">
                    <BookCover
                      title={book.title}
                      subtitle={book.subtitle}
                      author={book.author}
                      coverImage={book.coverImage}
                      motif={book.motif}
                      publisher={book.publisher}
                    />
                  </div>
                  <div>
                    <h3 className="font-serif-display text-2xl text-[var(--text)]">
                      {book.title}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--accent-text)]">
                      {book.publisher}
                      {book.publishedDate ? ` · ${book.publishedDate}` : ''}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                      {book.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
