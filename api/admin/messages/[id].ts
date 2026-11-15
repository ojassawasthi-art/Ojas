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
  if (req.method !== 'PATCH') {
    sendJson(res, 405, {error: 'Method not allowed'});
    return;
  }
  if (!(await verifyAdminRequest(req, res))) return;
  if (!supabaseAdmin) {
    sendJson(res, 503, {error: 'Supabase not configured.'});
    return;
  }

  const id = getQueryParam(req, 'id');
  const body = await parseJsonBody<{status?: string}>(req);
  if (!id || !body.status || !['new', 'read', 'replied'].includes(body.status)) {
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
}
