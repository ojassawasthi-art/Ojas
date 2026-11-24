import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import crypto from 'node:crypto';
import type {IncomingMessage, ServerResponse} from 'node:http';
import {Resend} from 'resend';
import {siteData, type Project, type SiteSettingsMap} from './site-data.js';

export interface ApiRequest extends IncomingMessage {
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
}

export interface ApiResponse extends ServerResponse {
  status?: (code: number) => ApiResponse;
  json?: (data: unknown) => void;
  send?: (body: string) => void;
}

export interface SupabaseAdminResolution {
  supabase: SupabaseClient | null;
  missingVars: string[];
}

export type AdminAuthResult =
  | {ok: true; userId: string; email: string}
  | {ok: false};

export class PayloadTooLargeError extends Error {
  constructor() {
    super('Request body is too large.');
    this.name = 'PayloadTooLargeError';
  }
}

export class InvalidJsonError extends Error {
  constructor() {
    super('Request body must be valid JSON.');
    this.name = 'InvalidJsonError';
  }
}

const EPHEMERAL_FALLBACK_SALT = crypto.randomBytes(32).toString('hex');
const memoryRateLimitBuckets = new Map<string, number[]>();

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Redact environment secrets and credential tokens before writing to server logs.
 */
export function redactSecrets(raw: unknown): string {
  const text =
    raw instanceof Error
      ? `${raw.name}: ${raw.message}`
      : typeof raw === 'string'
        ? raw
        : String(raw ?? '');

  const secretValues = [
    process.env.GEMINI_API_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.RESEND_API_KEY,
    process.env.RATE_LIMIT_SALT,
  ]
    .map((v) => (v || '').trim())
    .filter((v) => v.length >= 6);

  let cleaned = text;
  for (const secret of secretValues) {
    cleaned = cleaned.split(secret).join('[REDACTED]');
  }

  return cleaned
    .replace(/([?&]key=)[^&\s"']+/gi, '$1[REDACTED]')
    .replace(/(Bearer\s+)[A-Za-z0-9._\-]+/gi, '$1[REDACTED]')
    .replace(/AIza[0-9A-Za-z\-_]{16,}/g, '[REDACTED]')
    .replace(/sb_secret_[0-9A-Za-z\-_]+/g, '[REDACTED]')
    .replace(/re_[A-Za-z0-9_]{16,}/g, '[REDACTED]')
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[REDACTED_JWT]')
    .slice(0, 800);
}

/**
 * Lazily resolve Supabase credentials and instantiate client per request
 * so missing environment variables never crash at module initialization.
 */
export function getSupabaseAdmin(): SupabaseAdminResolution {
  const rawUrl = (
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  ).trim();
  const supabaseUrl = rawUrl
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  const missingVars: string[] = [];
  if (!supabaseUrl) {
    missingVars.push('VITE_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
  }
  if (!serviceRoleKey) {
    missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
  }

  if (missingVars.length > 0) {
    return {supabase: null, missingVars};
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {persistSession: false, autoRefreshToken: false},
  });
  return {supabase, missingVars: []};
}

export function getResendClient(): Resend | null {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  return apiKey ? new Resend(apiKey) : null;
}

export function getAdminEmail(): string {
  return (
    process.env.ADMIN_EMAIL ||
    process.env.VITE_ADMIN_EMAIL ||
    siteData.contact.email
  )
    .trim()
    .toLowerCase();
}

export function getBaseUrl(): string {
  const configured = (
    process.env.VITE_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    siteData.seo.siteUrl
  ).trim();
  return configured.replace(/\/+$/, '');
}

export function sendJson(res: ApiResponse, statusCode: number, data: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

export function sendText(
  res: ApiResponse,
  statusCode: number,
  contentType: string,
  body: string,
) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', contentType);
  res.end(body);
}

export async function parseJsonBody<T = Record<string, unknown>>(
  req: ApiRequest,
  options: {maxBytes?: number} = {},
): Promise<T> {
  const maxBytes = options.maxBytes ?? 64 * 1024;

  const contentLengthHeader = req.headers['content-length'];
  if (contentLengthHeader) {
    const declaredBytes = Number(contentLengthHeader);
    if (Number.isFinite(declaredBytes) && declaredBytes > maxBytes) {
      throw new PayloadTooLargeError();
    }
  }

  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      if (Buffer.byteLength(req.body, 'utf8') > maxBytes) {
        throw new PayloadTooLargeError();
      }
      if (!req.body.trim()) return {} as T;
      try {
        return JSON.parse(req.body) as T;
      } catch {
        throw new InvalidJsonError();
      }
    }
    if (typeof req.body === 'object' && req.body !== null) {
      const serialized = JSON.stringify(req.body);
      if (Buffer.byteLength(serialized, 'utf8') > maxBytes) {
        throw new PayloadTooLargeError();
      }
      return req.body as T;
    }
  }

  return await new Promise<T>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let settled = false;

    req.on('data', (chunk: Buffer) => {
      if (settled) return;
      totalBytes += chunk.byteLength;
      if (totalBytes > maxBytes) {
        settled = true;
        reject(new PayloadTooLargeError());
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      const raw = Buffer.concat(chunks).toString('utf-8');
      if (!raw.trim()) {
        settled = true;
        resolve({} as T);
        return;
      }
      try {
        settled = true;
        resolve(JSON.parse(raw) as T);
      } catch {
        settled = true;
        reject(new InvalidJsonError());
      }
    });
    req.on('error', () => {
      if (settled) return;
      settled = true;
      reject(new InvalidJsonError());
    });
  });
}

