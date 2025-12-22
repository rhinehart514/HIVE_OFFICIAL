"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Scale } from "lucide-react";
import { PrivacyContent } from "@/components/legal/privacy-content";
import { TermsContent } from "@/components/legal/terms-content";

type LegalType = "privacy" | "terms";

interface LegalContentModalProps {
  type: LegalType | null;
  onClose: () => void;
}

const MODAL_CONFIG: Record<LegalType, { title: string; subtitle: string; icon: typeof Shield }> = {
  privacy: {
    title: "Privacy Policy",
    subtitle: "Effective: January 15, 2025",
    icon: Shield,
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Version 2025-01-15",
    icon: Scale,
  },
};

export function LegalContentModal({ type, onClose }: LegalContentModalProps) {
  const isOpen = type !== null;
  const config = type ? MODAL_CONFIG[type] : null;

  // Scroll lock and escape key handling
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-4 z-50 mx-auto my-auto flex max-h-[90vh] max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl md:inset-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--hive-brand-primary)]/10">
                  <config.icon className="h-5 w-5 text-[var(--hive-brand-primary)]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{config.title}</h2>
                  <p className="text-sm text-neutral-500">{config.subtitle}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {type === "privacy" && <PrivacyContent />}
              {type === "terms" && <TermsContent />}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-500">
                  Questions? Contact{" "}
                  <a
                    href="mailto:team@hivecampus.com"
                    className="text-[var(--hive-brand-primary)] hover:underline"
                  >
                    team@hivecampus.com
                  </a>
                </p>
                <button
                  onClick={onClose}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
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
