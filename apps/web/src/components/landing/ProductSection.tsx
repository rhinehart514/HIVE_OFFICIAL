'use client';

import {
  RevealSection,
  FadeUp,
  LandingWindow,
  type LandingWindowSpace,
} from '@hive/ui/design-system/primitives';
import { ProductMock } from './ProductMock';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

const discoverySpaces: LandingWindowSpace[] = [
  { id: '1', name: 'Engineering Club', shortName: 'EC', memberCount: 234, isLive: true },
  { id: '2', name: 'Debate Society', shortName: 'DS', memberCount: 89, isLive: false },
  { id: '3', name: 'Art Collective', shortName: 'AC', memberCount: 156, isLive: true },
  { id: '4', name: 'Finance Club', shortName: 'FC', memberCount: 312, isLive: false },
  { id: '5', name: 'Robotics Lab', shortName: 'RL', memberCount: 67, isLive: true },
];

interface FeatureBlockProps {
  number: string;
  title: string;
  description: string;
  visual: React.ReactNode;
  reverse?: boolean;
}

function FeatureBlock({ number, title, description, visual, reverse }: FeatureBlockProps) {
  return (
    <div className={`grid md:grid-cols-2 gap-12 md:gap-20 items-center ${reverse ? '' : ''}`}>
      <div className={`${reverse ? 'md:order-2' : ''}`}>
        <FadeUp>
          <p className={`${clashDisplay} text-[48px] font-semibold text-[#FFD700]/[0.08] leading-none mb-4`}>{number}</p>
          <h3 className={`${clashDisplay} text-2xl md:text-3xl font-medium text-white mb-3`}>{title}</h3>
          <p className="text-base text-white/40 leading-relaxed max-w-md">{description}</p>
        </FadeUp>
      </div>
      <div className={`${reverse ? 'md:order-1' : ''}`}>
        <FadeUp delay={0.2}>
          {visual}
        </FadeUp>
      </div>
    </div>
  );
}

function VerifiedProfileMock() {
  return (
    <div className="max-w-xs mx-auto">
      <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-6">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center">
            <span className="text-sm font-bold text-white/50">JS</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">Jordan Smith</span>
              <span className="w-4 h-4 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                  <path d="M10 3L4.5 8.5L2 6" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
            <span className="text-xs text-white/30">jordan.smith@buffalo.edu</span>
          </div>
        </div>
        {/* Spaces */}
        <div className="space-y-2">
          {['Engineering Club', 'Robotics Lab', 'Debate Society'].map((space) => (
            <div key={space} className="flex items-center gap-2 text-xs text-white/40">
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              {space}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductSection() {
  return (
    <RevealSection className="py-32 md:py-40 border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <FadeUp>
            <div className="flex items-center gap-3 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]/60" />
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/30">The Platform</p>
            </div>
          </FadeUp>
        </div>

        <div className="space-y-32 md:space-y-40">
          <FeatureBlock
            number="01"
            title="A permanent home for every org."
            description="Posts, events, files, members&mdash;one place that outlasts any president."
            visual={<ProductMock />}
          />

          <FeatureBlock
            number="02"
            title="Find your people by what you care about."
            description="Browse by major, interests, or what&rsquo;s trending. See who&rsquo;s active."
            visual={<LandingWindow spaces={discoverySpaces} featuredIndex={0} />}
            reverse
          />

          <FeatureBlock
            number="03"
            title="Real names. Real trust."
            description="Every profile verified through your campus email. You know who you&rsquo;re building with."
            visual={<VerifiedProfileMock />}
          />
        </div>
      </div>
    </RevealSection>
  );
}
