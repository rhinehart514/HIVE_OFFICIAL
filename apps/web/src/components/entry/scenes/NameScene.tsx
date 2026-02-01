'use client';

/**
 * NameScene - "Who will they remember?"
 *
 * Act II, Scene 2: Name Collection
 * The user claims their identity.
 *
 * Headline: "Who will they remember?"
 * Manifesto: "Your name carries weight here."
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
  errorMessageVariants,
} from '../motion/scene-transitions';
import { DURATION, EASE_PREMIUM } from '../motion/entry-motion';

interface NameSceneProps {
  firstName: string;
  lastName: string;
  onFirstNameChange: (name: string) => void;
  onLastNameChange: (name: string) => void;
  onContinue: () => void;
  error?: string;
}

export function NameScene({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  onContinue,
  error,
}: NameSceneProps) {
  const shouldReduceMotion = useReducedMotion();
  const firstNameRef = React.useRef<HTMLInputElement>(null);
  const lastNameRef = React.useRef<HTMLInputElement>(null);
  const [focusedField, setFocusedField] = React.useState<'first' | 'last' | null>(null);

  // Focus first name input on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      firstNameRef.current?.focus();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleFirstNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && firstName.trim()) {
      lastNameRef.current?.focus();
    }
  };

  const handleLastNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && lastName.trim()) {
      handleContinue();
    }
  };

  const handleContinue = () => {
    if (firstName.trim() && lastName.trim()) {
      onContinue();
    }
  };

  const canContinue = firstName.trim() && lastName.trim();

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
          Who will they remember?
        </motion.h1>

        <motion.p
          variants={subtextVariants}
          className="text-body-lg text-white/50"
        >
          <ManifestoLine delay={0.4} stagger={0.1}>
            Your name carries weight here.
          </ManifestoLine>
        </motion.p>
      </motion.div>

      {/* Name inputs */}
      <motion.div variants={sceneChildVariants} className="space-y-4">
        {/* First name */}
        <motion.div variants={inputContainerVariants}>
          <label className="text-body-sm text-white/60 mb-2 block">First name</label>
          <input
            ref={firstNameRef}
            type="text"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            onKeyDown={handleFirstNameKeyDown}
            onFocus={() => setFocusedField('first')}
            onBlur={() => setFocusedField(null)}
            placeholder="Enter your first name"
            className={cn(
              'w-full px-4 py-3 rounded-xl border bg-white/[0.03] text-body text-white',
              'placeholder-white/30 transition-all duration-200',
              'focus:outline-none',
              focusedField === 'first'
                ? 'border-white/30 bg-white/[0.06]'
                : 'border-white/10'
            )}
            autoComplete="given-name"
            autoCapitalize="words"
          />
        </motion.div>

        {/* Last name */}
        <motion.div variants={inputContainerVariants}>
          <label className="text-body-sm text-white/60 mb-2 block">Last name</label>
          <input
            ref={lastNameRef}
            type="text"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            onKeyDown={handleLastNameKeyDown}
            onFocus={() => setFocusedField('last')}
            onBlur={() => setFocusedField(null)}
            placeholder="Enter your last name"
            className={cn(
              'w-full px-4 py-3 rounded-xl border bg-white/[0.03] text-body text-white',
              'placeholder-white/30 transition-all duration-200',
              'focus:outline-none',
              focusedField === 'last'
                ? 'border-white/30 bg-white/[0.06]'
                : 'border-white/10'
            )}
            autoComplete="family-name"
            autoCapitalize="words"
          />
        </motion.div>
      </motion.div>

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
          variant="cta"
          size="lg"
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full"
        >
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}

NameScene.displayName = 'NameScene';
