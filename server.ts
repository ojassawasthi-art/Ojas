import 'dotenv/config';
import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, {type NextFunction, type Request, type Response} from 'express';
import {Resend} from 'resend';
import {createServer as createViteServer} from 'vite';
import {z} from 'zod';
import {handleChatRequest, type ChatLogRecord} from './api/_lib/chat.js';
import {handleNewsletterSignup, type NewsletterRecord} from './api/_lib/newsletter.js';
import {
  checkRateLimit,
  getClientIp,
  hashIdentifier,
  hashIp,
  isSafeHttpUrl,
  isSafeImageUrl,
  isUuid,
  redactSecrets,
  sanitizeSingleLine,
  validateAndDecodeImageUpload,
} from './api/_lib/vercel.js';
import {siteContent} from './src/content/site';
import {buildPageSeoData, injectSeoIntoHtml} from './src/lib/routeSeo';
import type {
  ContactMessage,
  PageView,
  Project,
  SiteSettingsMap,
  Testimonial,
} from './src/types/database';

function resolveServerPort(): number {
  const portFlagIdx = process.argv.indexOf('--port');
  if (portFlagIdx !== -1 && process.argv[portFlagIdx + 1]) {
    const cliPort = Number(process.argv[portFlagIdx + 1]);
    if (Number.isFinite(cliPort) && cliPort > 0) return cliPort;
  }
  const envPort = Number(process.env.PORT);
  const nginxPort = Number(process.env.NGINX_PORT);
  if (Number.isFinite(envPort) && envPort > 0 && envPort !== nginxPort) {
    return envPort;
  }
  return 3000;
}

const PORT = resolveServerPort();
const isProd = process.env.NODE_ENV === 'production';

const SUPABASE_URL = (
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  ''
)
  .trim()
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');
const SUPABASE_ANON_KEY = (
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''
).trim();
const SUPABASE_SERVICE_ROLE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
).trim();
const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();
const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ||
  process.env.VITE_ADMIN_EMAIL ||
  'ojassawasthi@gmail.com'
)
  .trim()
  .toLowerCase();

const isSupabaseAdminReady = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
const isSupabasePublicReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const supabaseAdmin: SupabaseClient | null = isSupabaseAdminReady
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {persistSession: false, autoRefreshToken: false},
    })
  : null;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// In-memory fallback store used ONLY when Supabase env vars are missing
const fallbackStore: {
  projects: Project[];
  messages: ContactMessage[];
  testimonials: Testimonial[];
  subscribers: NewsletterRecord[];
  pageViews: PageView[];
  chatLogs: ChatLogRecord[];
  settings: SiteSettingsMap;
} = {
  projects: structuredClone(siteContent.fallbackProjects),
  messages: [],
  testimonials: [],
  subscribers: [],
  pageViews: [],
  chatLogs: [],
  settings: structuredClone(siteContent.fallbackSettings),
};

interface AuthedRequest extends Request {
  adminUserId?: string;
}

function getBaseUrl(_req: Request): string {
  const configured =
    process.env.VITE_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://ojasawasthii.vercel.app';
  return configured.trim().replace(/\/+$/, '');
}

