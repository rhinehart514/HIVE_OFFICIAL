'use client';

import { motion } from 'framer-motion';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

interface FeatureCardProps {
  number: string;
  title: string;
  description: string;
  className?: string;
}

function FeatureCard({ number, title, description, className }: FeatureCardProps) {
  return (
    <motion.div
      className={`p-8 rounded-2xl bg-zinc-900/50 border border-white/10 ${className || ''}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className={`${clashDisplay} text-5xl font-bold text-[#FFD700]`}>{number}</span>
      </div>
      <h3 className={`${clashDisplay} text-3xl font-semibold text-white mb-3`}>{title}</h3>
      <p className="text-base text-white leading-relaxed">{description}</p>
    </motion.div>
  );
}

export function ProductSection() {
  return (
    <section className="py-16 md:py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section label */}
        <div className="flex items-center gap-2 mb-12">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/50">
            HOW IT WORKS
          </span>
        </div>

        {/* Uneven grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Discover: Biggest card (spans 2 cols on lg) */}
          <FeatureCard
            number="01"
            title="Discover"
            description="See every space on campus. Clubs, Greek life, dorms, study groups. Real names, real people. No bots, no noise."
            className="lg:col-span-2 lg:row-span-1"
          />

          {/* Create: Medium card */}
          <FeatureCard
            number="02"
            title="Create"
            description="Polls. Signups. Countdowns. RSVPs. Built in 30 seconds. Share anywhere. No code."
            className="lg:col-span-1"
          />

          {/* Spaces: Wide horizontal strip (spans all 3 cols) */}
          <FeatureCard
            number="03"
            title="Spaces"
            description="Chat with inline tools. Every space gets boards, events, tools, and members. Run it like a community, not a group chat."
            className="lg:col-span-3"
          />
        </div>
      </div>
    </section>
  );
}
