"use client";

/**
 * Cognitive-First Landing Page
 *
 * Follows the cognitive sequence:
 * 1. Orient - What is this?
 * 2. Interest - Why should I care?
 * 3. Understand - Show me how it works
 * 4. Trust - Prove it works
 * 5. Act - Let me in
 *
 * Design: Monochrome discipline with gold accents for CTAs only.
 * Layout: Single-column flow with clear sections.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  SPACE_FRAGMENTS,
  TOOL_FRAGMENTS,
} from "./content-library";

// Premium easing
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_PREMIUM },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// ============================================
// HERO SECTION - Orient + Interest + Act
// ============================================

interface HeroEmailFormProps {
  onSubmit: (email: string) => void;
  isSubmitting: boolean;
}

function HeroEmailForm({ onSubmit, isSubmitting }: HeroEmailFormProps) {
  const [email, setEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const isValidEmail = email.includes("@") && email.includes(".edu");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidEmail && !isSubmitting) {
      onSubmit(email);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div
        className={`
          relative overflow-hidden rounded-2xl
          transition-all duration-300
          ${
            isFocused
              ? "bg-white/[0.08] border-white/[0.2] shadow-[0_0_60px_rgba(255,255,255,0.08)]"
              : "bg-white/[0.04] border-white/[0.1]"
          }
          border
        `}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="your.email@buffalo.edu"
          autoComplete="email"
          disabled={isSubmitting}
          className="
            w-full px-6 py-4
            bg-transparent
            text-[16px] text-white/90
            placeholder:text-white/40
            outline-none
            font-medium
            pr-28
          "
        />

        {/* Submit button - always visible, enabled when valid */}
        <motion.button
          type="submit"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          disabled={!isValidEmail || isSubmitting}
          className={`
            absolute right-2 top-1/2 -translate-y-1/2
            px-4 py-2 rounded-xl
            text-[14px] font-semibold
            transition-all duration-200
            ${isValidEmail
              ? "bg-white text-black hover:bg-white/90 cursor-pointer"
              : "bg-white/20 text-white/40 cursor-not-allowed"}
          `}
        >
          {isSubmitting ? "..." : "Enter →"}
        </motion.button>
      </div>

      {/* Social proof line */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-4 text-[13px] text-white/40"
      >
        <span className="text-[#FFD700]/70 font-medium">847</span> UB students already in · Campus-only
      </motion.p>
    </form>
  );
}

