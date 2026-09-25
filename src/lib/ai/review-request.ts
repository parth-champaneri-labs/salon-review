import "server-only";

import { generationErrorMessage, parseReviewInput } from "../review-contract";
import { generateReviewDrafts, providerStatus, ReviewProviderError } from "./gemini";

const headers = { "Cache-Control": "no-store" };

export async function handleReviewRequest(request: Request, generate = generateReviewDrafts): Promise<Response> {
  let input;
  try {
    const body = await request.text();
    if (body.length > 4096) throw new Error("Request too large");
    input = parseReviewInput(JSON.parse(body));
  } catch {
    return Response.json({ error: "Please choose a service and valid visit details." }, { status: 400, headers });
  }
  try {
    const drafts = await generate(input);
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
