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
  { label: 'Knowledge dies', desc: 'Officers graduate, handoffs don\u2019t survive. Every semester starts from zero.' },
  { label: 'Tools fragment', desc: '6+ apps, nothing connects. GroupMe, Slack, Drive, Notion\u2014scattered everywhere.' },
  { label: 'Nothing persists', desc: 'You can\u2019t build on what doesn\u2019t exist. Institutional memory disappears.' },
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
                <span className="text-white">Every semester, student orgs</span>
                <br />
                <span className="text-white/20">start from zero.</span>
              </h2>
              <p className="text-base text-white/30 mt-6 max-w-xl leading-relaxed">
                Leadership turns over. GroupMe threads die. Google Drives get lost. The cycle repeats every year.
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
