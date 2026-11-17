import {siteData, type Project} from './site-data.js';

export interface RouteSeoPayload {
  statusCode: 200 | 404;
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  noIndex: boolean;
  schemas: Record<string, unknown>[];
  bodyHtml: string;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fitDescription(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= 160) return clean;
  const sliced = clean.slice(0, 157);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 120 ? sliced.slice(0, lastSpace) : sliced).trimEnd()}...`;
}

const PERSON_KNOWS_ABOUT = [
  'Web Development',
  'React',
  'Next.js',
  'Tailwind CSS',
  'Supabase',
  'SEO',
  'Digital Marketing',
  'Corporate Governance',
  'Company Secretary Studies',
  'Securities Markets',
  'Human Psychology',
];

export function getPersonSchema(baseUrl: string) {
  const sameAs = [
    ...siteData.contact.socials
      .filter((s) => s.url.startsWith('http'))
      .map((s) => s.url),
    ...siteData.profile.authorProfiles,
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteData.profile.name,
    alternateName: ['Ojas', 'ओजस अवस्थी', 'Ojas Awasthy'],
    jobTitle: 'Web Developer, Digital Marketer & Published Author',
    description: siteData.profile.siteHeadline,
    url: baseUrl,
    image: `${baseUrl}${siteData.profile.photoPath}`,
    email: `mailto:${siteData.contact.email}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Lucknow',
      addressRegion: 'Uttar Pradesh',
      addressCountry: 'IN',
    },
    alumniOf: [
      {
        '@type': 'CollegeOrUniversity',
        name: 'University of Lucknow',
      },
      {
        '@type': 'HighSchool',
        name: "St. Xavier's High School, Gonda",
      },
    ],
    parent: {
      '@type': 'Person',
      name: siteData.profile.fatherName,
    },
    hasCredential: [
      {
        '@type': 'EducationalOccupationalCredential',
        name: 'Data Science and Analytics',
        credentialCategory: 'certificate',
        recognizedBy: {
          '@type': 'Organization',
          name: 'HP LIFE',
        },
        url: 'https://www.life-global.org/certificate/aac4e2bf-629f-454d-aae2-36d3f8e7b3ae',
      },
      {
        '@type': 'EducationalOccupationalCredential',
        name: 'Digital Marketing',
        credentialCategory: 'certificate',
        recognizedBy: {
          '@type': 'Organization',
          name: 'HubSpot Academy',
        },
        url: 'https://app-na2.hubspot.com/academy/achievements/5czcf8hb/en/1/ojas-awasthi/digital-marketing',
      },
      {
        '@type': 'EducationalOccupationalCredential',
        name: 'NISM Series XXI-A: Securities Market Foundation',
        credentialCategory: 'certificate',
        identifier: 'NISM20260000393507-001',
        recognizedBy: {
          '@type': 'Organization',
          name: 'National Institute of Securities Markets',
        },
      },
    ],
    knowsAbout: PERSON_KNOWS_ABOUT,
    knowsLanguage: ['English', 'French'],
    sameAs,
  };
}

export function getWebSiteSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: `${siteData.profile.name} — Web Developer & Author`,
    alternateName: ['Ojas Awasthi', 'ओजस अवस्थी', 'Ojas Awasthy'],
    url: baseUrl,
    inLanguage: 'en-IN',
    author: {
      '@type': 'Person',
      name: siteData.profile.name,
    },
  };
}

export function getProfilePageSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: baseUrl,
    mainEntity: getPersonSchema(baseUrl),
  };
}

export function getProfessionalServiceSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: `${siteData.profile.name} — Web Development & Digital Marketing`,
    url: `${baseUrl}/services`,
    areaServed: [
      {
        '@type': 'City',
        name: 'Lucknow',
      },
      {
        '@type': 'Country',
        name: 'India',
      },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Lucknow',
      addressRegion: 'Uttar Pradesh',
      addressCountry: 'IN',
    },
    founder: {
      '@type': 'Person',
      name: siteData.profile.name,
    },
    serviceType: siteData.services.map((s) => s.title),
  };
}

export function getBookSchemas(baseUrl: string) {
  return siteData.books.map((book) => {
    const resolvedUrl = book.buyUrl || book.links[0]?.url || `${baseUrl}/books`;
    return {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: book.subtitle ? `${book.title}: ${book.subtitle}` : book.title,
      author: {
        '@type': 'Person',
        name: book.author,
        url: baseUrl,
      },
      publisher: {
        '@type': 'Organization',
        name: book.publisher,
      },
      ...(book.publishedDate ? {datePublished: book.publishedDate} : {}),
      description: book.description,
      url: resolvedUrl,
      sameAs: book.links.map((l) => l.url),
      ...(book.buyUrl
        ? {
            offers: {
              '@type': 'Offer',
              availability: 'https://schema.org/InStock',
              url: book.buyUrl,
            },
          }
        : {}),
    };
  });
}