function HeroSection({ onEmailSubmit, isSubmitting }: { onEmailSubmit: (email: string) => void; isSubmitting: boolean }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center px-6 py-20">
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(255,255,255,0.02) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.5, ease: EASE_PREMIUM }}
          className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full border border-white/[0.08] bg-white/[0.02]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse" />
          <span className="text-[11px] font-medium text-white/60 tracking-wide uppercase">
            Now at UB
          </span>
        </motion.div>

        {/* Headline - ORIENT */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.7, ease: EASE_PREMIUM }}
          className="text-[clamp(2.5rem,7vw,4.5rem)] font-semibold text-white leading-[1.05] tracking-[-0.03em] mb-6"
        >
          Your campus, one app.
        </motion.h1>

        {/* Subhead - INTEREST */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.35, duration: 0.6, ease: EASE_PREMIUM }}
          className="text-[18px] md:text-[20px] text-white/50 leading-relaxed max-w-2xl mx-auto mb-10"
        >
          Every club. Every event. Every tool.{" "}
          <span className="text-white/70">Built by students, for students.</span>
        </motion.p>

        {/* Three Pillars - Quick mental model */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.6, ease: EASE_PREMIUM }}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mb-12"
        >
          <PillarItem icon="⬡" label="Spaces" description="Your communities" />
          <PillarItem icon="◉" label="Chat" description="Real-time talk" />
          <PillarItem icon="◈" label="Tools" description="Built by you" />
        </motion.div>

        {/* Email form - ACT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.65, duration: 0.5, ease: EASE_PREMIUM }}
          className="flex justify-center"
        >
          <HeroEmailForm onSubmit={onEmailSubmit} isSubmitting={isSubmitting} />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 0.3 : 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[11px] text-white/30 uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}

function PillarItem({ icon, label, description }: { icon: string; label: string; description: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[16px] text-white/50">
        {icon}
      </div>
      <div className="text-left">
        <div className="text-[14px] font-medium text-white/80">{label}</div>
        <div className="text-[12px] text-white/40">{description}</div>
      </div>
    </div>
  );
}

// ============================================
// PRODUCT PREVIEW SECTION - Understand
// ============================================

function ProductPreviewSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section
      ref={ref}
      className="relative py-24 md:py-32 px-6 border-t border-white/[0.04]"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section label */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <span className="text-[11px] font-mono text-white/30 uppercase tracking-widest">
            How it works
          </span>
          <h2 className="text-[28px] md:text-[36px] font-semibold text-white mt-4 tracking-[-0.02em]">
            One place for everything
          </h2>
        </motion.div>

        {/* Product mockup */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="relative rounded-2xl border border-white/[0.08] bg-[#0A0A0A] overflow-hidden shadow-2xl"
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-4 py-1 rounded-md bg-white/[0.03] text-[11px] text-white/30 font-mono">
                hive.ub.edu
              </div>
            </div>
          </div>

          {/* App UI mockup */}
          <div className="grid md:grid-cols-[240px_1fr_280px] min-h-[400px]">
            {/* Sidebar */}
            <div className="hidden md:block border-r border-white/[0.06] p-4">
              <div className="space-y-1">
                <SidebarItem icon="⬡" label="Spaces" active />
                <SidebarItem icon="◉" label="Feed" />
                <SidebarItem icon="◈" label="Tools" />
                <SidebarItem icon="◯" label="Calendar" />
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.04]">
                <div className="text-[10px] text-white/30 uppercase tracking-widest mb-3">My Spaces</div>
                <div className="space-y-1">
                  <SpaceMiniItem name="CS Club" active />
                  <SpaceMiniItem name="Design Collective" />
                  <SpaceMiniItem name="Late Night Philosophy" hot />
                </div>
              </div>
            </div>

            {/* Main chat area */}
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-[12px] font-bold text-white/60">
                  CS
                </div>
                <div>
                  <div className="text-[14px] font-medium text-white">CS Club</div>
                  <div className="text-[11px] text-white/40 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
                    <span className="text-[#FFD700]/70">127 active</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <ChatBubble user="Maya" message="Who's going to the hackathon this weekend?" time="2m" />
                <ChatBubble user="Jordan" message="I'm in! Need a team?" time="1m" />
                <ChatBubble user="You" message="Let's do it. Meeting at the library?" time="now" isYou />
              </div>

              {/* Input */}
              <div className="mt-6 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[13px] text-white/30">Message CS Club...</span>
              </div>
            </div>

            {/* Sidebar - Tools */}
            <div className="hidden md:block border-l border-white/[0.06] p-4">
              <div className="text-[10px] text-white/30 uppercase tracking-widest mb-4">Space Tools</div>
              <div className="space-y-3">
                <ToolMiniItem name="Grade Calculator" stat="89.3%" />
                <ToolMiniItem name="Study Room Finder" stat="3 open" />
                <ToolMiniItem name="Event RSVP" stat="14 going" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Callout labels */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6 mt-8"
        >
          <motion.div variants={fadeInUp} className="text-center md:text-left">
            <div className="text-[13px] font-medium text-white/70 mb-1">Navigation</div>
            <div className="text-[12px] text-white/40">Switch between Spaces, Feed, Tools, and Calendar</div>
          </motion.div>
          <motion.div variants={fadeInUp} className="text-center">
            <div className="text-[13px] font-medium text-white/70 mb-1">Real-time Chat</div>
            <div className="text-[12px] text-white/40">Talk with your communities instantly</div>
          </motion.div>
          <motion.div variants={fadeInUp} className="text-center md:text-right">
            <div className="text-[13px] font-medium text-white/70 mb-1">Space Tools</div>
            <div className="text-[12px] text-white/40">Custom tools built by leaders</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function SidebarItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${active ? "bg-white/[0.06]" : ""}`}>
      <span className={`text-[14px] ${active ? "text-white/70" : "text-white/40"}`}>{icon}</span>
      <span className={`text-[13px] ${active ? "text-white/80" : "text-white/50"}`}>{label}</span>
    </div>
  );
}

function SpaceMiniItem({ name, active, hot }: { name: string; active?: boolean; hot?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${active ? "bg-white/[0.06]" : "hover:bg-white/[0.02]"}`}>
      <div className="w-6 h-6 rounded bg-white/[0.06] flex items-center justify-center text-[9px] font-bold text-white/50">
        {name.split(" ").map(w => w[0]).join("").slice(0, 2)}
      </div>
      <span className={`text-[12px] flex-1 ${active ? "text-white/80" : "text-white/50"}`}>{name}</span>
      {hot && <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />}
    </div>
  );
}

function ChatBubble({ user, message, time, isYou }: { user: string; message: string; time: string; isYou?: boolean }) {
  return (
    <div className={`flex gap-3 ${isYou ? "justify-end" : ""}`}>
      {!isYou && (
        <div className="w-7 h-7 rounded-full bg-white/[0.06] flex-shrink-0 flex items-center justify-center text-[10px] text-white/50">
          {user[0]}
        </div>
      )}
      <div className={`max-w-[70%] ${isYou ? "text-right" : ""}`}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className={`text-[11px] ${isYou ? "text-white/60" : "text-white/40"}`}>{user}</span>
          <span className="text-[10px] text-white/25 font-mono">{time}</span>
        </div>
        <div className={`text-[13px] px-3 py-2 rounded-xl inline-block ${
          isYou
            ? "bg-white/[0.08] text-white/80"
            : "bg-white/[0.03] text-white/60"
        }`}>
          {message}
        </div>
      </div>
    </div>
  );
}

function ToolMiniItem({ name, stat }: { name: string; stat: string }) {
  return (
    <div className="px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-white/60">{name}</span>
        <span className="text-[10px] font-mono text-white/40">{stat}</span>
      </div>
    </div>
  );
}

