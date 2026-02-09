'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

export function HeroSection() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleJoinUB = useCallback(() => {
    const redirect = searchParams.get('redirect');
    const enterUrl = redirect
      ? `/enter?schoolId=ub-buffalo&domain=buffalo.edu&redirect=${encodeURIComponent(redirect)}`
      : '/enter?schoolId=ub-buffalo&domain=buffalo.edu';
    router.push(enterUrl);
  }, [router, searchParams]);

  return (
    <section className="min-h-[85vh] relative grid grid-cols-1 lg:grid-cols-2 items-center">
      {/* Left: Headline */}
      <div className="px-6 lg:pl-12 pt-32 pb-16 lg:py-0">
        {/* Live badge */}
        <motion.div
          className="flex items-center gap-2 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/50">
            LIVE AT UB
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          className={`${clashDisplay} text-[clamp(56px,12vw,120px)] font-semibold leading-[0.9] tracking-tight text-white mb-8`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Build it.
          <br />
          Share it.
        </motion.h1>

        {/* Subhead */}
        <motion.p
          className="text-base lg:text-lg text-white max-w-md mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Polls, signups, countdowns. Built in seconds. Shared anywhere. No code, no apps.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <button
            onClick={handleJoinUB}
            className="px-6 py-3 bg-[#FFD700] text-black text-sm font-medium rounded-lg hover:bg-[#FFD700]/90 transition-colors flex items-center justify-center gap-2"
          >
            Join UB
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/enter')}
            className="px-6 py-3 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/15 transition-colors"
          >
            Create a space
          </button>
        </motion.div>
      </div>

      {/* Right: Product screenshot/embed (bleeding off edge) */}
      <motion.div
        className="relative px-6 lg:pr-0 pb-16 lg:pb-0 lg:pl-12"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <div className="aspect-[4/3] lg:aspect-auto lg:h-[600px] relative">
          {/* Placeholder for embedded tool or screenshot */}
          <div className="w-full h-full rounded-l-2xl lg:rounded-l-2xl lg:rounded-r-none overflow-hidden bg-zinc-900/50 border border-white/10 flex items-center justify-center">
            <div className="text-center px-8">
              <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl text-[#FFD700]">⚡</span>
              </div>
              <p className="text-sm text-white/50">Live tool embed goes here</p>
              <p className="text-xs text-white/30 mt-2">Real poll with working votes</p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
