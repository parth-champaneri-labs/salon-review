"use client";

import { useEffect, useRef, useState } from "react";
import { parseGenerationState, parseReviewDrafts, type GenerationState, type ReviewDraft } from "@/lib/review-contract";
import { Arrow } from "../icons";
import { ServiceSelector } from "./ServiceSelector";
import { ReviewResults } from "./ReviewResults";
import type { GenerationStatus, ReviewStep } from "./types";

const steps: ReviewStep[] = ["details", "review"];
const stepLabels = ["Visit details", "Your review"];

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.readOnly = true;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    try {
      return document.execCommand("copy");
    } finally {
      field.remove();
    }
  }
}

export function ReviewFlow() {
  const [step, setStep] = useState<ReviewStep>("details");
  const [service, setService] = useState("");
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [copyFeedbackId, setCopyFeedbackId] = useState(0);
  const [reviews, setReviews] = useState<ReviewDraft[]>([]);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle");
  const [generation, setGeneration] = useState<GenerationState | null>(null);
  const [arrivalId, setArrivalId] = useState(0);
  const inFlight = useRef(false);
  const generatedContext = useRef<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const previousStep = useRef(step);
  const copyId = useRef(0);
  const stepIndex = steps.indexOf(step);
  const reviewContext = JSON.stringify({ service });
  const loading = generationStatus === "loading";

  useEffect(() => {
    if (copyStatus !== "copied") return;
    const timer = window.setTimeout(() => setCopyStatus(""), 1700);
    return () => window.clearTimeout(timer);
  }, [copyStatus, copyFeedbackId]);

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    headingRef.current?.focus({ preventScroll: true });
    progressRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [step]);

  // Context changes invalidate the selection without changing the current suggestions.
  function changeContext() {
    setSelectedReview(null);
    setGenerationStatus("idle");
    clearCopyStatus();
  }

  function clearCopyStatus() {
    copyId.current++;
    setCopyStatus("");
  }

  function navigate(next: ReviewStep) {
    clearCopyStatus();
    if (next === "details") setArrivalId(0);
    setStep(next);
  }

  async function continueToReview(regenerate = false) {
    if (!service || inFlight.current) return;
    if (regenerate && generation?.remaining === 0) return;
    
    // Normal continue pe cache use karo, regenerate pe nahi
    if (!regenerate && generatedContext.current === reviewContext && reviews.length === 3) {
      setGenerationStatus("success");
      setArrivalId(0);
      navigate("review");
      return;
    }
    
    inFlight.current = true;
    clearCopyStatus();
    setSelectedReview(null);
    setGenerationStatus("loading");
    navigate("review");
    
    try {
      // YAHI MAIN CHANGE HAI
      const payload = {
        service,
        previousReviews: regenerate ? reviews.map(r => r.text) : [], // purane 3 bhej do
        attemptId: `${Date.now()}-${Math.random().toString(36).slice(2)}` // cache bust
      };

      const response = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // reviewContext ki jagah payload
        signal: AbortSignal.timeout(50000),
      });
      
      const body: unknown = await response.json();
      if (typeof body !== "object" || body === null || Array.isArray(body)) throw new Error("Invalid review response");
      const result = body as Record<string, unknown>;
      if (response.status === 429 && result.limitReached === true) {
        setGeneration(parseGenerationState(result.generation));
        setGenerationStatus("limit");
        return;
      }
      if (!response.ok) throw new Error("Review request failed");
      const nextReviews = parseReviewDrafts(body);
      const nextGeneration = parseGenerationState(result.generation);
      setReviews(nextReviews);
      setGeneration(nextGeneration);
      generatedContext.current = reviewContext;
      setSelectedReview(null);
      setGenerationStatus("success");
      setArrivalId(id => id + 1);
    } catch {
      setGenerationStatus("error");
    } finally {
      inFlight.current = false;
    }
  }

  async function selectReview(id: string) {
    const review = reviews.find(item => item.type === id);
    if (!review || loading) return;
    const currentCopy = ++copyId.current;
    setCopyStatus("");
    try {
      const copied = await copyText(review.text);
      if (currentCopy !== copyId.current) return;
      if (!copied) throw new Error("Clipboard unavailable");
      setSelectedReview(id);
      setCopyFeedbackId(value => value + 1);
      setCopyStatus("copied");
    } catch {
      if (currentCopy === copyId.current) {
        setSelectedReview(null);
        setCopyStatus("Couldn't copy automatically. Tap a review to try again.");
      }
    }
  }

  const heading = step === "details"
    ? "What did you visit us for?"
    : generationStatus === "loading"
      ? "Finding the right words."
      : generationStatus === "success"
        ? "Choose a starting point."
        : "Make it sound like you.";

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
            <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{generationStatus === "loading" ? "Creating your review suggestions." : generationStatus === "success" ? "Your review suggestions are ready. Choose one to copy it." : generationStatus === "limit" ? "Generation limit reached. You can continue to Google." : generationStatus === "error" ? "We couldn't create suggestions. You can try again or write on Google." : ""}</p>
            <div key={step} className="step-content mt-7">
              <p className="eyebrow mb-4 text-muted">STEP 0{stepIndex + 1}</p>
              <h3 ref={headingRef} tabIndex={-1} className="step-heading">{heading}</h3>
              {step === "details" && <>
                <p className="mt-4 text-sm text-muted">Choose your primary service.</p>
                <fieldset disabled={loading} aria-busy={loading} className="min-w-0 border-0 p-0">
                  <legend className="sr-only">Your visit details</legend>
                  <ServiceSelector value={service} onChange={value => { if (value !== service) { changeContext(); setService(value); } }} />
                  <div className="mt-8">
                    <p className="text-sm">Need a little inspiration?</p>
                    <p className="mt-1 text-sm text-muted">Generate a few review suggestions based on your visit.</p>
                  </div>
                  <div className="mt-4">
                    <button type="button" className="action w-full sm:w-auto" disabled={!service || loading} onClick={() => void continueToReview()}>Continue <Arrow /></button>
                  </div>
                </fieldset>
              </>}
              {step === "review" && <>
                <ReviewResults reviews={generationStatus === "error" ? [] : reviews} selected={selectedReview} copyStatus={copyStatus} copyFeedbackId={copyFeedbackId}
                  generationStatus={generationStatus} generation={generation} arrivalId={arrivalId}
                  onRetry={() => void continueToReview(true)}
                  onRegenerate={() => void continueToReview(true)}
                  onSelect={id => void selectReview(id)} />
                <button type="button" className="underlink mt-5" onClick={() => navigate("details")}>← Back</button>
              </>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
