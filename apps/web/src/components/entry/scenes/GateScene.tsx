'use client';

/**
 * GateScene - "One code. One chance."
 *
 * Act I, Scene 3: Code Verification
 * The first gold moment - code verified shows a brief gold flash.
 *
 * Headline: "One code. One chance."
 * Subtext: "Check your inbox."
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { OTPInput, CountdownTimer } from '@hive/ui/design-system/primitives';
import { ManifestoLine } from '../primitives/ManifestoLine';
import { GoldFlash } from '../primitives/GoldFlash';
import {
  sceneMorphVariants,
  sceneChildVariants,
  headlineVariants,
  subtextVariants,
  validationErrorVariants,
  errorMessageVariants,
} from '../motion/scene-transitions';
import { DURATION, EASE_PREMIUM, GOLD } from '../motion/entry-motion';

interface GateSceneProps {
  email: string;
  code: string[];
  onCodeChange: (code: string[]) => void;
  onVerify: (codeString: string) => Promise<void>;
  onResend: () => Promise<void>;
  onEditEmail: () => void;
  isLoading: boolean;
  resendCooldown: number;
  error?: string;
}

export function GateScene({
  email,
  code,
  onCodeChange,
  onVerify,
  onResend,
  onEditEmail,
  isLoading,
  resendCooldown,
  error,
}: GateSceneProps) {
  const shouldReduceMotion = useReducedMotion();
  const [hasError, setHasError] = React.useState(false);
  const [showGoldFlash, setShowGoldFlash] = React.useState(false);

  // Track error state for shake animation
  React.useEffect(() => {
    if (error) {
      setHasError(true);
      const timer = setTimeout(() => setHasError(false), 400);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleComplete = async (codeString: string) => {
    // Brief gold flash before verification starts
    setShowGoldFlash(true);
    setTimeout(() => setShowGoldFlash(false), 200);

    await onVerify(codeString);
  };

  return (
    <motion.div
      variants={sceneMorphVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8"
    >
      {/* Gold flash on code complete */}
      <GoldFlash show={showGoldFlash} duration={0.2} intensity={0.3} />

      {/* Headline */}
      <motion.div variants={sceneChildVariants} className="space-y-3">
        <motion.h1
          variants={headlineVariants}
          className="text-title-lg font-semibold text-white tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          One code. One chance.
        </motion.h1>

        <motion.p
          variants={subtextVariants}
          className="text-body-lg text-white/50"
        >
          <ManifestoLine delay={0.4} stagger={0.1}>
            Check your inbox.
          </ManifestoLine>
        </motion.p>
      </motion.div>

      {/* Email indicator */}
      <motion.div
        variants={sceneChildVariants}
        className="flex items-center gap-2 text-body text-white/60"
      >
        <span>Sent to</span>
        <span className="text-white font-medium">{email}</span>
      </motion.div>

      {/* OTP Input */}
      <motion.div variants={sceneChildVariants}>
        <motion.div
          variants={validationErrorVariants}
          animate={hasError ? 'shake' : 'idle'}
        >
          <OTPInput
            value={code}
            onChange={onCodeChange}
            onComplete={handleComplete}
            error={!!error}
            disabled={isLoading}
            autoFocus
            reduceMotion={shouldReduceMotion ?? false}
          />
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              variants={errorMessageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-body-sm text-red-400 mt-3 text-center"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Loading indicator */}
        <AnimatePresence>
          {isLoading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 mt-4 text-body-sm text-white/50"
            >
              <motion.div
                className="w-4 h-4 rounded-full border-2 border-white/20"
                style={{ borderTopColor: GOLD.primary }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span>Verifying...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Actions */}
      <motion.div
        variants={sceneChildVariants}
        className="flex items-center justify-center gap-4 text-body-sm"
      >
        {/* Resend with cooldown */}
        <CountdownTimer
          seconds={resendCooldown}
          prefix="Resend in "
          format={resendCooldown >= 60 ? 'mm:ss' : 'ss'}
          completedContent={
            <button
              onClick={onResend}
              disabled={isLoading}
              className="text-white/50 hover:text-white transition-colors disabled:opacity-50"
            >
              Resend code
            </button>
          }
        />

        <span className="text-white/20">·</span>

        <button
          onClick={onEditEmail}
          disabled={isLoading}
          className="text-white/50 hover:text-white transition-colors disabled:opacity-50"
        >
          Change email
        </button>
      </motion.div>

      {/* Manifesto line */}
      <motion.p
        variants={sceneChildVariants}
        className="text-body-sm text-white/30 text-center"
      >
        Your campus email is your only key.
      </motion.p>
    </motion.div>
  );
}

GateScene.displayName = 'GateScene';
