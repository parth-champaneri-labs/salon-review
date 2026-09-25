import { useState } from "react";
import { services } from "@/data/review-options";

export function ServiceSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [expanded, setExpanded] = useState(() => services.slice(6).some(service => service === value));
  const visibleServices = expanded ? services : services.slice(0, 6);
  return (
    <fieldset className="mt-7">
      <legend className="sr-only">Choose one primary service</legend>
      <div id="service-options" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {visibleServices.map(service => (
          <label key={service} className={`choice relative flex min-h-16 cursor-pointer items-center justify-between gap-2 p-3 text-sm sm:p-4 ${value === service ? "chosen" : ""}`}>
            <input type="radio" name="service" value={service} checked={value === service} onChange={() => onChange(service)} className="peer sr-only" />
            <span>{service}</span><span aria-hidden="true" className="choice-mark shrink-0">{value === service ? "✓" : "+"}</span>
          </label>
        ))}
      </div>
      <button type="button" aria-expanded={expanded} aria-controls="service-options" onClick={() => setExpanded(!expanded)} className="underlink mt-4">{expanded ? "Fewer services −" : "More services +"}</button>
      {!expanded && services.slice(6).some(service => service === value) && <p className="text-sm">Selected: {value}</p>}
    </fieldset>
  );
}
