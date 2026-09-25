# Hair Driver review experience

Next.js, TypeScript and Tailwind salon review page with two steps and server-side Gemini writing assistance. The existing editorial layout and branding are preserved.

## Local setup

1. Run npm install.
2. Add GEMINI_API_KEY=your-key to .env.local (see .env.example). Keep existing environment entries. Never prefix this key with NEXT_PUBLIC.
3. Run npm run dev. Restart the dev server after changing the key.
4. Open http://localhost:3000 and select Start your review.

Choose a service and optional highlights, then Continue. While the request runs, selections and Continue are disabled. The page enters Your review only after receiving three valid drafts: Warm & natural, Short & simple, Natural Hinglish.

Select a draft or write your own text, edit, copy, and continue to Google. No review is posted automatically. The Google destination remains the configurable Maps search placeholder in src/config/site.ts until the salon supplies its verified review link.

Back preserves selections and edited text. Unchanged selections reuse the existing drafts in memory; changed selections request new drafts on Continue without overwriting the editor. There is no regenerate control, persistent storage, counter or limit.

## Server boundary

- src/app/api/generate-review/route.ts: POST endpoint, Node runtime.
- src/lib/ai/review-request.ts: validates the JSON body before generation and returns sanitized, non-cached responses.
- src/lib/ai/gemini.ts: server-only SDK calls, grounding instructions, structured JSON schema and sequential fallback.
- src/lib/review-contract.ts: shared request/draft types and runtime validation.
- src/config/site.ts: centralized business name and Google destination.
- src/components/review/ReviewFlow.tsx: loading, error/retry, in-memory drafts and navigation.
- src/components/review/ReviewResults.tsx: existing cards, editor and copy/Google actions.

The browser sends only service and experienceTags. The server accepts only existing service/tag options and rejects malformed or extra fields with HTTP 400 before calling Gemini.

gemini-3.8-flash is always attempted first. Only HTTP 408, 429, 5xx or a timeout/abort permits one sequential attempt of gemini-3.5-flash-lite. SDK automatic retries are disabled. Each model attempt has a 12-second deadline, with a 50-second client deadline. Both use the same prompt/schema and an 800-token output budget, with no explicit temperature, topP or topK. The primary explicitly uses ThinkingLevel.LOW; fallback reasoning remains at its default. Gemini receives a concise Business / Service / Experience tags request with a reminder that sparse input should produce sparse output. The prompt prioritizes short everyday language and prohibits unsupported scene-setting or filler; word counts are guidelines, never minimums.

Configuration/auth/model-not-found errors and invalid structured output do not trigger fallback. Missing configuration returns HTTP 503; provider/output failures return HTTP 502. The UI shows a generic retry message and stays on Step 1. No hardcoded review is substituted. Logs contain only sanitized categories and numeric status codes, never keys, selections, provider messages or draft text.

Output validation requires exactly one draft of each expected type, matching labels, nonempty distinct text and at most 1200 characters per draft. The editable review retains its 4000-character limit. Hinglish text must use Roman script. Grounding, tone, approximate word counts and variation are instructed in the server prompt; factual faithfulness still needs human review with a live key.

No database, cookies, analytics, authentication, Supabase writes or regeneration limits are added. Existing unused Supabase utilities remain untouched.

## Verification

Use Node 24 (the test resolver uses native TypeScript and registerHooks):

npm test
npx tsc --noEmit
npm run lint
npm run build

Tests mock the provider/network, not application production behavior. They cover the three requested selection combinations, empty tags, invalid input/no provider call, output validation, primary-first success, retryable fallback, both failures and missing configuration.

With a real key, check:
- Haircut + Friendly staff + Great results.
- Facial + no tags: neutral service-only wording.
- Hair Color + Clean salon + Professional service + Attention to detail.
- Edit a draft, go Back, change selections, Continue: the editor must retain your edits.
- Temporarily remove the key and restart: retry message, usable Step 1, no invented drafts.

The build requires network access for the project's existing Google Fonts.
