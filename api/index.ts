import fs from 'node:fs';
import path from 'node:path';
import {z} from 'zod';
import {siteContent} from '../src/content/site';
import {buildPageSeoData, injectSeoIntoHtml} from '../src/lib/routeSeo';
import type {SiteSettingsMap} from '../src/types/database';
import {
  ADMIN_EMAIL,
  escapeXml,
  getBaseUrl,
  getClientIp,
  getPublishedProjects,
  getSiteSettings,
  hashIp,
  isSupabaseAdminReady,
  parseJsonBody,
  resend,
  sendJson,
  sendText,
  supabaseAdmin,
  verifyAdminRequest,
  type ApiRequest,
  type ApiResponse,
} from './_lib/vercel';

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

function resolveRoutePath(req: ApiRequest): string {
  const fromQuery = req.query?.__route;
  if (typeof fromQuery === 'string' && fromQuery.trim()) {
    return fromQuery.split('?')[0];
  }
  if (Array.isArray(fromQuery) && fromQuery[0]) {
    return fromQuery[0].split('?')[0];
  }

  try {
    const parsed = new URL(req.url || '/', 'http://localhost');
    const qsRoute = parsed.searchParams.get('__route');
    if (qsRoute) return qsRoute.split('?')[0];
    return parsed.pathname;
  } catch {
    return (req.url || '/').split('?')[0];
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const method = (req.method || 'GET').toUpperCase();
  const route = resolveRoutePath(req).replace(/\/+$/, '') || '/';

  // --------------------------------------------------------------------------
  // 1. HEALTH CHECK
  // --------------------------------------------------------------------------
  if (route === '/api/health' && method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      supabaseConnected: isSupabaseAdminReady,
    });
    return;
  }

  // --------------------------------------------------------------------------
  // 2. ROBOTS.TXT
  // --------------------------------------------------------------------------
  if ((route === '/robots.txt' || route === '/api/robots') && method === 'GET') {
    const baseUrl = getBaseUrl(req);
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    sendText(
      res,
      200,
      'text/plain; charset=utf-8',
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n\nSitemap: ${baseUrl}/sitemap.xml\n`,
    );
    return;
  }

  // --------------------------------------------------------------------------
  // 3. SITEMAP.XML
  // --------------------------------------------------------------------------
  if ((route === '/sitemap.xml' || route === '/api/sitemap') && method === 'GET') {
    const baseUrl = getBaseUrl(req);
    const projects = await getPublishedProjects();
    const nowIso = new Date().toISOString();

    const urlEntries: {loc: string; lastmod: string; changefreq: string; priority: string}[] = [
      {loc: '/', lastmod: nowIso, changefreq: 'weekly', priority: '1.0'},
      {loc: '/work', lastmod: nowIso, changefreq: 'weekly', priority: '0.9'},
      {loc: '/books', lastmod: nowIso, changefreq: 'monthly', priority: '0.8'},
      {loc: '/about', lastmod: nowIso, changefreq: 'monthly', priority: '0.8'},
      {loc: '/contact', lastmod: nowIso, changefreq: 'monthly', priority: '0.7'},
      {loc: '/blog', lastmod: nowIso, changefreq: 'monthly', priority: '0.7'},
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
        return {
          loc: `/work/${p.slug}`,
          lastmod: Number.isNaN(parsed.getTime()) ? nowIso : parsed.toISOString(),
          changefreq: 'monthly',
          priority: '0.8',
        };
      }),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(`${baseUrl}${entry.loc === '/' ? '' : entry.loc}`)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    sendText(res, 200, 'application/xml; charset=utf-8', xml);
    return;
  }

  // --------------------------------------------------------------------------
  // 4. PROJECTS
  // --------------------------------------------------------------------------
  if (route === '/api/projects' && method === 'GET') {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    const projects = await getPublishedProjects();
    sendJson(res, 200, {
      projects,
      supabaseConnected: isSupabaseAdminReady,
    });
    return;
  }

  // --------------------------------------------------------------------------
  // 5. SITE SETTINGS
  // --------------------------------------------------------------------------
  if (route === '/api/settings' && method === 'GET') {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    const settings = await getSiteSettings();
    sendJson(res, 200, {settings});
    return;
  }

  // --------------------------------------------------------------------------
  // 6. TESTIMONIALS
  // --------------------------------------------------------------------------
  if (route === '/api/testimonials') {
    if (method === 'GET') {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
      if (supabaseAdmin) {
        const {data, error} = await supabaseAdmin
          .from('testimonials')
          .select('*')
          .eq('approved', true)
          .order('created_at', {ascending: false});
        if (!error && Array.isArray(data)) {
          sendJson(res, 200, {testimonials: data});
          return;
        }
      }
      sendJson(res, 200, {testimonials: []});
      return;
    }

    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const parsed = testimonialSchema.safeParse(body);
      if (!parsed.success) {
        sendJson(res, 400, {error: 'Please fill out all required fields.'});
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
          sendJson(res, 500, {error: 'Unable to submit testimonial.'});
          return;
        }
      }

      sendJson(res, 200, {
        ok: true,
        message: 'Thank you. Your testimonial has been queued for approval.',
      });
      return;
    }
  }

  // --------------------------------------------------------------------------
  // 7. CONTACT FORM
  // --------------------------------------------------------------------------
  if (route === '/api/contact' && method === 'POST') {
    const body = await parseJsonBody(req);
    const parsed = contactBodySchema.safeParse(body);
    if (!parsed.success) {
      sendJson(res, 400, {
        error: 'Please check your form entries and try again.',
      });
      return;
    }

    // Honeypot check
    if (parsed.data.website && parsed.data.website.trim().length > 0) {
      sendJson(res, 200, {ok: true, message: 'Message received.'});
      return;
    }

    const ipHash = hashIp(getClientIp(req));
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    if (supabaseAdmin) {
      const {count} = await supabaseAdmin
        .from('contact_messages')
        .select('*', {count: 'exact', head: true})
        .eq('ip_hash', ipHash)
        .gte('created_at', new Date(oneHourAgo).toISOString());

      if ((count || 0) >= 3) {
        sendJson(res, 429, {
          error: `Rate limit reached (3 messages per hour). Please email ${siteContent.contact.email} directly.`,
        });
        return;
      }
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
        // Non-fatal if Resend domain isn't verified yet
      }
    }

    if (!savedToDb && !emailed) {
      sendJson(res, 200, {
        ok: true,
        emailFallback: true,
        message: `Database and email notifications are not configured yet. Please email ${siteContent.contact.email} directly.`,
      });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      emailFallback: false,
      message: 'Thank you — your message has been delivered.',
    });
    return;
  }

  // --------------------------------------------------------------------------
  // 8. NEWSLETTER SUBSCRIPTION
  // --------------------------------------------------------------------------
  if (route === '/api/newsletter' && method === 'POST') {
    const body = await parseJsonBody(req);
    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) {
      sendJson(res, 400, {error: 'Please enter a valid email address.'});
      return;
    }

    if (supabaseAdmin) {
      const {error} = await supabaseAdmin
        .from('newsletter_subscribers')
        .upsert({email: parsed.data.email.toLowerCase()}, {onConflict: 'email'});
      if (error) {
        sendJson(res, 500, {error: 'Unable to subscribe right now.'});
        return;
      }
      sendJson(res, 200, {ok: true, message: 'Subscribed to updates.'});
      return;
    }

    sendJson(res, 200, {
      ok: true,
      message: `Connect Supabase to persist newsletter subscribers, or email ${siteContent.contact.email}.`,
    });
    return;
  }

  // --------------------------------------------------------------------------
  // 9. PRIVACY-FRIENDLY PAGE VIEW ANALYTICS
  // --------------------------------------------------------------------------
  if (route === '/api/analytics' && method === 'POST') {
    const body = await parseJsonBody<{
      path?: string;
      referrer?: string;
      device?: string;
    }>(req);

    const pathStr = String(body.path || '/').slice(0, 300);
    const referrerStr = String(body.referrer || '').slice(0, 200);
    const deviceStr = body.device === 'mobile' ? 'mobile' : 'desktop';
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
    }

    sendJson(res, 200, {ok: true});
    return;
  }

  // --------------------------------------------------------------------------
  // 10. ADMIN ROUTES (Protected by Supabase JWT matching ADMIN_EMAIL)
  // --------------------------------------------------------------------------
  if (route.startsWith('/api/admin/')) {
    if (!(await verifyAdminRequest(req, res))) return;
    if (!supabaseAdmin) {
      sendJson(res, 503, {error: 'Supabase not configured.'});
      return;
    }

    // /api/admin/projects
    if (route === '/api/admin/projects') {
      if (method === 'GET') {
        const {data, error} = await supabaseAdmin
          .from('projects')
          .select('*')
          .order('sort_order', {ascending: true})
          .order('created_at', {ascending: false});
        if (error) {
          sendJson(res, 500, {error: error.message});
          return;
        }
        sendJson(res, 200, {projects: data || []});
        return;
      }

      if (method === 'POST') {
        const body = await parseJsonBody<Record<string, unknown>>(req);
        if (!body.title || !body.description) {
          sendJson(res, 400, {error: 'Title and description are required.'});
          return;
        }
        const {data, error} = await supabaseAdmin
          .from('projects')
          .insert({
            title: String(body.title),
            slug: String(body.slug || ''),
            description: String(body.description),
            long_description: body.long_description
              ? String(body.long_description)
              : null,
            live_url: body.live_url ? String(body.live_url) : null,
            github_url: body.github_url ? String(body.github_url) : null,
            thumbnail_url: body.thumbnail_url
              ? String(body.thumbnail_url)
              : null,
            images: Array.isArray(body.images) ? body.images : [],
            tech_stack: Array.isArray(body.tech_stack) ? body.tech_stack : [],
            category: String(body.category || 'Web'),
            year: String(body.year || '2026'),
            featured: Boolean(body.featured),
            published: body.published !== false,
            sort_order: 0,
          })
          .select()
          .single();

        if (error) {
          sendJson(res, 400, {error: error.message});
          return;
        }
        sendJson(res, 200, {project: data});
        return;
      }
    }

    // /api/admin/projects/reorder
    if (route === '/api/admin/projects/reorder' && method === 'POST') {
      const body = await parseJsonBody<{orderedIds?: string[]}>(req);
      const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds : [];
      await Promise.all(
        orderedIds.map((id, idx) =>
          supabaseAdmin!
            .from('projects')
            .update({sort_order: idx + 1})
            .eq('id', id),
        ),
      );
      sendJson(res, 200, {ok: true});
      return;
    }

    // /api/admin/projects/:id
    if (route.startsWith('/api/admin/projects/')) {
      const id = route.slice('/api/admin/projects/'.length);
      if (method === 'PATCH') {
        const body = await parseJsonBody<Record<string, unknown>>(req);
        const {data, error} = await supabaseAdmin
          .from('projects')
          .update({
            title: String(body.title || ''),
            slug: String(body.slug || ''),
            description: String(body.description || ''),
            long_description: body.long_description
              ? String(body.long_description)
              : null,
            live_url: body.live_url ? String(body.live_url) : null,
            github_url: body.github_url ? String(body.github_url) : null,
            thumbnail_url: body.thumbnail_url
              ? String(body.thumbnail_url)
              : null,
            tech_stack: Array.isArray(body.tech_stack) ? body.tech_stack : [],
            category: String(body.category || 'Web'),
            year: String(body.year || '2026'),
            featured: Boolean(body.featured),
            published: body.published !== false,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          sendJson(res, 400, {error: error.message});
          return;
        }
        sendJson(res, 200, {project: data});
        return;
      }

      if (method === 'DELETE') {
        const {error} = await supabaseAdmin.from('projects').delete().eq('id', id);
        if (error) {
          sendJson(res, 400, {error: error.message});
          return;
        }
        sendJson(res, 200, {ok: true});
        return;
      }
    }

    // /api/admin/upload
    if (route === '/api/admin/upload' && method === 'POST') {
      const {fileName, mimeType, dataUrl} = await parseJsonBody<{
        fileName?: string;
        mimeType?: string;
        dataUrl?: string;
      }>(req);

      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
      if (!mimeType || !allowed.includes(mimeType)) {
        sendJson(res, 400, {
          error: 'Only JPEG, PNG, WebP, or AVIF images are allowed.',
        });
        return;
      }

      const base64Data = String(dataUrl || '').split(',')[1];
      if (!base64Data) {
        sendJson(res, 400, {error: 'Invalid image payload.'});
        return;
      }

      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.byteLength > 5 * 1024 * 1024) {
        sendJson(res, 400, {error: 'Image exceeds 5 MB limit.'});
        return;
      }

      const safeName = `${Date.now()}-${String(fileName || 'image').replace(
        /[^a-zA-Z0-9._-]/g,
        '',
      )}`;
      const {error} = await supabaseAdmin.storage
        .from('project-images')
        .upload(safeName, buffer, {contentType: mimeType, upsert: false});

      if (error) {
        sendJson(res, 500, {error: error.message});
        return;
      }

      const {data: pub} = supabaseAdmin.storage
        .from('project-images')
        .getPublicUrl(safeName);
      sendJson(res, 200, {url: pub.publicUrl});
      return;
    }

    // /api/admin/messages
    if (route === '/api/admin/messages' && method === 'GET') {
      const {data, error} = await supabaseAdmin
        .from('contact_messages')
        .select('*')
        .order('created_at', {ascending: false});
      if (error) {
        sendJson(res, 500, {error: error.message});
        return;
      }
      sendJson(res, 200, {messages: data || []});
      return;
    }

    // /api/admin/messages/:id
    if (route.startsWith('/api/admin/messages/') && method === 'PATCH') {
      const id = route.slice('/api/admin/messages/'.length);
      const body = await parseJsonBody<{status?: string}>(req);
      if (
        !id ||
        !body.status ||
        !['new', 'read', 'replied'].includes(body.status)
      ) {
        sendJson(res, 400, {error: 'Invalid message ID or status'});
        return;
      }
      const {error} = await supabaseAdmin
        .from('contact_messages')
        .update({status: body.status})
        .eq('id', id);
      if (error) {
        sendJson(res, 400, {error: error.message});
        return;
      }
      sendJson(res, 200, {ok: true});
      return;
    }

    // /api/admin/testimonials
    if (route === '/api/admin/testimonials' && method === 'GET') {
      const {data, error} = await supabaseAdmin
        .from('testimonials')
        .select('*')
        .order('created_at', {ascending: false});
      if (error) {
        sendJson(res, 500, {error: error.message});
        return;
      }
      sendJson(res, 200, {testimonials: data || []});
      return;
    }

    // /api/admin/testimonials/:id
    if (route.startsWith('/api/admin/testimonials/')) {
      const id = route.slice('/api/admin/testimonials/'.length);
      if (method === 'PATCH') {
        const body = await parseJsonBody<{approved?: boolean}>(req);
        const {error} = await supabaseAdmin
          .from('testimonials')
          .update({approved: Boolean(body.approved)})
          .eq('id', id);
        if (error) {
          sendJson(res, 400, {error: error.message});
          return;
        }
        sendJson(res, 200, {ok: true});
        return;
      }
      if (method === 'DELETE') {
        const {error} = await supabaseAdmin
          .from('testimonials')
          .delete()
          .eq('id', id);
        if (error) {
          sendJson(res, 400, {error: error.message});
          return;
        }
        sendJson(res, 200, {ok: true});
        return;
      }
    }

    // /api/admin/analytics
    if (route === '/api/admin/analytics' && method === 'GET') {
      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const {data, error} = await supabaseAdmin
        .from('page_views')
        .select('*')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', {ascending: false});
      if (error) {
        sendJson(res, 500, {error: error.message});
        return;
      }
      sendJson(res, 200, {views: data || []});
      return;
    }

    // /api/admin/settings
    if (route === '/api/admin/settings' && method === 'PUT') {
      const body = await parseJsonBody<{settings?: SiteSettingsMap}>(req);
      if (!body.settings) {
        sendJson(res, 400, {error: 'Settings payload missing'});
        return;
      }
      const {error} = await supabaseAdmin.from('site_settings').upsert([
        {key: 'availability', value: body.settings.availability},
        {key: 'hero', value: body.settings.hero},
      ]);
      if (error) {
        sendJson(res, 400, {error: error.message});
        return;
      }
      sendJson(res, 200, {ok: true});
      return;
    }
  }

  // --------------------------------------------------------------------------
  // 11. DYNAMIC SSR HTML FOR /work/[slug], /blog/[slug], AND 404 ROUTES
  // --------------------------------------------------------------------------
  if ((method === 'GET' || method === 'HEAD') && !route.startsWith('/api/')) {
    const baseUrl = getBaseUrl(req);
    const projects = await getPublishedProjects();
    const seo = buildPageSeoData(route, baseUrl, projects);
    const templateHtml = await loadHtmlTemplate(baseUrl);
    const renderedHtml = injectSeoIntoHtml(templateHtml, seo);

    if (seo.statusCode === 404) {
      res.setHeader('Cache-Control', 'no-store');
    } else {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    }
    sendText(res, seo.statusCode, 'text/html; charset=utf-8', renderedHtml);
    return;
  }

  sendJson(res, 404, {error: `Unknown API route: ${method} ${route}`});
}

let cachedHtmlTemplate: string | null = null;

async function loadHtmlTemplate(baseUrl: string): Promise<string> {
  if (cachedHtmlTemplate) return cachedHtmlTemplate;

  const candidates = [
    path.resolve(process.cwd(), 'dist', 'index.html'),
    path.resolve(process.cwd(), 'index.html'),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        cachedHtmlTemplate = fs.readFileSync(candidate, 'utf-8');
        return cachedHtmlTemplate;
      }
    } catch {
      // Try next candidate
    }
  }

  try {
    const res = await fetch(`${baseUrl}/index.html`, {
      headers: {'x-oa-ssr-fetch': '1'},
    });
    if (res.ok) {
      const text = await res.text();
      if (text.includes('</head>')) {
        cachedHtmlTemplate = text;
        return cachedHtmlTemplate;
      }
    }
  } catch {
    // Fall back to minimal semantic HTML shell if bundle template is unavailable
  }

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ojas Awasthi</title>
    <meta name="description" content="" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${baseUrl}" />
    <link rel="alternate" hreflang="en-IN" href="${baseUrl}" />
    <!-- SEO_HEAD_LINKS -->
    <meta property="og:url" content="${baseUrl}" />
    <meta property="og:title" content="Ojas Awasthi" />
    <meta property="og:description" content="" />
    <meta property="og:image" content="${baseUrl}/og-image.png" />
    <meta name="twitter:title" content="Ojas Awasthi" />
    <meta name="twitter:description" content="" />
    <meta name="twitter:image" content="${baseUrl}/og-image.png" />
  </head>
  <body>
    <!-- SSR_BODY_START --><div id="root"></div><!-- SSR_BODY_END -->
  </body>
</html>`;
}
