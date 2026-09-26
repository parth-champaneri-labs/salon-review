import "server-only";

import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { siteConfig } from "../../config/site";
import { draftLabels, parseReviewDrafts, type ReviewDraft, type ReviewInput } from "../review-contract";

// Swapped: Flash-Lite is primary (cheap, more than good enough for short
// review lines), full Flash is only used as a fallback when Lite fails or
// returns invalid output.
export const PRIMARY_MODEL = "gemini-3.5-flash-lite";
export const FALLBACK_MODEL = "gemini-3.8-flash";

export class ReviewProviderError extends Error {
  readonly kind: "configuration" | "output";

  constructor(kind: "configuration" | "output") {
    super(kind === "configuration" ? "Review provider is not configured." : "Invalid review provider output.");
    this.kind = kind;
  }
}

export const systemInstruction = `You help a salon customer write three short, genuinely positive Google review drafts based only on the service they received. No experience tags are collected — you must infer a natural, truthful-sounding positive angle appropriate to that specific service.

Write like a normal happy customer quickly typing on Google from their phone. Short natural phrases, simple everyday words, contractions where natural, occasional fragments, uneven sentence lengths. Do not sound like an advert, polished copy, or an AI explanation.

Keep every draft SHORT. This is a single-service input with no extra detail, so do not pad:
- natural: usually 8–18 words
- short: usually 4–10 words, a fragment like "Great haircut, really happy with it." is fine
- hinglish: usually 8–16 words

Ground the positive sentiment in what that service naturally delivers — pick ONE realistic angle per draft, do not stack multiple claims:
- Haircut / Hair Styling: how it turned out, the style, the look
- Hair Color: the color result
- Hair Spa / Head Massage: feeling relaxed, refreshed
- Beard / Grooming: clean, neat trim
- Facial / Cleanup: skin feeling fresh, clean
- Makeup: how the look turned out
- Others: a simple, generic positive line about the visit

Never invent staff names, prices, wait times, product names, specific techniques, discounts, facilities, locations, rankings, star ratings, or intentions to return. Never add unsupported scene-setting like "from the moment I walked in" or "throughout the appointment."

Avoid marketing language and stock praise: "exceptional experience", "outstanding service", "exceeded expectations", "highly recommended", "five-star experience", "absolutely amazing", "truly wonderful", "best salon ever", "wonderful experience", "lovely experience", "very professional and welcoming", "smooth experience". Never use these to fill space.

The business name is optional. Prefer omitting it; use it in at most one of the three drafts, only if it fits naturally. No keyword-stuffing.

Do not use a rigid template like "[Service] at [Business]. Staff was [adjective]." across drafts. Do not open all three the same way (e.g. always "I got"/"I went"/"I visited"). Each of the three drafts must open differently and use a different structure — vary sentence shape, word order, and which single positive angle it picks.

Return exactly three distinct drafts in this order:
1. type natural, label "Warm & natural": simple conversational English.
2. type short, label "Short & simple": plain everyday English, can be a short fragment.
3. type hinglish, label "Natural Hinglish": casual Roman Hindi + English in Roman script only. Compose independently, not a translation of the English drafts. Prefer phrasing like "Haircut karwaya, kaafi acha laga" or "Hair color ka result bahut pasand aaya" over formal/translated English.

Do not repeat filler just to make drafts longer or more different than the facts allow. Do not intentionally add an emoji unless explicitly told to for this request — follow the per-request emoji instruction given below exactly.

Writing-style examples for DIFFERENT services, not text to copy verbatim — study the variety of openings and structures, not the wording:

INPUT: Service: Haircut
natural: "Really happy with how my haircut turned out."
short: "Great haircut, loved it."
hinglish: "Haircut bahut acha laga, kaafi pasand aaya."

INPUT: Service: Hair Color
natural: "Loved the color result, exactly the shade I wanted."
short: "Hair color came out really nice."
hinglish: "Hair color ka result bahut acha nikla."

INPUT: Service: Head Massage
natural: "Felt so relaxed after the head massage, needed that."
short: "Super relaxing head massage."
hinglish: "Head massage ke baad bilkul relax feel hua."

Return only the specified JSON structure. The customer can edit before posting.`;

