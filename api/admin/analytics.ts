import {
  sendJson,
  supabaseAdmin,
  verifyAdminRequest,
  type ApiRequest,
  type ApiResponse,
} from '../_lib/vercel';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    sendJson(res, 405, {error: 'Method not allowed'});
    return;
  }
  if (!(await verifyAdminRequest(req, res))) return;
  if (!supabaseAdmin) {
    sendJson(res, 503, {error: 'Supabase not configured.'});
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
    sendJson(res, 500, {error: error.message});
    return;
  }

  sendJson(res, 200, {views: data || []});
}
