export const allowedServices = [
  "Haircut",
  "Hair Styling",
  "Hair Color",
  "Hair Spa",
  "Head Massage",
  "Beard / Grooming",
  "Facial",
  "Cleanup",
  "Makeup",
] as const;

export const draftLabels = {
  natural: "Warm & natural",
  short: "Short & simple",
  hinglish: "Natural Hinglish",
} as const;

export type ReviewDraftType = keyof typeof draftLabels;
export type ReviewDraft = { type: ReviewDraftType; label: string; text: string };
export const MAX_GENERATIONS = 3;
export type GenerationState = { used: number; remaining: number; limit: number };

export function parseGenerationState(value: unknown): GenerationState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Invalid generation state.");
  const state = value as Record<string, unknown>;
  if (state.limit !== MAX_GENERATIONS || !Number.isInteger(state.used) || typeof state.used !== "number" ||
      state.used < 0 || state.used > MAX_GENERATIONS || state.remaining !== MAX_GENERATIONS - state.used) {
    throw new Error("Invalid generation state.");
  }
  return { used: state.used, remaining: state.remaining as number, limit: MAX_GENERATIONS };
}

// YAHAN CHANGE - previousReviews add kiya
export type ReviewInput = {
  service: string;
  previousReviews?: string[];
  attemptId?: string;
};

export const generationErrorMessage = "We couldn't prepare your review just now. Please try again.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value!== null &&!Array.isArray(value);
}

export function parseReviewInput(value: unknown): ReviewInput {
  if (!isRecord(value)) {
    throw new Error("Invalid review selection.");
  }
  if (Object.keys(value).some(key => !["service", "previousReviews", "attemptId"].includes(key))) {
    throw new Error("Invalid review selection.");
  }

  // service validation same as before
  if (
    typeof value.service!== "string" ||
   !value.service.trim() ||
    value.service.length > 80 ||
   !allowedServices.some(service => service === value.service)
  ) {
    throw new Error("Invalid review selection.");
  }

  // NAYA - previousReviews optional, agar hai to clean karo
  let previousReviews: string[] | undefined;
  if ("previousReviews" in value && Array.isArray(value.previousReviews)) {
    previousReviews = (value.previousReviews as unknown[])
     .filter((t): t is string => typeof t === "string" && t.trim().length > 2)
     .map(t => t.trim().slice(0, 500))
     .slice(0, 6); // max 6 purane
  }

  return {
    service: value.service.trim(),
   ...(previousReviews && previousReviews.length? { previousReviews } : {}),
  };
}

// Validate on both sides of the endpoint; model output is untrusted.
export function parseReviewDrafts(value: unknown): ReviewDraft[] {
  if (!isRecord(value) ||!Array.isArray(value.drafts) || value.drafts.length!== 3) {
    throw new Error("Invalid review drafts.");
  }
  const drafts: ReviewDraft[] = [];
  for (const type of Object.keys(draftLabels) as ReviewDraftType[]) {
    const matches = value.drafts.filter(item => isRecord(item) && item.type === type);
    const item: unknown = matches[0];
    if (matches.length!== 1 ||!isRecord(item) || item.label!== draftLabels[type] ||
        typeof item.text!== "string" ||!item.text.trim() || item.text.length > 1200 ||
        (type === "hinglish" && /[^\p{Script=Latin}\p{Number}\p{Punctuation}\p{Symbol}\p{Separator}\p{Mark}\s]/u.test(item.text))) {
      throw new Error("Invalid review drafts.");
    }
    drafts.push({ type, label: draftLabels[type], text: item.text.trim() });
  }
  if (new Set(drafts.map(draft => draft.text.toLowerCase())).size!== 3) {
    throw new Error("Review drafts must be distinct.");
  }
  return drafts;
}
