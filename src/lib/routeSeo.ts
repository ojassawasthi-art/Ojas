import {siteContent} from '../content/site';
import type {Project} from '../types/database';

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
    ...siteContent.contact.socials
      .filter((s) => s.url.startsWith('http'))
      .map((s) => s.url),
    ...siteContent.profile.authorProfiles,
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteContent.profile.name,
    alternateName: ['Ojas', 'ओजस अवस्थी', 'Ojas Awasthy'],
    jobTitle: 'Web Developer, Digital Marketer & Published Author',
    description: siteContent.profile.siteHeadline,
    url: baseUrl,
    image: `${baseUrl}${siteContent.profile.photoPath}`,
    email: `mailto:${siteContent.contact.email}`,
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
      name: siteContent.profile.fatherName,
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
    name: `${siteContent.profile.name} — Web Developer & Author`,
    alternateName: ['Ojas Awasthi', 'ओजस अवस्थी', 'Ojas Awasthy'],
    url: baseUrl,
    inLanguage: 'en-IN',
    author: {
      '@type': 'Person',
      name: siteContent.profile.name,
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
    name: `${siteContent.profile.name} — Web Development & Digital Marketing`,
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
      name: siteContent.profile.name,
    },
    serviceType: siteContent.services.map((s) => s.title),
  };
}

