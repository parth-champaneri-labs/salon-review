import type { ReviewSuggestion } from "./types";
import { Arrow, CopyIcon } from "../icons";
import { siteConfig } from "@/config/site";

export function ReviewSuggestionCard({ review, selected, onSelect }: { review: ReviewSuggestion; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" className={`suggestion relative block w-full border-b border-line px-4 py-5 text-left sm:px-5 ${selected ? "chosen" : ""}`} aria-pressed={selected} onClick={onSelect}>
      <span className="flex items-center justify-between gap-4 text-sm"><span>{review.title}</span><span className="shrink-0 text-xs">{selected ? "Selected ✓" : "Select"}</span></span>
      <span className="mt-3 block text-[15px] leading-relaxed text-muted">{review.text}</span>
    </button>
  );
}

export function ReviewResults({ reviews, selected, draft, status, onSelect, onEdit, onCopy }: {
  reviews: ReviewSuggestion[]; selected: string | null; draft: string;
  status: string; onSelect: (id: string) => void; onEdit: (text: string) => void; onCopy: () => void;
}) {
  return (
    <div>
      <p className="mt-6 text-sm text-muted">Need a little inspiration? Choose a starting point below.</p>
      <div className="mt-4 border-t border-line" role="group" aria-label="Writing suggestions">
        {reviews.map(review => <ReviewSuggestionCard key={review.id} review={review} selected={selected === review.id} onSelect={() => onSelect(review.id)} />)}
      </div>
      <div className="mt-7">
        <label htmlFor="review-draft" className="text-sm font-medium">Your review. Your words.</label>
        <textarea id="review-draft" className="text-field mt-3" value={draft} onChange={event => onEdit(event.target.value)} rows={5} maxLength={4000} placeholder="Tell us about your visit..." aria-describedby="review-limit" />
        <p id="review-limit" className="mt-2 text-right text-xs text-muted">{draft.length} / 4,000</p>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button type="button" className="action action-outline flex-1" disabled={!draft.trim()} onClick={onCopy}><CopyIcon copied={status === "Review copied."} />Copy review</button>
        <a className="action flex-1" href={siteConfig.googleReviewUrl} target="_blank" rel="noopener noreferrer">Continue to Google <Arrow diagonal /><span className="sr-only"> (opens in a new tab)</span></a>
      </div>
      <p role="status" className="mt-3 min-h-6 text-sm">{status}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">Paste your copied review into Google, make any changes you like, then post it.</p>
    </div>
  );
}
