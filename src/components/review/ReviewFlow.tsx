"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import { sampleReviews } from "@/data/reviews";
import { ratingLabels } from "@/data/review-options";
import { Arrow } from "../icons";
import { StarRating } from "./StarRating";
import { ServiceSelector } from "./ServiceSelector";
import { ExperienceSelector } from "./ExperienceSelector";
import { PrivateFeedback } from "./PrivateFeedback";
import { AiReviewGenerator } from "./AiReviewGenerator";
import { ReviewResults } from "./ReviewResults";
import { validateSuggestions, type Rating, type ReviewGateway, type ReviewInput, type ReviewStep, type ReviewSuggestion } from "./types";

const steps: ReviewStep[] = ["rating", "service", "experience", "results"];
const stepLabels = ["Your visit", "Your service", "The details", "Your review"];

// Pass an API adapter here when endpoints are available. No mock network requests or fabricated responses.
export function ReviewFlow({ gateway }: { gateway?: Partial<ReviewGateway> }) {
  const [step, setStep] = useState<ReviewStep>("rating");
  const [rating, setRating] = useState<Rating | null>(null);
  const [service, setService] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [reviews, setReviews] = useState<ReviewSuggestion[]>([]);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [samples, setSamples] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef<ReviewStep>(step);
  const requestId = useRef(0);
  const copyId = useRef(0);
  const stepIndex = steps.indexOf(step);
  const lowRating = rating !== null && rating <= 3;
  const busy = loading || feedbackStatus === "loading";
  const draft = drafts[selectedReview ?? "manual"] ?? "";

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [step]);

  function invalidateResults() {
    requestId.current++;
    copyId.current++;
    setReviews([]);
    setSelectedReview(null);
    setDrafts({});
    setCopyStatus("");
    setError("");
    setFeedbackStatus("idle");
  }

  function input(): ReviewInput | null {
    return rating && service ? { rating, service, tags: lowRating ? [] : [...tags], note: note.trim() } : null;
  }

  function showResults(nextReviews: ReviewSuggestion[], isSample: boolean) {
    setReviews(nextReviews);
    setDrafts(Object.fromEntries(nextReviews.map(review => [review.id, review.text])));
    setSelectedReview(nextReviews[0]?.id ?? null);
    setSamples(isSample);
    setCopyStatus("");
    setStep("results");
  }

  async function generate() {
    const payload = input();
    if (!gateway?.generate || !payload || lowRating || loading) return;
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const generated = validateSuggestions(await gateway.generate(payload));
      if (currentRequest === requestId.current) showResults(generated, false);
    } catch {
      if (currentRequest === requestId.current) setError("We couldn’t write your review just now. Please try again, or write your own. Your answers are still here.");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }

  async function submitFeedback() {
    const payload = input();
    if (!gateway?.submitFeedback || !payload || !lowRating || busy) return;
    const currentRequest = ++requestId.current;
    setFeedbackStatus("loading");
    try {
      await gateway.submitFeedback(payload);
      if (currentRequest === requestId.current) setFeedbackStatus("success");
    } catch {
      if (currentRequest === requestId.current) setFeedbackStatus("error");
    }
  }

  async function copyReview() {
    if (!draft.trim()) return;
    const currentCopy = ++copyId.current;
    setCopyStatus("");
    try {
      await navigator.clipboard.writeText(draft.trim());
      if (currentCopy === copyId.current) setCopyStatus("Review copied");
    } catch {
      if (currentCopy === copyId.current) setCopyStatus("Copy isn’t available in this browser. Select the text in your review and copy it manually.");
    }
  }

  const heading = step === "rating" ? "How was your visit?"
    : step === "service" ? "What service did you visit us for?"
    : step === "results" ? "Make it sound like you."
    : lowRating ? "We’d like to do better." : "What stood out?";

  return (
    <section id="reviews" className="scroll-mt-0 bg-ivory" aria-labelledby="review-title">
      <div className="flow-shell">
        <div className="grid items-start gap-10 lg:grid-cols-[.8fr_1.25fr] lg:gap-24">
          <aside className="lg:sticky lg:top-12">
            <p className="eyebrow text-[#7c6a4e]">YOUR EXPERIENCE, IN YOUR WORDS</p>
            <h2 id="review-title" className="flow-display mt-5">A few words.<br /><em>A lasting difference.</em></h2>
            <p className="mt-5 hidden max-w-xs text-sm leading-relaxed text-muted lg:block">A fresh look. A little confidence. A moment for yourself. Tell us how your visit felt.</p>
            <div className="mt-7 hidden items-center gap-3 text-xs text-muted lg:flex"><span className="h-px w-8 bg-[#a59273]" />JUST A FEW MOMENTS. ALL YOUR WORDS.</div>
            {rating && <div className="mt-7 hidden border-t border-line pt-5 text-sm text-muted lg:block"><p>{rating} / 5 — {ratingLabels[rating]}</p>{service && <p className="mt-2">{service}</p>}</div>}
          </aside>

          <div className="min-w-0">
            <ol className="step-nav" aria-label="Review progress">
              {(lowRating ? steps.slice(0, 3) : steps).map((item, index) => (
                <li key={item} className={index === stepIndex ? "active" : ""} aria-current={index === stepIndex ? "step" : undefined}>
                  <span className="block">0{index + 1}{index < stepIndex ? " ✓" : ""}</span>
                  <span className="mt-1 block">{lowRating && index === 2 ? "Feedback" : stepLabels[index]}</span>
                </li>
              ))}
            </ol>
            <div key={step} className="step-content mt-9">
              <div className="mb-4 flex items-center justify-between text-xs text-muted">
                <span>STEP 0{stepIndex + 1} {lowRating && step === "experience" ? "· YOUR FEEDBACK" : ""}</span>
                {stepIndex > 0 && <button type="button" disabled={busy} className="underlink" onClick={() => { copyId.current++; setCopyStatus(""); setError(""); setStep(steps[stepIndex - 1]); }}>← Back</button>}
              </div>
              <h3 ref={headingRef} tabIndex={-1} className="step-heading scroll-mt-8">{heading}</h3>
              <fieldset disabled={busy} className="min-w-0 border-0 p-0">
                <legend className="sr-only">{heading}</legend>
                {step === "rating" && <>
                  <p className="mt-4 text-sm text-muted">Tap a star to rate your experience.</p>
                  <StarRating value={rating} onChange={value => { if (value !== rating) { invalidateResults(); setRating(value); setTags([]); } }} />
                  <button type="button" className="action mt-8 w-full sm:w-auto" disabled={!rating} onClick={() => setStep("service")}>Continue <Arrow /></button>
                </>}
                {step === "service" && <>
                  <p className="mt-4 text-sm text-muted">Choose your primary service. We’ll take it from there.</p>
                  <ServiceSelector value={service} onChange={value => { if (value !== service) { invalidateResults(); setService(value); } }} />
                  <button type="button" className="action mt-6 w-full sm:w-auto" disabled={!service} onClick={() => setStep("experience")}>Continue <Arrow /></button>
                </>}
                {step === "experience" && (lowRating ? <>
                  <p className="mt-4 text-sm text-muted">Tell us what could have made your experience better. We’re here to listen.</p>
                  <PrivateFeedback service={service} note={note} onNote={value => { invalidateResults(); setNote(value); }} onSubmit={submitFeedback} available={!!gateway?.submitFeedback} status={feedbackStatus} />
                </> : <>
                  <p className="mt-4 text-sm text-muted">Choose any that feel right, or simply skip to writing.</p>
                  <ExperienceSelector tags={tags} note={note} onToggle={tag => { invalidateResults(); setTags(previous => previous.includes(tag) ? previous.filter(value => value !== tag) : [...previous, tag]); }} onNote={value => { invalidateResults(); setNote(value); }} />
                  <AiReviewGenerator available={!!gateway?.generate} loading={loading} error={error} onGenerate={generate} onSamples={() => showResults(sampleReviews, true)} onWrite={() => showResults([], false)} />
                </>)}
                {step === "results" && <>
                  <ReviewResults reviews={reviews} selected={selectedReview} draft={draft} samples={samples} loading={loading} canGenerate={!!gateway?.generate} status={copyStatus} onSelect={id => { copyId.current++; setSelectedReview(id); setCopyStatus(""); }} onEdit={text => { copyId.current++; setDrafts(previous => ({ ...previous, [selectedReview ?? "manual"]: text })); setCopyStatus(""); }} onCopy={copyReview} onRegenerate={generate} />
                  <p role="status" className="mt-2 text-sm">{error}</p>
                </>}
              </fieldset>
              {step !== "results" && <div className="mt-8 border-t border-line pt-5">
                <a href={siteConfig.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="underlink">Leave a Google Review <Arrow diagonal /><span className="sr-only"> (opens in a new tab)</span></a>
                <p className="mt-1 text-xs leading-relaxed text-muted">Always your choice. You can review us directly on Google at any time.</p>
              </div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
