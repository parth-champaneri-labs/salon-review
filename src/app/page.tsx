import { Header, Hero, ExperienceSection, ClosingSection, Footer } from "@/components/brand-sections";
import { ReviewSuggestions } from "@/components/review-suggestions";
import { reviewSuggestions } from "@/data/reviews";

export default function Home() {
  return <><a className="skip-link" href="#reviews">Skip to review suggestions</a><Header /><main id="main"><Hero /><ExperienceSection /><ReviewSuggestions suggestions={reviewSuggestions} /><ClosingSection /></main><Footer /></>;
}
