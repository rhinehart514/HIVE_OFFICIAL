"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PrivacyContent } from "@/components/legal/privacy-content";
import { TermsContent } from "@/components/legal/terms-content";

type LegalType = "privacy" | "terms";

interface LegalContentModalProps {
  type: LegalType | null;
  onClose: () => void;
}

const MODAL_CONFIG: Record<LegalType, { title: string; subtitle: string }> = {
  privacy: {
    title: "Privacy Policy",
    subtitle: "Effective January 15, 2025",
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Version 2025-01-15",
  },
};

export function LegalContentModal({ type, onClose }: LegalContentModalProps) {
  const isOpen = type !== null;
  const config = type ? MODAL_CONFIG[type] : null;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && config && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 z-50 mx-auto my-auto flex max-h-[90vh] max-w-3xl flex-col rounded-2xl border border-white/10 bg-[#0a0a0a] md:inset-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 md:px-8">
              <div>
                <h2 className="text-xl font-semibold text-white">{config.title}</h2>
                <p className="mt-1 text-sm text-neutral-500">{config.subtitle}</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 md:px-8"
            >
              {type === "privacy" && <PrivacyContent />}
              {type === "terms" && <TermsContent />}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 px-6 py-4 md:px-8">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-500">
                  Questions?{" "}
                  <a
                    href="mailto:team@hivecampus.com"
                    className="text-white hover:underline"
                  >
                    team@hivecampus.com
                  </a>
                </p>
                <button
                  onClick={onClose}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-200"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
