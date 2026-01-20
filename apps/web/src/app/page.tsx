'use client';

/**
 * HIVE Landing Page v4 - Glassmorphism
 *
 * Direction 1: Glass panels, depth layers, data visualization
 * Optimized for conversion with social proof
 */

import { useRef, useEffect, useState } from 'react';
import {
  Button,
  Badge,
  Skeleton,
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

// Glass card component
function GlassCard({
  children,
  className = '',
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`
        relative rounded-2xl
        bg-white/[0.02] backdrop-blur-xl
        border border-white/[0.06]
        ${hover ? 'transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Stat card with progress bar visualization
function StatCard({
  value,
  label,
  loading,
  highlight = false,
}: {
  value: string | number;
  label: string;
  loading?: boolean;
  highlight?: boolean;
}) {
  const displayValue = typeof value === 'number' ? formatStatNumber(value) : value;

  return (
    <GlassCard className="p-4">
      {loading ? (
        <>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-16" />
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`text-2xl font-bold tabular-nums ${highlight ? 'text-[#FFD700]' : 'text-white'}`}>
              {displayValue}
            </span>
          </div>
          <div className="text-xs text-white/40 uppercase tracking-wide">{label}</div>
          {/* Mini progress bar */}
          <div className="mt-3 h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${highlight ? 'bg-[#FFD700]/60' : 'bg-white/20'}`}
              initial={{ width: 0 }}
              animate={{ width: '70%' }}
              transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
            />
          </div>
        </>
      )}
    </GlassCard>
  );
}

// Live activity indicator
function LiveIndicator() {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        className="w-2 h-2 rounded-full bg-[#FFD700]"
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span className="text-xs text-white/60">Live</span>
    </div>
  );
}

// ============================================
// SECTIONS
// ============================================

