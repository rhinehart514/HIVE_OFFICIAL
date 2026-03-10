'use client';

import { motion } from 'framer-motion';

/** Right-panel idle state: example shell cards as inspiration */
export function IdleInspiration() {
  return (
    <motion.div
      key="inspiration"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-start pt-12 lg:pt-16 px-8"
    >
      <p className="text-xs text-white/50 mb-6 font-mono uppercase tracking-wider">
        What people are making
      </p>
      <div className="grid gap-3 w-full max-w-md">
        {/* Mini poll preview */}
        <div className="rounded-2xl border border-white/[0.05] bg-surface p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-2 rounded-full bg-[#FFD700]" />
              <span className="font-mono text-[11px] text-white/30 uppercase tracking-wider">Poll</span>
            </div>
            <span className="text-[11px] text-white/50">247 votes</span>
          </div>
          <p className="text-sm text-white/50 mb-3">Best late-night food near campus?</p>
          <div className="space-y-2">
            <div className="h-7 rounded-lg bg-white/[0.05] relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-[42%] bg-[#FFD700]/[0.05] rounded-lg" />
              <span className="relative z-10 flex items-center justify-between h-full px-3 text-[11px]">
                <span className="text-white/50">Jim&apos;s Steakout</span>
                <span className="text-white/30 font-mono">42%</span>
              </span>
            </div>
            <div className="h-7 rounded-lg bg-white/[0.05] relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-[31%] bg-[#FFD700]/[0.05] rounded-lg" />
              <span className="relative z-10 flex items-center justify-between h-full px-3 text-[11px]">
                <span className="text-white/50">Danny&apos;s</span>
                <span className="text-white/30 font-mono">31%</span>
              </span>
            </div>
          </div>
        </div>
        {/* Mini RSVP + Bracket side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/[0.05] bg-surface p-4">
            <span className="font-mono text-[11px] text-white/30 uppercase tracking-wider">RSVP</span>
            <p className="text-sm text-white/50 mt-2 mb-2">SGA Town Hall</p>
            <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
              <div className="h-full w-[73%] bg-white/30 rounded-full" />
            </div>
            <p className="text-[11px] text-white/50 mt-2">147/200 going</p>
          </div>
          <div className="rounded-2xl border border-white/[0.05] bg-surface p-4">
            <span className="font-mono text-[11px] text-white/30 uppercase tracking-wider">Bracket</span>
            <p className="text-sm text-white/50 mt-2 mb-2">Best CSE prof</p>
            <div className="flex rounded-lg overflow-hidden border border-white/[0.05]">
              <div className="flex-1 py-2 text-center text-[11px] bg-white/[0.05] text-white/50">Hertz</div>
              <div className="flex-1 py-2 text-center text-[11px] bg-white/[0.03] text-white/50">Alphonce</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
