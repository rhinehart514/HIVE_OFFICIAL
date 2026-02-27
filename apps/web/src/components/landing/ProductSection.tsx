'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Calendar, Users, Sparkles, MessageSquare, Bell, BarChart3, Zap, Share2, ListChecks } from 'lucide-react';

const clashDisplay = "font-[family-name:'Clash_Display',var(--font-clash)]";

/* ────────────────────────────────────────────────────── */
/* Platform pillars                                       */
/* ────────────────────────────────────────────────────── */

const pillars = [
  {
    icon: Calendar,
    title: 'Discover',
    body: 'See what\'s happening tonight, this week, across campus. Events ranked by your interests and who\'s going.',
    color: '#EC4899',
  },
  {
    icon: Users,
    title: 'Spaces',
    body: 'Every org, club, and group gets a space. Chat, share, plan events, and build apps — all in one place.',
    color: '#3B82F6',
  },
  {
    icon: Sparkles,
    title: 'Build',
    body: 'Describe what your org needs in plain English. HIVE generates a real app — polls, signups, leaderboards — instantly.',
    color: '#FFD700',
  },
  {
    icon: Bell,
    title: 'Stay in the loop',
    body: 'Follow friends, get notified when your spaces are active. No more checking 5 apps to know what\'s happening.',
    color: '#22C55E',
  },
] as const;

/* ────────────────────────────────────────────────────── */
/* How it works (AI builder — now positioned as feature) */
/* ────────────────────────────────────────────────────── */

const steps = [
  {
    num: '01',
    title: 'Describe what you need',
    body: '"A signup sheet for our spring formal" — that\'s it.',
    icon: MessageSquare,
  },
  {
    num: '02',
    title: 'HIVE builds it instantly',
    body: 'AI generates a fully functional app — styled, interactive, ready to use.',
    icon: Zap,
  },
  {
    num: '03',
    title: 'Deploy to your space',
    body: 'One tap. Live in your org\'s space. Members use it immediately.',
    icon: Share2,
  },
] as const;

/* ────────────────────────────────────────────────────── */
/* What you can build                                     */
/* ────────────────────────────────────────────────────── */

const tools = [
  { icon: BarChart3, name: 'Polls', desc: 'Vote on anything — meeting topics, event themes, food orders.', color: '#FFD700' },
  { icon: ListChecks, name: 'Signups', desc: 'Collect RSVPs, volunteer slots, team rosters.', color: '#22C55E' },
  { icon: Calendar, name: 'Event pages', desc: 'RSVP, location, details, reminders — all in one card.', color: '#EC4899' },
] as const;

/* ────────────────────────────────────────────────────── */
/* Comparison / positioning                               */
/* ────────────────────────────────────────────────────── */

const comparisons = [
  { old: 'GroupMe', problem: 'Chat chaos, buried announcements' },
  { old: 'Google Forms', problem: 'Ugly, disconnected, no one checks' },
  { old: 'Instagram DMs', problem: 'Not built for organizing anything' },
  { old: 'Spreadsheets', problem: 'Confusing, never mobile-friendly' },
] as const;

export function ProductSection() {
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
    <>
      {/* ── Platform pillars ────────────────────────────── */}
      <section id="how-it-works" className="bg-black px-6 py-24 md:py-32">
        <div className="mx-auto max-w-7xl">
          <motion.div {...reveal()} className="mb-16 text-center">
            <span className="mb-3 block font-mono text-[11px] uppercase tracking-[0.2em] text-[#FFD700]/70">
              Everything your campus needs
            </span>
            <h2 className={`${clashDisplay} text-[clamp(28px,5vw,48px)] font-semibold tracking-tight text-white`}>
              One platform. Every org.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                {...reveal(i * 0.08)}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:border-white/[0.1]"
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${pillar.color}12` }}
                >
                  <pillar.icon className="h-5 w-5" style={{ color: pillar.color }} />
                </div>
                <h3 className="mb-2 text-[16px] font-semibold text-white/90">{pillar.title}</h3>
                <p className="text-[14px] leading-relaxed text-white/40">{pillar.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI builder feature ────────────────────────────── */}
      <section className="bg-black px-6 py-24 md:py-32">
        <div className="mx-auto max-w-7xl">
          <motion.div {...reveal()} className="mb-16">
            <span className="mb-3 block font-mono text-[11px] uppercase tracking-[0.2em] text-[#FFD700]/70">
              AI-powered creation
            </span>
            <h2 className={`${clashDisplay} max-w-lg text-[clamp(28px,5vw,48px)] font-semibold tracking-tight text-white`}>
              Describe it. HIVE builds it.
            </h2>
            <p className="mt-4 max-w-lg text-base text-white/40">
              Your org needs tools — polls, signups, leaderboards. Describe what you need and HIVE generates a real app in seconds.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                {...reveal(i * 0.08)}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:border-white/[0.1]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="font-mono text-[13px] text-[#FFD700]/50">{step.num}</span>
                  <step.icon className="h-4 w-4 text-white/30" />
                </div>
                <h3 className="mb-2 text-[16px] font-semibold text-white/90">{step.title}</h3>
                <p className="text-[14px] leading-relaxed text-white/40">{step.body}</p>
              </motion.div>
            ))}
          </div>

          {/* Tool types */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {tools.map((tool, i) => (
              <motion.div
                key={tool.name}
                {...reveal(i * 0.05)}
                className="group cursor-pointer rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/[0.1] hover:-translate-y-px"
              >
                <div
                  className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${tool.color}15` }}
                >
                  <tool.icon className="h-4 w-4" style={{ color: tool.color }} />
                </div>
                <h3 className="mb-1 text-[15px] font-semibold text-white/85">{tool.name}</h3>
                <p className="text-[13px] leading-relaxed text-white/40">{tool.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why not the old way ──────────────────────────── */}
      <section className="bg-black px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <motion.div {...reveal()} className="mb-12 text-center">
            <h2 className={`${clashDisplay} text-[clamp(28px,5vw,48px)] font-semibold tracking-tight text-white`}>
              Stop duct-taping your campus life together.
            </h2>
            <p className="mt-4 text-base text-white/40">
              Every semester, the same broken workflow. HIVE replaces all of it.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {comparisons.map((c, i) => (
              <motion.div
                key={c.old}
                {...reveal(i * 0.06)}
                className="flex items-start gap-4 rounded-xl border border-white/[0.04] bg-white/[0.015] px-5 py-4"
              >
                <span className="mt-0.5 text-[13px] font-medium text-white/25 line-through decoration-white/15">
                  {c.old}
                </span>
                <span className="text-[13px] text-white/40">{c.problem}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
