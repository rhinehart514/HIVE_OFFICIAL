"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { MagneticButton } from "../magnetic-button";

gsap.registerPlugin(ScrollTrigger);

const SILK_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function CtaFooterSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLParagraphElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Simple fade for title (removed SplitType - was breaking text rendering)
      gsap.from(titleRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });

      // CTA button - scale up with spring
      gsap.from(ctaRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.5)",
        scrollTrigger: {
          trigger: ctaRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });

      // Note fade in
      gsap.from(noteRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: noteRef.current,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      });

      // Footer slide up
      gsap.from(footerRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 95%",
          toggleActions: "play none none none",
        },
      });

      // Glow parallax
      if (glowRef.current) {
        gsap.to(glowRef.current, {
          scale: 1.3,
          opacity: 0.04,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 px-6 bg-black overflow-hidden"
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Animated gold glow */}
      <div
        ref={glowRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gold-500 opacity-[0.02] blur-[100px] rounded-full"
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2
          ref={titleRef}
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-white"
        >
          Ready?
        </h2>

        <div ref={ctaRef} className="mt-10">
          <MagneticButton strength={0.2}>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-semibold rounded-xl transition-all duration-200 hover:bg-neutral-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started with your .edu
            </Link>
          </MagneticButton>
        </div>

        <p ref={noteRef} className="mt-6 text-sm text-neutral-500">
          Free forever. No ads. Student-owned.
        </p>
      </div>

      {/* Footer */}
      <div
        ref={footerRef}
        className="relative z-10 mt-24 pt-8 border-t border-neutral-800"
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">HIVE</span>
            <span className="text-neutral-700">|</span>
            <span className="text-sm text-neutral-500">Campus</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-neutral-400">
            <Link
              href="/privacy"
              className="hover:text-white transition-colors duration-200"
              style={{ transitionTimingFunction: SILK_EASE }}
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-white transition-colors duration-200"
              style={{ transitionTimingFunction: SILK_EASE }}
            >
              Terms
            </Link>
            <a
              href="mailto:team@hivecampus.com"
              className="hover:text-white transition-colors duration-200"
              style={{ transitionTimingFunction: SILK_EASE }}
            >
              Contact
            </a>
          </div>

          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} HIVE
          </p>
        </div>
      </div>
    </section>
  );
}
