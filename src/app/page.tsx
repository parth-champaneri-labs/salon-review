import { HeroSection } from "@/components/review/HeroSection";
import { ReviewFlow } from "@/components/review/ReviewFlow";
import { ThankYouSection } from "@/components/review/ThankYouSection";

export default function Home() {
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
