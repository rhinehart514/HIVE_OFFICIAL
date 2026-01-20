'use client';

/**
 * HIVE Landing Page v5 - Minimal Bold Narrative
 *
 * Direction: Linear/Vercel energy with narrative scroll
 * Each section has one job. Story unfolds as you scroll.
 */

import { useRef } from 'react';
import {
  Button,
  motion,
  useInView,
  NoiseOverlay,
} from '@hive/ui/design-system/primitives';
import { usePlatformStats, formatStatNumber } from '@/hooks/use-platform-stats';
import { useFeaturedSpaces } from '@/hooks/use-featured-spaces';

// ============================================
// COMPONENTS
// ============================================

const HiveMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 1500 1500" className={className}>
    <path fill="currentColor" d="M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z" />
  </svg>
);

// Animated section wrapper
function Section({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.section
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

// ============================================
// SECTIONS
// ============================================

// Minimal fixed nav
function Navigation() {
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between">
        <a
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-2 py-1 -mx-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <HiveMark className="w-6 h-6 text-[#FFD700]" />
          <span className="font-semibold tracking-tight">HIVE</span>
        </a>

        <div className="flex items-center gap-6">
          <a
            href="/spaces"
            className="hidden sm:block text-sm text-white/50 hover:text-white transition-colors"
          >
            Browse
          </a>
          <Button variant="ghost" size="sm" asChild>
            <a href="/login">Sign in</a>
          </Button>
        </div>
      </nav>
    </motion.header>
  );
}

// Hero - One bold statement
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6">
      {/* Subtle gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px]">
          <div
            className="w-full h-full rounded-full blur-[200px] opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)' }}
          />
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05]">
            Student orgs,
            <br />
            <span className="text-white/30">finally connected.</span>
          </h1>
        </motion.div>

        <motion.p
          className="mt-8 text-lg sm:text-xl text-white/50 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          One platform for every club, every event, every tool.
          <br className="hidden sm:block" />
          Built by students, for students.
        </motion.p>

        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Button variant="cta" size="lg" asChild>
            <a href="/enter" className="gap-2 text-base px-8">
              Enter HIVE
              <span className="text-black/50">→</span>
            </a>
          </Button>
          <p className="mt-4 text-sm text-white/30">Free with .edu email</p>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1.5"
          animate={{ opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-1.5 rounded-full bg-white/40"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

// Problem - What's broken
function ProblemSection() {
  const problems = [
    'Events scattered across 12 different group chats',
    'No one knows what clubs actually exist',
    'The same Google Form gets shared 47 times',
    'Every org reinvents the same broken wheel',
  ];

  return (
    <Section className="py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-sm text-white/40 uppercase tracking-widest mb-8">The problem</p>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-16">
          Campus life is{' '}
          <span className="text-white/30">fragmented.</span>
        </h2>

        <ul className="space-y-6">
          {problems.map((problem, i) => (
            <motion.li
              key={i}
              className="flex items-start gap-4 text-lg sm:text-xl text-white/60"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.1 }}
            >
              <span className="text-white/20 font-mono text-sm mt-1.5">0{i + 1}</span>
              {problem}
            </motion.li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

// Solution - What HIVE is
function SolutionSection() {
  return (
    <Section className="py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-sm text-white/40 uppercase tracking-widest mb-8">The solution</p>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-8">
          HIVE brings it all{' '}
          <span className="text-[#FFD700]">together.</span>
        </h2>

        <p className="text-xl text-white/50 leading-relaxed mb-16">
          One home for your campus. Discover clubs, join spaces, build tools,
          and never miss what matters — all in one place.
        </p>

        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { title: 'Spaces', desc: '400+ clubs and organizations' },
            { title: 'Events', desc: 'One calendar for everything' },
            { title: 'HiveLab', desc: 'AI tools built by students' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              className="border-t border-white/10 pt-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-white/40">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// Proof - Social proof with live stats
function ProofSection() {
  const { stats, loading } = usePlatformStats();
  const { spaces } = useFeaturedSpaces(20);

  const displayOrgs = spaces.length > 0
    ? spaces.slice(0, 8).map(s => s.name)
    : ['Student Association', 'UB Hacking', 'Pre-Med Society', 'Dance Marathon', 'Debate Club', 'Engineering Club', 'Business Society', 'Art Collective'];

  return (
    <Section className="py-32 px-6 border-t border-white/[0.04]">
      <div className="max-w-4xl mx-auto">
        <p className="text-sm text-white/40 uppercase tracking-widest mb-8">Already live</p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-16">
          {[
            { value: stats.totalSpaces || 400, label: 'Spaces' },
            { value: stats.totalUsers || 0, label: 'Students' },
            { value: '1', label: 'Campus' },
            { value: 'UB', label: 'Live at' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center sm:text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-3xl sm:text-4xl font-bold mb-1">
                {loading ? (
                  <span className="text-white/20">—</span>
                ) : typeof stat.value === 'number' ? (
                  formatStatNumber(stat.value)
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-sm text-white/40">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Org list */}
        <div>
          <p className="text-sm text-white/30 mb-4">Organizations already here</p>
          <div className="flex flex-wrap gap-2">
            {displayOrgs.map((name, i) => (
              <motion.span
                key={name}
                className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm text-white/50"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                {name}
              </motion.span>
            ))}
            <span className="px-3 py-1.5 text-sm text-white/30">+{Math.max((stats.totalSpaces || 400) - 8, 392)} more</span>
          </div>
        </div>
      </div>
    </Section>
  );
}

// CTA - Founding class
function CTASection() {
  return (
    <Section className="py-32 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          className="inline-flex items-center gap-2 text-[#FFD700] text-sm font-medium mb-6"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span>✦</span>
          FOUNDING CLASS
          <span>✦</span>
        </motion.div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6">
          Join this week.
          <br />
          <span className="text-white/30">Get recognized forever.</span>
        </h2>

        <p className="text-lg text-white/50 mb-8 max-w-md mx-auto">
          First 500 students get the gold founding badge.
          Early access. Launch credits. Your name in history.
        </p>

        <Button variant="cta" size="lg" asChild>
          <a href="/enter" className="gap-2 text-base px-8">
            Claim your spot
            <span className="text-black/50">→</span>
          </a>
        </Button>
      </div>
    </Section>
  );
}

// Footer - Minimal
function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <HiveMark className="w-4 h-4 text-white/30" />
          <span className="text-sm text-white/30">© 2026 HIVE</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/legal/terms" className="text-sm text-white/30 hover:text-white/60 transition-colors">
            Terms
          </a>
          <a href="/legal/privacy" className="text-sm text-white/30 hover:text-white/60 transition-colors">
            Privacy
          </a>
          <a href="/legal/community-guidelines" className="text-sm text-white/30 hover:text-white/60 transition-colors">
            Guidelines
          </a>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// PAGE
// ============================================

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      <NoiseOverlay />

      <Navigation />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <ProofSection />
      <CTASection />
      <Footer />
    </div>
  );
}
