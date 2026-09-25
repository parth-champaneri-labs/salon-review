import { Arrow } from "../icons";

export function AiReviewGenerator({ available, loading, error, onGenerate, onSamples, onWrite }: {
  available: boolean; loading: boolean; error: string; onGenerate: () => void; onSamples: () => void; onWrite: () => void;
}) {
  return (
    <div className="mt-8 border-t border-line pt-7">
      <h4 className="font-editorial text-[30px] leading-tight">We’ll help put your experience into words.</h4>
      <p id="generation-availability" className="mt-3 text-sm leading-relaxed text-muted">{available ? "We’ll use your rating, service and details to suggest three ways to tell your story." : "AI writing isn’t available yet. You can explore three sample reviews or write your own. Samples aren’t generated from your answers."}</p>
      <button type="button" className="action mt-6 w-full sm:w-auto" disabled={!available || loading} aria-describedby="generation-availability" onClick={onGenerate}>
        {loading ? <><span className="loader" aria-hidden="true" /> Writing your review…</> : <>Generate my review <Arrow diagonal /></>}
      </button>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
        {!available && <button type="button" onClick={onSamples} className="underlink">Explore sample reviews <span aria-hidden="true">↗</span></button>}
        <button type="button" onClick={onWrite} disabled={loading} className="underlink">Write my own</button>
      </div>
      <p role="status" className="mt-2 text-sm">{loading ? "Writing your review…" : error}</p>
    </div>
  );
}
