'use client';

import { useRef, useState, useEffect } from 'react';
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
  { name: 'Brunda', role: 'Development', linkedin: 'https://www.linkedin.com/in/brunda-venkatesh/' },
  { name: 'Daniel', role: 'Marketing', linkedin: 'https://www.linkedin.com/in/danielohebshalom/' },
  { name: 'Gavin', role: 'Marketing', linkedin: 'https://www.linkedin.com/in/malecgavin/' },
  { name: 'Mirka', role: 'Marketing', linkedin: 'https://www.linkedin.com/in/mirka-arevalo/' },
  { name: 'Noah', role: 'Operations', linkedin: 'https://www.linkedin.com/in/noahowsh/' },
  { name: 'Rachana', role: 'Development', linkedin: 'https://www.linkedin.com/in/rachana-ramesh-0414a6164/' },
  { name: 'Samarth', role: 'Marketing', linkedin: 'https://www.linkedin.com/in/samarth-yaralakatte-mallappa/' },
];

// Section IDs for upvoting
type SectionId =
  | 'what-hive-is'
  | 'the-journey'
  | 'spaces'
  | 'feed'
  | 'resources'
  | 'hivelab';

// Upvote hook
function useUpvotes() {
  const [votes, setVotes] = useState<Record<SectionId, number>>({} as any);
  const [userVotes, setUserVotes] = useState<Set<SectionId>>(new Set());

  useEffect(() => {
    // Load votes from localStorage
    const savedVotes = localStorage.getItem('hive-about-votes');
    const savedUserVotes = localStorage.getItem('hive-about-user-votes');
    if (savedVotes) setVotes(JSON.parse(savedVotes));
    if (savedUserVotes) setUserVotes(new Set(JSON.parse(savedUserVotes)));
  }, []);

  const upvote = (sectionId: SectionId) => {
    const hasVoted = userVotes.has(sectionId);
    const newUserVotes = new Set(userVotes);
    const newVotes = { ...votes };

    if (hasVoted) {
      newUserVotes.delete(sectionId);
      newVotes[sectionId] = (newVotes[sectionId] || 0) - 1;
    } else {
      newUserVotes.add(sectionId);
      newVotes[sectionId] = (newVotes[sectionId] || 0) + 1;
    }

    setUserVotes(newUserVotes);
    setVotes(newVotes);
    localStorage.setItem('hive-about-votes', JSON.stringify(newVotes));
    localStorage.setItem('hive-about-user-votes', JSON.stringify([...newUserVotes]));
  };

  return { votes, userVotes, upvote };
}

// Upvote button component
function UpvoteButton({
  sectionId,
  votes,
  hasVoted,
  onUpvote
}: {
  sectionId: SectionId;
  votes: number;
  hasVoted: boolean;
  onUpvote: () => void;
}) {
  return (
    <motion.button
      onClick={onUpvote}
      className="group flex flex-col items-center gap-1 px-3 py-2 rounded-lg border border-white/10 bg-black/20 backdrop-blur-sm transition-all hover:border-[var(--color-gold)]/30 hover:bg-[var(--color-gold)]/5"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className={`transition-colors ${hasVoted ? 'text-[var(--color-gold)]' : 'text-white/40 group-hover:text-white/60'}`}
      >
        <path
          d="M8 2L10.5 7H15L11 10.5L12.5 15L8 11.5L3.5 15L5 10.5L1 7H5.5L8 2Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`text-[11px] font-medium transition-colors ${hasVoted ? 'text-[var(--color-gold)]' : 'text-white/30 group-hover:text-white/50'}`}>
        {votes || 0}
      </span>
    </motion.button>
  );
}

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

