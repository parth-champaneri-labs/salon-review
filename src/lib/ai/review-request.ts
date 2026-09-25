import "server-only";

import { generationErrorMessage, parseReviewInput } from "../review-contract";
import { generateReviewDrafts, providerStatus, ReviewProviderError } from "./gemini";

const headers = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function handleReviewRequest(request: Request, generate = generateReviewDrafts): Promise<Response> {
  let input;
  let previousReviews: string[] = [];
  
  try {
    const body = await request.text();
    if (body.length > 8192) throw new Error("Request too large"); // 4096 se badhaya
    
    const json = JSON.parse(body);
    input = parseReviewInput(json); // ye service validate karega
    
    // previousReviews ko alag se nikal lo, taaki contract fail na ho
    const raw = json as any;
    if (Array.isArray(raw.previousReviews)) {
      previousReviews = raw.previousReviews
        .filter((t: unknown) => typeof t === 'string' && t.trim().length > 2)
        .slice(0, 6); // max 6 purane bhej sakte hai
    }
  } catch {
    return Response.json({ error: "Please choose a valid service." }, { status: 400, headers });
  }
  
  try {
    // YAHI MAIN CHANGE HAI - previousReviews pass karo
    const drafts = await generate({ ...input, previousReviews });
    return Response.json({ drafts }, { headers });
  } catch (error) {
    const configuration = error instanceof ReviewProviderError && error.kind === "configuration";
    console.error("Review generation failed", {
      category: error instanceof ReviewProviderError ? error.kind : "provider",
      status: providerStatus(error) ?? null,
    });
    return Response.json({ error: generationErrorMessage }, { status: configuration ? 503 : 502, headers });
  }
}
