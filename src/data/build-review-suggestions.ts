import type { ReviewContext, ReviewSuggestion } from "../components/review/types";

const highlightPhrases: Record<string, string> = {
  "Friendly staff": "The team was really friendly.",
  "Great results": "I’m very happy with the result.",
  "Professional service": "The service felt professional throughout.",
  "Clean salon": "The salon was clean and well maintained.",
  "Comfortable ambience": "The atmosphere was comfortable and welcoming.",
  "Attention to detail": "The team paid attention to the little details.",
  "Quick service": "The service was smooth and efficient.",
  "Good communication": "They listened carefully to what I wanted.",
};
const servicePhrases: Record<string, string> = {
  Haircut: "a haircut", "Hair Styling": "hair styling", "Hair Color": "hair colouring",
  "Hair Spa": "a hair spa treatment", "Beard / Grooming": "grooming", Facial: "a facial",
  Cleanup: "a cleanup", Waxing: "waxing", Threading: "threading", Manicure: "a manicure",
  Pedicure: "a pedicure", Makeup: "makeup", "Bridal / Occasion Makeup": "occasion makeup",
  "Keratin / Smoothening": "a keratin / smoothening treatment", "Head Massage": "a head massage",
};

// Pure local boundary: replace this provider later without changing presentation components.
export function buildReviewSuggestions({ rating, service, highlights }: ReviewContext): ReviewSuggestion[] {
  const opening = {
    1: "My visit to Hair Driver was disappointing overall.",
    2: "My visit to Hair Driver could have been better.",
    3: "My visit to Hair Driver was okay overall.",
    4: "Really enjoyed my visit to Hair Driver.",
    5: "Had an excellent experience at Hair Driver.",
  }[rating];
  const closing = {
    1: "Overall, the experience fell short of what I’d hoped for.",
    2: "There were parts of the experience that could be improved.",
    3: "There were a few things that could have been better.",
    4: "Overall, it was a really good visit.",
    5: "Overall, I’m very happy with my visit.",
  }[rating];
  const visit = service === "Other" ? "I visited for a salon service." : `I came in for ${servicePhrases[service] ?? service.toLowerCase()}.`;
  const details = [...new Set(highlights)].flatMap(highlight => highlightPhrases[highlight] ? [highlightPhrases[highlight]] : []);
  const join = (parts: string[]) => parts.filter(Boolean).join(" ");
  return [
    { id: "short", title: "Short & simple", text: join([opening, visit, ...details.slice(0, 2)]) },
    { id: "warm", title: "Warm & natural", text: join([visit.replace("I came in", "I went to Hair Driver").replace("I visited", "I visited Hair Driver"), ...details.slice(0, 4), closing]) },
    { id: "detailed", title: "A little more detail", text: join([opening, visit, ...details, closing]) },
  ];
}

