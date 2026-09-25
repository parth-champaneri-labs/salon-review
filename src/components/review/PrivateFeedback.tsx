import { CustomerNote } from "./ExperienceSelector";

export function PrivateFeedback({ service, note, onNote, onSubmit, available, status }: {
  service: string; note: string; onNote: (value: string) => void; onSubmit: () => void;
  available: boolean; status: "idle" | "loading" | "success" | "error";
}) {
  return (
    <div>
      <p className="mt-5 text-sm text-muted">Your service: <span className="font-medium text-ink">{service}</span></p>
      <CustomerNote value={note} onChange={onNote} label="What could have made your experience better?" />
      <p id="feedback-availability" className="mt-4 text-sm leading-relaxed text-muted">{available ? "Share this feedback with our team. You can also leave a public review on Google below." : "Online feedback submission isn’t available yet. Your note stays on this page and hasn’t been sent. You can share it with the team in person or leave a Google review below."}</p>
      <button type="button" className="action mt-6 w-full sm:w-auto" onClick={onSubmit} disabled={!available || status === "loading" || status === "success"} aria-describedby="feedback-availability">
        {status === "loading" ? "Sending feedback…" : status === "success" ? "Feedback sent ✓" : "Submit feedback"}
      </button>
      <p role="status" className="mt-4 text-sm">{status === "success" ? "Thank you. Your feedback has been sent to the team." : status === "error" ? "Your feedback couldn’t be sent. Your note is still here; please try again." : ""}</p>
    </div>
  );
}
