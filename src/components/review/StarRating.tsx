import { ratingLabels } from "@/data/review-options";
import type { Rating } from "./types";

export function StarRating({ value, onChange }: { value: Rating | null; onChange: (rating: Rating) => void }) {
  return (
    <fieldset className="mt-8">
      <legend className="sr-only">Rate your visit from 1 to 5 stars</legend>
      <div className="stars flex flex-wrap gap-1 sm:gap-3">
        {([1, 2, 3, 4, 5] as const).map(rating => (
          <label key={rating} className="star-label relative flex h-12 w-12 cursor-pointer items-center justify-center sm:h-16 sm:w-16">
            <input type="radio" name="rating" value={rating} checked={value === rating} onChange={() => onChange(rating)} className="peer sr-only" aria-label={`${rating} ${rating === 1 ? "star" : "stars"} — ${ratingLabels[rating]}`} />
            <svg aria-hidden="true" className={`star-icon h-10 w-10 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 sm:h-12 sm:w-12 ${value && rating <= value ? "star-filled" : ""}`} viewBox="0 0 32 32"><path d="m16 3 4 8.4 9.2 1.3-6.6 6.4 1.5 9.1-8.1-4.3-8.1 4.3 1.5-9.1-6.6-6.4 9.2-1.3Z" /></svg>
          </label>
        ))}
      </div>
      <p role="status" className="mt-5 min-h-7 text-base text-[#6c5840]">{value ? `${value} / 5 — ${ratingLabels[value]}` : "Your honest opinion makes a difference."}</p>
    </fieldset>
  );
}
