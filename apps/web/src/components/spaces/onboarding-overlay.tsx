'use client';

/**
 * OnboardingOverlay - First-time user onboarding
 *
 * Welcoming overlay that explains HIVE Spaces categories
 * and helps new users find their first communities.
 *
 * Features:
 * - Category explanation with visual icons
 * - Optional identity claiming
 * - Recommended spaces based on identities
 * - Dismissible (stored in localStorage)
 *
 * @version 1.0.0 - Homebase Redesign (Jan 2026)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AcademicCapIcon,
  BuildingLibraryIcon,
  HomeModernIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Text, Button } from '@hive/ui/design-system/primitives';
import { MOTION } from '@hive/tokens';

// ============================================================
// Types
// ============================================================

interface CategoryExplanation {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  examples: string;
}

export interface OnboardingOverlayProps {
  /** Whether overlay is visible */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Optional: Trigger identity claim flow */
  onClaimIdentity?: (type: 'residential' | 'major' | 'greek') => void;
  /** Optional: Show recommended spaces */
  onContinue?: () => void;
}

// ============================================================
// Category Data
// ============================================================

const CATEGORIES: CategoryExplanation[] = [
  {
    id: 'student_orgs',
    icon: <AcademicCapIcon className="w-5 h-5" />,
    label: 'Student Orgs',
    description: 'Clubs, teams, and student-run groups',
    examples: 'Debate Club, Robotics Team, Student Government',
  },
  {
    id: 'university',
    icon: <BuildingLibraryIcon className="w-5 h-5" />,
    label: 'University',
    description: 'Official campus services and departments',
    examples: 'Career Center, Library, Health Services',
  },
  {
    id: 'residential',
    icon: <HomeModernIcon className="w-5 h-5" />,
    label: 'Residential',
    description: 'Dorms, housing communities, and floors',
    examples: 'West Hall, Honors Housing, Floor 3',
  },
  {
    id: 'greek',
    icon: <SparklesIcon className="w-5 h-5" />,
    label: 'Greek Life',
    description: 'Fraternities, sororities, and Greek orgs',
    examples: 'Alpha Beta Gamma, Sigma Delta Pi',
  },
];

// ============================================================
// Category Card
// ============================================================

