'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BarChart3, Calendar, MessageSquare } from 'lucide-react';
import { buildEnterUrl } from './entry-url';

const clashDisplay = "font-[family-name:'Clash_Display',var(--font-clash)]";

const VALUE_PROPS = [
  {
    icon: BarChart3,
    title: 'Polls that live in your chat',
    body: 'No more counting raised hands or making Google Forms. Create a poll in seconds, results appear in your Space stream.',
    color: '#FFD700',
  },
  {
    icon: Calendar,
    title: 'Events with real RSVPs',
    body: 'Members RSVP right in the Space. See who\'s going, send reminders, track attendance. No external links.',
    color: '#EC4899',
  },
  {
    icon: MessageSquare,
    title: 'Everything in one place',
    body: 'Chat, events, polls, signups — your org\'s entire digital life in one Space. No more app-switching.',
    color: '#3B82F6',
  },
] as const;

export function LeaderPitchSection() {
  const searchParams = useSearchParams();
  const enterHref = buildEnterUrl(searchParams.get('redirect'));
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
      <div className="mx-auto max-w-7xl">
        <motion.div {...reveal()} className="mb-16">
          <span className="mb-3 block font-mono text-[11px] uppercase tracking-[0.2em] text-[#FFD700]/70">
            For org leaders
          </span>
          <h2 className={`${clashDisplay} max-w-lg text-[clamp(28px,5vw,48px)] font-semibold tracking-tight text-white`}>
            Run your org on HIVE
          </h2>
          <p className="mt-4 max-w-lg text-base text-white/40">
            You run a 200-person org across 5 different apps. HIVE replaces all of them.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {VALUE_PROPS.map((prop, i) => (
            <motion.div
              key={prop.title}
              {...reveal(i * 0.08)}
              className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:border-white/[0.1]"
            >
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${prop.color}12` }}
              >
                <prop.icon className="h-5 w-5" style={{ color: prop.color }} />
              </div>
              <h3 className="mb-2 text-[16px] font-semibold text-white/90">{prop.title}</h3>
              <p className="text-[14px] leading-relaxed text-white/40">{prop.body}</p>
            </motion.div>
          ))}
        </div>

        <motion.div {...reveal(0.25)} className="mt-12 text-center">
          <Link
            href={enterHref}
            className="inline-flex items-center gap-2 rounded-full bg-[#FFD700] px-7 py-3.5 text-[15px] font-medium text-black transition-opacity hover:opacity-90"
          >
            Claim your Space
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
