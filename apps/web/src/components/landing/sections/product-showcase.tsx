"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ClusterMark, BuildMark, HexDot, ArrowMark } from "../hive-marks";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

// Mock chat messages for the Spaces preview
const mockMessages = [
  { id: 1, user: "Sarah K.", message: "Who's going to the hackathon this weekend?", time: "2m" },
  { id: 2, user: "Mike T.", message: "I'm in! Need a team?", time: "1m" },
  { id: 3, user: "You", message: "Let's do it. Meeting at the library at 6?", time: "now", isYou: true },
];

// Mock HiveLab elements
const mockElements = [
  { id: 1, label: "Poll" },
  { id: 2, label: "Timer" },
  { id: 3, label: "Form" },
];

export function ProductShowcase() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="product"
      className="relative py-32 md:py-40 overflow-hidden"
      style={{ background: "#050505" }}
    >
      {/* Section divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 md:px-12">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="mb-24 md:mb-32"
        >
          <motion.p
            variants={fadeInUp}
            className="font-mono text-sm text-neutral-500 tracking-wide uppercase mb-4"
          >
            // what we built
          </motion.p>
          <motion.h2
            variants={fadeInUp}
            className="font-manifesto text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-[1.1] max-w-3xl"
          >
            Two systems.
            <br />
            <span className="text-neutral-500">Infinite possibilities.</span>
          </motion.h2>
        </motion.div>

        {/* Product 1: Spaces */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-12 md:gap-20 items-start mb-32 md:mb-40"
        >
          {/* Text */}
          <motion.div variants={fadeInUp} className="order-2 md:order-1">
            {/* Section marker - HIVE branded */}
            <div className="flex items-center gap-4 mb-8">
              <div className="relative">
                <ClusterMark size={40} className="text-white/[0.08]" />
                <span className="absolute inset-0 flex items-center justify-center font-mono text-sm text-white/40">01</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
            </div>

            {/* Label + Status */}
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xs tracking-widest text-neutral-400 uppercase">[SPACES]</span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-green-500/80">
                <HexDot size={6} variant="active" className="animate-pulse" />
                LIVE
              </span>
            </div>

            <h3 className="font-manifesto text-2xl md:text-3xl font-semibold text-white mb-4">
              Communities you own
            </h3>

            <p className="text-base text-neutral-400 leading-relaxed mb-8">
              Real-time chat. Boards for different topics. Tools your club actually needs.
              Not another GroupMe. Infrastructure.
            </p>

            <div className="space-y-3 font-mono text-sm">
              <div className="flex items-center gap-3 text-neutral-300">
                <ArrowMark size={14} className="text-neutral-600" />
                400+ orgs pre-loaded
              </div>
              <div className="flex items-center gap-3 text-neutral-300">
                <ArrowMark size={14} className="text-neutral-600" />
                Claim instantly, no approval
              </div>
              <div className="flex items-center gap-3 text-neutral-300">
                <ArrowMark size={14} className="text-neutral-600" />
                Your data, your rules
              </div>
            </div>
          </motion.div>

          {/* Mock UI */}
          <motion.div variants={fadeInUp} className="order-1 md:order-2">
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-4 bg-gold-500/[0.03] blur-3xl rounded-3xl" />

              {/* Mock Space UI */}
              <div className="relative rounded-xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500/80 to-orange-600/80 flex items-center justify-center text-[10px] font-bold text-black tracking-tight">
                    CS
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">CS Club</div>
                    <div className="text-[11px] text-neutral-500 font-mono">127 online</div>
                  </div>
                </div>

                {/* Chat */}
                <div className="p-4 space-y-4 min-h-[200px]">
                  {mockMessages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.isYou ? "justify-end" : ""}`}>
                      {!msg.isYou && (
                        <div className="w-6 h-6 rounded-full bg-neutral-800 flex-shrink-0" />
                      )}
                      <div className={`max-w-[75%] ${msg.isYou ? "text-right" : ""}`}>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className={`text-[11px] font-medium ${msg.isYou ? "text-gold-500/80" : "text-neutral-400"}`}>
                            {msg.user}
                          </span>
                          <span className="text-[10px] text-neutral-600 font-mono">{msg.time}</span>
                        </div>
                        <div className={`text-sm px-3 py-2 rounded-lg ${
                          msg.isYou
                            ? "bg-gold-500/10 text-gold-100/90 border border-gold-500/20"
                            : "bg-white/[0.03] text-neutral-300 border border-white/[0.04]"
                        }`}>
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-sm text-neutral-600">Message #general</span>
                    <span className="ml-auto text-[10px] text-neutral-700 font-mono">↵</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Product 2: HiveLab */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-12 md:gap-20 items-start"
        >
          {/* Mock UI */}
          <motion.div variants={fadeInUp}>
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-4 bg-blue-500/[0.03] blur-3xl rounded-3xl" />

              {/* Mock HiveLab UI */}
              <div className="relative rounded-xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white">Event Dashboard</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wide bg-blue-500/20 text-blue-400 border border-blue-500/20">
                      DRAFT
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-500 font-mono">⌘S</span>
                    <button className="px-3 py-1.5 text-[11px] font-medium text-black bg-white rounded">
                      Deploy
                    </button>
                  </div>
                </div>

                {/* Canvas */}
                <div className="grid grid-cols-4 gap-3 p-4 min-h-[220px]">
                  {/* Element palette */}
                  <div className="col-span-1 space-y-2">
                    <div className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest mb-3">
                      Elements
                    </div>
                    {mockElements.map((el) => (
                      <div
                        key={el.id}
                        className="p-2 rounded bg-white/[0.02] border border-white/[0.06] text-[11px] text-neutral-500 font-mono cursor-grab hover:border-white/[0.12] hover:text-neutral-300 transition-colors"
                      >
                        {el.label}
                      </div>
                    ))}
                  </div>

                  {/* Canvas area */}
                  <div className="col-span-3 rounded border border-dashed border-white/[0.08] p-3 bg-white/[0.01]">
                    {/* Placed element */}
                    <div className="w-full p-4 rounded bg-white/[0.02] border border-gold-500/20">
                      <div className="text-[11px] font-mono text-neutral-400 mb-3">poll_001</div>
                      <div className="text-xs font-medium text-white mb-3">Where should we meet?</div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full border border-neutral-600" />
                          <span className="text-[11px] text-neutral-400 flex-1">Library</span>
                          <div className="w-16 h-1 rounded-full bg-neutral-800 overflow-hidden">
                            <div className="w-[45%] h-full bg-neutral-600" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full border border-gold-500/60 bg-gold-500/20" />
                          <span className="text-[11px] text-neutral-200 flex-1">Student Union</span>
                          <div className="w-16 h-1 rounded-full bg-neutral-800 overflow-hidden">
                            <div className="w-[55%] h-full bg-gold-500/60" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div variants={fadeInUp}>
            {/* Section marker - HIVE branded */}
            <div className="flex items-center gap-4 mb-8">
              <div className="relative">
                <BuildMark size={40} className="text-white/[0.08]" />
                <span className="absolute inset-0 flex items-center justify-center font-mono text-sm text-white/40">02</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
            </div>

            {/* Label + Status */}
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xs tracking-widest text-neutral-400 uppercase">[HIVELAB]</span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-blue-400/80">
                <HexDot size={6} variant="new" />
                NEW
              </span>
            </div>

            <h3 className="font-manifesto text-2xl md:text-3xl font-semibold text-white mb-4">
              Build what you need
            </h3>

            <p className="text-base text-neutral-400 leading-relaxed mb-8">
              Visual builder for campus tools. Polls, signups, dashboards—drag, drop, deploy.
              No code. No waiting for IT.
            </p>

            <div className="space-y-3 font-mono text-sm">
              <div className="flex items-center gap-3 text-neutral-300">
                <ArrowMark size={14} className="text-neutral-600" />
                27 elements ready
              </div>
              <div className="flex items-center gap-3 text-neutral-300">
                <ArrowMark size={14} className="text-neutral-600" />
                AI-assisted generation
              </div>
              <div className="flex items-center gap-3 text-neutral-300">
                <ArrowMark size={14} className="text-neutral-600" />
                Deploy to any Space
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
