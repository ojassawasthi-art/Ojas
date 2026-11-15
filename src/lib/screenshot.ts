export function getMicrolinkScreenshotUrl(liveUrl: string): string {
  return `https://api.microlink.io/?url=${encodeURIComponent(
    liveUrl,
  )}&screenshot=true&meta=false&embed=screenshot.url`;
}

export function getProjectThumbnailUrl(
  thumbnailUrl: string | null | undefined,
  liveUrl: string | null | undefined,
): string | null {
  if (thumbnailUrl && thumbnailUrl.trim().length > 0) {
    return thumbnailUrl;
  }
  if (liveUrl && liveUrl.trim().length > 0) {
    return getMicrolinkScreenshotUrl(liveUrl);
  }
  return null;
}

export function extractDomain(url: string | null | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
