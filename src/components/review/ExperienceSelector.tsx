import { experienceTags } from "@/data/review-options";

export function CustomerNote({ value, onChange, label = "Anything else you’d like to mention?" }: { value: string; onChange: (value: string) => void; label?: string }) {
  return (
    <div className="mt-7">
      <label htmlFor="customer-note" className="block text-sm font-medium">{label} <span className="font-normal text-muted">(optional)</span></label>
      <textarea id="customer-note" rows={4} maxLength={1500} value={value} onChange={event => onChange(event.target.value)} placeholder="A small detail, a favourite moment, or something we could improve…" className="text-field mt-3" aria-describedby="note-limit" />
      <p id="note-limit" className="mt-2 text-right text-xs text-muted">{value.length} / 1,500</p>
    </div>
  );
}

export function ExperienceSelector({ tags, onToggle, note, onNote }: { tags: string[]; onToggle: (tag: string) => void; note: string; onNote: (value: string) => void }) {
  return (
    <>
      <fieldset className="mt-7">
        <legend className="sr-only">What stood out? Choose any that apply</legend>
        <div className="flex flex-wrap gap-2.5">
          {experienceTags.map(tag => (
            <label key={tag} className={`choice tag-choice relative flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 text-sm ${tags.includes(tag) ? "chosen" : ""}`}>
              <input type="checkbox" checked={tags.includes(tag)} onChange={() => onToggle(tag)} className="sr-only" />
              <span>{tag}</span><span aria-hidden="true">{tags.includes(tag) ? "✓" : "+"}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <CustomerNote value={note} onChange={onNote} />
    </>
  );
}
