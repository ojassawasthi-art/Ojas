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
  'https://hdryciyvkhozomertslx.supabase.co'
)
  .trim()
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_y2bqryW00-NO-JAnrOXKTw_Qa4pYP1H';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'ojassawasthi@gmail.com').toLowerCase();

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

// Rate limit map: ip_hash -> timestamps (max 3 per hour)
const rateLimitMap = new Map<string, number[]>();

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip || 'unknown').digest('hex').slice(0, 24);
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function getBaseUrl(_req: Request): string {
  const configured =
    process.env.VITE_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://ojasawasthii.vercel.app';
  return configured.trim().replace(/\/+$/, '');
}

async function verifyAdmin(req: Request, res: Response, next: NextFunction) {
  if (isSupabaseAdminReady && supabaseAdmin) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      res.status(401).json({error: 'Missing authentication token.'});
      return;
    }
    const {data, error} = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user?.email || data.user.email.toLowerCase() !== ADMIN_EMAIL) {
      res.status(403).json({error: 'Admin access restricted.'});
      return;
    }
    next();
    return;
  }

  // Preview mode fallback when Supabase keys are not yet connected
  const previewEmail = String(req.headers['x-admin-preview-email'] || '').toLowerCase();
  if (previewEmail === ADMIN_EMAIL) {
    next();
    return;
  }
  res.status(401).json({error: 'Admin sign-in required.'});
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

const contactBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(10).max(5000),
  website: z.string().optional(),
});

const testimonialSchema = z.object({
  name: z.string().trim().min(2).max(120),
  role: z.string().trim().min(2).max(120),
  company: z.string().trim().max(120).optional().default(''),
  quote: z.string().trim().min(10).max(1500),
});

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Route SEO metadata and JSON-LD builders live in src/lib/routeSeo.ts */