const responseJsonSchema = {
  type: "object",
  required: ["drafts"],
  additionalProperties: false,
  properties: {
    drafts: {
      type: "array", minItems: 3, maxItems: 3,
      items: {
        type: "object", required: ["type", "label", "text"], additionalProperties: false,
        properties: {
          type: { type: "string", enum: Object.keys(draftLabels) },
          label: { type: "string", enum: Object.values(draftLabels) },
          text: { type: "string", description: "A short, genuinely positive customer review, at most 1200 characters." },
        },
      },
    },
  },
};

// Server decides these randomly per request — never left to the model's own
// probability, so repeated identical inputs still diverge and emoji frequency
// stays actually low instead of the model defaulting to "never".
const openingAngles = [
  "Lead with the result or feeling, not the service name.",
  "Start with a short fragment rather than a full sentence.",
  "Start mid-thought, like continuing a text to a friend.",
  "Lead with how it felt, then mention the service.",
  "Keep it blunt and matter-of-fact, minimal adjectives.",
] as const;

function buildVariationDirective(): string {
  const angle = openingAngles[Math.floor(Math.random() * openingAngles.length)];
  const includeEmoji = Math.random() < 0.15; // ~15% of requests get one emoji, decided here, not by the model
  const emojiLine = includeEmoji
    ? "For this request only: include exactly one natural, relevant emoji in exactly one of the three drafts (not all three)."
    : "For this request: do not use any emoji in any draft.";
  return `Variation instruction for this request only: ${angle}\n${emojiLine}`;
}

export function providerStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return;
  if ("status" in error && typeof error.status === "number") return error.status;
}

export function isRetryableProviderError(error: unknown): boolean {
  const status = providerStatus(error);
  if (status !== undefined) return status === 408 || status === 429 || (status >= 500 && status <= 599);
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

export async function generateWithModel(model: string, input: ReviewInput): Promise<ReviewDraft[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey?.trim()) throw new ReviewProviderError("configuration");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: [
      `Business: ${siteConfig.businessName}`,
      `Service: ${input.service}`,
      "Write a short, genuinely positive review for this service only. Pick one natural, realistic positive angle for this specific service type.",
      buildVariationDirective(),
    ].join("\n"),
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseJsonSchema,
      // Lowered from 1.25: still enough variation across the 3 drafts and
      // across requests, but noticeably less risk of malformed/incoherent
      // JSON output that would trigger a wasted retry + fallback call.
      temperature: 1.0,
      topP: 0.95,
      topK: 64,
      // Thinking removed: this is short creative text, not a reasoning task.
      // Thinking tokens bill as output tokens with no quality benefit here,
      // on either model. Only kept as a no-op for gemini-3.8-flash in case
      // the fallback path is hit and thinking is required by that model's
      // config surface; set to NONE explicitly rather than omitted.
      ...(model === FALLBACK_MODEL ? { thinkingConfig: { thinkingLevel: ThinkingLevel.NONE } } : {}),
      maxOutputTokens: 800,
      httpOptions: { timeout: 12000, retryOptions: { attempts: 1 } },
      abortSignal: AbortSignal.timeout(12000),
    },
  });
  try {
    if (!response.text) throw new Error("Missing output");
    return parseReviewDrafts(JSON.parse(response.text));
  } catch {
    throw new ReviewProviderError("output");
  }
}

type ModelGenerator = (model: string, input: ReviewInput) => Promise<ReviewDraft[]>;

export async function generateReviewDrafts(input: ReviewInput, generate: ModelGenerator = generateWithModel): Promise<ReviewDraft[]> {
  try {
    return await generate(PRIMARY_MODEL, input);
  } catch (error) {
    if (!isRetryableProviderError(error)) throw error;
    // Never log raw provider errors, request data, output, or credentials.
    console.warn("Review generation: retrying with fallback", { status: providerStatus(error) ?? "timeout" });
    return generate(FALLBACK_MODEL, input);
  }
}