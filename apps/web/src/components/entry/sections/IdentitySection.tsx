'use client';

/**
 * IdentitySection - Profile setup
 * REDESIGNED: Jan 21, 2026
 *
 * Premium form design:
 * - Apple-style inputs (h-14, rounded-2xl)
 * - Clash Display for headers
 * - Gold CTA button (earned moment - final step)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HandleInput,
  HandleStatusBadge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Button,
  type HandleStatus,
} from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  sectionEnterVariants,
  sectionChildVariants,
  shakeVariants,
  errorInlineVariants,
} from '../motion/section-motion';
import { DURATION, EASE_PREMIUM } from '../motion/entry-motion';
import type { SectionState } from '../hooks/useEvolvingEntry';

interface IdentitySectionProps {
  section: SectionState;
  firstName: string;
  lastName: string;
  handle: string;
  handleStatus: HandleStatus;
  handleSuggestions: string[];
  major: string;
  graduationYear: number | null;
  residentialSpaceId: string;
  onFirstNameChange: (name: string) => void;
  onLastNameChange: (name: string) => void;
  onHandleChange: (handle: string) => void;
  onSuggestionClick: (handle: string) => void;
  onMajorChange: (major: string) => void;
  onGraduationYearChange: (year: number | null) => void;
  onResidentialChange: (spaceId: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  majors: string[];
  graduationYears: number[];
  residentialSpaces: Array<{ id: string; name: string }>;
}

export function IdentitySection({
  section,
  firstName,
  lastName,
  handle,
  handleStatus,
  handleSuggestions,
  major,
  graduationYear,
  residentialSpaceId,
  onFirstNameChange,
  onLastNameChange,
  onHandleChange,
  onSuggestionClick,
  onMajorChange,
  onGraduationYearChange,
  onResidentialChange,
  onSubmit,
  isLoading,
  majors,
  graduationYears,
  residentialSpaces,
}: IdentitySectionProps) {
  const isActive = section.status === 'active';
  const hasError = !!section.error;

  // Required: name, handle available, major, graduation year
  // Optional: residentialSpaceId
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

  // Hidden state
  if (section.status === 'hidden') {
    return null;
  }

  // Locked/complete state - identity section doesn't show a chip
  // (arrival section takes over)
  if (section.status === 'locked' || section.status === 'complete') {
    return null;
  }

  // Active state - show identity form
  return (
    <motion.div
      variants={sectionEnterVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-5"
    >
      {/* Header */}
      <motion.div variants={sectionChildVariants} className="space-y-1">
        <h2
          className="text-[20px] font-semibold text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Set up your profile
        </h2>
        <p className="text-[14px] text-white/40">
          How you'll appear to other students
        </p>
      </motion.div>

      {/* Form */}
      <div className="space-y-4">
        {/* Name row - Apple-style inputs */}
        <motion.div
          variants={sectionChildVariants}
          className="grid grid-cols-2 gap-3"
        >
          <div
            className={cn(
              'flex items-center h-14 rounded-2xl border transition-all duration-200',
              'bg-white/[0.03] border-white/[0.08]',
              'focus-within:bg-white/[0.05] focus-within:border-white/20'
            )}
          >
            <input
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="First name"
              disabled={isLoading}
              autoFocus
              className={cn(
                'w-full h-full px-4 bg-transparent text-[16px] text-white',
                'placeholder:text-white/25',
                'focus:outline-none',
                'disabled:opacity-50'
              )}
            />
          </div>
          <div
            className={cn(
              'flex items-center h-14 rounded-2xl border transition-all duration-200',
              'bg-white/[0.03] border-white/[0.08]',
              'focus-within:bg-white/[0.05] focus-within:border-white/20'
            )}
          >
            <input
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Last name"
              disabled={isLoading}
              className={cn(
                'w-full h-full px-4 bg-transparent text-[16px] text-white',
                'placeholder:text-white/25',
                'focus:outline-none',
                'disabled:opacity-50'
              )}
            />
          </div>
        </motion.div>

        {/* Handle */}
        <motion.div variants={sectionChildVariants}>
          <motion.div
            variants={shakeVariants}
            animate={hasError && !firstName && !lastName ? 'shake' : 'idle'}
          >
            <HandleInput
              value={handle}
              onChange={(e) => onHandleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              status={handleStatus}
              placeholder="yourhandle"
              disabled={isLoading}
              size="default"
            />
          </motion.div>

          <HandleStatusBadge
            status={handleStatus}
            suggestions={handleSuggestions}
            onSuggestionClick={onSuggestionClick}
          />
        </motion.div>

        {/* Identity dropdowns */}
        <motion.div variants={sectionChildVariants} className="space-y-3">
          {/* Major */}
          <div className="space-y-1.5">
            <label className="text-[12px] text-white/40">Major</label>
            <Select
              value={major}
              onValueChange={onMajorChange}
              disabled={isLoading}
            >
              <SelectTrigger>
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

          {/* Graduation year */}
          <div className="space-y-1.5">
            <label className="text-[12px] text-white/40">Graduation year</label>
            <Select
              value={graduationYear?.toString() || ''}
              onValueChange={(v) => onGraduationYearChange(parseInt(v, 10))}
              disabled={isLoading}
            >
              <SelectTrigger>
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

          {/* Residential (optional) */}
          <div className="space-y-1.5">
            <label className="text-[12px] text-white/40">
              Residence <span className="text-white/20">(optional)</span>
            </label>
            <Select
              value={residentialSpaceId}
              onValueChange={onResidentialChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select residence hall" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off-campus">Off campus</SelectItem>
                {residentialSpaces.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {hasError && (
            <motion.p
              variants={errorInlineVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-[13px] text-red-400/90"
            >
              {section.error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* CTA Button - Gold (earned moment) */}
        <motion.div variants={sectionChildVariants}>
          <Button
            variant="cta"
            size="lg"
            onClick={onSubmit}
            disabled={!canSubmit}
            loading={isLoading}
            className="w-full"
          >
            {isLoading ? 'Setting up...' : 'Enter HIVE'}
          </Button>
        </motion.div>

        {/* Subtext */}
        <motion.p
          variants={sectionChildVariants}
          className="text-[12px] text-white/25 text-center"
        >
          You can change your handle later
        </motion.p>
      </div>
    </motion.div>
  );
}

IdentitySection.displayName = 'IdentitySection';
