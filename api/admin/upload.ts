import {
  parseJsonBody,
  sendJson,
  supabaseAdmin,
  verifyAdminRequest,
  type ApiRequest,
  type ApiResponse,
} from '../_lib/vercel';

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

  const {fileName, mimeType, dataUrl} = await parseJsonBody<{
    fileName?: string;
    mimeType?: string;
    dataUrl?: string;
  }>(req);

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (!mimeType || !allowed.includes(mimeType)) {
    sendJson(res, 400, {
      error: 'Only JPEG, PNG, WebP, or AVIF images are allowed.',
    });
    return;
  }

  const base64Data = String(dataUrl || '').split(',')[1];
  if (!base64Data) {
    sendJson(res, 400, {error: 'Invalid image payload.'});
    return;
  }

  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.byteLength > 5 * 1024 * 1024) {
    sendJson(res, 400, {error: 'Image exceeds 5 MB limit.'});
    return;
  }

  const safeName = `${Date.now()}-${String(fileName || 'image').replace(
    /[^a-zA-Z0-9._-]/g,
    '',
  )}`;

  const {error} = await supabaseAdmin.storage
    .from('project-images')
    .upload(safeName, buffer, {contentType: mimeType, upsert: false});

  if (error) {
    sendJson(res, 500, {error: error.message});
    return;
  }

  const {data: pub} = supabaseAdmin.storage
    .from('project-images')
    .getPublicUrl(safeName);

  sendJson(res, 200, {url: pub.publicUrl});
}
