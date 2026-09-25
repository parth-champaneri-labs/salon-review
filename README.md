# Hair Driver review experience

A mobile-first Next.js + TypeScript + Tailwind frontend for QR/NFC visitors. The existing Supabase utilities, dependencies and environment configuration are preserved.

## Run and verify

```sh
npm install
npm run dev
npx tsc --noEmit
npm run lint
node --test tests/review-contract.test.mjs
npm run build
```

Tests use Node 22.18+ / Node 24 native TypeScript support. The production build needs Google Fonts access for the existing Cormorant Garamond and Manrope fonts. Fonts are then served locally to visitors.

## Page and assets

- `src/app/page.tsx`: cinematic hero, guided review flow, thank-you and footer.
- `src/components/review/`: reusable rating, service, tag, feedback, generation and editable-result components. `ReviewFlow` owns answers, navigation, drafts and request state.
- `src/data/review-options.ts`: 16 services, eight experience tags, five rating labels.
- `src/data/reviews.ts`: three explicitly labeled sample reviews. These are never represented as generated responses and are not derived from answers.
- `src/config/site.ts`: Google review destination and actual video path `/videos/hero.mp4` (plural directory).
- `public/logo/logofill.png`: existing light logo, unmodified. `public/images/salon-styling.jpg` is the existing fallback poster.
- `src/app/globals.css`: Tailwind import, warm ivory/charcoal theme and restrained custom cinematic/control styles.

Replace the configured Google Maps search placeholder with the verified salon review link before public QR/NFC rollout. Prototype search indexing remains disabled in the existing layout.

## Review flow

1. Rate the visit with native keyboard-accessible star radio controls.
2. Choose a primary service; expand the remaining services when needed.
3. Ratings 1–3 get a thoughtful feedback form. Ratings 4–5 get optional multi-select tags and notes.
4. Positive-rating visitors can explore labeled samples or write their own review, edit and copy it, and continue to Google. Each suggestion retains its own edits while switching selection.

Google reviews remain accessible for every rating. Nothing is posted automatically. Clipboard access needs HTTPS (or localhost); a denied copy operation offers manual-copy guidance. No answers or drafts are persisted on refresh.

## Real API integration boundary

No review-generation or feedback-submission endpoint exists in this project. Their buttons are intentionally unavailable with visible explanations; feedback is never falsely reported as sent. No fake delays, random reviews, API calls, database tables, or credentials were added.

`ReviewFlow` accepts an optional typed `Partial<ReviewGateway>` from a client wrapper:

- `generate(input): Promise<ReviewSuggestion[]>` must return exactly three complete reviews with unique IDs. Responses are validated before replacing existing drafts. Loading and error states are implemented; a failed regeneration preserves the current review.
- `submitFeedback(input): Promise<void>` must resolve only after actual delivery. Only then is the success confirmation shown.

The payload contains `rating`, `service`, `tags` and `note`. Low-rating feedback excludes positive experience tags. Keep secrets on the server when adding the future endpoints; client adapters should call those endpoints. Do not pass callback functions directly across a Server Component boundary.

## Motion and performance

The existing ~5 MB 1280×720 MP4 uses metadata preload, muted inline autoplay, cover cropping and a light CSS blur/brightness treatment. A pause/play control is provided. Reduced-motion visitors get a still poster by default; explicit play is opt-in. Layout dimensions are reserved, and no animation or component-library dependencies were added.
