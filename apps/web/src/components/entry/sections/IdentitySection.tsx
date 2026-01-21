'use client';

/**
 * IdentitySection - Profile setup section (students only)
 *
 * Fifth section in the evolving entry flow.
 * - Shows name, handle, and identity fields when active
 * - Only appears for new students (faculty skip this)
 * - Gold CTA button (earned moment - final step)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import {
  Input,
  HandleInput,
  HandleStatusBadge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  type HandleStatus,
} from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  sectionEnterVariants,
  sectionChildVariants,
  shakeVariants,
  errorInlineVariants,
} from '../motion/section-motion';
import { DURATION, EASE_PREMIUM, GOLD } from '../motion/entry-motion';
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
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={sectionChildVariants} className="space-y-1">
        <p className="text-[15px] text-white/70">
          Almost there
        </p>
        <p className="text-[13px] text-white/40">
          How you'll appear to other students
        </p>
      </motion.div>

      {/* Form */}
      <div className="space-y-4">
        {/* Name row */}
        <motion.div
          variants={sectionChildVariants}
          className="grid grid-cols-2 gap-3"
        >
          <Input
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="First name"
            disabled={isLoading}
            autoFocus
            size="default"
          />
          <Input
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Last name"
            disabled={isLoading}
            size="default"
          />
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
        <motion.button
          variants={sectionChildVariants}
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className={cn(
            'w-full h-12 rounded-xl font-medium text-[15px] transition-all',
            'flex items-center justify-center gap-2',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/50',
            canSubmit
              ? 'text-black hover:brightness-110'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          )}
          style={canSubmit ? {
            background: `linear-gradient(135deg, ${GOLD.light} 0%, ${GOLD.primary} 50%, ${GOLD.dark} 100%)`,
          } : undefined}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Setting up...</span>
            </>
          ) : (
            <>
              <span>Enter HIVE</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>

        {/* Subtext */}
        <motion.p
          variants={sectionChildVariants}
          className="text-[11px] text-white/30 text-center"
        >
          You can change your handle later
        </motion.p>
      </div>
    </motion.div>
  );
}

IdentitySection.displayName = 'IdentitySection';
