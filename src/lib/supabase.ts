import {createClient, type SupabaseClient} from '@supabase/supabase-js';

function normalizeSupabaseBaseUrl(rawUrl: string): string {
  return rawUrl
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

const supabaseUrl = normalizeSupabaseBaseUrl(
  import.meta.env.VITE_SUPABASE_URL ||
    'https://hdryciyvkhozomertslx.supabase.co',
);

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_y2bqryW00-NO-JAnrOXKTw_Qa4pYP1H'
).trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const ADMIN_EMAIL = (
  import.meta.env.VITE_ADMIN_EMAIL || 'ojassawasthi@gmail.com'
).trim();
