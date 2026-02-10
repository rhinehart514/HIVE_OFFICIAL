'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  Logo,
  motion,
  NoiseOverlay,
  useScroll,
  useTransform,
  useInView,
  MOTION,
  RevealSection,
  NarrativeReveal,
  AnimatedBorder,
  ParallaxText,
  ScrollSpacer,
} from '@hive/ui/design-system/primitives';

// Early contributors (alphabetical)
interface Contributor {
  name: string;
  role: string;
  linkedin?: string;
}

const CONTRIBUTORS: Contributor[] = [
  { name: 'Brunda', role: 'Development', linkedin: 'https://www.linkedin.com/in/brunda-venkatesh/' },
  { name: 'Daniel', role: 'Marketing', linkedin: 'https://www.linkedin.com/in/danielohebshalom/' },
  { name: 'Gavin', role: 'Marketing', linkedin: 'https://www.linkedin.com/in/malecgavin/' },
  { name: 'Mirka', role: 'Marketing', linkedin: 'https://www.linkedin.com/in/mirka-arevalo/' },
  { name: 'Noah', role: 'Operations', linkedin: 'https://www.linkedin.com/in/noahowsh/' },
  { name: 'Rachana', role: 'Development', linkedin: 'https://www.linkedin.com/in/rachana-ramesh-0414a6164/' },
  { name: 'Samarth', role: 'Marketing', linkedin: 'https://www.linkedin.com/in/samarth-yaralakatte-mallappa/' },
];

// ============================================
// VISUALIZATION COMPONENTS
// ============================================

/**
 * Before/After Split Screen Visualization
 * Shows fragmented tools vs unified HIVE surface
 */
function BeforeAfterSplit() {
  const [hoveredSide, setHoveredSide] = useState<'before' | 'after' | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const fragmentedTools = [
    { name: 'GroupMe', color: '#00AFF0' },
    { name: 'Slack', color: '#4A154B' },
    { name: 'Notion', color: '#FFFFFF' },
    { name: 'Docs', color: '#4285F4' },
    { name: 'Drive', color: '#34A853' },
    { name: 'Email', color: '#EA4335' },
  ];

  return (
    <motion.div
      ref={ref}
      className="relative overflow-hidden rounded-lg border border-white/[0.06]"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: MOTION.ease.premium }}
    >
      <div className="grid grid-cols-2 min-h-[320px]">
        {/* BEFORE side */}
        <motion.div
          className="relative p-8 bg-red-500/[0.02] border-r border-white/[0.06] cursor-pointer"
          onMouseEnter={() => setHoveredSide('before')}
          onMouseLeave={() => setHoveredSide(null)}
          animate={{
            opacity: hoveredSide === 'after' ? 0.5 : 1,
            scale: hoveredSide === 'before' ? 1.02 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-red-400/60 text-label-sm uppercase tracking-wider mb-6">Before</p>
          <div className="flex flex-wrap gap-3">
            {fragmentedTools.map((tool, i) => (
              <motion.div
                key={tool.name}
                className="px-3 py-2 rounded-lg bg-black/40 border border-white/[0.06]"
                initial={{ opacity: 0, scale: 0.8, rotate: Math.random() * 10 - 5 }}
                animate={isInView ? { opacity: 1, scale: 1, rotate: Math.random() * 6 - 3 } : {}}
                transition={{ delay: 0.1 * i, duration: 0.5, ease: MOTION.ease.premium }}
              >
                <span className="text-body-sm text-white/50">{tool.name}</span>
              </motion.div>
            ))}
          </div>
          <motion.p
            className="absolute bottom-8 left-8 right-8 text-white/50 text-body-sm"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            Scattered across 6+ tools. Knowledge dies with graduation.
          </motion.p>
        </motion.div>

        {/* AFTER side */}
        <motion.div
          className="relative p-8 bg-[var(--color-gold)]/[0.02] cursor-pointer"
          onMouseEnter={() => setHoveredSide('after')}
          onMouseLeave={() => setHoveredSide(null)}
          animate={{
            opacity: hoveredSide === 'before' ? 0.5 : 1,
            scale: hoveredSide === 'after' ? 1.02 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-[var(--color-gold)]/60 text-label-sm uppercase tracking-wider mb-6">After</p>
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.8, ease: MOTION.ease.premium }}
          >
            <div className="px-6 py-8 rounded-lg bg-black/40 border border-[var(--color-gold)]/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-gold)]/20 flex items-center justify-center">
                  <Logo variant="mark" size="xs" color="gold" />
                </div>
                <span className="text-body text-white/50 font-medium">Your Space</span>
              </div>
              <div className="flex gap-2 text-label-sm text-white/50">
                <span className="px-2 py-1 rounded bg-white/[0.06]">Posts</span>
                <span className="px-2 py-1 rounded bg-white/[0.06]">Events</span>
                <span className="px-2 py-1 rounded bg-white/[0.06]">Files</span>
                <span className="px-2 py-1 rounded bg-white/[0.06]">Members</span>
              </div>
            </div>
          </motion.div>
          <motion.p
            className="absolute bottom-8 left-8 right-8 text-white/50 text-body-sm"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1, duration: 0.6 }}
          >
            One unified surface. Everything persists.
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * Time Collapse Bar
 * Visual showing compression from 14 weeks to 2 weeks
 */
