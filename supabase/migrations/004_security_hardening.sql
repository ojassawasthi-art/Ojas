-- ============================================================================
-- Ojas Awasthi Portfolio — Security Hardening & Persistent Rate Limits
-- ============================================================================
-- Safe to re-run inside the Supabase SQL Editor.
-- 1. Hardens public.is_ojas_admin() with explicit search_path and authenticated role check.
-- 2. Removes legacy direct-anonymous INSERT policies on contact_messages,
--    testimonials, and page_views so all public writes must pass through
--    rate-limited, validated /api/* routes using SUPABASE_SERVICE_ROLE_KEY.
-- 3. Adds public.api_rate_limits table (strict admin-only RLS; no public access)
--    for persistent rate limiting across Vercel serverless instances.
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. Harden admin helper function (lock search_path, require authenticated session + uid)
create or replace function public.is_ojas_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    auth.role() = 'authenticated'
    and auth.uid() is not null
    and lower(coalesce(auth.jwt() ->> 'email', '')) = lower('ojassawasthi@gmail.com'),
    false
  );
$$;

-- 2. Remove direct public INSERT policies that bypassed /api/* validation & rate limits
drop policy if exists "Public can submit contact messages" on public.contact_messages;
drop policy if exists "Public can submit testimonials for moderation" on public.testimonials;
drop policy if exists "Public can log privacy-friendly page views" on public.page_views;
drop policy if exists "Public can subscribe to newsletter" on public.newsletter_subscribers;

-- Ensure RLS stays enabled on every table
alter table public.projects enable row level security;
alter table public.contact_messages enable row level security;
alter table public.testimonials enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.page_views enable row level security;
alter table public.site_settings enable row level security;

-- 3. Shared persistent rate-limit ledger for all /api/* routes
create table if not exists public.api_rate_limits (
  id uuid primary key default gen_random_uuid(),
  route_key text not null check (char_length(route_key) between 1 and 80),
  identifier_hash text not null check (char_length(identifier_hash) between 1 and 128),
  created_at timestamptz not null default now()
);

create index if not exists idx_api_rate_limits_lookup
  on public.api_rate_limits (route_key, identifier_hash, created_at desc);

alter table public.api_rate_limits enable row level security;

drop policy if exists "Admin full access on api_rate_limits" on public.api_rate_limits;
create policy "Admin full access on api_rate_limits"
  on public.api_rate_limits for all
  using (public.is_ojas_admin())
  with check (public.is_ojas_admin());
