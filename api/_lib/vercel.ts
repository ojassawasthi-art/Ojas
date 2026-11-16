import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import crypto from 'node:crypto';
import type {IncomingMessage, ServerResponse} from 'node:http';
import {Resend} from 'resend';
import {siteContent} from '../../src/content/site';
import type {Project, SiteSettingsMap} from '../../src/types/database';

export interface ApiRequest extends IncomingMessage {
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
}

export interface ApiResponse extends ServerResponse {
  status?: (code: number) => ApiResponse;
  json?: (data: unknown) => void;
  send?: (body: string) => void;
}

const SUPABASE_URL = (
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://hdryciyvkhozomertslx.supabase.co'
)
  .trim()
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');
const SUPABASE_SERVICE_ROLE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
).trim();
const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();

export const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ||
  process.env.VITE_ADMIN_EMAIL ||
  'ojassawasthi@gmail.com'
)
  .trim()
  .toLowerCase();

export const isSupabaseAdminReady = Boolean(
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY,
);

export const supabaseAdmin: SupabaseClient | null = isSupabaseAdminReady
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {persistSession: false, autoRefreshToken: false},
    })
  : null;

// Skip Resend initialization cleanly if RESEND_API_KEY is empty
export const resend: Resend | null = RESEND_API_KEY
  ? new Resend(RESEND_API_KEY)
  : null;

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
): Promise<T> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body) as T;
      } catch {
        return {} as T;
      }
    }
    if (typeof req.body === 'object' && req.body !== null) {
      return req.body as T;
    }
  }

  return await new Promise<T>((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8');
      if (!raw) {
        resolve({} as T);
        return;
      }
      try {
        resolve(JSON.parse(raw) as T);
      } catch {
        resolve({} as T);
      }
    });
    req.on('error', () => resolve({} as T));
  });
}

export function getClientIp(req: ApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

export function hashIp(ip: string): string {
  return crypto
    .createHash('sha256')
    .update(ip || 'unknown')
    .digest('hex')
    .slice(0, 24);
}

export function getBaseUrl(_req?: ApiRequest): string {
  const configured = (
    process.env.VITE_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://ojasawasthii.vercel.app'
  ).trim();
  return configured.replace(/\/+$/, '');
}

export async function verifyAdminRequest(
  req: ApiRequest,
  res: ApiResponse,
): Promise<boolean> {
  if (isSupabaseAdminReady && supabaseAdmin) {
    const authHeader = String(req.headers.authorization || '');
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      sendJson(res, 401, {error: 'Missing authentication token.'});
      return false;
    }
    const {data, error} = await supabaseAdmin.auth.getUser(token);
    if (
      error ||
      !data.user?.email ||
      data.user.email.toLowerCase() !== ADMIN_EMAIL
    ) {
      sendJson(res, 403, {error: 'Admin access restricted.'});
      return false;
    }
    return true;
  }

  sendJson(res, 503, {
    error:
      'Supabase server credentials (SUPABASE_SERVICE_ROLE_KEY) are not configured in environment variables.',
  });
  return false;
}

export async function getPublishedProjects(): Promise<Project[]> {
  if (supabaseAdmin) {
    const {data, error} = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('published', true)
      .order('sort_order', {ascending: true})
      .order('created_at', {ascending: false});
    if (!error && Array.isArray(data)) {
      return data as Project[];
    }
  }
  return siteContent.fallbackProjects
    .filter((p) => p.published)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function getSiteSettings(): Promise<SiteSettingsMap> {
  if (supabaseAdmin) {
    const {data, error} = await supabaseAdmin
      .from('site_settings')
      .select('key, value');
    if (!error && Array.isArray(data) && data.length > 0) {
      const map: SiteSettingsMap = structuredClone(siteContent.fallbackSettings);
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
  }
  return siteContent.fallbackSettings;
}

export function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
