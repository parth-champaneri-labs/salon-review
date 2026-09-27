import { HeroSection } from "./HeroSection";
import { ReviewFlow } from "./ReviewFlow";
import { ThankYouSection } from "./ThankYouSection";

export function ReviewExperience() {
  return (
    <>
      <a className="skip-link" href="#reviews">Skip to your review</a>
      <main>
        <HeroSection />
        <ReviewFlow />
      </main>
      <ThankYouSection />
    </>
  );
}
