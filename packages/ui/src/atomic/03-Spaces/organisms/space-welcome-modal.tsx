'use client';

/**
 * SpaceWelcomeModal - First-time member onboarding modal
 *
 * Shown to new members on their first visit to a space. Provides:
 * 1. Space description and leaders introduction
 * 2. Key features (events, tools, discussions)
 * 3. Community guidelines (if any)
 * 4. CTA to send first message
 *
 * Features:
 * - Multi-step carousel with smooth transitions
 * - Progress indicators
 * - Skip option for returning users
 * - LocalStorage persistence for "seen" state
 * - Gold celebration on completion
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  X,
  Users,
  Calendar,
  Wrench,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../00-Global/atoms/button';
import { tinderSprings, easingArrays } from '@hive/tokens';

// ============================================================
// Types
// ============================================================

export interface SpaceLeaderInfo {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: string;
}

export interface SpaceFeatureHighlight {
  type: 'events' | 'tools' | 'discussions' | 'custom';
  title: string;
  description: string;
  count?: number;
  /** Custom icon (only for type='custom') */
  icon?: React.ReactNode;
}

export interface SpaceWelcomeData {
  /** Space name */
  name: string;
  /** Space description */
  description?: string;
  /** Category (for context) */
  category?: string;
  /** Space icon/logo */
  iconUrl?: string;
  /** Banner image */
  bannerUrl?: string;
  /** Leader information */
  leaders: SpaceLeaderInfo[];
  /** Member count */
  memberCount: number;
  /** Feature highlights to show */
  features: SpaceFeatureHighlight[];
  /** Community guidelines (if any) */
  guidelines?: string[];
}

export interface SpaceWelcomeModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Space data to display */
  data: SpaceWelcomeData;
  /** Callback when user completes welcome flow */
  onComplete?: () => void;
  /** Callback when user clicks "Send first message" */
  onStartChatting?: () => void;
  /** Storage key for persistence (defaults to space-specific key) */
  storageKey?: string;
  /** Additional className */
  className?: string;
}

// ============================================================
// Step Components
// ============================================================

interface StepProps {
  data: SpaceWelcomeData;
  onNext: () => void;
  onBack?: () => void;
  isLastStep?: boolean;
  onComplete?: () => void;
  onStartChatting?: () => void;
}

