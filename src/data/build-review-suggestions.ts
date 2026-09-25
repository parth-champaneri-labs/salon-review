import type { ReviewContext, ReviewSuggestion } from "../components/review/types";

const highlightPhrases: Record<string, { sentence: string; clause: string }> = {
  "Friendly staff": { sentence: "The team was really friendly.", clause: "the team was really friendly" },
  "Great results": { sentence: "I’m very happy with the result.", clause: "I’m very happy with the result" },
  "Professional service": { sentence: "The service felt professional throughout.", clause: "the service felt professional throughout" },
  "Clean salon": { sentence: "The salon felt clean and well maintained.", clause: "the salon felt clean and well maintained" },
  "Comfortable ambience": { sentence: "The atmosphere was comfortable and welcoming.", clause: "the atmosphere was comfortable and welcoming" },
  "Attention to detail": { sentence: "The team paid attention to the little details.", clause: "the team paid attention to the little details" },
  "Quick service": { sentence: "The service was smooth and efficient.", clause: "the service was smooth and efficient" },
  "Good communication": { sentence: "They listened carefully to what I wanted.", clause: "they listened carefully to what I wanted" },
};
const servicePhrases: Record<string, string> = {
  Haircut: "a haircut", "Hair Styling": "hair styling", "Hair Color": "hair colouring",
  "Hair Spa": "a hair spa treatment", "Beard / Grooming": "grooming", Facial: "a facial",
  Cleanup: "a cleanup", Waxing: "waxing", Threading: "threading", Manicure: "a manicure",
  Pedicure: "a pedicure", Makeup: "makeup", "Bridal / Occasion Makeup": "occasion makeup",
  "Keratin / Smoothening": "a keratin / smoothening treatment", "Head Massage": "a head massage",
  Other: "a salon service",
};

// Pure local boundary: replace this provider later without changing presentation components.
export function buildReviewSuggestions({ service, highlights }: ReviewContext): ReviewSuggestion[] {
  const visit = servicePhrases[service] ?? service.toLowerCase();
  const details = [...new Set(highlights)].flatMap(highlight =>
    Object.hasOwn(highlightPhrases, highlight) ? [highlightPhrases[highlight]] : [],
  );
  const join = (parts: string[]) => parts.filter(Boolean).join(" ");
  // Pair selected observations to vary the rhythm without adding unselected claims.
  const naturalDetails = (items: typeof details) => {
    const sentences: string[] = [];
    for (let index = 0; index < items.length; index += 2) {
      const first = items[index].sentence;
      const second = items[index + 1]?.clause;
      sentences.push(second ? `${first.slice(0, -1)}, and ${second}.` : first);
    }
    return join(sentences);
  };
  return [
    {
      id: "short", title: "Short & simple",
      text: join([`I visited Hair Driver for ${visit}.`, naturalDetails(details.slice(0, 2))]),
    },
    {
      id: "warm", title: "Warm & natural",
      text: details.length
        ? join([`I went to Hair Driver for ${visit}, and ${details[0].clause}.`, naturalDetails(details.slice(1, 4))])
        : `My visit to Hair Driver was for ${visit}. That’s what brought me to the salon.`,
    },
    {
      id: "detailed", title: "A little more detail",
      text: join([`I came to Hair Driver for ${visit} and wanted to share a few words about my visit.`, naturalDetails(details)]),
    },
  ];
}
