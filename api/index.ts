import fs from 'node:fs';
import path from 'node:path';
import {z} from 'zod';
import {handleChatRequest} from './_lib/chat.js';
import {handleNewsletterSignup} from './_lib/newsletter.js';
import {buildPageSeoData, injectSeoIntoHtml} from './_lib/route-seo.js';
import {siteData, type SiteSettingsMap} from './_lib/site-data.js';
import {
  escapeXml,
  getAdminEmail,
  getBaseUrl,
  getClientIp,
  getPublishedProjects,
  getResendClient,
  getSiteSettings,
  getSupabaseAdmin,
  hashIp,
  parseJsonBody,
  sendJson,
  sendText,
  verifyAdminRequest,
  type ApiRequest,
  type ApiResponse,
} from './_lib/vercel.js';

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

function missingEnvResponse(res: ApiResponse, missingVars: string[]) {
  sendJson(res, 500, {
    error: `Missing required environment variable(s): ${missingVars.join(', ')}`,
    missing: missingVars,
  });
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const method = (req.method || 'GET').toUpperCase();
    const route = resolveRoutePath(req).replace(/\/+$/, '') || '/';
    const {supabase, missingVars} = getSupabaseAdmin();

    // --------------------------------------------------------------------------
    // 1. HEALTH CHECK
    // --------------------------------------------------------------------------
    if (route === '/api/health' && method === 'GET') {
      try {
        if (!supabase) {
          sendJson(res, 500, {
            ok: false,
            supabaseConnected: false,
            error: `Missing required environment variable(s): ${missingVars.join(', ')}`,
            missing: missingVars,
          });
          return;
        }
        sendJson(res, 200, {
          ok: true,
          supabaseConnected: true,
        });
        return;
      } catch (err) {
        console.error('[api/health] Error:', err);
        sendJson(res, 500, {error: 'Health check failed.'});
        return;
      }
    }

    // --------------------------------------------------------------------------
    // 2. SITEMAP.XML
    // --------------------------------------------------------------------------
    if ((route === '/sitemap.xml' || route === '/api/sitemap') && method === 'GET') {
      try {
        const baseUrl = getBaseUrl();
        const projects = await getPublishedProjects(supabase);
        const nowIso = new Date().toISOString();

        const urlEntries: {
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
            images: [
              {
                loc: `${baseUrl}/images/ojas.jpg`,
                title: 'Ojas Awasthi portrait',
              },
            ],
          },
          {loc: '/education', lastmod: nowIso, changefreq: 'monthly', priority: '0.8'},
          {loc: '/books', lastmod: nowIso, changefreq: 'monthly', priority: '0.8'},
          {loc: '/services', lastmod: nowIso, changefreq: 'monthly', priority: '0.8'},
          {loc: '/work', lastmod: nowIso, changefreq: 'weekly', priority: '0.9'},
          {loc: '/blog', lastmod: nowIso, changefreq: 'weekly', priority: '0.8'},
          {
            loc: '/press-kit',
            lastmod: nowIso,
            changefreq: 'monthly',
            priority: '0.7',
            images: [
              {
                loc: `${baseUrl}/images/ojas.jpg`,
                title: 'Ojas Awasthi press kit portrait',
              },
            ],
          },
          {loc: '/links', lastmod: nowIso, changefreq: 'monthly', priority: '0.7'},
          {loc: '/contact', lastmod: nowIso, changefreq: 'monthly', priority: '0.7'},
          {loc: '/privacy', lastmod: nowIso, changefreq: 'yearly', priority: '0.4'},
          ...siteData.blogPosts.map((b) => {
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
${urlEntries
  .map((entry) => {
    const imgTags = (entry.images || [])
      .map(
        (img) => `    <image:image>
      <image:loc>${escapeXml(img.loc)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
    </image:image>`,
      )
      .join('\n');
    return `  <url>
    <loc>${escapeXml(`${baseUrl}${entry.loc === '/' ? '' : entry.loc}`)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>${imgTags ? `\n${imgTags}` : ''}
  </url>`;
  })
  .join('\n')}
</urlset>`;

        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        sendText(res, 200, 'application/xml; charset=utf-8', xml);
        return;
      } catch (err) {
        console.error('[sitemap.xml] Error:', err);
        sendJson(res, 500, {error: 'Failed to generate sitemap.xml.'});
        return;
      }
    }

    // --------------------------------------------------------------------------
    // 3. PROJECTS
    // --------------------------------------------------------------------------
    if (route === '/api/projects' && method === 'GET') {
      try {
        if (!supabase) {
          missingEnvResponse(res, missingVars);
          return;
        }
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        const projects = await getPublishedProjects(supabase);
        sendJson(res, 200, {
          projects,
          supabaseConnected: true,
        });
        return;
      } catch (err) {
        console.error('[api/projects] Error:', err);
        sendJson(res, 500, {error: 'Failed to load projects.'});
        return;
      }
    }

    // --------------------------------------------------------------------------
    // 4. SITE SETTINGS
    // --------------------------------------------------------------------------
    if (route === '/api/settings' && method === 'GET') {
      try {
        if (!supabase) {
          missingEnvResponse(res, missingVars);
          return;
        }
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        const settings = await getSiteSettings(supabase);
        sendJson(res, 200, {settings});
        return;
      } catch (err) {
        console.error('[api/settings] Error:', err);
        sendJson(res, 500, {error: 'Failed to load settings.'});
        return;
      }
    }

    // --------------------------------------------------------------------------
    // 5. TESTIMONIALS
    // --------------------------------------------------------------------------
    if (route === '/api/testimonials') {
      try {
        if (!supabase) {
          missingEnvResponse(res, missingVars);
          return;
        }

        if (method === 'GET') {
          res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
          const {data, error} = await supabase
            .from('testimonials')
            .select('*')
            .eq('approved', true)
            .order('created_at', {ascending: false});
          if (error) {
            console.error('[api/testimonials GET] Supabase error:', error);
            sendJson(res, 500, {error: 'Unable to fetch testimonials.'});
            return;
          }
          sendJson(res, 200, {testimonials: Array.isArray(data) ? data : []});
          return;
        }

        if (method === 'POST') {
          const body = await parseJsonBody(req);
          const parsed = testimonialSchema.safeParse(body);
          if (!parsed.success) {
            sendJson(res, 400, {error: 'Please fill out all required fields.'});
            return;
          }

          const {error} = await supabase.from('testimonials').insert({
            name: parsed.data.name,
            role: parsed.data.role,
            company: parsed.data.company || '',
            quote: parsed.data.quote,
            approved: false,
          });
          if (error) {
            console.error('[api/testimonials POST] Supabase error:', error);
            sendJson(res, 500, {error: 'Unable to submit testimonial.'});
            return;
          }

          sendJson(res, 200, {
            ok: true,
            message: 'Thank you. Your testimonial has been queued for approval.',
          });
          return;
        }
      } catch (err) {
        console.error('[api/testimonials] Error:', err);
        sendJson(res, 500, {error: 'Testimonials request failed.'});
        return;
      }
    }

    // --------------------------------------------------------------------------
    // 6. CONTACT FORM
    // --------------------------------------------------------------------------
    if (route === '/api/contact' && method === 'POST') {
      try {
        if (!supabase) {
          missingEnvResponse(res, missingVars);
          return;
        }

        const body = await parseJsonBody(req);
        const parsed = contactBodySchema.safeParse(body);
        if (!parsed.success) {
          sendJson(res, 400, {
            error: 'Please check your form entries and try again.',
          });
          return;
        }

        if (parsed.data.website && parsed.data.website.trim().length > 0) {
          sendJson(res, 200, {ok: true, message: 'Message received.'});
          return;
        }

        const ipHash = hashIp(getClientIp(req));
        const oneHourAgo = Date.now() - 60 * 60 * 1000;

        const {count, error: countError} = await supabase
          .from('contact_messages')
          .select('*', {count: 'exact', head: true})
          .eq('ip_hash', ipHash)
          .gte('created_at', new Date(oneHourAgo).toISOString());

        if (countError) {
          console.error('[api/contact rate-limit] Supabase error:', countError);
        } else if ((count || 0) >= 3) {
          sendJson(res, 429, {
            error: `Rate limit reached (3 messages per hour). Please email ${siteData.contact.email} directly.`,
          });
          return;
        }

        const {error: insertError} = await supabase.from('contact_messages').insert({
          name: parsed.data.name,
          email: parsed.data.email,
          subject: parsed.data.subject,
          message: parsed.data.message,
          ip_hash: ipHash,
          status: 'new',
        });

        const savedToDb = !insertError;
        if (insertError) {
          console.error('[api/contact insert] Supabase error:', insertError);
        }

        let emailed = false;
        const resend = getResendClient();
        if (resend) {
          try {
            await resend.emails.send({
              from: 'Ojas Awasthi Portfolio <onboarding@resend.dev>',
              to: getAdminEmail(),
              replyTo: parsed.data.email,
              subject: `[Portfolio Contact] ${parsed.data.subject}`,
              text: `From: ${parsed.data.name} (${parsed.data.email})\n\n${parsed.data.message}`,
            });
            emailed = true;
          } catch (emailErr) {
            console.error('[api/contact resend] Email error:', emailErr);
          }
        }

        if (!savedToDb && !emailed) {
          sendJson(res, 500, {
            error: `Unable to deliver message right now. Please email ${siteData.contact.email} directly.`,
          });
          return;
        }

        sendJson(res, 200, {
          ok: true,
          emailFallback: false,
          message: 'Thank you — your message has been delivered.',
        });
        return;
      } catch (err) {
        console.error('[api/contact] Error:', err);
        sendJson(res, 500, {error: 'Contact submission failed.'});
        return;
      }
    }

    // --------------------------------------------------------------------------
    // 7. NEWSLETTER SUBSCRIPTION (No emails sent; stores to Supabase only)
    // --------------------------------------------------------------------------
    if (route === '/api/newsletter' && method === 'POST') {
      await handleNewsletterSignup(req, res, supabase, missingVars);
      return;
    }

    // --------------------------------------------------------------------------
    // 8. PRIVACY-FRIENDLY PAGE VIEW ANALYTICS
    // --------------------------------------------------------------------------
    if (route === '/api/analytics' && method === 'POST') {
      try {
        if (!supabase) {
          missingEnvResponse(res, missingVars);
          return;
        }

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

        const {error} = await supabase.from('page_views').insert({
          path: pathStr,
          referrer: referrerStr,
          country: countryStr,
          device: deviceStr,
        });

        if (error) {
          console.error('[api/analytics] Supabase error:', error);
        }

        sendJson(res, 200, {ok: true});
        return;
      } catch (err) {
        console.error('[api/analytics] Error:', err);
        sendJson(res, 500, {error: 'Analytics recording failed.'});
        return;
      }
    }

    // --------------------------------------------------------------------------
    // 9. ASK ABOUT OJAS CHATBOT (GEMINI API)
    // --------------------------------------------------------------------------
    if (route === '/api/chat' && method === 'POST') {
      await handleChatRequest(req, res, supabase);
      return;
    }

    // --------------------------------------------------------------------------
    // 10. ADMIN ROUTES (Protected by Supabase JWT matching ADMIN_EMAIL)
    // --------------------------------------------------------------------------
    if (route.startsWith('/api/admin/')) {
      try {
        if (!(await verifyAdminRequest(req, res, supabase, missingVars))) return;
        if (!supabase) {
          missingEnvResponse(res, missingVars);
          return;
        }

        // /api/admin/projects
        if (route === '/api/admin/projects') {
          if (method === 'GET') {
            const {data, error} = await supabase
              .from('projects')
              .select('*')
              .order('sort_order', {ascending: true})
              .order('created_at', {ascending: false});
            if (error) {
              console.error('[api/admin/projects GET] Error:', error);
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
            const {data, error} = await supabase
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
              console.error('[api/admin/projects POST] Error:', error);
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
              supabase
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
            const {data, error} = await supabase
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
              console.error('[api/admin/projects PATCH] Error:', error);
              sendJson(res, 400, {error: error.message});
              return;
            }
            sendJson(res, 200, {project: data});
            return;
          }

          if (method === 'DELETE') {
            const {error} = await supabase.from('projects').delete().eq('id', id);
            if (error) {
              console.error('[api/admin/projects DELETE] Error:', error);
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
          const {error} = await supabase.storage
            .from('project-images')
            .upload(safeName, buffer, {contentType: mimeType, upsert: false});

          if (error) {
            console.error('[api/admin/upload] Error:', error);
            sendJson(res, 500, {error: error.message});
            return;
          }

          const {data: pub} = supabase.storage
            .from('project-images')
            .getPublicUrl(safeName);
          sendJson(res, 200, {url: pub.publicUrl});
          return;
        }

        // /api/admin/messages
        if (route === '/api/admin/messages' && method === 'GET') {
          const {data, error} = await supabase
            .from('contact_messages')
            .select('*')
            .order('created_at', {ascending: false});
          if (error) {
            console.error('[api/admin/messages GET] Error:', error);
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
          const {error} = await supabase
            .from('contact_messages')
            .update({status: body.status})
            .eq('id', id);
          if (error) {
            console.error('[api/admin/messages PATCH] Error:', error);
            sendJson(res, 400, {error: error.message});
            return;
          }
          sendJson(res, 200, {ok: true});
          return;
        }

        // /api/admin/testimonials
        if (route === '/api/admin/testimonials' && method === 'GET') {
          const {data, error} = await supabase
            .from('testimonials')
            .select('*')
            .order('created_at', {ascending: false});
          if (error) {
            console.error('[api/admin/testimonials GET] Error:', error);
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
            const {error} = await supabase
              .from('testimonials')
              .update({approved: Boolean(body.approved)})
              .eq('id', id);
            if (error) {
              console.error('[api/admin/testimonials PATCH] Error:', error);
              sendJson(res, 400, {error: error.message});
              return;
            }
            sendJson(res, 200, {ok: true});
            return;
          }
          if (method === 'DELETE') {
            const {error} = await supabase
              .from('testimonials')
              .delete()
              .eq('id', id);
            if (error) {
              console.error('[api/admin/testimonials DELETE] Error:', error);
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
          const {data, error} = await supabase
            .from('page_views')
            .select('*')
            .gte('created_at', sevenDaysAgo)
            .order('created_at', {ascending: false});
          if (error) {
            console.error('[api/admin/analytics GET] Error:', error);
            sendJson(res, 500, {error: error.message});
            return;
          }
          sendJson(res, 200, {views: data || []});
          return;
        }

        // /api/admin/chat-logs
        if (route === '/api/admin/chat-logs' && method === 'GET') {
          const {data, error} = await supabase
            .from('chat_logs')
            .select('id, question, answer, ip_hash, created_at')
            .order('created_at', {ascending: false})
            .limit(200);
          if (error) {
            console.error('[api/admin/chat-logs GET] Error:', error);
            if (
              error.code === '42P01' ||
              error.message?.toLowerCase().includes('chat_logs')
            ) {
              sendJson(res, 200, {logs: [], tableMissing: true});
              return;
            }
            sendJson(res, 500, {error: error.message});
            return;
          }
          sendJson(res, 200, {logs: data || []});
          return;
        }

        // /api/admin/newsletter
        if (route === '/api/admin/newsletter' && method === 'GET') {
          const {data, error} = await supabase
            .from('newsletter_subscribers')
            .select('*')
            .order('created_at', {ascending: false});
          if (error) {
            console.error('[api/admin/newsletter GET] Error:', error);
            sendJson(res, 500, {error: error.message});
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
          sendJson(res, 200, {subscribers});
          return;
        }

        // /api/admin/newsletter/:id
        if (route.startsWith('/api/admin/newsletter/') && method === 'DELETE') {
          const id = route.slice('/api/admin/newsletter/'.length);
          if (!id) {
            sendJson(res, 400, {error: 'Subscriber ID is required.'});
            return;
          }
          const {error} = await supabase
            .from('newsletter_subscribers')
            .delete()
            .eq('id', id);
          if (error) {
            console.error('[api/admin/newsletter DELETE] Error:', error);
            sendJson(res, 400, {error: error.message});
            return;
          }
          sendJson(res, 200, {ok: true});
          return;
        }

        // /api/admin/settings
        if (route === '/api/admin/settings' && method === 'PUT') {
          const body = await parseJsonBody<{settings?: SiteSettingsMap}>(req);
          if (!body.settings) {
            sendJson(res, 400, {error: 'Settings payload missing'});
            return;
          }
          const {error} = await supabase.from('site_settings').upsert([
            {key: 'availability', value: body.settings.availability},
            {key: 'hero', value: body.settings.hero},
          ]);
          if (error) {
            console.error('[api/admin/settings PUT] Error:', error);
            sendJson(res, 400, {error: error.message});
            return;
          }
          sendJson(res, 200, {ok: true});
          return;
        }
      } catch (err) {
        console.error('[api/admin] Error:', err);
        sendJson(res, 500, {error: 'Admin request failed.'});
        return;
      }
    }

    // --------------------------------------------------------------------------
    // 10. DYNAMIC SSR HTML FOR /work/[slug], /blog/[slug], AND 404 ROUTES
    // --------------------------------------------------------------------------
    if ((method === 'GET' || method === 'HEAD') && !route.startsWith('/api/')) {
      try {
        const baseUrl = getBaseUrl();
        const projects = await getPublishedProjects(supabase);
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
      } catch (err) {
        console.error('[ssr html] Error:', err);
        sendJson(res, 500, {error: 'Failed to render page.'});
        return;
      }
    }

    sendJson(res, 404, {error: `Unknown API route: ${method} ${route}`});
  } catch (err) {
    console.error('[api/index] Unhandled error:', err);
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
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
  } catch (err) {
    console.error('[loadHtmlTemplate] Fallback fetch failed:', err);
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
