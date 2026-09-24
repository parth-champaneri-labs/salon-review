<!-- BEGIN:nextjs-agent-rules -->

# Hair Driver — Agent Instructions

## Project Goal

Build a premium, mobile-first single-page review landing experience for:

**Hair Driver — Family Salon & Academy**

The page will normally open after a customer scans a QR code inside the salon.

The primary user journey is:

1. Customer scans QR code.
2. Hair Driver branded page opens.
3. Customer immediately understands the salon/brand.
4. Customer sees simple review guidance.
5. Show 3 short suggested review texts.
6. Customer can copy/select a suggestion.
7. Customer clicks **Continue to Google**.
8. Google Review page opens.

This first phase is intentionally frontend-only.

---

## Current Phase

### Phase 1 — UI / UX Prototype

Build only the single-page frontend experience.

Do NOT implement:

* database
* authentication
* admin panel
* API
* Node/Express backend
* review storage
* analytics backend
* AI API integration
* user accounts
* CMS

Use static/mock data wherever required.

Architecture should still make future backend integration easy.

---

## Technology

If the repository already has a frontend stack, continue using it instead of unnecessarily replacing dependencies.

For a new project prefer:

* Next.js
* TypeScript
* Tailwind CSS
* Lucide React icons

Animation may use:

* CSS transitions
* Framer Motion

Do not introduce large dependencies for effects that can be achieved with CSS.

---

# Design Direction

The experience should feel like a modern premium salon website rather than:

* SaaS software
* dashboard
* generic AI-generated landing page
* template marketplace design
* corporate website

Take visual inspiration from:

https://twobirdshairandbeautysalon.com/

Do NOT clone the reference website.

Capture its general qualities:

* strong editorial typography
* bold visual hierarchy
* premium salon imagery
* generous whitespace
* interesting asymmetric layouts
* simple navigation
* minimal interface
* strong brand presence
* large photography
* confident typography
* clean CTA placement

Create an original Hair Driver design.

---

# Brand

Brand:

**Hair Driver**

Descriptor:

**Family Salon & Academy**

Always preserve the supplied client logo.

Do not redraw, recreate or alter the logo typography.

The logo should remain visually prominent but should never dominate the entire hero.

If multiple logo assets exist, use the version most suitable for the current background.

---

# Visual Style

The site should feel:

* premium
* fashionable
* contemporary
* confident
* editorial
* clean
* welcoming
* professional

Avoid excessive:

* gradients
* glassmorphism
* floating cards
* glowing UI
* rounded SaaS cards
* icon grids
* generic AI graphics
* excessive shadows
* animation
* decorative clutter

Salon photography and typography should carry the design.

---

# Color System

Derive the primary palette from the Hair Driver logo.

Use a restrained palette.

Recommended structure:

* warm off-white / cream background
* near-black typography
* brand accent color from logo
* muted neutral secondary background
* subtle border colors

Do not turn every element into the brand accent color.

Maintain strong contrast and accessibility.

---

# Typography

Typography is a major visual element of this project.

Use a maximum of two font families.

Preferred combination:

### Display / Heading

Elegant editorial font with personality.

Possible styles:

* DM Serif Display
* Cormorant Garamond
* Playfair Display
* Bodoni-inspired editorial font

### UI / Body

Clean modern sans-serif.

Possible styles:

* Inter
* Manrope
* DM Sans
* Plus Jakarta Sans

Do not randomly mix fonts.

Large desktop headings can use approximately:

`clamp(3rem, 7vw, 7rem)`

Section headings:

`clamp(2rem, 4vw, 4.5rem)`

Body text should remain highly readable.

Use proper line-height and limited content width.

---

# Spacing System

Spacing must feel intentional.

Use a consistent spacing scale.

Suggested section spacing:

Desktop:

* 96–144px vertical

Tablet:

* 72–100px

Mobile:

* 56–80px

Do not create unnecessary giant empty areas.

Do not crowd text against screen edges.

Mobile horizontal padding:

16–24px

Desktop container:

approximately 1200–1400px maximum width.

---

# Responsive Design

Design mobile-first.

This page will primarily be opened through a QR code, therefore mobile UX is the highest priority.

Support:

* 360px mobile
* 390px mobile
* 430px mobile
* tablet
* laptop
* large desktop

Do not simply shrink desktop layouts.

Re-compose sections for smaller screens.

Check:

* logo size
* headline wrapping
* CTA width
* card stacking
* image cropping
* spacing
* readable typography
* touch targets

Minimum interactive target height should generally be around 44px.

---

# Page Structure

Keep this page focused.

Recommended structure:

## 1. Minimal Header

Include:

* Hair Driver logo
* optional small `Family Salon & Academy`
* subtle Google Reviews / Review Us action if useful

Avoid a large traditional navigation menu because this page has one main conversion goal.

---

## 2. Hero

The first screen should establish Hair Driver immediately.

Possible direction:

Large salon/model photography with editorial typography.

Suggested message:

**Loved your Hair Driver experience?**

Supporting message:

Share your experience in a few seconds.

CTA:

**Write a Review**

Add subtle microcopy:

`It only takes a moment.`