export function getFaqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: siteData.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function getBreadcrumbSchema(
  items: {name: string; path: string}[],
  baseUrl: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: `${baseUrl}${item.path === '/' ? '' : item.path}`,
    })),
  };
}

function renderShell(innerHtml: string): string {
  return `<div class="min-h-screen bg-[#FAFAF8] text-[#0A0A0A] dark:bg-[#0A0A0A] dark:text-[#F5F5F2]">
  <header class="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
    <a href="/">OA</a>
    <nav aria-label="Primary" class="flex flex-wrap gap-6 text-sm">
      <a href="/work">Work</a>
      <a href="/about">About</a>
      <a href="/education">Education</a>
      <a href="/services">Services</a>
      <a href="/books">Books</a>
      <a href="/blog">Articles</a>
      <a href="/contact">Contact</a>
    </nav>
  </header>
  <main id="main-content" class="mx-auto max-w-[1200px] px-6 py-16">
    ${innerHtml}
  </main>
  <footer class="mx-auto max-w-[1200px] border-t border-[#E8E8E4] px-6 py-8 text-xs">
    <span>Official website of ${escapeHtml(siteData.profile.name)} · ${escapeHtml(siteData.profile.location)}</span>
  </footer>
</div>`;
}

export function buildPageSeoData(
  rawPath: string,
  baseUrl: string,
  projects: Project[],
): RouteSeoPayload {
  const cleanUrl = baseUrl.replace(/\/+$/, '');
  const route = rawPath.split('?')[0].replace(/\/+$/, '') || '/';
  const defaultOgImage = `${cleanUrl}/og-image.png`;
  const publishedProjects = projects.filter((p) => p.published);

  if (route === '/') {
    return {
      statusCode: 200,
      title: siteData.seo.defaultTitle,
      description: siteData.seo.defaultDescription,
      canonical: cleanUrl,
      ogImage: defaultOgImage,
      noIndex: false,
      schemas: [
        getPersonSchema(cleanUrl),
        getWebSiteSchema(cleanUrl),
        getProfilePageSchema(cleanUrl),
        getProfessionalServiceSchema(cleanUrl),
        ...getBookSchemas(cleanUrl),
        getFaqSchema(),
      ],
      bodyHtml: renderShell(`
        <section>
          <h1>${escapeHtml(siteData.profile.name)}</h1>
          <p>${escapeHtml(siteData.profile.siteHeadline)}</p>
          <p>${escapeHtml(siteData.profile.linkedinHeadline)}</p>
          <p>${escapeHtml(siteData.profile.location)}</p>
        </section>
      `),
    };
  }

  if (route === '/work') {
    return {
      statusCode: 200,
      title: 'Web Development Projects by Ojas Awasthi',
      description:
        'Selected web development and e-commerce work by Ojas Awasthi in Lucknow, India, including Nutstridinida and The Vaxn Store case studies and live links.',
      canonical: `${cleanUrl}/work`,
      ogImage: defaultOgImage,
      noIndex: false,
      schemas: [
        getBreadcrumbSchema(
          [
            {name: 'Home', path: '/'},
            {name: 'Work', path: '/work'},
          ],
          cleanUrl,
        ),
      ],
      bodyHtml: renderShell(`
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Work</span></nav>
        <h1>Web Development Projects by ${escapeHtml(siteData.profile.name)}</h1>
        <ul>
          ${publishedProjects
            .map(
              (p) =>
                `<li><a href="/work/${escapeHtml(p.slug)}">${escapeHtml(p.title)}</a> — ${escapeHtml(p.description)}</li>`,
            )
            .join('')}
        </ul>
      `),
    };
  }

  if (route.startsWith('/work/')) {
    const slug = route.slice('/work/'.length);
    const project = publishedProjects.find((p) => p.slug === slug);
    if (!project) {
      return buildPageSeoData('/404', cleanUrl, projects);
    }

    const rawDesc =
      project.description.length >= 145
        ? project.description
        : `${project.title} — Case study and ${project.category.toLowerCase()} project (${project.year}) designed and developed by Ojas Awasthi in Lucknow, India. View overview and live link.`;
    const description = fitDescription(rawDesc);
    const title = `${project.title} | Case Study by ${siteData.profile.name}`;
    const ogImage = project.thumbnail_url || defaultOgImage;

    return {
      statusCode: 200,
      title,
      description,
      canonical: `${cleanUrl}/work/${project.slug}`,
      ogImage,
      noIndex: false,
      schemas: [
        {
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: project.title,
          description: project.description,
          url: project.live_url || `${cleanUrl}/work/${project.slug}`,
          author: {
            '@type': 'Person',
            name: siteData.profile.name,
            url: cleanUrl,
          },
          dateCreated: project.year,
          keywords: project.tech_stack.join(', '),
        },
        getBreadcrumbSchema(
          [
            {name: 'Home', path: '/'},
            {name: 'Work', path: '/work'},
            {name: project.title, path: `/work/${project.slug}`},
          ],
          cleanUrl,
        ),
      ],
      bodyHtml: renderShell(`
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/work">Work</a> / <span>${escapeHtml(project.title)}</span></nav>
        <h1>${escapeHtml(project.title)}</h1>
        <p>${escapeHtml(project.category)} · ${escapeHtml(project.year)}</p>
        <p>${escapeHtml(project.description)}</p>
        ${project.long_description ? `<p>${escapeHtml(project.long_description)}</p>` : ''}
        ${project.live_url ? `<p><a href="${escapeHtml(project.live_url)}" rel="noopener noreferrer">Visit live site</a></p>` : ''}
      `),
    };
  }

  if (route.startsWith('/blog/')) {
    const slug = route.slice('/blog/'.length);
    const post = siteData.blogPosts.find((p) => p.slug === slug);
    if (!post) {
      return buildPageSeoData('/404', cleanUrl, projects);
    }

    return {
      statusCode: 200,
      title: `${post.title} | ${siteData.profile.name}`,
      description: fitDescription(post.description),
      canonical: `${cleanUrl}/blog/${post.slug}`,
      ogImage: defaultOgImage,
      noIndex: false,
      schemas: [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.description,
          datePublished: post.publishedAt,
          author: {
            '@type': 'Person',
            name: siteData.profile.name,
            url: cleanUrl,
          },
          publisher: {
            '@type': 'Person',
            name: siteData.profile.name,
            url: cleanUrl,
          },
          mainEntityOfPage: `${cleanUrl}/blog/${post.slug}`,
        },
        getBreadcrumbSchema(
          [
            {name: 'Home', path: '/'},
            {name: 'Articles', path: '/blog'},
            {name: post.title, path: `/blog/${post.slug}`},
          ],
          cleanUrl,
        ),
      ],
      bodyHtml: renderShell(`
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/blog">Articles</a> / <span>${escapeHtml(post.title)}</span></nav>
        <article>
          <h1>${escapeHtml(post.title)}</h1>
          <p>${escapeHtml(post.description)}</p>
          ${post.sections
            .map(
              (s) =>
                `<section><h2>${escapeHtml(s.heading)}</h2>${s.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}</section>`,
            )
            .join('')}
        </article>
      `),
    };
  }

  return {
    statusCode: 404,
    title: `Page Not Found | ${siteData.profile.name}`,
    description: 'The requested page could not be found on Ojas Awasthi portfolio.',
    canonical: `${cleanUrl}/404`,
    ogImage: defaultOgImage,
    noIndex: true,
    schemas: [],
    bodyHtml: renderShell(`
      <h1>Page not found</h1>
      <p>The page you requested does not exist or has moved.</p>
      <p><a href="/">Return to Home</a></p>
    `),
  };
}

