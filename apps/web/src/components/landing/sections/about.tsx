"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export function AboutSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="about"
      className="relative py-32 md:py-40 overflow-hidden"
      style={{ background: "#050505" }}
    >
      {/* Section divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Accent line - asymmetric */}
      <div className="absolute top-0 right-[25%] w-px h-[30vh] bg-gradient-to-b from-white/10 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24">
          {/* Left - The Problem */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeInUp}
          >
            <p className="font-mono text-sm text-neutral-500 tracking-wide uppercase mb-6">
              // the problem
            </p>

            <h3 className="font-manifesto text-2xl md:text-3xl font-semibold text-white mb-6 leading-tight">
              The old campus infrastructure is dying.
            </h3>

            <div className="space-y-4 text-neutral-400 leading-relaxed">
              <p>
                GroupMe for everything. CampusLabs for nothing useful.
                A career center stuck in 2010.
              </p>
              <p>
                Every tool was built for administrators, not students.
                Every platform treats you like a customer, not an owner.
              </p>
              <p className="text-neutral-300">
                You sense it. The anxiety of paths that don&apos;t lead anywhere.
                The curriculum that&apos;s already outdated. The credential system that&apos;s crumbling.
              </p>
            </div>
          </motion.div>

          {/* Right - The Answer */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{
              ...fadeInUp,
              visible: {
                ...fadeInUp.visible,
                transition: { ...fadeInUp.visible.transition, delay: 0.15 },
              },
            }}
          >
            <p className="font-mono text-sm text-gold-500/70 tracking-wide uppercase mb-6">
              // so we built something else
            </p>

            <h3 className="font-manifesto text-2xl md:text-3xl font-semibold text-white mb-6 leading-tight">
              Infrastructure you own.
            </h3>

            <div className="space-y-4 text-neutral-400 leading-relaxed">
              <p>
                HIVE is campus infrastructure built by students.
                Not a social network. Not an engagement platform. Infrastructure.
              </p>
              <p>
                Your communities. Your tools. Your data.
                No ads. No dark patterns. No permission needed.
              </p>
              <p className="text-neutral-300">
                We&apos;re starting at UB—32,000 students, 400+ orgs.
                Proving density works before expanding anywhere else.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Values strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 md:mt-28 pt-12 border-t border-white/[0.06]"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { label: "Student-owned", desc: "You own your data" },
              { label: "Zero ads", desc: "Forever" },
              { label: "Open roadmap", desc: "You decide what's next" },
              { label: "Campus-first", desc: "Density over scale" },
            ].map((value) => (
              <div key={value.label}>
                <div className="text-sm font-medium text-white mb-1">{value.label}</div>
                <div className="text-xs text-neutral-500">{value.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