async function verifyAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  res.setHeader('Cache-Control', 'no-store');

  if (!isSupabaseAdminReady || !supabaseAdmin) {
    res.status(503).json({error: 'Admin service is not configured.'});
    return;
  }

  const ipHash = hashIp(getClientIp(req));
  const authWindowOk = await checkRateLimit(supabaseAdmin, {
    routeKey: 'admin-auth-fail',
    identifierHash: ipHash,
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
    recordHit: false,
  });
  if (!authWindowOk) {
    res.status(429).json({
      error: 'Too many authentication attempts. Please try again later.',
    });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    await checkRateLimit(supabaseAdmin, {
      routeKey: 'admin-auth-fail',
      identifierHash: ipHash,
      maxRequests: 10,
      windowMs: 15 * 60 * 1000,
      recordHit: true,
    });
    res.status(401).json({error: 'Authentication required.'});
    return;
  }

  const {data, error} = await supabaseAdmin.auth.getUser(token);
  const user = data?.user;
  const userEmail = user?.email?.toLowerCase() || '';
  const isConfirmed = Boolean(user?.email_confirmed_at);

  if (error || !user || !userEmail || !isConfirmed || userEmail !== ADMIN_EMAIL) {
    await checkRateLimit(supabaseAdmin, {
      routeKey: 'admin-auth-fail',
      identifierHash: ipHash,
      maxRequests: 10,
      windowMs: 15 * 60 * 1000,
      recordHit: true,
    });
    res.status(403).json({error: 'Admin access restricted.'});
    return;
  }

  const actorHash = hashIdentifier('admin-actor', `${user.id}:${ipHash}`);
  const allowed = await checkRateLimit(supabaseAdmin, {
    routeKey: 'admin-api',
    identifierHash: actorHash,
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (!allowed) {
    res.status(429).json({
      error: 'Too many requests. Please slow down and try again shortly.',
    });
    return;
  }

  req.adminUserId = user.id;
  next();
}

async function getPublishedProjects(): Promise<Project[]> {
  if (supabaseAdmin) {
    try {
      const result = await Promise.race([
        supabaseAdmin
          .from('projects')
          .select('*')
          .eq('published', true)
          .order('sort_order', {ascending: true})
          .order('created_at', {ascending: false}),
        new Promise<{data: null; error: Error}>((resolve) =>
          setTimeout(() => resolve({data: null, error: new Error('timeout')}), 3000),
        ),
      ]);
      if (!result.error && Array.isArray(result.data)) {
        return result.data as Project[];
      }
    } catch {
      // Fall back cleanly to static projects
    }
  }
  return fallbackStore.projects
    .filter((p) => p.published)
    .sort((a, b) => a.sort_order - b.sort_order);
}

async function getSiteSettings(): Promise<SiteSettingsMap> {
  if (supabaseAdmin) {
    const {data, error} = await supabaseAdmin.from('site_settings').select('key, value');
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
  return fallbackStore.settings;
}

const optionalHttpUrl = z
  .union([z.string().trim().max(500), z.null(), z.undefined()])
  .transform((val) => (val ? val : null))
  .refine((val) => val === null || isSafeHttpUrl(val), {
    message: 'URL must start with http:// or https://',
  });

const optionalImageUrl = z
  .union([z.string().trim().max(500), z.null(), z.undefined()])
  .transform((val) => (val ? val : null))
  .refine((val) => val === null || isSafeImageUrl(val), {
    message: 'Image URL must be a valid http(s) URL or site-relative path.',
  });

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format.');

const contactBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(200).optional(),
});

const testimonialSchema = z.object({
  name: z.string().trim().min(2).max(120),
  role: z.string().trim().min(2).max(120),
  company: z.string().trim().max(120).optional().default(''),
  quote: z.string().trim().min(10).max(1500),
  website: z.string().max(200).optional(),
});

const analyticsSchema = z.object({
  path: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .refine((val) => val.startsWith('/') && !val.startsWith('//'))
    .optional()
    .default('/'),
  referrer: z.string().trim().max(200).optional().default(''),
  device: z.enum(['mobile', 'desktop']).optional().default('desktop'),
});

const projectPayloadSchema = z.object({
  title: z.string().trim().min(1).max(140),
  slug: slugSchema,
  description: z.string().trim().min(1).max(1000),
  long_description: z
    .union([z.string().trim().max(10000), z.null(), z.undefined()])
    .transform((v) => (v ? v : null)),
  live_url: optionalHttpUrl,
  github_url: optionalHttpUrl,
  thumbnail_url: optionalImageUrl,
  images: z
    .array(
      z
        .string()
        .trim()
        .max(500)
        .refine((v) => isSafeImageUrl(v)),
    )
    .max(12)
    .optional()
    .default([]),
  tech_stack: z
    .array(z.string().trim().min(1).max(60))
    .max(20)
    .optional()
    .default([]),
  category: z.string().trim().min(1).max(60).optional().default('Web'),
  year: z.string().trim().min(1).max(30).optional().default('2026'),
  featured: z.boolean().optional().default(false),
  published: z.boolean().optional().default(true),
  status_tag: z
    .union([z.string().trim().max(80), z.null(), z.undefined()])
    .transform((v) => (v ? v : null)),
  role: z
    .union([z.string().trim().max(120), z.null(), z.undefined()])
    .transform((v) => (v ? v : null)),
});

const reorderSchema = z.object({
  orderedIds: z
    .array(z.string().trim().refine((id) => isUuid(id)))
    .min(1)
    .max(100),
});

const messageStatusSchema = z.object({
  status: z.enum(['new', 'read', 'replied']),
});

const testimonialPatchSchema = z.object({
  approved: z.boolean(),
});

