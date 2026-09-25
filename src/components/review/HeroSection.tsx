"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import { Arrow } from "../icons";

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    function syncPlayback() {
      if (!video) return;
      if (preference.matches) video.pause();
      else void video.play().catch(() => setPlaying(false));
    }
    syncPlayback();
    preference.addEventListener("change", syncPlayback);
    return () => preference.removeEventListener("change", syncPlayback);
  }, []);

  function toggleVideo() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (!video.currentSrc) video.src = siteConfig.heroVideo;
      void video.play().catch(() => setPlaying(false));
    }
    else video.pause();
  }

  return (
    <section className="cinema-hero relative isolate flex flex-col items-center overflow-hidden text-center" aria-labelledby="hero-title">
      <video
        ref={videoRef}
        className="hero-film absolute inset-0 -z-20 h-full w-full object-cover"
        autoPlay muted loop playsInline preload="metadata"
        poster="/images/salon-styling.jpg"
        aria-hidden="true" tabIndex={-1}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
      >
        <source src={siteConfig.heroVideo} type="video/mp4" media="(prefers-reduced-motion: no-preference)" />
      </video>
      <div className="absolute inset-0 -z-10 bg-black/35" />
      <header className="hero-brand flex w-full justify-center">
        <a href="#" aria-label={`${siteConfig.businessName} home`} className="inline-flex min-h-11 items-center">
          <Image src="/logo/logofill.png" alt={`${siteConfig.businessName} — ${siteConfig.businessDescriptor}`} width={2172} height={724} sizes="(max-width: 640px) 170px, 210px" priority className="h-auto w-[170px] sm:w-[210px]" />
        </a>
      </header>
      <div className="hero-center flex w-full flex-1 flex-col items-center justify-center px-5">
        <p className="eyebrow text-[#e0d5c3]">YOUR EXPERIENCE MATTERS TO US.</p>
        <h1 id="hero-title" className="hero-title">Loved your {siteConfig.businessName}<br /><em>experience?</em></h1>
        <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-[#e5dfd5] sm:text-base">We’d love to hear about your visit.<br />Share your experience in just a few seconds.</p>
        <a href="#reviews" className="action action-light mt-8">Start your review <Arrow diagonal /></a>
        <a href="#reviews" aria-label="Scroll to review flow" className="mt-4 flex h-11 w-11 items-center justify-center text-2xl text-[#ded1bd]">↓</a>
      </div>
      <div className="hero-foot flex w-full items-center justify-between gap-4 px-5 text-[10px] tracking-[.16em] sm:px-12">
        <span>FAMILY SALON & ACADEMY</span>
        <button type="button" onClick={toggleVideo} className="video-control flex min-h-11 items-center gap-2" aria-label={playing ? "Pause background video" : "Play background video"}>
          <span aria-hidden="true">{playing ? "Ⅱ" : "▷"}</span>{playing ? "PAUSE" : "PLAY"}
        </button>
      </div>
    </section>
  );
}
