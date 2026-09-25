# Hair Driver review experience

A mobile-first Next.js + TypeScript + Tailwind frontend for QR visitors. Existing salon branding, assets, typography, hero and closing section are preserved.

## Run and verify

```sh
npm install
npm run dev
npx tsc --noEmit
npm run lint
node --test tests/review-contract.test.mjs
npm run build
```

Tests use Node 22.18+ / Node 24 native TypeScript support. The production build requires Google Fonts access for the existing fonts.

## Two-step review flow

1. Visit details: choose one primary service and optional highlights. More services expands inline.
2. Your review: choose one of three writing suggestions or write directly, edit up to 4,000 characters, copy, and continue to Google.

Back preserves selections and the draft. Changing context refreshes suggestions and clears the selected suggestion marker without replacing the draft. Explicitly selecting a suggestion replaces the textarea with that suggestion.

Copy and Google are separate actions to avoid popup and clipboard timing issues on mobile. Failed clipboard access offers manual-copy guidance. Nothing is automatically posted or persisted after refresh.

## Implementation

- src/components/review/ReviewFlow.tsx owns navigation, selections, draft and clipboard state.
- src/data/build-review-suggestions.ts exports the pure local buildReviewSuggestions(reviewContext) provider. It consumes service and highlights and returns three typed ReviewSuggestion objects. A future async provider can replace this boundary without changing the selection/editor presentation components.
- src/data/review-options.ts contains service choices and highlights.
- src/config/site.ts contains the single configurable Google destination. Replace the current Maps search placeholder with the salon's verified review link before launch.
- src/app/globals.css retains the ivory, charcoal and gold editorial style, with subtle 200ms transitions and reduced-motion support.

No review API, authentication, storage or external writing service is used. Existing unused Supabase utilities and dependencies are untouched.
