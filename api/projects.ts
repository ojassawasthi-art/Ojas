import {
  getPublishedProjects,
  isSupabaseAdminReady,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from './_lib/vercel';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    sendJson(res, 405, {error: 'Method not allowed'});
    return;
  }

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  const projects = await getPublishedProjects();
  sendJson(res, 200, {
    projects,
    supabaseConnected: isSupabaseAdminReady,
  });
}
