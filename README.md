# Hair Driver review experience

Next.js, TypeScript and Tailwind salon review page with two steps and server-side Gemini writing assistance. The existing editorial layout and branding are preserved.

## Local setup

1. Run npm install.
2. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` and `NEXT_PUBLIC_GOOGLE_REVIEW_URL=https://g.page/r/CXyzMGBwIejGEAE/review` in `.env.local` (see `.env.example`). Add `GEMINI_API_KEY` and `REVIEW_COOKIE_SECRET` there too. Use at least 32 random characters for the cookie secret. Keep both secrets server-only; never prefix them with `NEXT_PUBLIC_`.
3. Run npm run dev. Restart the dev server after changing any environment value. Set the same `REVIEW_COOKIE_SECRET` in the production hosting environment.
4. Open http://localhost:3000/review/hair-driver and select Start your review.

## Client URL and printed QR

`src/config/site.ts` defines the single client slug, business identity, review route, stable QR route, and derived absolute URLs. The root `/` is a small Lumenspire holding page; the existing Hair Driver review experience lives at `/review/hair-driver`. Only the configured slug works. `/r/hair-driver` is a server-side 307 redirect to the review page. Unknown slugs and routes return the branded 404 page.

Set `NEXT_PUBLIC_SITE_URL=https://lumenspirelabs.com` in production and rebuild/redeploy. It must be a plain HTTP(S) origin, without a path, query, credentials, or extra trailing slash. Change `clientSlug` in `src/config/site.ts` if the one configured client changes. All route URLs derive from this config. The final production URLs are:

- Review page: `https://lumenspirelabs.com/review/hair-driver`
- Permanent printed QR target: `https://lumenspirelabs.com/r/hair-driver`
- QR SVG: `https://lumenspirelabs.com/api/qr/review`
- QR download: `https://lumenspirelabs.com/api/qr/review?download=1`

Open the SVG endpoint in a browser to preview/save it, or use the download URL. It is generated locally with high error correction, a four-module quiet zone, white background, dark modules, and `public/logo/qr-logo.png` on a buffered center plate. If that logo unexpectedly cannot load, the endpoint returns a plain QR. `src/app/icon.png` is the browser favicon; a hard refresh or browser restart may be needed after deploying because favicons are cached heavily.

**Do not send the QR to final print yet.** Deploy the production site, configure `NEXT_PUBLIC_SITE_URL` as above, generate the final production SVG, and scan it on real phones. A printed QR's encoded URL cannot change without reprinting. The `/r/hair-driver` layer lets the internal review page move later while preserving the printed URL. Print the QR at roughly **4 cm × 4 cm or larger**, and keep the white quiet zone unobstructed by text or borders.

A phone cannot reach another computer's `localhost`. For real-device development, use a reachable LAN origin such as `http://192.168.x.x:3000`, set it as `NEXT_PUBLIC_SITE_URL`, and run Next.js on the LAN. Do not use a LAN URL for final printing.

Before printing, scan a sample at its intended size using Android's camera, Google Lens, and an iPhone camera if available. Test at normal brightness from about 20–40 cm. Each scan should open `/r/hair-driver`, then land on `/review/hair-driver`. Automated tests do not replace this physical check.

Choose a service, then Continue. The page shows a writing state while the request runs, followed by three valid drafts: Warm & natural, Short & simple, Natural Hinglish.

Selecting a suggestion copies it automatically. Continue to Google opens the salon's official review form; the customer pastes or edits their review and submits it manually. The destination is read through `siteConfig.googleReviewUrl` from `NEXT_PUBLIC_GOOGLE_REVIEW_URL`. To change it later, update that environment variable, then restart local development or rebuild and redeploy production. Use the same Google review URL in production alongside `NEXT_PUBLIC_SITE_URL=https://lumenspirelabs.com`.

Back preserves the selected service. An unchanged service reuses the existing suggestions in memory; changing the service requests new suggestions on Continue. The first successful generation and two successful regenerations use the three available generations for that browser. Failed provider requests do not use a generation. The signed, HTTP-only cookie expires after 12 hours; no database is required.

For local testing, reset the visit in Chrome DevTools → Application → Cookies → localhost by deleting `salon_review_generation`, then refresh.

## Server boundary

- src/app/api/generate-review/route.ts: POST endpoint, Node runtime.
- src/lib/ai/review-request.ts: validates the JSON body before generation and returns sanitized, non-cached responses.
- src/lib/review-generation-cookie.ts: signs and verifies the 12-hour browser generation count.
- src/lib/ai/gemini.ts: server-only SDK calls, grounding instructions, structured JSON schema and sequential fallback.
- src/lib/review-contract.ts: shared request/draft types and runtime validation.
- src/config/site.ts: centralized business name and Google destination.
- src/components/review/ReviewFlow.tsx: loading, error/retry, in-memory drafts and navigation.
- src/components/review/ReviewResults.tsx: suggestion rows, regeneration, copy feedback and Google action.

The browser sends the selected service and, when regenerating, the previous drafts. The server checks the service against the nine-value `allowedServices` enum, accepts only the supported request fields, and rejects unknown or malformed selections with HTTP 400 before calling Gemini. The UI list is not a security boundary.

gemini-3.8-flash is always attempted first. HTTP 408, 429, 5xx, timeout/abort, or invalid primary output permits one sequential attempt of gemini-3.5-flash-lite. SDK automatic retries are disabled. Each model attempt has a 12-second deadline, with a 50-second client deadline. Both use the same prompt/schema and an 800-token output budget, temperature 1.25, topP 0.97 and topK 64. The primary explicitly uses ThinkingLevel.LOW; fallback reasoning remains at its default. Gemini receives the business name and selected service, with guidance to write short, service-specific drafts. The prompt prioritizes short everyday language and avoids unsupported scene-setting or filler.

Configuration/auth/model-not-found errors do not trigger fallback. If fallback output is also invalid, the request fails. Missing configuration returns HTTP 503; provider/output failures return HTTP 502. The UI shows a generic retry message in the review step. No hardcoded review is substituted. Logs contain only sanitized categories and status labels/codes, never keys, selections, provider messages or draft text.

Output validation requires exactly one draft of each expected type, matching labels, nonempty distinct text and at most 1200 characters per draft. Hinglish text must use Roman script. Grounding, tone, approximate word counts and variation are instructed in the server prompt; factual faithfulness still needs human review with a live key.

No database is currently required for the single-client salon review application. The current frontend, Gemini generation, and signed cookie limit do not use persistent storage or authentication.

## Verification

Use Node 24 (the test resolver uses native TypeScript and registerHooks):

npm test
npx tsc --noEmit
npm run lint
npm run build

Tests mock the provider/network, not application production behavior. They cover service-only selections, invalid input/no provider call, output validation, primary-first success, retryable fallback, both failures and missing configuration.

With a real key, check:
- Haircut: three short drafts with different wording.
- Facial: service-specific wording without extra visit details.
- Hair Color: different wording from the haircut drafts.
- Select a suggestion: it should copy to the clipboard, and the row should show Copied.
- Regenerate reviews: a fresh request should run for the selected service.
- Temporarily remove the key and restart: retry message in the review step, no invented drafts.

The build requires network access for the project's existing Google Fonts.
