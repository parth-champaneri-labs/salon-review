import { experienceTags, services } from "../data/review-options";

export const draftLabels = {
  natural: "Warm & natural",
  short: "Short & simple",
  hinglish: "Natural Hinglish",
} as const;
export type ReviewDraftType = keyof typeof draftLabels;
export type ReviewDraft = { type: ReviewDraftType; label: string; text: string };
export type ReviewInput = { service: string; experienceTags: string[] };
export const generationErrorMessage = "We couldn't prepare your review just now. Please try again.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseReviewInput(value: unknown): ReviewInput {
  if (!isRecord(value) || Object.keys(value).some(key => key !== "service" && key !== "experienceTags") ||
      typeof value.service !== "string" || !value.service.trim() || value.service.length > 80 ||
      !services.some(service => service === value.service) ||
      !Array.isArray(value.experienceTags) || value.experienceTags.length > 8 ||
      !value.experienceTags.every(tag => typeof tag === "string" && tag.length <= 80 && experienceTags.some(option => option === tag))) {
    throw new Error("Invalid review selections.");
  }
  return { service: value.service, experienceTags: [...new Set(value.experienceTags as string[])] };
}

// Validate on both sides of the endpoint; model output is untrusted.
export function parseReviewDrafts(value: unknown): ReviewDraft[] {
  if (!isRecord(value) || !Array.isArray(value.drafts) || value.drafts.length !== 3) {
    throw new Error("Invalid review drafts.");
  }
  const drafts: ReviewDraft[] = [];
  for (const type of Object.keys(draftLabels) as ReviewDraftType[]) {
    const matches = value.drafts.filter(item => isRecord(item) && item.type === type);
    const item: unknown = matches[0];
    if (matches.length !== 1 || !isRecord(item) || item.label !== draftLabels[type] ||
        typeof item.text !== "string" || !item.text.trim() || item.text.length > 1200 ||
        (type === "hinglish" && /[^\p{Script=Latin}\p{Number}\p{Punctuation}\p{Symbol}\p{Separator}\p{Mark}\s]/u.test(item.text))) {
      throw new Error("Invalid review drafts.");
    }
    drafts.push({ type, label: draftLabels[type], text: item.text.trim() });
  }
  if (new Set(drafts.map(draft => draft.text.toLowerCase())).size !== 3) {
    throw new Error("Review drafts must be distinct.");
  }
  return drafts;
}
