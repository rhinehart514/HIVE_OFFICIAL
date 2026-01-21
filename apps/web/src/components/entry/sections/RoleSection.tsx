'use client';

/**
 * RoleSection - Role selection
 * REDESIGNED: Jan 21, 2026
 *
 * Clean, minimal role cards:
 * - Simple selection UI
 * - Gold button for primary action
 * - Premium card styling
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Briefcase, Users, Clock } from 'lucide-react';
import { Input, Button } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  sectionEnterVariants,
  sectionChildVariants,
  shakeVariants,
  errorInlineVariants,
} from '../motion/section-motion';
import { DURATION, EASE_PREMIUM } from '../motion/entry-motion';
import { RoleChip } from '../primitives/LockedFieldChip';
import type { UserRole, SectionState } from '../hooks/useEvolvingEntry';

interface RoleOption {
  id: UserRole;
  icon: typeof GraduationCap;
  label: string;
  description: string;
  badge?: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'student',
    icon: GraduationCap,
    label: 'Student',
    description: 'Currently enrolled',
  },
  {
    id: 'faculty',
    icon: Briefcase,
    label: 'Faculty',
    description: 'Staff or instructor',
  },
  {
    id: 'alumni',
    icon: Users,
    label: 'Alumni',
    description: 'Graduated',
    badge: 'Coming Soon',
  },
];

interface RoleSectionProps {
  section: SectionState;
  role: UserRole | null;
  alumniSpace: string;
  onRoleChange: (role: UserRole) => void;
  onAlumniSpaceChange: (space: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function RoleSection({
  section,
  role,
  alumniSpace,
  onRoleChange,
  onAlumniSpaceChange,
  onSubmit,
  isLoading,
}: RoleSectionProps) {
  const isLocked = section.status === 'locked' || section.status === 'complete';
  const hasError = !!section.error;

  const canSubmit = role && !isLoading && (role !== 'alumni' || alumniSpace.trim());

  // Locked state
  if (isLocked && role) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
        className="space-y-2"
      >
        <p className="text-[13px] text-white/40 font-medium">Role</p>
        <RoleChip role={role} allowChange={false} />
      </motion.div>
    );
  }

  // Hidden state
  if (section.status === 'hidden') {
    return null;
  }

  // Active state
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
          How are you connected?
        </h2>
      </motion.div>

      {/* Role cards */}
      <motion.div variants={sectionChildVariants}>
        <motion.div
          variants={shakeVariants}
          animate={hasError ? 'shake' : 'idle'}
          className="flex gap-3"
        >
          {ROLE_OPTIONS.map((option) => {
            const isSelected = role === option.id;
            const Icon = option.icon;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onRoleChange(option.id)}
                disabled={isLoading}
                className={cn(
                  'flex-1 flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-200',
                  'border text-center',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
                  isSelected
                    ? 'border-white/20 bg-white/[0.06]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.08]',
                  isLoading && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                    isSelected ? 'bg-white/10' : 'bg-white/[0.04]'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-colors',
                      isSelected ? 'text-white' : 'text-white/50'
                    )}
                  />
                </div>
                <div className="space-y-0.5">
                  <span
                    className={cn(
                      'text-[14px] font-medium block transition-colors',
                      isSelected ? 'text-white' : 'text-white/70'
                    )}
                  >
                    {option.label}
                  </span>
                  {option.badge && (
                    <span className="text-[10px] text-white/30">
                      {option.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Alumni waitlist info */}
      <AnimatePresence mode="wait">
        {role === 'alumni' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-1">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-white/50 leading-relaxed">
                    Alumni access is coming soon. Tell us which spaces you were
                    part of, and we'll notify you when ready.
                  </p>
                </div>
              </div>

              <Input
                value={alumniSpace}
                onChange={(e) => onAlumniSpaceChange(e.target.value)}
                placeholder="e.g., Debate Club, CS Association"
                disabled={isLoading}
                size="default"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Faculty info */}
      <AnimatePresence mode="wait">
        {role === 'faculty' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <p className="text-[13px] text-white/50 leading-relaxed">
                Faculty accounts can claim and manage official university
                organization spaces on HIVE.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {hasError && (
          <motion.p
            variants={errorInlineVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-[13px] text-red-400"
          >
            {section.error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Continue button */}
      <motion.div variants={sectionChildVariants}>
        <Button
          variant={role === 'student' ? 'cta' : 'default'}
          size="lg"
          onClick={onSubmit}
          disabled={!canSubmit}
          loading={isLoading}
          className="w-full"
        >
          {isLoading
            ? role === 'alumni'
              ? 'Joining...'
              : 'Continuing...'
            : role === 'alumni'
              ? 'Join waitlist'
              : 'Continue'}
        </Button>
      </motion.div>
    </motion.div>
  );
}

RoleSection.displayName = 'RoleSection';
