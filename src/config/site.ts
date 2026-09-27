export function normalizeSiteUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute HTTP or HTTPS URL.");
  }

  if (!(["http:", "https:"].includes(url.protocol)) || !url.hostname || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP or HTTPS origin without a path, query, or credentials.");
  }

  return url.origin;
}

export function createSiteUrls(url: string, slug: string) {
  const siteUrl = normalizeSiteUrl(url);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Client slug must contain only lowercase letters, numbers, and hyphens.");
  }
  const reviewPath = `/review/${slug}`;
  const qrRedirectPath = `/r/${slug}`;
  return {
    siteUrl,
    reviewPath,
    qrRedirectPath,
    reviewUrl: `${siteUrl}${reviewPath}`,
    qrRedirectUrl: `${siteUrl}${qrRedirectPath}`,
  };
}

export function normalizeGoogleReviewUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("NEXT_PUBLIC_GOOGLE_REVIEW_URL must be a valid HTTPS Google review URL.");
  }

  const allowedHosts = new Set(["g.page", "google.com", "www.google.com", "search.google.com"]);
  if (url.protocol !== "https:" || !allowedHosts.has(url.hostname) || url.username || url.password || url.port) {
    throw new Error("NEXT_PUBLIC_GOOGLE_REVIEW_URL must use HTTPS and an approved Google host.");
  }

  return url.href;
}

const clientSlug = "hair-driver";
const siteUrls = createSiteUrls(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === "production" ? "https://lumenspirelabs.com" : "http://localhost:3000"),
  clientSlug,
);

export function isConfiguredClientSlug(slug: string): boolean {
  return slug === clientSlug;
}

export const siteConfig = {
  ...siteUrls,
  businessName: "Hair Driver",
  businessDescriptor: "Family Salon & Academy",
  clientSlug,
  googleReviewUrl: normalizeGoogleReviewUrl(
    process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ?? "https://g.page/r/CXyzMGBwIejGEAE/review",
  ),
  heroVideo: "/videos/hero.mp4",
} as const;
