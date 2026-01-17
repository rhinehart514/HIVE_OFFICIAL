'use client';

/**
 * IdentityState - Profile Setup Step
 *
 * Third state in the /enter flow (NEW USERS ONLY)
 * Captures name and handle
 *
 * GOLD BUDGET: CTA button is gold (earned moment - last step)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import {
  Input,
  HandleInput,
  HandleStatusBadge,
  Button,
  type HandleStatus,
} from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  stateVariants,
  childVariants,
  errorVariants,
  EASE_PREMIUM,
  DURATION,
} from '../motion/entry-motion';

export interface IdentityStateProps {
  /** First name value */
  firstName: string;
  /** Last name value */
  lastName: string;
  /** Handle value (without @) */
  handle: string;
  /** Handle availability status */
  handleStatus: HandleStatus;
  /** Handle suggestions when taken */
  handleSuggestions: string[];
  /** First name change handler */
  onFirstNameChange: (name: string) => void;
  /** Last name change handler */
  onLastNameChange: (name: string) => void;
  /** Handle change handler */
  onHandleChange: (handle: string) => void;
  /** Suggestion click handler */
  onSuggestionClick: (handle: string) => void;
  /** Submit handler */
  onSubmit: () => void;
  /** Error message */
  error: string | null;
  /** Loading state */
  isLoading: boolean;
}

export function IdentityState({
  firstName,
  lastName,
  handle,
  handleStatus,
  handleSuggestions,
  onFirstNameChange,
  onLastNameChange,
  onHandleChange,
  onSuggestionClick,
  onSubmit,
  error,
  isLoading,
}: IdentityStateProps) {
  // Can only submit when handle is available and names are filled
  const canSubmit =
    firstName.trim() &&
    lastName.trim() &&
    handle.trim() &&
    handleStatus === 'available' &&
    !isLoading;

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && canSubmit) {
        onSubmit();
      }
    },
    [canSubmit, onSubmit]
  );

  return (
    <motion.div
      variants={stateVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={childVariants} className="space-y-3">
        <h1 className="text-[32px] font-semibold tracking-tight text-white">
          Almost there
        </h1>
        <p className="text-[15px] leading-relaxed text-white/50">
          How you'll appear to other students.
        </p>
      </motion.div>

      {/* Form */}
      <motion.div variants={childVariants} className="space-y-4">
        {/* Name row - side by side */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="First name"
            disabled={isLoading}
            autoFocus
            size="lg"
          />
          <Input
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Last name"
            disabled={isLoading}
            size="lg"
          />
        </div>

        {/* Handle input */}
        <HandleInput
          value={handle}
          onChange={(e) => onHandleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          status={handleStatus}
          placeholder="yourhandle"
          disabled={isLoading}
          size="lg"
        />

        {/* Handle status badge with suggestions */}
        <HandleStatusBadge
          status={handleStatus}
          suggestions={handleSuggestions}
          onSuggestionClick={onSuggestionClick}
        />

        {/* Error message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              variants={errorVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: DURATION.fast, ease: EASE_PREMIUM }}
            >
              <p className="text-sm text-red-400/90">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA Button - GOLD (earned moment) */}
        <Button
          onClick={onSubmit}
          disabled={!canSubmit}
          variant="cta"
          size="lg"
          className="w-full"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
              Setting up
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Enter HIVE
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </motion.div>

      {/* Subtext */}
      <motion.div variants={childVariants}>
        <p className="text-xs text-white/30">
          You can change your handle later.
        </p>
      </motion.div>
    </motion.div>
  );
}

IdentityState.displayName = 'IdentityState';
