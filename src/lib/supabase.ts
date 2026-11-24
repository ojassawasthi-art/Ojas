import {createClient, type SupabaseClient} from '@supabase/supabase-js';

function normalizeSupabaseBaseUrl(rawUrl: string): string {
  return rawUrl
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

const supabaseUrl = normalizeSupabaseBaseUrl(
  import.meta.env.VITE_SUPABASE_URL || '',
);

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
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

export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').trim();
