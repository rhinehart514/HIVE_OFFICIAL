"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAnalytics } from "@hive/hooks";
import { HiveLogo, EASE_PREMIUM } from "@hive/ui";

/**
 * Leader Landing Page - January Launch Focus
 *
 * Purpose: Convert org leaders to claim their pre-seeded spaces
 *
 * Messaging:
 * - "Your org is waiting" (FOMO)
 * - "400+ UB orgs pre-loaded" (proof)
 * - "Claim it before someone else" (urgency)
 *
 * MONOCHROME DISCIPLINE: Same as main landing
 */

// Pre-seeded org examples to show variety
const ORG_EXAMPLES = [
  { name: "Computer Science Association", members: "400+", category: "Academic" },
  { name: "UB Robotics Club", members: "120+", category: "Engineering" },
  { name: "Pre-Med Society", members: "350+", category: "Pre-Professional" },
  { name: "Photography Club", members: "85+", category: "Arts" },
  { name: "Esports Club", members: "200+", category: "Gaming" },
  { name: "Debate Team", members: "60+", category: "Competition" },
];

function OrgCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ORG_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const org = ORG_EXAMPLES[currentIndex];

  return (
    <div className="relative h-[100px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: EASE_PREMIUM }}
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-gold-500" />
            <span className="text-label-sm font-mono text-gold-500/70 uppercase tracking-wider">
              Unclaimed
            </span>
          </div>
          <p className="text-2xl md:text-3xl font-semibold text-white text-center">
            {org.name}
          </p>
          <p className="text-sm text-white/50 mt-1">
            {org.members} potential members · {org.category}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function LeaderBenefits() {
  const benefits = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
      ),
      title: "Instant Access",
      desc: "Start setting up immediately while we verify",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
        </svg>
      ),
      title: "Build Tools",
      desc: "Create custom tools for your community",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      title: "Founding Leader",
      desc: "Get the permanent gold badge",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
      {benefits.map((benefit, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 + i * 0.1, duration: 0.5, ease: EASE_PREMIUM }}
          className="relative p-4 rounded-lg border border-white/[0.06] bg-white/[0.06]"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/50">
              {benefit.icon}
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">{benefit.title}</h3>
              <p className="text-xs text-white/50 mt-0.5">{benefit.desc}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function Stats() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="flex items-center justify-center gap-8 mt-10 text-center"
    >
      <div>
        <div className="text-3xl font-semibold text-white">400+</div>
        <div className="text-xs text-white/50 mt-1">Orgs Pre-Loaded</div>
      </div>
      <div className="w-px h-10 bg-white/[0.06]" />
      <div>
        <div className="text-3xl font-semibold text-gold-500">47</div>
        <div className="text-xs text-white/50 mt-1">Founding Spots</div>
      </div>
      <div className="w-px h-10 bg-white/[0.06]" />
      <div>
        <div className="text-3xl font-semibold text-white">&lt;24h</div>
        <div className="text-xs text-white/50 mt-1">Verification</div>
      </div>
    </motion.div>
  );
}

export default function LeadersPage() {
  const router = useRouter();
  const { track } = useAnalytics();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClaimClick = () => {
    track({
      name: "leader_cta_clicked",
      properties: { source: "leaders_landing", cta: "claim_your_org" },
    });
    router.push("/spaces/claim");
  };

  return (
    <div className="min-h-screen antialiased" style={{ background: "#050505" }}>
      {/* Subtle radial gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,215,0,0.03) 0%, transparent 60%)",
        }}
      />

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <HiveLogo className="w-8 h-8 text-gold-500" />
              <span className="text-lg font-semibold text-white">HIVE</span>
            </Link>
            <Link
              href="/enter"
              className="text-sm text-white/50 hover:text-white/50 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-24 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.5, ease: EASE_PREMIUM }}
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full border border-gold-500/20 bg-gold-500/[0.03]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
            <span className="text-label-sm font-medium text-gold-500/80 tracking-wide uppercase">
              For Club Leaders
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7, ease: EASE_PREMIUM }}
            className="text-[clamp(2rem,5vw,3.5rem)] font-semibold text-white leading-[1.1] tracking-[-0.02em] mb-4"
          >
            Your org is already here.
            <br />
            <span className="text-white/50">Claim it.</span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.35, duration: 0.6, ease: EASE_PREMIUM }}
            className="text-base md:text-lg text-white/50 max-w-xl mx-auto mb-8"
          >
            We pre-loaded{" "}
            <span className="text-white/50">every registered UB organization</span>.
            Find yours, claim leadership, and start building your community.
          </motion.p>

          {/* Org carousel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <OrgCarousel />
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.55, duration: 0.5, ease: EASE_PREMIUM }}
            className="mt-8"
          >
            <button
              onClick={handleClaimClick}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[var(--life-gold)] text-black font-semibold rounded-full transition-all duration-300 hover:bg-[var(--life-gold-hover)] hover:shadow-[0_0_60px_var(--life-glow)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-void)]"
            >
              <span className="text-body">Find Your Organization</span>
              <svg
                className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
            <p className="mt-4 text-label-sm font-mono text-white/50">
              You&apos;ll get access immediately while we verify · @buffalo.edu required
            </p>
          </motion.div>

          {/* Stats */}
          <Stats />

          {/* Benefits */}
          <LeaderBenefits />

          {/* How it works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.9, duration: 0.5, ease: EASE_PREMIUM }}
            className="mt-16"
          >
            <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-6">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {[
                {
                  step: "1",
                  title: "Search",
                  desc: "Find your organization in our pre-seeded database",
                },
                {
                  step: "2",
                  title: "Claim",
                  desc: "Tell us your role and get instant provisional access",
                },
                {
                  step: "3",
                  title: "Build",
                  desc: "Set up your space while we verify your leadership",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-sm font-medium text-white/50">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white/50">{item.title}</h3>
                    <p className="text-xs text-white/50 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Founding Class CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.0, duration: 0.5, ease: EASE_PREMIUM }}
            className="mt-16 p-6 rounded-lg border border-gold-500/10 bg-gold-500/[0.02]"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-gold-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </span>
              <span className="text-sm font-medium text-gold-500/90">Founding Leader Class of 2026</span>
            </div>
            <p className="text-xs text-white/50 max-w-md mx-auto">
              The first 50 leaders to fully activate their spaces earn the permanent{" "}
              <span className="text-gold-500/70">Founding Leader</span> badge.{" "}
              <span className="text-white/50">47 spots remaining.</span>
            </p>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : {}}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="mt-16 pt-8 border-t border-white/[0.06]"
          >
            <div className="flex items-center justify-center gap-6 text-label-sm text-white/50">
              <Link href="/" className="hover:text-white/50 transition-colors">
                Main Site
              </Link>
              <span>·</span>
              <Link href="/legal/privacy" className="hover:text-white/50 transition-colors">
                Privacy
              </Link>
              <span>·</span>
              <Link href="/legal/terms" className="hover:text-white/50 transition-colors">
                Terms
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
