'use client';

/**
 * QuickProfileStep - Streamlined name + handle in one step
 *
 * Phase 6: Onboarding Reduction (300s → 120s)
 *
 * Design direction:
 * - Single step for name + handle (25s target)
 * - Auto-generate handle from name (reduce decision fatigue)
 * - Show suggestions as user types name
 * - Single "Continue" button at bottom
 *
 * Layout:
 * ┌────────────────────────────────────────────────────────┐
 * │                                                        │
 * │              What should we call you?                  │
 * │                                                        │
 * │         ┌──────────────────────────────────┐           │
 * │         │  Your name                       │           │
 * │         └──────────────────────────────────┘           │
 * │                                                        │
 * │         ┌──────────────────────────────────┐           │
 * │         │  @handle                         │  ✓        │
 * │         └──────────────────────────────────┘           │
 * │                                                        │
 * │         Suggested: @alex_ub @alexj @alex.buffalo       │
 * │                                                        │
 * │                   [ Continue ]                         │
 * │                                                        │
 * └────────────────────────────────────────────────────────┘
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, Sparkles } from 'lucide-react';
import * as React from 'react';
import { MONOCHROME } from '@hive/tokens';

import { cn } from '@/lib/utils';
import type { HandleStatus, OnboardingData } from '../shared/types';

// ============================================
// Types
// ============================================

export interface QuickProfileStepProps {
  data: OnboardingData;
  handleStatus: HandleStatus;
  handleSuggestions: string[];
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void | Promise<void>;
  onBack: () => void;
  isSubmitting?: boolean;
  className?: string;
}

// ============================================
// Handle Generation
// ============================================

function generateHandleSuggestions(name: string): string[] {
  if (!name || name.length < 2) return [];

  const cleanName = name.toLowerCase().trim();
  const parts = cleanName.split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts[1] || '';
  const initials = parts.map(p => p[0]).join('');

  const suggestions: string[] = [];

  // firstName_ub (campus identity)
  if (firstName.length >= 2) {
    suggestions.push(`${firstName}_ub`);
  }

  // firstName.lastName (professional)
  if (lastName) {
    suggestions.push(`${firstName}.${lastName.slice(0, 1)}`);
    suggestions.push(`${firstName}${lastName.slice(0, 1)}`);
  }

  // firstName + random number
  if (firstName.length >= 2) {
    suggestions.push(`${firstName}${Math.floor(Math.random() * 100)}`);
  }

  // Initials + random
  if (initials.length >= 2) {
    suggestions.push(`${initials}_${Math.floor(Math.random() * 1000)}`);
  }

  return suggestions.slice(0, 3);
}

// ============================================
// Component
// ============================================

export function QuickProfileStep({
  data,
  handleStatus,
  handleSuggestions,
  onUpdate,
  onNext,
  onBack,
  isSubmitting = false,
  className,
}: QuickProfileStepProps) {
  const [isLocalSubmitting, setIsLocalSubmitting] = React.useState(false);
  const [localSuggestions, setLocalSuggestions] = React.useState<string[]>([]);
  const nameInputRef = React.useRef<HTMLInputElement>(null);

  // Focus name input on mount
  React.useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Generate suggestions when name changes
  React.useEffect(() => {
    if (data.name && data.name.length >= 2) {
      const suggestions = generateHandleSuggestions(data.name);
      setLocalSuggestions(suggestions);

      // Auto-fill handle with first suggestion if empty
      if (!data.handle && suggestions.length > 0) {
        onUpdate({ handle: suggestions[0] });
      }
    }
  }, [data.name, data.handle, onUpdate]);

  const canContinue =
    data.name.trim().length >= 2 &&
    data.handle.trim().length >= 3 &&
    handleStatus === 'available';

  const handleSuggestionClick = (handle: string) => {
    onUpdate({ handle });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ name: e.target.value });
  };

  const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip @ prefix if user types it
    const value = e.target.value.replace(/^@/, '').toLowerCase();
    onUpdate({ handle: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (canContinue && !isSubmitting && !isLocalSubmitting) {
      setIsLocalSubmitting(true);
      try {
        await onNext();
      } finally {
        setIsLocalSubmitting(false);
      }
    }
  };

  const showLoading = isSubmitting || isLocalSubmitting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn('flex flex-col items-center', className)}
    >
      {/* Heading */}
      <div className="text-center mb-10">
        <h1 className={cn(MONOCHROME.heading, 'mb-3')}>
          What should we call you?
        </h1>
        <p className={MONOCHROME.subheading}>
          Your name and handle are how others will find you
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        {/* Name Input */}
        <div className="space-y-2">
          <label className="text-sm text-neutral-400 block">Your name</label>
          <input
            ref={nameInputRef}
            type="text"
            value={data.name}
            onChange={handleNameChange}
            placeholder="Alex Johnson"
            className={cn(
              MONOCHROME.inputBase,
              'text-left',
              'border rounded-lg px-4',
              'border-neutral-800',
              'focus:border-white/30'
            )}
            autoComplete="name"
            required
          />
        </div>

        {/* Handle Input */}
        <div className="space-y-2">
          <label className="text-sm text-neutral-400 block">Your handle</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600">
              @
            </span>
            <input
              type="text"
              value={data.handle}
              onChange={handleHandleChange}
              placeholder="alexj"
              className={cn(
                MONOCHROME.inputBase,
                'text-left pl-8',
                'border rounded-lg',
                handleStatus === 'available' && 'border-green-500/50',
                handleStatus === 'taken' && 'border-red-500/50',
                handleStatus === 'invalid' && 'border-red-500/50',
                handleStatus === 'checking' && 'border-neutral-700',
                handleStatus === 'idle' && 'border-neutral-800',
                'focus:border-white/30'
              )}
              autoComplete="username"
              required
            />

            {/* Status indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {handleStatus === 'checking' && (
                <Loader2 className="w-4 h-4 text-neutral-500 animate-spin" />
              )}
              {handleStatus === 'available' && (
                <Check className="w-4 h-4 text-green-500" />
              )}
              {(handleStatus === 'taken' || handleStatus === 'invalid') && (
                <X className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>

          {/* Status message */}
          <AnimatePresence mode="wait">
            {handleStatus === 'taken' && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-red-400"
              >
                This handle is taken. Try one of these:
              </motion.p>
            )}
            {handleStatus === 'invalid' && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-red-400"
              >
                3-20 characters, letters, numbers, . _ - only
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Handle Suggestions */}
        <AnimatePresence>
          {(localSuggestions.length > 0 || handleSuggestions.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 justify-center"
            >
              <span className="text-xs text-neutral-600 w-full text-center flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" />
                Suggestions
              </span>
              {(handleStatus === 'taken' ? handleSuggestions : localSuggestions).map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      'px-3 py-1.5 rounded-full',
                      'bg-white/[0.04] border border-white/[0.08]',
                      'text-sm text-neutral-400',
                      'hover:bg-white/[0.08] hover:text-white',
                      'transition-all duration-150',
                      data.handle === suggestion && 'border-green-500/30 text-white'
                    )}
                  >
                    @{suggestion}
                  </button>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={!canContinue || showLoading}
            className={cn(
              MONOCHROME.buttonPrimary,
              'w-full flex items-center justify-center gap-2',
              (!canContinue || showLoading) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {showLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Setting up...</span>
              </>
            ) : (
              'Continue'
            )}
          </button>
        </div>

        {/* Back link */}
        <button
          type="button"
          onClick={onBack}
          className={cn(MONOCHROME.buttonGhost, 'w-full')}
        >
          Back
        </button>
      </form>
    </motion.div>
  );
}

export default QuickProfileStep;
