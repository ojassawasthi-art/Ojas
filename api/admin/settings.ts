import type {SiteSettingsMap} from '../../src/types/database';
import {
  parseJsonBody,
  sendJson,
  supabaseAdmin,
  verifyAdminRequest,
  type ApiRequest,
  type ApiResponse,
} from '../_lib/vercel';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'PUT') {
    sendJson(res, 405, {error: 'Method not allowed'});
    return;
  }
  if (!(await verifyAdminRequest(req, res))) return;
  if (!supabaseAdmin) {
    sendJson(res, 503, {error: 'Supabase not configured.'});
    return;
  }

  const body = await parseJsonBody<{settings?: SiteSettingsMap}>(req);
  if (!body.settings) {
    sendJson(res, 400, {error: 'Settings payload missing'});
    return;
  }

  const {error} = await supabaseAdmin.from('site_settings').upsert([
    {key: 'availability', value: body.settings.availability},
    {key: 'hero', value: body.settings.hero},
  ]);

  if (error) {
    sendJson(res, 400, {error: error.message});
    return;
  }

  sendJson(res, 200, {ok: true});
}
