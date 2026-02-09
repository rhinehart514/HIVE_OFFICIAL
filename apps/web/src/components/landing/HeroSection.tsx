'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

// Live demo poll data
const DEMO_POLL = {
  question: "Best day for club meeting?",
  options: ["Monday", "Tuesday", "Wednesday", "Thursday"],
};

export function HeroSection() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Live poll state
  const [votes, setVotes] = useState({ Monday: 12, Tuesday: 8, Wednesday: 15, Thursday: 5 });
  const [userVote, setUserVote] = useState<string | null>(null);

  const totalVotes = Object.values(votes).reduce((sum, v) => sum + v, 0);

  const handleVote = (option: string) => {
    if (userVote === option) return; // Already voted

    setVotes((prev) => ({
      ...prev,
      [option]: prev[option as keyof typeof prev] + 1,
      ...(userVote && { [userVote]: prev[userVote as keyof typeof prev] - 1 }),
    }));
    setUserVote(option);
  };

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

      {/* Right: Live poll embed (bleeding off edge) */}
      <motion.div
        className="relative px-6 lg:pr-0 pb-16 lg:pb-0 lg:pl-12"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <div className="aspect-[4/3] lg:aspect-auto lg:h-[600px] relative flex items-center">
          {/* Live poll tool */}
          <div className="w-full max-w-md rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 p-6 shadow-2xl">
            {/* Live indicator */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#FFD700] animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/50">
                LIVE
              </span>
              <span className="text-xs text-white/30 ml-auto">{totalVotes} votes</span>
            </div>

            {/* Poll question */}
            <h3 className="text-lg font-semibold text-white mb-4">{DEMO_POLL.question}</h3>

            {/* Poll options */}
            <div className="space-y-2">
              {DEMO_POLL.options.map((option) => {
                const count = votes[option as keyof typeof votes];
                const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                const isSelected = userVote === option;

                return (
                  <button
                    key={option}
                    onClick={() => handleVote(option)}
                    className="w-full relative rounded-lg p-3 text-left transition-all border border-white/10 hover:border-white/20 group"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(90deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)'
                        : 'rgba(255,255,255,0.02)'
                    }}
                  >
                    {/* Vote bar background */}
                    <div
                      className="absolute inset-0 rounded-lg transition-all"
                      style={{
                        background: isSelected
                          ? `linear-gradient(90deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.05) ${percentage}%, transparent ${percentage}%)`
                          : `linear-gradient(90deg, rgba(255,255,255,0.04) 0%, transparent ${percentage}%)`,
                        width: `${percentage}%`,
                      }}
                    />

                    {/* Content */}
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-[#FFD700]" />
                        ) : (
                          <Circle className="w-4 h-4 text-white/30 group-hover:text-white/40" />
                        )}
                        <span className="text-sm text-white">{option}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <span>{count}</span>
                        {totalVotes > 0 && <span>({Math.round(percentage)}%)</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <p className="text-xs text-white/40">Click any option to vote</p>
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[#FFD700]/60" />
                <span className="text-[9px] uppercase tracking-wider text-[#FFD700]/60 font-mono">
                  HIVE
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