async function startServer() {
  const app = express();
  app.use(express.json({limit: '8mb'}));

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
        .select('*')
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
    } else {
      const recent = (fallbackStore.messages || []).filter(
        (m) => m.ip_hash === ipHash && new Date(m.created_at).getTime() >= oneHourAgo,
      );
      const memTimestamps = (rateLimitMap.get(ipHash) || []).filter(
        (ts) => ts >= oneHourAgo,
      );
      if (recent.length >= 3 || memTimestamps.length >= 3) {
        res.status(429).json({
          error: `Rate limit reached (3 messages per hour). Please email ${siteContent.contact.email} directly.`,
        });
        return;
      }
      memTimestamps.push(Date.now());
      rateLimitMap.set(ipHash, memTimestamps);
    }

    let savedToDb = false;
    if (supabaseAdmin) {
      const {error} = await supabaseAdmin.from('contact_messages').insert({
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
        ip_hash: ipHash,
        status: 'new',
      });
      if (!error) savedToDb = true;
    } else {
      fallbackStore.messages.unshift({
        id: crypto.randomUUID(),
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
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
          subject: `[Portfolio Contact] ${parsed.data.subject}`,
          text: `From: ${parsed.data.name} (${parsed.data.email})\n\n${parsed.data.message}`,
        });
        emailed = true;
      } catch {
        // Keep response non-fatal if Resend domain isn't verified yet
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
    const parsed = testimonialSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({error: 'Please fill out all required fields.'});
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
    const pathStr = String(req.body?.path || '/').slice(0, 300);
    const referrerStr = String(req.body?.referrer || '').slice(0, 200);
    const deviceStr = req.body?.device === 'mobile' ? 'mobile' : 'desktop';
    const countryStr = String(
      req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'] || '',
    ).slice(0, 10);

    if (supabaseAdmin) {
      await supabaseAdmin.from('page_views').insert({
        path: pathStr,
        referrer: referrerStr,
        country: countryStr,
        device: deviceStr,
      });
    } else {
      fallbackStore.pageViews.unshift({
        id: crypto.randomUUID(),
        path: pathStr,
        referrer: referrerStr,
        country: countryStr,
        device: deviceStr,
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
  // ADMIN API ROUTES
  // --------------------------------------------------------------------------
  app.get('/api/admin/projects', verifyAdmin, async (_req, res) => {
    if (supabaseAdmin) {
      const {data, error} = await supabaseAdmin
        .from('projects')
        .select('*')
        .order('sort_order', {ascending: true})
        .order('created_at', {ascending: false});
      if (error) {
        res.status(500).json({error: error.message});
        return;
      }
      res.json({projects: data || []});
      return;
    }
    res.json({
      projects: [...fallbackStore.projects].sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    });
  });

  app.post('/api/admin/projects', verifyAdmin, async (req, res) => {
    const body = req.body;
    if (!body?.title || !body?.description) {
      res.status(400).json({error: 'Title and description are required.'});
      return;
    }

    if (supabaseAdmin) {
      const {data, error} = await supabaseAdmin
        .from('projects')
        .insert({
          title: body.title,
          slug: body.slug,
          description: body.description,
          long_description: body.long_description || null,
          live_url: body.live_url || null,
          github_url: body.github_url || null,
          thumbnail_url: body.thumbnail_url || null,
          images: Array.isArray(body.images) ? body.images : [],
          tech_stack: Array.isArray(body.tech_stack) ? body.tech_stack : [],
          category: body.category || 'Web',
          year: body.year || '2026',
          featured: Boolean(body.featured),
          published: body.published !== false,
          sort_order: 0,
        })
        .select()
        .single();
      if (error) {
        res.status(400).json({error: error.message});
        return;
      }
      res.json({project: data});
      return;
    }

    const created: Project = {
      id: crypto.randomUUID(),
      title: body.title,
      slug: body.slug,
      description: body.description,
      long_description: body.long_description || null,
      live_url: body.live_url || null,
      github_url: body.github_url || null,
      thumbnail_url: body.thumbnail_url || null,
      images: [],
      tech_stack: Array.isArray(body.tech_stack) ? body.tech_stack : [],
      category: body.category || 'Web',
      year: body.year || '2026',
      featured: Boolean(body.featured),
      sort_order: fallbackStore.projects.length + 1,
      published: body.published !== false,
      created_at: new Date().toISOString(),
      status_tag: body.status_tag || null,
      role: body.role || null,
    };
    fallbackStore.projects.push(created);
    res.json({project: created});
  });

  app.patch('/api/admin/projects/:id', verifyAdmin, async (req, res) => {
    const {id} = req.params;
    const body = req.body;
    if (supabaseAdmin) {
      const {data, error} = await supabaseAdmin
        .from('projects')
        .update({
          title: body.title,
          slug: body.slug,
          description: body.description,
          long_description: body.long_description || null,
          live_url: body.live_url || null,
          github_url: body.github_url || null,
          thumbnail_url: body.thumbnail_url || null,
          tech_stack: Array.isArray(body.tech_stack) ? body.tech_stack : [],
          category: body.category || 'Web',
          year: body.year || '2026',
          featured: Boolean(body.featured),
          published: body.published !== false,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) {
        res.status(400).json({error: error.message});
        return;
      }
      res.json({project: data});
      return;
    }

    fallbackStore.projects = fallbackStore.projects.map((p) =>
      p.id === id ? {...p, ...body} : p,
    );
    res.json({ok: true});
  });

  app.delete('/api/admin/projects/:id', verifyAdmin, async (req, res) => {
    const {id} = req.params;
    if (supabaseAdmin) {
      const {error} = await supabaseAdmin.from('projects').delete().eq('id', id);
      if (error) {
        res.status(400).json({error: error.message});
        return;
      }
      res.json({ok: true});
      return;
    }
    fallbackStore.projects = fallbackStore.projects.filter((p) => p.id !== id);
    res.json({ok: true});
  });

  app.post('/api/admin/projects/reorder', verifyAdmin, async (req, res) => {
    const orderedIds: string[] = Array.isArray(req.body?.orderedIds)
      ? req.body.orderedIds
      : [];
    if (supabaseAdmin) {
      await Promise.all(
        orderedIds.map((id, idx) =>
          supabaseAdmin.from('projects').update({sort_order: idx + 1}).eq('id', id),
        ),
      );
      res.json({ok: true});
      return;
    }
    orderedIds.forEach((id, idx) => {
      const target = fallbackStore.projects.find((p) => p.id === id);
      if (target) target.sort_order = idx + 1;
    });
    res.json({ok: true});
  });

  app.post('/api/admin/upload', verifyAdmin, async (req, res) => {
    const {fileName, mimeType, dataUrl} = req.body || {};
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowed.includes(mimeType)) {
      res.status(400).json({error: 'Only JPEG, PNG, WebP, or AVIF images are allowed.'});
      return;
    }
    const base64Data = String(dataUrl || '').split(',')[1];
    if (!base64Data) {
      res.status(400).json({error: 'Invalid image payload.'});
      return;
    }
    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.byteLength > 5 * 1024 * 1024) {
      res.status(400).json({error: 'Image exceeds 5 MB limit.'});
      return;
    }

    if (supabaseAdmin) {
      const safeName = `${Date.now()}-${String(fileName || 'image').replace(/[^a-zA-Z0-9._-]/g, '')}`;
      const {error} = await supabaseAdmin.storage
        .from('project-images')
        .upload(safeName, buffer, {contentType: mimeType, upsert: false});
      if (error) {
        res.status(500).json({error: error.message});
        return;
      }
      const {data: pub} = supabaseAdmin.storage
        .from('project-images')
        .getPublicUrl(safeName);
      res.json({url: pub.publicUrl});
      return;
    }

    // Preview mode returns the data URL directly so admins can preview overrides without Supabase Storage
    res.json({url: dataUrl});
  });

  app.get('/api/admin/messages', verifyAdmin, async (_req, res) => {
    if (supabaseAdmin) {
      const {data} = await supabaseAdmin
        .from('contact_messages')
        .select('*')
        .order('created_at', {ascending: false});
      res.json({messages: data || []});
      return;
    }
    res.json({messages: fallbackStore.messages});
  });

  app.patch('/api/admin/messages/:id', verifyAdmin, async (req, res) => {
    const {id} = req.params;
    const status = req.body?.status;
    if (!['new', 'read', 'replied'].includes(status)) {
      res.status(400).json({error: 'Invalid status'});
      return;
    }
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('contact_messages')
        .update({status})
        .eq('id', id);
    } else {
      fallbackStore.messages = fallbackStore.messages.map((m) =>
        m.id === id ? {...m, status} : m,
      );
    }
    res.json({ok: true});
  });

  app.get('/api/admin/testimonials', verifyAdmin, async (_req, res) => {
    if (supabaseAdmin) {
      const {data} = await supabaseAdmin
        .from('testimonials')
        .select('*')
        .order('created_at', {ascending: false});
      res.json({testimonials: data || []});
      return;
    }
    res.json({testimonials: fallbackStore.testimonials});
  });

  app.patch('/api/admin/testimonials/:id', verifyAdmin, async (req, res) => {
    const {id} = req.params;
    const approved = Boolean(req.body?.approved);
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('testimonials')
        .update({approved})
        .eq('id', id);
    } else {
      fallbackStore.testimonials = fallbackStore.testimonials.map((t) =>
        t.id === id ? {...t, approved} : t,
      );
    }
    res.json({ok: true});
  });

  app.delete('/api/admin/testimonials/:id', verifyAdmin, async (req, res) => {
    const {id} = req.params;
    if (supabaseAdmin) {
      await supabaseAdmin.from('testimonials').delete().eq('id', id);
    } else {
      fallbackStore.testimonials = fallbackStore.testimonials.filter(
        (t) => t.id !== id,
      );
    }
    res.json({ok: true});
  });

  app.get('/api/admin/analytics', verifyAdmin, async (_req, res) => {
    if (supabaseAdmin) {
      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const {data} = await supabaseAdmin
        .from('page_views')
        .select('*')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', {ascending: false});
      res.json({views: data || []});
      return;
    }
    res.json({views: fallbackStore.pageViews});
  });

  app.get('/api/admin/chat-logs', verifyAdmin, async (_req, res) => {
    if (supabaseAdmin) {
      const {data, error} = await supabaseAdmin
        .from('chat_logs')
        .select('id, question, answer, ip_hash, created_at')
        .order('created_at', {ascending: false})
        .limit(200);
      if (error) {
        if (
          error.code === '42P01' ||
          error.message?.toLowerCase().includes('chat_logs')
        ) {
          res.json({logs: [], tableMissing: true});
          return;
        }
        res.status(500).json({error: error.message});
        return;
      }
      res.json({logs: data || []});
      return;
    }
    res.json({logs: fallbackStore.chatLogs});
  });

  app.get('/api/admin/newsletter', verifyAdmin, async (_req, res) => {
    if (supabaseAdmin) {
      const {data, error} = await supabaseAdmin
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', {ascending: false});
      if (error) {
        res.status(500).json({error: error.message});
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
      return;
    }
    res.json({subscribers: fallbackStore.subscribers});
  });

  app.delete('/api/admin/newsletter/:id', verifyAdmin, async (req, res) => {
    const {id} = req.params;
    if (supabaseAdmin) {
      const {error} = await supabaseAdmin
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);
      if (error) {
        res.status(400).json({error: error.message});
        return;
      }
      res.json({ok: true});
      return;
    }
    fallbackStore.subscribers = fallbackStore.subscribers.filter(
      (s) => s.id !== id,
    );
    res.json({ok: true});
  });

  app.put('/api/admin/settings', verifyAdmin, async (req, res) => {
    const nextSettings = req.body?.settings as SiteSettingsMap | undefined;
    if (!nextSettings) {
      res.status(400).json({error: 'Settings payload missing'});
      return;
    }
    if (supabaseAdmin) {
      await supabaseAdmin.from('site_settings').upsert([
        {key: 'availability', value: nextSettings.availability},
        {key: 'hero', value: nextSettings.hero},
      ]);
    } else {
      fallbackStore.settings = nextSettings;
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
        const imgs = p.thumbnail_url
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

        res.status(seo.statusCode).set({'Content-Type': 'text/html; charset=utf-8'}).end(injected);
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
      res.status(seo.statusCode).set({'Content-Type': 'text/html; charset=utf-8'}).end(injected);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
