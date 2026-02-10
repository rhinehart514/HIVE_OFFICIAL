'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { buildUbEnterUrl } from './entry-url';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

export function CTASection() {
  const searchParams = useSearchParams();
  const claimHref = buildUbEnterUrl(searchParams.get('redirect'), '/spaces?claim=true');

  return (
    <section className="py-20 md:py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Headline */}
          <h2 className={`${clashDisplay} text-[clamp(32px,6vw,56px)] font-semibold leading-tight text-white mb-6`}>
            Your members are already looking for this space.
          </h2>

          {/* Subhead */}
          <p className="text-lg text-white/50 mb-10 max-w-2xl mx-auto">
            Claim your club, verify leadership, and start running events, chat, and tools before the next meeting.
          </p>

          {/* CTA */}
          <div className="flex justify-center">
            <Link
              href={claimHref}
              className="px-8 py-4 bg-[var(--life-gold,#FFD700)] text-black text-base font-medium rounded-full hover:bg-[var(--life-gold,#FFD700)]/90 transition-colors flex items-center justify-center gap-2"
            >
              Claim Your Club
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <p className="mt-4 text-xs uppercase tracking-[0.12em] text-white/40 font-mono">
            Built for UB leaders · Claim takes minutes
          </p>
        </motion.div>
      </div>
    </section>
  );
}