function TimeCollapseBar() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      className="bg-black/20 border border-white/[0.06] rounded-lg p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: MOTION.ease.premium }}
    >
      <p className="text-white/50 text-body-sm mb-6">Time to rebuild momentum each year</p>

      {/* Traditional approach */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-body-sm">Without HIVE</span>
          <span className="text-red-400/60 text-body-sm font-mono">8-10 weeks</span>
        </div>
        <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-red-500/30"
            initial={{ width: 0 }}
            animate={isInView ? { width: '100%' } : {}}
            transition={{ delay: 0.2, duration: 1.2, ease: MOTION.ease.premium }}
          />
        </div>
      </div>

      {/* With HIVE */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-body-sm">With HIVE</span>
          <span className="text-[var(--color-gold)]/80 text-body-sm font-mono">Day 1</span>
        </div>
        <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[var(--color-gold)]/40"
            initial={{ width: 0 }}
            animate={isInView ? { width: '12%' } : {}}
            transition={{ delay: 0.6, duration: 0.8, ease: MOTION.ease.premium }}
          />
        </div>
      </div>

      <motion.p
        className="text-white/25 text-label mt-4 italic"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1, duration: 0.6 }}
      >
        New leadership logs in. Everything&apos;s already there.
      </motion.p>
    </motion.div>
  );
}

/**
 * Network Ripple Animation
 * Concentric circles showing scaling: 1 → 10 → 100 → 1000
 */
