import fs from 'node:fs';
import path from 'node:path';
import {z} from 'zod';
import {handleChatRequest} from './_lib/chat.js';
import {handleNewsletterSignup} from './_lib/newsletter.js';
import {buildPageSeoData, injectSeoIntoHtml} from './_lib/route-seo.js';
import {siteData} from './_lib/site-data.js';
import {
  checkRateLimit,
  escapeXml,
  getAdminEmail,
  getBaseUrl,
  getClientIp,
  getPublishedProjects,
  getResendClient,
  getSiteSettings,
  getSupabaseAdmin,
  hashIdentifier,
  hashIp,
  InvalidJsonError,
  isSafeHttpUrl,
  isSafeImageUrl,
  isUuid,
  parseJsonBody,
  PayloadTooLargeError,
  redactSecrets,
  sanitizeSingleLine,
  sendJson,
  sendText,
  validateAndDecodeImageUpload,
  verifyAdminRequest,
  type ApiRequest,
  type ApiResponse,
} from './_lib/vercel.js';

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
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens.');

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
    .refine((val) => val.startsWith('/') && !val.startsWith('//'), {
      message: 'Path must be a relative route starting with /',
    })
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

function serviceUnavailableResponse(
  res: ApiResponse,
  context: string,
  missingVars: string[],
) {
  console.error(
    `[${context}] Supabase not configured. Missing:`,
    missingVars.join(', '),
  );
  sendJson(res, 503, {error: 'Service is temporarily unavailable.'});
}

