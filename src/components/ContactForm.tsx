import {zodResolver} from '@hookform/resolvers/zod';
import {CheckCircle2, Loader2, Mail} from 'lucide-react';
import {motion} from 'motion/react';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {siteContent} from '../content/site';
import {AnimatedArrow, MagneticButton} from './MagneticButton';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name (at least 2 characters).').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(254),
  subject: z.string().trim().min(2, 'Please include a short subject.').max(200),
  message: z
    .string()
    .trim()
    .min(10, 'Please share a few details (at least 10 characters).')
    .max(5000),
  // Honeypot field — bots fill this, humans leave it blank
  website: z.string().max(0).optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [submitState, setSubmitState] = useState<'idle' | 'success' | 'fallback' | 'error'>('idle');
  const [serverMessage, setServerMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
      website: '',
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setSubmitState('idle');
    setServerMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitState('error');
        setServerMessage(
          data.error || `Unable to submit right now. Please email ${siteContent.contact.email}.`,
        );
        return;
      }

      if (data.emailFallback) {
        setSubmitState('fallback');
        setServerMessage(
          data.message ||
            `Message recorded locally. You can also reach me directly at ${siteContent.contact.email}.`,
        );
      } else {
        setSubmitState('success');
        setServerMessage(data.message || 'Thank you — your message has been sent.');
      }
      reset();
    } catch {
      setSubmitState('error');
      setServerMessage(
        `Network error. Please contact me directly by email at ${siteContent.contact.email}.`,
      );
    }
  };

  if (submitState === 'success' || submitState === 'fallback') {
    return (
      <motion.div
        initial={{opacity: 0, y: 12}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.35, ease: [0.16, 1, 0.3, 1]}}
        className="card-elevated bg-[var(--surface)] p-8"
      >
        <div className="flex items-start gap-4">
          <CheckCircle2
            className="mt-0.5 h-6 w-6 shrink-0 text-[var(--accent-text)]"
            aria-hidden="true"
          />
          <div>
            <h3 className="font-serif-display text-3xl text-[var(--text)]">
              {submitState === 'success' ? 'Message received' : 'Ready to connect by email'}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              {serverMessage}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setSubmitState('idle')}
                className="btn-secondary px-4 py-2 text-xs font-medium"
              >
                Send another message
              </button>
              <a
                href={`mailto:${siteContent.contact.email}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-text)] underline decoration-[var(--accent)] underline-offset-4"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {siteContent.contact.email}
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register('website')}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="relative">
          <input
            id="contact-name"
            type="text"
            placeholder=" "
            {...register('name')}
            className="peer w-full rounded-xl border border-[var(--border)] bg-transparent px-4 pt-6 pb-2.5 text-sm text-[var(--text)] transition-colors focus:border-[var(--accent)] focus:outline-none"
          />
          <label
            htmlFor="contact-name"
            className="pointer-events-none absolute top-2 left-4 text-[11px] text-[var(--muted)] transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-[var(--accent-text)]"
          >
            Your name
          </label>
          {errors.name && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="relative">
          <input
            id="contact-email"
            type="email"
            placeholder=" "
            {...register('email')}
            className="peer w-full rounded-xl border border-[var(--border)] bg-transparent px-4 pt-6 pb-2.5 text-sm text-[var(--text)] transition-colors focus:border-[var(--accent)] focus:outline-none"
          />
          <label
            htmlFor="contact-email"
            className="pointer-events-none absolute top-2 left-4 text-[11px] text-[var(--muted)] transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-[var(--accent-text)]"
          >
            Email address
          </label>
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div className="relative">
        <input
          id="contact-subject"
          type="text"
          placeholder=" "
          {...register('subject')}
          className="peer w-full rounded-xl border border-[var(--border)] bg-transparent px-4 pt-6 pb-2.5 text-sm text-[var(--text)] transition-colors focus:border-[var(--accent)] focus:outline-none"
        />
        <label
          htmlFor="contact-subject"
          className="pointer-events-none absolute top-2 left-4 text-[11px] text-[var(--muted)] transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-[var(--accent-text)]"
        >
          Subject
        </label>
        {errors.subject && (
          <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
            {errors.subject.message}
          </p>
        )}
      </div>

      <div className="relative">
        <textarea
          id="contact-message"
          rows={5}
          placeholder=" "
          {...register('message')}
          className="peer w-full resize-y rounded-xl border border-[var(--border)] bg-transparent px-4 pt-6 pb-3 text-sm text-[var(--text)] transition-colors focus:border-[var(--accent)] focus:outline-none"
        />
        <label
          htmlFor="contact-message"
          className="pointer-events-none absolute top-2 left-4 text-[11px] text-[var(--muted)] transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-[var(--accent-text)]"
        >
          Message
        </label>
        {errors.message && (
          <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
            {errors.message.message}
          </p>
        )}
      </div>

      {submitState === 'error' && serverMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
        >
          {serverMessage}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <MagneticButton
          type="submit"
          disabled={isSubmitting}
          className="btn-primary px-6 py-3 text-sm font-medium disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>Send message</span>
              <AnimatedArrow />
            </>
          )}
        </MagneticButton>

        <p className="text-xs text-[var(--muted)]">
          Or email directly at{' '}
          <a
            href={`mailto:${siteContent.contact.email}`}
            className="text-[var(--accent-text)] underline decoration-[var(--accent)] underline-offset-4"
          >
            {siteContent.contact.email}
          </a>
        </p>
      </div>
    </form>
  );
}
