'use client';

/**
 * HIVE Landing Page v3
 *
 * Motion: Cursor tracking, 3D tilt, text reveal, horizontal scroll
 * Layout: Asymmetric hero, sticky sections, overlapping layers
 */

import { useRef } from 'react';
import {
  Button,
  Badge,
  Skeleton,
  // Motion primitives
  Tilt,
  Magnetic,
  TextReveal,
  CursorGlow,
  NoiseOverlay,
  motion,
  useScroll,
  useTransform,
  useInView,
} from '@hive/ui/design-system/primitives';
import { usePlatformStats, formatStatNumber, formatActivityTime } from '@/hooks/use-platform-stats';

// ============================================
// VISUAL COMPONENTS
// ============================================

const HiveMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 1500 1500" className={className}>
    <path fill="currentColor" d="M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z" />
  </svg>
);

// ============================================
// SECTIONS
// ============================================

// Hero with split layout and parallax
function HeroSection({ stats, loading }: { stats: ReturnType<typeof usePlatformStats>['stats']; loading: boolean }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  const textY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[120vh] flex items-center overflow-hidden">
      {/* Background elements */}
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        {/* Large gradient orb */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px]">
          <motion.div
            className="w-full h-full rounded-full blur-[150px]"
            style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.12) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.15, 1], rotate: [0, 10, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }} />

        {/* Diagonal lines */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-px w-[200%] bg-gradient-to-r from-transparent via-white/5 to-transparent"
              style={{
                top: `${20 + i * 20}%`,
                left: '-50%',
                transform: 'rotate(-15deg)',
              }}
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: '0%', opacity: 1 }}
              transition={{ duration: 2, delay: 0.5 + i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>

      {/* Main content */}
      <motion.div className="relative z-10 w-full max-w-7xl mx-auto px-6" style={{ y: textY, opacity }}>
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left: Text */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Badge variant="outline" className="mb-8 inline-flex">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-[#FFD700] mr-2"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                Live at UB · Buffalo, NY
              </Badge>
            </motion.div>

            <h1 className="text-[clamp(3rem,8vw,6rem)] font-bold leading-[0.9] tracking-tight mb-8">
              <TextReveal text="Student" className="block" />
              <TextReveal text="infrastructure" className="block text-white/30" delay={0.2} />
              <TextReveal text="for the" className="block text-white/30 text-[0.5em]" delay={0.4} />
              <TextReveal text="new era" className="block text-[#FFD700]/80" delay={0.5} />
            </h1>

            <motion.p
              className="text-lg md:text-xl text-white/50 max-w-md mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              Communities, AI tools, and connections—built by students, owned by students.
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <Magnetic>
                <Button variant="cta" size="lg" asChild>
                  <a href="/enter">
                    Enter HIVE
                    <motion.span
                      className="ml-2 inline-block"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </a>
                </Button>
              </Magnetic>

              <span className="text-sm text-white/30">
                Free with .edu email
              </span>
            </motion.div>
          </div>

          {/* Right: Visual */}
          <div className="lg:col-span-5 relative">
            <Tilt className="perspective-1000">
              <motion.div
                className="relative aspect-square"
                initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Hexagon pattern */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <HiveMark className="w-3/4 h-3/4 text-white/[0.02]" />
                </div>

                {/* Floating cards - Real stats */}
                <motion.div
                  className="absolute top-[10%] left-[10%] p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transform: 'translateZ(40px)' }}
                >
                  <div className="text-xs text-white/50 mb-1">Active now</div>
                  {loading ? (
                    <Skeleton className="h-7 w-16 bg-white/10" />
                  ) : (
                    <div className="text-2xl font-bold text-[#FFD700]">
                      {stats.activeUsers > 0 ? formatStatNumber(stats.activeUsers) : '—'}
                    </div>
                  )}
                  <div className="text-xs text-white/30">students</div>
                </motion.div>

                <motion.div
                  className="absolute bottom-[15%] right-[5%] p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  style={{ transform: 'translateZ(60px)' }}
                >
                  {stats.recentActivity ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded bg-[#FFD700]/20" />
                        <span className="text-sm font-medium">
                          {stats.recentActivity.handle ? `@${stats.recentActivity.handle}` : stats.recentActivity.spaceName}
                        </span>
                      </div>
                      <div className="text-xs text-white/40">
                        {stats.recentActivity.type === 'space_created' ? 'Just claimed their space' : 'Just joined HIVE'}
                        {' · '}{formatActivityTime(stats.recentActivity.timestamp)}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded bg-[#FFD700]/20" />
                        <span className="text-sm font-medium">New spaces daily</span>
                      </div>
                      <div className="text-xs text-white/40">Join the community</div>
                    </>
                  )}
                </motion.div>

                <motion.div
                  className="absolute top-[40%] right-[15%] px-3 py-2 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20"
                  animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ transform: 'translateZ(30px)' }}
                >
                  <span className="text-xs font-medium text-[#FFD700]">
                    {loading ? '...' : stats.totalSpaces > 0 ? `${formatStatNumber(stats.totalSpaces)} Spaces` : 'Launch soon'}
                  </span>
                </motion.div>
              </motion.div>
            </Tilt>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className="w-px h-20 bg-gradient-to-b from-white/30 to-transparent"
          animate={{ scaleY: [0.5, 1, 0.5], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    </section>
  );
}

// Horizontal scroll showcase
function ShowcaseSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const x = useTransform(scrollYProgress, [0.2, 0.8], ['0%', '-50%']);

  const features = [
    {
      title: 'Spaces',
      desc: 'Real communities with real activity',
      color: '#FFFFFF',
      icon: '◇',
    },
    {
      title: 'HiveLab',
      desc: 'Build tools with AI in seconds',
      color: '#FFD700',
      icon: '◈',
    },
    {
      title: 'Connect',
      desc: 'Find your people across campus',
      color: '#FFFFFF',
      icon: '◆',
    },
    {
      title: 'Events',
      desc: 'Never miss what matters',
      color: '#FFFFFF',
      icon: '◉',
    },
  ];

  return (
    <section ref={containerRef} className="relative py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <motion.p
          className="text-sm font-medium tracking-widest uppercase text-[#FFD700] mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          The Platform
        </motion.p>
        <motion.h2
          className="text-4xl md:text-6xl font-bold"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Everything students need.
          <br />
          <span className="text-white/30">Nothing they don't.</span>
        </motion.h2>
      </div>

      {/* Horizontal scroll cards */}
      <motion.div className="flex gap-6 px-6" style={{ x }}>
        {features.map((feature, i) => (
          <Tilt key={feature.title}>
            <motion.div
              className="relative shrink-0 w-[400px] h-[500px] rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 overflow-hidden group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ borderColor: 'rgba(255,255,255,0.15)' }}
            >
              {/* Glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${feature.color === '#FFD700' ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)'}, transparent 60%)`,
                }}
              />

              {/* Content */}
              <div className="relative h-full flex flex-col">
                <span
                  className="text-6xl mb-auto"
                  style={{ color: feature.color, opacity: feature.color === '#FFD700' ? 0.8 : 0.2 }}
                >
                  {feature.icon}
                </span>

                <div>
                  <h3 className="text-3xl font-bold mb-3" style={{ color: feature.color === '#FFD700' ? '#FFD700' : 'white' }}>
                    {feature.title}
                  </h3>
                  <p className="text-white/50 text-lg">{feature.desc}</p>
                </div>
              </div>

              {/* Corner decoration */}
              <div className="absolute bottom-0 right-0 w-32 h-32 border-l border-t border-white/[0.04] rounded-tl-3xl" />
            </motion.div>
          </Tilt>
        ))}
      </motion.div>
    </section>
  );
}

// Sticky stats section with parallax numbers
function StatsSection({ stats, loading }: { stats: ReturnType<typeof usePlatformStats>['stats']; loading: boolean }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [50, -150]);
  const y3 = useTransform(scrollYProgress, [0, 1], [150, -50]);

  // Build stats array with real data
  const displayStats = [
    {
      value: loading ? '...' : stats.totalUsers > 0 ? formatStatNumber(stats.totalUsers) : '—',
      label: 'Students',
      y: y1,
    },
    {
      value: loading ? '...' : stats.totalSpaces > 0 ? formatStatNumber(stats.totalSpaces) : '—',
      label: 'Spaces',
      y: y2,
    },
    { value: '24/7', label: 'Always on', y: y3 },
  ];

  return (
    <section ref={ref} className="relative py-40 overflow-hidden">
      {/* Background text */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, 200]) }}
      >
        <span className="text-[30vw] font-bold text-white/[0.015] select-none">HIVE</span>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12">
          {displayStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              style={{ y: stat.y }}
            >
              <motion.div
                className="text-7xl md:text-8xl font-bold mb-4 tabular-nums"
                style={{ color: i === 0 ? '#FFD700' : 'white' }}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, type: 'spring', stiffness: 100 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-white/40 text-lg">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Final CTA with dramatic reveal
function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="relative py-40">
      {/* Background gradient */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1 }}
      >
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full blur-[200px]"
          style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%)' }}
        />
      </motion.div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-6">
            <TextReveal text="Ready?" delay={0} />
          </h2>
        </motion.div>

        <motion.p
          className="text-xl md:text-2xl text-white/40 mb-12"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
        >
          Your campus is already here.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
        >
          <Magnetic className="inline-block">
            <Button variant="cta" size="lg" asChild>
              <a href="/enter" className="px-12">
                Get started free
                <motion.span
                  className="ml-3 inline-block"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </a>
            </Button>
          </Magnetic>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// PAGE
