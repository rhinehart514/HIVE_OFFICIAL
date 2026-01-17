'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, SparklesIcon, ArrowRightIcon, CursorArrowRaysIcon, CommandLineIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const MousePointer2 = CursorArrowRaysIcon;
const Command = CommandLineIcon;

/**
 * Onboarding Overlay for HiveLab IDE
 *
 * Shows when users first create a new tool (blank canvas).
 * Follows the Cursor model: canvas-first, AI as assistant.
 */

interface OnboardingOverlayProps {
  onDismiss: () => void;
  onOpenAI?: () => void;
}

export function OnboardingOverlay({ onDismiss, onOpenAI }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0);

  const handleDismiss = () => {
    // Remember user has seen onboarding
    localStorage.setItem('hivelab_onboarding_dismissed', 'true');
    onDismiss();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleDismiss();
    }
    // Open AI command palette on Cmd/Ctrl+K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      handleDismiss();
      onOpenAI?.();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const steps = [
    {
      icon: <MousePointer2 className="w-6 h-6" />,
      title: 'Drag elements to canvas',
      description: 'Drag any element from the left panel onto your canvas',
      hint: 'Start with a poll, countdown, or any other element',
    },
    {
      icon: <Command className="w-5 h-5" />,
      title: 'Press ⌘K for AI',
      description: 'Describe what you want to build and AI will help',
      hint: 'Try "Create a lunch poll with 5 options"',
    },
    {
      icon: <SparklesIcon className="w-6 h-6" />,
      title: 'Configure & connect',
      description: 'Select elements to edit properties and create data flows',
      hint: 'Connect a poll to a leaderboard for live results',
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-w-md w-full mx-4 bg-[var(--hivelab-panel)] rounded-2xl border border-[var(--hivelab-border)] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 pb-4 border-b border-[var(--hivelab-border)]">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)] transition-colors duration-[var(--workshop-duration)]"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--hivelab-surface-hover)] flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-[var(--hivelab-text-primary)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--hivelab-text-primary)]">Welcome to HiveLab</h2>
                <p className="text-sm text-[var(--hivelab-text-tertiary)]">Build visual tools for your campus</p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="p-6 space-y-4">
            {steps.map((s, i) => (
              <motion.button
                key={i}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-[var(--workshop-duration)] ${
                  step === i
                    ? 'bg-[var(--hivelab-surface-hover)] border-[var(--hivelab-border-emphasis)]'
                    : 'bg-[var(--hivelab-bg)] border-[var(--hivelab-border)] hover:border-[var(--hivelab-border-emphasis)]'
                }`}
                onClick={() => setStep(i)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      step === i
                        ? 'bg-[var(--hivelab-surface)] text-[var(--hivelab-text-primary)]'
                        : 'bg-[var(--hivelab-surface)] text-[var(--hivelab-text-tertiary)]'
                    }`}
                  >
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium ${step === i ? 'text-[var(--hivelab-text-primary)]' : 'text-[var(--hivelab-text-secondary)]'}`}>
                      {s.title}
                    </h3>
                    <p className="text-sm text-[var(--hivelab-text-tertiary)] mt-0.5">{s.description}</p>
                    {step === i && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-xs text-[var(--hivelab-text-tertiary)] mt-2 italic"
                      >
                        💡 {s.hint}
                      </motion.p>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-6 pt-2 flex items-center justify-between">
            <button
              onClick={handleDismiss}
              className="text-sm text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] transition-colors duration-[var(--workshop-duration)]"
            >
              Skip intro
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  handleDismiss();
                  onOpenAI?.();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--life-gold)] text-black font-medium text-sm hover:bg-[var(--life-gold)]/90 transition-colors duration-[var(--workshop-duration)]"
              >
                <span>Try AI</span>
                <kbd className="px-1.5 py-0.5 rounded bg-black/20 text-xs">⌘K</kbd>
              </button>
            </div>
          </div>

          {/* Keyboard hint */}
          <div className="px-6 pb-4">
            <p className="text-xs text-[var(--hivelab-text-tertiary)] text-center">
              Press <kbd className="px-1 py-0.5 rounded bg-[var(--hivelab-surface)] text-[var(--hivelab-text-tertiary)]">Esc</kbd> to close
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default OnboardingOverlay;
