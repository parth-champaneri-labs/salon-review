import type { ReviewSuggestion } from "./types";
import { Arrow, CopyIcon } from "../icons";
import { siteConfig } from "@/config/site";

export function ReviewSuggestionCard({ review, index, selected, onSelect }: { review: ReviewSuggestion; index: number; selected: boolean; onSelect: () => void }) {
  return (
    <label className={`suggestion relative block cursor-pointer border-b border-line px-4 py-6 sm:px-5 ${selected ? "chosen" : ""}`}>
      <input type="radio" name="suggestion" checked={selected} onChange={onSelect} className="sr-only" aria-label={`Select ${review.title}`} />
      <span className="flex items-center justify-between gap-4 text-sm"><span><span className="mr-3 text-muted">0{index + 1}</span>{review.title}</span><span className="shrink-0 text-xs">{selected ? "Selected ✓" : "Select ○"}</span></span>
      <span className="mt-4 block text-[15px] leading-relaxed text-muted">“{review.text}”</span>
    </label>
  );
}

export function ReviewResults({ reviews, selected, draft, samples, loading, canGenerate, status, onSelect, onEdit, onCopy, onRegenerate }: {
  reviews: ReviewSuggestion[]; selected: string | null; draft: string; samples: boolean; loading: boolean; canGenerate: boolean;
  status: string; onSelect: (id: string) => void; onEdit: (text: string) => void; onCopy: () => void; onRegenerate: () => void;
}) {
  return (
    <div>
      {samples && <p className="mt-5 border-l-2 border-[#998366] pl-4 text-sm leading-relaxed text-muted">Sample wording, not AI-generated. Choose only what reflects your visit, then make it your own.</p>}
      {reviews.length > 0 && <fieldset className="mt-6 border-t border-line"><legend className="sr-only">Choose one review suggestion</legend>{reviews.map((review, index) => <ReviewSuggestionCard key={review.id} review={review} index={index} selected={selected === review.id} onSelect={() => onSelect(review.id)} />)}</fieldset>}
      <div className="mt-7">
        <label htmlFor="review-draft" className="text-sm font-medium">Your review. Your words.</label>
        <textarea id="review-draft" className="text-field mt-3" value={draft} onChange={event => onEdit(event.target.value)} rows={5} maxLength={4000} placeholder="Tell us about your visit…" />
        <p className="mt-2 text-right text-xs text-muted">{draft.length} / 4,000</p>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button type="button" className="action action-outline flex-1" disabled={!draft.trim()} onClick={onCopy}><CopyIcon copied={status === "Review copied"} />Copy review</button>
        <a className="action flex-1" href={siteConfig.googleReviewUrl} target="_blank" rel="noopener noreferrer">Continue to Google <Arrow diagonal /><span className="sr-only"> (opens in a new tab)</span></a>
      </div>
      <p role="status" className="mt-3 min-h-6 text-sm">{status}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">Paste your copied review into Google, make any changes you like, then post it.</p>
      <button type="button" onClick={onRegenerate} disabled={!canGenerate || loading} className="underlink mt-4" aria-describedby={!canGenerate ? "regenerate-note" : undefined}>{loading ? "Writing your review…" : "Regenerate suggestions ↻"}</button>
      {!canGenerate && <p id="regenerate-note" className="text-xs text-muted">Regeneration will be available when AI writing is connected.</p>}
    </div>
  );
}
