'use client';

/**
 * RoleScene - "What are you here for?"
 *
 * Act II, Scene 1: Role Selection
 * An earned moment - the user has proven they belong, now they claim their role.
 *
 * Headline: "What are you here for?"
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button, Textarea } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  sceneMorphVariants,
  sceneChildVariants,
  headlineVariants,
} from '../motion/scene-transitions';
import { DURATION, EASE_PREMIUM, GOLD, SPRING_SNAPPY } from '../motion/entry-motion';
import type { UserRole } from '../hooks/useEvolvingEntry';

interface RoleOption {
  id: UserRole;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'student',
    label: 'Student',
    description: 'Building something new',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    id: 'faculty',
    label: 'Faculty',
    description: 'Teaching or research',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    id: 'alumni',
    label: 'Alumni',
    description: 'Reconnecting with campus',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
];

interface RoleSceneProps {
  role: UserRole | null;
  alumniSpace: string;
  onRoleSelect: (role: UserRole) => void;
  onAlumniSpaceChange: (space: string) => void;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export function RoleScene({
  role,
  alumniSpace,
  onRoleSelect,
  onAlumniSpaceChange,
  onSubmit,
  isLoading,
  error,
}: RoleSceneProps) {
  const shouldReduceMotion = useReducedMotion();

  const handleContinue = async () => {
    if (role) {
      await onSubmit();
    }
  };

  const isAlumni = role === 'alumni';
  const canContinue = role && (!isAlumni || alumniSpace.trim());

  return (
    <motion.div
      variants={sceneMorphVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8"
    >
      {/* Headline */}
      <motion.div variants={sceneChildVariants} className="space-y-3">
        <motion.h1
          variants={headlineVariants}
          className="text-title-lg font-semibold text-white tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          What are you here for?
        </motion.h1>
      </motion.div>

      {/* Role options */}
      <motion.div variants={sceneChildVariants} className="grid gap-3">
        {ROLE_OPTIONS.map((option, index) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: DURATION.gentle,
              delay: 0.2 + index * 0.1,
              ease: EASE_PREMIUM,
            }}
            onClick={() => onRoleSelect(option.id)}
            disabled={isLoading}
            className={cn(
              'w-full p-4 rounded-xl border text-left transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              role === option.id
                ? 'border-white/30 bg-white/[0.08]'
                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
            )}
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div
                className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center transition-colors',
                  role === option.id
                    ? 'bg-white/10 text-white'
                    : 'bg-white/[0.04] text-white/50'
                )}
              >
                {option.icon}
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-body font-medium transition-colors',
                  role === option.id ? 'text-white' : 'text-white/80'
                )}>
                  {option.label}
                </p>
                <p className="text-body-sm text-white/40">
                  {option.description}
                </p>
              </div>

              {/* Selection indicator */}
              {role === option.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={SPRING_SNAPPY}
                  className="w-5 h-5 rounded-full bg-white flex items-center justify-center"
                >
                  <svg
                    className="w-3 h-3 text-[var(--color-bg-void)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Alumni space input */}
      <AnimatePresence>
        {isAlumni && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE_PREMIUM }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-2">
              <label className="text-body-sm text-white/60">
                What spaces were you part of?
              </label>
              <Textarea
                value={alumniSpace}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onAlumniSpaceChange(e.target.value)}
                placeholder="e.g., Computer Science Club, Debate Team..."
                rows={2}
                disabled={isLoading}
                className="w-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-body-sm text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* CTA */}
      <motion.div variants={sceneChildVariants}>
        <Button
          variant="cta"
          size="lg"
          onClick={handleContinue}
          disabled={!canContinue || isLoading}
          loading={isLoading}
          className="w-full"
        >
          {isLoading ? 'Setting up...' : 'Continue'}
        </Button>
      </motion.div>
    </motion.div>
  );
}

RoleScene.displayName = 'RoleScene';
