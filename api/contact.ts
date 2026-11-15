import {z} from 'zod';
import {siteContent} from '../src/content/site';
import {
  ADMIN_EMAIL,
  getClientIp,
  hashIp,
  parseJsonBody,
  resend,
  sendJson,
  supabaseAdmin,
  type ApiRequest,
  type ApiResponse,
} from './_lib/vercel';

const contactBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(10).max(5000),
  website: z.string().optional(),
});

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, {error: 'Method not allowed'});
    return;
  }

  const body = await parseJsonBody(req);
  const parsed = contactBodySchema.safeParse(body);
  if (!parsed.success) {
    sendJson(res, 400, {error: 'Please check your form entries and try again.'});
    return;
  }

  // Honeypot trap
  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    sendJson(res, 200, {ok: true, message: 'Message received.'});
    return;
  }

  const ipHash = hashIp(getClientIp(req));
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  if (supabaseAdmin) {
    const {count} = await supabaseAdmin
      .from('contact_messages')
      .select('*', {count: 'exact', head: true})
      .eq('ip_hash', ipHash)
      .gte('created_at', new Date(oneHourAgo).toISOString());

    if ((count || 0) >= 3) {
      sendJson(res, 429, {
        error: `Rate limit reached (3 messages per hour). Please email ${siteContent.contact.email} directly.`,
      });
      return;
    }
  }

  let savedToDb = false;
  if (supabaseAdmin) {
    const {error} = await supabaseAdmin.from('contact_messages').insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
      ip_hash: ipHash,
      status: 'new',
    });
    if (!error) savedToDb = true;
  }

  let emailed = false;
  if (resend) {
    try {
      await resend.emails.send({
        from: 'Ojas Awasthi Portfolio <onboarding@resend.dev>',
        to: ADMIN_EMAIL,
        replyTo: parsed.data.email,
        subject: `[Portfolio Contact] ${parsed.data.subject}`,
        text: `From: ${parsed.data.name} (${parsed.data.email})\n\n${parsed.data.message}`,
      });
      emailed = true;
    } catch {
      // Non-fatal if Resend domain isn't verified yet
    }
  }

  if (!savedToDb && !emailed) {
    sendJson(res, 200, {
      ok: true,
      emailFallback: true,
      message: `Supabase and email notifications are not configured yet. Please reach out directly at ${siteContent.contact.email}.`,
    });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    emailFallback: false,
    message: 'Thank you — your message has been delivered.',
  });
}
