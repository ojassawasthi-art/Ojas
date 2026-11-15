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
    sendJson(res, 400, {error: 'Missing testimonial ID'});
    return;
  }

  if (req.method === 'PATCH') {
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

  if (req.method === 'DELETE') {
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

  sendJson(res, 405, {error: 'Method not allowed'});
}