// Step 1: Welcome & Overview
function WelcomeStep({ data, onNext }: StepProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-8">
      {/* Space avatar/icon */}
      <div className="relative mb-6">
        {data.iconUrl ? (
          <img
            src={data.iconUrl}
            alt={data.name}
            className="w-20 h-20 rounded-2xl object-cover shadow-lg shadow-black/30"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#FFD700]/70 flex items-center justify-center shadow-lg shadow-[#FFD700]/20">
            <span className="text-3xl font-bold text-black">
              {data.name.charAt(0)}
            </span>
          </div>
        )}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#FFD700] flex items-center justify-center shadow-lg"
        >
          <Sparkles className="w-4 h-4 text-black" />
        </motion.div>
      </div>

      {/* Welcome message */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold text-white mb-2"
      >
        Welcome to {data.name}!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-neutral-400 text-sm mb-6 max-w-xs"
      >
        {data.description || `You're now a member of ${data.name}. Let's get you started!`}
      </motion.p>

      {/* Quick stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4 text-sm text-neutral-300 mb-8"
      >
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-[#FFD700]" />
          <span>{data.memberCount.toLocaleString()} members</span>
        </div>
        {data.category && (
          <div className="px-2 py-0.5 bg-neutral-800 rounded-full text-xs capitalize">
            {data.category}
          </div>
        )}
      </motion.div>

      {/* Leaders */}
      {data.leaders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full"
        >
          <p className="text-xs text-neutral-500 mb-3">Meet the leaders</p>
          <div className="flex justify-center gap-3">
            {data.leaders.slice(0, 3).map((leader) => (
              <div
                key={leader.id}
                className="flex flex-col items-center gap-1.5"
              >
                {leader.avatarUrl ? (
                  <img
                    src={leader.avatarUrl}
                    alt={leader.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-neutral-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-sm font-medium text-neutral-300">
                    {leader.name.charAt(0)}
                  </div>
                )}
                <span className="text-xs text-neutral-400 truncate max-w-[60px]">
                  {leader.name}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Continue button */}
      <Button
        onClick={onNext}
        className="mt-8 w-full max-w-xs"
        variant="brand"
      >
        Continue
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

// Step 2: Features
function FeaturesStep({ data, onNext, onBack }: StepProps) {
  const getFeatureIcon = (type: SpaceFeatureHighlight['type']) => {
    switch (type) {
      case 'events':
        return <Calendar className="w-5 h-5" />;
      case 'tools':
        return <Wrench className="w-5 h-5" />;
      case 'discussions':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getFeatureColor = (type: SpaceFeatureHighlight['type']) => {
    switch (type) {
      case 'events':
        return 'text-green-400 bg-green-400/10';
      case 'tools':
        return 'text-blue-400 bg-blue-400/10';
      case 'discussions':
        return 'text-purple-400 bg-purple-400/10';
      default:
        return 'text-[#FFD700] bg-[#FFD700]/10';
    }
  };

  return (
    <div className="px-6 py-8">
      <h2 className="text-xl font-bold text-white text-center mb-2">
        What you can do here
      </h2>
      <p className="text-neutral-400 text-sm text-center mb-6">
        Explore everything {data.name} has to offer
      </p>

      {/* Features grid */}
      <div className="space-y-3 mb-8">
        {data.features.map((feature, index) => (
          <motion.div
            key={feature.type + index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-neutral-800/50 border border-white/5"
          >
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                getFeatureColor(feature.type)
              )}
            >
              {feature.icon || getFeatureIcon(feature.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white text-sm">
                  {feature.title}
                </span>
                {feature.count !== undefined && (
                  <span className="text-xs text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded-full">
                    {feature.count}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="ghost"
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={onNext}
          variant="brand"
          className="flex-1"
        >
          Continue
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// Step 3: Guidelines & CTA
function GuidelinesStep({ data, onBack, onComplete, onStartChatting }: StepProps) {
  return (
    <div className="px-6 py-8">
      {data.guidelines && data.guidelines.length > 0 ? (
        <>
          <h2 className="text-xl font-bold text-white text-center mb-2">
            Community Guidelines
          </h2>
          <p className="text-neutral-400 text-sm text-center mb-6">
            A few things to keep in mind
          </p>

          {/* Guidelines list */}
          <div className="space-y-2 mb-8">
            {data.guidelines.map((guideline, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-neutral-800/30"
              >
                <Check className="w-4 h-4 text-[#FFD700] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-neutral-300">{guideline}</span>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-full bg-[#FFD700]/10 flex items-center justify-center mx-auto mb-4"
          >
            <MessageSquare className="w-8 h-8 text-[#FFD700]" />
          </motion.div>
          <h2 className="text-xl font-bold text-white mb-2">
            You're all set!
          </h2>
          <p className="text-neutral-400 text-sm">
            Start chatting with the community
          </p>
        </div>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <Button
          onClick={() => {
            onComplete?.();
            onStartChatting?.();
          }}
          variant="brand"
          className="w-full h-12 text-base shadow-lg shadow-[#FFD700]/20"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Send your first message
        </Button>

        <div className="flex gap-3">
          <Button
            onClick={onBack}
            variant="ghost"
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Button
            onClick={onComplete}
            variant="outline"
            className="flex-1"
          >
            Maybe later
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function SpaceWelcomeModal({
  open,
  onClose,
  data,
  onComplete,
  onStartChatting,
  storageKey,
  className,
}: SpaceWelcomeModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = React.useState(0);

  // Determine number of steps based on data
  const hasFeatures = data.features.length > 0;
  const totalSteps = hasFeatures ? 3 : 2;

  // Handle step navigation
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    // Mark as seen in localStorage
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(`space-welcome-${storageKey}`, 'true');
    }
    onComplete?.();
    onClose();
  };

  // Reset step when opening
  React.useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  // Render current step
  const renderStep = () => {
    const stepProps: StepProps = {
      data,
      onNext: handleNext,
      onBack: handleBack,
      isLastStep: currentStep === totalSteps - 1,
      onComplete: handleComplete,
      onStartChatting,
    };

    if (currentStep === 0) {
      return <WelcomeStep {...stepProps} />;
    }

    if (hasFeatures && currentStep === 1) {
      return <FeaturesStep {...stepProps} />;
    }

    return <GuidelinesStep {...stepProps} />;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={
              shouldReduceMotion
                ? { duration: 0.1 }
                : tinderSprings.settle
            }
            className={cn(
              'fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-full max-w-md',
              'bg-neutral-900 border border-white/10 rounded-2xl',
              'shadow-2xl shadow-black/50',
              'overflow-hidden',
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-label={`Welcome to ${data.name}`}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className={cn(
                'absolute top-4 right-4 z-10',
                'w-8 h-8 rounded-full flex items-center justify-center',
                'text-neutral-400 hover:text-white hover:bg-white/10',
                'transition-colors'
              )}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Banner (optional) */}
            {data.bannerUrl && (
              <div className="h-24 relative overflow-hidden">
                <img
                  src={data.bannerUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent" />
              </div>
            )}

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0.1 }
                    : { duration: 0.2, ease: easingArrays.silk }
                }
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 pb-6">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    index === currentStep
                      ? 'bg-[#FFD700] scale-125'
                      : 'bg-neutral-700 hover:bg-neutral-600'
                  )}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Helper Hook
// ============================================================

/**
 * Hook to check if welcome modal should be shown for a space
 */
export function useSpaceWelcome(spaceId: string) {
  const [shouldShow, setShouldShow] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const hasSeenWelcome = localStorage.getItem(`space-welcome-${spaceId}`);
    setShouldShow(!hasSeenWelcome);
    setIsLoading(false);
  }, [spaceId]);

  const markAsSeen = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`space-welcome-${spaceId}`, 'true');
      setShouldShow(false);
    }
  }, [spaceId]);

  const reset = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`space-welcome-${spaceId}`);
      setShouldShow(true);
    }
  }, [spaceId]);

  return {
    shouldShow,
    isLoading,
    markAsSeen,
    reset,
  };
}

export default SpaceWelcomeModal;
