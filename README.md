# Hair Driver — Phase 1

A frontend-only Next.js / TypeScript review landing page. Original client logo, three temporary salon photographs, three selectable review suggestions, clipboard feedback, and a configurable Google destination.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:3000. Validate with `npm run lint` and `npm run build`.
The build downloads Cormorant Garamond and Manrope through `next/font`; deployment builds need access to Google Fonts. Fonts are served locally to visitors afterward.

## Client handover

- Set `googleReviewUrl` in `src/config/site.ts` to the verified Hair Driver Google review link before sharing the QR code. The current URL is a Google Maps search placeholder, not a verified listing or review form.
- Replace the image files mapped in `src/config/site.ts` with client photography. Update their alternative text at the same time.
- Edit the three typed suggestions in `src/data/reviews.ts`. The UI receives suggestions through props so the source can be replaced later.
- The supplied `public/logo/logo.png` is used without alterations. No contact details have been invented.
- Clipboard access requires HTTPS in production (localhost also works). If permission is denied, the page offers manual-copy guidance. Copying does not post a review; the visitor pastes and submits it on Google.
- Search indexing is disabled for this prototype in `src/app/layout.tsx`.

## Scope

No API routes, persistence, authentication, analytics, or AI integration are used by the page. Supabase dependencies and unused utilities were already present in the repository; the frontend does not import them or require their environment variables.

## Temporary image sources

Downloaded from Unsplash and served from `public/images`:

- Styling: image identifier `photo-1562322140-8baeececf3df`
- Beauty: image identifier `photo-1524504388940-b1c1722653e1`
- Grooming: image identifier `photo-1503951914875-452162b0f3f1`

The exact source image URLs are `https://images.unsplash.com/` followed by the corresponding image identifier. These are temporary campaign references, not photographs of Hair Driver's team or premises.