function CategoryCard({
  category,
  index,
}: {
  category: CategoryExplanation;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.4 + index * 0.1,
        ease: MOTION.ease.premium,
      }}
      className={cn(
        'p-4 rounded-xl',
        'bg-white/[0.02] border border-white/[0.08]',
        'hover:bg-white/[0.04] hover:border-white/[0.12]',
        'transition-all duration-200'
      )}
    >
      {/* Icon + Label */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/60">
          {category.icon}
        </div>
        <Text weight="medium" className="text-white">
          {category.label}
        </Text>
      </div>

      {/* Description */}
      <Text size="sm" className="text-white/50 mb-1">
        {category.description}
      </Text>

      {/* Examples */}
      <Text size="xs" className="text-white/30 italic">
        e.g. {category.examples}
      </Text>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function OnboardingOverlay({
  isOpen,
  onClose,
  onClaimIdentity,
  onContinue,
}: OnboardingOverlayProps) {
  const [step, setStep] = React.useState<'welcome' | 'categories' | 'identity'>(
    'welcome'
  );

  // Reset step when opening
  React.useEffect(() => {
    if (isOpen) {
      setStep('welcome');
    }
  }, [isOpen]);

  const handleSkip = () => {
    // Store that user has seen onboarding
    if (typeof window !== 'undefined') {
      localStorage.setItem('hive_spaces_onboarding_seen', 'true');
    }
    onClose();
  };

  const handleContinue = () => {
    if (step === 'welcome') {
      setStep('categories');
    } else if (step === 'categories') {
      if (onClaimIdentity) {
        setStep('identity');
      } else {
        handleComplete();
      }
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    // Store completion
    if (typeof window !== 'undefined') {
      localStorage.setItem('hive_spaces_onboarding_seen', 'true');
    }
    if (onContinue) {
      onContinue();
    }
    onClose();
  };

  const handleClaimIdentity = (type: 'residential' | 'major' | 'greek') => {
    if (onClaimIdentity) {
      onClaimIdentity(type);
    }
    handleComplete();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleSkip}
          />

          {/* Overlay Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: MOTION.ease.premium }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-2xl mx-auto z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0A0A09] border border-white/[0.12] rounded-2xl p-8 shadow-2xl">
              {/* Close button */}
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                aria-label="Skip onboarding"
              >
                <XMarkIcon className="w-4 h-4 text-white/40" aria-hidden="true" />
              </button>

              {/* Welcome Step */}
              {step === 'welcome' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Badge */}
                  <motion.div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] mb-6"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <SparklesIcon className="w-3.5 h-3.5 text-[var(--color-gold)]/60" />
                    <Text size="xs" className="text-white/60">
                      Welcome to Spaces
                    </Text>
                  </motion.div>

                  {/* Headline */}
                  <motion.h2
                    className="text-heading md:text-heading-lg font-semibold text-white mb-4 tracking-tight leading-[1.1]"
                    style={{ fontFamily: 'var(--font-display)' }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    Your campus homebase
                  </motion.h2>

                  {/* Body */}
                  <motion.p
                    className="text-body-lg md:text-title-sm leading-relaxed text-white/50 mb-8 max-w-lg"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    Spaces is where every club, dorm, and organization on campus lives. Check
                    activity, manage your orgs, and stay connected—all in one place.
                  </motion.p>

                  {/* Actions */}
                  <motion.div
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <Button onClick={handleContinue} size="default">
                      Show me around
                    </Button>
                    <Button onClick={handleSkip} variant="ghost" size="default">
                      Skip intro
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {/* Categories Step */}
              {step === 'categories' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Headline */}
                  <motion.h3
                    className="text-heading-sm md:text-heading font-semibold text-white mb-3 tracking-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    Four types of spaces
                  </motion.h3>

                  <motion.p
                    className="text-body text-white/50 mb-6"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    Every community on campus fits into one of these categories:
                  </motion.p>

                  {/* Category Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                    {CATEGORIES.map((category, index) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        index={index}
                      />
                    ))}
                  </div>

                  {/* Actions */}
                  <motion.div
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.8 }}
                  >
                    <Button onClick={handleContinue} size="default">
                      {onClaimIdentity ? 'Claim your identity' : 'Start exploring'}
                    </Button>
                    <Button onClick={handleSkip} variant="ghost" size="default">
                      Skip
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {/* Identity Step */}
              {step === 'identity' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.h3
                    className="text-heading-sm md:text-heading font-semibold text-white mb-3 tracking-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    Claim your identity
                  </motion.h3>

                  <motion.p
                    className="text-body text-white/50 mb-6"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    Connect your dorm, major, or Greek affiliation to find personalized
                    recommendations. This is optional—you can skip and explore on your own.
                  </motion.p>

                  {/* Identity Options */}
                  <div className="space-y-3 mb-8">
                    <motion.button
                      onClick={() => handleClaimIdentity('residential')}
                      className={cn(
                        'w-full p-4 rounded-xl text-left',
                        'bg-white/[0.02] border border-white/[0.08]',
                        'hover:bg-white/[0.04] hover:border-white/[0.12]',
                        'transition-all duration-200'
                      )}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/60">
                          <HomeModernIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <Text weight="medium" className="text-white">
                            Claim your dorm
                          </Text>
                          <Text size="sm" className="text-white/40">
                            Connect with your floor or building
                          </Text>
                        </div>
                      </div>
                    </motion.button>

                    <motion.button
                      onClick={() => handleClaimIdentity('major')}
                      className={cn(
                        'w-full p-4 rounded-xl text-left',
                        'bg-white/[0.02] border border-white/[0.08]',
                        'hover:bg-white/[0.04] hover:border-white/[0.12]',
                        'transition-all duration-200'
                      )}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/60">
                          <AcademicCapIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <Text weight="medium" className="text-white">
                            Claim your major
                          </Text>
                          <Text size="sm" className="text-white/40">
                            Join your academic community
                          </Text>
                        </div>
                      </div>
                    </motion.button>

                    <motion.button
                      onClick={() => handleClaimIdentity('greek')}
                      className={cn(
                        'w-full p-4 rounded-xl text-left',
                        'bg-white/[0.02] border border-white/[0.08]',
                        'hover:bg-white/[0.04] hover:border-white/[0.12]',
                        'transition-all duration-200'
                      )}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/60">
                          <SparklesIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <Text weight="medium" className="text-white">
                            Claim your Greek org
                          </Text>
                          <Text size="sm" className="text-white/40">
                            Connect with your chapter
                          </Text>
                        </div>
                      </div>
                    </motion.button>
                  </div>

                  {/* Skip option */}
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                  >
                    <Button onClick={handleComplete} variant="ghost" size="default">
                      Skip for now
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default OnboardingOverlay;
