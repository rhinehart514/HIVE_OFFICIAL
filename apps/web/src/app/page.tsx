'use client';

/**
 * HIVE Landing Page — "The Void"
 *
 * One screen. One statement. One button.
 * The confidence IS the design.
 */

import Link from 'next/link';
import {
  Button,
  motion,
  NoiseOverlay,
  Logo,
} from '@hive/ui/design-system/primitives';

export default function LandingPage() {
  return (
    <div className="h-screen bg-[var(--color-bg-void)] text-[var(--color-text-primary)] flex flex-col overflow-hidden">
      <NoiseOverlay />

      {/* Main — vertically centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <Logo variant="mark" size="lg" color="gold" />
        </motion.div>

        {/* Statement */}
        <motion.h1
          className="text-center text-[clamp(32px,8vw,72px)] font-semibold leading-[1.0] tracking-[-0.02em] text-white max-w-[800px]"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          We stopped waiting.
        </motion.h1>

        {/* CTA */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Button variant="cta" size="lg" asChild>
            <a href="/enter">Enter with .edu</a>
          </Button>
        </motion.div>

        {/* Learn more */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <Link
            href="/about"
            className="text-[14px] text-white/40 hover:text-white/60 transition-colors"
          >
            Learn more
          </Link>
        </motion.div>
      </main>

      {/* Footer — minimal */}
      <footer className="py-6 px-6 flex justify-between items-center text-[12px] text-white/30">
        <span>HIVE</span>
        <div className="flex gap-4">
          <Link href="/legal/terms" className="hover:text-white/50 transition-colors">
            Terms
          </Link>
          <Link href="/legal/privacy" className="hover:text-white/50 transition-colors">
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  );
}
