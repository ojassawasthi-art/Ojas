import {ArrowUpRight} from 'lucide-react';
import {BookCover} from '../components/BookCover';
import {SeoHead} from '../components/SeoHead';
import {siteContent} from '../content/site';
import {
  buildBookSchemas,
  buildBreadcrumbSchema,
  getCanonicalBaseUrl,
} from '../lib/seo';

export function BooksPage() {
  const baseUrl = getCanonicalBaseUrl();

  return (
    <>
      <SeoHead
        title={`Books by ${siteContent.profile.name}`}
        description={`Published books by ${siteContent.profile.name}: Mastering the Art of Manipulation and The Echoes of Love on Amazon and Google Play Books.`}
        path="/books"
        schemas={[
          ...buildBookSchemas(baseUrl),
          buildBreadcrumbSchema(
            [
              {name: 'Home', path: '/'},
              {name: 'Books', path: '/books'},
            ],
            baseUrl,
          ),
        ]}
      />

      <section className="pt-32 pb-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="max-w-2xl">
            <p className="text-xs tracking-widest text-[var(--accent-text)]">
              Publications
            </p>
            <h1 className="mt-2 font-serif-display text-5xl tracking-tight text-[var(--text)] sm:text-6xl">
              Books by {siteContent.profile.name}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
              Writing focused on human behavior, strategic influence, leadership,
              and narrative prose.
            </p>
          </div>

          <div className="mt-14 space-y-10">
            {siteContent.books.map((book) => {
              const effectiveLinks =
                book.buyUrl && book.id === 'echoes-of-love'
                  ? [{label: 'Buy book', url: book.buyUrl}, ...book.links]
                  : book.links;

              return (
                <article
                  key={book.id}
                  className="grid grid-cols-1 items-center gap-10 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-8 sm:p-12 md:grid-cols-12"
                >
                  <div className="flex justify-center md:col-span-4">
                    <BookCover
                      title={book.title}
                      subtitle={book.subtitle}
                      author={book.author}
                      coverImage={book.coverImage}
                      motif={book.motif}
                      publisher={book.publisher}
                    />
                  </div>

                  <div className="md:col-span-8">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                      <span>{book.publisher}</span>
                      {book.publishedDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular">
                            {book.publishedDate}
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="mt-3 font-serif-display text-4xl tracking-tight text-[var(--text)]">
                      {book.title}
                    </h2>
                    {book.subtitle && (
                      <p className="mt-1.5 text-base font-medium text-[var(--accent-text)]">
                        {book.subtitle}
                      </p>
                    )}

                    <p className="mt-5 text-base leading-relaxed text-[var(--muted)]">
                      {book.description}
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                      {effectiveLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-5 py-2.5 text-xs font-medium text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-text)]"
                        >
                          <span>{link.label}</span>
                          <ArrowUpRight
                            aria-hidden="true"
                            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
