import type {SupabaseClient} from '@supabase/supabase-js';
import {
  getClientIp,
  hashIp,
  InvalidJsonError,
  parseJsonBody,
  PayloadTooLargeError,
  redactSecrets,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from './vercel.js';

export interface NewsletterRecord {
  id: string;
  email: string;
  name: string | null;
  source: string;
  consent: boolean;
  consent_text: string | null;
  ip_hash: string | null;
  created_at: string;
}

interface NewsletterRequestBody {
  email?: unknown;
  name?: unknown;
  consent?: unknown;
  consent_text?: unknown;
  source?: unknown;
  website?: unknown;
}

export const DEFAULT_CONSENT_TEXT =
  'I agree to receive occasional emails from Ojas Awasthi. I can unsubscribe anytime.';

const SUCCESS_MESSAGE = "You're in. Thanks for subscribing.";
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_REGEX = /^[^\s@<>()[\]\\.,;:\s@"]+(\.[^\s@<>()[\]\\.,;:\s@"]+)*@[^\s@<>()[\]\\.,;:\s@"]+\.[^\s@<>()[\]\\.,;:\s@"]{2,}$/;

const memoryRateLimits = new Map<string, number[]>();

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/\u0000/g, '').trim();
}

function sanitizeSource(raw: unknown): string {
  if (typeof raw !== 'string') return 'website';
  const cleaned = stripTags(raw)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 40);
  return cleaned || 'website';
}

function recordMemoryHit(ipHash: string, now: number): number {
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recent = (memoryRateLimits.get(ipHash) || []).filter(
    (ts) => ts >= windowStart,
  );
  recent.push(now);
  memoryRateLimits.set(ipHash, recent);
  return recent.length;
}

function getMemoryHitCount(ipHash: string, now: number): number {
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recent = (memoryRateLimits.get(ipHash) || []).filter(
    (ts) => ts >= windowStart,
  );
  memoryRateLimits.set(ipHash, recent);
  return recent.length;
}

async function isRateLimited(
  supabase: SupabaseClient | null,
  ipHash: string,
): Promise<boolean> {
  const now = Date.now();
  if (getMemoryHitCount(ipHash, now) >= RATE_LIMIT_MAX) {
    return true;
  }

  if (supabase) {
    try {
      const oneHourAgoIso = new Date(now - RATE_LIMIT_WINDOW_MS).toISOString();
      const {count, error} = await supabase
        .from('newsletter_subscribers')
        .select('*', {count: 'exact', head: true})
        .eq('ip_hash', ipHash)
        .gte('created_at', oneHourAgoIso);

      if (!error && (count || 0) >= RATE_LIMIT_MAX) {
        return true;
      }
      if (error) {
        console.error(
          '[api/newsletter] Rate limit check warning:',
          redactSecrets(error.message),
        );
      }
    } catch (err) {
      console.error('[api/newsletter] Rate limit exception:', redactSecrets(err));
    }
  }

  return false;
}

