-- ============================================================================
-- Ojas Awasthi Portfolio — Complete Supabase PostgreSQL Schema, RLS & Seed
-- ============================================================================
-- Run this migration inside your Supabase SQL Editor.
-- Update the ADMIN_EMAIL in `is_ojas_admin()` if your admin email changes.
-- ============================================================================

create extension if not exists "pgcrypto";

-- Helper function: Admin is the authenticated user whose JWT email matches ADMIN_EMAIL
create or replace function public.is_ojas_admin()
returns boolean
language sql
stable
security definer
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') = lower('ojassawasthi@gmail.com'),
    false
  );
$$;

-- 1. PROJECTS
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  long_description text,
  live_url text,
  github_url text,
  thumbnail_url text,
  images text[] not null default '{}',
  tech_stack text[] not null default '{}',
  category text not null default 'Web',
  year text not null default '2026',
  featured boolean not null default false,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_projects_published_sort on public.projects (published, sort_order asc, created_at desc);

-- 2. CONTACT MESSAGES
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  subject text not null check (char_length(subject) between 1 and 200),
  message text not null check (char_length(message) between 10 and 5000),
  ip_hash text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied')),
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_messages_ip_created on public.contact_messages (ip_hash, created_at desc);

-- 3. TESTIMONIALS
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  role text not null check (char_length(role) between 1 and 120),
  company text not null default '',
  quote text not null check (char_length(quote) between 10 and 1500),
  avatar_url text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4. NEWSLETTER SUBSCRIBERS
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 3 and 254),
  created_at timestamptz not null default now()
);

-- 5. PAGE VIEWS (privacy-friendly, no personal identifiers)
create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null check (char_length(path) between 1 and 300),
  referrer text default '',
  country text default '',
  device text default 'desktop',
  created_at timestamptz not null default now()
);

create index if not exists idx_page_views_created on public.page_views (created_at desc);

-- 6. SITE SETTINGS
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table public.projects enable row level security;
alter table public.contact_messages enable row level security;
alter table public.testimonials enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.page_views enable row level security;
alter table public.site_settings enable row level security;

-- Projects policies
drop policy if exists "Public can view published projects" on public.projects;
create policy "Public can view published projects"
  on public.projects for select
  using (published = true or public.is_ojas_admin());

drop policy if exists "Admin full access on projects" on public.projects;
create policy "Admin full access on projects"
  on public.projects for all
  using (public.is_ojas_admin())
  with check (public.is_ojas_admin());

-- Contact messages policies
drop policy if exists "Public can submit contact messages" on public.contact_messages;
create policy "Public can submit contact messages"
  on public.contact_messages for insert
  with check (
    status = 'new'
    and char_length(name) > 0
    and char_length(email) > 2
    and char_length(message) >= 10
  );

drop policy if exists "Admin full access on contact_messages" on public.contact_messages;
create policy "Admin full access on contact_messages"
  on public.contact_messages for all
  using (public.is_ojas_admin())
  with check (public.is_ojas_admin());

-- Testimonials policies
drop policy if exists "Public can view approved testimonials" on public.testimonials;
create policy "Public can view approved testimonials"
  on public.testimonials for select
  using (approved = true or public.is_ojas_admin());

drop policy if exists "Public can submit testimonials for moderation" on public.testimonials;
create policy "Public can submit testimonials for moderation"
  on public.testimonials for insert
  with check (
    approved = false
    and char_length(name) > 0
    and char_length(quote) >= 10
  );

drop policy if exists "Admin full access on testimonials" on public.testimonials;
create policy "Admin full access on testimonials"
  on public.testimonials for all
  using (public.is_ojas_admin())
  with check (public.is_ojas_admin());

-- Newsletter policies
drop policy if exists "Public can subscribe to newsletter" on public.newsletter_subscribers;
create policy "Public can subscribe to newsletter"
  on public.newsletter_subscribers for insert
  with check (char_length(email) between 3 and 254);

drop policy if exists "Admin full access on newsletter_subscribers" on public.newsletter_subscribers;
create policy "Admin full access on newsletter_subscribers"
  on public.newsletter_subscribers for all
  using (public.is_ojas_admin())
  with check (public.is_ojas_admin());

-- Page views policies
drop policy if exists "Public can log privacy-friendly page views" on public.page_views;
create policy "Public can log privacy-friendly page views"
  on public.page_views for insert
  with check (char_length(path) between 1 and 300);

drop policy if exists "Admin can read page views" on public.page_views;
create policy "Admin can read page views"
  on public.page_views for select
  using (public.is_ojas_admin());

-- Site settings policies
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
  on public.site_settings for select
  using (true);

drop policy if exists "Admin full access on site_settings" on public.site_settings;
create policy "Admin full access on site_settings"
  on public.site_settings for all
  using (public.is_ojas_admin())
  with check (public.is_ojas_admin());

-- ============================================================================
-- STORAGE BUCKET: project-images (public read, admin upload, 5MB, images only)
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images',
  'project-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

drop policy if exists "Public read project images" on storage.objects;
create policy "Public read project images"
  on storage.objects for select
  using (bucket_id = 'project-images');

drop policy if exists "Admin upload project images" on storage.objects;
create policy "Admin upload project images"
  on storage.objects for insert
  with check (bucket_id = 'project-images' and public.is_ojas_admin());

drop policy if exists "Admin update project images" on storage.objects;
create policy "Admin update project images"
  on storage.objects for update
  using (bucket_id = 'project-images' and public.is_ojas_admin());

drop policy if exists "Admin delete project images" on storage.objects;
create policy "Admin delete project images"
  on storage.objects for delete
  using (bucket_id = 'project-images' and public.is_ojas_admin());

-- ============================================================================
-- SEED DATA
-- ============================================================================
insert into public.projects (
  title,
  slug,
  description,
  long_description,
  live_url,
  github_url,
  thumbnail_url,
  images,
  tech_stack,
  category,
  year,
  featured,
  sort_order,
  published
)
values
  (
    'Nutstridinida',
    'nutstridinida',
    'A website designed and developed by Ojas Awasthi.',
    null,
    'https://nutstridinida.vercel.app',
    null,
    null,
    '{}',
    '{}',
    'Web',
    '2026',
    true,
    1,
    true
  ),
  (
    'The Vaxn Store',
    'the-vaxn-store',
    'Menswear e-commerce brand offering shirts, tees, and thrifted pieces without high retail markups.',
    'Started with two friends because luxury clothing felt gatekept behind high prices. Built around dropshipping and curated thrifted luxury pieces, I ran The Vaxn Store solo across SEO, hosting, and promotions, growing it into thousands of sales with customers across regions. Closed by choice in April 2024 when warehouse space could not keep up and supplier quality slipped: "I''d rather close it myself than watch it turn into something I''m not proud of."',
    null,
    null,
    null,
    '{}',
    array['SEO', 'Hosting', 'Dropshipping', 'Promotions'],
    'E-commerce',
    '2020–2024',
    true,
    2,
    true
  )
on conflict (slug) do nothing;

insert into public.site_settings (key, value)
values
  (
    'availability',
    '{"enabled": true, "text": "Available for projects"}'::jsonb
  ),
  (
    'hero',
    '{"headline": "Web developer & digital strategist building fast, beautiful websites that grow brands."}'::jsonb
  )
on conflict (key) do nothing;
