'use client';

/**
 * RoleState - Role Selection Step
 *
 * After email verification, users select their role:
 * - Student: Full access, continues to identity setup
 * - Faculty: Limited to university org spaces only
 * - Alumni: Coming soon + asks about past space memberships
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Briefcase, Users, ArrowRight, Clock } from 'lucide-react';
import { Button, Input } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  stateVariants,
  childVariants,
  EASE_PREMIUM,
  DURATION,
  GOLD,
} from '../motion/entry-motion';

export type UserRole = 'student' | 'faculty' | 'alumni';

export interface RoleStateProps {
  /** Selected role */
  role: UserRole | null;
  /** Role change handler */
  onRoleChange: (role: UserRole) => void;
  /** Submit handler */
  onSubmit: () => void;
  /** Alumni space input value */
  alumniSpace: string;
  /** Alumni space change handler */
  onAlumniSpaceChange: (space: string) => void;
  /** Error message */
  error: string | null;
  /** Loading state */
  isLoading: boolean;
}

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
    description: 'Currently enrolled at this campus',
  },
  {
    id: 'faculty',
    icon: Briefcase,
    label: 'Faculty Lead or Staff',
    description: 'Manage your department or organization presence',
  },
  {
    id: 'alumni',
    icon: Users,
    label: 'Alumni',
    description: 'Graduated from this campus',
    badge: 'Coming Soon',
  },
];

export function RoleState({
  role,
  onRoleChange,
  onSubmit,
  alumniSpace,
  onAlumniSpaceChange,
  error,
  isLoading,
}: RoleStateProps) {
  const canSubmit = role && !isLoading && (role !== 'alumni' || alumniSpace.trim());

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
        <h1 className="text-heading-sm font-semibold tracking-tight text-white">
          How are you connected?
        </h1>
        <p className="text-body leading-relaxed text-white/50">
          Select your role at this campus
        </p>
      </motion.div>

      {/* Role options */}
      <motion.div variants={childVariants} className="space-y-3">
        {ROLE_OPTIONS.map((option) => {
          const isSelected = role === option.id;
          const Icon = option.icon;

          return (
            <motion.button
              key={option.id}
              onClick={() => onRoleChange(option.id)}
              disabled={isLoading}
              className={cn(
                'w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all',
                'border bg-white/[0.02] hover:bg-white/[0.04]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-ground)]',
                isSelected
                  ? 'border-white/20 bg-white/[0.06]'
                  : 'border-white/[0.06]'
              )}
              whileTap={{ opacity: 0.9 }}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  isSelected ? 'bg-white/10' : 'bg-white/[0.04]'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5',
                    isSelected ? 'text-white' : 'text-white/50'
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-body font-medium',
                      isSelected ? 'text-white' : 'text-white/80'
                    )}
                  >
                    {option.label}
                  </span>
                  {option.badge && (
                    <span className="px-2 py-0.5 text-label-xs font-medium uppercase tracking-wide rounded-full bg-white/[0.06] text-white/40">
                      {option.badge}
                    </span>
                  )}
                </div>
                <p className="text-body-sm text-white/40 mt-0.5">
                  {option.description}
                </p>
              </div>

              {/* Selection indicator */}
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                  isSelected ? 'border-white bg-white' : 'border-white/20'
                )}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full bg-black"
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Alumni additional input */}
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
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-body text-white/70">
                      Alumni access is coming soon.
                    </p>
                    <p className="text-body-sm text-white/40 mt-1">
                      Tell us which spaces you were part of, and we'll notify you
                      when your communities are ready to welcome you back.
                    </p>
                  </div>
                </div>
              </div>

              <Input
                value={alumniSpace}
                onChange={(e) => onAlumniSpaceChange(e.target.value)}
                placeholder="e.g., UB Debate Club, CS Student Association"
                disabled={isLoading}
                size="lg"
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
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <p className="text-body-sm text-white/50">
                Faculty accounts have access to official university organization
                spaces. You'll be able to claim and manage your department's
                presence on HIVE.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: DURATION.fast, ease: EASE_PREMIUM }}
          >
            <p className="text-sm text-red-400/90">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continue button */}
      <motion.div variants={childVariants}>
        <Button
          onClick={onSubmit}
          disabled={!canSubmit}
          size="lg"
          className="w-full"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
              {role === 'alumni' ? 'Saving' : 'Continuing'}
            </span>
          ) : role === 'alumni' ? (
            <span className="flex items-center gap-2">
              Join waitlist
              <ArrowRight className="w-4 h-4" />
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Continue
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}

RoleState.displayName = 'RoleState';
