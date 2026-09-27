import { siteConfig } from "@/config/site";

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col justify-between px-5 py-8 sm:px-10 sm:py-10">
      <p className="text-xs font-semibold tracking-[0.18em] uppercase">Lumenspire</p>
      <div className="max-w-2xl py-20">
        <p className="eyebrow text-[#756448]">A quieter corner of the internet</p>
        <h1 className="flow-display mt-5">Something thoughtful is taking shape.</h1>
        <p className="mt-6 max-w-lg text-base text-muted">Looking for the Hair Driver review page? You can continue directly to your review experience.</p>
        <a className="action mt-8" href={siteConfig.reviewPath}>Open Hair Driver review →</a>
      </div>
      <p className="text-xs text-muted">© {new Date().getFullYear()} Lumenspire</p>
    </main>
  );
}
