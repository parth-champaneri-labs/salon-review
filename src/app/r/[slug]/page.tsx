import { notFound, redirect } from "next/navigation";
import { configuredReviewPath } from "@/lib/routing/review-redirect";

export default async function ReviewQrRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const target = configuredReviewPath(slug);
  if (!target) notFound();
  redirect(target);
}
