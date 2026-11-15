import {siteContent} from '../src/content/site';
import {
  getBaseUrl,
  getPublishedProjects,
  sendText,
  type ApiRequest,
  type ApiResponse,
} from './_lib/vercel';

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    sendText(res, 405, 'text/plain; charset=utf-8', 'Method not allowed');
    return;
  }

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
    <loc>${escapeXml(`${baseUrl}${route === '/' ? '' : route}`)}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>${route === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  sendText(res, 200, 'application/xml; charset=utf-8', xml);
}
