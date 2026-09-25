import Image from "next/image";

export function ThankYouSection() {
  return (
    <>
      <section className="thank-you bg-charcoal px-5 py-16 text-center text-ivory sm:py-24" aria-labelledby="thank-you-title">
        <p className="eyebrow text-[#cabb9f]">THANK YOU FOR YOUR TIME</p>
        <span className="mx-auto my-7 block h-10 w-px bg-[#837665]" aria-hidden="true" />
        <h2 id="thank-you-title" className="closing-title">Thank you for<br /><em>sharing your experience.</em></h2>
        <p className="mt-7 text-sm leading-relaxed text-[#ccc5b8]">Your feedback helps us improve<br />and means a lot to our team.</p>
      </section>
      <footer className="bg-charcoal px-5 text-ivory sm:px-10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-5 border-t border-white/15 py-7 text-xs text-[#ccc5b8] sm:flex-row">
          <Image src="/logo/logofill.png" width={2172} height={724} sizes="135px" alt="Hair Driver — Family Salon & Academy" className="h-auto w-[135px]" />
          <p>© {new Date().getFullYear()} Hair Driver</p>
          <a href="#" className="underlink">Back to top ↑</a>
        </div>
      </footer>
    </>
  );
}
