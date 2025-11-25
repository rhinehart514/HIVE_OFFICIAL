"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import Link from "next/link";
import { MagneticButton } from "../magnetic-button";
import { TypewriterText } from "../ui/typewriter-text";

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  const [typewriterComplete, setTypewriterComplete] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Parallax scroll effect on hero content
      const heroContent = containerRef.current?.querySelector(".hero-content");
      if (!heroContent) return;

      gsap.to(heroContent, {
        y: 80,
        opacity: 0.2,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 bg-black overflow-hidden"
    >
      {/* Breathing gold orb */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: [0.03, 0.05, 0.03],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[300px] md:h-[400px] bg-[#FFD700] blur-[120px] rounded-full pointer-events-none"
      />

      {/* Secondary subtle glow */}
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[200px] bg-[#FFD700] opacity-[0.02] blur-[100px] rounded-full pointer-events-none" />

      {/* Content */}
      <div className="hero-content relative z-10 max-w-4xl mx-auto text-center">
        {/* Main headline with typewriter */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
          <TypewriterText
            text="We stopped waiting."
            charDelay={80}
            startDelay={400}
            onComplete={() => setTypewriterComplete(true)}
          />
        </h1>

        {/* Subheadline - fades in after typewriter */}
        <motion.p
          ref={subheadRef}
          initial={{ opacity: 0, y: 20 }}
          animate={typewriterComplete ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 text-lg sm:text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto leading-relaxed"
        >
          Every campus app was built for students, not by them.
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          So we built our own.
        </motion.p>

        {/* CTA - fades in after subheadline */}
        <motion.div
          ref={ctaRef}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={typewriterComplete ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{
            duration: 0.5,
            delay: 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-10 flex justify-center"
        >
          <MagneticButton strength={0.2}>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#FFD700] text-black font-semibold rounded-xl transition-all duration-300 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                boxShadow: "0 0 40px rgba(255, 215, 0, 0.2)",
              }}
            >
              Join the Movement
            </Link>
          </MagneticButton>
        </motion.div>
      </div>

      {/* Minimal scroll indicator */}
      <motion.div
        ref={scrollIndicatorRef}
        initial={{ opacity: 0 }}
        animate={typewriterComplete ? { opacity: 1 } : {}}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border border-neutral-700 rounded-full flex justify-center pt-2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-2 bg-neutral-500 rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
}