function extractHeaderValue(
  header: string | string[] | undefined,
): string {
  if (typeof header === 'string') return header.trim();
  if (Array.isArray(header) && header[0]) return header[0].trim();
  return '';
}

/**
 * Resolve client IP from trusted platform proxy headers first so spoofed
 * client-supplied X-Forwarded-For prefixes cannot bypass rate limits.
 */
export function getClientIp(req: ApiRequest): string {
  const vercelForwarded = extractHeaderValue(req.headers['x-vercel-forwarded-for']);
  if (vercelForwarded) {
    const parts = vercelForwarded
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  const realIp = extractHeaderValue(req.headers['x-real-ip']);
  if (realIp) return realIp;

  const cfIp = extractHeaderValue(req.headers['cf-connecting-ip']);
  if (cfIp) return cfIp;

  const forwarded = extractHeaderValue(req.headers['x-forwarded-for']);
  if (forwarded) {
    const parts = forwarded
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  return req.socket?.remoteAddress || 'unknown';
}

function getRateLimitSalt(): string {
  return (
    (process.env.RATE_LIMIT_SALT || '').trim() ||
    (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim() ||
    EPHEMERAL_FALLBACK_SALT
  );
}

/**
 * Keyed HMAC-SHA256 hash so stored IP hashes cannot be reversed via IPv4 rainbow tables.
 */
export function hashIp(ip: string): string {
  return crypto
    .createHmac('sha256', getRateLimitSalt())
    .update(`ip:${ip || 'unknown'}`)
    .digest('hex')
    .slice(0, 32);
}

export function hashIdentifier(scope: string, value: string): string {
  return crypto
    .createHmac('sha256', getRateLimitSalt())
    .update(`${scope}:${value || 'unknown'}`)
    .digest('hex')
    .slice(0, 32);
}

/**
 * Shared rate limiter backed by public.api_rate_limits with in-memory fallback.
 */
export async function checkRateLimit(
  supabase: SupabaseClient | null,
  opts: {
    routeKey: string;
    identifierHash: string;
    maxRequests: number;
    windowMs: number;
    recordHit?: boolean;
  },
): Promise<boolean> {
  const now = Date.now();
  const windowStartMs = now - opts.windowMs;
  const windowStartIso = new Date(windowStartMs).toISOString();
  const recordHit = opts.recordHit !== false;
  const memKey = `${opts.routeKey}:${opts.identifierHash}`;

  // Memory fast-path check
  const recentMem = (memoryRateLimitBuckets.get(memKey) || []).filter(
    (ts) => ts >= windowStartMs,
  );
  if (recentMem.length >= opts.maxRequests) {
    memoryRateLimitBuckets.set(memKey, recentMem);
    return false;
  }

  // Periodic pruning so memory map stays bounded
  if (memoryRateLimitBuckets.size > 2000) {
    for (const [key, stamps] of memoryRateLimitBuckets.entries()) {
      const fresh = stamps.filter((ts) => ts >= now - 60 * 60 * 1000);
      if (fresh.length === 0) {
        memoryRateLimitBuckets.delete(key);
      } else {
        memoryRateLimitBuckets.set(key, fresh);
      }
    }
  }

  if (supabase) {
    try {
      const {count, error} = await supabase
        .from('api_rate_limits')
        .select('*', {count: 'exact', head: true})
        .eq('route_key', opts.routeKey)
        .eq('identifier_hash', opts.identifierHash)
        .gte('created_at', windowStartIso);

      if (!error) {
        if ((count || 0) >= opts.maxRequests) {
          return false;
        }
        if (recordHit) {
          const {error: insertErr} = await supabase
            .from('api_rate_limits')
            .insert({
              route_key: opts.routeKey,
              identifier_hash: opts.identifierHash,
            });
          if (insertErr) {
            console.error(
              `[rate-limit:${opts.routeKey}] Insert warning:`,
              redactSecrets(insertErr.message),
            );
          }
        }
        if (recordHit) {
          recentMem.push(now);
          memoryRateLimitBuckets.set(memKey, recentMem);
        }
        return true;
      }
    } catch (err) {
      console.error(
        `[rate-limit:${opts.routeKey}] DB fallback:`,
        redactSecrets(err),
      );
    }
  }

  if (recordHit) {
    recentMem.push(now);
    memoryRateLimitBuckets.set(memKey, recentMem);
  }
  return true;
}

export async function verifyAdminRequest(
  req: ApiRequest,
  res: ApiResponse,
  supabase: SupabaseClient | null,
  missingVars: string[],
): Promise<AdminAuthResult> {
  if (!supabase) {
    console.error(
      '[api/admin] Supabase not configured. Missing:',
      missingVars.join(', '),
    );
    sendJson(res, 503, {error: 'Service is temporarily unavailable.'});
    return {ok: false};
  }

  const ipHash = hashIp(getClientIp(req));
  const authWindowOk = await checkRateLimit(supabase, {
    routeKey: 'admin-auth-fail',
    identifierHash: ipHash,
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
    recordHit: false,
  });
  if (!authWindowOk) {
    sendJson(res, 429, {
      error: 'Too many authentication attempts. Please try again later.',
    });
    return {ok: false};
  }

  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    await checkRateLimit(supabase, {
      routeKey: 'admin-auth-fail',
      identifierHash: ipHash,
      maxRequests: 10,
      windowMs: 15 * 60 * 1000,
      recordHit: true,
    });
    sendJson(res, 401, {error: 'Authentication required.'});
    return {ok: false};
  }

  const adminEmail = getAdminEmail();
  const {data, error} = await supabase.auth.getUser(token);
  const user = data?.user;
  const userEmail = user?.email?.toLowerCase() || '';
  const isConfirmed = Boolean(user?.email_confirmed_at);

  if (error || !user || !userEmail || !isConfirmed || userEmail !== adminEmail) {
    await checkRateLimit(supabase, {
      routeKey: 'admin-auth-fail',
      identifierHash: ipHash,
      maxRequests: 10,
      windowMs: 15 * 60 * 1000,
      recordHit: true,
    });
    sendJson(res, 403, {error: 'Admin access restricted.'});
    return {ok: false};
  }

  // Per-user + per-IP rate limit on authenticated admin requests (60/min)
  const actorHash = hashIdentifier('admin-actor', `${user.id}:${ipHash}`);
  const allowed = await checkRateLimit(supabase, {
    routeKey: 'admin-api',
    identifierHash: actorHash,
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (!allowed) {
    sendJson(res, 429, {
      error: 'Too many requests. Please slow down and try again shortly.',
    });
    return {ok: false};
  }

  return {ok: true, userId: user.id, email: userEmail};
}

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

export function isSafeHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isSafeImageUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('..')) {
    return /^\/[a-zA-Z0-9._~!$&'()*+,;=:@/-]+$/.test(trimmed);
  }
  return isSafeHttpUrl(trimmed);
}

export function sanitizeSingleLine(raw: string): string {
  return raw.replace(/[\r\n\u0000]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const ALLOWED_IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

function detectImageMimeFromBytes(buf: Buffer): string | null {
  if (buf.byteLength < 12) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF....WEBP
  if (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  // AVIF: ISO BMFF ftyp box containing avif/avis/mif1 brand
  if (buf.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brandWindow = buf.subarray(8, Math.min(buf.byteLength, 32)).toString('ascii');
    if (
      brandWindow.includes('avif') ||
      brandWindow.includes('avis') ||
      brandWindow.includes('mif1')
    ) {
      return 'image/avif';
    }
  }

  return null;
}

export type VerifiedImageUpload =
  | {ok: true; buffer: Buffer; mimeType: string; fileName: string}
  | {ok: false; error: string};

/**
 * Strictly validates an image upload payload by MIME allowlist, base64 structure,
 * 5 MB byte limit, and real file magic bytes, returning a random UUID filename.
 */
export function validateAndDecodeImageUpload(payload: {
  mimeType?: unknown;
  dataUrl?: unknown;
}): VerifiedImageUpload {
  const claimedMime =
    typeof payload.mimeType === 'string' ? payload.mimeType.trim().toLowerCase() : '';

  if (!ALLOWED_IMAGE_MIME_TO_EXT[claimedMime]) {
    return {
      ok: false,
      error: 'Only JPEG, PNG, WebP, or AVIF images are allowed.',
    };
  }

  if (typeof payload.dataUrl !== 'string') {
    return {ok: false, error: 'Invalid image payload.'};
  }

  const dataUrlMatch = payload.dataUrl.match(
    /^data:(image\/(?:jpeg|png|webp|avif));base64,([A-Za-z0-9+/=\s]+)$/i,
  );
  if (!dataUrlMatch) {
    return {ok: false, error: 'Invalid image data format.'};
  }

  const headerMime = dataUrlMatch[1].toLowerCase();
  if (headerMime !== claimedMime) {
    return {ok: false, error: 'Image type does not match payload header.'};
  }

  const base64Clean = dataUrlMatch[2].replace(/\s+/g, '');
  const buffer = Buffer.from(base64Clean, 'base64');

  if (buffer.byteLength === 0) {
    return {ok: false, error: 'Uploaded image is empty.'};
  }

  if (buffer.byteLength > 5 * 1024 * 1024) {
    return {ok: false, error: 'Image exceeds 5 MB limit.'};
  }

  const detectedMime = detectImageMimeFromBytes(buffer);
  if (!detectedMime || detectedMime !== claimedMime) {
    return {
      ok: false,
      error: 'File content does not match a valid JPEG, PNG, WebP, or AVIF image.',
    };
  }

  const ext = ALLOWED_IMAGE_MIME_TO_EXT[detectedMime];
  const randomFileName = `${crypto.randomUUID()}.${ext}`;
  return {
    ok: true,
    buffer,
    mimeType: detectedMime,
    fileName: randomFileName,
  };
}

export async function getPublishedProjects(
  supabase: SupabaseClient | null,
): Promise<Project[]> {
  if (supabase) {
    try {
      const {data, error} = await supabase
        .from('projects')
        .select('*')
        .eq('published', true)
        .order('sort_order', {ascending: true})
        .order('created_at', {ascending: false});
      if (!error && Array.isArray(data)) {
        return data as Project[];
      }
      if (error) {
        console.error(
          '[api] Failed querying projects from Supabase:',
          redactSecrets(error.message),
        );
      }
    } catch (err) {
      console.error(
        '[api] Exception querying projects from Supabase:',
        redactSecrets(err),
      );
    }
  }
  return siteData.fallbackProjects
    .filter((p) => p.published)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function getSiteSettings(
  supabase: SupabaseClient | null,
): Promise<SiteSettingsMap> {
  if (supabase) {
    try {
      const {data, error} = await supabase
        .from('site_settings')
        .select('key, value');
      if (!error && Array.isArray(data) && data.length > 0) {
        const map: SiteSettingsMap = structuredClone(siteData.fallbackSettings);
        for (const row of data) {
          if (row.key === 'availability' && row.value) {
            map.availability = row.value as SiteSettingsMap['availability'];
          }
          if (row.key === 'hero' && row.value) {
            map.hero = row.value as SiteSettingsMap['hero'];
          }
        }
        return map;
      }
      if (error) {
        console.error(
          '[api] Failed querying site_settings from Supabase:',
          redactSecrets(error.message),
        );
      }
    } catch (err) {
      console.error(
        '[api] Exception querying site_settings from Supabase:',
        redactSecrets(err),
      );
    }
  }
  return siteData.fallbackSettings;
}

export function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
