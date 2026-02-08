'use client';

import {
  RevealSection,
  FadeUp,
  Stagger,
  AnimatedBorder,
  motion,
} from '@hive/ui/design-system/primitives';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

const oldWay = [
  { name: 'Google Forms', rotation: -3 },
  { name: 'Spreadsheets', rotation: 2 },
  { name: 'Group chat polls', rotation: -1 },
  { name: 'Show of hands', rotation: 4 },
  { name: 'Email threads', rotation: -2 },
  { name: 'Pen & paper', rotation: 1 },
];

const hiveTools = ['Poll', 'Signup', 'Countdown', 'Leaderboard'];

export function ComparisonSection() {
  return (
    <RevealSection className="py-32 md:py-40 border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16">
          {/* Before */}
          <FadeUp>
            <div className="relative rounded-2xl border border-white/[0.04] bg-white/[0.01] p-10 md:p-14 min-h-[300px] flex flex-col items-center justify-center">
              <Stagger staggerDelay={0.08} className="flex flex-wrap gap-4 justify-center mb-8">
                {oldWay.map((tool) => (
                  <motion.span
                    key={tool.name}
                    className="text-white/20 text-sm md:text-base px-3 py-1.5 border border-white/[0.06] rounded-lg bg-white/[0.02]"
                    style={{ transform: `rotate(${tool.rotation}deg)` }}
                    variants={{
                      hidden: { opacity: 0, scale: 0.8, rotate: tool.rotation * 2 },
                      visible: { opacity: 1, scale: 1, rotate: tool.rotation },
                    }}
                  >
                    {tool.name}
                  </motion.span>
                ))}
              </Stagger>
              <p className={`${clashDisplay} text-sm text-white/30 text-center`}>
                Hacky. Ugly. Nobody checks it.
              </p>
            </div>
          </FadeUp>

          {/* After */}
          <FadeUp delay={0.2}>
            <AnimatedBorder variant="container" className="rounded-2xl p-10 md:p-14 min-h-[300px] flex flex-col items-center justify-center">
              <div className="rounded-xl border border-[#FFD700]/10 bg-white/[0.02] p-6 w-full max-w-xs mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-4 h-4 rounded bg-[#FFD700]/10 flex items-center justify-center">
                    <span className="text-[6px] text-[#FFD700] font-bold">H</span>
                  </span>
                  <span className="text-xs font-medium text-white/60">Your Tool</span>
                </div>
                <div className="flex gap-1">
                  {hiveTools.map((tab) => (
                    <span
                      key={tab}
                      className="text-[10px] px-2 py-1 rounded text-white/30 bg-white/[0.03] border border-white/[0.04]"
                    >
                      {tab}
                    </span>
                  ))}
                </div>
              </div>
              <p className={`${clashDisplay} text-sm text-white/30 text-center`}>
                Built in 30 seconds. Shared everywhere.
              </p>
            </AnimatedBorder>
          </FadeUp>
        </div>
      </div>
    </RevealSection>
  );
}
