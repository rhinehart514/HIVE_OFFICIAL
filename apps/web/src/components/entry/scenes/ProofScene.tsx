'use client';

/**
 * ProofScene - "Prove it."
 *
 * Act I, Scene 2: Email Collection
 * The user's .edu email is their key.
 *
 * Headline: "Prove it."
 * Subtext: "Your .edu is your key."
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import { ManifestoLine } from '../primitives/ManifestoLine';
import {
  sceneMorphVariants,
  sceneChildVariants,
  headlineVariants,
  subtextVariants,
  inputContainerVariants,
  validationErrorVariants,
  errorMessageVariants,
} from '../motion/scene-transitions';
import { DURATION, EASE_PREMIUM } from '../motion/entry-motion';

interface ProofSceneProps {
  email: string;
  domain: string;
  onEmailChange: (email: string) => void;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export function ProofScene({
  email,
  domain,
  onEmailChange,
  onSubmit,
  isLoading,
  error,
}: ProofSceneProps) {
  const shouldReduceMotion = useReducedMotion();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  // Focus input on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Track error state for shake animation
  React.useEffect(() => {
    if (error) {
      setHasError(true);
      const timer = setTimeout(() => setHasError(false), 400);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && email.trim() && !isLoading) {
      onSubmit();
    }
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
          Prove it.
        </motion.h1>

        <motion.p
          variants={subtextVariants}
          className="text-body-lg text-white/50"
        >
          <ManifestoLine delay={0.4} stagger={0.1}>
            Your .edu is your key.
          </ManifestoLine>
        </motion.p>
      </motion.div>

      {/* Email input with integrated domain */}
      <motion.div variants={sceneChildVariants}>
        <motion.div
          variants={inputContainerVariants}
          animate={hasError ? 'shake' : 'animate'}
          className={cn(
            'relative flex items-center rounded-xl border transition-all duration-200',
            isFocused
              ? 'border-white/30 bg-white/[0.06]'
              : 'border-white/10 bg-white/[0.03]',
            error && 'border-red-500/50'
          )}
        >
          <input
            ref={inputRef}
            type="text"
            value={email}
            onChange={(e) => onEmailChange(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="username"
            disabled={isLoading}
            className={cn(
              'flex-1 bg-transparent px-4 py-4 text-body text-white placeholder-white/30',
              'focus:outline-none disabled:opacity-50'
            )}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          {/* Domain suffix */}
          <div className="pr-4 text-body text-white/40">
            @{domain}
          </div>
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              variants={errorMessageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-body-sm text-red-400 mt-2"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* CTA */}
      <motion.div variants={sceneChildVariants}>
        <Button
          variant="cta"
          size="lg"
          onClick={onSubmit}
          disabled={!email.trim() || isLoading}
          loading={isLoading}
          className="w-full"
        >
          {isLoading ? 'Sending code...' : 'Send verification code'}
        </Button>
      </motion.div>

      {/* Privacy note */}
      <motion.p
        variants={sceneChildVariants}
        className="text-body-sm text-white/30 text-center"
      >
        We'll send a 6-digit code to verify your email.
      </motion.p>
    </motion.div>
  );
}

ProofScene.displayName = 'ProofScene';
