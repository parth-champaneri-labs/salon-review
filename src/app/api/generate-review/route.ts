import { handleReviewRequest } from "@/lib/ai/review-request";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  return handleReviewRequest(request);
}