export async function handleNewsletterSignup(
  req: ApiRequest,
  res: ApiResponse,
  supabase: SupabaseClient | null,
  missingVars: string[],
  fallbackStore?: NewsletterRecord[],
): Promise<void> {
  try {
    res.setHeader('X-Robots-Tag', 'noindex');
    res.setHeader('Cache-Control', 'no-store');

    const body = await parseJsonBody<NewsletterRequestBody>(req, {
      maxBytes: 16 * 1024,
    });

    // Honeypot: silently succeed without saving if bots fill "website"
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      sendJson(res, 200, {ok: true, message: SUCCESS_MESSAGE});
      return;
    }

    // Validate email format & length (max 254)
    const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
    if (!rawEmail || rawEmail.length > 254 || !EMAIL_REGEX.test(rawEmail)) {
      sendJson(res, 400, {error: 'Please enter a valid email address.'});
      return;
    }
    const normalizedEmail = rawEmail.toLowerCase();

    // Validate optional name (max 80)
    let cleanName: string | null = null;
    if (body.name !== undefined && body.name !== null && body.name !== '') {
      if (typeof body.name !== 'string') {
        sendJson(res, 400, {error: 'Name must be plain text.'});
        return;
      }
      const trimmedName = stripTags(body.name);
      if (trimmedName.length > 80) {
        sendJson(res, 400, {error: 'Name must be 80 characters or fewer.'});
        return;
      }
      cleanName = trimmedName || null;
    }

    // Require explicit consent === true
    if (body.consent !== true) {
      sendJson(res, 400, {
        error: 'Please check the consent box to subscribe.',
      });
      return;
    }

    const source = sanitizeSource(body.source);
    const consentText =
      typeof body.consent_text === 'string' && stripTags(body.consent_text)
        ? stripTags(body.consent_text).slice(0, 300)
        : DEFAULT_CONSENT_TEXT;

    // Rate limit: 5 signups per hour per IP hash
    const ipHash = hashIp(getClientIp(req));
    if (await isRateLimited(supabase, ipHash)) {
      sendJson(res, 429, {
        error: 'Too many signup attempts. Please try again in an hour.',
      });
      return;
    }

    // Record attempt in memory window before DB write
    recordMemoryHit(ipHash, Date.now());

    // Local preview fallback when Supabase admin is not configured in dev server
    if (!supabase) {
      if (fallbackStore) {
        const exists = fallbackStore.some(
          (item) => item.email.toLowerCase() === normalizedEmail,
        );
        if (!exists) {
          fallbackStore.unshift({
            id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            email: normalizedEmail,
            name: cleanName,
            source,
            consent: true,
            consent_text: consentText,
            ip_hash: ipHash,
            created_at: new Date().toISOString(),
          });
        }
        sendJson(res, 200, {ok: true, message: SUCCESS_MESSAGE});
        return;
      }

      console.error(
        '[api/newsletter] Supabase not configured. Missing:',
        missingVars.join(', '),
      );
      sendJson(res, 503, {
        error: 'Unable to subscribe right now. Please try again later.',
      });
      return;
    }

    // Exact case-normalized duplicate check (avoids LIKE wildcards on _ or %)
    const {data: existing, error: lookupError} = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', normalizedEmail)
      .limit(1);

    if (lookupError) {
      console.error('[api/newsletter] Lookup error:', redactSecrets(lookupError.message));
    } else if (Array.isArray(existing) && existing.length > 0) {
      sendJson(res, 200, {ok: true, message: SUCCESS_MESSAGE});
      return;
    }

    // Insert new subscriber (no emails sent)
    const {error: insertError} = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: normalizedEmail,
        name: cleanName,
        source,
        consent: true,
        consent_text: consentText,
        ip_hash: ipHash,
      });

    if (insertError) {
      // Unique constraint violation (duplicate race condition) -> still return success quietly
      if (
        insertError.code === '23505' ||
        insertError.message?.toLowerCase().includes('duplicate')
      ) {
        sendJson(res, 200, {ok: true, message: SUCCESS_MESSAGE});
        return;
      }

      console.error('[api/newsletter] Insert error:', redactSecrets(insertError.message));
      sendJson(res, 500, {
        error: 'Unable to subscribe right now. Please try again later.',
      });
      return;
    }

    sendJson(res, 200, {ok: true, message: SUCCESS_MESSAGE});
  } catch (err) {
    if (err instanceof PayloadTooLargeError) {
      sendJson(res, 413, {error: 'Request payload is too large.'});
      return;
    }
    if (err instanceof InvalidJsonError) {
      sendJson(res, 400, {error: 'Invalid request format.'});
      return;
    }
    console.error('[api/newsletter] Error:', redactSecrets(err));
    sendJson(res, 500, {
      error: 'Unable to subscribe right now. Please try again later.',
    });
  }
}