// Section with scroll-triggered reveal + upvote
function RevealSection({
  children,
  className,
  sectionId,
  upvoteProps,
}: {
  children: React.ReactNode;
  className?: string;
  sectionId?: SectionId;
  upvoteProps?: {
    votes: Record<SectionId, number>;
    userVotes: Set<SectionId>;
    upvote: (id: SectionId) => void;
  };
}) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-150px' });

  return (
    <motion.section
      ref={ref}
      className={`relative ${className}`}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1.2, ease: EASE }}
    >
      {sectionId && upvoteProps && (
        <div className="absolute top-8 right-8 z-10">
          <UpvoteButton
            sectionId={sectionId}
            votes={upvoteProps.votes[sectionId] || 0}
            hasVoted={upvoteProps.userVotes.has(sectionId)}
            onUpvote={() => upvoteProps.upvote(sectionId)}
          />
        </div>
      )}
      {children}
    </motion.section>
  );
}

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  const [activeTab, setActiveTab] = useState<'story' | 'app'>('story');
  const { votes, userVotes, upvote } = useUpvotes();

  const upvoteProps = { votes, userVotes, upvote };

  return (
    <div ref={containerRef} className="min-h-screen bg-[var(--color-bg-void)] text-white">
      <NoiseOverlay />

      {/* Minimal header with tabs */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-6 backdrop-blur-xl bg-[var(--color-bg-void)]/80 border-b border-white/[0.04]">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link href="/" className="transition-opacity hover:opacity-70">
            <Logo variant="mark" size="sm" color="gold" />
          </Link>

          {/* Tab switcher */}
          <div className="flex items-center gap-2 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <button
              onClick={() => setActiveTab('story')}
              className={`px-4 py-2 text-[11px] font-medium uppercase tracking-wider rounded-md transition-all ${
                activeTab === 'story'
                  ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)]'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              My Story
            </button>
            <button
              onClick={() => setActiveTab('app')}
              className={`px-4 py-2 text-[11px] font-medium uppercase tracking-wider rounded-md transition-all ${
                activeTab === 'app'
                  ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)]'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              What's in the App
            </button>
          </div>

          <Link
            href="/"
            className="text-[13px] text-white/40 hover:text-white/60 transition-colors"
          >
            Back
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative pt-24">
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
              So we built the infrastructure students were missing.
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

        {/* TAB: MY STORY */}
        {activeTab === 'story' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            {/* SECTION 1: WHAT IS HIVE */}
            <RevealSection
              className="px-6 py-32 relative"
              sectionId="what-hive-is"
              upvoteProps={upvoteProps}
            >
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
                    What HIVE is
                  </motion.h2>
                </ParallaxText>

                <div className="space-y-10 text-[18px] md:text-[22px] leading-relaxed">
                  <ParallaxText speed={0.1}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        HIVE isn't a social app you check. It's not a feed designed to keep you scrolling, and it's not another layer of noise on campus. HIVE is a system: a permanent, structured home for student communities to exist, organize, and persist over time.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.09}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        Universities have hundreds of student groups, but no shared operating layer. Information is scattered across GroupMe threads that die, Drive folders no one inherits, Instagram accounts optimized for attention instead of coordination, and legacy platforms built for administration—not students.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.08}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        The result isn't a lack of activity. It's a lack of continuity.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.07}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        Every year, leadership resets. Knowledge disappears. Momentum collapses. Groups rebuild from scratch—not because students fail, but because the system does.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.06}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        HIVE was built to fix that.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.055}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        Each organization gets a Space: a durable environment for posts, events, membership, and internal tools that don't vanish when officers graduate. The feed isn't the product. The Space is. The goal isn't engagement for its own sake—it's legibility, memory, and ownership.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.05}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        This didn't come from a consulting project or an institutional mandate. It came from mapping the actual campus reality—hundreds of orgs, overlapping missions, fragmented tools—and realizing there was no shared substrate underneath any of it.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.045}>
                    <p className="text-white/60">
                      <NarrativeReveal stagger={0.03}>
                        HIVE is that substrate. It's built for students who want their work to outlast a semester. For orgs that want to compound, not reset. For campuses that need infrastructure, not another app.
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
                      "The feed isn't the product.
                      <br />
                      The Space is.
                    </p>
                    <p
                      className="mt-4 text-[28px] md:text-[36px] font-medium leading-[1.2] text-white/30"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Engagement for its own sake isn't the goal—
                      <br />
                      legibility, memory, and ownership are."
                    </p>
                  </ParallaxText>
                </AnimatedContainer>
              </div>
            </RevealSection>

            {/* SECTION 2: THE JOURNEY */}
            <RevealSection
              className="px-6 py-32 relative"
              sectionId="the-journey"
              upvoteProps={upvoteProps}
            >
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
                        I didn't start this alone. Two years ago I had a team. Good people who saw the same problem and wanted to fix it. We'd sit in O'Brian basement, in empty classrooms after hours, trying to figure this thing out.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.09}>
                    <motion.p
                      className="text-white/50"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: EASE }}
                    >
                      Honestly? <span className="text-[var(--color-gold)]">We bullshitted a lot.</span> We thought we were trying our best — and we were — but we spent more time planning than building. More time in meetings than shipping. I kept thinking if we just got the strategy right, everything would fall into place.
                    </motion.p>
                  </ParallaxText>

                  <ParallaxText speed={0.08}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        It didn't. I couldn't lead. I didn't know how to turn planning into building, how to create momentum when there was no money, no traction, no proof it would work. The thing just... fell apart. That's on me.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.07}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        So I decided to build it myself. Not because I thought I could do it better alone — I couldn't. But because someone had to actually ship something. No more meetings. No more strategy sessions. Just building.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.065}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        Two years of nights and weekends. Stretches where I didn't touch it for weeks. Other times up until 3am because I was close to figuring something out. Mostly slow. Invisible progress. The kind where you're not sure if you're getting anywhere.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.06}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        But here's the thing — I need to talk about what these people actually did. Because it wasn't nothing.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.055}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        Gavin and Noah made marketing videos. Real ones. Samarth did the editing and filming — and honestly, he's one of the nicest people you'll ever meet. Buffalo is lucky to have him. Mirka put real resources into marketing when there was no reason to expect anything back. That level of belief made this possible.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.05}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        That's not "helping out." That's belief. That's putting real skin in when there was no reason to expect anything back.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.045}>
                    <motion.p
                      className="text-white/60"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: EASE }}
                    >
                      So this project is dedicated to them. <span className="text-[var(--color-gold)]">Whether they like it or not.</span>
                    </motion.p>
                  </ParallaxText>

                  <ParallaxText speed={0.055}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        The thing is finally at a point where other people can use it. Which is both exciting and terrifying. I know it's not perfect. I know there are bugs. I know there are features that seemed like good ideas at 2am that probably aren't. Building something in isolation means blind spots are inevitable.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.05}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        But that's kind of the point now. I can't know what's broken until you tell me. I can't know what's missing until you need it. The foundation is here — or at least I think it is. Now I need people to actually use it and tell me where I was wrong.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.045}>
                    <p className="text-white/60">
                      <NarrativeReveal stagger={0.03}>
                        So that's the ask. Not "use my app." Just: if you do use it, tell me what sucks. Tell me what you wish existed. Tell me what doesn't make sense. I've been building this in isolation for too long. I need the feedback loop. I need to know what you actually need, not what I assumed you needed.
                      </NarrativeReveal>
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.03}>
                    <motion.p
                      className="text-white/25 text-[16px] pt-8"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5, ease: EASE }}
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
          </motion.div>
        )}

        {/* TAB: WHAT'S IN THE APP */}
        {activeTab === 'app' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            {/* SPACES */}
            <RevealSection
              className="px-6 py-32 relative"
              sectionId="spaces"
              upvoteProps={upvoteProps}
            >
              <AnimatedLine className="absolute top-0 left-6 right-6" />
              <div className="mx-auto max-w-3xl">
                <ParallaxText speed={0.15}>
                  <motion.h2
                    className="mb-6 text-[32px] md:text-[40px] font-semibold text-white"
                    style={{ fontFamily: 'var(--font-display)' }}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: EASE }}
                  >
                    Spaces
                  </motion.h2>
                  <p className="text-[16px] text-[var(--color-gold)]/60 mb-12">
                    Permanent homes for organizations
                  </p>
                </ParallaxText>

                <div className="space-y-8 text-[18px] md:text-[20px] leading-relaxed">
                  <ParallaxText speed={0.1}>
                    <p className="text-white/50">
                      Every org gets a Space: a persistent environment that outlasts leadership changes. Posts, events, files, and members all live here. When officers graduate, the Space stays. Knowledge compounds instead of resetting every semester.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.09}>
                    <p className="text-white/60 font-medium text-[16px] uppercase tracking-wider mb-4">
                      Core Systems
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.08}>
                    <div className="space-y-6 text-[16px] md:text-[18px]">
                      <div>
                        <p className="text-white/60 font-medium mb-2">Feed & Posts</p>
                        <p className="text-white/40">
                          Announcements, updates, discussions. Threaded conversations that stay organized. Media-rich posts with files, images, and embeds. Everything archived and searchable.
                        </p>
                      </div>
                      <div>
                        <p className="text-white/60 font-medium mb-2">Events & Calendar</p>
                        <p className="text-white/40">
                          Schedule meetings, track RSVPs, manage attendance. Events sync with personal calendars. Recurring events, reminders, and attendance analytics built in.
                        </p>
                      </div>
                      <div>
                        <p className="text-white/60 font-medium mb-2">Resources & Files</p>
                        <p className="text-white/40">
                          Upload docs, create wikis, organize by folder. Version history tracked automatically. No more broken Drive links or lost files. Knowledge becomes institutional memory.
                        </p>
                      </div>
                      <div>
                        <p className="text-white/60 font-medium mb-2">Members & Roles</p>
                        <p className="text-white/40">
                          Directory of all members. Custom roles with granular permissions. Leadership handoffs become seamless—just reassign the role. No credential resets needed.
                        </p>
                      </div>
                      <div>
                        <p className="text-white/60 font-medium mb-2">Analytics & Insights</p>
                        <p className="text-white/40">
                          Track engagement, event attendance, member activity. See what's working. Export reports for end-of-semester reviews. Data that helps you lead better.
                        </p>
                      </div>
                    </div>
                  </ParallaxText>
                </div>
              </div>
            </RevealSection>

            {/* FEED & RITUALS */}
            <RevealSection
              className="px-6 py-32 relative"
              sectionId="feed"
              upvoteProps={upvoteProps}
            >
              <AnimatedLine className="absolute top-0 left-6 right-6" />
              <div className="mx-auto max-w-3xl">
                <ParallaxText speed={0.15}>
                  <motion.h2
                    className="mb-6 text-[32px] md:text-[40px] font-semibold text-white"
                    style={{ fontFamily: 'var(--font-display)' }}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: EASE }}
                  >
                    Feed & Rituals
                  </motion.h2>
                  <p className="text-[16px] text-[var(--color-gold)]/60 mb-12">
                    Campus pulse, not engagement bait
                  </p>
                </ParallaxText>

                <div className="space-y-8 text-[18px] md:text-[20px] leading-relaxed">
                  <ParallaxText speed={0.1}>
                    <p className="text-white/50">
                      See what's happening across campus. Posts from orgs you follow, events coming up, opportunities to join. The feed surfaces signal, not noise. It's designed for coordination, not infinite scroll.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.09}>
                    <p className="text-white/40">
                      Filter by org, event type, or date. Save posts for later. Share opportunities with your network. The feed is a utility, not a dopamine slot machine.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.08}>
                    <p className="text-white/30 text-[16px] italic border-l-2 border-[var(--color-gold)]/20 pl-4 mt-8">
                      Coming soon: Rituals — recurring community patterns (weekly check-ins, monthly showcases, semester handoffs) formalized into actual system behaviors. Coordination that compounds.
                    </p>
                  </ParallaxText>
                </div>
              </div>
            </RevealSection>

            {/* PROFILE */}
            <RevealSection
              className="px-6 py-32 relative"
              sectionId="resources"
              upvoteProps={upvoteProps}
            >
              <AnimatedLine className="absolute top-0 left-6 right-6" />
              <div className="mx-auto max-w-3xl">
                <ParallaxText speed={0.15}>
                  <motion.h2
                    className="mb-6 text-[32px] md:text-[40px] font-semibold text-white"
                    style={{ fontFamily: 'var(--font-display)' }}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: EASE }}
                  >
                    Profile
                  </motion.h2>
                  <p className="text-[16px] text-[var(--color-gold)]/60 mb-12">
                    Your autonomy layer
                  </p>
                </ParallaxText>

                <div className="space-y-8 text-[18px] md:text-[20px] leading-relaxed">
                  <ParallaxText speed={0.1}>
                    <p className="text-white/50">
                      Your profile isn't a resume. It's your operating system on campus. Track your involvement, contributions, and growth across all the spaces you're part of. See your trajectory, not just your bio.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.09}>
                    <p className="text-white/40">
                      The vision: students own their data. Your profile becomes a verified record of actual work—events attended, projects shipped, communities built. Portable credentials that belong to you, not locked in a university database.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.08}>
                    <p className="text-white/50">
                      This is infrastructure for student autonomy. You're not a user of campus systems—you're a builder with agency. Your profile reflects that reality.
                    </p>
                  </ParallaxText>
                </div>
              </div>
            </RevealSection>

            {/* HIVELAB - CENTERPIECE */}
            <RevealSection
              className="px-6 py-32 relative"
              sectionId="hivelab"
              upvoteProps={upvoteProps}
            >
              <AnimatedLine className="absolute top-0 left-6 right-6" />
              <div className="mx-auto max-w-3xl">
                {/* Large emphasis container */}
                <AnimatedContainer className="rounded-2xl bg-gradient-to-br from-[var(--color-gold)]/[0.08] to-[var(--color-gold)]/[0.02] p-12 md:p-16 mb-16">
                  <ParallaxText speed={0.15}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: EASE }}
                    >
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-gold)]/60 mb-4">
                        The Tool That Builds Tools
                      </p>
                      <h2
                        className="text-[48px] md:text-[64px] font-semibold text-white leading-[1.0] mb-6"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        HiveLab
                      </h2>
                      <p className="text-[20px] md:text-[24px] text-white/40 leading-relaxed">
                        Where HIVE becomes programmable infrastructure
                      </p>
                    </motion.div>
                  </ParallaxText>
                </AnimatedContainer>

                <div className="space-y-10 text-[18px] md:text-[20px] leading-relaxed">
                  <ParallaxText speed={0.1}>
                    <p className="text-white/60 font-medium">
                      This is the part that matters most.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.09}>
                    <p className="text-white/50">
                      HiveLab is a no-code builder that lets students create custom tools for their orgs—membership trackers, event check-in systems, application portals, voting interfaces, whatever you need. Describe it in plain language, and the system scaffolds the tool. Deploy it directly into your Space.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.08}>
                    <p className="text-white/40">
                      This isn't drag-and-drop widgets. It's AI-assisted software creation. You're not configuring a form builder—you're authoring actual applications. The tools you build become part of your org's infrastructure, just like posts or events.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.07}>
                    <p className="text-white/50">
                      The vision: every org has unique needs that generic platforms can't serve. HiveLab makes HIVE extensible. Instead of waiting for features or hacking together Google Sheets, you build what you need. Student-run organizations stop being constrained by off-the-shelf software.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.06}>
                    <p className="text-white/60 font-medium">
                      Examples of tools students are already building:
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.055}>
                    <div className="space-y-4 text-[16px] md:text-[18px]">
                      <div className="flex items-start gap-3">
                        <span className="text-[var(--color-gold)]/40">→</span>
                        <p className="text-white/40">
                          <span className="text-white/60">Membership application system</span> with custom questions, file uploads, and review workflows
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-[var(--color-gold)]/40">→</span>
                        <p className="text-white/40">
                          <span className="text-white/60">Event check-in with QR codes</span> that syncs with attendance records automatically
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-[var(--color-gold)]/40">→</span>
                        <p className="text-white/40">
                          <span className="text-white/60">Project showcase portal</span> where members upload work for end-of-semester reviews
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-[var(--color-gold)]/40">→</span>
                        <p className="text-white/40">
                          <span className="text-white/60">Budget request form</span> tied to org financials and approval workflows
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-[var(--color-gold)]/40">→</span>
                        <p className="text-white/40">
                          <span className="text-white/60">Anonymous feedback system</span> for leadership to gather honest input
                        </p>
                      </div>
                    </div>
                  </ParallaxText>

                  <ParallaxText speed={0.05}>
                    <p className="text-white/50">
                      HiveLab is where HIVE stops being a platform and becomes infrastructure. You're not just using software—you're building it. This is what student autonomy actually looks like: the capability to create what institutions can't or won't provide.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.045}>
                    <p className="text-white/30 text-[16px] italic border-l-2 border-[var(--color-gold)]/40 pl-4 mt-8">
                      The long-term vision: HiveLab becomes a marketplace where orgs share tools they've built. A consulting club's interview scheduler becomes available to every consulting club on HIVE. Student-built infrastructure that compounds across campuses.
                    </p>
                  </ParallaxText>
                </div>
              </div>
            </RevealSection>
          </motion.div>
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
