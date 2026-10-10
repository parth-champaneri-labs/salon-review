import { useState } from "react";
import { services } from "@/data/review-options";
import { MAX_SERVICES } from "@/lib/review-contract";

export function ServiceSelector({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const [expanded, setExpanded] = useState(() => services.slice(6).some(service => value.includes(service)));
  const visibleServices = expanded ? services : services.slice(0, 6);
  const atLimit = value.length >= MAX_SERVICES;

  function toggle(service: string) {
    if (value.includes(service)) {
      onChange(value.filter(item => item !== service));
      return;
    }
    if (value.length >= MAX_SERVICES) return;
    onChange([...value, service]);
  }

  return (
    <fieldset className="mt-7">
      <legend className="sr-only">Choose up to {MAX_SERVICES} services</legend>
      <p id="service-limit-hint" className="mb-3 text-xs text-muted">
        Choose up to {MAX_SERVICES} services. {value.length > 0 && `${value.length} selected.`}
      </p>
      <div id="service-options" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {visibleServices.map(service => {
          const selected = value.includes(service);
          const disabled = !selected && atLimit;
          return (
            <label
              key={service}
              className={`choice relative flex min-h-16 cursor-pointer items-center justify-between gap-2 p-3 text-sm sm:p-4 ${selected ? "chosen" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              aria-disabled={disabled}
            >
              <input
                type="checkbox"
                name="services"
                value={service}
                checked={selected}
                disabled={disabled}
                onChange={() => toggle(service)}
                aria-describedby="service-limit-hint"
                className="peer sr-only"
              />
              <span>{service}</span>
              <span aria-hidden="true" className="choice-mark shrink-0">{selected ? "✓" : "+"}</span>
            </label>
          );
        })}
      </div>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="service-options"
        onClick={() => setExpanded(!expanded)}
        className="underlink mt-4"
      >
        {expanded ? "Fewer services −" : "More services +"}
      </button>
      {!expanded && services.slice(6).some(service => value.includes(service)) && (
        <p className="text-sm">Selected: {value.join(", ")}</p>
      )}
    </fieldset>
  );
}