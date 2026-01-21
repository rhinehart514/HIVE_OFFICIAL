'use client';

import { useRef } from 'react';
import Link from 'next/link';
import {
  Logo,
  motion,
  NoiseOverlay,
  Button,
  useScroll,
  useTransform,
  useInView,
} from '@hive/ui/design-system/primitives';

// Premium easing
const EASE = [0.22, 1, 0.36, 1] as const;

// Early contributors (alphabetical)
interface Contributor {
  name: string;
  role: string;
  linkedin?: string;
}

const CONTRIBUTORS: Contributor[] = [
  { name: 'Gavin', role: 'Marketing', linkedin: 'https://www.linkedin.com/in/malecgavin/' },
  { name: 'Mirka', role: 'Marketing', linkedin: 'https://www.linkedin.com/in/mirka-arevalo/' },
  { name: 'Noah', role: 'Operations', linkedin: 'https://www.linkedin.com/in/noahowsh/' },
  { name: 'Samarth', role: 'Marketing', linkedin: 'https://www.linkedin.com/in/samarth-yaralakatte-mallappa/' },
];

// Animated line that draws in
function AnimatedLine({ className, delay = 0 }: { className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div ref={ref} className={className}>
      <motion.div
        className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 1.5, delay, ease: EASE }}
      />
    </div>
  );
}

