-- ============================================================================
-- Ojas Awasthi Portfolio — Chat Logs & Rate Limits Migration
-- ============================================================================
-- Run this SQL inside your Supabase SQL Editor.
-- Public users (anon/authenticated non-admin) cannot read or write directly.
-- Only the server (/api/chat) writes using SUPABASE_SERVICE_ROLE_KEY.
-- Only the admin (ADMIN_EMAIL = ojassawasthi@gmail.com) can read logs.
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. CHAT LOGS
create table if not exists public.chat_logs (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 1 and 500),
  answer text not null check (char_length(answer) between 1 and 4000),
  ip_hash text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_logs_created on public.chat_logs (created_at desc);

-- 2. CHAT RATE LIMITS (max 15 messages per 10 minutes per ip_hash)
create table if not exists public.chat_rate_limits (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_rate_limits_ip_created on public.chat_rate_limits (ip_hash, created_at desc);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table public.chat_logs enable row level security;
alter table public.chat_rate_limits enable row level security;

-- Only admin can read/delete chat_logs; no public read/write policies exist.
drop policy if exists "Admin can read chat logs" on public.chat_logs;
create policy "Admin can read chat logs"
  on public.chat_logs for select
  using (public.is_ojas_admin());

drop policy if exists "Admin can delete chat logs" on public.chat_logs;
create policy "Admin can delete chat logs"
  on public.chat_logs for delete
  using (public.is_ojas_admin());

-- Only admin can manage chat_rate_limits; server uses service role key.
drop policy if exists "Admin full access on chat_rate_limits" on public.chat_rate_limits;
create policy "Admin full access on chat_rate_limits"
  on public.chat_rate_limits for all
  using (public.is_ojas_admin())
  with check (public.is_ojas_admin());
