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
   - Open **SQL Editor** and run the full contents of `supabase/migrations/001_initial_schema.sql`. This creates:
     - Tables: `projects`, `contact_messages`, `testimonials`, `newsletter_subscribers`, `page_views`, `site_settings`
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
- **Build & Output**: Uses `vercel.json` (`framework: "vite"`, `buildCommand: "npm run build"`, `outputDirectory: "dist"`).
- **Single Serverless Function**: All routes (`/api/projects`, `/api/contact`, `/api/newsletter`, `/api/testimonials`, `/api/settings`, `/api/analytics`, `/robots.txt`, `/sitemap.xml`, and `/api/admin/*`) are merged into one serverless handler (`api/index.ts`) via `vercel.json` rewrites, keeping the deployment well under Vercel Hobby's 12-function limit.
- **TypeScript Isolation**: `api/tsconfig.json` uses `"types": ["node"]` with zero Vite references, while `src/tsconfig.json` keeps `"types": ["vite/client"]`.

### Environment Variables to Set in Vercel
Go to **Vercel → Project Settings → Environment Variables** and add:

**Frontend variables (safe for browser bundle):**
- `VITE_SUPABASE_URL` — Your Supabase Project URL (`https://<ref>.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` — Your Supabase `anon` public key
- `VITE_ADMIN_EMAIL` — `ojassawasthi@gmail.com`
- `VITE_SITE_URL` — Your production URL (e.g. `https://ojasawasthi.com` or `https://your-app.vercel.app`)
- `VITE_GA_MEASUREMENT_ID` — *(Optional)* Google Analytics 4 ID (`G-...`); leave empty to skip GA4

**Server-only variables (`/api` serverless functions only):**
- `SUPABASE_SERVICE_ROLE_KEY` — Your Supabase `service_role` secret key (never prefix with `VITE_`)
- `ADMIN_EMAIL` — `ojassawasthi@gmail.com`
- `RESEND_API_KEY` — *(Optional)* Your Resend API key (`re_...`); leave empty to skip email sending without crashing

### Deployment Steps
1. Push the repository (including `package-lock.json`, without `.env` or `bun.lock`) to GitHub, GitLab, or Bitbucket.
2. Import the repository into [Vercel](https://vercel.com) (Framework Preset: **Vite**).
3. Add the environment variables above and deploy.
4. Add your production URL and `/admin` path to **Supabase → Authentication → URL Configuration → Redirect URLs**.
5. Connect your custom domain (e.g. `ojasawasthi.com`) under **Project Settings → Domains**.

---

## 3. SEO Launch Checklist

1. **Buy & connect a clean personal domain** (e.g., `ojasawasthi.com`) on Vercel and update `VITE_SITE_URL` / `NEXT_PUBLIC_SITE_URL`.
2. **Verify ownership in Google Search Console & Bing Webmaster Tools**, then submit `https://yourdomain.com/sitemap.xml`.
3. **Inspect key URLs** (`/`, `/work`, `/about`, `/books`, `/blog/who-is-ojas-awasthi`) in Search Console URL Inspection to confirm indexing and Schema.org rich results (`Person`, `Book`, `FAQPage`, `CreativeWork`, `BreadcrumbList`).
4. **Maintain Entity Consistency**: Keep the exact same name (**Ojas Awasthi**), bio summary, and portrait image across LinkedIn (`in/ojassawasthi`), Instagram (`@_ojas0001_`), Telegram (`@ojasawasthiiii`), Amazon Author Central, and Google Play Books.
5. **Cross-link everywhere**: Link your live portfolio URL from your LinkedIn profile, Instagram bio, Amazon author page, and GitHub profile so search engines connect every `sameAs` entity back to your canonical domain.
6. **Content & keyword strategy**: Ranking for just a single first name like `"Ojas"` is highly competitive across India. Focus first on `"Ojas Awasthi"`, `"Ojas Awasthi Lucknow"`, `"Ojas Awasthi web developer"`, `"Ojas Awasthi Vaxn"`, `"Mastering the Art of Manipulation author"`, and `"web developer in Lucknow"` via project case studies and short factual articles in `/blog`.

---

## 4. How to Edit Content Later

- **Profile copy, books, credentials, experience, skills, blog posts**: Edit `src/content/site.ts`. Every static section reads from that single file.
- **Swap your portrait photo**: Place your portrait file at `public/images/ojas.jpg` (recommended 4:5 aspect ratio). The `"OA"` monogram frame will automatically switch to your photo.
- **Add or update projects, messages, testimonials, and availability**: Visit `/admin`, sign in with your `ojassawasthi@gmail.com` magic link, and manage projects (including thumbnail uploads and drag-to-reorder), inbox statuses, testimonial approvals, and the Hero availability badge. New published projects automatically appear in `/work`, on `/`, and in `/sitemap.xml`.
