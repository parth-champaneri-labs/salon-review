export type ReviewStep = "details" | "review";
export type ReviewContext = { service: string; highlights: string[] };
export type ReviewSuggestion = { id: string; title: string; text: string };
