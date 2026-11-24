import {siteContent} from '../content/site';
import type {BlogPost, Project} from '../types/database';

export function getCanonicalBaseUrl(): string {
  const configured = import.meta.env?.VITE_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }
  return siteContent.seo.siteUrl.replace(/\/+$/, '');
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

export function buildPersonSchema(baseUrl: string) {
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
      addressLocality: siteContent.profile.city,
      addressRegion: siteContent.profile.region,
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
    knowsLanguage: siteContent.profile.languages.map((lang) => lang.name),
    sameAs,
  };
}

export function buildWebSiteSchema(baseUrl: string) {
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

export function buildProfilePageSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: buildPersonSchema(baseUrl),
    url: baseUrl,
  };
}

export function buildProfessionalServiceSchema(baseUrl: string) {
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

export function buildBookSchemas(baseUrl: string) {
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

export function buildProjectSchema(project: Project, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.description,
    url:
      project.live_url && /^https?:\/\//i.test(project.live_url.trim())
        ? project.live_url.trim()
        : `${baseUrl}/work/${project.slug}`,
    author: {
      '@type': 'Person',
      name: siteContent.profile.name,
      url: baseUrl,
    },
    dateCreated: project.year,
    keywords: project.tech_stack.join(', '),
  };
}

export function buildBreadcrumbSchema(
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

export function buildFaqSchema() {
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

export function buildArticleSchema(post: BlogPost, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: {
      '@type': 'Person',
      name: siteContent.profile.name,
      url: baseUrl,
    },
    publisher: {
      '@type': 'Person',
      name: siteContent.profile.name,
      url: baseUrl,
    },
    mainEntityOfPage: `${baseUrl}/blog/${post.slug}`,
  };
}
