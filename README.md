# Ojas Awasthi — Personal Brand & Developer Portfolio

Personal portfolio website for **Ojas Awasthi** (Web Developer, Digital Marketer, Published Author & Commerce Student in Lucknow, India), backed by Supabase PostgreSQL, Supabase Auth, Supabase Storage, Resend email notifications, and technical SEO.

---

## 1. Setup & Supabase Configuration

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com) and create a new project.
   - Open **SQL Editor** and run `supabase/migrations/001_initial_schema.sql` and `supabase/migrations/002_chat_tables.sql`. This creates:
     - Tables: `projects`, `contact_messages`, `testimonials`, `newsletter_subscribers`, `page_views`, `site_settings`, `chat_logs`, `chat_rate_limits`
     - Strict Row Level Security (RLS) policies on every table
     - Public `project-images` storage bucket (5 MB limit, image MIME types only, admin upload)
     - Initial seed rows (`Nutstridinida`, `The Vaxn Store`, `availability`, `hero`)
   - In **Authentication → URL Configuration**, add your production domain and `http://localhost:3000/admin` to **Redirect URLs** so magic links work smoothly.

3. **Configure environment variables**
   Copy `.env.example` to `.env` for local development (`.env` is gitignored).
   *Note: If Supabase keys are missing, the site still builds and runs cleanly using the seed content in `src/content/site.ts`, and forms fall back cleanly to direct email contact.*

4. **Run locally**
   ```bash
   # Full-stack local dev (Vite + Express API)
   npm run dev

   # Frontend SPA only (without Express server)
   npm run dev:spa
   ```

---

## Deploy on Vercel

This project is built for Vercel's **Hobby (free)** plan:
- **Build & Output**: Uses `vercel.json` (`framework: "vite"`, `buildCommand: "npm run build"`, `outputDirectory: "dist"`). Running `npm run build` compiles Vite and pre-renders static routes (`/`, `/about`, `/education`, `/books`, `/services`, `/work`, `/blog`, all `/blog/<slug>` articles, `/press-kit`, `/links`, `/contact`, `/admin`, `/404`) into HTML with full `<head>` metadata and crawler-visible content.
- **Single Serverless Function**: All routes (`/api/projects`, `/api/chat`, `/api/contact`, `/api/newsletter`, `/api/testimonials`, `/api/settings`, `/api/analytics`, `/sitemap.xml`, `/api/admin/*`, plus dynamic `/work/[slug]` SSR metadata and HTTP 404 handling) are merged into one serverless handler (`api/index.ts`) via `vercel.json` rewrites, keeping the deployment well under Vercel Hobby's 12-function limit. Static files (`robots.txt`, `llms.txt`, `favicon.*`, `images/*`) are served directly without hitting serverless functions.
- **TypeScript Isolation**: `api/tsconfig.json` uses `"types": ["node"]` with zero Vite references, while `src/tsconfig.json` keeps `"types": ["vite/client"]`.

### Environment Variables to Set in Vercel
Go to **Vercel → Project Settings → Environment Variables** and add:

