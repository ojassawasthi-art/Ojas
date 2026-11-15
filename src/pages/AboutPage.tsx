import {ArrowUpRight, Check, Copy} from 'lucide-react';
import {useState} from 'react';
import {JourneyTimeline} from '../components/JourneyTimeline';
import {PortraitArch} from '../components/PortraitArch';
import {SeoHead} from '../components/SeoHead';
import {siteContent} from '../content/site';
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildPersonSchema,
  getCanonicalBaseUrl,
} from '../lib/seo';

export function AboutPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const baseUrl = getCanonicalBaseUrl();

  const handleCopy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <>
      <SeoHead
        title={`About ${siteContent.profile.name} | Web Developer & Author in Lucknow`}
        description={`Learn about ${siteContent.profile.name}: web development, The Vaxn Store, University of Lucknow B.Com, CS preparation, books, and certifications.`}
        path="/about"
        schemas={[
          buildPersonSchema(baseUrl),
          buildFaqSchema(),
          buildBreadcrumbSchema(
            [
              {name: 'Home', path: '/'},
              {name: 'About', path: '/about'},
            ],
            baseUrl,
          ),
        ]}
      />

      <section className="pt-32 pb-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-xs tracking-widest text-[var(--accent-text)]">
                Profile
              </p>
              <h1 className="mt-2 font-serif-display text-5xl tracking-tight text-[var(--text)] sm:text-7xl">
                {siteContent.profile.name}
              </h1>
              <p className="mt-4 text-sm text-[var(--muted)]">
                {siteContent.profile.linkedinHeadline}
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

          {/* Education, Languages, Interests */}
          <div className="mt-20 grid grid-cols-1 gap-8 border-t border-[var(--border)] pt-16 md:grid-cols-3">
            <div>
              <h2 className="font-serif-display text-3xl text-[var(--text)]">
                Education
              </h2>
              <div className="mt-6 space-y-6">
                {siteContent.education.map((edu) => (
                  <div key={edu.institution}>
                    <p className="font-mono-tabular text-xs text-[var(--muted)]">
                      {edu.period}
                    </p>
                    <p className="mt-1 text-base font-medium text-[var(--text)]">
                      {edu.institution}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--muted)]">
                      {edu.degree}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
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
            </div>

            <div>
              <h2 className="font-serif-display text-3xl text-[var(--text)]">
                Focus areas
              </h2>
              <p className="mt-6 text-sm leading-relaxed text-[var(--muted)]">
                {siteContent.profile.interests.join(' · ')}
              </p>
            </div>
          </div>

          {/* Journey */}
          <div className="mt-20 border-t border-[var(--border)] pt-16">
            <h2 className="font-serif-display text-4xl tracking-tight text-[var(--text)]">
              Journey
            </h2>
            <JourneyTimeline />
          </div>

          {/* Certifications */}
          <div className="mt-20 border-t border-[var(--border)] pt-16">
            <h2 className="font-serif-display text-4xl tracking-tight text-[var(--text)]">
              Certifications
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {siteContent.certifications.map((cert) => (
                <article
                  key={cert.id}
                  className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-7"
                >
                  <div>
                    <p className="text-xs text-[var(--accent-text)]">
                      {cert.issuer}
                    </p>
                    <h3 className="mt-2 font-serif-display text-2xl text-[var(--text)]">
                      {cert.title}
                    </h3>
                    <p className="font-mono-tabular mt-2 text-xs text-[var(--muted)]">
                      {cert.issued}
                      {cert.expires ? ` · ${cert.expires}` : ''}
                    </p>
                    <p className="mt-3 text-xs text-[var(--muted)]">
                      {cert.skills.join(' · ')}
                    </p>

                    {cert.credentialId && (
                      <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                        <span className="font-mono-tabular truncate text-[11px] text-[var(--text)]">
                          {cert.credentialId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(cert.credentialId)}
                          className="inline-flex shrink-0 items-center gap-1 text-[11px] text-[var(--accent-text)]"
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
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="mt-20 border-t border-[var(--border)] pt-16">
            <h2 className="font-serif-display text-4xl tracking-tight text-[var(--text)]">
              Common questions
            </h2>
            <dl className="mt-8 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-7">
              {siteContent.faqs.map((faq) => (
                <div key={faq.question} className="py-6">
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
        </div>
      </section>
    </>
  );
}
