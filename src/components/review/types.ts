export type Rating = 1 | 2 | 3 | 4 | 5;
export type ReviewStep = "rating" | "details" | "review";
export type ReviewContext = { rating: Rating; service: string; highlights: string[] };
export type ReviewSuggestion = { id: string; title: string; text: string };

