'use client';

import { motion, useReducedMotion } from 'framer-motion';

const clashDisplay = "font-[family-name:'Clash_Display',var(--font-clash)]";

export function CreationDemoSection() {
  const prefersReduced = useReducedMotion();

  const reveal = (delay = 0) =>
    prefersReduced
      ? {}
      : {
          initial: { opacity: 0, y: 20 } as const,
          whileInView: { opacity: 1, y: 0 } as const,
          viewport: { once: true, margin: '-60px' } as const,
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
        };

  return (
    <section className="bg-black px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <motion.div {...reveal()} className="mb-16 text-center">
          <h2 className={`${clashDisplay} text-[clamp(28px,5vw,48px)] font-semibold tracking-tight text-white`}>
            GroupMe, but make it functional.
          </h2>
          <p className="mt-4 text-base text-white/40">
            Your org chat is a wall of text. HIVE puts apps right in the conversation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {/* Before: GroupMe */}
          <motion.div {...reveal(0.05)}>
            <div className="mb-3 text-[11px] font-medium text-white/25 uppercase tracking-[0.1em]">
              Your GroupMe
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="space-y-3">
                <ChatBubble name="Sarah" text="Hey everyone! What should our theme be for the formal?" side="left" />
                <ChatBubble name="Mike" text="Gatsby?" side="right" />
                <ChatBubble name="Priya" text="I vote masquerade" side="left" />
                <ChatBubble name="Jake" text="Wait can we do a poll or something" side="right" />
                <ChatBubble name="Sarah" text="Ok hold on let me make a google form" side="left" />
                <ChatBubble name="Mike" text="Just count the messages lol" side="right" />
                <ChatBubble name="Priya" text="This is chaos" side="left" />
              </div>
            </div>
          </motion.div>

          {/* After: HIVE Space */}
          <motion.div {...reveal(0.1)}>
            <div className="mb-3 text-[11px] font-medium text-[#22C55E]/60 uppercase tracking-[0.1em]">
              Your HIVE Space
            </div>
            <div className="rounded-2xl border border-[#22C55E]/10 bg-[#22C55E]/[0.02] p-5">
              <div className="space-y-3">
                <ChatBubble name="Sarah" text="What should our theme be for the formal?" side="left" />

                {/* Inline poll card */}
                <div className="rounded-xl border border-[#FFD700]/15 bg-[#FFD700]/[0.03] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-sm">🗳️</span>
                    <span className="text-[13px] font-medium text-white/80">Formal Theme Vote</span>
                  </div>
                  <div className="space-y-2">
                    <PollOption label="Gatsby" pct={32} />
                    <PollOption label="Masquerade" pct={48} active />
                    <PollOption label="Casino Night" pct={20} />
                  </div>
                  <div className="mt-3 text-[11px] text-white/25">
                    25 votes · 2h left
                  </div>
                </div>

                <ChatBubble name="Mike" text="Masquerade it is!" side="right" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ChatBubble({ name, text, side }: { name: string; text: string; side: 'left' | 'right' }) {
  return (
    <div className={`flex ${side === 'right' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
        side === 'right'
          ? 'bg-white/[0.06] rounded-br-md'
          : 'bg-white/[0.03] rounded-bl-md'
      }`}>
        <span className="block text-[10px] text-white/25 mb-0.5">{name}</span>
        <span className="text-[12px] text-white/50">{text}</span>
      </div>
    </div>
  );
}

function PollOption({ label, pct, active }: { label: string; pct: number; active?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-white/[0.03] px-3 py-2">
      <div
        className={`absolute inset-y-0 left-0 ${active ? 'bg-[#FFD700]/10' : 'bg-white/[0.03]'}`}
        style={{ width: `${pct}%` }}
      />
      <div className="relative flex items-center justify-between">
        <span className={`text-[12px] ${active ? 'text-[#FFD700]/80 font-medium' : 'text-white/50'}`}>
          {label}
        </span>
        <span className={`text-[11px] ${active ? 'text-[#FFD700]/60' : 'text-white/30'}`}>
          {pct}%
        </span>
      </div>
    </div>
  );
}
