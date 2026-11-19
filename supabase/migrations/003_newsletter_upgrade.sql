-- ============================================================================
-- Ojas Awasthi Portfolio — Newsletter Subscribers Upgrade & Strict RLS
-- ============================================================================
-- Safe to re-run inside the Supabase SQL Editor.
-- Does NOT recreate newsletter_subscribers; adds missing columns in place.
-- Public users cannot read, insert, update, or delete rows directly.
-- Inserts go through POST /api/newsletter using SUPABASE_SERVICE_ROLE_KEY.
-- Only the admin (ADMIN_EMAIL = ojassawasthi@gmail.com) can read and delete.
-- ============================================================================

alter table public.newsletter_subscribers
  add column if not exists name text,
  add column if not exists source text default 'website',
  add column if not exists consent boolean default false,
  add column if not exists consent_text text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists ip_hash text;

-- Normalize any pre-existing emails to lowercase before enforcing lower(email) uniqueness
update public.newsletter_subscribers
set email = lower(trim(email))
where email <> lower(trim(email));

-- Enforce case-insensitive uniqueness on lower(email)
create unique index if not exists idx_newsletter_subscribers_email_lower
  on public.newsletter_subscribers (lower(email));

-- Index for per-IP rate limiting (5 signups per hour)
create index if not exists idx_newsletter_subscribers_ip_created
  on public.newsletter_subscribers (ip_hash, created_at desc);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table public.newsletter_subscribers enable row level security;

-- Remove any legacy public insert/read/update/delete policies
drop policy if exists "Public can subscribe to newsletter" on public.newsletter_subscribers;
drop policy if exists "Admin full access on newsletter_subscribers" on public.newsletter_subscribers;
drop policy if exists "Admin can read newsletter subscribers" on public.newsletter_subscribers;
drop policy if exists "Admin can delete newsletter subscribers" on public.newsletter_subscribers;

-- Only admin (email = ADMIN_EMAIL via public.is_ojas_admin()) can read or delete
create policy "Admin can read newsletter subscribers"
  on public.newsletter_subscribers for select
  using (public.is_ojas_admin());

create policy "Admin can delete newsletter subscribers"
  on public.newsletter_subscribers for delete
  using (public.is_ojas_admin());
