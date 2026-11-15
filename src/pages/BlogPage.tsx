import {ArrowLeft, ArrowUpRight} from 'lucide-react';
import {SeoHead} from '../components/SeoHead';
import {siteContent} from '../content/site';
import {useRouter} from '../context/RouterContext';
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  getCanonicalBaseUrl,
} from '../lib/seo';

interface BlogPageProps {
  slug?: string;
}

export function BlogPage({slug}: BlogPageProps) {
  const {navigate} = useRouter();
  const baseUrl = getCanonicalBaseUrl();

  if (slug) {
    const post = siteContent.blogPosts.find((p) => p.slug === slug);
    if (!post) {
      return (
        <section className="pt-36 pb-28">
          <div className="mx-auto max-w-[1200px] px-6 text-center">
            <h1 className="font-serif-display text-5xl text-[var(--text)]">
              Article not found
            </h1>
            <button
              type="button"
              onClick={() => navigate('/blog')}
              className="mt-8 rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--text)]"
            >
              Back to articles
            </button>
          </div>
        </section>
      );
    }

    return (
      <>
        <SeoHead
          title={`${post.title} | ${siteContent.profile.name}`}
          description={post.description}
          path={`/blog/${post.slug}`}
          schemas={[
            buildArticleSchema(post, baseUrl),
            buildBreadcrumbSchema(
              [
                {name: 'Home', path: '/'},
                {name: 'Articles', path: '/blog'},
                {name: post.title, path: `/blog/${post.slug}`},
              ],
              baseUrl,
            ),
          ]}
        />

        <article className="pt-32 pb-28">
          <div className="mx-auto max-w-3xl px-6">
            <a
              href="/blog"
              onClick={(e) => {
                e.preventDefault();
                navigate('/blog');
              }}
              className="inline-flex items-center gap-2 text-xs font-medium text-[var(--muted)] hover:text-[var(--text)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>All articles</span>
            </a>

            <header className="mt-8 border-b border-[var(--border)] pb-8">
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <span className="font-mono-tabular">{post.publishedAt}</span>
                <span aria-hidden="true">·</span>
                <span>{post.readingTime}</span>
              </div>
              <h1 className="mt-3 font-serif-display text-5xl tracking-tight text-[var(--text)] sm:text-6xl">
                {post.title}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
                {post.description}
              </p>
            </header>

            <div className="mt-10 space-y-10">
              {post.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="font-serif-display text-3xl text-[var(--text)]">
                    {section.heading}
                  </h2>
                  <div className="mt-4 space-y-4 text-base leading-relaxed text-[var(--muted)]">
                    {section.paragraphs.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </article>
      </>
    );
  }

  return (
    <>
      <SeoHead
        title={`Articles | ${siteContent.profile.name}`}
        description={`Notes and articles by ${siteContent.profile.name} on web development, digital strategy, and background.`}
        path="/blog"
        schemas={[
          buildBreadcrumbSchema(
            [
              {name: 'Home', path: '/'},
              {name: 'Articles', path: '/blog'},
            ],
            baseUrl,
          ),
        ]}
      />

      <section className="pt-32 pb-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="max-w-2xl">
            <p className="text-xs tracking-widest text-[var(--accent-text)]">
              Writing
            </p>
            <h1 className="mt-2 font-serif-display text-5xl tracking-tight text-[var(--text)] sm:text-6xl">
              Articles
            </h1>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {siteContent.blogPosts.map((post) => (
              <a
                key={post.slug}
                href={`/blog/${post.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/blog/${post.slug}`);
                }}
                className="group flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-8 transition-colors hover:border-[var(--accent)]"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    <span className="font-mono-tabular">{post.publishedAt}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.readingTime}</span>
                  </div>
                  <h2 className="mt-3 font-serif-display text-3xl text-[var(--text)] transition-colors group-hover:text-[var(--accent-text)]">
                    {post.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                    {post.description}
                  </p>
                </div>

                <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text)]">
                  <span>Read article</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