export function getBookSchemas(baseUrl: string) {
  return siteContent.books.map((book) => {
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
    mainEntity: siteContent.faqs.map((faq) => ({
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
    <span>Official website of ${escapeHtml(siteContent.profile.name)} · ${escapeHtml(siteContent.profile.location)}</span>
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

  // 1. HOME (/)
  if (route === '/') {
    return {
      statusCode: 200,
      title: 'Ojas Awasthi | Web Developer, Digital Marketer & Author in Lucknow',
      description:
        'Ojas Awasthi is a web developer, digital marketer, published author, and B.Com student in Lucknow, India, building fast websites and growing digital brands.',
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
          <h1>${escapeHtml(siteContent.profile.name)}</h1>
          <p>${escapeHtml(siteContent.profile.siteHeadline)}</p>
          <p>${escapeHtml(siteContent.profile.linkedinHeadline)}</p>
          <p>${escapeHtml(siteContent.profile.location)}</p>
        </section>
        <section>
          <h2>Selected Work</h2>
          <ul>
            ${publishedProjects
              .map(
                (p) =>
                  `<li><a href="/work/${escapeHtml(p.slug)}">${escapeHtml(p.title)}</a> — ${escapeHtml(p.description)}</li>`,
              )
              .join('')}
          </ul>
        </section>
        <section>
          <h2>About</h2>
          ${siteContent.profile.bioParagraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
        </section>
        <section>
          <h2>Published Books</h2>
          <ul>
            ${siteContent.books
              .map(
                (b) =>
                  `<li><strong>${escapeHtml(b.title)}</strong> (${escapeHtml(b.publisher)}) — ${escapeHtml(b.description)}</li>`,
              )
              .join('')}
          </ul>
        </section>
        <section>
          <h2>Certifications</h2>
          <ul>
            ${siteContent.certifications
              .map(
                (c) =>
                  `<li>${escapeHtml(c.title)} — ${escapeHtml(c.issuer)} (${escapeHtml(c.issued)})</li>`,
              )
              .join('')}
          </ul>
        </section>
        ${
          (
            globalThis as {
              process?: {env?: Record<string, string | undefined>};
            }
          ).process?.env?.VITE_NEWSLETTER_URL?.trim()
            ? '<section><h2>Get new posts by email</h2><p>Occasional emails on web development, digital marketing and psychology. Unsubscribe anytime.</p></section>'
            : ''
        }
      `),
    };
  }

  // 2. ABOUT (/about)
  if (route === '/about') {
    const fatherLine = siteContent.profile.showFatherOnPage
      ? `<p>Son of ${escapeHtml(siteContent.profile.fatherName)}.</p>`
      : '';
    return {
      statusCode: 200,
      title: 'About Ojas Awasthi | Lucknow, University of Lucknow, CS Aspirant',
      description:
        "Biography of Ojas Awasthi in Lucknow: St. Xavier's High School Gonda, University of Lucknow B.Com, CS exam preparation, The Vaxn Store, books, and web builds.",
      canonical: `${cleanUrl}/about`,
      ogImage: defaultOgImage,
      noIndex: false,
      schemas: [
        getPersonSchema(cleanUrl),
        getFaqSchema(),
        getBreadcrumbSchema(
          [
            {name: 'Home', path: '/'},
            {name: 'About', path: '/about'},
          ],
          cleanUrl,
        ),
      ],
      bodyHtml: renderShell(`
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>About</span></nav>
        <h1>Who is Ojas Awasthi?</h1>
        <p>${escapeHtml(siteContent.profile.siteHeadline)} (<span lang="hi">${escapeHtml(siteContent.profile.hindiName)}</span>)</p>
        ${siteContent.profile.bioParagraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
        <section><h2>School (St. Xavier&apos;s High School, Gonda)</h2><p>Completed Grade 12 at St. Xavier&apos;s High School, Gonda (Apr 2017 to Mar 2026).</p></section>
        <section><h2>University of Lucknow</h2><p>Studying B.Com (Accounting &amp; Finance and E-commerce) at the University of Lucknow (Aug 2026 to present).</p></section>
        <section><h2>Company Secretary (CS) Preparation</h2><p>Ojas Awasthi is a Company Secretary (CS) aspirant preparing for the CS examinations alongside his undergraduate commerce degree. He is preparing for the exams and not yet a qualified CS.</p></section>
        <section><h2>Web Development</h2><p>Freelance web developer in Lucknow building fast websites with React, Next.js, Tailwind CSS, and Supabase.</p></section>
        <section><h2>Digital Marketing and SEO</h2><p>Inbound digital marketing and technical SEO grounded in HubSpot Academy training and direct brand operations.</p></section>
        <section><h2>Books and Writing</h2><p>Published Mastering the Art of Manipulation: Psychology behind Manipulation on Amazon Kindle (Mar 27, 2026) and The Echoes of Love on Amazon and Google Play Books.</p></section>
        <section><h2>Certifications</h2><ul>${siteContent.certifications.map((c) => `<li>${escapeHtml(c.title)} — ${escapeHtml(c.issuer)} (${escapeHtml(c.issued)})</li>`).join('')}</ul></section>
        <section><h2>The Vaxn Store</h2><p>Founded VAXN Fashion / The Vaxn Store (Sep 2020 to Apr 2024), managing SEO, hosting, and promotions solo for thousands of menswear sales before closing by choice to protect quality.</p></section>
        <section><h2>Languages</h2><ul>${siteContent.profile.languages.map((l) => `<li>${escapeHtml(l.name)} — ${escapeHtml(l.proficiency)}</li>`).join('')}</ul></section>
        <section><h2>Contact</h2><p>Email <a href="mailto:${escapeHtml(siteContent.contact.email)}">${escapeHtml(siteContent.contact.email)}</a> or visit <a href="/contact">Contact Ojas Awasthi</a>.</p></section>
        <section><h2>Common Questions</h2><dl>${siteContent.faqs.map((f) => `<dt${f.lang ? ` lang="${escapeHtml(f.lang)}"` : ''}>${escapeHtml(f.question)}</dt><dd${f.lang ? ` lang="${escapeHtml(f.lang)}"` : ''}>${escapeHtml(f.answer)}</dd>`).join('')}</dl></section>
        ${fatherLine}
      `),
    };
  }

  // 3. EDUCATION (/education)
  if (route === '/education') {
    return {
      statusCode: 200,
      title: "Ojas Awasthi Education | St. Xavier's Gonda & University of Lucknow",
      description:
        "Education and certifications of Ojas Awasthi: St. Xavier's High School Gonda, B.Com at University of Lucknow, CS preparation, HubSpot, HP LIFE, and NISM.",
      canonical: `${cleanUrl}/education`,
      ogImage: defaultOgImage,
      noIndex: false,
      schemas: [
        getPersonSchema(cleanUrl),
        getBreadcrumbSchema(
          [
            {name: 'Home', path: '/'},
            {name: 'Education', path: '/education'},
          ],
          cleanUrl,
        ),
      ],
      bodyHtml: renderShell(`
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Education</span></nav>
        <h1>Education &amp; Certifications</h1>
        <section>
          <h2>Academic Background</h2>
          <ul>${siteContent.education.map((e) => `<li><strong>${escapeHtml(e.institution)}</strong> — ${escapeHtml(e.degree)} (${escapeHtml(e.period)}): ${escapeHtml(e.details)}</li>`).join('')}</ul>
        </section>
        <section>
          <h2>Company Secretary (CS) Aspirant</h2>
          <p>Preparing for the Company Secretary (CS) examinations alongside B.Com at the University of Lucknow, focusing on corporate governance, corporate law, and finance.</p>
        </section>
        <section>
          <h2>Certifications</h2>
          <ul>${siteContent.certifications.map((c) => `<li>${escapeHtml(c.title)} — ${escapeHtml(c.issuer)} (${escapeHtml(c.issued)})${c.credentialId ? ` · Credential ID: ${escapeHtml(c.credentialId)}` : ''}</li>`).join('')}</ul>
        </section>
      `),
    };
  }

  // 4. SERVICES (/services)
  if (route === '/services') {
    return {
      statusCode: 200,
      title: 'Web Development & Digital Marketing in Lucknow | Ojas Awasthi',
      description:
        'Freelance web design and development, technical SEO, digital marketing, and e-commerce setup by Ojas Awasthi in Lucknow using React, Next.js, and Supabase.',
      canonical: `${cleanUrl}/services`,
      ogImage: defaultOgImage,
      noIndex: false,
      schemas: [
        getProfessionalServiceSchema(cleanUrl),
        getBreadcrumbSchema(
          [
            {name: 'Home', path: '/'},
            {name: 'Services', path: '/services'},
          ],
          cleanUrl,
        ),
      ],
      bodyHtml: renderShell(`
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Services</span></nav>
        <h1>Web Development &amp; Digital Marketing Services in Lucknow</h1>
        <p>Freelance website builds, technical search optimization, inbound digital marketing, and lean e-commerce setups by Ojas Awasthi in Lucknow, Uttar Pradesh.</p>
        <ul>${siteContent.services.map((s) => `<li><strong>${escapeHtml(s.title)}</strong>: ${escapeHtml(s.description)}</li>`).join('')}</ul>
        <p><a href="/work">View selected web projects</a> · <a href="/contact">Get in touch</a></p>
      `),
    };
  }

  // 5. WORK (/work)
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
        <h1>Web Development Projects by ${escapeHtml(siteContent.profile.name)}</h1>
        <p>Websites and e-commerce projects designed, built, and operated by ${escapeHtml(siteContent.profile.name)} in Lucknow, India.</p>
        <ul>
          ${publishedProjects
            .map(
              (p) =>
                `<li><a href="/work/${escapeHtml(p.slug)}">${escapeHtml(p.title)}</a> (${escapeHtml(p.category)}, ${escapeHtml(p.year)}) — ${escapeHtml(p.description)}</li>`,
            )
            .join('')}
        </ul>
      `),
    };
  }

  // 6. PROJECT DETAIL (/work/[slug])
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
    const title = `${project.title} | Case Study by ${siteContent.profile.name}`;
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
            name: siteContent.profile.name,
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

  // 7. BOOKS (/books)
  if (route === '/books') {
    return {
      statusCode: 200,
      title:
        'Books by Ojas Awasthi | Mastering the Art of Manipulation & The Echoes of Love',
      description:
        'Published books by Ojas Awasthi: Mastering the Art of Manipulation on Amazon Kindle and The Echoes of Love on Amazon and Google Play Books, written in India.',
      canonical: `${cleanUrl}/books`,
      ogImage: defaultOgImage,
      noIndex: false,
      schemas: [
        ...getBookSchemas(cleanUrl),
        getBreadcrumbSchema(
          [
            {name: 'Home', path: '/'},
            {name: 'Books', path: '/books'},
          ],
          cleanUrl,
        ),
      ],
      bodyHtml: renderShell(`
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Books</span></nav>
        <h1>Books by ${escapeHtml(siteContent.profile.name)}</h1>
        ${siteContent.books
          .map(
            (b) => `<article>
              <h2>${escapeHtml(b.title)}</h2>
              <p>${escapeHtml(b.publisher)}${b.publishedDate ? ` · ${escapeHtml(b.publishedDate)}` : ''}</p>
              <p>${escapeHtml(b.description)}</p>
              <p>${b.links.map((l) => `<a href="${escapeHtml(l.url)}" rel="noopener noreferrer">${escapeHtml(l.label)}</a>`).join(' · ')}</p>
            </article>`,
          )
          .join('')}
        <section>
          <h2>About the author</h2>
          <p>${escapeHtml(siteContent.pressKit.bio50)} <a href="/about">Read full profile</a>.</p>
        </section>
      `),
    };
  }

  // 8. BLOG (/blog)
  if (route === '/blog') {
    return {
      statusCode: 200,
      title: 'Articles by Ojas Awasthi | Web Development & Digital Strategy',
      description:
        'Factual articles by Ojas Awasthi in Lucknow on web development speed, inbound marketing, The Vaxn Store, University of Lucknow, CS study, and published books.',
      canonical: `${cleanUrl}/blog`,
      ogImage: defaultOgImage,
      noIndex: false,
      schemas: [
        getBreadcrumbSchema(
          [
            {name: 'Home', path: '/'},
            {name: 'Articles', path: '/blog'},
          ],
          cleanUrl,
        ),
      ],
      bodyHtml: renderShell(`
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Articles</span></nav>
        <h1>Articles by ${escapeHtml(siteContent.profile.name)}</h1>
        <ul>
          ${siteContent.blogPosts
            .map(
              (post) =>
                `<li><a href="/blog/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a> — ${escapeHtml(post.description)}</li>`,
            )
            .join('')}
        </ul>
      `),
    };
  }

  // 9. BLOG POST (/blog/[slug])
  if (route.startsWith('/blog/')) {
    const slug = route.slice('/blog/'.length);
    const post = siteContent.blogPosts.find((p) => p.slug === slug);
    if (!post) {
      return buildPageSeoData('/404', cleanUrl, projects);
    }

    const description = fitDescription(post.description);
    return {
      statusCode: 200,
      title: `${post.title} | ${siteContent.profile.name}`,
      description,
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
            name: siteContent.profile.name,
            url: cleanUrl,
          },
          publisher: {
            '@type': 'Person',
            name: siteContent.profile.name,
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

  // 10. PRESS KIT (/press-kit)
  if (route === '/press-kit') {
    return {
      statusCode: 200,
      title: 'Press Kit | Ojas Awasthi',
      description:
        'Official press kit for Ojas Awasthi: verified 50, 100, and 200 word biographies, portrait download, book cover artwork, and social links from Lucknow, India.',
      canonical: `${cleanUrl}/press-kit`,
      ogImage: defaultOgImage,
      noIndex: false,
      schemas: [
        getPersonSchema(cleanUrl),
        getBreadcrumbSchema(
          [
            {name: 'Home', path: '/'},
            {name: 'Press Kit', path: '/press-kit'},
          ],
          cleanUrl,
        ),
      ],
      bodyHtml: renderShell(`
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Press Kit</span></nav>
        <h1>Press Kit — ${escapeHtml(siteContent.profile.name)}</h1>
        <section><h2>50-word bio</h2><p>${escapeHtml(siteContent.pressKit.bio50)}</p></section>
        <section><h2>100-word bio</h2><p>${escapeHtml(siteContent.pressKit.bio100)}</p></section>
        <section><h2>200-word bio</h2><p>${escapeHtml(siteContent.pressKit.bio200)}</p></section>
      `),
    };
  }

  // 11. LINKS (/links)
  if (route === '/links') {
    return {
      statusCode: 200,
      title: 'Links | Ojas Awasthi',
      description:
        'Official links directory for Ojas Awasthi in Lucknow: portfolio website, LinkedIn, Instagram, Telegram, email, published books, and verified certificates.',
      canonical: `${cleanUrl}/links`,
      ogImage: defaultOgImage,
      noIndex: false,
      schemas: [
        getPersonSchema(cleanUrl),
        getBreadcrumbSchema(
          [
            {name: 'Home', path: '/'},
            {name: 'Links', path: '/links'},
          ],
          cleanUrl,
        ),
      ],
      bodyHtml: renderShell(`
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Links</span></nav>
        <h1>Links — ${escapeHtml(siteContent.profile.name)}</h1>
        <p>${escapeHtml(siteContent.profile.siteHeadline)}</p>
        <ul>
          ${siteContent.contact.socials.map((s) => `<li><a href="${escapeHtml(s.url)}">${escapeHtml(s.name)}: ${escapeHtml(s.handle)}</a></li>`).join('')}
        </ul>
      `),
    };
  }

  // 12. CONTACT (/contact)
  if (route === '/contact') {
    return {
      statusCode: 200,
      title: 'Contact Ojas Awasthi | Web Developer in Lucknow',
      description:
        'Contact Ojas Awasthi in Lucknow, Uttar Pradesh via ojassawasthi@gmail.com, LinkedIn, Instagram, or Telegram for web development, SEO, and digital marketing.',
      canonical: `${cleanUrl}/contact`,
      ogImage: defaultOgImage,
      noIndex: false,
      schemas: [
        getBreadcrumbSchema(
          [
            {name: 'Home', path: '/'},
            {name: 'Contact', path: '/contact'},
          ],
          cleanUrl,
        ),
      ],
      bodyHtml: renderShell(`
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Contact</span></nav>
        <h1>Contact ${escapeHtml(siteContent.profile.name)}</h1>
        <p>Based in ${escapeHtml(siteContent.profile.location)}. Email: <a href="mailto:${escapeHtml(siteContent.contact.email)}">${escapeHtml(siteContent.contact.email)}</a></p>
        <ul>${siteContent.contact.socials.map((s) => `<li><a href="${escapeHtml(s.url)}">${escapeHtml(s.name)}: ${escapeHtml(s.handle)}</a></li>`).join('')}</ul>
      `),
    };
  }

  // 13. PRIVACY (/privacy)
  if (route === '/privacy') {
    return {
      statusCode: 200,
      title: `Privacy Policy | ${siteContent.profile.name}`,
      description:
        "Privacy policy for Ojas Awasthi's website: newsletter email signups are handled by beehiiv, readers can unsubscribe from any email, and no data is sold.",
      canonical: `${cleanUrl}/privacy`,
      ogImage: defaultOgImage,
      noIndex: false,
      schemas: [
        getBreadcrumbSchema(
          [
            {name: 'Home', path: '/'},
            {name: 'Privacy Policy', path: '/privacy'},
          ],
          cleanUrl,
        ),
      ],
      bodyHtml: renderShell(`
        <nav aria-label="Breadcrumb"><a href="/">Home</a> / <span>Privacy Policy</span></nav>
        <h1>Privacy Policy</h1>
        <p>Email signups for ${escapeHtml(siteContent.profile.name)}&apos;s newsletter are handled directly by beehiiv.</p>
        <p>Readers can unsubscribe from any email at any time using the unsubscribe link in every issue, or by emailing <a href="mailto:${escapeHtml(siteContent.contact.email)}">${escapeHtml(siteContent.contact.email)}</a>.</p>
        <p>No email addresses or personal details are ever sold or shared with third-party marketers.</p>
      `),
    };
  }

  // 14. ADMIN (/admin) — noindex, nofollow
  if (route === '/admin') {
    return {
      statusCode: 200,
      title: `Admin | ${siteContent.profile.name}`,
      description: 'Private administration workspace.',
      canonical: `${cleanUrl}/admin`,
      ogImage: defaultOgImage,
      noIndex: true,
      schemas: [],
      bodyHtml: renderShell('<h1>Admin</h1>'),
    };
  }

  // 14. 404 NOT FOUND
  return {
    statusCode: 404,
    title: `Page Not Found | ${siteContent.profile.name}`,
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

  // Strip any previously injected JSON-LD tags and insert route-specific ones
  out = out.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/g, '');
  out = out.replace(
    '<!-- SEO_HEAD_LINKS -->',
    jsonLdScripts || '<!-- SEO_HEAD_LINKS -->',
  );

  // Inject static crawler HTML inside <div id="root"> cleanly and idempotently
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
