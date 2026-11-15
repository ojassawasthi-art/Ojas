import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, {type NextFunction, type Request, type Response} from 'express';
import {Resend} from 'resend';
import {createServer as createViteServer} from 'vite';
import {z} from 'zod';
import {siteContent} from './src/content/site';
import type {
  ContactMessage,
  PageView,
  Project,
  SiteSettingsMap,
  Testimonial,
} from './src/types/database';

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';
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
  subscribers: {id: string; email: string; created_at: string}[];
  pageViews: PageView[];
  settings: SiteSettingsMap;
} = {
  projects: structuredClone(siteContent.fallbackProjects),
  messages: [],
  testimonials: [],
  subscribers: [],
  pageViews: [],
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

function getBaseUrl(req: Request): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers.host || `localhost:${PORT}`;
  return `${proto}://${host}`;
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

const newsletterSchema = z.object({
  email: z.string().trim().email().max(254),
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

async function buildRouteMeta(urlPath: string, baseUrl: string) {
  let title = siteContent.seo.defaultTitle;
  let description = siteContent.seo.defaultDescription;
  const cleanPath = urlPath.split('?')[0] || '/';

  if (cleanPath === '/work') {
    title = `Work & Case Studies | ${siteContent.profile.name}`;
    description = `Web development projects and e-commerce builds by ${siteContent.profile.name} in Lucknow, India.`;
  } else if (cleanPath.startsWith('/work/')) {
    const slug = cleanPath.replace('/work/', '').replace(/\/$/, '');
    const projects = await getPublishedProjects();
    const match = projects.find((p) => p.slug === slug);
    if (match) {
      title = `${match.title} — Case Study | ${siteContent.profile.name}`;
      description = match.description;
    }
  } else if (cleanPath === '/about') {
    title = `About ${siteContent.profile.name} | Web Developer & Author in Lucknow`;
    description = `Learn about ${siteContent.profile.name}: web development, The Vaxn Store, University of Lucknow B.Com, CS preparation, books, and certifications.`;
  } else if (cleanPath === '/books') {
    title = `Books by ${siteContent.profile.name}`;
    description = `Published books by ${siteContent.profile.name}: Mastering the Art of Manipulation and The Echoes of Love on Amazon and Google Play Books.`;
  } else if (cleanPath === '/contact') {
    title = `Contact ${siteContent.profile.name} | Lucknow, India`;
    description = `Contact ${siteContent.profile.name} for web development, SEO, or digital strategy inquiries at ${siteContent.contact.email}.`;
  } else if (cleanPath === '/blog') {
    title = `Articles | ${siteContent.profile.name}`;
    description = `Notes and articles by ${siteContent.profile.name} on web development, digital strategy, and background.`;
  } else if (cleanPath.startsWith('/blog/')) {
    const slug = cleanPath.replace('/blog/', '').replace(/\/$/, '');
    const post = siteContent.blogPosts.find((b) => b.slug === slug);
    if (post) {
      title = `${post.title} | ${siteContent.profile.name}`;
      description = post.description;
    }
  }

  const canonical = `${baseUrl}${cleanPath === '/' ? '' : cleanPath}`;
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteContent.profile.name,
    alternateName: siteContent.profile.alternateName,
    jobTitle: 'Web Developer, Digital Marketer & Published Author',
    url: baseUrl,
    email: `mailto:${siteContent.contact.email}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Lucknow',
      addressRegion: 'Uttar Pradesh',
      addressCountry: 'India',
    },
    sameAs: siteContent.contact.socials
      .filter((s) => s.url.startsWith('http'))
      .map((s) => s.url),
  };

  return {title, description, canonical, personJsonLd};
}

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
    const parsed = newsletterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({error: 'Please enter a valid email address.'});
      return;
    }

    if (supabaseAdmin) {
      const {error} = await supabaseAdmin
        .from('newsletter_subscribers')
        .upsert({email: parsed.data.email.toLowerCase()}, {onConflict: 'email'});
      if (error) {
        res.status(500).json({error: 'Unable to subscribe right now.'});
        return;
      }
      res.json({ok: true, message: 'Subscribed to updates.'});
      return;
    }

    const exists = fallbackStore.subscribers.some(
      (s) => s.email.toLowerCase() === parsed.data.email.toLowerCase(),
    );
    if (!exists) {
      fallbackStore.subscribers.push({
        id: crypto.randomUUID(),
        email: parsed.data.email.toLowerCase(),
        created_at: new Date().toISOString(),
      });
    }
    res.json({
      ok: true,
      message: 'Subscribed in preview. Connect Supabase to persist subscribers.',
    });
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
    const staticRoutes = [
      '/',
      '/work',
      '/about',
      '/books',
      '/contact',
      '/blog',
      ...siteContent.blogPosts.map((b) => `/blog/${b.slug}`),
    ];
    const projectRoutes = projects.map((p) => `/work/${p.slug}`);
    const allRoutes = [...staticRoutes, ...projectRoutes];
    const nowIso = new Date().toISOString();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (route) => `  <url>
    <loc>${escapeHtml(`${baseUrl}${route === '/' ? '' : route}`)}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>${route === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  });

  app.get('/robots.txt', (req, res) => {
    const baseUrl = getBaseUrl(req);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`,
    );
  });

  // --------------------------------------------------------------------------
  // VITE / STATIC SERVING WITH ROUTE-AWARE SEO META INJECTION
  // --------------------------------------------------------------------------
  if (!isProd) {
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
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
        const meta = await buildRouteMeta(url, baseUrl);
        const injected = transformed
          .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
          .replace(
            /<meta\s+name="description"[\s\S]*?\/>/,
            `<meta name="description" content="${escapeHtml(meta.description)}" />`,
          )
          .replace(
            '<link rel="alternate" hreflang="en-IN" href="/" />',
            `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />\n    <link rel="alternate" hreflang="en-IN" href="${escapeHtml(meta.canonical)}" />\n    <script type="application/ld+json">${JSON.stringify(meta.personJsonLd)}</script>`,
          );

        res.status(200).set({'Content-Type': 'text/html'}).end(injected);
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
      const meta = await buildRouteMeta(req.originalUrl, baseUrl);
      const injected = rawHtml
        .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
        .replace(
          /<meta\s+name="description"[\s\S]*?\/>/,
          `<meta name="description" content="${escapeHtml(meta.description)}" />`,
        )
        .replace(
          '<!-- SEO_HEAD_LINKS -->',
          `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />\n    <link rel="alternate" hreflang="en-IN" href="${escapeHtml(meta.canonical)}" />\n    <script type="application/ld+json">${JSON.stringify(meta.personJsonLd)}</script>`,
        );
      res.status(200).set({'Content-Type': 'text/html'}).end(injected);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
