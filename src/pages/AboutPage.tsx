import {ArrowUpRight, Check, Copy} from 'lucide-react';
import {useState} from 'react';
import {JourneyTimeline} from '../components/JourneyTimeline';
import {AnimatedArrow} from '../components/MagneticButton';
import {PortraitArch} from '../components/PortraitArch';
import {SeoHead} from '../components/SeoHead';
import {siteContent} from '../content/site';
import {useRouter} from '../context/RouterContext';
import {buildPageSeoData} from '../lib/routeSeo';
import {getCanonicalBaseUrl} from '../lib/seo';

export function AboutPage() {
  const {navigate} = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const baseUrl = getCanonicalBaseUrl();
  const seo = buildPageSeoData('/about', baseUrl, []);

  const handleCopy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path="/about"
        ogImage={seo.ogImage}
        schemas={seo.schemas}
      />

      <section className="pt-32 pb-20">
        <div className="mx-auto max-w-[1200px] px-6">
          {/* 1. Who is Ojas Awasthi */}
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-xs tracking-widest text-[var(--accent-text)]">
                Profile · <span lang="hi">{siteContent.profile.hindiName}</span>
              </p>
              <h1 className="mt-2 font-serif-display text-5xl tracking-tight text-[var(--text)] sm:text-7xl">
                Who is {siteContent.profile.name}?
              </h1>
              <p className="mt-4 text-sm text-[var(--muted)]">
                {siteContent.profile.siteHeadline}
              </p>

              <div className="mt-8 space-y-5 text-base leading-relaxed text-[var(--text)]">
                {siteContent.profile.bioParagraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <PortraitArch />
            </div>
          </div>

          {/* 2. School, 3. University of Lucknow, 4. CS Preparation */}
          <div className="mt-20 grid grid-cols-1 gap-8 border-t border-[var(--border)] pt-16 md:grid-cols-3">
            <section>
              <h2 className="font-serif-display text-3xl text-[var(--text)]">
                School (St. Xavier&apos;s, Gonda)
              </h2>
              <p className="font-mono-tabular mt-4 text-xs text-[var(--accent-text)]">
                Apr 2017 – Mar 2026 · Grade 12
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Completed schooling through Grade 12 at St. Xavier&apos;s High
                School, Gonda, Uttar Pradesh while building early digital and
                e-commerce projects.
              </p>
            </section>

            <section>
              <h2 className="font-serif-display text-3xl text-[var(--text)]">
                University of Lucknow
              </h2>
              <p className="font-mono-tabular mt-4 text-xs text-[var(--accent-text)]">
                Aug 2026 – Present · B.Com
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Pursuing a Bachelor of Commerce (B.Com) in Accounting &amp;
                Finance and E-commerce at the University of Lucknow.
              </p>
            </section>

            <section>
              <h2 className="font-serif-display text-3xl text-[var(--text)]">
                Company Secretary (CS) Preparation
              </h2>
              <p className="font-mono-tabular mt-4 text-xs text-[var(--accent-text)]">
                CS Aspirant
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Actively preparing for the Company Secretary (CS) examinations
                with focus on corporate governance, law, and finance. Currently a
                student preparing for the exams and not yet a qualified CS.
              </p>
            </section>
          </div>

          {/* 5. Web Development, 6. Digital Marketing & SEO, 7. Books & Writing */}
          <div className="mt-16 grid grid-cols-1 gap-8 border-t border-[var(--border)] pt-16 md:grid-cols-3">
            <section>
              <h2 className="font-serif-display text-3xl text-[var(--text)]">
                Web Development
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
                Freelance web developer in Lucknow designing and building fast,
                responsive websites using React, Next.js, Tailwind CSS, and
                Supabase, including published projects such as Nutstridinida.
              </p>
              <a
                href="/services"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/services');
                }}
                className="group mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-text)]"
              >
                <span>View web services</span>
                <AnimatedArrow />
              </a>
            </section>

            <section>
              <h2 className="font-serif-display text-3xl text-[var(--text)]">
                Digital Marketing &amp; SEO
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
                Certified in Digital Marketing by HubSpot Academy, applying
                inbound strategy, technical SEO architecture, clean HTML
                semantics, and analytics in real brand builds.
              </p>
              <a
                href="/work"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/work');
                }}
                className="group mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-text)]"
              >
                <span>View selected work</span>
                <AnimatedArrow />
              </a>
            </section>

            <section>
              <h2 className="font-serif-display text-3xl text-[var(--text)]">
                Books &amp; Writing
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
                Published two books: Mastering the Art of Manipulation:
                Psychology behind Manipulation on Amazon Kindle (Mar 27, 2026)
                and The Echoes of Love on Amazon and Google Play Books.
              </p>
              <a
                href="/books"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/books');
                }}
                className="group mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-text)]"
              >
                <span>Explore published books</span>
                <AnimatedArrow />
              </a>
            </section>
          </div>

          {/* 8. The Vaxn Store & Journey */}
          <div className="mt-20 border-t border-[var(--border)] pt-16">
            <h2 className="font-serif-display text-4xl tracking-tight text-[var(--text)]">
              The Vaxn Store &amp; Experience
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--muted)]">
              From September 2020 to April 2024, Ojas founded and operated VAXN
              Fashion / The Vaxn Store with two friends—running SEO, hosting,
              and promotions solo across dropshipping and thrifted luxury
              menswear to thousands of sales before closing by choice to uphold
              product quality.
            </p>
            <JourneyTimeline />
          </div>

          {/* 9. Certifications */}
          <div className="mt-20 border-t border-[var(--border)] pt-16">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <h2 className="font-serif-display text-4xl tracking-tight text-[var(--text)]">
                Certifications
              </h2>
              <a
                href="/education"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/education');
                }}
                className="group inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-text)]"
              >
                <span>Full education &amp; credentials page</span>
                <AnimatedArrow />
              </a>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {siteContent.certifications.map((cert) => (
                <article
                  key={cert.id}
                  className="card-elevated flex flex-col justify-between bg-[var(--surface)] p-7"
                >
                  <div>
                    <p className="text-xs font-medium text-[var(--accent-text)]">
                      {cert.issuer}
                    </p>
                    <h3 className="mt-2 font-serif-display text-2xl text-[var(--text)]">
                      {cert.title}
                    </h3>
                    <p className="font-mono-tabular mt-2 text-xs text-[var(--muted)]">
                      {cert.issued}
                      {cert.expires ? ` · ${cert.expires}` : ''}
                    </p>
                    {cert.skills.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {cert.skills.map((skill) => (
                          <span key={skill} className="tag-pill">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {cert.credentialId && (
                      <div className="mt-4 flex items-center justify-between gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2">
                        <span className="font-mono-tabular truncate text-[11px] text-[var(--text)]">
                          {cert.credentialId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(cert.credentialId)}
                          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-[var(--accent-text)]"
                        >
                          {copiedId === cert.credentialId ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {cert.verifyUrl && (
                    <div className="mt-5 border-t border-[var(--border)] pt-4">
                      <a
                        href={cert.verifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text)] hover:text-[var(--accent-text)]"
                      >
                        <span>Verify credential</span>
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--accent-text)]" />
                      </a>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>

          {/* 10. Languages & 11. Contact */}
          <div className="mt-20 grid grid-cols-1 gap-8 border-t border-[var(--border)] pt-16 md:grid-cols-2">
            <section>
              <h2 className="font-serif-display text-3xl text-[var(--text)]">
                Languages
              </h2>
              <div className="mt-6 space-y-4">
                {siteContent.profile.languages.map((lang) => (
                  <div key={lang.name}>
                    <p className="text-base font-medium text-[var(--text)]">
                      {lang.name}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {lang.proficiency}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-serif-display text-3xl text-[var(--text)]">
                Contact
              </h2>
              <p className="mt-6 text-sm leading-relaxed text-[var(--muted)]">
                Based in {siteContent.profile.location}. Always open to
                connecting around web development, digital marketing, law,
                finance, and publishing.
              </p>
              <div className="mt-5 flex flex-wrap gap-5 text-sm">
                <a
                  href={`mailto:${siteContent.contact.email}`}
                  className="font-medium text-[var(--text)] underline decoration-[var(--accent)] underline-offset-4"
                >
                  {siteContent.contact.email}
                </a>
                <a
                  href="/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/contact');
                  }}
                  className="group inline-flex items-center gap-1.5 font-medium text-[var(--accent-text)]"
                >
                  <span>Open contact form</span>
                  <AnimatedArrow />
                </a>
              </div>
            </section>
          </div>

          {/* Frequently Asked Questions (All 13 items) */}
          <div className="mt-20 border-t border-[var(--border)] pt-16">
            <h2 className="font-serif-display text-4xl tracking-tight text-[var(--text)]">
              Common questions
            </h2>
            <dl className="card-elevated mt-8 divide-y divide-[var(--border)] bg-[var(--surface)] px-7">
              {siteContent.faqs.map((faq) => (
                <div key={faq.question} className="py-6" lang={faq.lang}>
                  <dt className="font-serif-display text-2xl text-[var(--text)]">
                    {faq.question}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {siteContent.profile.showFatherOnPage && (
            <p className="mt-10 text-xs text-[var(--muted)]">
              Son of {siteContent.profile.fatherName}.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