// Navigation
function Navigation() {
  return (
    <motion.header
      className="fixed top-4 left-4 right-4 z-50"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <nav className="max-w-6xl mx-auto">
        <GlassCard className="px-4 h-14 flex items-center justify-between" hover={false}>
          <a
            href="/"
            className="flex items-center gap-2 rounded-lg px-2 py-1 -mx-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <HiveMark className="w-5 h-5 text-[#FFD700]" />
            <span className="font-semibold text-sm tracking-tight">HIVE</span>
          </a>

          <div className="hidden md:flex items-center gap-6">
            <a
              href="/spaces"
              className="text-sm text-white/50 hover:text-white transition-colors rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Spaces
            </a>
            <a
              href="/tools"
              className="text-sm text-white/50 hover:text-white transition-colors rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              HiveLab
            </a>
          </div>

          <Button variant="ghost" size="sm" asChild>
            <a href="/login">Sign in</a>
          </Button>
        </GlassCard>
      </nav>
    </motion.header>
  );
}

// Hero with bento grid layout
function HeroSection({
  stats,
  loading,
}: {
  stats: ReturnType<typeof usePlatformStats>['stats'];
  loading: boolean;
}) {
  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px]">
          <div
            className="w-full h-full rounded-full blur-[150px] opacity-60"
            style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)' }}
          />
        </div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px]">
          <div
            className="w-full h-full rounded-full blur-[120px] opacity-40"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)' }}
          />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6">
        {/* Bento Grid */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Main hero card - spans 2 columns */}
          <GlassCard className="lg:col-span-2 p-8 md:p-12" hover={false}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Badge variant="outline" className="mb-6 inline-flex">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-[#FFD700] mr-2"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                Live at UB · Buffalo, NY
              </Badge>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <span className="text-[#FFD700]">400+</span> student orgs.
              <br />
              <span className="text-white/40">One platform.</span>
            </motion.h1>

            <motion.p
              className="text-lg text-white/50 max-w-md mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Your clubs, your events, your tools — finally in one place.
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button variant="cta" size="lg" asChild>
                <a href="/enter" className="gap-2">
                  Enter HIVE
                  <motion.span
                    className="inline-block"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </a>
              </Button>
              <span className="text-sm text-white/30">Free with .edu email</span>
            </motion.div>
          </GlassCard>

          {/* Stats column */}
          <div className="flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <StatCard
                value={stats.totalSpaces || 400}
                label="Spaces Live"
                loading={loading}
                highlight
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <StatCard
                value={stats.totalUsers || 0}
                label="Students"
                loading={loading}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <GlassCard className="p-4 flex-1">
                <LiveIndicator />
                <div className="mt-3 flex gap-1">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#FFD700]/60"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <div className="mt-2 text-xs text-white/40">Campus activity</div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Org ticker with auto-scroll
function OrgTicker() {
  const { spaces } = useFeaturedSpaces(30);

  // Fallback org names if API hasn't loaded
  const fallbackOrgs = [
    'Student Association',
    'UB Hacking',
    'Pre-Med Society',
    'Dance Marathon',
    'Debate Club',
    'Engineering Club',
    'Business Society',
    'Art Collective',
  ];

  const orgNames = spaces.length > 0
    ? spaces.map(s => s.name)
    : fallbackOrgs;

  // Duplicate for seamless loop
  const duplicatedOrgs = [...orgNames, ...orgNames];

  return (
    <section className="py-8 overflow-hidden border-y border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-6 mb-4">
        <span className="text-xs text-white/30 uppercase tracking-wide">Already here</span>
      </div>

      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0A0A09] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0A0A09] to-transparent z-10" />

        <motion.div
          className="flex gap-3"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {duplicatedOrgs.map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="shrink-0 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-sm text-white/60"
            >
              {name}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Feature triptych
function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const features = [
    {
      title: 'Spaces',
      description: 'Find your people. 400+ clubs and organizations waiting.',
      visual: (
        <div className="aspect-video rounded-lg bg-white/[0.02] border border-white/[0.04] p-3 mb-4">
          <div className="flex gap-2 mb-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-lg bg-white/[0.06]" />
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-white/[0.06] rounded w-3/4" />
            <div className="h-2 bg-white/[0.04] rounded w-1/2" />
          </div>
        </div>
      ),
    },
    {
      title: 'HiveLab',
      description: 'Build AI tools. 35 templates ready to deploy.',
      isTerminal: true,
      visual: (
        <div className="aspect-video rounded-lg bg-black/50 border border-white/[0.08] p-3 mb-4 font-mono text-xs">
          <div className="text-white/40 mb-1">{'>'} HIVELAB_</div>
          <div className="text-[#FFD700]/80">{'>'} build.ai()</div>
          <div className="text-white/30">{'>'} deploy()</div>
          <motion.span
            className="inline-block w-2 h-4 bg-white/60 ml-1"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      ),
    },
    {
      title: 'Events',
      description: "Never miss what's on. All in one calendar.",
      visual: (
        <div className="aspect-video rounded-lg bg-white/[0.02] border border-white/[0.04] p-3 mb-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="aspect-square rounded bg-white/[0.04] flex items-center justify-center text-[8px] text-white/30">
                {i + 1}
              </div>
            ))}
          </div>
          <div className="h-2 bg-[#FFD700]/20 rounded w-full mb-1" />
          <div className="h-2 bg-white/[0.04] rounded w-2/3" />
        </div>
      ),
    },
  ];

  return (
    <section ref={ref} className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What you get</h2>
          <p className="text-white/40">Everything students need. Nothing they don&apos;t.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <GlassCard className="p-6 h-full">
                {feature.visual}
                <h3 className={`text-xl font-bold mb-2 ${feature.isTerminal ? 'text-[#FFD700]' : 'text-white'}`}>
                  {feature.title}
                </h3>
                <p className="text-sm text-white/50">{feature.description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Founding Class CTA
function FoundingClassSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { stats } = usePlatformStats();

  // Animated counter
  const [count, setCount] = useState(0);
  const targetCount = stats.totalUsers || 147;

  useEffect(() => {
    if (isInView && targetCount > 0) {
      const duration = 1500;
      const steps = 30;
      const increment = targetCount / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= targetCount) {
          setCount(targetCount);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isInView, targetCount]);

  return (
    <section ref={ref} className="py-24">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="p-8 md:p-12 text-center relative overflow-hidden">
            {/* Gold glow border effect */}
            <div className="absolute inset-0 rounded-2xl opacity-50">
              <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-b from-[#FFD700]/20 via-transparent to-[#FFD700]/10" />
            </div>

            <div className="relative z-10">
              <motion.div
                className="inline-flex items-center gap-2 text-[#FFD700] text-sm font-medium mb-6"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-lg">✦</span>
                FOUNDING CLASS
                <span className="text-lg">✦</span>
              </motion.div>

              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Join this week.
                <br />
                <span className="text-white/40">Get recognized forever.</span>
              </h2>

              <div className="flex flex-wrap justify-center gap-4 text-sm text-white/50 mb-8">
                <span className="flex items-center gap-2">
                  <span className="text-[#FFD700]">✓</span> Gold badge
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-[#FFD700]">✓</span> Early access
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-[#FFD700]">✓</span> Launch credits
                </span>
              </div>

              <Button variant="cta" size="lg" asChild>
                <a href="/enter" className="gap-2">
                  Claim your spot
                  <motion.span
                    className="inline-block"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </a>
              </Button>

              <div className="mt-6 text-sm text-white/30">
                <span className="text-white/60 font-medium tabular-nums">{count}</span> students joined
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <HiveMark className="w-4 h-4 text-white/30" />
          <span className="text-xs text-white/30">© 2026 HIVE</span>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="/legal/terms"
            className="text-xs text-white/30 hover:text-white/60 transition-colors rounded px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Terms
          </a>
          <a
            href="/legal/privacy"
            className="text-xs text-white/30 hover:text-white/60 transition-colors rounded px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Privacy
          </a>
          <a
            href="/legal/community-guidelines"
            className="text-xs text-white/30 hover:text-white/60 transition-colors rounded px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
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
  const { stats, loading } = usePlatformStats();

  return (
    <div className="min-h-screen bg-[#0A0A09] text-white overflow-x-hidden">
      <NoiseOverlay />

      <Navigation />
      <HeroSection stats={stats} loading={loading} />
      <OrgTicker />
      <FeaturesSection />
      <FoundingClassSection />
      <Footer />
    </div>
  );
}
