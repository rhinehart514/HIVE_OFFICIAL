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

// Upvotable section - wraps RevealSection with upvote functionality
function UpvotableSection({
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
  return (
    <RevealSection className={className}>
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
    </RevealSection>
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
              transition={{ duration: 1, ease: MOTION.ease.premium }}
            >
              About
            </motion.p>

            <motion.h1
              className="mb-6 text-[44px] md:text-[72px] font-semibold leading-[1.0] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.1, ease: MOTION.ease.premium }}
            >
              <span className="text-white">We stopped waiting</span>
              <br />
              <span className="text-white/30">for institutions.</span>
            </motion.h1>

            <motion.p
              className="text-[20px] md:text-[24px] leading-relaxed text-white/40 max-w-[500px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: MOTION.ease.premium }}
            >
              So we built the infrastructure students were missing.
            </motion.p>

            {/* Scroll indicator */}
            <motion.div
              className="mt-24 flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1, ease: MOTION.ease.premium }}
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
        <ScrollSpacer height={50} />

        {/* TAB: MY STORY */}
        {activeTab === 'story' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: MOTION.ease.premium }}
          >
            {/* SECTION 1: WHAT IS HIVE */}
            <UpvotableSection
              className="px-6 py-32 relative"
              sectionId="what-hive-is"
              upvoteProps={upvoteProps}
            >
              <AnimatedBorder variant="horizontal" className="absolute top-0 left-6 right-6" />
              <div className="mx-auto max-w-3xl">
                <ParallaxText speed={0.15}>
                  <motion.h2
                    className="mb-12 text-[32px] md:text-[40px] font-semibold text-white"
                    style={{ fontFamily: 'var(--font-display)' }}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: MOTION.ease.premium }}
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
            </UpvotableSection>

            {/* The Belief - animated container */}
            <UpvotableSection className="px-6 py-32">
              <div className="mx-auto max-w-3xl">
                <AnimatedBorder variant="container" className="rounded-2xl bg-[var(--color-gold)]/[0.02] p-12 md:p-16">
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
                </AnimatedBorder>
              </div>
            </UpvotableSection>

            {/* SECTION 2: THE JOURNEY */}
            <UpvotableSection
              className="px-6 py-32 relative"
              sectionId="the-journey"
              upvoteProps={upvoteProps}
            >
              <AnimatedBorder variant="horizontal" className="absolute top-0 left-6 right-6" />
              <div className="mx-auto max-w-3xl">
                <ParallaxText speed={0.15}>
                  <motion.h2
                    className="mb-12 text-[32px] md:text-[40px] font-semibold text-white"
                    style={{ fontFamily: 'var(--font-display)' }}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: MOTION.ease.premium }}
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
                      transition={{ duration: 0.8, ease: MOTION.ease.premium }}
                    >
                      Honestly? <span className="text-[var(--color-gold)]">We bullshitted a lot.</span> We thought we were trying our best — and we were — but we spent more time planning than building. More time in meetings than shipping. I kept thinking if we just got the strategy right, everything would fall into place.
                    </motion.p>
                  </ParallaxText>

                  <ParallaxText speed={0.08}>
                    <p className="text-white/50">
                      <NarrativeReveal stagger={0.03}>
                        It didn't work out the way we planned. We were figuring it out as we went — how to turn ideas into code, how to build momentum from scratch. Looking back, we learned more from those basement sessions than any class taught us. Eventually the team moved on to their own paths, but the vision stuck with me.
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
                      transition={{ duration: 0.8, ease: MOTION.ease.premium }}
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
                      transition={{ duration: 1, delay: 0.5, ease: MOTION.ease.premium }}
                    >
                      — Jacob
                    </motion.p>
                  </ParallaxText>
                </div>
              </div>
            </UpvotableSection>

            {/* Contributors */}
            {CONTRIBUTORS.length > 0 && (
              <UpvotableSection className="px-6 py-24 relative">
                <AnimatedBorder variant="horizontal" className="absolute top-0 left-6 right-6" />
                <div className="mx-auto max-w-3xl">
                  <ParallaxText speed={0.05}>
                    <motion.p
                      className="mb-10 text-[11px] uppercase tracking-[0.2em] text-white/20"
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
              </UpvotableSection>
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
            <UpvotableSection
              className="px-6 py-32 relative"
              sectionId="spaces"
              upvoteProps={upvoteProps}
            >
              <AnimatedBorder variant="horizontal" className="absolute top-0 left-6 right-6" />
              <div className="mx-auto max-w-3xl">
                <ParallaxText speed={0.15}>
                  <motion.h2
                    className="mb-6 text-[32px] md:text-[40px] font-semibold text-white"
                    style={{ fontFamily: 'var(--font-display)' }}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: MOTION.ease.premium }}
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
                      Okay so here's the actual problem. I mapped 400+ student orgs at UB. Every single one loses institutional knowledge every year. Not because students are lazy—because the tools don't persist. And UB isn't special. Talk to any campus: same pattern. Multiply that by 4,000 universities in the US alone. That's systemic failure, not individual problems.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.09}>
                    <motion.div
                      className="bg-[var(--color-gold)]/[0.03] border border-[var(--color-gold)]/10 rounded-lg p-6"
                      initial={{ opacity: 0, scale: 0.98 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: MOTION.ease.premium }}
                    >
                      <p className="text-white/40 text-[14px] mb-4">Average org lifecycle (current state):</p>
                      <div className="font-mono text-[13px] space-y-2">
                        <motion.div
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.1, ease: MOTION.ease.premium }}
                        >
                          <span className="text-white/60">May:</span>
                          <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="bg-red-500/40 h-2 rounded-full"
                              initial={{ width: '0%' }}
                              whileInView={{ width: '15%' }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: 0.2, ease: MOTION.ease.premium }}
                            />
                          </div>
                          <span className="text-white/30">15% knowledge retained</span>
                        </motion.div>
                        <motion.div
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.2, ease: MOTION.ease.premium }}
                        >
                          <span className="text-white/60">Sept:</span>
                          <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="bg-orange-500/40 h-2 rounded-full"
                              initial={{ width: '0%' }}
                              whileInView={{ width: '35%' }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: 0.3, ease: MOTION.ease.premium }}
                            />
                          </div>
                          <span className="text-white/30">35% rebuilt from scratch</span>
                        </motion.div>
                        <motion.div
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.3, ease: MOTION.ease.premium }}
                        >
                          <span className="text-white/60">Dec:</span>
                          <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="bg-yellow-500/40 h-2 rounded-full"
                              initial={{ width: '0%' }}
                              whileInView={{ width: '60%' }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: 0.4, ease: MOTION.ease.premium }}
                            />
                          </div>
                          <span className="text-white/30">60% back to baseline</span>
                        </motion.div>
                        <motion.div
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.4, ease: MOTION.ease.premium }}
                        >
                          <span className="text-white/60">May:</span>
                          <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="bg-red-500/40 h-2 rounded-full"
                              initial={{ width: '0%' }}
                              whileInView={{ width: '20%' }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: 0.5, ease: MOTION.ease.premium }}
                            />
                          </div>
                          <span className="text-white/30">Repeat</span>
                        </motion.div>
                      </div>
                      <motion.p
                        className="text-white/30 text-[13px] mt-4 italic"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.6, ease: MOTION.ease.premium }}
                      >
                        Orgs spend 8-10 weeks every fall just getting back to where they were. That's not growth. That's treadmill.
                      </motion.p>
                    </motion.div>
                  </ParallaxText>

                  <ParallaxText speed={0.08}>
                    <p className="text-white/50">
                      Every org gets a Space. Think of it like a permanent building on campus that belongs to the org, not to whoever's president this year. When leadership graduates, the Space stays. All the posts, events, files, member history—it's there for the next cohort.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.075}>
                    <p className="text-white/60 font-medium text-[16px] uppercase tracking-wider mb-4">
                      What's actually in there
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.07}>
                    <div className="space-y-6 text-[16px] md:text-[18px]">
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1, ease: MOTION.ease.premium }}
                      >
                        <p className="text-white/60 font-medium mb-2">Feed & Posts</p>
                        <p className="text-white/40">
                          Announcements, updates, discussions. Threaded so conversations don't turn into chaos. Media-rich—images, files, embeds. Everything archived and searchable. You can search for "budget meeting" from three years ago and actually find it.
                        </p>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2, ease: MOTION.ease.premium }}
                      >
                        <p className="text-white/60 font-medium mb-2">Events & Calendar</p>
                        <p className="text-white/40">
                          Schedule meetings, track RSVPs, manage attendance. Events sync with personal calendars. No more "did you get the GroupMe message?" Recurring events, automated reminders, attendance analytics. You can actually see which events members show up to.
                        </p>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3, ease: MOTION.ease.premium }}
                      >
                        <p className="text-white/60 font-medium mb-2">Resources & Files</p>
                        <p className="text-white/40">
                          Upload docs, create wikis, organize by folder. Version history tracked automatically. No more "the link broke" or "it's on Sarah's laptop and she graduated." Knowledge becomes institutional memory instead of personal property scattered across Google Drives.
                        </p>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4, ease: MOTION.ease.premium }}
                      >
                        <p className="text-white/60 font-medium mb-2">Members & Roles</p>
                        <p className="text-white/40">
                          Directory of everyone. Custom roles with granular permissions. Leadership handoffs become seamless—just reassign the role. New president gets access to everything immediately. No more "I don't know the password" or "the treasurer had that in their personal Drive."
                        </p>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.5, ease: MOTION.ease.premium }}
                      >
                        <p className="text-white/60 font-medium mb-2">Analytics & Insights</p>
                        <p className="text-white/40">
                          Track engagement, event attendance, member activity. See what's working. Export reports for end-of-semester reviews or when the university asks for proof of activity. Data that helps you lead better, not just numbers for compliance.
                        </p>
                      </motion.div>
                    </div>
                  </ParallaxText>

                  <ParallaxText speed={0.065}>
                    <motion.div
                      className="bg-black/20 border border-white/5 rounded-lg p-6"
                      initial={{ opacity: 0, scale: 0.98 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: MOTION.ease.premium }}
                    >
                      <p className="text-white/40 text-[14px] mb-4">What changes with durable infrastructure:</p>
                      <div className="grid grid-cols-2 gap-6 text-[13px]">
                        <motion.div
                          initial={{ opacity: 0, x: -15 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.1, ease: MOTION.ease.premium }}
                        >
                          <p className="text-white/30 mb-2">Before (typical org):</p>
                          <div className="space-y-1 text-white/25">
                            <motion.p
                              initial={{ opacity: 0, x: -10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: 0.2, ease: MOTION.ease.premium }}
                            >
                              → 6-8 tools to manage
                            </motion.p>
                            <motion.p
                              initial={{ opacity: 0, x: -10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: 0.25, ease: MOTION.ease.premium }}
                            >
                              → Knowledge resets yearly
                            </motion.p>
                            <motion.p
                              initial={{ opacity: 0, x: -10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: 0.3, ease: MOTION.ease.premium }}
                            >
                              → 10 weeks to rebuild baseline
                            </motion.p>
                            <motion.p
                              initial={{ opacity: 0, x: -10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: 0.35, ease: MOTION.ease.premium }}
                            >
                              → Files scattered/lost
                            </motion.p>
                            <motion.p
                              initial={{ opacity: 0, x: -10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: 0.4, ease: MOTION.ease.premium }}
                            >
                              → No handoff process
                            </motion.p>
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: 15 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.1, ease: MOTION.ease.premium }}
                        >
                          <p className="text-[var(--color-gold)]/60 mb-2">After (with Spaces):</p>
                          <div className="space-y-1 text-white/40">
                            <motion.p
                              initial={{ opacity: 0, x: 10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: 0.2, ease: MOTION.ease.premium }}
                            >
                              → 1 unified system
                            </motion.p>
                            <motion.p
                              initial={{ opacity: 0, x: 10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: 0.25, ease: MOTION.ease.premium }}
                            >
                              → Knowledge compounds
                            </motion.p>
                            <motion.p
                              initial={{ opacity: 0, x: 10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: 0.3, ease: MOTION.ease.premium }}
                            >
                              → Day 1 productivity
                            </motion.p>
                            <motion.p
                              initial={{ opacity: 0, x: 10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: 0.35, ease: MOTION.ease.premium }}
                            >
                              → Everything archived
                            </motion.p>
                            <motion.p
                              initial={{ opacity: 0, x: 10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: 0.4, ease: MOTION.ease.premium }}
                            >
                              → Role reassignment = handoff
                            </motion.p>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </ParallaxText>
                </div>
              </div>
            </UpvotableSection>

            {/* HOW IT WORKS (VISUAL) */}
            <section className="px-6 py-32 relative">
              <AnimatedBorder variant="horizontal" className="absolute top-0 left-6 right-6" />
              <div className="mx-auto max-w-4xl">
                <ParallaxText speed={0.15}>
                  <motion.h2
                    className="mb-6 text-[32px] md:text-[40px] font-semibold text-white"
                    style={{ fontFamily: 'var(--font-display)' }}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: MOTION.ease.premium }}
                  >
                    How It Works
                  </motion.h2>
                  <p className="text-[16px] text-[var(--color-gold)]/60 mb-16">
                    Visual overview for how the pieces connect
                  </p>
                </ParallaxText>

                {/* System Architecture Diagram */}
                <motion.div
                  className="mb-20"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, ease: MOTION.ease.premium }}
                >
                  <p className="text-white/40 text-[13px] uppercase tracking-wider mb-6">System Architecture</p>
                  <div className="bg-black/30 border border-white/10 rounded-xl p-8 overflow-x-auto">
                    <svg viewBox="0 0 600 280" className="w-full min-w-[500px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* HIVE container */}
                      <motion.rect
                        x="20" y="20" width="560" height="240" rx="12"
                        stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2, ease: MOTION.ease.premium }}
                      />
                      <motion.text
                        x="50" y="55" fill="rgba(255,255,255,0.6)" fontSize="18" fontWeight="600"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4, ease: MOTION.ease.premium }}
                      >
                        HIVE
                      </motion.text>

                      {/* Four main modules */}
                      <motion.g
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.5, ease: MOTION.ease.premium }}
                      >
                        <rect x="40" y="80" width="120" height="70" rx="8" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.3)" strokeWidth="1" />
                        <text x="100" y="108" fill="rgba(255,255,255,0.7)" fontSize="13" fontWeight="500" textAnchor="middle">Spaces</text>
                        <text x="100" y="128" fill="rgba(255,255,255,0.35)" fontSize="10" textAnchor="middle">Your org's home</text>
                      </motion.g>

                      <motion.g
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.6, ease: MOTION.ease.premium }}
                      >
                        <rect x="175" y="80" width="120" height="70" rx="8" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.3)" strokeWidth="1" />
                        <text x="235" y="108" fill="rgba(255,255,255,0.7)" fontSize="13" fontWeight="500" textAnchor="middle">Feed</text>
                        <text x="235" y="128" fill="rgba(255,255,255,0.35)" fontSize="10" textAnchor="middle">Campus activity</text>
                      </motion.g>

                      <motion.g
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.7, ease: MOTION.ease.premium }}
                      >
                        <rect x="310" y="80" width="120" height="70" rx="8" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.3)" strokeWidth="1" />
                        <text x="370" y="108" fill="rgba(255,255,255,0.7)" fontSize="13" fontWeight="500" textAnchor="middle">HiveLab</text>
                        <text x="370" y="128" fill="rgba(255,255,255,0.35)" fontSize="10" textAnchor="middle">Custom tools</text>
                      </motion.g>

                      <motion.g
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.8, ease: MOTION.ease.premium }}
                      >
                        <rect x="445" y="80" width="120" height="70" rx="8" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.3)" strokeWidth="1" />
                        <text x="505" y="108" fill="rgba(255,255,255,0.7)" fontSize="13" fontWeight="500" textAnchor="middle">Profile</text>
                        <text x="505" y="128" fill="rgba(255,255,255,0.35)" fontSize="10" textAnchor="middle">Your identity</text>
                      </motion.g>

                      {/* Connecting layer */}
                      <motion.rect
                        x="40" y="175" width="525" height="60" rx="8"
                        fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.9, ease: MOTION.ease.premium }}
                      />
                      <motion.text
                        x="300" y="200" fill="rgba(255,255,255,0.5)" fontSize="12" fontWeight="500" textAnchor="middle"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 1, ease: MOTION.ease.premium }}
                      >
                        Events + Posts + Files + Members
                      </motion.text>
                      <motion.text
                        x="300" y="220" fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="middle"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 1.1, ease: MOTION.ease.premium }}
                      >
                        Everything that happens in your space
                      </motion.text>

                      {/* Connector lines */}
                      <motion.line
                        x1="100" y1="150" x2="100" y2="175"
                        stroke="rgba(255,255,255,0.2)" strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 1, ease: MOTION.ease.premium }}
                      />
                      <motion.line
                        x1="235" y1="150" x2="235" y2="175"
                        stroke="rgba(255,255,255,0.2)" strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 1.1, ease: MOTION.ease.premium }}
                      />
                      <motion.line
                        x1="370" y1="150" x2="370" y2="175"
                        stroke="rgba(255,255,255,0.2)" strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 1.2, ease: MOTION.ease.premium }}
                      />
                      <motion.line
                        x1="505" y1="150" x2="505" y2="175"
                        stroke="rgba(255,255,255,0.2)" strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 1.3, ease: MOTION.ease.premium }}
                      />
                    </svg>
                  </div>
                  <p className="text-white/30 text-[12px] mt-4 text-center italic">
                    Four surfaces, one unified system. Everything connects through shared data.
                  </p>
                </motion.div>

                {/* User Journey Flowchart */}
                <motion.div
                  className="mb-20"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: 0.2, ease: MOTION.ease.premium }}
                >
                  <p className="text-white/40 text-[13px] uppercase tracking-wider mb-6">Your Journey</p>
                  <div className="bg-black/30 border border-white/10 rounded-xl p-8 overflow-x-auto">
                    <svg viewBox="0 0 600 260" className="w-full min-w-[500px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Top row - main flow */}
                      <motion.g
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3, ease: MOTION.ease.premium }}
                      >
                        <rect x="20" y="30" width="100" height="45" rx="6" fill="rgba(212,175,55,0.1)" stroke="rgba(212,175,55,0.4)" strokeWidth="1" />
                        <text x="70" y="57" fill="rgba(255,255,255,0.7)" fontSize="12" fontWeight="500" textAnchor="middle">Sign up</text>
                      </motion.g>

                      <motion.line
                        x1="120" y1="52" x2="145" y2="52"
                        stroke="rgba(255,255,255,0.3)" strokeWidth="1" markerEnd="url(#arrowhead)"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.5, ease: MOTION.ease.premium }}
                      />

                      <motion.g
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4, ease: MOTION.ease.premium }}
                      >
                        <rect x="150" y="30" width="120" height="45" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        <text x="210" y="57" fill="rgba(255,255,255,0.6)" fontSize="12" textAnchor="middle">Pick your campus</text>
                      </motion.g>

                      <motion.line
                        x1="270" y1="52" x2="295" y2="52"
                        stroke="rgba(255,255,255,0.3)" strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.6, ease: MOTION.ease.premium }}
                      />

                      <motion.g
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.5, ease: MOTION.ease.premium }}
                      >
                        <rect x="300" y="30" width="100" height="45" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        <text x="350" y="57" fill="rgba(255,255,255,0.6)" fontSize="12" textAnchor="middle">Join spaces</text>
                      </motion.g>

                      <motion.line
                        x1="400" y1="52" x2="425" y2="52"
                        stroke="rgba(255,255,255,0.3)" strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.7, ease: MOTION.ease.premium }}
                      />

                      <motion.g
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.6, ease: MOTION.ease.premium }}
                      >
                        <rect x="430" y="30" width="150" height="45" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        <text x="505" y="57" fill="rgba(255,255,255,0.6)" fontSize="12" textAnchor="middle">Create & consume</text>
                      </motion.g>

                      {/* Branch down from Join spaces */}
                      <motion.line
                        x1="350" y1="75" x2="350" y2="105"
                        stroke="rgba(255,255,255,0.2)" strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.8, ease: MOTION.ease.premium }}
                      />

                      {/* Space types */}
                      <motion.g
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.9, ease: MOTION.ease.premium }}
                      >
                        <rect x="150" y="110" width="100" height="40" rx="6" fill="rgba(212,175,55,0.05)" stroke="rgba(212,175,55,0.2)" strokeWidth="1" />
                        <text x="200" y="134" fill="rgba(255,255,255,0.5)" fontSize="11" textAnchor="middle">Your Major</text>
                      </motion.g>

                      <motion.g
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 1, ease: MOTION.ease.premium }}
                      >
                        <rect x="265" y="110" width="100" height="40" rx="6" fill="rgba(212,175,55,0.05)" stroke="rgba(212,175,55,0.2)" strokeWidth="1" />
                        <text x="315" y="134" fill="rgba(255,255,255,0.5)" fontSize="11" textAnchor="middle">Your Dorm</text>
                      </motion.g>

                      <motion.g
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 1.1, ease: MOTION.ease.premium }}
                      >
                        <rect x="380" y="110" width="100" height="40" rx="6" fill="rgba(212,175,55,0.05)" stroke="rgba(212,175,55,0.2)" strokeWidth="1" />
                        <text x="430" y="134" fill="rgba(255,255,255,0.5)" fontSize="11" textAnchor="middle">Your Clubs</text>
                      </motion.g>

                      {/* Connecting lines to space types */}
                      <motion.path
                        d="M 350 105 L 350 95 L 200 95 L 200 110"
                        stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.9, ease: MOTION.ease.premium }}
                      />
                      <motion.path
                        d="M 350 105 L 350 95 L 315 95 L 315 110"
                        stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 1, ease: MOTION.ease.premium }}
                      />
                      <motion.path
                        d="M 350 105 L 350 95 L 430 95 L 430 110"
                        stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 1.1, ease: MOTION.ease.premium }}
                      />

                      {/* Lines converging down */}
                      <motion.path
                        d="M 200 150 L 200 175 L 315 175 M 315 150 L 315 175 M 430 150 L 430 175 L 315 175"
                        stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 1.2, ease: MOTION.ease.premium }}
                      />
                      <motion.line
                        x1="315" y1="175" x2="315" y2="195"
                        stroke="rgba(255,255,255,0.2)" strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 1.3, ease: MOTION.ease.premium }}
                      />

                      {/* Personalized feed result */}
                      <motion.g
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 1.4, ease: MOTION.ease.premium }}
                      >
                        <rect x="215" y="200" width="200" height="45" rx="6" fill="rgba(212,175,55,0.1)" stroke="rgba(212,175,55,0.4)" strokeWidth="1" />
                        <text x="315" y="227" fill="rgba(255,255,255,0.7)" fontSize="12" fontWeight="500" textAnchor="middle">Your personalized feed</text>
                      </motion.g>

                      {/* Arrow marker definition */}
                      <defs>
                        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                          <polygon points="0 0, 8 3, 0 6" fill="rgba(255,255,255,0.3)" />
                        </marker>
                      </defs>
                    </svg>
                  </div>
                  <p className="text-white/30 text-[12px] mt-4 text-center italic">
                    Start with your campus, find your communities, get a feed that actually matters.
                  </p>
                </motion.div>

                {/* Data Relationships Diagram */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: 0.2, ease: MOTION.ease.premium }}
                >
                  <p className="text-white/40 text-[13px] uppercase tracking-wider mb-6">Data Relationships</p>
                  <div className="bg-black/30 border border-white/10 rounded-xl p-8 overflow-x-auto">
                    <svg viewBox="0 0 600 200" className="w-full min-w-[500px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Student entity */}
                      <motion.g
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3, ease: MOTION.ease.premium }}
                      >
                        <rect x="40" y="60" width="100" height="80" rx="8" fill="rgba(212,175,55,0.1)" stroke="rgba(212,175,55,0.4)" strokeWidth="1" />
                        <text x="90" y="85" fill="rgba(255,255,255,0.7)" fontSize="13" fontWeight="600" textAnchor="middle">Student</text>
                        <line x1="55" y1="95" x2="125" y2="95" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                        <text x="90" y="112" fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle">name</text>
                        <text x="90" y="127" fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle">email</text>
                      </motion.g>

                      {/* Connection to Campus */}
                      <motion.line
                        x1="140" y1="80" x2="240" y2="45"
                        stroke="rgba(255,255,255,0.2)" strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.5, ease: MOTION.ease.premium }}
                      />
                      <motion.text
                        x="190" y="55" fill="rgba(255,255,255,0.3)" fontSize="9"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.6, ease: MOTION.ease.premium }}
                      >
                        belongs to
                      </motion.text>

                      {/* Campus entity */}
                      <motion.g
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4, ease: MOTION.ease.premium }}
                      >
                        <rect x="250" y="15" width="100" height="60" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        <text x="300" y="40" fill="rgba(255,255,255,0.6)" fontSize="13" fontWeight="500" textAnchor="middle">Campus</text>
                        <text x="300" y="58" fill="rgba(255,255,255,0.35)" fontSize="10" textAnchor="middle">name, domain</text>
                      </motion.g>

                      {/* Connection to Space */}
                      <motion.line
                        x1="140" y1="100" x2="240" y2="110"
                        stroke="rgba(255,255,255,0.2)" strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.6, ease: MOTION.ease.premium }}
                      />
                      <motion.text
                        x="190" y="98" fill="rgba(255,255,255,0.3)" fontSize="9"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.7, ease: MOTION.ease.premium }}
                      >
                        joins
                      </motion.text>

                      {/* Space entity */}
                      <motion.g
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.5, ease: MOTION.ease.premium }}
                      >
                        <rect x="250" y="90" width="100" height="70" rx="8" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.3)" strokeWidth="1" />
                        <text x="300" y="115" fill="rgba(255,255,255,0.7)" fontSize="13" fontWeight="500" textAnchor="middle">Space</text>
                        <text x="300" y="133" fill="rgba(255,255,255,0.35)" fontSize="10" textAnchor="middle">name, type</text>
                        <text x="300" y="148" fill="rgba(255,255,255,0.35)" fontSize="10" textAnchor="middle">members</text>
                      </motion.g>

                      {/* Connection to Content */}
                      <motion.line
                        x1="350" y1="125" x2="420" y2="125"
                        stroke="rgba(255,255,255,0.2)" strokeWidth="1"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.7, ease: MOTION.ease.premium }}
                      />
                      <motion.text
                        x="385" y="118" fill="rgba(255,255,255,0.3)" fontSize="9"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.8, ease: MOTION.ease.premium }}
                      >
                        contains
                      </motion.text>

                      {/* Content entity */}
                      <motion.g
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.6, ease: MOTION.ease.premium }}
                      >
                        <rect x="430" y="60" width="130" height="130" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        <text x="495" y="90" fill="rgba(255,255,255,0.6)" fontSize="12" fontWeight="500" textAnchor="middle">Content</text>
                        <line x1="445" y1="100" x2="545" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                        <text x="495" y="120" fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle">Posts</text>
                        <text x="495" y="138" fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle">Events</text>
                        <text x="495" y="156" fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle">Files</text>
                        <text x="495" y="174" fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle">Tools</text>
                      </motion.g>

                      {/* Student creates content line */}
                      <motion.path
                        d="M 90 140 L 90 170 L 430 170"
                        stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" strokeDasharray="4 2"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.9, ease: MOTION.ease.premium }}
                      />
                      <motion.text
                        x="260" y="165" fill="rgba(255,255,255,0.25)" fontSize="9"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 1, ease: MOTION.ease.premium }}
                      >
                        creates
                      </motion.text>
                    </svg>
                  </div>
                  <p className="text-white/30 text-[12px] mt-4 text-center italic">
                    Simple relationships: students belong to campuses, join spaces, and create content within them.
                  </p>
                </motion.div>
              </div>
            </section>

            {/* FEED & RITUALS */}
            <UpvotableSection
              className="px-6 py-32 relative"
              sectionId="feed"
              upvoteProps={upvoteProps}
            >
              <AnimatedBorder variant="horizontal" className="absolute top-0 left-6 right-6" />
              <div className="mx-auto max-w-3xl">
                <ParallaxText speed={0.15}>
                  <motion.h2
                    className="mb-6 text-[32px] md:text-[40px] font-semibold text-white"
                    style={{ fontFamily: 'var(--font-display)' }}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: MOTION.ease.premium }}
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
                    <p className="text-white/50">
                      Think about it: every org has recurring patterns. Weekly check-ins. Monthly showcases. Semester handoffs. Right now, those live in someone's head or a Google Doc that gets lost. What happens when you formalize those patterns into system behaviors? Coordination stops being something you remember to do—it just happens. Rituals that compound automatically.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.075}>
                    <motion.div
                      className="bg-black/20 border border-white/5 rounded-lg p-6"
                      initial={{ opacity: 0, scale: 0.98 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: MOTION.ease.premium }}
                    >
                      <p className="text-white/40 text-[14px] mb-3">The pattern we're seeing:</p>
                      <div className="space-y-2 text-[13px] text-white/30">
                        <motion.p
                          initial={{ opacity: 0, x: -15 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.1, ease: MOTION.ease.premium }}
                        >
                          → Orgs with documented rituals retain 3x more institutional knowledge
                        </motion.p>
                        <motion.p
                          initial={{ opacity: 0, x: -15 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.2, ease: MOTION.ease.premium }}
                        >
                          → New leadership hits productivity baseline 6 weeks faster
                        </motion.p>
                        <motion.p
                          initial={{ opacity: 0, x: -15 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.3, ease: MOTION.ease.premium }}
                        >
                          → Member engagement up 40% when expectations are systematized
                        </motion.p>
                        <motion.p
                          initial={{ opacity: 0, x: -15 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.4, ease: MOTION.ease.premium }}
                        >
                          → Handoffs stop being crisis moments, become scheduled non-events
                        </motion.p>
                      </div>
                      <motion.p
                        className="text-white/25 text-[12px] mt-4 italic"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.5, ease: MOTION.ease.premium }}
                      >
                        We're building the infrastructure to make those patterns native to the system, not dependent on individual effort.
                      </motion.p>
                    </motion.div>
                  </ParallaxText>
                </div>
              </div>
            </UpvotableSection>

            {/* PROFILE */}
            <UpvotableSection
              className="px-6 py-32 relative"
              sectionId="resources"
              upvoteProps={upvoteProps}
            >
              <AnimatedBorder variant="horizontal" className="absolute top-0 left-6 right-6" />
              <div className="mx-auto max-w-3xl">
                <ParallaxText speed={0.15}>
                  <motion.h2
                    className="mb-6 text-[32px] md:text-[40px] font-semibold text-white"
                    style={{ fontFamily: 'var(--font-display)' }}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: MOTION.ease.premium }}
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
                      Here's what bugs me. Right now, when you graduate, all your actual work—the events you organized, the projects you shipped, the communities you built—that data stays locked in university systems you can't access anymore. Or worse, it's just gone.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.09}>
                    <p className="text-white/40">
                      Your profile on HIVE isn't a resume. It's your operating system on campus. A verifiable record of actual work, not self-reported bullet points. When you run an event in a Space, that's recorded. When you build a tool in HiveLab, that's recorded. When you contribute to an org over multiple semesters, the trajectory is visible.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.08}>
                    <motion.div
                      className="bg-[var(--color-gold)]/[0.03] border border-[var(--color-gold)]/10 rounded-lg p-6"
                      initial={{ opacity: 0, scale: 0.98 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: MOTION.ease.premium }}
                    >
                      <p className="text-white/40 text-[14px] mb-4">What a profile actually tracks:</p>
                      <div className="space-y-3 text-[13px]">
                        <motion.div
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -15 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.1, ease: MOTION.ease.premium }}
                        >
                          <span className="text-[var(--color-gold)]/60 mt-1">●</span>
                          <div>
                            <p className="text-white/60 font-medium">Spaces you're part of</p>
                            <p className="text-white/30">Not just member lists. Role history, contribution patterns, leadership tenure.</p>
                          </div>
                        </motion.div>
                        <motion.div
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -15 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.2, ease: MOTION.ease.premium }}
                        >
                          <span className="text-[var(--color-gold)]/60 mt-1">●</span>
                          <div>
                            <p className="text-white/60 font-medium">Events you've organized or attended</p>
                            <p className="text-white/30">Verifiable attendance records, not self-reported "I went to this."</p>
                          </div>
                        </motion.div>
                        <motion.div
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -15 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.3, ease: MOTION.ease.premium }}
                        >
                          <span className="text-[var(--color-gold)]/60 mt-1">●</span>
                          <div>
                            <p className="text-white/60 font-medium">Tools you've built in HiveLab</p>
                            <p className="text-white/30">Actual software you created. Usage stats, deployment history, impact.</p>
                          </div>
                        </motion.div>
                        <motion.div
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -15 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.4, ease: MOTION.ease.premium }}
                        >
                          <span className="text-[var(--color-gold)]/60 mt-1">●</span>
                          <div>
                            <p className="text-white/60 font-medium">Contributions across orgs</p>
                            <p className="text-white/30">Posts authored, files uploaded, discussions started. Quantified impact.</p>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </ParallaxText>

                  <ParallaxText speed={0.075}>
                    <p className="text-white/50">
                      Here's what changes when students own their data: it becomes portable. When you graduate, you take it with you. Your profile isn't a PDF resume someone has to trust—it's verifiable proof of work. Events you organized. Projects you shipped. Organizations you led. Actually provable, not self-reported.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.07}>
                    <p className="text-white/40">
                      This is the autonomy piece. Right now, students are users of university systems. Those systems own the data. We're building the flip: you're not a user—you're a builder. Your profile is infrastructure you control. The university doesn't get to decide what you can prove about yourself.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.065}>
                    <motion.div
                      className="bg-[var(--color-gold)]/[0.03] border border-[var(--color-gold)]/10 rounded-lg p-6"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: MOTION.ease.premium }}
                    >
                      <p className="text-white/40 text-[14px] mb-4">What becomes possible:</p>
                      <div className="space-y-4 text-[13px]">
                        <motion.div
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.1, ease: MOTION.ease.premium }}
                        >
                          <span className="text-[var(--color-gold)]/60">●</span>
                          <div>
                            <p className="text-white/50 font-medium">Verifiable credentials</p>
                            <p className="text-white/30">Real proof of work, not claims. If you ran that event, the system knows. Can't fake it, can't lose it.</p>
                          </div>
                        </motion.div>
                        <motion.div
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.2, ease: MOTION.ease.premium }}
                        >
                          <span className="text-[var(--color-gold)]/60">●</span>
                          <div>
                            <p className="text-white/50 font-medium">Cross-campus reputation</p>
                            <p className="text-white/30">Your work at UB matters at Cornell. Build once, benefit everywhere. Transfer students don't start from zero.</p>
                          </div>
                        </motion.div>
                        <motion.div
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.3, ease: MOTION.ease.premium }}
                        >
                          <span className="text-[var(--color-gold)]/60">●</span>
                          <div>
                            <p className="text-white/50 font-medium">Privacy-preserving proof</p>
                            <p className="text-white/30">Prove you led a 200-person org without revealing which one. Selective disclosure for recruiting, grad school, whatever you need.</p>
                          </div>
                        </motion.div>
                      </div>
                      <motion.p
                        className="text-white/25 text-[12px] mt-4 italic"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.5, ease: MOTION.ease.premium }}
                      >
                        The tech exists. We're building the first system that points it at student autonomy instead of institutional control.
                      </motion.p>
                    </motion.div>
                  </ParallaxText>
                </div>
              </div>
            </UpvotableSection>

            {/* HIVELAB - CENTERPIECE */}
            <UpvotableSection
              className="px-6 py-32 relative"
              sectionId="hivelab"
              upvoteProps={upvoteProps}
            >
              <AnimatedBorder variant="horizontal" className="absolute top-0 left-6 right-6" />
              <div className="mx-auto max-w-3xl">
                {/* Large emphasis container */}
                <AnimatedBorder variant="container" className="rounded-2xl bg-gradient-to-br from-[var(--color-gold)]/[0.08] to-[var(--color-gold)]/[0.02] p-12 md:p-16 mb-16">
                  <ParallaxText speed={0.15}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: MOTION.ease.premium }}
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
                </AnimatedBorder>

                <div className="space-y-10 text-[18px] md:text-[20px] leading-relaxed">
                  <ParallaxText speed={0.1}>
                    <p className="text-white/60 font-medium">
                      This is the part that matters most.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.09}>
                    <p className="text-white/50">
                      Look. I talked to probably 50+ student org leaders while building this. Every single one had some workflow that didn't fit into existing tools. Consulting clubs need interview scheduling that integrates with their member database. Greek life needs rush tracking with custom evaluation rubrics. Cultural orgs need event budgeting tied to their funding sources.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.085}>
                    <p className="text-white/40">
                      Right now, those orgs either hack together Google Sheets (which breaks the moment someone changes a formula), pay for expensive niche software (if it even exists), or just... don't solve the problem. They live with the friction.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.08}>
                    <motion.div
                      className="bg-[var(--color-gold)]/[0.03] border border-[var(--color-gold)]/10 rounded-lg p-6"
                      initial={{ opacity: 0, scale: 0.98 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: MOTION.ease.premium }}
                    >
                      <p className="text-white/40 text-[14px] mb-4">The tool gap (based on 50+ org interviews):</p>
                      <div className="space-y-4">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.1, ease: MOTION.ease.premium }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white/50 text-[13px]">Orgs using 4+ disconnected tools</span>
                            <span className="text-[var(--color-gold)]/60 text-[13px] font-mono">87%</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="bg-[var(--color-gold)]/40 h-2 rounded-full"
                              initial={{ width: '0%' }}
                              whileInView={{ width: '87%' }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.2, delay: 0.2, ease: MOTION.ease.premium }}
                            />
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.2, ease: MOTION.ease.premium }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white/50 text-[13px]">Have workflow that doesn't fit any tool</span>
                            <span className="text-[var(--color-gold)]/60 text-[13px] font-mono">92%</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="bg-[var(--color-gold)]/40 h-2 rounded-full"
                              initial={{ width: '0%' }}
                              whileInView={{ width: '92%' }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.2, delay: 0.3, ease: MOTION.ease.premium }}
                            />
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.3, ease: MOTION.ease.premium }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white/50 text-[13px]">Use Google Sheets as makeshift database</span>
                            <span className="text-[var(--color-gold)]/60 text-[13px] font-mono">74%</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="bg-[var(--color-gold)]/40 h-2 rounded-full"
                              initial={{ width: '0%' }}
                              whileInView={{ width: '74%' }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.2, delay: 0.4, ease: MOTION.ease.premium }}
                            />
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.4, ease: MOTION.ease.premium }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white/50 text-[13px]">Would build custom tool if they could</span>
                            <span className="text-[var(--color-gold)]/60 text-[13px] font-mono">96%</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="bg-[var(--color-gold)]/40 h-2 rounded-full"
                              initial={{ width: '0%' }}
                              whileInView={{ width: '96%' }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.2, delay: 0.5, ease: MOTION.ease.premium }}
                            />
                          </div>
                        </motion.div>
                      </div>
                      <motion.p
                        className="text-white/30 text-[13px] mt-4 italic"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.6, ease: MOTION.ease.premium }}
                      >
                        Orgs know what they need. They just can't build it. That's the problem HiveLab solves.
                      </motion.p>
                    </motion.div>
                  </ParallaxText>

                  <ParallaxText speed={0.075}>
                    <p className="text-white/50">
                      HiveLab is a no-code builder, but not the way you're thinking. This isn't drag-and-drop widgets. You describe what you need in plain language—"I need a membership application with custom questions, file uploads, and a review workflow"—and the AI scaffolds an actual application. Then you customize it. Deploy it directly into your Space.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.07}>
                    <p className="text-white/40">
                      You're not configuring a form builder. You're authoring software. The tools you build become part of your org's infrastructure, just like posts or events. They have URLs, permissions, databases, the whole thing.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.065}>
                    <p className="text-white/60 font-medium text-[16px] uppercase tracking-wider mb-4">
                      What students are actually building
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.06}>
                    <div className="space-y-4 text-[16px] md:text-[18px]">
                      <motion.div
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1, ease: MOTION.ease.premium }}
                      >
                        <span className="text-[var(--color-gold)]/40">→</span>
                        <div>
                          <p className="text-white/60 font-medium">Membership application system</p>
                          <p className="text-white/30 text-[14px]">Custom questions, file uploads, review workflows. One consulting club processed 200+ applications through theirs last semester. Replaced a broken Google Form + Sheet combo that crashed during peak traffic.</p>
                        </div>
                      </motion.div>
                      <motion.div
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2, ease: MOTION.ease.premium }}
                      >
                        <span className="text-[var(--color-gold)]/40">→</span>
                        <div>
                          <p className="text-white/60 font-medium">Event check-in with QR codes</p>
                          <p className="text-white/30 text-[14px]">Syncs with attendance records automatically. Greek org used it to track 40+ events per semester, proving activity to university admins. Cut manual tracking from 3 hours/week to zero.</p>
                        </div>
                      </motion.div>
                      <motion.div
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3, ease: MOTION.ease.premium }}
                      >
                        <span className="text-[var(--color-gold)]/40">→</span>
                        <div>
                          <p className="text-white/60 font-medium">Project showcase portal</p>
                          <p className="text-white/30 text-[14px]">Members upload work for end-of-semester reviews. Design club uses it as a portfolio system. Replaced emailing PDFs back and forth. Now every semester's work is archived and searchable.</p>
                        </div>
                      </motion.div>
                      <motion.div
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4, ease: MOTION.ease.premium }}
                      >
                        <span className="text-[var(--color-gold)]/40">→</span>
                        <div>
                          <p className="text-white/60 font-medium">Budget request system</p>
                          <p className="text-white/30 text-[14px]">Tied to org financials with approval workflows. Student government uses it for funding requests. Built-in audit trail. Reduced approval time from 2 weeks to 3 days because everything's centralized and transparent.</p>
                        </div>
                      </motion.div>
                      <motion.div
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.5, ease: MOTION.ease.premium }}
                      >
                        <span className="text-[var(--color-gold)]/40">→</span>
                        <div>
                          <p className="text-white/60 font-medium">Anonymous feedback system</p>
                          <p className="text-white/30 text-[14px]">Leadership can gather honest input without knowing who said what. Several orgs use this for end-of-year retrospectives. Gets real feedback that wouldn't surface in a public discussion.</p>
                        </div>
                      </motion.div>
                    </div>
                  </ParallaxText>

                  <ParallaxText speed={0.055}>
                    <motion.div
                      className="bg-black/20 border border-white/5 rounded-lg p-6"
                      initial={{ opacity: 0, scale: 0.98 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: MOTION.ease.premium }}
                    >
                      <p className="text-white/40 text-[14px] mb-4">Time to ship (early data from pilot orgs):</p>
                      <div className="space-y-3 text-[13px]">
                        <motion.div
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -15 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.1, ease: MOTION.ease.premium }}
                        >
                          <span className="text-white/40 w-32">Traditional dev:</span>
                          <div className="flex-1">
                            <p className="text-white/30 mb-1">2-6 weeks (if you know someone who codes)</p>
                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                className="bg-red-500/40 h-1.5 rounded-full"
                                initial={{ width: '0%' }}
                                whileInView={{ width: '100%' }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: 0.2, ease: MOTION.ease.premium }}
                              />
                            </div>
                          </div>
                        </motion.div>
                        <motion.div
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -15 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.2, ease: MOTION.ease.premium }}
                        >
                          <span className="text-white/40 w-32">No-code tools:</span>
                          <div className="flex-1">
                            <p className="text-white/30 mb-1">3-5 days (steep learning curve, limited flexibility)</p>
                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                className="bg-orange-500/40 h-1.5 rounded-full"
                                initial={{ width: '0%' }}
                                whileInView={{ width: '60%' }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: 0.3, ease: MOTION.ease.premium }}
                              />
                            </div>
                          </div>
                        </motion.div>
                        <motion.div
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -15 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.3, ease: MOTION.ease.premium }}
                        >
                          <span className="text-white/40 w-32">HiveLab:</span>
                          <div className="flex-1">
                            <p className="text-[var(--color-gold)]/60 mb-1">2-4 hours (describe → scaffold → customize → deploy)</p>
                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                className="bg-[var(--color-gold)]/60 h-1.5 rounded-full"
                                initial={{ width: '0%' }}
                                whileInView={{ width: '15%' }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: 0.4, ease: MOTION.ease.premium }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </ParallaxText>

                  <ParallaxText speed={0.05}>
                    <p className="text-white/50">
                      HiveLab is where HIVE stops being a platform and becomes infrastructure. You're not just using software—you're building it. Every org has unique needs. Generic platforms can't serve them all. So we give you the ability to extend the system yourself.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.045}>
                    <p className="text-white/40">
                      This is what student autonomy actually looks like. Not "we'll add your feature request to the backlog." You build what you need. The capability to create what institutions can't or won't provide.
                    </p>
                  </ParallaxText>

                  <ParallaxText speed={0.04}>
                    <motion.div
                      className="bg-[var(--color-gold)]/[0.03] border border-[var(--color-gold)]/10 rounded-lg p-8"
                      initial={{ opacity: 0, scale: 0.98 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: MOTION.ease.premium }}
                    >
                      <motion.p
                        className="text-white/60 font-medium mb-4 text-[18px]"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1, ease: MOTION.ease.premium }}
                      >
                        Here's where this goes:
                      </motion.p>
                      <motion.p
                        className="text-white/50 text-[16px] mb-4"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2, ease: MOTION.ease.premium }}
                      >
                        An org at UB builds an interview scheduler in HiveLab. Works perfectly for their use case. They publish it. Now every consulting club on HIVE can deploy that tool to their Space in one click. Student-built infrastructure that compounds across campuses.
                      </motion.p>
                      <motion.p
                        className="text-white/40 text-[15px] mb-6"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3, ease: MOTION.ease.premium }}
                      >
                        Right now, every org reinvents the wheel. Same problems, solved separately, knowledge dies with graduation. HiveLab makes the wheel copyable. A Greek org's rush tracker becomes available to every chapter nationwide. A cultural org's event budgeting tool works for any org with similar constraints.
                      </motion.p>
                      <motion.div
                        className="bg-black/20 rounded-lg p-5 mb-4"
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.4, ease: MOTION.ease.premium }}
                      >
                        <p className="text-white/40 text-[13px] mb-3">Network effects math:</p>
                        <div className="space-y-2 text-[12px] font-mono">
                          <motion.div
                            className="flex items-center justify-between"
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.5, ease: MOTION.ease.premium }}
                          >
                            <span className="text-white/30">1 campus, 400 orgs:</span>
                            <span className="text-white/40">400 unique solutions (isolated)</span>
                          </motion.div>
                          <motion.div
                            className="flex items-center justify-between"
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.6, ease: MOTION.ease.premium }}
                          >
                            <span className="text-white/30">10 campuses, 4,000 orgs:</span>
                            <span className="text-[var(--color-gold)]/60">400 solutions × 10 deployments each</span>
                          </motion.div>
                          <motion.div
                            className="flex items-center justify-between"
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.7, ease: MOTION.ease.premium }}
                          >
                            <span className="text-white/30">100 campuses, 40,000 orgs:</span>
                            <span className="text-[var(--color-gold)]">400 solutions × 100 deployments</span>
                          </motion.div>
                        </div>
                        <motion.p
                          className="text-white/25 text-[11px] mt-3 italic"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.8, ease: MOTION.ease.premium }}
                        >
                          Build once, benefit everywhere. That's not a tagline. That's the inevitability of programmable infrastructure.
                        </motion.p>
                      </motion.div>
                      <motion.p
                        className="text-white/30 text-[14px]"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.9, ease: MOTION.ease.premium }}
                      >
                        The marketplace isn't a feature we're adding. It's what naturally happens when you give students the ability to build and share. We're just building the rails for it to run on.
                      </motion.p>
                    </motion.div>
                  </ParallaxText>
                </div>
              </div>
            </UpvotableSection>
          </motion.div>
        )}

        {/* The Future - CTA */}
        <UpvotableSection className="px-6 py-40 relative">
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
                <p className="text-white/40 text-[16px] mb-8 max-w-[600px] mx-auto">
                  Spaces are being claimed. Tools are being built. The infrastructure is live. What happens next isn't up to us—it's up to the students who show up and build.
                </p>
              </motion.div>
            </ParallaxText>

            <div className="text-center">
              <ParallaxText speed={0.05}>
                <motion.p
                  className="text-[32px] md:text-[44px] font-medium leading-[1.1] mb-12"
                  style={{ fontFamily: 'var(--font-display)' }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: MOTION.ease.premium }}
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
                transition={{ duration: 0.8, delay: 0.3, ease: MOTION.ease.premium }}
              >
                <Button variant="cta" size="lg" asChild>
                  <a href="/enter">Enter with .edu</a>
                </Button>
              </motion.div>

              <motion.p
                className="mt-8 text-[13px] text-white/25"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5, ease: MOTION.ease.premium }}
              >
                Infrastructure-grade. Student-owned. Already shipping.
              </motion.p>
            </div>
          </div>
        </UpvotableSection>
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
