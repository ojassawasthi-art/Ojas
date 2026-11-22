import type {FaqItem} from './site';

export type LocalSeoSlug =
  | '/web-developer-lucknow'
  | '/website-developer-gonda'
  | '/seo-lucknow-gonda'
  | '/digital-marketing-lucknow-gonda';

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export interface ServiceDeliverable {
  title: string;
  description: string;
}

export interface LocalSeoPageData {
  path: LocalSeoSlug;
  navLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  h1: string;
  introParagraphs: string[];
  portraitAlt: string;
  portraitCaption: string;
  whatIDoHeading: string;
  whatIDoIntro: string;
  deliverables: ServiceDeliverable[];
  contextHeading: string;
  contextParagraphs: string[];
  processHeading: string;
  processIntro: string;
  process: ProcessStep[];
  projectsHeading: string;
  projectsIntro: string;
  faqs: FaqItem[];
  serviceName: string;
  serviceTypes: string[];
  areaServed: string[];
  ctaHeading: string;
  ctaCopy: string;
}

export const LOCAL_SEO_PAGES: LocalSeoPageData[] = [
  {
    path: '/web-developer-lucknow',
    navLabel: 'Web Developer Lucknow',
    eyebrow: 'Lucknow, Uttar Pradesh · Freelance Web Development',
    title: 'Web Developer in Lucknow | Ojas Awasthi',
    description:
      'Freelance web developer in Lucknow, Uttar Pradesh. Ojas Awasthi designs and builds fast React, Next.js, Tailwind CSS, and Supabase websites for businesses.',
    h1: 'Freelance Web Developer in Lucknow',
    introParagraphs: [
      'I am Ojas Awasthi, a freelance web developer based in Lucknow, Uttar Pradesh, India. I design and build fast, reliable websites for small businesses, independent founders, local brands, and professionals who want a clear online presence without heavy templates or slow page loads.',
      'Living and studying in Lucknow while pursuing my B.Com in Accounting & Finance and E-commerce at the University of Lucknow, I work directly with clients from first conversation through deployment. You speak directly with the person writing the code, structuring the pages, and setting up hosting—there is no middle layer or handoff to unfamiliar contractors.',
      'Before focusing on freelance builds, I founded and operated The Vaxn Store from September 2020 to April 2024, running its hosting, catalog pages, search structure, and promotions solo through thousands of menswear orders. That firsthand retail experience shapes every site I build in Lucknow today: speed, readability on mobile data connections, and straightforward paths to contact or buy matter far more than decorative clutter.',
    ],
    portraitAlt:
      'Ojas Awasthi, freelance web developer based in Lucknow, Uttar Pradesh',
    portraitCaption: 'Based in Lucknow · Direct freelance collaboration',
    whatIDoHeading: 'What I build for Lucknow businesses and founders',
    whatIDoIntro:
      'Every project is built with modern, maintainable web tools—primarily React, Next.js, Tailwind CSS, TypeScript, and Supabase—hosted cleanly on Vercel or your preferred domain setup.',
    deliverables: [
      {
        title: 'Custom business & portfolio websites',
        description:
          'Clean, responsive sites built around clear typography, logical page hierarchy, and fast mobile rendering so visitors in Lucknow and across India understand what you offer within seconds.',
      },
      {
        title: 'E-commerce storefronts & catalogs',
        description:
          'Lean product showcases and storefront setups informed by four years of running The Vaxn Store. Product cards, category filters, and inquiry or checkout flows stay lightweight and easy to maintain.',
      },
      {
        title: 'Database-backed admin panels',
        description:
          'Private Supabase-powered dashboards with Row Level Security and magic-link sign-in so you can update projects, announcements, or listings yourself without touching source code.',
      },
      {
        title: 'Technical foundations & hosting setup',
        description:
          'Custom domain configuration, SSL certificates, image optimization, pre-rendered HTML for search crawlers, and clean contact forms with spam protection and rate limiting.',
      },
    ],
    contextHeading: 'Why clean engineering matters for local websites in Lucknow',
    contextParagraphs: [
      'Many business websites across Lucknow rely on bloated drag-and-drop themes packed with dozens of unused plugins. On a mid-range smartphone over mobile data, those sites stall for several seconds, shift layout while loading, and bury the phone number or inquiry form underneath heavy sliders. Visitors leave before reading a single paragraph.',
      'Building lean code with React, Tailwind CSS, and pre-rendered HTML avoids that friction. Pages stay lightweight, text remains sharp in both light and dark viewing conditions, headings follow a clean semantic structure, and images load lazily with explicit dimensions so the screen never jumps. Paired with Supabase for dynamic content and Vercel for global edge delivery, hosting costs stay predictable while uptime stays dependable.',
    ],
    processHeading: 'How a website project moves from idea to launch',
    processIntro:
      'A clear four-step workflow keeps timelines honest and avoids surprises at launch.',
    process: [
      {
        number: '01',
        title: 'Discover',
        description:
          'We discuss your business goals, target audience in Lucknow or beyond, required pages, and existing assets via email or call. I write down a plain scope with clear deliverables and timeline before writing code.',
      },
      {
        number: '02',
        title: 'Design',
        description:
          'I map out the page structure, typography, mobile layout, and content hierarchy so every page has one clear purpose—whether booking a consultation, showcasing products, or collecting inquiries.',
      },
      {
        number: '03',
        title: 'Build',
        description:
          'I develop the frontend and any Supabase database tables or serverless form routes, sharing a live preview link as sections come together so you can test on your own phone and laptop.',
      },
      {
        number: '04',
        title: 'Launch',
        description:
          'After checking mobile responsiveness, metadata, canonical URLs, sitemap generation, and form delivery, I connect your custom domain, verify SSL, and hand over full access to your site and admin console.',
      },
    ],
    projectsHeading: 'Selected web development work',
    projectsIntro:
      'Real projects designed, developed, and operated—ranging from live brand websites to database-backed storefronts.',
    faqs: [
      {
        question: 'Where in Lucknow does Ojas Awasthi work from?',
        answer:
          'Ojas Awasthi is based in Lucknow, Uttar Pradesh, India, where he studies B.Com at the University of Lucknow and works as an independent freelance web developer. Client discussions take place via email, phone, video call, or scheduled meetings in Lucknow when helpful.',
      },
      {
        question: 'What technologies do you use to build websites?',
        answer:
          'I build primarily with React, Next.js, TypeScript, Tailwind CSS, Supabase (PostgreSQL, authentication, and storage), and Vercel. This stack keeps websites fast, secure, and straightforward to update.',
      },
      {
        question: 'Can you connect my custom domain and handle hosting?',
        answer:
          'Yes. I help configure DNS records, connect custom domains, enable HTTPS/SSL, and deploy the site so it loads reliably on both desktop and mobile networks.',
      },
      {
        question: 'Will I be able to edit my projects or content after launch?',
        answer:
          'Yes. When a project needs ongoing updates, I can include a private Supabase-authenticated admin panel so you can add or edit entries without needing to edit code.',
      },
      {
        question: 'How do I start a website project in Lucknow?',
        answer:
          'Send a short note about what you need through the contact page or email ojassawasthi@gmail.com with your goals, timeline, and any reference links. I reply directly with practical next steps.',
      },
    ],
    serviceName: 'Ojas Awasthi — Web Development in Lucknow',
    serviceTypes: [
      'Web Design & Development',
      'Frontend Development',
      'E-Commerce Storefront Setup',
      'Supabase Web Applications',
    ],
    areaServed: ['Lucknow', 'Gonda'],
    ctaHeading: 'Need a fast website built in Lucknow?',
    ctaCopy:
      'Share a brief outline of your business, timeline, and goals. I will reply directly with an honest plan and scope.',
  },
  {
    path: '/website-developer-gonda',
    navLabel: 'Website Developer Gonda',
    eyebrow: 'Gonda, Uttar Pradesh · Remote From Lucknow',
    title: 'Website Developer for Gonda (Remote) | Ojas Awasthi',
    description:
      'Freelance website developer serving Gonda businesses remotely from Lucknow. Ojas Awasthi builds fast, mobile-ready React and Supabase websites with clear SEO.',
    h1: 'Website Developer for Gonda Businesses (Remote From Lucknow)',
    introParagraphs: [
      'If you run a shop, clinic, coaching center, service business, or growing brand in Gonda, Uttar Pradesh and need a modern website, I can help build and launch it cleanly. All development, communication, and support is done remotely from Lucknow, keeping overhead low while staying closely connected to Gonda.',
      'Gonda is where I spent my school years—I attended St. Xavier\'s High School, Gonda from April 2017 to March 2026 before moving to Lucknow for my B.Com in Accounting & Finance and E-commerce at the University of Lucknow. Knowing the local business rhythm in Gonda makes it much easier to write clear copy, organize practical contact options, and build sites that work well for real customers in the district.',
      'Every website is developed remotely from Lucknow using live preview URLs, phone or video calls, and direct messaging so you can inspect progress on your phone at every stage before anything goes live.',
    ],
    portraitAlt:
      'Ojas Awasthi, website developer serving Gonda remotely from Lucknow',
    portraitCaption:
      'Work delivered remotely from Lucknow · St. Xavier\'s High School, Gonda alumnus',
    whatIDoHeading: 'What remote website development covers for Gonda clients',
    whatIDoIntro:
      'Because the entire build happens remotely from Lucknow, we keep communication simple and transparent—focused on practical websites that load quickly on mobile networks across Gonda and eastern Uttar Pradesh.',
    deliverables: [
      {
        title: 'Local business & service websites',
        description:
          'Structured multi-page or focused single-site builds for Gonda retailers, educators, clinics, and professionals—putting services, timings, contact links, and clear directions front and center.',
      },
      {
        title: 'Mobile-first speed & readability',
        description:
          'Most customers in Gonda browse on Android phones over 4G or variable mobile data. I build lightweight React and Tailwind CSS layouts with compressed assets so pages open smoothly without stalling.',
      },
      {
        title: 'Product catalogs & e-commerce setup',
        description:
          'Online catalogs and storefront setups shaped by my four years running The Vaxn Store solo across hosting, search, and promotions—giving local merchants a practical online channel.',
      },
      {
        title: 'Search-ready page structure',
        description:
          'Clean URLs, unique titles and meta descriptions, XML sitemaps, and valid Schema.org markup built right into the website so customers searching from Gonda can actually find your pages.',
      },
    ],
    contextHeading: 'How remote collaboration from Lucknow works smoothly',
    contextParagraphs: [
      'Working remotely does not mean disappearing behind tickets or vague timelines. From Lucknow, I share staging links throughout the build so you can open your upcoming website on your own phone in Gonda, tap every button, read every paragraph, and ask for adjustments in plain Hindi or English.',
      'There are no studio markups or unnecessary monthly retainers. You own your domain, your content, and your deployment accounts. Whether you need a first website for an established Gonda business or a cleaner rebuild of an outdated page, remote delivery keeps the process focused on working software rather than endless meetings.',
    ],
    processHeading: 'Remote four-step process from Lucknow to Gonda',
    processIntro:
      'Simple checkpoints make remote collaboration predictable from day one.',
    process: [
      {
        number: '01',
        title: 'Discover',
        description:
          'We connect by email, Telegram, or call to review your Gonda business, customer questions, required pages, and any photos or brochure text you already have.',
      },
      {
        number: '02',
        title: 'Design',
        description:
          'I outline the page layout, navigation, mobile structure, and factual copy hierarchy so visitors can understand your services and reach you without hunting through menus.',
      },
      {
        number: '03',
        title: 'Build',
        description:
          'I code the website in React, Tailwind CSS, and Supabase (when dynamic content is needed) and send a private live link from Lucknow so you can review every page on mobile and desktop.',
      },
      {
        number: '04',
        title: 'Launch',
        description:
          'Once approved, I connect your domain, configure HTTPS, verify your contact form and Google indexing files (robots.txt and sitemap.xml), and walk you through managing updates.',
      },
    ],
    projectsHeading: 'Real websites and digital projects',
    projectsIntro:
      'Examples of web builds and e-commerce work from my portfolio that show the structure and restraint I bring to remote client projects.',
    faqs: [
      {
        question: 'Are you physically located in Gonda or do you work remotely?',
        answer:
          'I am currently based in Lucknow, Uttar Pradesh and complete all website development for Gonda clients remotely from Lucknow. I completed my schooling through Grade 12 at St. Xavier\'s High School, Gonda (2017–2026), so I understand the local context well.',
      },
      {
        question: 'How do we communicate during a remote website build?',
        answer:
          'We communicate directly over email (ojassawasthi@gmail.com), Telegram, or scheduled phone and video calls. I share live preview links during the build so you can review progress directly on your phone.',
      },
      {
        question: 'What kinds of Gonda businesses can benefit from a website?',
        answer:
          'Local retailers, coaching institutes, clinics, pharmacies, service providers, wholesalers, and independent creators in Gonda all benefit from a fast, mobile-friendly site that answers common questions and makes contacting them effortless.',
      },
      {
        question: 'Will my website work well on slower mobile connections?',
        answer:
          'Yes. I avoid heavy themes and unnecessary scripts, use pre-rendered HTML and lightweight CSS, and size images properly so pages load cleanly on everyday mobile connections.',
      },
      {
        question: 'Do you also help with domain setup and basic SEO for Gonda searches?',
        answer:
          'Yes. Every website build includes clean page titles, factual meta descriptions, canonical links, sitemap setup, and custom domain configuration so search engines can index your site accurately.',
      },
    ],
    serviceName: 'Ojas Awasthi — Remote Website Development for Gonda',
    serviceTypes: [
      'Remote Website Development',
      'Small Business Websites',
      'Mobile-Friendly Web Design',
      'E-Commerce Storefront Setup',
    ],
    areaServed: ['Gonda', 'Lucknow'],
    ctaHeading: 'Planning a website for your Gonda business?',
    ctaCopy:
      'Send a short message with what your business does and what you want the site to achieve. All work is handled directly and remotely from Lucknow.',
  },
  {
    path: '/seo-lucknow-gonda',
    navLabel: 'SEO Lucknow & Gonda',
    eyebrow: 'Lucknow & Gonda · Technical & Local SEO',
    title: 'SEO Services in Lucknow & Gonda | Ojas Awasthi',
    description:
      'Technical and local SEO for Lucknow and Gonda websites by Ojas Awasthi: clean HTML, pre-rendered metadata, structured data, sitemaps, and search visibility.',
    h1: 'Technical & Local SEO for Lucknow and Gonda Websites',
    introParagraphs: [
      'Good search visibility starts with honest structure, not gimmicks. I am Ojas Awasthi, a web developer and digital marketer in Lucknow offering practical technical SEO and local search structure for businesses in Lucknow and Gonda (with Gonda projects handled remotely from Lucknow).',
      'My approach to SEO comes from building and running real websites rather than recycling generic checklists. While operating The Vaxn Store solo from September 2020 to April 2024, organic search was a core driver alongside hosting and promotions. Later, completing HubSpot Academy\'s Digital Marketing certification (April 2026) and HP LIFE\'s Data Science and Analytics course (July 2026) gave formal structure to how I audit search intent, crawlability, and page performance.',
      'I never use hidden text, keyword stuffing, fake reviews, or spammy backlink schemes. Instead, I fix the real technical and content signals that help Google and other search engines understand who you are, what you offer, and which cities you serve.',
    ],
    portraitAlt:
      'Ojas Awasthi, technical and local SEO specialist working with Lucknow and Gonda sites',
    portraitCaption:
      'Clean technical SEO · No spam tactics, hidden text, or fake signals',
    whatIDoHeading: 'What technical & local SEO work includes',
    whatIDoIntro:
      'Search engines reward websites that are easy to crawl, clear to read, and genuinely helpful to visitors. Here is what I focus on when auditing or building SEO for Lucknow and Gonda sites.',
    deliverables: [
      {
        title: 'Crawlability, pre-rendering & site architecture',
        description:
          'Ensuring JavaScript-heavy sites (such as React and Vite builds) deliver real pre-rendered HTML with clean URLs, proper HTTP 200/404 status codes, robots.txt rules, and dynamic XML sitemaps.',
      },
      {
        title: 'On-page metadata & semantic headings',
        description:
          'Writing unique, factual page titles, 150–160 character meta descriptions, canonical links, descriptive image alt text, and clear single-H1 heading structures across every indexable route.',
      },
      {
        title: 'Schema.org JSON-LD structured data',
        description:
          'Adding clean, accurate JSON-LD markup—such as ProfessionalService, Person, FAQPage, BreadcrumbList, and CreativeWork—strictly matching visible on-page facts with zero fabricated ratings.',
      },
      {
        title: 'Local search alignment & Search Console setup',
        description:
          'Organizing clear service pages for Lucknow and Gonda audiences, connecting internal links naturally across your site, submitting sitemaps in Google Search Console, and tracking real impressions.',
      },
    ],
    contextHeading: 'Why technical foundations decide local rankings',
    contextParagraphs: [
      'Many local websites across Lucknow and Gonda fail to appear for their own services for straightforward technical reasons: duplicate page titles, missing canonical tags, unindexed single-page React routes that look blank to crawlers, oversized images that hurt Core Web Vitals, or thin pages copied word-for-word with only the city name swapped.',
      'Fixing those fundamentals creates durable progress. When each page answers real customer questions in natural language, loads fast on mobile, declares accurate structured data, and connects logically through internal links, search engines have clear evidence to index and surface your site—without risking algorithm penalties from shortcuts.',
    ],
    processHeading: 'Four-step SEO workflow',
    processIntro:
      'Structured technical cleanup paired with honest, useful page content.',
    process: [
      {
        number: '01',
        title: 'Discover',
        description:
          'I review your current site, Google Search Console status, crawl errors, page speed, heading structure, and the factual searches your Lucknow or Gonda customers actually make.',
      },
      {
        number: '02',
        title: 'Design',
        description:
          'I plan a clean URL map, internal linking structure, page-by-page metadata, and structured data blueprint so every service and location page has a clear, non-duplicate role.',
      },
      {
        number: '03',
        title: 'Build',
        description:
          'I implement pre-rendering or semantic HTML fixes, canonical tags, JSON-LD scripts, descriptive image alt attributes, dynamic sitemap.xml updates, and fast asset loading directly in code.',
      },
      {
        number: '04',
        title: 'Launch',
        description:
          'After validating builds and structured data, I submit the updated sitemap in Search Console, request indexing for priority URLs, and share a clear summary of what was fixed and what to monitor next.',
      },
    ],
    projectsHeading: 'SEO & web builds in practice',
    projectsIntro:
      'Real projects where technical SEO, clean HTML architecture, and fast hosting work together.',
    faqs: [
      {
        question: 'Do you guarantee a #1 ranking on Google?',
        answer:
          'No—and you should be cautious of anyone who does. Google\'s ranking systems consider many factors outside any single developer\'s control. What I do guarantee is clean technical SEO, honest structured data, fast pages, and factual content that gives your site a strong, compliant foundation.',
      },
      {
        question: 'Can you fix SEO on an existing React or Vite website?',
        answer:
          'Yes. Single-page React and Vite websites often hide content behind client-side JavaScript. I implement build-time pre-rendering, per-route metadata, canonical URLs, dynamic sitemaps, and JSON-LD so crawlers see complete HTML immediately.',
      },
      {
        question: 'How do you handle SEO for both Lucknow and Gonda without duplicate content?',
        answer:
          'Each service and city page is written independently around real local details—such as working directly in Lucknow versus serving Gonda remotely from Lucknow—rather than duplicating identical paragraphs with swapped city names.',
      },
      {
        question: 'Do you use hidden keywords or paid backlink packages?',
        answer:
          'Never. Hidden text, keyword stuffing, fake reviews, and link farms hurt trust and violate search engine guidelines. Every optimization I make is visible, factual, and maintainable.',
      },
      {
        question: 'How long does technical SEO take to show results?',
        answer:
          'Technical fixes like indexing, sitemaps, and pre-rendered metadata are usually noticed by search engines within days to a few weeks after submission in Google Search Console, while broader organic visibility builds steadily over months as content and brand signals mature.',
      },
    ],
    serviceName: 'Ojas Awasthi — Technical & Local SEO for Lucknow and Gonda',
    serviceTypes: [
      'Technical SEO',
      'Local Search Engine Optimization',
      'Schema.org Structured Data',
      'Pre-Rendering & Crawlability Optimization',
    ],
    areaServed: ['Lucknow', 'Gonda'],
    ctaHeading: 'Want a cleaner SEO foundation for your website?',
    ctaCopy:
      'Share your website URL and goals in Lucknow or Gonda. I will review the technical basics and reply with honest, practical recommendations.',
  },
  {
    path: '/digital-marketing-lucknow-gonda',
    navLabel: 'Digital Marketing Lucknow & Gonda',
    eyebrow: 'Lucknow & Gonda · Inbound Digital Marketing',
    title: 'Digital Marketing in Lucknow & Gonda | Ojas Awasthi',
    description:
      'HubSpot-certified digital marketing for Lucknow and Gonda brands by Ojas Awasthi: inbound strategy, content structure, analytics, and practical promotions.',
    h1: 'Digital Marketing for Lucknow and Gonda Brands',
    introParagraphs: [
      'Digital marketing works when your website, search presence, messaging, and promotions pull in the same direction. I am Ojas Awasthi—a HubSpot-certified digital marketer, web developer, and B.Com student based in Lucknow, working with businesses and creators across Lucknow and remotely for Gonda.',
      'Between September 2020 and April 2024, I founded and operated VAXN Fashion / The Vaxn Store solo across SEO, hosting, and promotions, growing the menswear brand into thousands of sales. That hands-on cycle of testing offers, watching how real buyers respond, and improving conversion paths taught me to value practical outcomes over vanity metrics.',
      'To back operational experience with structured methodology, I earned my Digital Marketing certification from HubSpot Academy (April 2026) and Data Science and Analytics certification from HP LIFE (July 2026), alongside studying human psychology and consumer decision-making—themes I also explored in my book Mastering the Art of Manipulation: Psychology behind Manipulation.',
    ],
    portraitAlt:
      'Ojas Awasthi, HubSpot-certified digital marketer serving Lucknow and Gonda',
    portraitCaption:
      'HubSpot Academy Digital Marketing & HP LIFE Analytics certified',
    whatIDoHeading: 'What I focus on in digital marketing',
    whatIDoIntro:
      'Rather than chasing short-lived noise, I help independent businesses in Lucknow and Gonda build inbound channels that compound alongside a fast, credible website.',
    deliverables: [
      {
        title: 'Inbound marketing & content structure',
        description:
          'Organizing service pages, helpful articles, and clear brand positioning around the actual questions your audience asks—applying HubSpot inbound frameworks to attract visitors with genuine intent.',
      },
      {
        title: 'Landing pages & conversion clarity',
        description:
          'Because I also build websites directly in React and Tailwind CSS, messaging and page design stay tightly aligned: clear headlines, honest proof, low-friction inquiry forms, and fast load times.',
      },
      {
        title: 'Search visibility & organic promotions',
        description:
          'Pairing on-page SEO, structured data, newsletter capture, and consistent social profile alignment (LinkedIn, Instagram, Telegram) so people discovering your brand anywhere can verify and contact you easily.',
      },
      {
        title: 'Lightweight analytics & reporting',
        description:
          'Tracking real traffic patterns, top pages, and referral sources without bloated tracking scripts, grounded in analytical fundamentals from HP LIFE\'s Data Science and Analytics program.',
      },
    ],
    contextHeading: 'Connecting commerce, psychology, and honest positioning',
    contextParagraphs: [
      'A common mistake in regional digital marketing across Lucknow and Gonda is treating promotion as separate from the website and product experience. Spending time or money driving clicks to a confusing, slow page wastes attention and erodes buyer trust.',
      'My commerce background at the University of Lucknow (B.Com in Accounting & Finance and E-commerce) and years running The Vaxn Store keep marketing grounded in business reality. Clear writing, truthful claims, responsive pages, and simple next steps consistently outperform loud hype—because visitors quickly recognize when a brand respects their time.',
    ],
    processHeading: 'Four-step digital marketing process',
    processIntro:
      'Clear steps from understanding your audience to measuring what works.',
    process: [
      {
        number: '01',
        title: 'Discover',
        description:
          'We clarify your offer, typical customers in Lucknow or Gonda, current website and social channels, and what a meaningful inquiry or sale looks like for your business.',
      },
      {
        number: '02',
        title: 'Design',
        description:
          'I map an inbound plan covering key landing pages, core messaging, search topics, newsletter or contact pathways, and consistent cross-platform positioning.',
      },
      {
        number: '03',
        title: 'Build',
        description:
          'I build or refine the landing pages, on-page SEO, structured data, analytics hooks, and promotional copy so every touchpoint speaks clearly and loads fast.',
      },
      {
        number: '04',
        title: 'Launch',
        description:
          'Once live, we review page views, search indexing, and incoming inquiries to see which channels and messages bring real conversations—then iterate calmly on what works.',
      },
    ],
    projectsHeading: 'Brand, storefront, and web marketing work',
    projectsIntro:
      'Real projects combining web builds, organic search, and practical brand promotions.',
    faqs: [
      {
        question: 'What digital marketing credentials does Ojas Awasthi hold?',
        answer:
          'Ojas Awasthi holds the HubSpot Academy Digital Marketing certification (issued April 2026, valid through May 2027), the HP LIFE Data Science and Analytics certificate (July 2026), and practical experience running The Vaxn Store solo across SEO, hosting, and promotions from 2020 to 2024.',
      },
      {
        question: 'Do you work with small businesses in both Lucknow and Gonda?',
        answer:
          'Yes. I am based in Lucknow and collaborate directly with local founders and businesses in Lucknow as well as remotely with Gonda businesses via email, calls, and shared drafts.',
      },
      {
        question: 'How is working with an independent freelance marketer different?',
        answer:
          'You work directly with one person who handles both the marketing strategy and the underlying website code, SEO structure, and analytics—keeping communication straightforward and execution aligned.',
      },
      {
        question: 'Can you combine a website redesign with inbound marketing and SEO?',
        answer:
          'Yes. In fact, combining web development with technical SEO and inbound positioning usually produces cleaner results because page speed, copy hierarchy, and search metadata are built together from the start.',
      },
      {
        question: 'How do I discuss a digital marketing project?',
        answer:
          'Use the contact form or email ojassawasthi@gmail.com with a short overview of your business, current website or social links, and what you want to improve over the next few months.',
      },
    ],
    serviceName: 'Ojas Awasthi — Digital Marketing in Lucknow and Gonda',
    serviceTypes: [
      'Digital Marketing',
      'Inbound Marketing Strategy',
      'Content & Landing Page Optimization',
      'Analytics & Search Positioning',
    ],
    areaServed: ['Lucknow', 'Gonda'],
    ctaHeading: 'Looking for practical digital marketing in Lucknow or Gonda?',
    ctaCopy:
      'Send a brief note about your brand and current channels. I will reply with honest, actionable next steps.',
  },
];

export function getLocalSeoPage(pathname: string): LocalSeoPageData | undefined {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return LOCAL_SEO_PAGES.find((page) => page.path === clean);
}
