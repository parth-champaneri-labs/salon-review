import { experienceTags } from "@/data/review-options";

export function ExperienceSelector({ highlights, onToggle }: { highlights: string[]; onToggle: (highlight: string) => void }) {
  return (
    <fieldset className="mt-8">
      <legend className="font-editorial text-[30px] leading-tight">What stood out?</legend>
      <p className="mt-3 text-sm text-muted">Select anything that stood out. This part is optional.</p>
      <div className="mt-5 flex flex-wrap gap-2.5">
        {experienceTags.map(highlight => (
          <label key={highlight} className={`choice tag-choice relative flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 text-sm ${highlights.includes(highlight) ? "chosen" : ""}`}>
            <input type="checkbox" checked={highlights.includes(highlight)} onChange={() => onToggle(highlight)} className="sr-only" />
            <span>{highlight}</span><span aria-hidden="true">{highlights.includes(highlight) ? "✓" : "+"}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

