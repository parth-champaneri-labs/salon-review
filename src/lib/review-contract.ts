export const allowedServices = [
  "Haircut",
  "Hair Styling",
  "Hair Color",
  "Hair Spa",
  "Head Massage",
  "Beard",
  "Facial / Cleanup",
  "Waxing",
  "Hair Extensions",
  "Makeup / Grooming",
  "Hair Treatments",
] as const;

export const draftLabels = {
  natural: "Warm & natural",
  short: "Short & simple",
  casual: "Casual & natural",
} as const;

export type ReviewDraftType = keyof typeof draftLabels;
export type ReviewDraft = { type: ReviewDraftType; label: string; text: string };
export const MAX_GENERATIONS = 3;
export const MAX_SERVICES = 3;
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

export type ReviewInput = {
  services: string[];
  previousReviews?: string[];
};

export const generationErrorMessage = "We couldn't prepare your review just now. Please try again.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseReviewInput(value: unknown): ReviewInput {
  if (!isRecord(value)) {
    throw new Error("Invalid review selection.");
  }
  if (Object.keys(value).some(key => !["services", "previousReviews"].includes(key))) {
    throw new Error("Invalid review selection.");
  }

  // services validation — array, 1 se MAX_SERVICES tak, no duplicates, sab allowed
  if (!Array.isArray(value.services)) {
    throw new Error("Invalid review selection.");
  }

  const rawServices = value.services;
  if (rawServices.length < 1 || rawServices.length > MAX_SERVICES) {
    throw new Error("Invalid review selection.");
  }

  const services: string[] = [];
  for (const item of rawServices) {
    if (typeof item !== "string" || !item.trim()) {
      throw new Error("Invalid review selection.");
    }
    const trimmed = item.trim();
    if (!allowedServices.some(service => service === trimmed)) {
      throw new Error("Invalid review selection.");
    }
    if (services.includes(trimmed)) {
      throw new Error("Invalid review selection.");
    }
    services.push(trimmed);
  }

  let previousReviews: string[] | undefined;

  if ("previousReviews" in value) {
    if (!Array.isArray(value.previousReviews)) {
      throw new Error("Invalid previous reviews.");
    }

    previousReviews = value.previousReviews
      .filter(
        (text): text is string =>
          typeof text === "string" &&
          text.trim().length > 2
      )
      .map(text => text.trim().slice(0, 500))
      .slice(0, 6);
  }

  return {
    services,
    ...(previousReviews && previousReviews.length ? { previousReviews } : {}),
  };
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
    if (
      matches.length !== 1 ||
      !isRecord(item) ||
      item.label !== draftLabels[type] ||
      typeof item.text !== "string" ||
      !item.text.trim() ||
      item.text.length > 1500
    ) {
      throw new Error("Invalid review drafts.");
    }
    drafts.push({ type, label: draftLabels[type], text: item.text.trim() });
  }
  if (new Set(drafts.map(draft => draft.text.toLowerCase())).size !== 3) {
    throw new Error("Review drafts must be distinct.");
  }
  return drafts;
}