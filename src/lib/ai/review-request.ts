import "server-only";

import { generationErrorMessage, parseReviewDrafts, parseReviewInput } from "../review-contract";
import { generationCookieHeader, MAX_GENERATIONS, readGenerationCount } from "../review-generation-cookie";
import { generateReviewDrafts, providerStatus, ReviewProviderError } from "./gemini";

const headers = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function handleReviewRequest(request: Request, generate = generateReviewDrafts): Promise<Response> {
  let input;

  try {
    const body = await request.text();
    if (body.length > 8192) throw new Error("Request too large");
    input = parseReviewInput(JSON.parse(body));
  } catch {
    return Response.json({ error: "Please choose a valid service." }, { status: 400, headers });
  }

  const secret = process.env.REVIEW_COOKIE_SECRET;
  if (!secret || secret.length < 32) {
    return Response.json({ error: generationErrorMessage }, { status: 503, headers });
  }

  const used = readGenerationCount(request, secret);
  if (used >= MAX_GENERATIONS) {
    return Response.json({
      error: "Generation limit reached.",
      remaining: 0,
      limitReached: true,
      generation: { used, remaining: 0, limit: MAX_GENERATIONS },
    }, { status: 429, headers });
  }

  try {
    const drafts = parseReviewDrafts({ drafts: await generate(input) });
    const nextUsed = used + 1;
    return Response.json({
      drafts,
      generation: { used: nextUsed, remaining: MAX_GENERATIONS - nextUsed, limit: MAX_GENERATIONS },
    }, { headers: { ...headers, "Set-Cookie": generationCookieHeader(nextUsed, secret) } });
  } catch (error) {
    const configuration = error instanceof ReviewProviderError && error.kind === "configuration";
    console.error("Review generation failed", {
      category: error instanceof ReviewProviderError ? error.kind : "provider",
      status: providerStatus(error) ?? null,
    });
    return Response.json({ error: generationErrorMessage }, { status: configuration ? 503 : 502, headers });
  }
}
