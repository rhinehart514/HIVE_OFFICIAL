'use client';

/**
 * HandleScene - "Claim your territory."
 *
 * Act II, Scene 3: Handle Selection
 * Gold moment - handle available shows gold checkmark and ring.
 *
 * Headline: "Claim your territory."
 * Manifesto: "No one else will ever have this."
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button, type HandleStatus } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import { ManifestoLine } from '../primitives/ManifestoLine';
import { GoldPulse } from '../primitives/GoldFlash';
import {
  sceneMorphVariants,
  sceneChildVariants,
  headlineVariants,
  subtextVariants,
  inputContainerVariants,
  validationSuccessVariants,
  validationErrorVariants,
  errorMessageVariants,
} from '../motion/scene-transitions';
import { DURATION, EASE_PREMIUM, GOLD, SPRING_SNAPPY } from '../motion/entry-motion';

interface HandleSceneProps {
  handle: string;
  onHandleChange: (handle: string) => void;
  onSuggestionSelect: (handle: string) => void;
  onContinue: () => void;
  handleStatus: HandleStatus;
  suggestions: string[];
  error?: string;
}

export function HandleScene({
  handle,
  onHandleChange,
  onSuggestionSelect,
  onContinue,
  handleStatus,
  suggestions,
  error,
}: HandleSceneProps) {
  const shouldReduceMotion = useReducedMotion();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  // Focus input on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && handleStatus === 'available') {
      onContinue();
    }
  };

  const isAvailable = handleStatus === 'available';
  const isTaken = handleStatus === 'taken';
  const isChecking = handleStatus === 'checking';
  const isInvalid = handleStatus === 'invalid';

  const canContinue = isAvailable && handle.length >= 3;

  // Status indicator
  const StatusIndicator = () => {
    if (isChecking) {
      return (
        <motion.div
          className="w-5 h-5 rounded-full border-2 border-white/20"
          style={{ borderTopColor: GOLD.primary }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      );
    }

    if (isAvailable) {
      return (
        <motion.div
          variants={validationSuccessVariants}
          initial="initial"
          animate="animate"
          className="relative"
        >
          <GoldPulse show={true} />
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: GOLD.primary }}
          >
            <svg
              className="w-3 h-3 text-[var(--color-bg-void)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </motion.div>
      );
    }

    if (isTaken || isInvalid) {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center"
        >
          <svg
            className="w-3 h-3 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.div>
      );
    }

    return null;
  };

  return (
    <motion.div
      variants={sceneMorphVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8"
    >
      {/* Headline */}
      <motion.div variants={sceneChildVariants} className="space-y-3">
        <motion.h1
          variants={headlineVariants}
          className="text-title-lg font-semibold text-white tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Claim your territory.
        </motion.h1>

        <motion.p
          variants={subtextVariants}
          className="text-body-lg text-white/50"
        >
          <ManifestoLine delay={0.4} stagger={0.1}>
            No one else will ever have this.
          </ManifestoLine>
        </motion.p>
      </motion.div>

      {/* Handle input */}
      <motion.div variants={sceneChildVariants}>
        <motion.div
          variants={validationErrorVariants}
          animate={(isTaken || isInvalid) ? 'shake' : 'idle'}
          className={cn(
            'relative flex items-center rounded-xl border transition-all duration-200',
            isFocused
              ? 'border-white/30 bg-white/[0.06]'
              : 'border-white/10 bg-white/[0.03]',
            isAvailable && `border-[${GOLD.primary}]/30`,
            (isTaken || isInvalid) && 'border-red-500/50'
          )}
          style={isAvailable ? { borderColor: `${GOLD.primary}33` } : undefined}
        >
          {/* @ prefix */}
          <span className="pl-4 text-body text-white/40">@</span>

          <input
            ref={inputRef}
            type="text"
            value={handle}
            onChange={(e) => onHandleChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="yourhandle"
            className={cn(
              'flex-1 bg-transparent px-2 py-4 text-body text-white placeholder-white/30',
              'focus:outline-none'
            )}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
            maxLength={20}
          />

          {/* Status indicator */}
          <div className="pr-4">
            <StatusIndicator />
          </div>
        </motion.div>

        {/* Status text */}
        <AnimatePresence mode="wait">
          {isAvailable && (
            <motion.p
              key="available"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-body-sm mt-2"
              style={{ color: GOLD.primary }}
            >
              @{handle} is yours.
            </motion.p>
          )}

          {isTaken && (
            <motion.p
              key="taken"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-body-sm text-red-400 mt-2"
            >
              Already claimed. Try another.
            </motion.p>
          )}

          {isInvalid && (
            <motion.p
              key="invalid"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-body-sm text-red-400 mt-2"
            >
              3-20 characters. Letters, numbers, underscores only.
            </motion.p>
          )}
        </AnimatePresence>

        {/* Handle hints */}
        <motion.p
          variants={sceneChildVariants}
          className="text-body-sm text-white/30 mt-2"
        >
          3-20 characters. Letters, numbers, underscores only.
        </motion.p>
      </motion.div>

      {/* Suggestions when taken */}
      <AnimatePresence>
        {isTaken && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <p className="text-body-sm text-white/50">Try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSuggestionSelect(suggestion)}
                  className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02] text-body-sm text-white/60 hover:border-white/20 hover:bg-white/[0.04] transition-all"
                >
                  @{suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            variants={errorMessageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-body-sm text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* CTA */}
      <motion.div variants={sceneChildVariants}>
        <Button
          variant={canContinue ? 'cta' : 'default'}
          size="lg"
          onClick={onContinue}
          disabled={!canContinue}
          className="w-full"
        >
          {canContinue ? 'Claim @' + handle : 'Continue'}
        </Button>
      </motion.div>
    </motion.div>
  );
}

HandleScene.displayName = 'HandleScene';
