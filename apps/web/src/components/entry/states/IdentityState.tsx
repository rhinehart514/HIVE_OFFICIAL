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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
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

  // Identity fields for decision-reducing onboarding
  /** Selected major */
  major: string;
  /** Graduation year */
  graduationYear: number | null;
  /** Selected residential space ID */
  residentialSpaceId: string;
  /** Major change handler */
  onMajorChange: (major: string) => void;
  /** Graduation year change handler */
  onGraduationYearChange: (year: number | null) => void;
  /** Residential space change handler */
  onResidentialChange: (spaceId: string) => void;
  /** Available majors list */
  majors: string[];
  /** Available graduation years */
  graduationYears: number[];
  /** Available residential spaces */
  residentialSpaces: Array<{ id: string; name: string }>;
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
  // Identity fields
  major,
  graduationYear,
  residentialSpaceId,
  onMajorChange,
  onGraduationYearChange,
  onResidentialChange,
  majors,
  graduationYears,
  residentialSpaces,
}: IdentityStateProps) {
  // Can only submit when handle is available, names filled, and identity selected
  // Note: residentialSpaceId is optional (off-campus students)
  const canSubmit =
    firstName.trim() &&
    lastName.trim() &&
    handle.trim() &&
    handleStatus === 'available' &&
    major &&
    graduationYear &&
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
        <h1 className="text-heading font-semibold tracking-tight text-white">
          Almost there
        </h1>
        <p className="text-body leading-relaxed text-white/50">
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

        {/* Identity dropdowns */}
        <div className="space-y-3 pt-2">
          {/* Major dropdown */}
          <div className="space-y-1.5">
            <label className="text-sm text-white/50">What's your major?</label>
            <Select
              value={major}
              onValueChange={onMajorChange}
              disabled={isLoading}
            >
              <SelectTrigger size="lg">
                <SelectValue placeholder="Select your major" />
              </SelectTrigger>
              <SelectContent>
                {majors.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Graduation year dropdown */}
          <div className="space-y-1.5">
            <label className="text-sm text-white/50">Graduation year</label>
            <Select
              value={graduationYear?.toString() || ''}
              onValueChange={(v) => onGraduationYearChange(parseInt(v, 10))}
              disabled={isLoading}
            >
              <SelectTrigger size="lg">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {graduationYears.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    Class of {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Residential dropdown (optional) */}
          <div className="space-y-1.5">
            <label className="text-sm text-white/50">
              Where do you live?{' '}
              <span className="text-white/30">(optional)</span>
            </label>
            <Select
              value={residentialSpaceId}
              onValueChange={onResidentialChange}
              disabled={isLoading}
            >
              <SelectTrigger size="lg">
                <SelectValue placeholder="Select your residence hall" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off-campus">Off campus / Not listed</SelectItem>
                {residentialSpaces.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
