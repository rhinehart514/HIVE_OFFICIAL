'use client';

/**
 * IdentityHandleSection - Step 2 of paginated identity flow
 *
 * Handle selection with real-time availability check.
 * Auto-advances to field step when handle is available.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HandleInput,
  HandleStatusBadge,
  Button,
  type HandleStatus,
} from '@hive/ui/design-system/primitives';
import {
  sectionEnterVariants,
  sectionChildVariants,
  shakeVariants,
  errorInlineVariants,
} from '../motion/section-motion';
import { StepCounter } from '../primitives';
import type { SectionState } from '../hooks/useEvolvingEntry';

interface IdentityHandleSectionProps {
  section: SectionState;
  handle: string;
  handleStatus: HandleStatus;
  handleSuggestions: string[];
  onHandleChange: (handle: string) => void;
  onSuggestionClick: (handle: string) => void;
  onAdvance: () => void;
  isLoading?: boolean;
}

export function IdentityHandleSection({
  section,
  handle,
  handleStatus,
  handleSuggestions,
  onHandleChange,
  onSuggestionClick,
  onAdvance,
  isLoading = false,
}: IdentityHandleSectionProps) {
  const hasError = !!section.error;

  const canAdvance = handle.trim() && handleStatus === 'available' && !isLoading;

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && canAdvance) {
        onAdvance();
      }
    },
    [canAdvance, onAdvance]
  );

  if (section.status === 'hidden' || section.status === 'locked' || section.status === 'complete') {
    return null;
  }

  return (
    <motion.div
      variants={sectionEnterVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Progress indicator */}
      <motion.div variants={sectionChildVariants}>
        <StepCounter current={2} total={4} />
      </motion.div>

      {/* Header */}
      <motion.div variants={sectionChildVariants} className="space-y-3">
        <h2
          className="text-title-lg font-semibold text-white tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Claim your handle
        </h2>
        <p className="text-body text-white/40 leading-relaxed">
          Your unique identity on campus
        </p>
      </motion.div>

      {/* Handle input */}
      <motion.div variants={sectionChildVariants}>
        <motion.div
          variants={shakeVariants}
          animate={hasError ? 'shake' : 'idle'}
        >
          <HandleInput
            value={handle}
            onChange={(e) => onHandleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            status={handleStatus}
            placeholder="yourhandle"
            disabled={isLoading}
            size="default"
            autoFocus
          />
        </motion.div>

        <HandleStatusBadge
          status={handleStatus}
          suggestions={handleSuggestions}
          onSuggestionClick={onSuggestionClick}
        />
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {hasError && (
          <motion.p
            variants={errorInlineVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-body-sm text-red-400/90"
          >
            {section.error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* CTA */}
      <motion.div variants={sectionChildVariants}>
        <Button
          variant="cta"
          size="lg"
          onClick={onAdvance}
          disabled={!canAdvance}
          loading={isLoading}
          className="w-full"
        >
          Continue
        </Button>
      </motion.div>

      {/* Manifesto line */}
      <motion.p
        variants={sectionChildVariants}
        className="text-body-sm text-white/30 text-center"
      >
        Your handle is permanent.
      </motion.p>
    </motion.div>
  );
}

IdentityHandleSection.displayName = 'IdentityHandleSection';
