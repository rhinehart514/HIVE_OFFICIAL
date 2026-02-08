'use client';

import {
  RevealSection,
  FadeUp,
  Stagger,
  AnimatedBorder,
  motion,
} from '@hive/ui/design-system/primitives';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

const painPoints = [
  { label: 'Ideas die in group chats', desc: 'Someone proposes a poll, a signup, a countdown. It gets lost in 200 messages.' },
  { label: 'No tools fit', desc: 'Google Forms is ugly. Notion is overkill. Building an app takes months. Nothing exists in between.' },
  { label: 'Sharing is broken', desc: 'You need something live — right now — for your club, your dorm floor, your study group. There\u2019s no fast way.' },
];

export function ProblemSection() {
  return (
    <RevealSection className="py-32 md:py-40 relative overflow-hidden">
      <AnimatedBorder variant="horizontal" className="absolute top-0 left-0 right-0" />

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid md:grid-cols-12 gap-12 md:gap-20">
          {/* Left */}
          <div className="md:col-span-7">
            <FadeUp>
              <div className="flex items-center gap-3 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]/60" />
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/30">The Problem</p>
              </div>
              <h2 className={`${clashDisplay} text-[clamp(32px,5.5vw,56px)] font-semibold leading-[1.05] tracking-[-0.02em]`}>
                <span className="text-white">Students have ideas.</span>
                <br />
                <span className="text-white/20">No tools to ship them.</span>
              </h2>
              <p className="text-base text-white/30 mt-6 max-w-xl leading-relaxed">
                You want a quick poll for your club. A signup sheet for your event. A countdown for your fundraiser. Right now, there&rsquo;s nothing between &ldquo;text the group chat&rdquo; and &ldquo;learn to code.&rdquo;
              </p>
            </FadeUp>
          </div>

          {/* Right */}
          <div className="md:col-span-5 md:pt-16">
            <Stagger staggerDelay={0.15} className="space-y-8">
              {painPoints.map((item) => (
                <motion.div
                  key={item.label}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#FFD700]/50 mb-2">{item.label}</p>
                  <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </Stagger>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
