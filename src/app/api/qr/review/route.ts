import { siteConfig } from "@/config/site";
import { createReviewQrSvg } from "@/lib/qr/review-qr";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const svg = await createReviewQrSvg();
  const download = new URL(request.url).searchParams.get("download") === "1";

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${siteConfig.clientSlug}-review-qr.svg"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src data:",
      "Cache-Control": process.env.NODE_ENV === "production" ? "public, max-age=3600, must-revalidate" : "no-store",
    },
  });
}
