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
   Copy `.env.example` to `.env` (for local development) and add the same variables in Vercel:
   - `VITE_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — never expose to the browser)
   - `RESEND_API_KEY` (from [resend.com](https://resend.com))
   - `ADMIN_EMAIL=ojassawasthi@gmail.com`
   - `VITE_ADMIN_EMAIL=ojassawasthi@gmail.com`
   - `NEXT_PUBLIC_SITE_URL` & `VITE_SITE_URL` (e.g. `https://ojasawasthi.com`)
   - `VITE_GA_MEASUREMENT_ID` (optional GA4 ID)

   *Note: If Supabase keys are missing, the site still builds and runs cleanly using the seed content in `src/content/site.ts`, and forms fall back cleanly to direct email contact.*

4. **Run locally**
   ```bash
   npm run dev
   ```

---

## 2. Vercel Deployment Steps

The project includes `vercel.json` and Vercel serverless functions inside `/api` (`/api/projects`, `/api/contact`, `/api/newsletter`, `/api/testimonials`, `/api/settings`, `/api/analytics`, `/api/robots`, `/api/sitemap`, and `/api/admin/*`), with rewrites for `/robots.txt`, `/sitemap.xml`, and SPA client routes.

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. Import the repository into [Vercel](https://vercel.com) (Framework Preset: **Vite**, Build Command: `npm run build`, Output Directory: `dist`).
3. Add all environment variables from `.env.example` in **Project Settings → Environment Variables**.
4. Connect your custom domain (for example `ojasawasthi.com`) under **Project Settings → Domains** and enable HTTPS redirect.

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
