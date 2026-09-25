import "server-only";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { siteConfig } from "../../config/site";
import { draftLabels, parseReviewDrafts, type ReviewDraft, type ReviewInput } from "../review-contract";

export const PRIMARY_MODEL = "gemini-3.8-flash";
export const FALLBACK_MODEL = "gemini-3.5-flash-lite";

export class ReviewProviderError extends Error {
  readonly kind: "configuration" | "output";
  constructor(kind: "configuration" | "output") {
    super(kind === "configuration" ? "Review provider is not configured." : "Invalid review provider output.");
    this.kind = kind;
  }
}

export const systemInstruction = `You are a real customer typing a quick Google review on your phone. Not a writer.

GOAL: 3 drafts that look 100% human typed in 15 seconds.

Rules:
- Very short: 1 sentence max.
- Simple words: nice, clean, loved it, acha laga, kaafi
- Use contractions: it's, I'm
- One real angle per service: Haircut=shape/look, Color=shade/result, Spa/Massage=relaxed feel, Beard=neat trim, Facial=fresh/clean skin
- NEVER invent: staff name, price, time, product, discount, location, 5 star, will come again
- NEVER use: exceptional, outstanding, highly recommend, five-star, absolutely amazing, best ever, wonderful experience, very professional
- Business name max 1 draft me
- All 3 drafts MUST have different words and different opening. Never repeat same sentence structure.
- Hinglish must be Roman only, like "haircut karwaya, kaafi acha laga" - not translation
- No emoji unless explicitly told

Return only JSON.`;

// Is list ko bada kiya taaki har bar naya angle mile
const openingAngles = [
  "Start with result directly: 'Nice cut...' 'Color looks...'",
  "Start with feeling: 'Feels so relaxed...' 'bahut acha laga...'",
  "Start with a short fragment: 'Clean trim.' 'Nice cut, loved it.'",
  "Start mid-thought like texting: 'just got haircut, turned out really well'",
  "Blunt and matter-of-fact: 'Good haircut. Sits well.'",
  "Start with 'Loved how...' or 'Really liked...'",
  "Start with service at the end: '... after haircut' / '... after facial'",
  "Start lowercase casual, especially hinglish",
  "Use filler naturally: 'actually', 'finally', 'kaafi'",
  "Start with shape/shade/feel in first 3 words",
  "Start with 'got a...' but keep it short",
  "Start with 'haircut karwaya tha...' style",
] as const;

function buildVariationDirective(previousReviews: string[] = []): string {
  // Har bar 3 alag angles pick karo
  const shuffled = [...openingAngles].sort(() => 0.5 - Math.random()).slice(0, 3);
  const includeEmoji = Math.random() < 0.07;
  const emojiLine = includeEmoji
    ? "For this request only: include exactly one emoji in exactly one draft."
    : "For this request: do not use any emoji.";

  // Ye sabse important hai - previous ko ban karo
  const bannedBlock = previousReviews.length
    ? `BANNED LIST - Do NOT repeat, paraphrase or reuse these previous reviews. Create 100% fresh wording:\n"${previousReviews.join('"\n"')}"`
    : "This is first generation, make them fresh.";

  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return `
CRITICAL: This is a REGENERATE request. You must create completely NEW drafts.
Attempt ID: ${nonce}

${bannedBlock}

Variation for THIS request only:
- Draft 1 (Warm & natural) angle: ${shuffled[0]}
- Draft 2 (Short & simple) angle: ${shuffled[1]} 
- Draft 3 (Natural Hinglish) angle: ${shuffled[2]}

Rules: All 3 drafts must use totally different words from each other and from banned list.
Random seed: ${nonce}
${emojiLine}
`;
}

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

export function providerStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return;
  if ("status" in error && typeof error.status === "number") return error.status;
}

export function isRetryableProviderError(error: unknown): boolean {
  const status = providerStatus(error);
  if (status !== undefined) return status === 408 || status === 429 || (status >= 500 && status <= 599);
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

// Yaha previousReviews add kiya
export async function generateWithModel(
  model: string, 
  input: ReviewInput & { previousReviews?: string[] }
): Promise<ReviewDraft[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey?.trim()) throw new ReviewProviderError("configuration");
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      `Business: ${siteConfig.businessName}`,
      `Service: ${input.service}`,
      `Request ID: ${Date.now()}-${Math.random().toString(36).slice(2,7)} - You must generate fresh unique reviews, never seen before.`,
      buildVariationDirective(input.previousReviews || []),
    ].join("\n"),
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseJsonSchema,
      temperature: 1.35, // 1.25 se thoda badhaya
      topP: 0.98,
      topK: 64,
      seed: Math.floor(Math.random() * 1000000), // Har bar alag seed
      ...(model === PRIMARY_MODEL ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
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

type ModelGenerator = (model: string, input: ReviewInput & { previousReviews?: string[] }) => Promise<ReviewDraft[]>;

export async function generateReviewDrafts(
  input: ReviewInput & { previousReviews?: string[] }, 
  generate: ModelGenerator = generateWithModel
): Promise<ReviewDraft[]> {
  try {
    return await generate(PRIMARY_MODEL, input);
  } catch (error) {
    if (error instanceof ReviewProviderError && error.kind === "configuration") throw error;
    const shouldFallback = isRetryableProviderError(error) ||
      (error instanceof ReviewProviderError && error.kind === "output");
    if (!shouldFallback) throw error;
    console.warn("Review generation: retrying with fallback", {
      status: providerStatus(error) ?? (error instanceof ReviewProviderError ? "output" : "timeout"),
    });
    return generate(FALLBACK_MODEL, input);
  }
}