// ============================================
// SPACES SECTION - Trust (Social Proof)
// ============================================

function SpacesSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  const spaces = SPACE_FRAGMENTS.slice(0, 6);

  return (
    <section
      ref={ref}
      className="relative py-24 md:py-32 px-6 border-t border-white/[0.04]"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <span className="text-[11px] font-mono text-white/30 uppercase tracking-widest">
            400+ spaces live
          </span>
          <h2 className="text-[28px] md:text-[36px] font-semibold text-white mt-4 tracking-[-0.02em]">
            Find your people
          </h2>
          <p className="text-[16px] text-white/40 mt-3 max-w-lg mx-auto">
            Every club, org, and interest group at UB already has a Space waiting.
          </p>
        </motion.div>

        {/* Spaces grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {spaces.map((space, i) => (
            <motion.div
              key={space.id}
              variants={fadeInUp}
              className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center relative">
                  <span className="text-[12px] font-semibold text-white/50 uppercase">
                    {space.name.split(" ").slice(0, 2).map(w => w[0]).join("")}
                  </span>
                  {space.hot && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FFD700] border-2 border-[#0A0A0A]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-white/80 truncate">
                    {space.name}
                  </div>
                  <div className={`text-[12px] mt-0.5 ${space.hot ? "text-[#FFD700]/70" : "text-white/40"}`}>
                    {space.activity}
                  </div>
                  {space.recentAction && (
                    <div className="text-[11px] text-white/30 mt-1.5 truncate">
                      {space.recentAction}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* More indicator */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mt-8"
        >
          <span className="text-[13px] text-white/30">
            + 394 more spaces to discover
          </span>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// TOOLS SECTION - Differentiate
// ============================================

function ToolsSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  const tools = TOOL_FRAGMENTS.slice(0, 4);

  return (
    <section
      ref={ref}
      className="relative py-24 md:py-32 px-6 border-t border-white/[0.04]"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <span className="text-[11px] font-mono text-white/30 uppercase tracking-widest">
            HiveLab
          </span>
          <h2 className="text-[28px] md:text-[36px] font-semibold text-white mt-4 tracking-[-0.02em]">
            Build your own tools
          </h2>
          <p className="text-[16px] text-white/40 mt-3 max-w-lg mx-auto">
            Space leaders can create custom tools and deploy them to their communities.
          </p>
        </motion.div>

        {/* Tools showcase */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-4"
        >
          {tools.map((tool) => (
            <motion.div
              key={tool.id}
              variants={fadeInUp}
              className="relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.12] transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                  tool
                </span>
                {tool.stat && (
                  <span className="text-[14px] font-mono text-white/60">
                    {tool.stat}
                  </span>
                )}
              </div>
              <div className="text-[16px] font-medium text-white/80 mb-1">
                {tool.name}
              </div>
              <div className="text-[13px] text-white/40">
                {tool.hook}
              </div>
              {tool.uses && (
                <div className="mt-4 pt-3 border-t border-white/[0.04]">
                  <span className="text-[11px] text-[#FFD700]/60 font-mono">
                    {tool.uses}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// FOOTER CTA - Final Act
// ============================================

function FooterCTA({ onEmailSubmit, isSubmitting }: { onEmailSubmit: (email: string) => void; isSubmitting: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section
      ref={ref}
      className="relative py-24 md:py-32 px-6 border-t border-white/[0.04]"
    >
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={fadeInUp}
        className="max-w-2xl mx-auto text-center"
      >
        <h2 className="text-[28px] md:text-[36px] font-semibold text-white tracking-[-0.02em] mb-4">
          Find your people.<br />
          Build your tools.<br />
          Own your campus.
        </h2>
        <p className="text-[16px] text-white/40 mb-10">
          Join the students already building their communities on HIVE.
        </p>

        <div className="flex justify-center">
          <HeroEmailForm onSubmit={onEmailSubmit} isSubmitting={isSubmitting} />
        </div>
      </motion.div>

      {/* Footer info */}
      <div className="max-w-2xl mx-auto mt-20 pt-8 border-t border-white/[0.04]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 32 32"
              fill="none"
              className="text-white/30"
            >
              <path
                d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M16 10L22 13.5V20.5L16 24L10 20.5V13.5L16 10Z"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            </svg>
            <span className="text-[13px] text-white/30">HIVE</span>
          </div>
          <div className="text-[11px] text-white/20">
            Built by students at UB
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function WindowLanding() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSubmit = useCallback(
    async (email: string) => {
      setIsSubmitting(true);

      // Store email for auth flow
      if (typeof window !== "undefined") {
        sessionStorage.setItem("pendingEmail", email);
      }

      // Go to auth
      setTimeout(() => {
        router.push("/auth/login");
      }, 300);
    },
    [router]
  );

  return (
    <div
      className="relative min-h-screen w-full"
      style={{ background: "#030303" }}
    >
      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Sections */}
      <HeroSection onEmailSubmit={handleEmailSubmit} isSubmitting={isSubmitting} />
      <ProductPreviewSection />
      <SpacesSection />
      <ToolsSection />
      <FooterCTA onEmailSubmit={handleEmailSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}

export default WindowLanding;