function NetworkRipple() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const rings = [
    { value: '1', label: 'tool built', delay: 0, scale: 0.3 },
    { value: '10', label: 'orgs use it', delay: 0.3, scale: 0.55 },
    { value: '100', label: 'campuses deploy', delay: 0.6, scale: 0.8 },
    { value: '1000+', label: 'problems solved', delay: 0.9, scale: 1 },
  ];

  return (
    <motion.div
      ref={ref}
      className="relative bg-black/20 border border-white/[0.06] rounded-lg p-8 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6 }}
    >
      <p className="text-white/50 text-body-sm mb-8 text-center">Network effects</p>

      <div className="relative h-[280px] flex items-center justify-center">
        {/* Ripple rings */}
        {rings.map((ring, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-[var(--color-gold)]"
            style={{
              width: `${ring.scale * 260}px`,
              height: `${ring.scale * 260}px`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 0.15 + (i * 0.05), scale: 1 } : {}}
            transition={{ delay: ring.delay, duration: 0.8, ease: MOTION.ease.premium }}
          />
        ))}

        {/* Center content */}
        <motion.div
          className="relative z-10 text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 flex items-center justify-center">
            <Logo variant="mark" size="sm" color="gold" />
          </div>
        </motion.div>

        {/* Labels */}
        {rings.map((ring, i) => (
          <motion.div
            key={`label-${i}`}
            className="absolute text-center"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, ${(ring.scale * 130) + 30}px)`,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: ring.delay + 0.3, duration: 0.5 }}
          >
            <span className="text-[var(--color-gold)] text-title-sm font-semibold">{ring.value}</span>
            <p className="text-white/50 text-label-sm">{ring.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.p
        className="text-white/50 text-body-sm text-center mt-4"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        Build once. Benefit everywhere.
      </motion.p>
    </motion.div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  const [activeTab, setActiveTab] = useState<'story' | 'app'>('story');

  return (
    <div ref={containerRef} className="min-h-screen bg-[var(--color-bg-void)] text-white">
      

      {/* Header with tabs */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-6 bg-[var(--color-bg-void)]/80 border-b border-white/[0.06]">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link href="/" className="transition-opacity hover:opacity-70">
            <Logo variant="mark" size="sm" color="gold" />
          </Link>

          <div className="flex items-center gap-2 p-1 rounded-lg bg-white/[0.06] border border-white/[0.06]">
            <button
              onClick={() => setActiveTab('story')}
              className={`px-4 py-2 text-label-sm font-medium uppercase tracking-wider rounded-md transition-all ${
                activeTab === 'story'
                  ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)]'
                  : 'text-white/50 hover:text-white/50'
              }`}
            >
              Our Story
            </button>
            <button
              onClick={() => setActiveTab('app')}
              className={`px-4 py-2 text-label-sm font-medium uppercase tracking-wider rounded-md transition-all ${
                activeTab === 'app'
                  ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)]'
                  : 'text-white/50 hover:text-white/50'
              }`}
            >
              What&apos;s in the App
            </button>
          </div>

          <Link
            href="/"
            className="text-body-sm text-white/50 hover:text-white/50 transition-colors"
          >
            Back
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative pt-24">
        {/* Hero */}
        <motion.section
          className="min-h-screen flex flex-col justify-center px-6 py-24 sticky top-0"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <div className="mx-auto max-w-3xl">
            <motion.p
              className="mb-4 text-body-sm font-medium uppercase tracking-wider text-[var(--color-gold)]/60"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: MOTION.ease.premium }}
            >
              About
            </motion.p>

            <motion.h1
              className="mb-6 text-display-sm md:text-display-lg font-semibold leading-[1.0] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.1, ease: MOTION.ease.premium }}
            >
              <span className="text-white">We stopped waiting</span>
              <br />
              <span className="text-white/50">for institutions.</span>
            </motion.h1>

            <motion.p
              className="text-title md:text-title-lg leading-relaxed text-white/50 max-w-[500px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: MOTION.ease.premium }}
            >
              So we built the infrastructure students were missing.
            </motion.p>

            <motion.div
              className="mt-24 flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1, ease: MOTION.ease.premium }}
            >
              <motion.div
                className="w-px h-8 bg-white/[0.06]"
                animate={{ scaleY: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="text-label-sm uppercase tracking-wider text-white/50">
                Scroll
              </span>
            </motion.div>
          </div>
        </motion.section>

        <ScrollSpacer height={50} />

        {/* TAB: OUR STORY */}
        {activeTab === 'story' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: MOTION.ease.premium }}
          >
            {/* What HIVE is */}
            <RevealSection className="px-6 py-32 relative">
              <AnimatedBorder variant="horizontal" className="absolute top-0 left-6 right-6" />
              <div className="mx-auto max-w-3xl">
                <ParallaxText speed={0.15}>
                  <motion.h2
                    className="mb-12 text-heading md:text-heading-lg font-semibold text-white"
                    style={{ fontFamily: 'var(--font-display)' }}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: MOTION.ease.premium }}
                  >
                    What HIVE is
                  </motion.h2>
                </ParallaxText>

                <div className="space-y-10 text-title-sm md:text-title-lg leading-relaxed">
                  <ParallaxText speed={0.1}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        HIVE isn&apos;t a social app you check. It&apos;s a system: a permanent, structured home for student communities to exist, organize, and persist over time.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.09}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        Universities have hundreds of student groups, but no shared operating layer. Information is scattered across GroupMe threads that die, Drive folders no one inherits, and legacy platforms built for administration—not students.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.08}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        The result isn&apos;t a lack of activity. It&apos;s a lack of continuity. Every year, leadership resets. Knowledge disappears. Groups rebuild from scratch.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.07}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        HIVE was built to fix that. Each organization gets a Space: a durable environment that doesn&apos;t vanish when officers graduate.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>
                </div>
              </div>
            </RevealSection>

            {/* The Belief */}
            <RevealSection className="px-6 py-32">
              <div className="mx-auto max-w-3xl">
                <AnimatedBorder variant="container" className="rounded-lg bg-[var(--color-gold)]/[0.02] p-12 md:p-16">
                  <ParallaxText speed={0.1}>
                    <p
                      className="text-heading-sm md:text-heading-lg font-medium leading-[1.2] text-white"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      &ldquo;The feed isn&apos;t the product.
                      <br />
                      The Space is.
                    </p>
                    <p
                      className="mt-4 text-heading-sm md:text-heading-lg font-medium leading-[1.2] text-white/50"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Legibility, memory, and ownership are.&rdquo;
                    </p>
                  </ParallaxText>
                </AnimatedBorder>
              </div>
            </RevealSection>

            {/* The Journey */}
            <RevealSection className="px-6 py-32 relative">
              <AnimatedBorder variant="horizontal" className="absolute top-0 left-6 right-6" />
              <div className="mx-auto max-w-3xl">
                <ParallaxText speed={0.15}>
                  <motion.h2
                    className="mb-12 text-heading md:text-heading-lg font-semibold text-white"
                    style={{ fontFamily: 'var(--font-display)' }}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: MOTION.ease.premium }}
                  >
                    Why it took two years
                  </motion.h2>
                </ParallaxText>

                <div className="space-y-10 text-title-sm md:text-title-lg leading-relaxed">
                  <ParallaxText speed={0.1}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        I didn&apos;t start this alone. Two years ago I had a team. Good people who saw the same problem and wanted to fix it. We&apos;d sit in O&apos;Brian basement, in empty classrooms after hours, trying to figure this thing out.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.09}>
                    <motion.p
                      className="text-white/50"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: MOTION.ease.premium }}
                    >
                      Honestly? <span className="text-[var(--color-gold)]">We spent more time planning than building.</span> We thought if we just got the strategy right, everything would fall into place. It didn&apos;t work out the way we planned.
                    </motion.p>
                  </ParallaxText>

                  <ParallaxText speed={0.08}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        Eventually the team moved on to their own paths, but the vision stuck with me. So I decided to build it myself. Not because I thought I could do it better—but because someone had to actually ship something.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.07}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        Two years of nights and weekends. Stretches where I didn&apos;t touch it for weeks. Other times up until 3am because I was close to figuring something out. Mostly slow. Invisible progress.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.06}>
                    <motion.p
                      className="text-white/50"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: MOTION.ease.premium }}
                    >
                      The thing is finally at a point where other people can use it. <span className="text-[var(--color-gold)]">If you do use it, tell me what sucks.</span> I&apos;ve been building this in isolation too long. I need the feedback loop.
                    </motion.p>
                  </ParallaxText>

                  <ParallaxText speed={0.03}>
                    <motion.p
                      className="text-white/25 text-body-lg pt-8"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5, ease: MOTION.ease.premium }}
                    >
                      — Jacob
                    </motion.p>
                  </ParallaxText>
                </div>
              </div>
            </RevealSection>

            {/* Contributors */}
            {CONTRIBUTORS.length > 0 && (
              <RevealSection className="px-6 py-24 relative">
                <AnimatedBorder variant="horizontal" className="absolute top-0 left-6 right-6" />
                <div className="mx-auto max-w-3xl">
                  <ParallaxText speed={0.05}>
                    <motion.p
                      className="mb-10 text-label-sm uppercase tracking-[0.2em] text-white/50"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: MOTION.ease.premium }}
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
                          transition={{ duration: 0.6, delay: 0.2 + i * 0.08, ease: MOTION.ease.premium }}
                        >
                          {contributor.linkedin ? (
                            <a
                              href={contributor.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-baseline gap-2"
                            >
                              <span className="text-body text-white/50 group-hover:text-white/50 transition-colors duration-300">
                                {contributor.name}
                              </span>
                              <span className="text-label text-white/15 group-hover:text-white/25 transition-colors duration-300">
                                {contributor.role}
                              </span>
                            </a>
                          ) : (
                            <div className="flex items-baseline gap-2">
                              <span className="text-body text-white/50">{contributor.name}</span>
                              <span className="text-label text-white/15">{contributor.role}</span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </ParallaxText>
                </div>
              </RevealSection>
            )}
          </motion.div>
        )}

        {/* TAB: WHAT'S IN THE APP */}
        {activeTab === 'app' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: MOTION.ease.premium }}
          >
            {/* SPACES */}
            <RevealSection className="px-6 py-32 relative">
              <AnimatedBorder variant="horizontal" className="absolute top-0 left-6 right-6" />
              <div className="mx-auto max-w-3xl">
                <ParallaxText speed={0.15}>
                  <motion.h2
                    className="mb-3 text-heading md:text-heading-lg font-semibold text-white"
                    style={{ fontFamily: 'var(--font-display)' }}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: MOTION.ease.premium }}
                  >
                    Spaces
                  </motion.h2>
                  <p className="text-body-lg text-[var(--color-gold)]/60 mb-10">
                    Permanent homes for organizations
                  </p>
                </ParallaxText>

                <div className="space-y-8 text-title-sm md:text-title leading-relaxed">
                  <ParallaxText speed={0.1}>
                    <p className="text-white/50">
                      Every org gets a Space. Posts, events, files, membership—one place that outlasts any president.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.09}>
                    <p className="text-white/50">
                      When leadership graduates, the Space stays. All the history, decisions, resources—there for the next cohort. Knowledge compounds instead of resets.
                    </p>
                  </ParallaxText>

                  {/* Before/After Visualization */}
                  <ParallaxText speed={0.08}>
                    <BeforeAfterSplit />
                  </ParallaxText>

                  <ParallaxText speed={0.07}>
                    <div className="grid grid-cols-2 gap-4 text-body">
                      <div className="p-4 rounded-lg bg-black/20 border border-white/[0.06]">
                        <p className="text-white/50 font-medium mb-2">Feed & Events</p>
                        <p className="text-white/50 text-body">Announcements, discussions, calendar. Everything archived and searchable.</p>
                      </div>
                      <div className="p-4 rounded-lg bg-black/20 border border-white/[0.06]">
                        <p className="text-white/50 font-medium mb-2">Resources</p>
                        <p className="text-white/50 text-body">Docs, files, wikis. Version history tracked. Knowledge becomes institutional.</p>
                      </div>
                      <div className="p-4 rounded-lg bg-black/20 border border-white/[0.06]">
                        <p className="text-white/50 font-medium mb-2">Members & Roles</p>
                        <p className="text-white/50 text-body">Directory with granular permissions. Handoffs = role reassignment. Day 1 productivity.</p>
                      </div>
                      <div className="p-4 rounded-lg bg-black/20 border border-white/[0.06]">
                        <p className="text-white/50 font-medium mb-2">Analytics</p>
                        <p className="text-white/50 text-body">Engagement, attendance, activity. Data that helps you lead, not just compliance numbers.</p>
                      </div>
                    </div>
                  </ParallaxText>

                  {/* Time Collapse */}
                  <ParallaxText speed={0.06}>
                    <TimeCollapseBar />
                  </ParallaxText>
                </div>
              </div>
            </RevealSection>

            {/* HIVELAB */}
            <RevealSection className="px-6 py-32 relative">
              <AnimatedBorder variant="horizontal" className="absolute top-0 left-6 right-6" />
              <div className="mx-auto max-w-3xl">
                {/* Large emphasis */}
                <AnimatedBorder variant="container" className="mb-12 rounded-lg bg-[var(--color-gold)]/[0.06] p-12 md:p-16">
                  <ParallaxText speed={0.15}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: MOTION.ease.premium }}
                    >
                      <p className="text-label-sm uppercase tracking-[0.2em] text-[var(--color-gold)]/60 mb-4">
                        The Tool That Builds Tools
                      </p>
                      <h2
                        className="text-display-sm md:text-display-lg font-semibold text-white leading-[1.0] mb-4"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        HiveLab
                      </h2>
                      <p className="text-title-sm md:text-title-lg text-white/50">
                        Ship custom tools in hours, not weeks.
                      </p>
                    </motion.div>
                  </ParallaxText>
                </AnimatedBorder>

                <div className="space-y-8 text-title-sm md:text-title leading-relaxed">
                  <ParallaxText speed={0.1}>
                    <p className="text-white/50">
                      Describe what you need in plain language. The AI scaffolds an application. You customize it. Deploy directly to your Space.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.09}>
                    <p className="text-white/50">
                      You&apos;re not configuring a form builder. You&apos;re authoring software. The tools you create become part of your org&apos;s infrastructure—URLs, permissions, databases, the whole thing.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.08}>
                    <div className="space-y-4">
                      {[
                        { name: 'Membership applications', desc: 'Custom questions, file uploads, review workflows' },
                        { name: 'Event check-in', desc: 'QR codes, attendance tracking, analytics' },
                        { name: 'Budget requests', desc: 'Approval workflows, audit trails, transparency' },
                        { name: 'Project showcases', desc: 'Portfolio system, submissions, reviews' },
                      ].map((tool, i) => (
                        <motion.div
                          key={tool.name}
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.1 * i, ease: MOTION.ease.premium }}
                        >
                          <span className="text-[var(--color-gold)]/40 mt-1">→</span>
                          <div>
                            <p className="text-white/50 font-medium">{tool.name}</p>
                            <p className="text-white/50 text-body">{tool.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ParallaxText>

                  {/* Network Ripple */}
                  <ParallaxText speed={0.07}>
                    <NetworkRipple />
                  </ParallaxText>

                  <ParallaxText speed={0.06}>
                    <p className="text-white/50">
                      Publish your tool. Now every similar org on HIVE can deploy it in one click. Student-built infrastructure that compounds across campuses.
                    </p>
                  </ParallaxText>
                </div>
              </div>
            </RevealSection>

            {/* PROFILE */}
            <RevealSection className="px-6 py-32 relative">
              <AnimatedBorder variant="horizontal" className="absolute top-0 left-6 right-6" />
              <div className="mx-auto max-w-3xl">
                <ParallaxText speed={0.15}>
                  <motion.h2
                    className="mb-3 text-heading md:text-heading-lg font-semibold text-white"
                    style={{ fontFamily: 'var(--font-display)' }}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: MOTION.ease.premium }}
                  >
                    Profile
                  </motion.h2>
                  <p className="text-body-lg text-[var(--color-gold)]/60 mb-10">
                    Identity that compounds
                  </p>
                </ParallaxText>

                <div className="space-y-8 text-title-sm md:text-title leading-relaxed">
                  <ParallaxText speed={0.1}>
                    <p className="text-white/50">
                      Your profile isn&apos;t a resume. It&apos;s a verifiable record of actual work. Events you organized. Tools you shipped. Communities you built.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.09}>
                    <p className="text-white/50">
                      When you graduate, you take it with you. Proof of work, not self-reported bullet points. Portable, verifiable, yours.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.08}>
                    <div className="bg-[var(--color-gold)]/[0.03] border border-[var(--color-gold)]/10 rounded-lg p-6">
                      <p className="text-white/50 text-body mb-4">What your profile tracks</p>
                      <div className="grid grid-cols-2 gap-4 text-body">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]/40" />
                          <span className="text-white/50">Spaces you&apos;ve led</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]/40" />
                          <span className="text-white/50">Events organized</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]/40" />
                          <span className="text-white/50">Tools built</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]/40" />
                          <span className="text-white/50">Contributions made</span>
                        </div>
                      </div>
                    </div>
                  </ParallaxText>

                  <ParallaxText speed={0.07}>
                    <p className="text-white/50">
                      The university doesn&apos;t get to decide what you can prove about yourself. You own your trajectory.
                    </p>
                  </ParallaxText>
                </div>
              </div>
            </RevealSection>

            {/* FEED */}
            <RevealSection className="px-6 py-32 relative">
              <AnimatedBorder variant="horizontal" className="absolute top-0 left-6 right-6" />
              <div className="mx-auto max-w-3xl">
                <ParallaxText speed={0.15}>
                  <motion.h2
                    className="mb-3 text-heading md:text-heading-lg font-semibold text-white"
                    style={{ fontFamily: 'var(--font-display)' }}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: MOTION.ease.premium }}
                  >
                    Feed
                  </motion.h2>
                  <p className="text-body-lg text-[var(--color-gold)]/60 mb-10">
                    Campus pulse <span className="text-white/50">(more coming soon)</span>
                  </p>
                </ParallaxText>

                <div className="space-y-8 text-title-sm md:text-title leading-relaxed">
                  <ParallaxText speed={0.1}>
                    <p className="text-white/50">
                      See what&apos;s happening across campus. Posts from orgs you follow. Events coming up. Opportunities to join.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.09}>
                    <p className="text-white/50">
                      The feed surfaces signal, not noise. Designed for coordination, not infinite scroll. Filter by org, event type, or date. A utility, not a dopamine slot machine.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.08}>
                    <div className="bg-black/20 border border-white/[0.06] rounded-lg p-6">
                      <p className="text-white/50 text-body mb-4">Coming in future updates</p>
                      <div className="space-y-2 text-body text-white/50">
                        <p>→ Ritualized coordination patterns (weekly check-ins, semester handoffs)</p>
                        <p>→ Cross-campus discovery</p>
                        <p>→ Smart recommendations based on interests</p>
                      </div>
                    </div>
                  </ParallaxText>
                </div>
              </div>
            </RevealSection>
          </motion.div>
        )}

        {/* CTA */}
        <RevealSection className="px-6 py-40 relative">
          <AnimatedBorder variant="horizontal" className="absolute top-0 left-6 right-6" />
          <div className="mx-auto max-w-3xl">
            <ParallaxText speed={0.1}>
              <motion.div
                className="text-center mb-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: MOTION.ease.premium }}
              >
                <p className="text-white/50 text-body-lg mb-8 max-w-[600px] mx-auto">
                  Spaces are being claimed. Tools are being built. What happens next is up to the students who show up.
                </p>
              </motion.div>
            </ParallaxText>

            <div className="text-center">
              <ParallaxText speed={0.05}>
                <motion.p
                  className="text-heading md:text-display-sm font-medium leading-[1.1] mb-12"
                  style={{ fontFamily: 'var(--font-display)' }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: MOTION.ease.premium }}
                >
                  <span className="text-white">The builders inherit</span>
                  <br />
                  <span className="text-white/50">what comes next.</span>
                </motion.p>
              </ParallaxText>

              <motion.p
                className="mt-8 text-body-sm text-white/25"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5, ease: MOTION.ease.premium }}
              >
                Infrastructure-grade. Student-owned. Already shipping.
              </motion.p>
            </div>
          </div>
        </RevealSection>
      </main>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-white/[0.06]">
        <div className="mx-auto max-w-3xl flex items-center justify-between text-label text-white/50">
          <span>&copy; {new Date().getFullYear()} HIVE</span>
          <div className="flex gap-6">
            <Link href="/legal/terms" className="hover:text-white/50 transition-colors">
              Terms
            </Link>
            <Link href="/legal/privacy" className="hover:text-white/50 transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
