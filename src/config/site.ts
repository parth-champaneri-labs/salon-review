export const siteConfig = {
  // Phase 1 placeholder. Replace with the verified salon review link before launch.
  googleReviewUrl: "https://www.google.com/maps/search/?api=1&query=Hair+Driver+Family+Salon+and+Academy",
} as const;

// Temporary Unsplash photography; replace with client images when available.
export const photography = {
  hero: { src: "/images/salon-styling.jpg", alt: "A smiling stylist blow-drying a customer's hair in a sunlit salon" },
  beauty: { src: "/images/beauty-portrait.jpg", alt: "Natural beauty portrait with softly styled, long hair" },
  grooming: { src: "/images/grooming.jpg", alt: "A barber carefully shaping a customer's beard with scissors" },
} as const;
