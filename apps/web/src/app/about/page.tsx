'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo, motion, NoiseOverlay, Button } from '@hive/ui/design-system/primitives';

// Helpers who contributed along the way
// Add names here as needed
const HELPERS = [
  'Jacob',
  // Add more names as needed
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-void)]">
      <NoiseOverlay />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[var(--color-bg-void)]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-70">
              <Logo variant="mark" size="sm" color="gold" />
            </Link>
            <Button variant="cta" size="sm" asChild>
              <a href="/enter">Enter with .edu</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          {/* Hero */}
          <motion.header
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mb-3 text-[13px] font-medium uppercase tracking-wider text-[var(--color-gold)]/70">
              About
            </p>
            <h1
              className="mb-6 text-[40px] font-semibold leading-[1.1] tracking-tight text-white md:text-[56px]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              We stopped waiting for institutions.
            </h1>
            <p className="text-[18px] leading-relaxed text-white/60 max-w-[540px]">
              So we built the infrastructure ourselves.
            </p>
          </motion.header>

          {/* The Break */}
          <motion.section
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="space-y-6 text-[17px] leading-relaxed text-white/50">
              <p>
                The systems we were promised aren't working.
              </p>
              <p>
                Credentials collapse under AI. Platforms extract, they don't build.
                Loneliness is an epidemic wearing social media's mask.
                Trust in institutions hits generational lows.
              </p>
              <p>
                College has 400+ clubs with no real home. Group chats that die every semester.
                LinkedIn for your resume, Instagram for performance, nothing for actually
                building together.
              </p>
            </div>
          </motion.section>

          {/* The Belief */}
          <motion.section
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="rounded-2xl border border-[var(--color-gold)]/10 bg-[var(--color-gold)]/[0.03] p-8">
              <p
                className="text-[24px] md:text-[28px] font-medium leading-[1.3] text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                "Students will build what institutions can't.
                <br />
                <span className="text-white/50">We're just the infrastructure."</span>
              </p>
            </div>
          </motion.section>

          {/* The Story */}
          <motion.section
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2
              className="mb-8 text-[24px] font-semibold text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              The story
            </h2>
            <div className="space-y-6 text-[17px] leading-relaxed text-white/50">
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
              <p className="text-white/30 text-[15px]">
                — Laney
              </p>
            </div>
          </motion.section>

          {/* The Helpers */}
          {HELPERS.length > 0 && (
            <motion.section
              className="mb-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2
                className="mb-6 text-[20px] font-semibold text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                With help from
              </h2>
              <div className="flex flex-wrap gap-3">
                {HELPERS.map((name) => (
                  <span
                    key={name}
                    className="text-[15px] text-white/40"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </motion.section>
          )}

          {/* The Future */}
          <motion.section
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="border-t border-white/[0.06] pt-12">
              <p
                className="text-[20px] md:text-[24px] font-medium leading-[1.4] text-white/70 mb-8"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                The builders inherit what comes next.
              </p>
              <Button variant="cta" size="lg" asChild>
                <a href="/enter">Enter with .edu</a>
              </Button>
            </div>
          </motion.section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex items-center justify-between text-[12px] text-white/30">
            <span>&copy; {new Date().getFullYear()} HIVE</span>
            <div className="flex gap-4">
              <Link href="/legal/terms" className="hover:text-white/50 transition-colors">
                Terms
              </Link>
              <Link href="/legal/privacy" className="hover:text-white/50 transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
