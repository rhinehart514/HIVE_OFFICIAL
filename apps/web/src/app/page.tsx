'use client';

/**
 * HIVE Landing Page
 *
 * One screen. One action. Nothing else.
 */

import {
  Button,
  motion,
  NoiseOverlay,
  Logo,
  LogoMark,
} from '@hive/ui/design-system/primitives';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-void)] text-[var(--color-text-primary)] flex flex-col">
      <NoiseOverlay />

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          {/* Mark */}
          <motion.div
            className="relative mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="absolute inset-0 w-24 h-24 mx-auto blur-[60px] bg-[var(--color-gold)]/20" />
            <Logo variant="mark" size="lg" color="gold" className="relative mx-auto" />
          </motion.div>

          {/* Statement */}
          <motion.h1
            className="text-[clamp(2rem,8vw,4rem)] font-semibold tracking-tight leading-[1.1] mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Your campus.
            <br />
            <span className="text-[var(--color-text-dim)]">One place.</span>
          </motion.h1>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Button variant="cta" size="lg" asChild>
              <a href="/enter">Enter</a>
            </Button>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6">
        <div className="max-w-md mx-auto flex items-center justify-between text-[13px] text-[var(--color-text-dim)]">
          <LogoMark markSize={14} markColor="var(--color-text-dim)" />
          <div className="flex gap-4">
            <a href="/legal/terms" className="hover:text-[var(--color-text-muted)] transition-colors">Terms</a>
            <a href="/legal/privacy" className="hover:text-[var(--color-text-muted)] transition-colors">Privacy</a>
          </div>
          <a href="/login" className="hover:text-[var(--color-text-muted)] transition-colors">Sign in</a>
        </div>
      </footer>
    </div>
  );
}
