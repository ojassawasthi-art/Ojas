import {useEffect} from 'react';
import {siteContent} from '../content/site';
import {getCanonicalBaseUrl} from '../lib/seo';

interface SeoHeadProps {
  title?: string;
  description?: string;
  path?: string;
  schemas?: Record<string, unknown>[];
  noIndex?: boolean;
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function SeoHead({
  title = siteContent.seo.defaultTitle,
  description = siteContent.seo.defaultDescription,
  path = '/',
  schemas = [],
  noIndex = false,
}: SeoHeadProps) {
  useEffect(() => {
    const baseUrl = getCanonicalBaseUrl();
    const canonicalUrl = `${baseUrl}${path === '/' ? '' : path}`;

    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);

    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    let hreflangLink = document.querySelector('link[rel="alternate"][hreflang="en-IN"]');
    if (!hreflangLink) {
      hreflangLink = document.createElement('link');
      hreflangLink.setAttribute('rel', 'alternate');
      hreflangLink.setAttribute('hreflang', 'en-IN');
      document.head.appendChild(hreflangLink);
    }
    hreflangLink.setAttribute('href', canonicalUrl);

    // Replace dynamic JSON-LD nodes
    const existingScripts = document.querySelectorAll('script[data-oa-jsonld="true"]');
    existingScripts.forEach((node) => node.remove());

    schemas.forEach((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-oa-jsonld', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });
  }, [title, description, path, schemas, noIndex]);

  return null;
}
