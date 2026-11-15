import {z} from 'zod';
import {siteContent} from '../src/content/site';
import {
  parseJsonBody,
  sendJson,
  supabaseAdmin,
  type ApiRequest,
  type ApiResponse,
} from './_lib/vercel';

const newsletterSchema = z.object({
  email: z.string().trim().email().max(254),
});

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, {error: 'Method not allowed'});
    return;
  }

  const body = await parseJsonBody(req);
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    sendJson(res, 400, {error: 'Please enter a valid email address.'});
    return;
  }

  if (supabaseAdmin) {
    const {error} = await supabaseAdmin
      .from('newsletter_subscribers')
      .upsert({email: parsed.data.email.toLowerCase()}, {onConflict: 'email'});
    if (error) {
      sendJson(res, 500, {error: 'Unable to subscribe right now.'});
      return;
    }
    sendJson(res, 200, {ok: true, message: 'Subscribed to updates.'});
    return;
  }

  sendJson(res, 200, {
    ok: true,
    message: `Connect Supabase to persist newsletter subscribers, or email ${siteContent.contact.email}.`,
  });
}
