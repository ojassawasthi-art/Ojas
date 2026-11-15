import {
  getBaseUrl,
  sendText,
  type ApiRequest,
  type ApiResponse,
} from './_lib/vercel';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    sendText(res, 405, 'text/plain; charset=utf-8', 'Method not allowed');
    return;
  }

  const baseUrl = getBaseUrl(req);
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  sendText(
    res,
    200,
    'text/plain; charset=utf-8',
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`,
  );
}
