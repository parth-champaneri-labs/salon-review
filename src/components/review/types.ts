export type Rating = 1 | 2 | 3 | 4 | 5;
export type ReviewStep = "rating" | "service" | "experience" | "results";
export type ReviewInput = {
  rating: Rating;
  service: string;
  tags: string[];
  note: string;
};
export type ReviewSuggestion = { id: string; title: string; text: string };
export type ReviewGateway = {
  generate: (input: ReviewInput) => Promise<ReviewSuggestion[]>;
  submitFeedback: (input: ReviewInput) => Promise<void>;
};

export function validateSuggestions(reviews: ReviewSuggestion[]) {
  if (!Array.isArray(reviews) || reviews.length !== 3 ||
    reviews.some(review => !review || typeof review.id !== "string" ||
      typeof review.title !== "string" || typeof review.text !== "string" ||
      !review.id.trim() || !review.title.trim() || !review.text.trim()) ||
    new Set(reviews.map(review => review.id)).size !== 3) {
    throw new Error("Expected three complete, uniquely identified review suggestions.");
  }
  return reviews;
}
