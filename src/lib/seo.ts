import {siteContent} from '../content/site';
import type {BlogPost, Project} from '../types/database';

export function getCanonicalBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return siteContent.seo.siteUrl;
}

export function buildPersonSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteContent.profile.name,
    alternateName: siteContent.profile.alternateName,
    jobTitle: 'Web Developer, Digital Marketer & Published Author',
    description: siteContent.profile.siteHeadline,
    url: baseUrl,
    image: `${baseUrl}${siteContent.profile.photoPath}`,
    email: `mailto:${siteContent.contact.email}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: siteContent.profile.city,
      addressRegion: siteContent.profile.region,
      addressCountry: siteContent.profile.country,
    },
    alumniOf: [
      {
        '@type': 'CollegeOrUniversity',
        name: 'University of Lucknow',
      },
      {
        '@type': 'HighSchool',
        name: "St. Xavier's High School, India",
      },
    ],
    knowsAbout: [
      ...siteContent.skillsMarquee,
      ...siteContent.profile.interests,
    ],
    knowsLanguage: siteContent.profile.languages.map((lang) => lang.name),
    sameAs: siteContent.contact.socials
      .filter((s) => s.url.startsWith('http'))
      .map((s) => s.url),
  };
}

export function buildWebSiteSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: `${siteContent.profile.name} — Web Developer & Digital Strategist`,
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
    name: `${siteContent.profile.name} — Web Development & Digital Strategy`,
    url: baseUrl,
    areaServed: {
      '@type': 'City',
      name: 'Lucknow',
    },
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
  return siteContent.books.map((book) => ({
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
    url: book.buyUrl || book.links[0]?.url || `${baseUrl}/books`,
    sameAs: book.links.map((l) => l.url),
  }));
}

export function buildProjectSchema(project: Project, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.description,
    url: project.live_url || `${baseUrl}/work/${project.slug}`,
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
      item: `${baseUrl}${item.path}`,
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
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: {
      '@type': 'Person',
      name: siteContent.profile.name,
      url: baseUrl,
    },
    mainEntityOfPage: `${baseUrl}/blog/${post.slug}`,
  };
}
