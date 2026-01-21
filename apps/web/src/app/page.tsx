'use client';

/**
 * HIVE Landing Page — One Screen, One Action
 *
 * Philosophy: The confidence of something that already won.
 * One viewport. One statement. One action.
 */

import { useRef } from 'react';
import {
  Button,
  motion,
  useInView,
  NoiseOverlay,
  Logo,
  LogoMark,
  DisplayText,
  Text,
  Card,
  CardTitle,
  CardDescription,
} from '@hive/ui/design-system/primitives';

// ============================================
// FEATURE DATA
// ============================================

const FEATURES = [
  {
    title: 'Spaces',
    description: '400+ clubs and orgs, all in one place',
  },
  {
    title: 'Feed',
    description: 'One pulse for everything happening on campus',
  },
  {
    title: 'HiveLab',
    description: 'AI tools built by students, for students',
  },
];

// ============================================
// PAGE
// ============================================

export default function LandingPage() {
  const learnMoreRef = useRef<HTMLDivElement>(null);
  const isLearnMoreInView = useInView(learnMoreRef, { once: true, margin: '-100px' });

  const scrollToLearnMore = () => {
    learnMoreRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-void)] text-[var(--color-text-primary)]">
      <NoiseOverlay />

      {/* Hero - First Viewport */}
      <section className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            {/* Mark with glow */}
            <motion.div
              className="relative mb-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="absolute inset-0 w-32 h-32 mx-auto blur-[80px] bg-[var(--color-gold)]/15" />
              <Logo variant="mark" size="lg" color="gold" className="relative mx-auto" />
            </motion.div>

            {/* Statement */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <DisplayText size="sm" className="mb-12">
                Your campus.
                <br />
                <span className="text-[var(--color-text-muted)]">One place.</span>
              </DisplayText>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <Button variant="cta" size="lg" asChild>
                <a href="/enter">
                  Enter →
                </a>
              </Button>
              <Text size="sm" tone="muted" className="mt-4">
                Free with .edu
              </Text>
            </motion.div>

            {/* Learn more */}
            <motion.button
              onClick={scrollToLearnMore}
              className="mt-16 flex flex-col items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <Text size="sm" tone="muted" as="span">Learn more</Text>
              <span className="animate-bounce">↓</span>
            </motion.button>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--color-border-subtle)] px-6 py-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <LogoMark markSize={16} markColor="var(--color-text-dim)" />
            <div className="flex gap-6">
              <a
                href="/legal/terms"
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                Terms
              </a>
              <a
                href="/legal/privacy"
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                Privacy
              </a>
            </div>
            <a
              href="/login"
              className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] transition-colors"
            >
              Already in? →
            </a>
          </div>
        </footer>
      </section>

      {/* Learn More - Second Viewport */}
      <section
        ref={learnMoreRef}
        className="min-h-screen flex items-center justify-center px-6 py-24"
      >
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={isLearnMoreInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Text size="sm" tone="muted" className="uppercase tracking-widest mb-8">
            What's inside
          </Text>

          {/* Feature cards */}
          <div className="grid sm:grid-cols-3 gap-6 mb-16">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isLearnMoreInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
              >
                <Card elevation="resting" className="text-center h-full">
                  <CardTitle className="text-lg mb-2">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Second CTA */}
          <Button variant="cta" size="lg" asChild>
            <a href="/enter">
              Enter HIVE →
            </a>
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
