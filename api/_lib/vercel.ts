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

export async function verifyAdminRequest(
  req: ApiRequest,
  res: ApiResponse,
  supabase: SupabaseClient | null,
  missingVars: string[],
): Promise<boolean> {
  if (!supabase) {
    sendJson(res, 500, {
      error: `Missing required environment variable(s): ${missingVars.join(', ')}`,
    });
    return false;
  }

  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    sendJson(res, 401, {error: 'Missing authentication token.'});
    return false;
  }

  const adminEmail = getAdminEmail();
  const {data, error} = await supabase.auth.getUser(token);
  if (
    error ||
    !data.user?.email ||
    data.user.email.toLowerCase() !== adminEmail
  ) {
    sendJson(res, 403, {error: 'Admin access restricted.'});
    return false;
  }
  return true;
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
        console.error('[api] Failed querying projects from Supabase:', error);
      }
    } catch (err) {
      console.error('[api] Exception querying projects from Supabase:', err);
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
        console.error('[api] Failed querying site_settings from Supabase:', error);
      }
    } catch (err) {
      console.error('[api] Exception querying site_settings from Supabase:', err);
    }
  }
  return siteData.fallbackSettings;
}

export function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
