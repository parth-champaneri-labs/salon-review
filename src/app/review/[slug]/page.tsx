import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ReviewExperience } from "@/components/review/ReviewExperience";
import { isConfiguredClientSlug, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `A few words, a beautiful difference | ${siteConfig.businessName}`,
  description: `Thank you for choosing ${siteConfig.businessName} — ${siteConfig.businessDescriptor}. Share your salon experience with a little review inspiration, then leave your review on Google.`,
  robots: { index: false, follow: false },
};

export default async function ClientReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isConfiguredClientSlug(slug)) notFound();
  return <ReviewExperience />;
}
