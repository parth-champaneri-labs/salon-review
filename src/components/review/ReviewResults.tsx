"use client";

import { useEffect, useRef } from "react";
import { draftLabels, type ReviewDraft } from "@/lib/review-contract";
import { siteConfig } from "@/config/site";
import { Arrow } from "../icons";
import type { GenerationStatus } from "./types";

export function ReviewSuggestionCard({ review, index, selected, disabled, onSelect }: {
  review: ReviewDraft; index: number; selected: boolean; disabled: boolean; onSelect: () => void;
}) {
  return (
    <button type="button" disabled={disabled} className={`suggestion relative block w-full border-b border-line px-4 py-5 text-left sm:px-5 ${selected ? "chosen" : ""}`} aria-pressed={selected} onClick={onSelect}>
      <span className="flex items-center justify-between gap-4 text-sm">
        <span><span className="mr-3 text-xs text-muted">0{index + 1}</span>{review.label}</span>
        <span className="shrink-0 text-xs">
          {selected ? <>Copied <span className="text-[#857155]" aria-hidden="true">✓</span></> : <><span className="select-label-default">Select →</span><span className="select-label-hover">Select &amp; copy →</span></>}
        </span>
      </span>
      <span className="mt-3 block text-[15px] leading-relaxed text-muted">{review.text}</span>
    </button>
  );
}

export function ReviewResults({ reviews, selected, copyStatus, copyFeedbackId, generationStatus, arrivalId, onSelect, onRetry, onRegenerate }: {
  reviews: ReviewDraft[]; selected: string | null; copyStatus: string; copyFeedbackId: number;
  generationStatus: GenerationStatus; arrivalId: number;
  onSelect: (id: string) => void; onRetry: () => void; onRegenerate: () => void;
}) {
  const statusRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (generationStatus !== "success" || arrivalId === 0) return;
    const status = statusRef.current;
    const suggestions = suggestionsRef.current;
    const first = suggestions?.querySelector("button");
    if (!status || !suggestions || !first) return;

    suggestions.classList.add("suggestions-arrive", "suggestions-fresh");
    const frame = requestAnimationFrame(() => {
      const statusRect = status.getBoundingClientRect();
      const firstRect = first.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      if (statusRect.top >= 0 && firstRect.bottom <= viewportHeight - 24) return;
      const distance = Math.max(0, Math.min(firstRect.bottom - (viewportHeight - 24), statusRect.top - 24));
      if (distance > 0) window.scrollBy({ top: distance, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
    const revealTimer = window.setTimeout(() => suggestions.classList.remove("suggestions-arrive"), 350);
    const accentTimer = window.setTimeout(() => suggestions.classList.remove("suggestions-fresh"), 1100);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(revealTimer);
      window.clearTimeout(accentTimer);
      suggestions.classList.remove("suggestions-arrive", "suggestions-fresh");
    };
  }, [arrivalId, generationStatus]);

  return (
    <div>
      <div ref={statusRef} className={`suggestion-status mt-6 ${generationStatus === "success" ? "suggestion-status-ready" : ""}`}>
        {generationStatus === "loading" ? <>
          <p className="eyebrow flex items-center gap-3 text-[#756448]"><span className="generation-line" />CREATING YOUR SUGGESTIONS...</p>
          <p className="mt-2 text-sm text-muted">Using your visit details to prepare a few starting points.</p>
        </> : generationStatus === "success" ? <>
          <p className="eyebrow text-[#756448]"><span className="mr-2 text-sm" aria-hidden="true">✓</span>YOUR SUGGESTIONS ARE READY</p>
          <p className="mt-2 text-sm text-muted">Choose one below to copy it. Paste and edit on Google.</p>
        </> : generationStatus === "error" ? <>
          <p className="eyebrow text-[#756448]">WE COULDN&apos;T CREATE SUGGESTIONS</p>
          <p className="mt-2 text-sm text-muted">You can try again or write your review directly on Google.</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <button type="button" className="underlink" onClick={onRetry}>Try again</button>
            <a className="underlink" href={siteConfig.googleReviewUrl} target="_blank" rel="noopener noreferrer">Write on Google<span className="sr-only"> (opens in a new tab)</span></a>
          </div>
        </> : <>
          <p className="text-sm">Need a little inspiration?</p>
          <p className="mt-1 text-sm text-muted">Generate a few review suggestions based on your visit.</p>
        </>}
      </div>
      {generationStatus === "loading" && reviews.length === 0 && <div className="suggestion-list mt-5 border-t border-line" aria-hidden="true">
        {Object.values(draftLabels).map((label, index) => <div key={label} className="suggestion-pending border-b border-line px-4 py-5 text-sm sm:px-5">
          <div className="flex items-center justify-between gap-4">
            <span><span className="mr-3 text-xs">0{index + 1}</span>{label}</span>
            <span className="suggestion-skeleton h-2 w-12 shrink-0" />
          </div>
          <div className="mt-4 space-y-2.5">
            <span className="suggestion-skeleton h-2.5 w-[78%]" />
            <span className="suggestion-skeleton h-2.5 w-[52%]" />
          </div>
        </div>)}
      </div>}
      {reviews.length > 0 && <div ref={suggestionsRef} className={`suggestion-list mt-5 border-t border-line ${generationStatus === "loading" ? "suggestions-loading" : generationStatus === "success" ? "suggestion-list-ready" : ""}`} role="group" aria-label="Writing suggestions" aria-busy={generationStatus === "loading"}>
        {reviews.map((review, index) => <ReviewSuggestionCard key={review.type} review={review} index={index} selected={selected === review.type} disabled={generationStatus === "loading"} onSelect={() => onSelect(review.type)} />)}
      </div>}
      {generationStatus === "success" && <>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" className="action action-outline flex-1" onClick={onRegenerate}>Regenerate reviews</button>
        <a className="action flex-1" href={siteConfig.googleReviewUrl} target="_blank" rel="noopener noreferrer">Continue to Google <Arrow diagonal /><span className="sr-only"> (opens in a new tab)</span></a>
      </div>
      {copyStatus && copyStatus !== "copied" && <p role="alert" className="mt-3 text-sm">{copyStatus}</p>}
      {copyStatus === "copied" && <div key={copyFeedbackId} className="copy-confirmation" role="status" aria-live="polite">
        <div className="copy-confirmation-content"><span className="copy-confirmation-check" aria-hidden="true">✓</span><span>Copied to clipboard</span></div>
      </div>}</>}
    </div>
  );
}