// ============================================

export default function LandingPage() {
  // Fetch real platform stats
  const { stats, loading } = usePlatformStats();

  return (
    <div className="min-h-screen bg-[#0A0A09] text-white overflow-x-hidden">
      <CursorGlow />
      <NoiseOverlay />

      {/* Floating nav */}
      <motion.header
        className="fixed top-4 left-4 right-4 z-50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <nav className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between rounded-full border border-white/[0.08] bg-black/60 backdrop-blur-xl">
          <a href="/" className="flex items-center gap-2">
            <HiveMark className="w-5 h-5 text-[#FFD700]" />
            <span className="font-semibold text-sm tracking-tight">HIVE</span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            <a href="/spaces/browse" className="text-sm text-white/50 hover:text-white transition-colors">Spaces</a>
            <a href="/tools" className="text-sm text-white/50 hover:text-white transition-colors">HiveLab</a>
            <a href="/schools" className="text-sm text-white/50 hover:text-white transition-colors">Schools</a>
          </div>

          <Button variant="ghost" size="sm" asChild>
            <a href="/enter">Sign in</a>
          </Button>
        </nav>
      </motion.header>

      <HeroSection stats={stats} loading={loading} />
      <ShowcaseSection />
      <StatsSection stats={stats} loading={loading} />
      <CTASection />

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HiveMark className="w-4 h-4 text-white/30" />
            <span className="text-xs text-white/30">© 2026 HIVE</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/legal/terms" className="text-xs text-white/30 hover:text-white/60 transition-colors">Terms</a>
            <a href="/legal/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy</a>
            <a href="/legal/community-guidelines" className="text-xs text-white/30 hover:text-white/60 transition-colors">Guidelines</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
