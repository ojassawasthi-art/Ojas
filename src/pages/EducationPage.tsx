import {ArrowUpRight, Check, Copy} from 'lucide-react';
import {useState} from 'react';
import {AnimatedArrow} from '../components/MagneticButton';
import {SeoHead} from '../components/SeoHead';
import {siteContent} from '../content/site';
import {useRouter} from '../context/RouterContext';
import {buildPageSeoData} from '../lib/routeSeo';
import {getCanonicalBaseUrl} from '../lib/seo';

export function EducationPage() {
  const {navigate} = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const baseUrl = getCanonicalBaseUrl();
  const seo = buildPageSeoData('/education', baseUrl, []);

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
        path="/education"
        ogImage={seo.ogImage}
        schemas={seo.schemas}
      />

      <section className="pt-32 pb-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="max-w-3xl">
            <p className="text-xs tracking-widest text-[var(--accent-text)]">
              Academic Record
            </p>
            <h1 className="mt-2 font-serif-display text-5xl tracking-tight text-[var(--text)] sm:text-6xl">
              Education &amp; Certifications
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
              Formal schooling in Gonda, undergraduate commerce studies at the
              University of Lucknow, Company Secretary (CS) examination
              preparation, and verified credentials in digital marketing, data
              analytics, and securities markets.
            </p>
          </div>

          {/* Academic Institutions */}
          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
            {siteContent.education.map((edu) => (
              <article
                key={edu.institution}
                className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-8"
              >
                <div>
                  <p className="font-mono-tabular text-xs text-[var(--accent-text)]">
                    {edu.period}
                  </p>
                  <h2 className="mt-2 font-serif-display text-3xl tracking-tight text-[var(--text)]">
                    {edu.institution}
                  </h2>
                  <p className="mt-1.5 text-sm font-medium text-[var(--text)]">
                    {edu.degree}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
                    {edu.details}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {/* CS Preparation Clarification */}
          <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
            <p className="text-xs tracking-widest text-[var(--accent-text)]">
              Professional Preparation
            </p>
            <h2 className="mt-2 font-serif-display text-3xl tracking-tight text-[var(--text)]">
              Company Secretary (CS) Aspirant
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--muted)]">
              Alongside studying B.Com (Accounting &amp; Finance and E-commerce)
              at the University of Lucknow, {siteContent.profile.name} is
              preparing for the Company Secretary (CS) examinations. Focus areas
              include corporate governance, commercial law, regulatory compliance,
              and finance. He is currently a student preparing for the exams and
              is not yet a qualified CS.
            </p>
            <div className="mt-6 flex flex-wrap gap-6 text-xs font-medium text-[var(--text)]">
              <a
                href="/blog/st-xaviers-gonda-to-university-of-lucknow"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/blog/st-xaviers-gonda-to-university-of-lucknow');
                }}
                className="group inline-flex items-center gap-1.5 hover:text-[var(--accent-text)]"
              >
                <span>Read: Gonda to University of Lucknow</span>
                <AnimatedArrow />
              </a>
              <a
                href="/blog/preparing-for-cs-while-studying-bcom"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/blog/preparing-for-cs-while-studying-bcom');
                }}
                className="group inline-flex items-center gap-1.5 hover:text-[var(--accent-text)]"
              >
                <span>Read: Preparing for CS while studying B.Com</span>
                <AnimatedArrow />
              </a>
            </div>
          </div>

          {/* Certifications */}
          <div className="mt-20 border-t border-[var(--border)] pt-16">
            <h2 className="font-serif-display text-4xl tracking-tight text-[var(--text)]">
              Verified Certifications
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
                    <h3 className="mt-2 font-serif-display text-2xl tracking-tight text-[var(--text)]">
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
                          aria-label={`Copy credential ID ${cert.credentialId}`}
                          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-[var(--accent-text)]"
                        >
                          {copiedId === cert.credentialId ? (
                            <>
                              <Check className="h-3 w-3" aria-hidden="true" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" aria-hidden="true" />
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
                        <ArrowUpRight
                          aria-hidden="true"
                          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      </a>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
