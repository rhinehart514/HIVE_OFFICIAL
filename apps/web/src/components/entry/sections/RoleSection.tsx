'use client';

/**
 * RoleSection - Compact role selection (earned moment)
 *
 * Fourth section in the evolving entry flow.
 * Appears AFTER code verification as an "earned moment".
 * - Compact radio group when active
 * - Collapses to role chip when locked
 * - Alumni path reveals waitlist info inline
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Briefcase, Users, Clock, Loader2 } from 'lucide-react';
import { Input } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  sectionEnterVariants,
  sectionChildVariants,
  shakeVariants,
  errorInlineVariants,
} from '../motion/section-motion';
import { DURATION, EASE_PREMIUM, GOLD } from '../motion/entry-motion';
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
  const isActive = section.status === 'active';
  const hasError = !!section.error;

  const canSubmit = role && !isLoading && (role !== 'alumni' || alumniSpace.trim());

  // Locked state - show role chip
  if (isLocked && role) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
        className="space-y-2"
      >
        <p className="text-[13px] text-white/40">Role</p>
        <RoleChip role={role} allowChange={false} />
      </motion.div>
    );
  }

  // Hidden state
  if (section.status === 'hidden') {
    return null;
  }

  // Active state - show radio options
  return (
    <motion.div
      variants={sectionEnterVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-4"
    >
      {/* Header */}
      <motion.div variants={sectionChildVariants} className="space-y-1">
        <p className="text-[15px] text-white/70">
          How are you connected?
        </p>
      </motion.div>

      {/* Compact role options */}
      <motion.div variants={sectionChildVariants}>
        <motion.div
          variants={shakeVariants}
          animate={hasError ? 'shake' : 'idle'}
          className="flex gap-2"
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
                  'flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                  'border text-center',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                  isSelected
                    ? 'border-white/20 bg-white/[0.08]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]',
                  isLoading && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    isSelected ? 'bg-white/10' : 'bg-white/[0.04]'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4',
                      isSelected ? 'text-white' : 'text-white/50'
                    )}
                  />
                </div>
                <div className="space-y-0.5">
                  <span
                    className={cn(
                      'text-[13px] font-medium block',
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

      {/* Alumni additional info/input */}
      <AnimatePresence mode="wait">
        {role === 'alumni' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-white/50 leading-relaxed">
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
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <p className="text-[12px] text-white/50 leading-relaxed">
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
            className="text-[13px] text-red-400/90"
          >
            {section.error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Continue button */}
      <motion.button
        variants={sectionChildVariants}
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className={cn(
          'w-full h-12 rounded-xl font-medium text-[15px] transition-all',
          'flex items-center justify-center gap-2',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          canSubmit
            ? 'bg-white text-black hover:bg-white/90'
            : 'bg-white/10 text-white/30 cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{role === 'alumni' ? 'Joining...' : 'Continuing...'}</span>
          </>
        ) : role === 'alumni' ? (
          'Join waitlist'
        ) : (
          'Continue'
        )}
      </motion.button>
    </motion.div>
  );
}

RoleSection.displayName = 'RoleSection';
