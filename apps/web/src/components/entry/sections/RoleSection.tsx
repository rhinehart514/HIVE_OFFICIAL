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
import { Clock } from 'lucide-react';
import { Input, Button } from '@hive/ui/design-system/primitives';
import {
  sectionChildVariants,
  shakeVariants,
  errorInlineVariants,
} from '../motion/section-motion';
import {
  sectionMorphVariants,
  contentFadeVariants,
} from '../motion/morph-transition';
import { DURATION, EASE_PREMIUM } from '../motion/entry-motion';
import { RoleChip } from '../primitives/LockedFieldChip';
import { RoleCard } from '../primitives';
import type { UserRole, SectionState } from '../hooks/useEvolvingEntry';

const ROLE_OPTIONS: UserRole[] = ['student', 'faculty', 'alumni'];

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

  // Hidden state
  if (section.status === 'hidden') {
    return null;
  }

  // Unified container with morph animation
  return (
    <motion.div
      layout
      variants={sectionMorphVariants}
      initial={isLocked ? 'collapsed' : 'expanded'}
      animate={isLocked ? 'collapsed' : 'expanded'}
      className="overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {isLocked && role ? (
          // Locked state - compact chip
          <motion.div
            key="locked"
            variants={contentFadeVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-2"
          >
            <p className="text-body-sm text-white/40 font-medium">Role</p>
            <RoleChip role={role} allowChange={false} />
          </motion.div>
        ) : (
          // Active state - role selection
          <motion.div
            key="active"
            variants={contentFadeVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-5"
          >
            {/* Header */}
            <motion.div variants={sectionChildVariants} className="space-y-1">
              <h2
                className="text-title font-semibold text-white"
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
                {ROLE_OPTIONS.map((r) => (
                  <RoleCard
                    key={r}
                    role={r}
                    selected={role === r}
                    onSelect={() => onRoleChange(r)}
                    disabled={isLoading}
                  />
                ))}
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
                        <p className="text-body-sm text-white/50 leading-relaxed">
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
                    <p className="text-body-sm text-white/50 leading-relaxed">
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
                  className="text-body-sm text-red-400"
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
        )}
      </AnimatePresence>
    </motion.div>
  );
}

RoleSection.displayName = 'RoleSection';
