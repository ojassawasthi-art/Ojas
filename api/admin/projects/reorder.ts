import {
  parseJsonBody,
  sendJson,
  supabaseAdmin,
  verifyAdminRequest,
  type ApiRequest,
  type ApiResponse,
} from '../../_lib/vercel';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, {error: 'Method not allowed'});
    return;
  }
  if (!(await verifyAdminRequest(req, res))) return;
  if (!supabaseAdmin) {
    sendJson(res, 503, {error: 'Supabase not configured.'});
    return;
  }

  const body = await parseJsonBody<{orderedIds?: string[]}>(req);
  const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds : [];

  await Promise.all(
    orderedIds.map((id, idx) =>
      supabaseAdmin!.from('projects').update({sort_order: idx + 1}).eq('id', id),
    ),
  );

  sendJson(res, 200, {ok: true});
}