function handleBodyError(res: ApiResponse, err: unknown): boolean {
  if (err instanceof PayloadTooLargeError) {
    sendJson(res, 413, {error: 'Request payload is too large.'});
    return true;
  }
  if (err instanceof InvalidJsonError) {
    sendJson(res, 400, {error: 'Invalid request format.'});
    return true;
  }
  return false;
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
        res.setHeader('Cache-Control', 'no-store');
        if (!supabase) {
          console.error(
            '[api/health] Missing env vars:',
            missingVars.join(', '),
          );
          sendJson(res, 503, {
            ok: false,
            supabaseConnected: false,
          });
          return;
        }
        sendJson(res, 200, {
          ok: true,
          supabaseConnected: true,
        });
        return;
      } catch (err) {
        console.error('[api/health] Error:', redactSecrets(err));
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
        console.error('[sitemap.xml] Error:', redactSecrets(err));
        sendJson(res, 500, {error: 'Failed to generate sitemap.'});
        return;
      }
    }

    // --------------------------------------------------------------------------
    // 3. PROJECTS
    // --------------------------------------------------------------------------
    if (route === '/api/projects' && method === 'GET') {
      try {
        if (!supabase) {
          serviceUnavailableResponse(res, 'api/projects', missingVars);
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
        console.error('[api/projects] Error:', redactSecrets(err));
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
          serviceUnavailableResponse(res, 'api/settings', missingVars);
          return;
        }
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        const settings = await getSiteSettings(supabase);
        sendJson(res, 200, {settings});
        return;
      } catch (err) {
        console.error('[api/settings] Error:', redactSecrets(err));
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
          serviceUnavailableResponse(res, 'api/testimonials', missingVars);
          return;
        }

        if (method === 'GET') {
          res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
          const {data, error} = await supabase
            .from('testimonials')
            .select('id, name, role, company, quote, avatar_url, approved, created_at')
            .eq('approved', true)
            .order('created_at', {ascending: false});
          if (error) {
            console.error(
              '[api/testimonials GET] Supabase error:',
              redactSecrets(error.message),
            );
            sendJson(res, 500, {error: 'Unable to fetch testimonials.'});
            return;
          }
          sendJson(res, 200, {testimonials: Array.isArray(data) ? data : []});
          return;
        }

        if (method === 'POST') {
          res.setHeader('Cache-Control', 'no-store');
          const body = await parseJsonBody(req, {maxBytes: 16 * 1024});
          const parsed = testimonialSchema.safeParse(body);
          if (!parsed.success) {
            sendJson(res, 400, {error: 'Please fill out all required fields.'});
            return;
          }

          if (parsed.data.website && parsed.data.website.trim().length > 0) {
            sendJson(res, 200, {
              ok: true,
              message: 'Thank you. Your testimonial has been queued for approval.',
            });
            return;
          }

          const ipHash = hashIp(getClientIp(req));
          const allowed = await checkRateLimit(supabase, {
            routeKey: 'testimonials',
            identifierHash: ipHash,
            maxRequests: 3,
            windowMs: 60 * 60 * 1000,
          });
          if (!allowed) {
            sendJson(res, 429, {
              error: 'Too many submissions right now. Please try again later.',
            });
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
            console.error(
              '[api/testimonials POST] Supabase error:',
              redactSecrets(error.message),
            );
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
        if (handleBodyError(res, err)) return;
        console.error('[api/testimonials] Error:', redactSecrets(err));
        sendJson(res, 500, {error: 'Testimonials request failed.'});
        return;
      }
    }

    // --------------------------------------------------------------------------
    // 6. CONTACT FORM
    // --------------------------------------------------------------------------
    if (route === '/api/contact' && method === 'POST') {
      try {
        res.setHeader('Cache-Control', 'no-store');
        if (!supabase) {
          serviceUnavailableResponse(res, 'api/contact', missingVars);
          return;
        }

        const body = await parseJsonBody(req, {maxBytes: 32 * 1024});
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

        const sharedAllowed = await checkRateLimit(supabase, {
          routeKey: 'contact',
          identifierHash: ipHash,
          maxRequests: 3,
          windowMs: 60 * 60 * 1000,
        });
        if (!sharedAllowed) {
          sendJson(res, 429, {
            error: `Rate limit reached (3 messages per hour). Please email ${siteData.contact.email} directly.`,
          });
          return;
        }

        const {count, error: countError} = await supabase
          .from('contact_messages')
          .select('*', {count: 'exact', head: true})
          .eq('ip_hash', ipHash)
          .gte('created_at', new Date(oneHourAgo).toISOString());

        if (countError) {
          console.error(
            '[api/contact rate-limit] Supabase error:',
            redactSecrets(countError.message),
          );
        } else if ((count || 0) >= 3) {
          sendJson(res, 429, {
            error: `Rate limit reached (3 messages per hour). Please email ${siteData.contact.email} directly.`,
          });
          return;
        }

        const cleanName = sanitizeSingleLine(parsed.data.name);
        const cleanSubject = sanitizeSingleLine(parsed.data.subject);

        const {error: insertError} = await supabase.from('contact_messages').insert({
          name: cleanName,
          email: parsed.data.email,
          subject: cleanSubject,
          message: parsed.data.message,
          ip_hash: ipHash,
          status: 'new',
        });

        const savedToDb = !insertError;
        if (insertError) {
          console.error(
            '[api/contact insert] Supabase error:',
            redactSecrets(insertError.message),
          );
        }

        let emailed = false;
        const resend = getResendClient();
        if (resend) {
          try {
            await resend.emails.send({
              from: 'Ojas Awasthi Portfolio <onboarding@resend.dev>',
              to: getAdminEmail(),
              replyTo: parsed.data.email,
              subject: `[Portfolio Contact] ${cleanSubject}`,
              text: `From: ${cleanName} (${parsed.data.email})\n\n${parsed.data.message}`,
            });
            emailed = true;
          } catch (emailErr) {
            console.error('[api/contact resend] Email error:', redactSecrets(emailErr));
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
        if (handleBodyError(res, err)) return;
        console.error('[api/contact] Error:', redactSecrets(err));
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
        res.setHeader('Cache-Control', 'no-store');
        if (!supabase) {
          serviceUnavailableResponse(res, 'api/analytics', missingVars);
          return;
        }

        const ipHash = hashIp(getClientIp(req));
        const allowed = await checkRateLimit(supabase, {
          routeKey: 'analytics',
          identifierHash: ipHash,
          maxRequests: 60,
          windowMs: 60 * 1000,
        });
        if (!allowed) {
          sendJson(res, 429, {error: 'Rate limit exceeded.'});
          return;
        }

        const body = await parseJsonBody(req, {maxBytes: 8 * 1024});
        const parsed = analyticsSchema.safeParse(body);
        if (!parsed.success) {
          sendJson(res, 400, {error: 'Invalid analytics payload.'});
          return;
        }

        const countryStr = sanitizeSingleLine(
          String(
            req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'] || '',
          ),
        ).slice(0, 10);

        const {error} = await supabase.from('page_views').insert({
          path: parsed.data.path,
          referrer: sanitizeSingleLine(parsed.data.referrer).slice(0, 200),
          country: countryStr,
          device: parsed.data.device,
        });

        if (error) {
          console.error('[api/analytics] Supabase error:', redactSecrets(error.message));
        }

        sendJson(res, 200, {ok: true});
        return;
      } catch (err) {
        if (handleBodyError(res, err)) return;
        console.error('[api/analytics] Error:', redactSecrets(err));
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
        res.setHeader('Cache-Control', 'no-store');
        const auth = await verifyAdminRequest(req, res, supabase, missingVars);
        if (!auth.ok || !supabase) return;

        // /api/admin/projects
        if (route === '/api/admin/projects') {
          if (method === 'GET') {
            const {data, error} = await supabase
              .from('projects')
              .select('*')
              .order('sort_order', {ascending: true})
              .order('created_at', {ascending: false});
            if (error) {
              console.error(
                '[api/admin/projects GET] Error:',
                redactSecrets(error.message),
              );
              sendJson(res, 500, {error: 'Unable to load projects.'});
              return;
            }
            sendJson(res, 200, {projects: data || []});
            return;
          }

          if (method === 'POST') {
            const body = await parseJsonBody(req, {maxBytes: 64 * 1024});
            const parsed = projectPayloadSchema.safeParse(body);
            if (!parsed.success) {
              sendJson(res, 400, {
                error: 'Please check the project details (valid slug and http/https URLs required).',
              });
              return;
            }
            const {data, error} = await supabase
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
              console.error(
                '[api/admin/projects POST] Error:',
                redactSecrets(error.message),
              );
              sendJson(res, 400, {error: 'Unable to create project.'});
              return;
            }
            sendJson(res, 200, {project: data});
            return;
          }
        }

        // /api/admin/projects/reorder
        if (route === '/api/admin/projects/reorder' && method === 'POST') {
          const body = await parseJsonBody(req, {maxBytes: 32 * 1024});
          const parsed = reorderSchema.safeParse(body);
          if (!parsed.success) {
            sendJson(res, 400, {error: 'Invalid project order payload.'});
            return;
          }
          await Promise.all(
            parsed.data.orderedIds.map((id, idx) =>
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
          if (!isUuid(id)) {
            sendJson(res, 400, {error: 'Invalid project ID.'});
            return;
          }

          if (method === 'PATCH') {
            const body = await parseJsonBody(req, {maxBytes: 64 * 1024});
            const parsed = projectPayloadSchema.safeParse(body);
            if (!parsed.success) {
              sendJson(res, 400, {
                error: 'Please check the project details (valid slug and http/https URLs required).',
              });
              return;
            }
            const {data, error} = await supabase
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
              console.error(
                '[api/admin/projects PATCH] Error:',
                redactSecrets(error.message),
              );
              sendJson(res, 400, {error: 'Unable to update project.'});
              return;
            }
            sendJson(res, 200, {project: data});
            return;
          }

          if (method === 'DELETE') {
            const {error} = await supabase.from('projects').delete().eq('id', id);
            if (error) {
              console.error(
                '[api/admin/projects DELETE] Error:',
                redactSecrets(error.message),
              );
              sendJson(res, 400, {error: 'Unable to delete project.'});
              return;
            }
            sendJson(res, 200, {ok: true});
            return;
          }
        }

        // /api/admin/upload
        if (route === '/api/admin/upload' && method === 'POST') {
          const ipHash = hashIp(getClientIp(req));
          const uploadActor = hashIdentifier('admin-upload', `${auth.userId}:${ipHash}`);
          const uploadAllowed = await checkRateLimit(supabase, {
            routeKey: 'admin-upload',
            identifierHash: uploadActor,
            maxRequests: 15,
            windowMs: 10 * 60 * 1000,
          });
          if (!uploadAllowed) {
            sendJson(res, 429, {
              error: 'Too many uploads. Please wait a few minutes and try again.',
            });
            return;
          }

          const payload = await parseJsonBody<{
            mimeType?: unknown;
            dataUrl?: unknown;
          }>(req, {maxBytes: Math.ceil(7.5 * 1024 * 1024)});

          const verified = validateAndDecodeImageUpload(payload);
          if (!verified.ok) {
            sendJson(res, 400, {error: verified.error});
            return;
          }

          const {error} = await supabase.storage
            .from('project-images')
            .upload(verified.fileName, verified.buffer, {
              contentType: verified.mimeType,
              cacheControl: '31536000',
              upsert: false,
            });

          if (error) {
            console.error('[api/admin/upload] Error:', redactSecrets(error.message));
            sendJson(res, 500, {error: 'Unable to upload image right now.'});
            return;
          }

          const {data: pub} = supabase.storage
            .from('project-images')
            .getPublicUrl(verified.fileName);
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
            console.error(
              '[api/admin/messages GET] Error:',
              redactSecrets(error.message),
            );
            sendJson(res, 500, {error: 'Unable to load messages.'});
            return;
          }
          sendJson(res, 200, {messages: data || []});
          return;
        }

        // /api/admin/messages/:id
        if (route.startsWith('/api/admin/messages/') && method === 'PATCH') {
          const id = route.slice('/api/admin/messages/'.length);
          if (!isUuid(id)) {
            sendJson(res, 400, {error: 'Invalid message ID.'});
            return;
          }
          const body = await parseJsonBody(req, {maxBytes: 4 * 1024});
          const parsed = messageStatusSchema.safeParse(body);
          if (!parsed.success) {
            sendJson(res, 400, {error: 'Invalid message status.'});
            return;
          }
          const {error} = await supabase
            .from('contact_messages')
            .update({status: parsed.data.status})
            .eq('id', id);
          if (error) {
            console.error(
              '[api/admin/messages PATCH] Error:',
              redactSecrets(error.message),
            );
            sendJson(res, 400, {error: 'Unable to update message status.'});
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
            console.error(
              '[api/admin/testimonials GET] Error:',
              redactSecrets(error.message),
            );
            sendJson(res, 500, {error: 'Unable to load testimonials.'});
            return;
          }
          sendJson(res, 200, {testimonials: data || []});
          return;
        }

        // /api/admin/testimonials/:id
        if (route.startsWith('/api/admin/testimonials/')) {
          const id = route.slice('/api/admin/testimonials/'.length);
          if (!isUuid(id)) {
            sendJson(res, 400, {error: 'Invalid testimonial ID.'});
            return;
          }
          if (method === 'PATCH') {
            const body = await parseJsonBody(req, {maxBytes: 4 * 1024});
            const parsed = testimonialPatchSchema.safeParse(body);
            if (!parsed.success) {
              sendJson(res, 400, {error: 'Invalid testimonial update payload.'});
              return;
            }
            const {error} = await supabase
              .from('testimonials')
              .update({approved: parsed.data.approved})
              .eq('id', id);
            if (error) {
              console.error(
                '[api/admin/testimonials PATCH] Error:',
                redactSecrets(error.message),
              );
              sendJson(res, 400, {error: 'Unable to update testimonial.'});
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
              console.error(
                '[api/admin/testimonials DELETE] Error:',
                redactSecrets(error.message),
              );
              sendJson(res, 400, {error: 'Unable to delete testimonial.'});
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
            console.error(
              '[api/admin/analytics GET] Error:',
              redactSecrets(error.message),
            );
            sendJson(res, 500, {error: 'Unable to load analytics.'});
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
            console.error(
              '[api/admin/chat-logs GET] Error:',
              redactSecrets(error.message),
            );
            if (
              error.code === '42P01' ||
              error.message?.toLowerCase().includes('chat_logs')
            ) {
              sendJson(res, 200, {logs: [], tableMissing: true});
              return;
            }
            sendJson(res, 500, {error: 'Unable to load chat logs.'});
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
            console.error(
              '[api/admin/newsletter GET] Error:',
              redactSecrets(error.message),
            );
            sendJson(res, 500, {error: 'Unable to load subscribers.'});
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
          if (!isUuid(id)) {
            sendJson(res, 400, {error: 'Invalid subscriber ID.'});
            return;
          }
          const {error} = await supabase
            .from('newsletter_subscribers')
            .delete()
            .eq('id', id);
          if (error) {
            console.error(
              '[api/admin/newsletter DELETE] Error:',
              redactSecrets(error.message),
            );
            sendJson(res, 400, {error: 'Unable to delete subscriber.'});
            return;
          }
          sendJson(res, 200, {ok: true});
          return;
        }

        // /api/admin/settings
        if (route === '/api/admin/settings' && method === 'PUT') {
          const body = await parseJsonBody(req, {maxBytes: 16 * 1024});
          const parsed = settingsPayloadSchema.safeParse(body);
          if (!parsed.success) {
            sendJson(res, 400, {error: 'Invalid settings payload.'});
            return;
          }
          const {error} = await supabase.from('site_settings').upsert([
            {key: 'availability', value: parsed.data.settings.availability},
            {key: 'hero', value: parsed.data.settings.hero},
          ]);
          if (error) {
            console.error(
              '[api/admin/settings PUT] Error:',
              redactSecrets(error.message),
            );
            sendJson(res, 400, {error: 'Unable to update settings.'});
            return;
          }
          sendJson(res, 200, {ok: true});
          return;
        }
      } catch (err) {
        if (handleBodyError(res, err)) return;
        console.error('[api/admin] Error:', redactSecrets(err));
        sendJson(res, 500, {error: 'Admin request failed.'});
        return;
      }
    }

    // --------------------------------------------------------------------------
    // 11. DYNAMIC SSR HTML FOR /work/[slug], /blog/[slug], AND 404 ROUTES
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
        console.error('[ssr html] Error:', redactSecrets(err));
        sendJson(res, 500, {error: 'Failed to render page.'});
        return;
      }
    }

    sendJson(res, 404, {error: 'Route not found.'});
  } catch (err) {
    console.error('[api/index] Unhandled error:', redactSecrets(err));
    sendJson(res, 500, {
      error: 'Internal server error.',
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
    console.error('[loadHtmlTemplate] Fallback fetch failed:', redactSecrets(err));
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
