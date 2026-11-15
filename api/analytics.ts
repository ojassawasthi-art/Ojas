import {
  parseJsonBody,
  sendJson,
  supabaseAdmin,
  type ApiRequest,
  type ApiResponse,
} from './_lib/vercel';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, {error: 'Method not allowed'});
    return;
  }

  const body = await parseJsonBody<{
    path?: string;
    referrer?: string;
    device?: string;
  }>(req);

  const pathStr = String(body.path || '/').slice(0, 300);
  const referrerStr = String(body.referrer || '').slice(0, 200);
  const deviceStr = body.device === 'mobile' ? 'mobile' : 'desktop';
  const countryStr = String(
    req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'] || '',
  ).slice(0, 10);

  if (supabaseAdmin) {
    await supabaseAdmin.from('page_views').insert({
      path: pathStr,
      referrer: referrerStr,
      country: countryStr,
      device: deviceStr,
    });
  }

  sendJson(res, 200, {ok: true});
}
