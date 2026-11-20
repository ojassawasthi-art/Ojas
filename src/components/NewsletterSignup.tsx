import {ArrowUpRight, CheckCircle2, Loader2} from 'lucide-react';
import {motion, useReducedMotion} from 'motion/react';
import {useId, useState} from 'react';
import {siteContent} from '../content/site';
import {useRouter} from '../context/RouterContext';

export interface NewsletterSignupProps {
  variant?: 'section' | 'footer';
  source?: 'home' | 'footer' | 'website';
}

const CONSENT_TEXT =
  'I agree to receive occasional emails from Ojas Awasthi. I can unsubscribe anytime.';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function getHostedNewsletterUrl(): string {
  const raw = (import.meta.env.VITE_NEWSLETTER_URL || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return '';
}

export default function NewsletterSignup({
  variant = 'section',
  source = 'website',
}: NewsletterSignupProps) {
  const {navigate} = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const idPrefix = useId();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    "You're in. Thanks for subscribing.",
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [consentError, setConsentError] = useState('');

  const hostedUrl = getHostedNewsletterUrl();
  const isFooter = variant === 'footer';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setConsentError('');

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || trimmedEmail.length > 254 || !EMAIL_PATTERN.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (trimmedName.length > 80) {
      setErrorMessage('Name must be 80 characters or fewer.');
      return;
    }

    if (!consent) {
      setConsentError('Please check the consent box to subscribe.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email: trimmedEmail,
          name: trimmedName,
          consent: true,
          consent_text: CONSENT_TEXT,
          source,
          website,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setErrorMessage(
          data.error ||
            `Could not subscribe right now. Feel free to email ${siteContent.contact.email}.`,
        );
        return;
      }

      setSuccessMessage(data.message || "You're in. Thanks for subscribing.");
      setSubmitted(true);
      setEmail('');
      setName('');
      setConsent(false);
      setWebsite('');
    } catch {
      setErrorMessage(
        `Unable to connect right now. Feel free to email ${siteContent.contact.email}.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        role="status"
        aria-live="polite"
        initial={prefersReducedMotion ? {opacity: 1} : {opacity: 0, y: 6}}
        animate={{opacity: 1, y: 0}}
        transition={
          prefersReducedMotion
            ? {duration: 0}
            : {duration: 0.25, ease: [0.16, 1, 0.3, 1]}
        }
        className={`rounded-xl border border-[var(--accent)]/50 bg-[var(--surface)] ${
          isFooter ? 'p-4' : 'p-6'
        }`}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-text)]"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p
              className={`font-medium text-[var(--text)] ${
                isFooter ? 'text-xs' : 'text-sm'
              }`}
            >
              {successMessage}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
              You can unsubscribe anytime by emailing{' '}
              <a
                href={`mailto:${siteContent.contact.email}`}
                className="text-[var(--text)] underline underline-offset-2"
              >
                {siteContent.contact.email}
              </a>
              .
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const emailId = `${idPrefix}-email`;
  const nameId = `${idPrefix}-name`;
  const consentId = `${idPrefix}-consent`;
  const websiteId = `${idPrefix}-website`;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={isFooter ? 'space-y-2.5' : 'space-y-4'}
    >
      {/* Honeypot field — bots fill it, humans never see it */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor={websiteId}>Website</label>
        <input
          id={websiteId}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {isFooter ? (
        <div className="space-y-2">
          <div>
            <label htmlFor={emailId} className="sr-only">
              Email address (required)
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Email address *"
              className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3.5 py-2 text-xs text-[var(--text)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <label htmlFor={nameId} className="sr-only">
              Name (optional)
            </label>
            <input
              id={nameId}
              name="name"
              type="text"
              maxLength={80}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (optional)"
              className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-transparent px-3.5 py-2 text-xs text-[var(--text)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--accent)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary inline-flex h-[34px] shrink-0 items-center justify-center gap-1.5 px-4 text-xs font-medium whitespace-nowrap disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <span>Subscribe</span>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="sm:col-span-5">
            <label
              htmlFor={emailId}
              className="mb-1.5 block text-xs font-medium text-[var(--muted)]"
            >
              Email address *
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4">
            <label
              htmlFor={nameId}
              className="mb-1.5 block text-xs font-medium text-[var(--muted)]"
            >
              Name (optional)
            </label>
            <input
              id={nameId}
              name="name"
              type="text"
              maxLength={80}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div className="flex items-end sm:col-span-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary inline-flex h-[42px] w-full items-center justify-center gap-2 px-5 text-sm font-medium whitespace-nowrap disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Joining...</span>
                </>
              ) : (
                <span>Subscribe</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Consent checkbox */}
      <div>
        <div className="flex items-start gap-2.5">
          <input
            id={consentId}
            name="consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (e.target.checked) setConsentError('');
            }}
            aria-invalid={Boolean(consentError)}
            aria-describedby={consentError ? `${consentId}-error` : undefined}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border border-[var(--border)] accent-[var(--accent)]"
          />
          <label
            htmlFor={consentId}
            className={`cursor-pointer leading-relaxed text-[var(--muted)] ${
              isFooter ? 'text-[11px]' : 'text-xs'
            }`}
          >
            {CONSENT_TEXT}{' '}
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                navigate('/privacy');
              }}
              className="text-[var(--text)] underline decoration-[var(--accent)] underline-offset-2 transition-colors hover:text-[var(--accent-text)]"
            >
              Privacy policy
            </a>
            .
          </label>
        </div>

        {consentError && (
          <p
            id={`${consentId}-error`}
            role="alert"
            aria-live="polite"
            className="mt-1.5 text-xs text-red-600 dark:text-red-400"
          >
            {consentError}
          </p>
        )}
      </div>

      {/* Live status / error region */}
      <div aria-live="polite" aria-atomic="true">
        {errorMessage && (
          <p
            role="alert"
            className="rounded-xl border border-red-300 bg-red-50 px-3.5 py-2 text-xs leading-relaxed text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
          >
            {errorMessage}
          </p>
        )}
      </div>

      {/* Optional hosted signup URL (shown only if VITE_NEWSLETTER_URL is configured) */}
      {hostedUrl && (
        <p className={isFooter ? 'text-[11px] text-[var(--muted)]' : 'text-xs text-[var(--muted)]'}>
          Prefer a hosted signup page?{' '}
          <a
            href={hostedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-medium text-[var(--text)] underline decoration-[var(--accent)] underline-offset-2 transition-colors hover:text-[var(--accent-text)]"
          >
            <span>Subscribe here</span>
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </a>
        </p>
      )}
    </form>
  );
}
