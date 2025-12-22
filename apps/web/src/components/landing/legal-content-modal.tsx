"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { X, Shield, Scale, Clock } from "lucide-react";
import { PrivacyContent } from "@/components/legal/privacy-content";
import { TermsContent } from "@/components/legal/terms-content";

type LegalType = "privacy" | "terms";

interface LegalContentModalProps {
  type: LegalType | null;
  onClose: () => void;
}

const MODAL_CONFIG: Record<LegalType, {
  title: string;
  subtitle: string;
  icon: typeof Shield;
  readTime: string;
  gradient: string;
}> = {
  privacy: {
    title: "Privacy Policy",
    subtitle: "Effective January 15, 2025",
    icon: Shield,
    readTime: "3 min read",
    gradient: "from-emerald-500/10 via-transparent to-transparent",
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Version 2025-01-15",
    icon: Scale,
    readTime: "8 min read",
    gradient: "from-blue-500/10 via-transparent to-transparent",
  },
};

// Spring config for premium feel
const springConfig = { stiffness: 300, damping: 30, mass: 1 };

export function LegalContentModal({ type, onClose }: LegalContentModalProps) {
  const isOpen = type !== null;
  const config = type ? MODAL_CONFIG[type] : null;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track scroll progress
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const progress = scrollTop / (scrollHeight - clientHeight);
      setScrollProgress(Math.min(1, Math.max(0, progress)));
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  // Scroll lock and escape key handling
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      setScrollProgress(0);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && config && (
        <>
          {/* Enhanced Backdrop with vignette */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50"
            onClick={onClose}
          >
            {/* Deep blur layer */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            {/* Vignette overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)"
              }}
            />
          </motion.div>

          {/* Scroll Progress Bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: scrollProgress }}
            className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-[var(--hive-brand-primary)] to-[var(--hive-brand-primary)]/50"
            style={{ transformOrigin: "left" }}
          />

          {/* Floating Close Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.1, type: "spring", ...springConfig }}
            onClick={onClose}
            className="fixed right-6 top-6 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white/60 backdrop-blur-md transition-all hover:border-white/20 hover:bg-black hover:text-white md:right-10 md:top-10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </motion.button>

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", ...springConfig }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 pointer-events-none"
          >
            <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a] shadow-2xl pointer-events-auto">

              {/* Decorative gradient glow */}
              <div className={`absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-[600px] bg-gradient-to-b ${config.gradient} blur-3xl opacity-50 pointer-events-none`} />

              {/* Header - Editorial style */}
              <div className="relative shrink-0 px-8 pt-10 pb-6 md:px-12 md:pt-14">
                {/* Icon with glow */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6 inline-flex"
                >
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-[var(--hive-brand-primary)]/20 blur-xl" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--hive-brand-primary)]/20 bg-[var(--hive-brand-primary)]/10">
                      <config.icon className="h-7 w-7 text-[var(--hive-brand-primary)]" />
                    </div>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="font-display text-3xl font-semibold tracking-tight text-white md:text-4xl"
                >
                  {config.title}
                </motion.h2>

                {/* Meta info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-3 flex items-center gap-4 text-sm text-neutral-500"
                >
                  <span>{config.subtitle}</span>
                  <span className="h-1 w-1 rounded-full bg-neutral-600" />
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {config.readTime}
                  </span>
                </motion.div>

                {/* Fade edge */}
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
              </div>

              {/* Scrollable Content */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-8 py-6 md:px-12"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(255,255,255,0.1) transparent",
                }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  {type === "privacy" && <PrivacyContent />}
                  {type === "terms" && <TermsContent />}
                </motion.div>
              </div>

              {/* Footer - Minimal */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="relative shrink-0 border-t border-white/[0.06] bg-gradient-to-t from-black/50 to-transparent px-8 py-5 md:px-12"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-600">
                    Questions?{" "}
                    <a
                      href="mailto:team@hivecampus.com"
                      className="text-neutral-400 underline decoration-neutral-600 underline-offset-4 transition-colors hover:text-white hover:decoration-neutral-400"
                    >
                      team@hivecampus.com
                    </a>
                  </p>
                  <button
                    onClick={onClose}
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-all hover:bg-neutral-200 active:scale-[0.98]"
                  >
                    Got it
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
