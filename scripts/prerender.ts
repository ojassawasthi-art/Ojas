import 'dotenv/config';
import {createClient} from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import {LOCAL_SEO_PAGES} from '../src/content/localSeoPages';
import {siteContent} from '../src/content/site';
import {buildPageSeoData, injectSeoIntoHtml} from '../src/lib/routeSeo';
import type {Project} from '../src/types/database';

const distDir = path.resolve(process.cwd(), 'dist');
const templatePath = path.join(distDir, 'index.html');

function resolveBaseUrl(): string {
  const configured = (
    process.env.VITE_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    siteContent.seo.siteUrl
  ).trim();
  return configured.replace(/\/+$/, '');
}

async function loadProjectsForPrerender(): Promise<Project[]> {
  const supabaseUrl = (
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  )
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');

  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (supabaseUrl && supabaseKey) {
    try {
      const client = createClient(supabaseUrl, supabaseKey, {
        auth: {persistSession: false, autoRefreshToken: false},
      });
      const result = await Promise.race([
        client
          .from('projects')
          .select('*')
          .eq('published', true)
          .order('sort_order', {ascending: true})
          .order('created_at', {ascending: false}),
        new Promise<{data: null; error: Error}>((resolve) =>
          setTimeout(() => resolve({data: null, error: new Error('timeout')}), 4000),
        ),
      ]);

      if (!result.error && Array.isArray(result.data) && result.data.length > 0) {
        return result.data as Project[];
      }
    } catch {
      // Fall back cleanly to static seed projects when offline or unconfigured
    }
  }

  return siteContent.fallbackProjects.filter((p) => p.published);
}

async function run() {
  if (!fs.existsSync(templatePath)) {
    throw new Error('dist/index.html not found. Run vite build first.');
  }

  const rawTemplate = fs.readFileSync(templatePath, 'utf-8');
  const baseUrl = resolveBaseUrl();
  const projects = await loadProjectsForPrerender();

  // Save a clean template copy for dynamic /api/index.ts SSR if needed,
  // while keeping SSR_BODY markers inside dist/index.html as well.
  const staticRoutes: {route: string; outFile: string}[] = [
    {route: '/', outFile: path.join(distDir, 'index.html')},
    {route: '/about', outFile: path.join(distDir, 'about', 'index.html')},
    {route: '/education', outFile: path.join(distDir, 'education', 'index.html')},
    {route: '/books', outFile: path.join(distDir, 'books', 'index.html')},
    {route: '/services', outFile: path.join(distDir, 'services', 'index.html')},
    ...LOCAL_SEO_PAGES.map((page) => ({
      route: page.path,
      outFile: path.join(distDir, page.path.replace(/^\//, ''), 'index.html'),
    })),
    {route: '/work', outFile: path.join(distDir, 'work', 'index.html')},
    {route: '/blog', outFile: path.join(distDir, 'blog', 'index.html')},
    ...siteContent.blogPosts.map((post) => ({
      route: `/blog/${post.slug}`,
      outFile: path.join(distDir, 'blog', post.slug, 'index.html'),
    })),
    {route: '/press-kit', outFile: path.join(distDir, 'press-kit', 'index.html')},
    {route: '/links', outFile: path.join(distDir, 'links', 'index.html')},
    {route: '/contact', outFile: path.join(distDir, 'contact', 'index.html')},
    {route: '/privacy', outFile: path.join(distDir, 'privacy', 'index.html')},
    {route: '/admin', outFile: path.join(distDir, 'admin', 'index.html')},
    {route: '/404', outFile: path.join(distDir, '404.html')},
  ];

  for (const item of staticRoutes) {
    const seo = buildPageSeoData(item.route, baseUrl, projects);
    const html = injectSeoIntoHtml(rawTemplate, seo);
    fs.mkdirSync(path.dirname(item.outFile), {recursive: true});
    fs.writeFileSync(item.outFile, html, 'utf-8');
  }

  console.log(
    `[prerender] Generated ${staticRoutes.length} static SEO HTML pages (baseUrl=${baseUrl}, projects=${projects.length})`,
  );
}

run().catch((err) => {
  console.error('[prerender] Failed:', err);
  process.exit(1);
});
