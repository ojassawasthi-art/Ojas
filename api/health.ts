import {
  isSupabaseAdminReady,
  isSupabasePublicReady,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from './_lib/vercel';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    sendJson(res, 405, {error: 'Method not allowed'});
    return;
  }

  sendJson(res, 200, {
    ok: true,
    supabaseConnected: isSupabaseAdminReady && isSupabasePublicReady,
  });
}