// Container with animated border reveal
function AnimatedContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Top border */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px bg-[var(--color-gold)]/20"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.2, ease: EASE }}
        style={{ transformOrigin: 'left' }}
      />
      {/* Bottom border */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-[var(--color-gold)]/20"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.2, delay: 0.1, ease: EASE }}
        style={{ transformOrigin: 'right' }}
      />
      {/* Left border */}
      <motion.div
        className="absolute top-0 bottom-0 left-0 w-px bg-[var(--color-gold)]/20"
        initial={{ scaleY: 0 }}
        animate={isInView ? { scaleY: 1 } : {}}
        transition={{ duration: 1.2, delay: 0.2, ease: EASE }}
        style={{ transformOrigin: 'top' }}
      />
      {/* Right border */}
      <motion.div
        className="absolute top-0 bottom-0 right-0 w-px bg-[var(--color-gold)]/20"
        initial={{ scaleY: 0 }}
        animate={isInView ? { scaleY: 1 } : {}}
        transition={{ duration: 1.2, delay: 0.3, ease: EASE }}
        style={{ transformOrigin: 'bottom' }}
      />
      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Parallax text that moves at different speeds
function ParallaxText({
  children,
  speed = 0.5,
  className,
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

// Narrative reveal - text fades in word by word or line by line
function NarrativeReveal({
  children,
  className,
  stagger = 0.1,
}: {
  children: string;
  className?: string;
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const words = children.split(' ');

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: i * stagger, ease: EASE }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// Section with scroll-triggered reveal
function RevealSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-150px' });

  return (
    <motion.section
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1.2, ease: EASE }}
    >
      {children}
    </motion.section>
  );
}

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[var(--color-bg-void)] text-white">
      <NoiseOverlay />

      {/* Minimal header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-6">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link href="/" className="transition-opacity hover:opacity-70">
            <Logo variant="mark" size="sm" color="gold" />
          </Link>
          <Link
            href="/"
            className="text-[13px] text-white/40 hover:text-white/60 transition-colors"
          >
            Back
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative">
        {/* Hero - parallax fade */}
        <motion.section
          className="min-h-screen flex flex-col justify-center px-6 py-24 sticky top-0"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <div className="mx-auto max-w-3xl">
            <motion.p
              className="mb-4 text-[13px] font-medium uppercase tracking-wider text-[var(--color-gold)]/60"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE }}
            >
              About
            </motion.p>

            <motion.h1
              className="mb-6 text-[44px] md:text-[72px] font-semibold leading-[1.0] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.1, ease: EASE }}
            >
              <span className="text-white">We stopped waiting</span>
              <br />
              <span className="text-white/30">for institutions.</span>
            </motion.h1>

            <motion.p
              className="text-[20px] md:text-[24px] leading-relaxed text-white/40 max-w-[500px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: EASE }}
            >
              So we built the infrastructure ourselves.
            </motion.p>

            {/* Scroll indicator */}
            <motion.div
              className="mt-24 flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1, ease: EASE }}
            >
              <motion.div
                className="w-px h-8 bg-white/20"
                animate={{ scaleY: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="text-[11px] uppercase tracking-wider text-white/20">
                Scroll
              </span>
            </motion.div>
          </div>
        </motion.section>

        {/* Spacer for parallax */}
        <div className="h-[50vh]" />

        {/* ============================================ */}
        {/* SECTION 1: WHAT IS HIVE */}
        {/* ============================================ */}

        <RevealSection className="px-6 py-32 relative">
          <AnimatedLine className="absolute top-0 left-6 right-6" />
          <div className="mx-auto max-w-3xl">
            <ParallaxText speed={0.15}>
              <motion.h2
                className="mb-12 text-[32px] md:text-[40px] font-semibold text-white"
                style={{ fontFamily: 'var(--font-display)' }}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: EASE }}
              >
                What I'm building
              </motion.h2>
            </ParallaxText>

            <div className="space-y-10 text-[18px] md:text-[22px] leading-relaxed">
              <ParallaxText speed={0.1}>
                <p className="text-white/60">
                  <NarrativeReveal stagger={0.03}>
                    HIVE is infrastructure for student communities. Not another social app. Not another group chat. Infrastructure.
                  </NarrativeReveal>
                </p>
              </ParallaxText>

              <ParallaxText speed={0.08}>
                <p className="text-white/50">
                  <NarrativeReveal stagger={0.03}>
                    I built it because campus runs on scattered tools that don't talk to each other. Group chats die every semester. Club knowledge disappears when e-boards graduate. There's LinkedIn for your resume, Instagram for performance, and nothing for actually building together.
                  </NarrativeReveal>
                </p>
              </ParallaxText>

              <ParallaxText speed={0.06}>
                <p className="text-white/50">
                  <NarrativeReveal stagger={0.03}>
                    HIVE gives every organization a permanent home. A place that persists across semesters. Where members can coordinate, build tools, and actually own what they create. No admin oversight. No institutional gatekeeping. Student-owned from the start.
                  </NarrativeReveal>
                </p>
              </ParallaxText>

              <ParallaxText speed={0.05}>
                <p className="text-white/50">
                  <NarrativeReveal stagger={0.03}>
                    400+ organizations already mapped. The structure exists. Now it needs students to claim it, build on it, make it theirs.
                  </NarrativeReveal>
                </p>
              </ParallaxText>
            </div>
          </div>
        </RevealSection>

        {/* The Belief - animated container */}
        <RevealSection className="px-6 py-32">
          <div className="mx-auto max-w-3xl">
            <AnimatedContainer className="rounded-2xl bg-[var(--color-gold)]/[0.02] p-12 md:p-16">
              <ParallaxText speed={0.1}>
                <p
                  className="text-[28px] md:text-[36px] font-medium leading-[1.2] text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  "Students will build
                  <br />
                  what institutions can't.
                </p>
                <p
                  className="mt-4 text-[28px] md:text-[36px] font-medium leading-[1.2] text-white/30"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  I'm just building the infrastructure."
                </p>
              </ParallaxText>
            </AnimatedContainer>
          </div>
        </RevealSection>

        {/* ============================================ */}
        {/* SECTION 2: WHY IT TOOK 2 YEARS */}
        {/* ============================================ */}

        <RevealSection className="px-6 py-32 relative">
          <AnimatedLine className="absolute top-0 left-6 right-6" />
          <div className="mx-auto max-w-3xl">
            <ParallaxText speed={0.15}>
              <motion.h2
                className="mb-12 text-[32px] md:text-[40px] font-semibold text-white"
                style={{ fontFamily: 'var(--font-display)' }}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: EASE }}
              >
                Why it took two years
              </motion.h2>
            </ParallaxText>

            <div className="space-y-10 text-[18px] md:text-[22px] leading-relaxed">
              <ParallaxText speed={0.1}>
                <p className="text-white/50">
                  <NarrativeReveal stagger={0.03}>
                    I didn't start alone. Two years ago, I had a team. Smart people who believed in this. We tried to make it work together.
                  </NarrativeReveal>
                </p>
              </ParallaxText>

              <ParallaxText speed={0.08}>
                <p className="text-white/50">
                  <NarrativeReveal stagger={0.03}>
                    It didn't. Not the way we planned. The startup didn't come together, the timing wasn't right, and eventually the team moved on. That's on me, not them.
                  </NarrativeReveal>
                </p>
              </ParallaxText>

              <ParallaxText speed={0.07}>
                <p className="text-white/50">
                  <NarrativeReveal stagger={0.03}>
                    But I couldn't let it go. The problem was still there. Students still needed this. So I kept building — nights, weekends, between everything else. Slower, but still moving.
                  </NarrativeReveal>
                </p>
              </ParallaxText>

              <ParallaxText speed={0.06}>
                <p className="text-white/50">
                  <NarrativeReveal stagger={0.03}>
                    What the team built, what they challenged, what they taught me — that's still here. The product is sharper because of them. The vision clearer. HIVE wouldn't exist without that foundation.
                  </NarrativeReveal>
                </p>
              </ParallaxText>

              <ParallaxText speed={0.05}>
                <p className="text-white/50">
                  <NarrativeReveal stagger={0.03}>
                    Today it's just me. Building the infrastructure we always talked about. Two years later, it's finally ready. Not finished — it never will be. But ready for students to build on.
                  </NarrativeReveal>
                </p>
              </ParallaxText>

              <ParallaxText speed={0.03}>
                <motion.p
                  className="text-white/25 text-[16px] pt-6"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.5, ease: EASE }}
                >
                  — Laney
                </motion.p>
              </ParallaxText>
            </div>
          </div>
        </RevealSection>

        {/* Contributors */}
        {CONTRIBUTORS.length > 0 && (
          <RevealSection className="px-6 py-24 relative">
            <AnimatedLine className="absolute top-0 left-6 right-6" />
            <div className="mx-auto max-w-3xl">
              <ParallaxText speed={0.05}>
                <motion.p
                  className="mb-10 text-[11px] uppercase tracking-[0.2em] text-white/20"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: EASE }}
                >
                  Contributors
                </motion.p>
                <div className="flex flex-wrap gap-x-12 gap-y-4">
                  {CONTRIBUTORS.map((contributor, i) => (
                    <motion.div
                      key={contributor.name}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.2 + i * 0.08, ease: EASE }}
                    >
                      {contributor.linkedin ? (
                        <a
                          href={contributor.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-baseline gap-2"
                        >
                          <span className="text-[15px] text-white/30 group-hover:text-white/50 transition-colors duration-300">
                            {contributor.name}
                          </span>
                          <span className="text-[12px] text-white/15 group-hover:text-white/25 transition-colors duration-300">
                            {contributor.role}
                          </span>
                        </a>
                      ) : (
                        <div className="flex items-baseline gap-2">
                          <span className="text-[15px] text-white/30">
                            {contributor.name}
                          </span>
                          <span className="text-[12px] text-white/15">
                            {contributor.role}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </ParallaxText>
            </div>
          </RevealSection>
        )}

        {/* The Future - CTA */}
        <RevealSection className="px-6 py-40 relative">
          <AnimatedLine className="absolute top-0 left-6 right-6" />
          <div className="mx-auto max-w-3xl text-center">
            <ParallaxText speed={0.1}>
              <motion.p
                className="text-[32px] md:text-[44px] font-medium leading-[1.1] mb-12"
                style={{ fontFamily: 'var(--font-display)' }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: EASE }}
              >
                <span className="text-white">The builders inherit</span>
                <br />
                <span className="text-white/30">what comes next.</span>
              </motion.p>
            </ParallaxText>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
            >
              <Button variant="cta" size="lg" asChild>
                <a href="/enter">Enter with .edu</a>
              </Button>
            </motion.div>
          </div>
        </RevealSection>
      </main>

      {/* Minimal footer */}
      <footer className="px-6 py-12 border-t border-white/[0.04]">
        <div className="mx-auto max-w-3xl flex items-center justify-between text-[12px] text-white/20">
          <span>&copy; {new Date().getFullYear()} HIVE</span>
          <div className="flex gap-6">
            <Link href="/legal/terms" className="hover:text-white/40 transition-colors">
              Terms
            </Link>
            <Link href="/legal/privacy" className="hover:text-white/40 transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
