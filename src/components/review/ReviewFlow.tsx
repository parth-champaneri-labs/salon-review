"use client";

import { useEffect, useRef, useState } from "react";
import { buildReviewSuggestions } from "@/data/build-review-suggestions";
import { Arrow } from "../icons";
import { ServiceSelector } from "./ServiceSelector";
import { ExperienceSelector } from "./ExperienceSelector";
import { ReviewResults } from "./ReviewResults";
import type { ReviewStep } from "./types";

const steps: ReviewStep[] = ["details", "review"];
const stepLabels = ["Visit details", "Your review"];

export function ReviewFlow() {
  const [step, setStep] = useState<ReviewStep>("details");
  const [service, setService] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const previousStep = useRef(step);
  const copyId = useRef(0);
  const stepIndex = steps.indexOf(step);
  const reviewContext = service ? { service, highlights } : null;
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

  const heading = step === "details" ? "What did you visit us for?" : "Make it sound like you.";

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
            {service && <div className="border-t border-line pt-5 text-sm text-muted lg:mt-7">
              <p className="eyebrow">YOUR VISIT</p>
              <p className="eyebrow mt-4">SERVICE</p><p>{service}</p>
              {highlights.length > 0 && <><p className="eyebrow mt-4">WHAT STOOD OUT</p><p>{highlights.join(" · ")}</p></>}
            </div>}
          </aside>

          <div className="order-1 min-w-0 lg:order-2">
            <div ref={progressRef} className="scroll-mt-6">
              <div className="mobile-progress sm:hidden" aria-label="Review progress" aria-current="step">
                <p className="text-xs text-muted">Step {stepIndex + 1} of 2</p>
                <p className="mt-1 text-sm">{stepLabels[stepIndex]}</p>
                <div className="mt-3 flex gap-3" aria-hidden="true">{steps.map((item, index) => <span key={item} className={`h-px flex-1 ${index <= stepIndex ? "bg-[#756448]" : "bg-line"}`} />)}</div>
              </div>
              <ol className="step-nav desktop-progress" aria-label="Review progress">
                {steps.map((item, index) => (
                  <li key={item} className={index === stepIndex ? "active" : index < stepIndex ? "complete" : ""} aria-current={index === stepIndex ? "step" : undefined}>
                    <span className="block">{index < stepIndex ? <><span aria-hidden="true">✓</span><span className="sr-only">Completed</span></> : `0${index + 1}`}</span>
                    <span className="mt-1 block">{stepLabels[index]}</span>
                  </li>
                ))}
              </ol>
            </div>
            <p className="mt-4 text-xs text-muted">2 quick steps. Just a few moments.</p>
            <div key={step} className="step-content mt-7">
              <p className="eyebrow mb-4 text-muted">STEP 0{stepIndex + 1}</p>
              <h3 ref={headingRef} tabIndex={-1} className="step-heading">{heading}</h3>
              {step === "details" && <>
                <p className="mt-4 text-sm text-muted">Choose your primary service.</p>
                <ServiceSelector value={service} onChange={value => { if (value !== service) { changeContext(); setService(value); } }} />
                <ExperienceSelector highlights={highlights} onToggle={highlight => {
                  changeContext();
                  setHighlights(previous => previous.includes(highlight) ? previous.filter(value => value !== highlight) : [...previous, highlight]);
                }} />
                <div className="mt-8">
                  <button type="button" className="action w-full sm:w-auto" disabled={!service} onClick={() => navigate("review")}>Continue <Arrow /></button>
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