export function injectSeoIntoHtml(html: string, seo: RouteSeoPayload): string {
  const robotsValue = seo.noIndex ? 'noindex,nofollow' : 'index, follow';
  const jsonLdScripts = seo.schemas
    .map(
      (s) =>
        `<script type="application/ld+json" data-oa-jsonld="true">${JSON.stringify(s)}</script>`,
    )
    .join('\n    ');

  let out = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(seo.title)}</title>`)
    .replace(
      /<meta\s+name="description"[\s\S]*?\/>/,
      `<meta name="description" content="${escapeHtml(seo.description)}" />`,
    )
    .replace(
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/>/,
      `<meta name="robots" content="${robotsValue}" />`,
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
      `<link rel="canonical" href="${escapeHtml(seo.canonical)}" />`,
    )
    .replace(
      /<link\s+rel="alternate"\s+hreflang="en-IN"\s+href="[^"]*"\s*\/>/,
      `<link rel="alternate" hreflang="en-IN" href="${escapeHtml(seo.canonical)}" />`,
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:url" content="${escapeHtml(seo.canonical)}" />`,
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${escapeHtml(seo.title)}" />`,
    )
    .replace(
      /<meta\s+property="og:description"[\s\S]*?\/>/,
      `<meta property="og:description" content="${escapeHtml(seo.description)}" />`,
    )
    .replace(
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:image" content="${escapeHtml(seo.ogImage)}" />`,
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`,
    )
    .replace(
      /<meta\s+name="twitter:description"[\s\S]*?\/>/,
      `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`,
    )
    .replace(
      /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:image" content="${escapeHtml(seo.ogImage)}" />`,
    );

  out = out.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/g, '');
  out = out.replace(
    '<!-- SEO_HEAD_LINKS -->',
    jsonLdScripts || '<!-- SEO_HEAD_LINKS -->',
  );

  const ssrPattern = /<!-- SSR_BODY_START -->[\s\S]*?<!-- SSR_BODY_END -->/;
  if (ssrPattern.test(out)) {
    out = out.replace(
      ssrPattern,
      `<!-- SSR_BODY_START --><div id="root">${seo.bodyHtml}</div><!-- SSR_BODY_END -->`,
    );
  } else {
    out = out.replace(
      '<div id="root"></div>',
      `<div id="root">${seo.bodyHtml}</div>`,
    );
  }

  return out;
}
