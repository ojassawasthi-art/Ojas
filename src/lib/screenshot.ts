export function isSafeHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isSafeImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('..')) {
    return /^\/[a-zA-Z0-9._~!$&'()*+,;=:@/-]+$/.test(trimmed);
  }
  return isSafeHttpUrl(trimmed);
}

export function getMicrolinkScreenshotUrl(liveUrl: string): string {
  return `https://api.microlink.io/?url=${encodeURIComponent(
    liveUrl,
  )}&screenshot=true&meta=false&embed=screenshot.url`;
}

export function getProjectThumbnailUrl(
  thumbnailUrl: string | null | undefined,
  liveUrl: string | null | undefined,
): string | null {
  if (thumbnailUrl && isSafeImageUrl(thumbnailUrl)) {
    return thumbnailUrl.trim();
  }
  if (liveUrl && isSafeHttpUrl(liveUrl)) {
    return getMicrolinkScreenshotUrl(liveUrl.trim());
  }
  return null;
}

export function extractDomain(url: string | null | undefined): string {
  if (!url || !isSafeHttpUrl(url)) return '';
  try {
    return new URL(url.trim()).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
