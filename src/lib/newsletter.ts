export function getNewsletterUrl(): string {
  const raw = (import.meta.env.VITE_NEWSLETTER_URL || '').trim();
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : '';
}
