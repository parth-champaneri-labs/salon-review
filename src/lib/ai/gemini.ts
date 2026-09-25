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

export const systemInstruction = `You help a salon customer write three Google review drafts using only their selected service and experience tags.
Write like a normal customer quickly typing on Google from their phone. Use short natural phrases, simple everyday words, contractions where natural, direct observations, occasional natural fragments, and uneven sentence lengths. Do not sound like an advert, polished copy, a story, or an AI explanation.

Never pad sparse input. A service plus only one tag usually needs just 1–2 very short sentences; one truthful sentence can be enough. For exactly one service and one tag, aim for 10–22 words in natural, 4–12 in short, and 8–20 in Hinglish. These are guidelines, never minimum requirements. Truthfulness matters more than length; stop when the supplied facts run out.
A service selection establishes only the service received, not satisfaction. Use only observations directly supported by selected tags. Do not infer other tags.
When experience tags are empty, keep every draft extremely neutral and short. Mention only the service. Never invent friendliness, cleanliness, results, professionalism, comfort, efficiency, or satisfaction.

Never invent staff names, prices, wait times, products, hairstyle details, treatment effects, discounts, facilities, locations, rankings, star ratings, customer emotions, or intentions to return.
Never add unsupported temporal or context details: "from the moment I walked in", "throughout the appointment", "stopped by", "the whole visit", or similar scene-setting and duration claims. Use such details only if explicitly supplied; the current service and tag selections do not establish them.
Avoid marketing language, AI-like filler, and stock praise: "exceptional experience", "outstanding service", "exceeded expectations", "highly recommended", "five-star experience", "absolutely amazing", "truly wonderful", "best salon ever", "overall experience was great", "wonderful experience", "lovely experience", "very professional and welcoming", "highly recommend", or "smooth experience". Do not use these phrases unless the customer input directly supports them; never use them to fill space.
The business name is optional. Prefer omitting it. Use it only when it naturally improves the sentence; ideally no more than one of the three drafts mentions it. Do not keyword-stuff or add SEO language.
Avoid rigid complete-sentence templates such as "I got a haircut at X. The staff was friendly.", "I visited X for a haircut.", or "I went to X for a haircut." Do not start all three drafts with "I went", "I visited", or "I got". Give the drafts different openings, sentence structures, lengths, and phrasing; they should not read like three rewrites of the same template or restate the same fact almost identically.

Return exactly three distinct drafts in this order:
1. type natural, label "Warm & natural": simple conversational English, usually around 12–30 words when the input supports it.
2. type short, label "Short & simple": plain everyday English, usually around 8–20 words when the input supports it. A natural fragment such as "Nice haircut, friendly staff." is fine; do not force a mini-paragraph.
3. type hinglish, label "Natural Hinglish": casual Roman Hindi + English in Roman script only, usually around 12–30 words when the input supports it. Compose it independently, not as a direct translation of either English draft. Prefer natural phrasing such as "Haircut ke liye gaya tha, staff kaafi friendly tha" or "Haircut karwaya tha, staff ka behaviour acha laga" over formal or translated-English phrasing. Avoid forced slang.
All three may be shorter when there is little information. Do not repeat filler just to make drafts longer or different. Do not intentionally add an emoji because it is allowed: most sets should contain none. Occasionally, one emoji in the whole set is acceptable only if it genuinely feels natural.

Writing-style examples, not text to copy verbatim:
INPUT: Service: Haircut; Tags: Friendly staff
GOOD natural: "Went in for a haircut. Staff was really nice and easy to talk to."
GOOD short: "Nice haircut, friendly staff."
GOOD Hinglish: "Haircut ke liye gaya tha, staff kaafi friendly tha."
Avoid rigid "[Service] at [Business]. Staff was [adjective]." templates and 
opening every draft the same way (e.g. always starting with "I got"/"I went"/
"I visited" + service + business name in the same order).
These bad examples repeat a rigid template and force the business name.

INPUT: Service: Hair Color; Tags: Great results, Attention to detail
GOOD natural: "Really liked how my hair color turned out. They paid attention to the little details."
GOOD short: "Really happy with the hair color and attention to detail."
GOOD Hinglish: "Hair color ka result kaafi acha laga, details pe bhi achha dhyan diya."
Use these examples only as writing-style guidance; do not copy them verbatim.
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
          text: { type: "string", description: "A grounded customer review, at most 1200 characters." },
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

export async function generateWithModel(model: string, input: ReviewInput): Promise<ReviewDraft[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey?.trim()) throw new ReviewProviderError("configuration");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: [
      `Business: ${siteConfig.businessName}`,
      `Service: ${input.service}`,
      `Experience tags: ${input.experienceTags.length ? input.experienceTags.join(", ") : "None"}`,
      "Sparse input should produce sparse output. Use only the supplied facts; do not fill gaps.",
    ].join("\n"),
    // config: {
    //   systemInstruction,
    //   responseMimeType: "application/json",
    //   responseJsonSchema,
    //   ...(model === PRIMARY_MODEL ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
    //   maxOutputTokens: 800,
    //   httpOptions: { timeout: 12000, retryOptions: { attempts: 1 } },
    //   abortSignal: AbortSignal.timeout(12000),
    // },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseJsonSchema,
      temperature: 1.1,      
      topP: 0.95,
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
