'use client';

import Link from 'next/link';
import { Logo, motion, NoiseOverlay, Button } from '@hive/ui/design-system/primitives';

// Premium easing
const EASE = [0.22, 1, 0.36, 1];

// Helpers who contributed along the way
const HELPERS = [
  'Jacob',
];

// Scroll-reveal section component
function RevealSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.section>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-void)] text-white">
      <NoiseOverlay />

      {/* Minimal header - just logo and CTA */}
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
        {/* Hero - full viewport */}
        <section className="min-h-screen flex flex-col justify-center px-6 py-24">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE }}
            >
              <p className="mb-4 text-[13px] font-medium uppercase tracking-wider text-[var(--color-gold)]/60">
                About
              </p>
              <h1
                className="mb-6 text-[44px] md:text-[64px] font-semibold leading-[1.05] tracking-tight text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                We stopped waiting
                <br />
                <span className="text-white/40">for institutions.</span>
              </h1>
            </motion.div>

            <motion.p
              className="text-[20px] leading-relaxed text-white/50 max-w-[480px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: EASE }}
            >
              So we built the infrastructure ourselves.
            </motion.p>

            {/* Scroll indicator */}
            <motion.div
              className="mt-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8, ease: EASE }}
            >
              <span className="text-[12px] text-white/20">Scroll</span>
            </motion.div>
          </div>
        </section>

        {/* The Break */}
        <RevealSection className="px-6 py-24">
          <div className="mx-auto max-w-3xl">
            <div className="space-y-8 text-[18px] md:text-[20px] leading-relaxed text-white/50">
              <p>
                The systems we were promised aren't working.
              </p>
              <p>
                Credentials collapse under AI. Platforms extract, they don't build.
                Loneliness is an epidemic wearing social media's mask.
              </p>
              <p>
                College has 400+ clubs with no real home. Group chats that die every semester.
                LinkedIn for your resume, Instagram for performance, nothing for actually
                building together.
              </p>
            </div>
          </div>
        </RevealSection>

        {/* The Belief - highlighted */}
        <RevealSection className="px-6 py-24">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-3xl border border-[var(--color-gold)]/10 bg-[var(--color-gold)]/[0.02] p-10 md:p-14">
              <p
                className="text-[26px] md:text-[32px] font-medium leading-[1.25] text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                "Students will build what institutions can't.
              </p>
              <p
                className="mt-2 text-[26px] md:text-[32px] font-medium leading-[1.25] text-white/40"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                We're just the infrastructure."
              </p>
            </div>
          </div>
        </RevealSection>

        {/* The Story */}
        <RevealSection className="px-6 py-24">
          <div className="mx-auto max-w-3xl">
            <h2
              className="mb-10 text-[28px] md:text-[32px] font-semibold text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              The story
            </h2>
            <div className="space-y-8 text-[18px] md:text-[20px] leading-relaxed text-white/50">
              <p>
                I started building HIVE because I saw the gap — between what students need
                and what institutions provide. Between the tools that exist and the ones
                that should.
              </p>
              <p>
                It took two years. I failed a few times. People helped along the way.
                But the vision stayed the same: infrastructure that serves students,
                not extracts from them.
              </p>
              <p>
                Now it's here. Not finished — it never will be. But ready.
                Ready for students to build on.
              </p>
            </div>
            <p className="mt-10 text-white/30 text-[16px]">
              — Laney
            </p>
          </div>
        </RevealSection>

        {/* The Helpers */}
        {HELPERS.length > 0 && (
          <RevealSection className="px-6 py-16">
            <div className="mx-auto max-w-3xl">
              <p className="mb-4 text-[13px] uppercase tracking-wider text-white/30">
                With help from
              </p>
              <div className="flex flex-wrap gap-4">
                {HELPERS.map((name, i) => (
                  <motion.span
                    key={name}
                    className="text-[17px] text-white/50"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
                  >
                    {name}
                  </motion.span>
                ))}
              </div>
            </div>
          </RevealSection>
        )}

        {/* The Future - CTA */}
        <RevealSection className="px-6 py-32">
          <div className="mx-auto max-w-3xl text-center">
            <p
              className="text-[28px] md:text-[36px] font-medium leading-[1.2] text-white mb-10"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              The builders inherit
              <br />
              <span className="text-white/40">what comes next.</span>
            </p>
            <Button variant="cta" size="lg" asChild>
              <a href="/enter">Enter with .edu</a>
            </Button>
          </div>
        </RevealSection>
      </main>

      {/* Minimal footer */}
      <footer className="px-6 py-8">
        <div className="mx-auto max-w-3xl flex items-center justify-between text-[12px] text-white/25">
          <span>&copy; {new Date().getFullYear()} HIVE</span>
          <div className="flex gap-4">
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
