import Image from "next/image";
import { photography } from "@/config/site";
import { Arrow } from "./icons";

function Logo() {
  return <Image src="/logo/logo.png" alt="Hair Driver — Family Salon & Academy" width={2172} height={724} className="brand-logo" sizes="180px" priority />;
}

export function Header() {
  return <header className="header shell"><a href="#" aria-label="Hair Driver home"><Logo /></a><span className="header-note">GOOD HAIR. GREAT COMPANY.</span><a className="text-link" href="#reviews">Review us <Arrow diagonal /></a></header>;
}

export function Hero() {
  return <section className="hero shell" aria-labelledby="hero-title">
    <div className="hero-copy">
      <p className="eyebrow"><span className="little-line" /> A LITTLE TIME FOR YOU. A FEW WORDS FOR US.</p>
      <h1 id="hero-title">Loved your<br /><span>Hair Driver</span><br /><em>experience?</em></h1>
      <p className="hero-description">Good hair makes your day.<br />Your words make ours.</p>
      <p className="hero-intro">Share your experience in just a few seconds.</p>
      <a className="button button-dark" href="#reviews">Write a Review <Arrow diagonal /></a>
      <span className="hero-micro">A little love goes a long way.</span>
    </div>
    <figure className="hero-visual">
      <div className="hero-image"><Image src={photography.hero.src} alt={photography.hero.alt} fill sizes="(max-width: 700px) 100vw, 52vw" priority /></div>
      <figcaption><span>THE HAIR DRIVER EXPERIENCE</span><span>Made personal.</span></figcaption>
      <div className="image-note" aria-hidden="true">A good hair day.<br /><em>A great feeling.</em></div>
    </figure>
    <div className="hero-bottom"><span>FOR EVERY LOOK. FOR EVERY YOU.</span><a href="#experience">A little of what we do <span aria-hidden="true">↓</span></a></div>
  </section>;
}

export function ExperienceSection() {
  return <section className="experience shell" id="experience" aria-labelledby="experience-title">
    <div className="section-heading"><p className="eyebrow">THE ART OF FEELING LIKE YOURSELF</p><h2 id="experience-title">More than a look.<br /><em>A feeling.</em></h2><p>From a fresh cut to a little self-care,<br />it’s the way you feel that stays with you.</p></div>
    <div className="experience-grid">
      <figure className="experience-photo beauty-photo"><div className="photo-frame"><Image src={photography.beauty.src} alt={photography.beauty.alt} fill sizes="(max-width: 700px) 58vw, 38vw" /></div><figcaption><span>01 / HAIR & BEAUTY</span><span>Effortlessly you.</span></figcaption></figure>
      <figure className="experience-photo grooming-photo"><div className="photo-frame"><Image src={photography.grooming.src} alt={photography.grooming.alt} fill sizes="(max-width: 700px) 38vw, 27vw" /></div><figcaption><span>02 / GROOMING</span><span>In the details.</span></figcaption></figure>
      <div className="academy-note"><span className="eyebrow">03 / THE ACADEMY</span><h3>Good hands.<br /><em>Fresh perspectives.</em></h3><p>A love for the craft.<br />A space to learn and grow.</p><span className="academy-rule" /></div>
    </div>
    <p className="service-line">Hair <span>·</span> Beauty <span>·</span> Grooming <span>·</span> Academy</p>
  </section>;
}

export function ClosingSection() {
  return <section className="closing shell" aria-labelledby="closing-title"><span className="eyebrow">FROM ALL OF US, TO YOU</span><h2 id="closing-title">Thank you for<br /><em>choosing Hair Driver.</em></h2><p>For trusting our hands. For being part of our story.</p><span className="closing-signature">See you in the chair.</span></section>;
}

export function Footer() {
  return <footer className="footer shell"><Logo /><p>Family Salon & Academy</p><span>© {new Date().getFullYear()} Hair Driver</span><a className="text-link" href="#">Back to top <span aria-hidden="true">↑</span></a></footer>;
}
