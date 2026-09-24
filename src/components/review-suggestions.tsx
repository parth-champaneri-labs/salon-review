"use client";

import { useRef, useState } from "react";
import type { ReviewSuggestion } from "@/data/reviews";
import { siteConfig } from "@/config/site";
import { Arrow, CopyIcon } from "./icons";

type CopyState = { id: string; status: "copied" | "failed" } | null;

function ReviewCard({ suggestion, selected, copyState, onSelect, onCopy }: {
  suggestion: ReviewSuggestion; selected: boolean; copyState: CopyState;
  onSelect: () => void; onCopy: () => void;
}) {
  const copied = copyState?.id === suggestion.id && copyState.status === "copied";
  return <article className={`review-row${selected ? " is-selected" : ""}`}>
    <div className="review-number" aria-hidden="true">{suggestion.id}</div>
    <div className="review-content"><div className="review-topline"><h3>{suggestion.title}</h3><label className="select-review"><input type="radio" name="review" checked={selected} onChange={onSelect} aria-label={`Select review ${suggestion.id}`} /><span>{selected ? "Selected" : "Select"}</span></label></div><p className="review-text">“{suggestion.text}”</p><button className="copy-button" onClick={onCopy} aria-label={`${copied ? "Copied" : "Copy"} review ${suggestion.id}`}><CopyIcon copied={copied} />{copied ? "Copied" : "Copy review"}</button></div>
  </article>;
}

export function GoogleReviewCTA() {
  return <div className="google-cta"><div><h3>Your words mean a lot.</h3><p>Paste your review on Google, make it yours, and share.</p></div><a className="button button-dark" href={siteConfig.googleReviewUrl} target="_blank" rel="noopener noreferrer">Continue to Google <Arrow diagonal /><span className="sr-only"> (opens in a new tab)</span></a><p className="google-note">Prefer your own words? You can write your review directly on Google.</p></div>;
}

export function ReviewSuggestions({ suggestions }: { suggestions: ReviewSuggestion[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<CopyState>(null);
  const attempt = useRef(0);
  async function copyReview(suggestion: ReviewSuggestion) {
    const currentAttempt = ++attempt.current;
    setSelected(suggestion.id);
    setCopyState(null);
    try {
      await navigator.clipboard.writeText(suggestion.text);
      if (currentAttempt === attempt.current) setCopyState({ id: suggestion.id, status: "copied" });
    } catch {
      if (currentAttempt === attempt.current) setCopyState({ id: suggestion.id, status: "failed" });
    }
  }
  return <section className="reviews" id="reviews" aria-labelledby="reviews-title"><div className="shell review-layout"><div className="review-intro"><p className="eyebrow">YOUR EXPERIENCE, IN YOUR WORDS</p><h2 id="reviews-title">A few words.<br /><em>A beautiful<br className="desktop-break" /> difference.</em></h2><p>Your feedback helps our team grow and helps someone else find their next favourite salon.</p><div className="review-instructions"><span>01 <b>Choose a starting point</b></span><span>02 <b>Copy & make it your own</b></span><span>03 <b>Share on Google</b></span></div></div><div className="review-options"><h3 className="inspiration-heading">Need a little inspiration?</h3><p className="inspiration-copy">Choose a suggestion that reflects your experience.<br />You can personalize the review before posting it on Google.</p><div className="review-list" role="group" aria-label="Three suggested reviews">{suggestions.map(suggestion => <ReviewCard key={suggestion.id} suggestion={suggestion} selected={selected === suggestion.id} copyState={copyState} onSelect={() => setSelected(suggestion.id)} onCopy={() => copyReview(suggestion)} />)}</div><p className="copy-status" role="status" aria-live="polite">{copyState?.status === "failed" ? "Couldn't access your clipboard. Press and hold the review text to copy it, or write directly on Google." : copyState?.status === "copied" ? `Review ${copyState.id} copied. It's ready to personalize on Google.` : "A starting point, always your honest opinion."}</p><GoogleReviewCTA /></div></div></section>;
}
