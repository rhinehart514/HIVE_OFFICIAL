'use client';

import {
  RevealSection,
  FadeUp,
} from '@hive/ui/design-system/primitives';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

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

function BuildMock() {
  const elements = ['Poll', 'Counter', 'RSVP', 'Countdown'];
  return (
    <div className="max-w-xs mx-auto">
      <div className="rounded-2xl border border-white/[0.06] bg-[var(--bg-ground)] p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="w-4 h-4 rounded bg-[#FFD700]/10 flex items-center justify-center">
            <span className="text-[6px] text-[#FFD700] font-bold">H</span>
          </span>
          <span className="text-xs font-medium text-white/60">New Tool</span>
        </div>
        <div className="space-y-2 mb-4">
          {elements.map((el) => (
            <div key={el} className="flex items-center gap-2 text-xs text-white/40 px-3 py-2 rounded-lg border border-white/[0.04] bg-white/[0.02]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]/30" />
              {el}
            </div>
          ))}
        </div>
        <div className="h-8 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
          <span className="text-[10px] font-medium text-[#FFD700]/60">Deploy</span>
        </div>
      </div>
    </div>
  );
}

function ShareMock() {
  const channels = ['GroupMe', 'iMessage', 'Instagram', 'QR Code', 'Link'];
  return (
    <div className="max-w-xs mx-auto">
      <div className="rounded-2xl border border-white/[0.06] bg-[var(--bg-ground)] p-6">
        <div className="text-xs font-medium text-white/60 mb-4">Share anywhere</div>
        <div className="space-y-2">
          {channels.map((ch) => (
            <div key={ch} className="flex items-center gap-3 text-xs text-white/40 px-3 py-2 rounded-lg border border-white/[0.04] bg-white/[0.02]">
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              {ch}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultsMock() {
  const votes = [
    { label: 'Friday', pct: 72 },
    { label: 'Saturday', pct: 45 },
    { label: 'Sunday', pct: 28 },
  ];
  return (
    <div className="max-w-xs mx-auto">
      <div className="rounded-2xl border border-white/[0.06] bg-[var(--bg-ground)] p-6">
        <div className="text-xs font-medium text-white/60 mb-1">Event Poll</div>
        <div className="text-[10px] text-white/30 mb-4">47 votes</div>
        <div className="space-y-3">
          {votes.map((v) => (
            <div key={v.label}>
              <div className="flex justify-between text-[10px] text-white/40 mb-1">
                <span>{v.label}</span>
                <span>{v.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#FFD700]/40"
                  style={{ width: `${v.pct}%` }}
                />
              </div>
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
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/30">How It Works</p>
            </div>
          </FadeUp>
        </div>

        <div className="space-y-32 md:space-y-40">
          <FeatureBlock
            number="01"
            title="Build in seconds."
            description="Pick a template or describe what you need. Polls, signups, countdowns, leaderboards&mdash;27 elements, zero code."
            visual={<BuildMock />}
          />

          <FeatureBlock
            number="02"
            title="Share it anywhere."
            description="Get a link. Drop it in GroupMe, text it, post it, print the QR code. Works on any device, no app to download."
            visual={<ShareMock />}
            reverse
          />

          <FeatureBlock
            number="03"
            title="See results live."
            description="Votes come in. Signups fill up. Countdowns tick. Everything updates in real time for everyone."
            visual={<ResultsMock />}
          />
        </div>
      </div>
    </RevealSection>
  );
}
