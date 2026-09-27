import { isConfiguredClientSlug, siteConfig } from "@/config/site";

export function configuredReviewPath(slug: string): string | null {
  return isConfiguredClientSlug(slug) ? siteConfig.reviewPath : null;
}
