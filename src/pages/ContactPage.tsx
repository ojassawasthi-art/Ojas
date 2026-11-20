import {zodResolver} from '@hookform/resolvers/zod';
import {ArrowUpRight, Check, CheckCircle2, Copy, Loader2} from 'lucide-react';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {ContactForm} from '../components/ContactForm';
import {SeoHead} from '../components/SeoHead';
import {siteContent} from '../content/site';
import {buildPageSeoData} from '../lib/routeSeo';
import {getCanonicalBaseUrl} from '../lib/seo';

const testimonialSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120),
  role: z.string().trim().min(2, 'Role is required').max(120),
  company: z.string().trim().max(120).optional(),
  quote: z
    .string()
    .trim()
    .min(10, 'Please share at least 10 characters')
    .max(1500),
});

type TestimonialValues = z.infer<typeof testimonialSchema>;

export function ContactPage() {
  const [tab, setTab] = useState<'message' | 'testimonial'>('message');
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<TestimonialValues>({
    resolver: zodResolver(testimonialSchema),
  });

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(siteContent.contact.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const onTestimonialSubmit = async (values: TestimonialValues) => {
    setTestResult(null);
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestResult({
          type: 'error',
          text: data.error || 'Could not submit testimonial right now.',
        });
        return;
      }
      setTestResult({
        type: 'success',
        text: data.message || 'Thank you. Your note has been submitted for review.',
      });
      reset();
    } catch {
      setTestResult({
        type: 'error',
        text: `Unable to reach server. Email ${siteContent.contact.email} instead.`,
      });
    }
  };

  const baseUrl = getCanonicalBaseUrl();
  const seo = buildPageSeoData('/contact', baseUrl, []);

  return (
    <>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path="/contact"
        ogImage={seo.ogImage}
        schemas={seo.schemas}
      />

      <section className="pt-32 pb-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-xs tracking-widest text-[var(--accent-text)]">
                Get in touch
              </p>
              <h1 className="mt-2 font-serif-display text-5xl leading-[1.02] tracking-tight text-[var(--text)] sm:text-6xl">
                Let&apos;s build something together
              </h1>
              <p className="mt-4 text-base text-[var(--muted)]">
                Based in {siteContent.profile.location}. Always glad to connect
                around web builds, digital strategy, law, finance, and marketing.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${siteContent.contact.email}`}
                  className="text-lg font-medium text-[var(--text)] underline decoration-[var(--accent)] underline-offset-4"
                >
                  {siteContent.contact.email}
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="btn-secondary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium"
                >
                  {copied ? (
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

              <div className="mt-8 grid grid-cols-2 gap-3">
                {siteContent.contact.socials.map((social) => {
                  const isExternal = social.url.startsWith('http');
                  return (
                    <a
                      key={social.name}
                      href={social.url}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                      className="card-elevated group flex items-center justify-between bg-[var(--surface)] px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-[var(--text)]">
                          {social.name}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {social.handle}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-[var(--muted)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--accent-text)]" />
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="mb-5 inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
                <button
                  type="button"
                  onClick={() => setTab('message')}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                    tab === 'message'
                      ? 'bg-[var(--accent-button)] text-[var(--accent-contrast)] shadow-xs'
                      : 'text-[var(--muted)] hover:text-[var(--accent-text)]'
                  }`}
                >
                  Send a message
                </button>
                <button
                  type="button"
                  onClick={() => setTab('testimonial')}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                    tab === 'testimonial'
                      ? 'bg-[var(--accent-button)] text-[var(--accent-contrast)] shadow-xs'
                      : 'text-[var(--muted)] hover:text-[var(--accent-text)]'
                  }`}
                >
                  Leave a testimonial
                </button>
              </div>

              <div className="card-elevated bg-[var(--surface)] p-7 sm:p-10">
                {tab === 'message' ? (
                  <ContactForm />
                ) : (
                  <form
                    onSubmit={handleSubmit(onTestimonialSubmit)}
                    className="space-y-5"
                  >
                    <p className="text-sm text-[var(--muted)]">
                      Worked with me on a website or project? Submitted notes
                      appear on the site once approved.
                    </p>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="test-name"
                          className="block text-xs font-medium text-[var(--muted)]"
                        >
                          Name
                        </label>
                        <input
                          id="test-name"
                          type="text"
                          {...register('name')}
                          className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                        />
                        {errors.name && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {errors.name.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="test-role"
                          className="block text-xs font-medium text-[var(--muted)]"
                        >
                          Role
                        </label>
                        <input
                          id="test-role"
                          type="text"
                          {...register('role')}
                          className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                        />
                        {errors.role && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {errors.role.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="test-company"
                        className="block text-xs font-medium text-[var(--muted)]"
                      >
                        Organization (optional)
                      </label>
                      <input
                        id="test-company"
                        type="text"
                        {...register('company')}
                        className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="test-quote"
                        className="block text-xs font-medium text-[var(--muted)]"
                      >
                        Note
                      </label>
                      <textarea
                        id="test-quote"
                        rows={4}
                        {...register('quote')}
                        className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                      />
                      {errors.quote && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {errors.quote.message}
                        </p>
                      )}
                    </div>

                    {testResult && (
                      <div
                        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs ${
                          testResult.type === 'success'
                            ? 'border-[var(--accent)]/40 bg-[var(--surface)] text-[var(--text)]'
                            : 'border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300'
                        }`}
                      >
                        {testResult.type === 'success' && (
                          <CheckCircle2 className="h-4 w-4 text-[var(--accent-text)]" />
                        )}
                        <span>{testResult.text}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm font-medium disabled:opacity-60"
                    >
                      {isSubmitting && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <span>Submit for review</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