const settingsPayloadSchema = z.object({
  settings: z.object({
    availability: z.object({
      enabled: z.boolean(),
      text: z.string().trim().min(1).max(120),
    }),
    hero: z.object({
      headline: z.string().trim().min(1).max(240),
    }),
  }),
});

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');

  const uploadJsonParser = express.json({limit: '7.5mb'});
  const defaultJsonParser = express.json({limit: '64kb'});

  // Route-scoped JSON body size limits
  app.use((req, res, next) => {
    if (req.path === '/api/admin/upload') {
      uploadJsonParser(req, res, next);
      return;
    }
    defaultJsonParser(req, res, next);
  });

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    next();
  });

  // --------------------------------------------------------------------------
  // PUBLIC API ROUTES
  // --------------------------------------------------------------------------
  app.get('/api/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ok: true,
      supabaseConnected: isSupabaseAdminReady && isSupabasePublicReady,
    });
  });

  app.get('/api/projects', async (_req, res) => {
    const projects = await getPublishedProjects();
    res.json({
      projects,
      supabaseConnected: isSupabaseAdminReady,
    });
  });

  app.get('/api/settings', async (_req, res) => {
    const settings = await getSiteSettings();
    res.json({settings});
  });

  app.get('/api/testimonials', async (_req, res) => {
    if (supabaseAdmin) {
      const {data, error} = await supabaseAdmin
        .from('testimonials')
        .select('id, name, role, company, quote, avatar_url, approved, created_at')
        .eq('approved', true)
        .order('created_at', {ascending: false});
      if (!error && Array.isArray(data)) {
        res.json({testimonials: data});
        return;
      }
    }
    res.json({
      testimonials: fallbackStore.testimonials.filter((t) => t.approved),
    });
  });

  app.post('/api/contact', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const parsed = contactBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({error: 'Please check your form entries and try again.'});
      return;
    }

    // Honeypot check
    if (parsed.data.website && parsed.data.website.trim().length > 0) {
      res.json({ok: true, message: 'Message received.'});
      return;
    }

    const ipHash = hashIp(getClientIp(req));
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    // Rate limit: 3 submissions per hour per IP hash
    const sharedAllowed = await checkRateLimit(supabaseAdmin, {
      routeKey: 'contact',
      identifierHash: ipHash,
      maxRequests: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!sharedAllowed) {
      res.status(429).json({
        error: `Rate limit reached (3 messages per hour). Please email ${siteContent.contact.email} directly.`,
      });
      return;
    }

    if (supabaseAdmin) {
      const {count} = await supabaseAdmin
        .from('contact_messages')
        .select('*', {count: 'exact', head: true})
        .eq('ip_hash', ipHash)
        .gte('created_at', new Date(oneHourAgo).toISOString());

      if ((count || 0) >= 3) {
        res.status(429).json({
          error: `Rate limit reached (3 messages per hour). Please email ${siteContent.contact.email} directly.`,
        });
        return;
      }
    }

    const cleanName = sanitizeSingleLine(parsed.data.name);
    const cleanSubject = sanitizeSingleLine(parsed.data.subject);

    let savedToDb = false;
    if (supabaseAdmin) {
      const {error} = await supabaseAdmin.from('contact_messages').insert({
        name: cleanName,
        email: parsed.data.email,
        subject: cleanSubject,
        message: parsed.data.message,
        ip_hash: ipHash,
        status: 'new',
      });
      if (!error) savedToDb = true;
    } else {
      fallbackStore.messages.unshift({
        id: crypto.randomUUID(),
        name: cleanName,
        email: parsed.data.email,
        subject: cleanSubject,
        message: parsed.data.message,
        ip_hash: ipHash,
        status: 'new',
        created_at: new Date().toISOString(),
      });
    }

    let emailed = false;
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Ojas Awasthi Portfolio <onboarding@resend.dev>',
          to: ADMIN_EMAIL,
          replyTo: parsed.data.email,
          subject: `[Portfolio Contact] ${cleanSubject}`,
          text: `From: ${cleanName} (${parsed.data.email})\n\n${parsed.data.message}`,
        });
        emailed = true;
      } catch (err) {
        console.error('[api/contact resend] Email error:', redactSecrets(err));
      }
    }

    if (!savedToDb && !emailed) {
      res.json({
        ok: true,
        emailFallback: true,
        message: `Supabase and email notifications are not configured in this preview yet. For direct inquiries, please email ${siteContent.contact.email}.`,
      });
      return;
    }

    res.json({
      ok: true,
      emailFallback: false,
      message: 'Thank you — your message has been delivered.',
    });
  });

  app.post('/api/newsletter', async (req, res) => {
    await handleNewsletterSignup(
      req,
      res,
      supabaseAdmin,
      [],
      fallbackStore.subscribers,
    );
  });

  app.post('/api/testimonials', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const parsed = testimonialSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({error: 'Please fill out all required fields.'});
      return;
    }

    if (parsed.data.website && parsed.data.website.trim().length > 0) {
      res.json({
        ok: true,
        message: 'Thank you. Your testimonial has been queued for approval.',
      });
      return;
    }

    const ipHash = hashIp(getClientIp(req));
    const allowed = await checkRateLimit(supabaseAdmin, {
      routeKey: 'testimonials',
      identifierHash: ipHash,
      maxRequests: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!allowed) {
      res.status(429).json({
        error: 'Too many submissions right now. Please try again later.',
      });
      return;
    }

    if (supabaseAdmin) {
      const {error} = await supabaseAdmin.from('testimonials').insert({
        name: parsed.data.name,
        role: parsed.data.role,
        company: parsed.data.company || '',
        quote: parsed.data.quote,
        approved: false,
      });
      if (error) {
        console.error(
          '[api/testimonials POST] Error:',
          redactSecrets(error.message),
        );
        res.status(500).json({error: 'Unable to submit testimonial.'});
        return;
      }
    } else {
      fallbackStore.testimonials.unshift({
        id: crypto.randomUUID(),
        name: parsed.data.name,
        role: parsed.data.role,
        company: parsed.data.company || '',
        quote: parsed.data.quote,
        avatar_url: null,
        approved: false,
        created_at: new Date().toISOString(),
      });
    }

    res.json({
      ok: true,
      message: 'Thank you. Your testimonial has been queued for approval.',
    });
  });

  app.post('/api/analytics', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const ipHash = hashIp(getClientIp(req));
    const allowed = await checkRateLimit(supabaseAdmin, {
      routeKey: 'analytics',
      identifierHash: ipHash,
      maxRequests: 60,
      windowMs: 60 * 1000,
    });
    if (!allowed) {
      res.status(429).json({error: 'Rate limit exceeded.'});
      return;
    }

    const parsed = analyticsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({error: 'Invalid analytics payload.'});
      return;
    }

    const referrerStr = sanitizeSingleLine(parsed.data.referrer).slice(0, 200);
    const countryStr = sanitizeSingleLine(
      String(req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'] || ''),
    ).slice(0, 10);

    if (supabaseAdmin) {
      await supabaseAdmin.from('page_views').insert({
        path: parsed.data.path,
        referrer: referrerStr,
        country: countryStr,
        device: parsed.data.device,
      });
    } else {
      fallbackStore.pageViews.unshift({
        id: crypto.randomUUID(),
        path: parsed.data.path,
        referrer: referrerStr,
        country: countryStr,
        device: parsed.data.device,
        created_at: new Date().toISOString(),
      });
      if (fallbackStore.pageViews.length > 500) {
        fallbackStore.pageViews.length = 500;
      }
    }
    res.json({ok: true});
  });

  app.post('/api/chat', async (req, res) => {
    await handleChatRequest(req, res, supabaseAdmin, (entry) => {
      fallbackStore.chatLogs.unshift(entry);
      if (fallbackStore.chatLogs.length > 200) {
        fallbackStore.chatLogs.length = 200;
      }
    });
  });

  // --------------------------------------------------------------------------
  // ADMIN API ROUTES (Require verified Supabase Admin JWT)
  // --------------------------------------------------------------------------
  app.get('/api/admin/projects', verifyAdmin, async (_req, res) => {
    if (!supabaseAdmin) {
      res.status(503).json({error: 'Service is temporarily unavailable.'});
      return;
    }
    const {data, error} = await supabaseAdmin
      .from('projects')
      .select('*')
      .order('sort_order', {ascending: true})
      .order('created_at', {ascending: false});
    if (error) {
      console.error('[api/admin/projects GET] Error:', redactSecrets(error.message));
      res.status(500).json({error: 'Unable to load projects.'});
      return;
    }
    res.json({projects: data || []});
  });

  app.post('/api/admin/projects', verifyAdmin, async (req, res) => {
    if (!supabaseAdmin) {
      res.status(503).json({error: 'Service is temporarily unavailable.'});
      return;
    }
    const parsed = projectPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Please check the project details (valid slug and http/https URLs required).',
      });
      return;
    }

    const {data, error} = await supabaseAdmin
      .from('projects')
      .insert({
        title: parsed.data.title,
        slug: parsed.data.slug,
        description: parsed.data.description,
        long_description: parsed.data.long_description,
        live_url: parsed.data.live_url,
        github_url: parsed.data.github_url,
        thumbnail_url: parsed.data.thumbnail_url,
        images: parsed.data.images,
        tech_stack: parsed.data.tech_stack,
        category: parsed.data.category,
        year: parsed.data.year,
        featured: parsed.data.featured,
        published: parsed.data.published,
        sort_order: 0,
      })
      .select()
      .single();
    if (error) {
      console.error('[api/admin/projects POST] Error:', redactSecrets(error.message));
      res.status(400).json({error: 'Unable to create project.'});
      return;
    }
    res.json({project: data});
  });

  app.patch('/api/admin/projects/:id', verifyAdmin, async (req, res) => {
    if (!supabaseAdmin) {
      res.status(503).json({error: 'Service is temporarily unavailable.'});
      return;
    }
    const {id} = req.params;
    if (!isUuid(id)) {
      res.status(400).json({error: 'Invalid project ID.'});
      return;
    }
    const parsed = projectPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Please check the project details (valid slug and http/https URLs required).',
      });
      return;
    }

    const {data, error} = await supabaseAdmin
      .from('projects')
      .update({
        title: parsed.data.title,
        slug: parsed.data.slug,
        description: parsed.data.description,
        long_description: parsed.data.long_description,
        live_url: parsed.data.live_url,
        github_url: parsed.data.github_url,
        thumbnail_url: parsed.data.thumbnail_url,
        tech_stack: parsed.data.tech_stack,
        category: parsed.data.category,
        year: parsed.data.year,
        featured: parsed.data.featured,
        published: parsed.data.published,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('[api/admin/projects PATCH] Error:', redactSecrets(error.message));
      res.status(400).json({error: 'Unable to update project.'});
      return;
    }
    res.json({project: data});
  });

  app.delete('/api/admin/projects/:id', verifyAdmin, async (req, res) => {
    if (!supabaseAdmin) {
      res.status(503).json({error: 'Service is temporarily unavailable.'});
      return;
    }
    const {id} = req.params;
    if (!isUuid(id)) {
      res.status(400).json({error: 'Invalid project ID.'});
      return;
    }
    const {error} = await supabaseAdmin.from('projects').delete().eq('id', id);
    if (error) {
      console.error('[api/admin/projects DELETE] Error:', redactSecrets(error.message));
      res.status(400).json({error: 'Unable to delete project.'});
      return;
    }
    res.json({ok: true});
  });

  app.post('/api/admin/projects/reorder', verifyAdmin, async (req, res) => {
    if (!supabaseAdmin) {
      res.status(503).json({error: 'Service is temporarily unavailable.'});
      return;
    }
    const parsed = reorderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({error: 'Invalid project order payload.'});
      return;
    }
    await Promise.all(
      parsed.data.orderedIds.map((id, idx) =>
        supabaseAdmin.from('projects').update({sort_order: idx + 1}).eq('id', id),
      ),
    );
    res.json({ok: true});
  });

  app.post('/api/admin/upload', verifyAdmin, async (req: AuthedRequest, res) => {
    if (!supabaseAdmin) {
      res.status(503).json({error: 'Service is temporarily unavailable.'});
      return;
    }
    const ipHash = hashIp(getClientIp(req));
    const uploadActor = hashIdentifier(
      'admin-upload',
      `${req.adminUserId || 'admin'}:${ipHash}`,
    );
    const uploadAllowed = await checkRateLimit(supabaseAdmin, {
      routeKey: 'admin-upload',
      identifierHash: uploadActor,
      maxRequests: 15,
      windowMs: 10 * 60 * 1000,
    });
    if (!uploadAllowed) {
      res.status(429).json({
        error: 'Too many uploads. Please wait a few minutes and try again.',
      });
      return;
    }

    const verified = validateAndDecodeImageUpload(req.body || {});
    if (!verified.ok) {
      res.status(400).json({error: verified.error});
      return;
    }

    const {error} = await supabaseAdmin.storage
      .from('project-images')
      .upload(verified.fileName, verified.buffer, {
        contentType: verified.mimeType,
        cacheControl: '31536000',
        upsert: false,
      });
    if (error) {
      console.error('[api/admin/upload] Error:', redactSecrets(error.message));
      res.status(500).json({error: 'Unable to upload image right now.'});
      return;
    }
    const {data: pub} = supabaseAdmin.storage
      .from('project-images')
      .getPublicUrl(verified.fileName);
    res.json({url: pub.publicUrl});
  });

  app.get('/api/admin/messages', verifyAdmin, async (_req, res) => {
    if (!supabaseAdmin) {
      res.status(503).json({error: 'Service is temporarily unavailable.'});
      return;
    }
    const {data, error} = await supabaseAdmin
      .from('contact_messages')
      .select('*')
      .order('created_at', {ascending: false});
    if (error) {
      console.error('[api/admin/messages GET] Error:', redactSecrets(error.message));
      res.status(500).json({error: 'Unable to load messages.'});
      return;
    }
    res.json({messages: data || []});
  });

  app.patch('/api/admin/messages/:id', verifyAdmin, async (req, res) => {
    if (!supabaseAdmin) {
      res.status(503).json({error: 'Service is temporarily unavailable.'});
      return;
    }
    const {id} = req.params;
    if (!isUuid(id)) {
      res.status(400).json({error: 'Invalid message ID.'});
      return;
    }
    const parsed = messageStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({error: 'Invalid message status.'});
      return;
    }
    const {error} = await supabaseAdmin
      .from('contact_messages')
      .update({status: parsed.data.status})
      .eq('id', id);
    if (error) {
      console.error('[api/admin/messages PATCH] Error:', redactSecrets(error.message));
      res.status(400).json({error: 'Unable to update message status.'});
      return;
    }
    res.json({ok: true});
  });

  app.get('/api/admin/testimonials', verifyAdmin, async (_req, res) => {
    if (!supabaseAdmin) {
      res.status(503).json({error: 'Service is temporarily unavailable.'});
      return;
    }
    const {data, error} = await supabaseAdmin
      .from('testimonials')
      .select('*')
      .order('created_at', {ascending: false});
    if (error) {
      console.error('[api/admin/testimonials GET] Error:', redactSecrets(error.message));
      res.status(500).json({error: 'Unable to load testimonials.'});
      return;
    }
    res.json({testimonials: data || []});
  });

  app.patch('/api/admin/testimonials/:id', verifyAdmin, async (req, res) => {
    if (!supabaseAdmin) {
      res.status(503).json({error: 'Service is temporarily unavailable.'});
      return;
    }
    const {id} = req.params;
    if (!isUuid(id)) {
      res.status(400).json({error: 'Invalid testimonial ID.'});
      return;
    }
    const parsed = testimonialPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({error: 'Invalid testimonial update payload.'});
      return;
    }
    const {error} = await supabaseAdmin
      .from('testimonials')
      .update({approved: parsed.data.approved})
      .eq('id', id);
    if (error) {
      console.error('[api/admin/testimonials PATCH] Error:', redactSecrets(error.message));
      res.status(400).json({error: 'Unable to update testimonial.'});
      return;
    }
    res.json({ok: true});
  });

  app.delete('/api/admin/testimonials/:id', verifyAdmin, async (req, res) => {
    if (!supabaseAdmin) {
      res.status(503).json({error: 'Service is temporarily unavailable.'});
      return;
    }
    const {id} = req.params;
    if (!isUuid(id)) {
      res.status(400).json({error: 'Invalid testimonial ID.'});
      return;
    }
    const {error} = await supabaseAdmin.from('testimonials').delete().eq('id', id);
    if (error) {
      console.error('[api/admin/testimonials DELETE] Error:', redactSecrets(error.message));
      res.status(400).json({error: 'Unable to delete testimonial.'});
      return;
    }
    res.json({ok: true});
  });

  app.get('/api/admin/analytics', verifyAdmin, async (_req, res) => {
    if (!supabaseAdmin) {
      res.status(503).json({error: 'Service is temporarily unavailable.'});
      return;
    }
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const {data, error} = await supabaseAdmin
      .from('page_views')
      .select('*')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', {ascending: false});
    if (error) {
      console.error('[api/admin/analytics GET] Error:', redactSecrets(error.message));
      res.status(500).json({error: 'Unable to load analytics.'});
      return;
    }
    res.json({views: data || []});
  });

  app.get('/api/admin/chat-logs', verifyAdmin, async (_req, res) => {
    if (!supabaseAdmin) {
      res.status(503).json({error: 'Service is temporarily unavailable.'});
      return;
    }
    const {data, error} = await supabaseAdmin
      .from('chat_logs')
      .select('id, question, answer, ip_hash, created_at')
      .order('created_at', {ascending: false})
      .limit(200);
    if (error) {
      console.error('[api/admin/chat-logs GET] Error:', redactSecrets(error.message));
      if (
        error.code === '42P01' ||
        error.message?.toLowerCase().includes('chat_logs')
      ) {
        res.json({logs: [], tableMissing: true});
        return;
      }
      res.status(500).json({error: 'Unable to load chat logs.'});
      return;
    }
    res.json({logs: data || []});
  });

  app.get('/api/admin/newsletter', verifyAdmin, async (_req, res) => {
    if (!supabaseAdmin) {
      res.status(503).json({error: 'Service is temporarily unavailable.'});
      return;
    }
    const {data, error} = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', {ascending: false});
    if (error) {
      console.error('[api/admin/newsletter GET] Error:', redactSecrets(error.message));
      res.status(500).json({error: 'Unable to load subscribers.'});
      return;
    }
    const subscribers = (data || []).map((row) => ({
      id: String(row.id),
      email: String(row.email || ''),
      name: row.name ? String(row.name) : null,
      source: row.source ? String(row.source) : 'website',
      consent: Boolean(row.consent),
      consent_text: row.consent_text ? String(row.consent_text) : null,
      created_at: String(row.created_at || ''),
    }));
    res.json({subscribers});
  });

  app.delete('/api/admin/newsletter/:id', verifyAdmin, async (req, res) => {
    if (!supabaseAdmin) {
      res.status(503).json({error: 'Service is temporarily unavailable.'});
      return;
    }
    const {id} = req.params;
    if (!isUuid(id)) {
      res.status(400).json({error: 'Invalid subscriber ID.'});
      return;
    }
    const {error} = await supabaseAdmin
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('[api/admin/newsletter DELETE] Error:', redactSecrets(error.message));
      res.status(400).json({error: 'Unable to delete subscriber.'});
      return;
    }
    res.json({ok: true});
  });

  app.put('/api/admin/settings', verifyAdmin, async (req, res) => {
    if (!supabaseAdmin) {
      res.status(503).json({error: 'Service is temporarily unavailable.'});
      return;
    }
    const parsed = settingsPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({error: 'Invalid settings payload.'});
      return;
    }
    const {error} = await supabaseAdmin.from('site_settings').upsert([
      {key: 'availability', value: parsed.data.settings.availability},
      {key: 'hero', value: parsed.data.settings.hero},
    ]);
    if (error) {
      console.error('[api/admin/settings PUT] Error:', redactSecrets(error.message));
      res.status(400).json({error: 'Unable to update settings.'});
      return;
    }
    res.json({ok: true});
  });

  // --------------------------------------------------------------------------
  // TECHNICAL SEO ROUTES (sitemap.xml, robots.txt)
  // --------------------------------------------------------------------------
  app.get('/sitemap.xml', async (req, res) => {
    const baseUrl = getBaseUrl(req);
    const projects = await getPublishedProjects();
    const nowIso = new Date().toISOString();

    const entries: {
      loc: string;
      lastmod: string;
      changefreq: string;
      priority: string;
      images?: {loc: string; title: string}[];
    }[] = [
      {
        loc: '/',
        lastmod: nowIso,
        changefreq: 'weekly',
        priority: '1.0',
        images: [
          {
            loc: `${baseUrl}/images/ojas.jpg`,
            title: 'Ojas Awasthi, web developer and author from Lucknow',
          },
          {
            loc: `${baseUrl}/og-image.png`,
            title: 'Ojas Awasthi — Web Developer, Digital Marketer & Author in Lucknow',
          },
        ],
      },
      {
        loc: '/about',
        lastmod: nowIso,
        changefreq: 'monthly',
        priority: '0.9',
        images: [{loc: `${baseUrl}/images/ojas.jpg`, title: 'Ojas Awasthi portrait'}],
      },
      {loc: '/education', lastmod: nowIso, changefreq: 'monthly', priority: '0.8'},
      {loc: '/books', lastmod: nowIso, changefreq: 'monthly', priority: '0.8'},
      {loc: '/services', lastmod: nowIso, changefreq: 'monthly', priority: '0.8'},
      {
        loc: '/web-developer-lucknow',
        lastmod: nowIso,
        changefreq: 'monthly',
        priority: '0.8',
        images: [
          {
            loc: `${baseUrl}/images/ojas.jpg`,
            title: 'Ojas Awasthi, freelance web developer based in Lucknow, Uttar Pradesh',
          },
        ],
      },
      {
        loc: '/website-developer-gonda',
        lastmod: nowIso,
        changefreq: 'monthly',
        priority: '0.8',
        images: [
          {
            loc: `${baseUrl}/images/ojas.jpg`,
            title: 'Ojas Awasthi, website developer serving Gonda remotely from Lucknow',
          },
        ],
      },
      {
        loc: '/seo-lucknow-gonda',
        lastmod: nowIso,
        changefreq: 'monthly',
        priority: '0.8',
        images: [
          {
            loc: `${baseUrl}/images/ojas.jpg`,
            title: 'Ojas Awasthi, technical and local SEO for Lucknow and Gonda websites',
          },
        ],
      },
      {
        loc: '/digital-marketing-lucknow-gonda',
        lastmod: nowIso,
        changefreq: 'monthly',
        priority: '0.8',
        images: [
          {
            loc: `${baseUrl}/images/ojas.jpg`,
            title: 'Ojas Awasthi, HubSpot-certified digital marketer serving Lucknow and Gonda',
          },
        ],
      },
      {loc: '/work', lastmod: nowIso, changefreq: 'weekly', priority: '0.9'},
      {loc: '/blog', lastmod: nowIso, changefreq: 'weekly', priority: '0.8'},
      {loc: '/press-kit', lastmod: nowIso, changefreq: 'monthly', priority: '0.7'},
      {loc: '/links', lastmod: nowIso, changefreq: 'monthly', priority: '0.7'},
      {loc: '/contact', lastmod: nowIso, changefreq: 'monthly', priority: '0.7'},
      {loc: '/privacy', lastmod: nowIso, changefreq: 'yearly', priority: '0.4'},
      ...siteContent.blogPosts.map((b) => {
        const parsed = new Date(b.publishedAt);
        return {
          loc: `/blog/${b.slug}`,
          lastmod: Number.isNaN(parsed.getTime()) ? nowIso : parsed.toISOString(),
          changefreq: 'monthly',
          priority: '0.7',
        };
      }),
      ...projects.map((p) => {
        const parsed = p.created_at ? new Date(p.created_at) : new Date(nowIso);
        const imgs =
          p.thumbnail_url && isSafeHttpUrl(p.thumbnail_url)
            ? [{loc: p.thumbnail_url, title: `${p.title} by Ojas Awasthi`}]
            : undefined;
        return {
          loc: `/work/${p.slug}`,
          lastmod: Number.isNaN(parsed.getTime()) ? nowIso : parsed.toISOString(),
          changefreq: 'monthly',
          priority: '0.8',
          images: imgs,
        };
      }),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries
  .map((entry) => {
    const imgTags = (entry.images || [])
      .map(
        (img) => `    <image:image>
      <image:loc>${escapeHtml(img.loc)}</image:loc>
      <image:title>${escapeHtml(img.title)}</image:title>
    </image:image>`,
      )
      .join('\n');
    return `  <url>
    <loc>${escapeHtml(`${baseUrl}${entry.loc === '/' ? '' : entry.loc}`)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>${imgTags ? `\n${imgTags}` : ''}
  </url>`;
  })
  .join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  });

  app.get('/robots.txt', (req, res) => {
    const baseUrl = getBaseUrl(req);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(
      `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${baseUrl}/sitemap.xml\n`,
    );
  });

  // --------------------------------------------------------------------------
  // VITE / STATIC SERVING WITH ROUTE-AWARE SEO META INJECTION
  // --------------------------------------------------------------------------
  if (!isProd) {
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const rawHtml = fs.readFileSync(
          path.resolve(process.cwd(), 'index.html'),
          'utf-8',
        );
        const transformed = await vite.transformIndexHtml(url, rawHtml);
        const baseUrl = getBaseUrl(req);
        const projects = await getPublishedProjects();
        const seo = buildPageSeoData(url, baseUrl, projects);
        const injected = injectSeoIntoHtml(transformed, seo);

        res
          .status(seo.statusCode)
          .set({'Content-Type': 'text/html; charset=utf-8'})
          .end(injected);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir, {index: false}));

    app.use('*', async (req, res) => {
      const rawHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
      const baseUrl = getBaseUrl(req);
      const projects = await getPublishedProjects();
      const seo = buildPageSeoData(req.originalUrl, baseUrl, projects);
      const injected = injectSeoIntoHtml(rawHtml, seo);
      res
        .status(seo.statusCode)
        .set({'Content-Type': 'text/html; charset=utf-8'})
        .end(injected);
    });
  }

  // Global error handler — never leak HTML stack traces or raw internals
  app.use(
    (
      err: Error & {status?: number; statusCode?: number; type?: string},
      req: Request,
      res: Response,
      _next: NextFunction,
    ) => {
      console.error('[server] Unhandled error:', redactSecrets(err));
      if (res.headersSent) return;

      if (err.type === 'entity.too.large' || err.status === 413) {
        res.status(413).json({error: 'Request payload is too large.'});
        return;
      }
      if (err.type === 'entity.parse.failed' || err.status === 400) {
        res.status(400).json({error: 'Invalid request format.'});
        return;
      }

      if (req.path.startsWith('/api/')) {
        res.status(500).json({error: 'Internal server error.'});
        return;
      }
      res.status(500).type('text/plain').send('Internal server error.');
    },
  );

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
