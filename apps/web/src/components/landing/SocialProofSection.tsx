'use client';

import {
  RevealSection,
  FadeUp,
  NarrativeReveal,
  AnimatedBorder,
} from '@hive/ui/design-system/primitives';
import { AnimatedCounter } from './AnimatedCounter';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

export function SocialProofSection() {
  return (
    <RevealSection className="py-32 md:py-40 border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6">
        <FadeUp>
          <div className="flex items-center gap-3 mb-16">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]/60" />
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/30">Momentum</p>
          </div>
        </FadeUp>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-12 md:gap-20 mb-24">
          <FadeUp>
            <div>
              <p className={`${clashDisplay} text-[clamp(48px,9vw,80px)] font-semibold text-white leading-none`}>
                <AnimatedCounter value={27} />
              </p>
              <p className="text-sm text-white/30 mt-3">Elements to build with</p>
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div>
              <p className={`${clashDisplay} text-[clamp(48px,9vw,80px)] font-semibold text-white leading-none`}>
                30s
              </p>
              <p className="text-sm text-white/30 mt-3">Template to live tool</p>
            </div>
          </FadeUp>
          <FadeUp delay={0.2}>
            <div>
              <p className={`${clashDisplay} text-[clamp(48px,9vw,80px)] font-semibold text-white leading-none`}>
                UB
              </p>
              <p className="text-sm text-white/30 mt-3">First campus</p>
            </div>
          </FadeUp>
        </div>

        <AnimatedBorder variant="horizontal" className="mb-16" />

        {/* Founder quote */}
        <FadeUp>
          <blockquote className="max-w-3xl">
            <p className={`${clashDisplay} text-xl md:text-2xl font-medium text-white/50 leading-relaxed`}>
              <NarrativeReveal stagger="words">
                Students have great ideas but no fast way to make them real. HIVE gives anyone the power to build a tool and share it with their campus in seconds.
              </NarrativeReveal>
            </p>
          </blockquote>
        </FadeUp>
      </div>
    </RevealSection>
  );
}
