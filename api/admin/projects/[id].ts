import {
  getQueryParam,
  parseJsonBody,
  sendJson,
  supabaseAdmin,
  verifyAdminRequest,
  type ApiRequest,
  type ApiResponse,
} from '../../_lib/vercel';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (!(await verifyAdminRequest(req, res))) return;
  if (!supabaseAdmin) {
    sendJson(res, 503, {error: 'Supabase not configured.'});
    return;
  }

  const id = getQueryParam(req, 'id');
  if (!id) {
    sendJson(res, 400, {error: 'Missing project ID'});
    return;
  }

  if (req.method === 'PATCH') {
    const body = await parseJsonBody<Record<string, unknown>>(req);
    const {data, error} = await supabaseAdmin
      .from('projects')
      .update({
        title: String(body.title || ''),
        slug: String(body.slug || ''),
        description: String(body.description || ''),
        long_description: body.long_description ? String(body.long_description) : null,
        live_url: body.live_url ? String(body.live_url) : null,
        github_url: body.github_url ? String(body.github_url) : null,
        thumbnail_url: body.thumbnail_url ? String(body.thumbnail_url) : null,
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

  if (req.method === 'DELETE') {
    const {error} = await supabaseAdmin.from('projects').delete().eq('id', id);
    if (error) {
      sendJson(res, 400, {error: error.message});
      return;
    }
    sendJson(res, 200, {ok: true});
    return;
  }

  sendJson(res, 405, {error: 'Method not allowed'});
}
