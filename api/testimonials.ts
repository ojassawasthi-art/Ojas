import {z} from 'zod';
import {
  parseJsonBody,
  sendJson,
  supabaseAdmin,
  type ApiRequest,
  type ApiResponse,
} from './_lib/vercel';

const testimonialSchema = z.object({
  name: z.string().trim().min(2).max(120),
  role: z.string().trim().min(2).max(120),
  company: z.string().trim().max(120).optional().default(''),
  quote: z.string().trim().min(10).max(1500),
});

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    if (supabaseAdmin) {
      const {data, error} = await supabaseAdmin
        .from('testimonials')
        .select('*')
        .eq('approved', true)
        .order('created_at', {ascending: false});
      if (!error && Array.isArray(data)) {
        sendJson(res, 200, {testimonials: data});
        return;
      }
    }
    sendJson(res, 200, {testimonials: []});
    return;
  }

  if (req.method === 'POST') {
    const body = await parseJsonBody(req);
    const parsed = testimonialSchema.safeParse(body);
    if (!parsed.success) {
      sendJson(res, 400, {error: 'Please fill out all required fields.'});
      return;
    }

    if (supabaseAdmin) {
      const {error} = await supabaseAdmin.from('testimonials').insert({
        name: parsed.data.name,
        role: parsed.data.role,
        company: parsed.data.company || '',
        quote: parsed.data.quote,
        approved: false,
      });
      if (error) {
        sendJson(res, 500, {error: 'Unable to submit testimonial.'});
        return;
      }
    }

    sendJson(res, 200, {
      ok: true,
      message: 'Thank you. Your testimonial has been queued for approval.',
    });
    return;
  }

  sendJson(res, 405, {error: 'Method not allowed'});
}
