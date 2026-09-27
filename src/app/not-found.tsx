import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  icons: { icon: "/logo/favicon.ico" },
};

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col justify-between px-5 py-8 sm:px-10 sm:py-10">
      <p className="text-xs font-semibold tracking-[0.18em] uppercase">Lumenspire</p>
      <div className="max-w-2xl py-20">
        <p className="eyebrow text-[#756448]">404 / PAGE NOT FOUND</p>
        <h1 className="flow-display mt-5">A little off the path.</h1>
        <p className="mt-6 max-w-lg text-base text-muted">The page you’re looking for doesn’t exist or may have moved.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a className="action" href={siteConfig.siteUrl}>Go to Lumenspire →</a>
          <a className="action action-outline" href={siteConfig.reviewPath}>Open review page →</a>
        </div>
      </div>
      <p className="text-xs text-muted">© {new Date().getFullYear()} Lumenspire</p>
    </main>
  );
}