**Frontend variables (safe for browser bundle):**
- `VITE_SUPABASE_URL` — Your Supabase Project URL (`https://<ref>.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` — Your Supabase `anon` public key
- `VITE_ADMIN_EMAIL` — `ojassawasthi@gmail.com`
- `VITE_SITE_URL` — `https://ojasawasthii.vercel.app` (or your custom domain)
- `VITE_GOOGLE_SITE_VERIFICATION` — *(Optional)* Google Search Console HTML meta verification token; leave empty to omit
- `VITE_GA_MEASUREMENT_ID` — *(Optional)* Google Analytics 4 ID (`G-...`); leave empty to skip GA4

**Server-only variables (`/api` serverless functions only):**
- `SUPABASE_SERVICE_ROLE_KEY` — Your Supabase `service_role` secret key (never prefix with `VITE_`)
- `ADMIN_EMAIL` — `ojassawasthi@gmail.com`
- `RESEND_API_KEY` — *(Optional)* Your Resend API key (`re_...`); leave empty to skip email sending without crashing
- `GEMINI_API_KEY` — *(Optional)* Google Gemini API key for the "Ask about Ojas" assistant (`POST /api/chat`); if omitted, the UI displays an offline email fallback
- `GEMINI_MODEL` — *(Optional)* Gemini model name (defaults to `gemini-4-hydrogen`)

### Deployment Steps
1. Push the repository (including `package-lock.json`, without `.env` or `bun.lock`) to GitHub, GitLab, or Bitbucket.
2. Import the repository into [Vercel](https://vercel.com) (Framework Preset: **Vite**).
3. Add the environment variables above and deploy.
4. Add your production URL and `/admin` path to **Supabase → Authentication → URL Configuration → Redirect URLs**.
5. Connect your custom domain (e.g. `ojasawasthi.com`) under **Project Settings → Domains**.

---

## 3. Off-Site SEO & Indexing Checklist

1. **Verify Google Search Console & Submit Sitemap**:
   - Confirm ownership using the existing `<meta name="google-site-verification" ... />` tag on `/`.
   - Submit `https://ojasawasthii.vercel.app/sitemap.xml` inside **Indexing → Sitemaps**.
   - Use **URL Inspection → Request Indexing** for `/`, `/about`, `/education`, `/services`, `/work`, `/books`, `/blog`, `/press-kit`, `/links`, `/contact`, and key articles/projects.
2. **Import Into Bing Webmaster Tools**:
   - Sign in to Bing Webmaster Tools, import the verified site directly from Google Search Console, and verify `/sitemap.xml` is ingested cleanly.
3. **Name, Bio & Photo Consistency Across Platforms**:
   - Keep **Ojas Awasthi**, the Lucknow, Uttar Pradesh, India location, your `/images/ojas.jpg` portrait, and a consistent factual headline aligned across:
     - LinkedIn (`https://www.linkedin.com/in/ojassawasthi`)
     - Instagram (`https://www.instagram.com/_ojas0001_`)
     - Telegram (`https://t.me/ojasawasthiiii`)
     - Amazon Author Central & Google Play Books author profiles (add those URLs to `authorProfiles` in `src/content/site.ts` and `api/_lib/site-data.ts` once claimed so `sameAs` JSON-LD includes them automatically).
4. **Developer & Writing Profiles Linking Back to Canonical Domain**:
   - Add your canonical portfolio URL (`https://ojasawasthii.vercel.app`) to GitHub, Medium, Quora, Behance, and Peerlist profiles to reinforce entity resolution.
5. **Google Business Profile (Local Freelance Visibility)**:
   - Register a Google Business Profile for freelance web development in **Lucknow, Uttar Pradesh, India**, linking directly to `/services` and `/contact`.
6. **Custom Domain Upgrade (When Ready)**:
   - Connect a personal domain (e.g., `ojasawasthi.com`) in Vercel Domains.
   - Update `VITE_SITE_URL` / `NEXT_PUBLIC_SITE_URL`, `siteContent.seo.siteUrl`, `public/robots.txt`, `public/llms.txt`, and Supabase **Authentication → URL Configuration** (`Site URL` and `Redirect URLs`).

---

## 4. How to Edit Content Later

- **Profile copy, books, credentials, experience, skills, blog posts**: Edit `src/content/site.ts` (and mirror updates into `api/_lib/site-data.ts`).
- **Swap your portrait photo**: Place your portrait file at `public/images/ojas.jpg` (recommended 4:5 aspect ratio). The `"OA"` monogram frame will automatically switch to your photo, and `/press-kit` and `Person` JSON-LD will reference it cleanly.
- **Add or update projects, messages, testimonials, and availability**: Visit `/admin`, sign in with your `ojassawasthi@gmail.com` magic link, and manage projects (including thumbnail uploads and drag-to-reorder), inbox statuses, testimonial approvals, and the Hero availability badge. New published projects automatically appear in `/work`, on `/`, and in `/sitemap.xml`.