The hero should feel premium rather than promotional.

---

## 3. Brand / Salon Experience

Create a visually interesting section communicating areas such as:

* Hair
* Beauty
* Grooming
* Academy

Use editorial photography rather than generic icon cards.

This section primarily builds confidence before asking for the review.

Keep copy minimal.

---

## 4. Review Prompt Section

Headline example:

**Need a little inspiration?**

Supporting copy:

Choose a review below, copy it, and personalize it if you'd like.

Display exactly **3 sample reviews** in Phase 1.

Example mock reviews:

### Option 01

Amazing experience at Hair Driver. The staff was professional, friendly and made me feel completely comfortable. Really happy with the service.

### Option 02

Loved my experience at Hair Driver. Great service, welcoming staff and attention to detail. Definitely recommended.

### Option 03

Very happy with the service at Hair Driver. The team understood exactly what I wanted and the overall experience was excellent.

These are temporary static suggestions.

Later they may come from an AI service.

Create the component/data architecture so static suggestions can easily be replaced with API results.

---

## 5. Review Selection Interaction

Each suggestion should support:

* select
* copy
* active state
* copied confirmation

Keep interaction simple.

Example:

`Copy review`

after click:

`Copied`

Do not force users to use a suggested review.

Include a subtle message:

`You can edit the review before posting it on Google.`

---

## 6. Google Review CTA

After the suggestions provide one dominant action:

**Continue to Google**

Add Google icon/branding only when appropriate and legally safe.

For Phase 1 use a configurable placeholder Google Review URL.

Store it in one clearly defined constant/config file rather than hardcoding it in multiple components.

Opening behaviour:

* open the Google review destination
* preferably new tab where appropriate

---

## 7. Closing Brand Moment

Before footer, create a small premium closing section.

Example:

**Thank you for choosing Hair Driver.**

`Family Salon & Academy`

Keep it visual and understated.

---

## 8. Footer

Minimal footer.

Possible content:

* Hair Driver logo
* Family Salon & Academy
* Instagram
* phone
* location
* copyright

Use placeholder information when real details are unavailable.

Never invent real contact information.

---

# Photography

Use high-quality temporary salon imagery.

Photography direction:

* premium hair styling
* Indian male/female customers when appropriate
* salon interiors
* hair colouring
* grooming
* beauty treatments
* academy/training environment
* warm editorial lighting
* authentic expressions

Avoid stereotypical AI imagery.

Images should look like a real professional salon campaign.

Keep image components replaceable so client photography can later be substituted easily.

---

# Layout

Avoid making every section centered.

Use editorial composition:

* left aligned typography
* large image / small text combinations
* overlapping visual relationships where appropriate
* controlled asymmetry
* alternating layouts

But usability remains more important than artistic complexity.

---

# Animation

Animation should support polish, not distract.

Allowed:

* subtle fade/translate on entering viewport
* image reveal
* text reveal
* button hover
* review selection transitions

Avoid:

* heavy parallax
* scroll hijacking
* excessive text splitting
* constant movement
* animations that delay user actions

Respect:

`prefers-reduced-motion`

---

# Component Structure

Prefer reusable components such as:

* `Header`
* `Hero`
* `ExperienceSection`
* `ReviewSuggestions`
* `ReviewCard`
* `GoogleReviewCTA`
* `ClosingSection`
* `Footer`

Separate mock data from presentation components.

Suggested structure:

src/
components/
sections/
data/
config/
styles/

Do not over-engineer the architecture for this single page.

---

# Code Quality

Code should be:

* production-quality
* readable
* typed
* reusable
* responsive
* accessible
* maintainable

Avoid unnecessary abstraction.

Avoid giant components.

Avoid premature backend architecture.

No dead code.

No placeholder comments such as:

`TODO: fix later`

when the implementation can be completed now.

---

# Accessibility

Ensure:

* meaningful image alt text
* semantic HTML
* keyboard-accessible buttons
* visible focus states
* adequate color contrast
* correct heading hierarchy
* reduced-motion support

---

# Performance

Target a fast QR-entry experience.

Prioritize:

* optimized images
* lazy loading below fold
* minimal JavaScript
* minimal third-party libraries
* no unnecessary video backgrounds
* no blocking animation libraries

The page should feel fast even on average mobile internet connections.

---

# Important Product Rule

The QR visitor has already interacted with Hair Driver.

This page is NOT primarily trying to sell the salon.

Its main purpose is to smoothly move an existing customer from:

**QR Scan → Brand Recognition → Review Assistance → Google Review**

Every design decision should support this journey.

---

# Phase 1 Definition of Done

Phase 1 is complete when:

1. Single page is fully designed.
2. Hair Driver branding is correctly represented.
3. Client logo is used without modification.
4. Page works beautifully on mobile.
5. Desktop and tablet layouts are polished.
6. Three static sample reviews are available.
7. Review copy interaction works.
8. Continue to Google CTA works using configurable placeholder URL.
9. No database exists.
10. No backend/API exists.
11. No authentication exists.
12. UI does not resemble a generic SaaS template.
13. Design feels appropriate for a premium salon brand.


<!-- END:nextjs-agent-rules -->
