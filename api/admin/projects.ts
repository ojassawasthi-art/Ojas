import {
  parseJsonBody,
  sendJson,
  supabaseAdmin,
  verifyAdminRequest,
  type ApiRequest,
  type ApiResponse,
} from '../_lib/vercel';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (!(await verifyAdminRequest(req, res))) return;
  if (!supabaseAdmin) {
    sendJson(res, 503, {error: 'Supabase not configured.'});
    return;
  }

  if (req.method === 'GET') {
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

  if (req.method === 'POST') {
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
        long_description: body.long_description ? String(body.long_description) : null,
        live_url: body.live_url ? String(body.live_url) : null,
        github_url: body.github_url ? String(body.github_url) : null,
        thumbnail_url: body.thumbnail_url ? String(body.thumbnail_url) : null,
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

  sendJson(res, 405, {error: 'Method not allowed'});
}
