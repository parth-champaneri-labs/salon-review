"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import { buildReviewSuggestions } from "@/data/build-review-suggestions";
import { ratingLabels } from "@/data/review-options";
import { Arrow } from "../icons";
import { StarRating } from "./StarRating";
import { ServiceSelector } from "./ServiceSelector";
import { ExperienceSelector } from "./ExperienceSelector";
import { ReviewResults } from "./ReviewResults";
import type { Rating, ReviewStep } from "./types";

const steps: ReviewStep[] = ["rating", "details", "review"];
const stepLabels = ["Experience", "Visit details", "Your review"];

export function ReviewFlow() {
  const [step, setStep] = useState<ReviewStep>("rating");
  const [rating, setRating] = useState<Rating | null>(null);
  const [service, setService] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const progressRef = useRef<HTMLOListElement>(null);
  const previousStep = useRef(step);
  const copyId = useRef(0);
  const stepIndex = steps.indexOf(step);
  const reviewContext = rating && service ? { rating, service, highlights } : null;
  const reviews = reviewContext ? buildReviewSuggestions(reviewContext) : [];

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    headingRef.current?.focus({ preventScroll: true });
    progressRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [step]);

  useEffect(() => {
    if (copyStatus !== "Review copied.") return;
    const timer = window.setTimeout(() => setCopyStatus(""), 4000);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);

  // Context changes refresh suggestions, but never replace a customer's draft.
  function changeContext() {
    setSelectedReview(null);
    clearCopyStatus();
  }

  function clearCopyStatus() {
    copyId.current++;
    setCopyStatus("");
  }

  function navigate(next: ReviewStep) {
    clearCopyStatus();
    setStep(next);
  }

  async function copyReview() {
    if (!draft.trim()) return;
    const currentCopy = ++copyId.current;
    setCopyStatus("");
    try {
      await navigator.clipboard.writeText(draft);
      if (currentCopy === copyId.current) setCopyStatus("Review copied.");
    } catch {
      if (currentCopy === copyId.current) setCopyStatus("Select the text in your review and copy it manually.");
    }
  }

  const heading = step === "rating" ? "How was your visit?"
    : step === "details" ? "What did you visit us for?" : "Make it sound like you.";

  return (
    <section id="reviews" className="scroll-mt-0 bg-ivory" aria-labelledby="review-title">
      <div className="flow-shell">
        <div className="grid items-start gap-8 lg:grid-cols-[.8fr_1.25fr] lg:gap-24">
          <aside className="order-2 lg:order-1 lg:sticky lg:top-12">
            <div className="hidden lg:block">
              <p className="eyebrow text-[#7c6a4e]">YOUR EXPERIENCE, IN YOUR WORDS</p>
              <h2 id="review-title" className="flow-display mt-5">A few words.<br /><em>A lasting difference.</em></h2>
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">A fresh look. A little confidence. A moment for yourself.<br />Tell us how your visit felt.</p>
              <div className="mt-7 flex items-center gap-3 text-xs text-muted"><span className="h-px w-8 shrink-0 bg-[#a59273]" />JUST A FEW MOMENTS. ALL YOUR WORDS.</div>
            </div>
            {rating && <div className="border-t border-line pt-5 text-sm text-muted lg:mt-7">
              <p className="eyebrow">YOUR EXPERIENCE</p>
              <p aria-hidden="true" className="mt-2 text-xl tracking-widest text-[#8f764c]">{"★".repeat(rating)}{"☆".repeat(5 - rating)}</p>
              <p>{rating} / 5 — {ratingLabels[rating]}</p>
              {service && <><p className="eyebrow mt-4">SERVICE</p><p>{service}</p></>}
              {highlights.length > 0 && <><p className="eyebrow mt-4">HIGHLIGHTS</p><p>{highlights.join(" · ")}</p></>}
            </div>}
          </aside>

          <div className="order-1 min-w-0 lg:order-2">
            <ol ref={progressRef} className="step-nav scroll-mt-6" aria-label="Review progress">
              {steps.map((item, index) => (
                <li key={item} className={index === stepIndex ? "active" : index < stepIndex ? "complete" : ""} aria-current={index === stepIndex ? "step" : undefined}>
                  <span className="block">{index < stepIndex ? <><span aria-hidden="true">✓</span><span className="sr-only">Completed</span></> : `0${index + 1}`}</span>
                  <span className="mt-1 block">{stepLabels[index]}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-muted">3 quick steps · About 30 seconds. You can edit everything before Google.</p>
            <div key={step} className="step-content mt-7">
              <p className="eyebrow mb-4 text-muted">STEP 0{stepIndex + 1}</p>
              <h3 ref={headingRef} tabIndex={-1} className="step-heading">{heading}</h3>
              {step === "rating" && <>
                <p className="mt-4 text-sm text-muted">Tap a star to rate your experience.</p>
                <StarRating value={rating} onChange={value => { if (value !== rating) { changeContext(); setRating(value); } }} />
                <button type="button" className="action mt-8 w-full sm:w-auto" disabled={!rating} onClick={() => navigate("details")}>Continue <Arrow /></button>
              </>}
              {step === "details" && <>
                <p className="mt-4 text-sm text-muted">Choose your primary service.</p>
                <ServiceSelector value={service} onChange={value => { if (value !== service) { changeContext(); setService(value); } }} />
                <ExperienceSelector highlights={highlights} onToggle={highlight => {
                  changeContext();
                  setHighlights(previous => previous.includes(highlight) ? previous.filter(value => value !== highlight) : [...previous, highlight]);
                }} />
                <div className="mt-8 flex items-center justify-between gap-4">
                  <button type="button" className="underlink" onClick={() => navigate("rating")}>← Back</button>
                  <button type="button" className="action" disabled={!service} onClick={() => navigate("review")}>Continue <Arrow /></button>
                </div>
              </>}
              {step === "review" && <>
                <p className="mt-4 text-sm text-muted">Choose a starting point, then edit it in your own words.</p>
                <ReviewResults reviews={reviews} selected={selectedReview} draft={draft} status={copyStatus}
                  onSelect={id => {
                    const review = reviews.find(item => item.id === id);
                    if (!review) return;
                    clearCopyStatus();
                    setSelectedReview(id);
                    setDraft(review.text);
                  }}
                  onEdit={text => { clearCopyStatus(); setDraft(text); }}
                  onCopy={copyReview} />
                <button type="button" className="underlink mt-5" onClick={() => navigate("details")}>← Back</button>
              </>}
              {step !== "review" && <div className="mt-8 border-t border-line pt-5">
                <a href={siteConfig.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="underlink">Leave a Google Review <Arrow diagonal /><span className="sr-only"> (opens in a new tab)</span></a>
                <p className="mt-1 text-xs leading-relaxed text-muted">Prefer to go directly to Google? You can leave your review there anytime.</p>
              </div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
