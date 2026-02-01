'use client';

/**
 * PassionsScene - "What drives you?"
 *
 * Act III, Scene 1: Interests Selection
 * Apple-like horizontal carousel with category navigation.
 *
 * - Swipeable interest chips by category
 * - Category dots for quick jumps
 * - Gold chips for selected state
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  sceneMorphVariants,
  sceneChildVariants,
  headlineVariants,
  errorMessageVariants,
} from '../motion/scene-transitions';
import { DURATION, EASE_PREMIUM, GOLD, SPRING_SNAPPY } from '../motion/entry-motion';

// Interest categories with their items
const INTEREST_CATEGORIES = [
  {
    id: 'building',
    label: 'Building',
    interests: ['Engineering', 'Design', 'Product', 'Research', 'Data Science', 'AI/ML'],
  },
  {
    id: 'creative',
    label: 'Creative',
    interests: ['Photography', 'Film', 'Music', 'Writing', 'Art', 'Gaming'],
  },
  {
    id: 'impact',
    label: 'Impact',
    interests: ['Entrepreneurship', 'Social Impact', 'Sustainability', 'Healthcare', 'Education', 'Policy'],
  },
  {
    id: 'community',
    label: 'Community',
    interests: ['Sports', 'Fitness', 'Outdoors', 'Food', 'Travel', 'Volunteering'],
  },
];

interface PassionsSceneProps {
  interests: string[];
  onInterestsChange: (interests: string[]) => void;
  onComplete: () => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export function PassionsScene({
  interests,
  onInterestsChange,
  onComplete,
  isLoading,
  error,
}: PassionsSceneProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = React.useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      onInterestsChange(interests.filter((i) => i !== interest));
    } else if (interests.length < 5) {
      onInterestsChange([...interests, interest]);
    }
  };

  const handleComplete = async () => {
    if (interests.length >= 2) {
      await onComplete();
    }
  };

  const goToCategory = (index: number) => {
    setActiveCategory(index);
  };

  const goToPrev = () => {
    setActiveCategory((prev) => (prev > 0 ? prev - 1 : INTEREST_CATEGORIES.length - 1));
  };

  const goToNext = () => {
    setActiveCategory((prev) => (prev < INTEREST_CATEGORIES.length - 1 ? prev + 1 : 0));
  };

  const currentCategory = INTEREST_CATEGORIES[activeCategory];
  const canContinue = interests.length >= 2;
  const atLimit = interests.length >= 5;

  // Count selected in each category
  const categorySelectionCounts = INTEREST_CATEGORIES.map(
    (cat) => cat.interests.filter((i) => interests.includes(i)).length
  );

  return (
    <motion.div
      variants={sceneMorphVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Headline */}
      <motion.div variants={sceneChildVariants} className="space-y-3">
        <motion.h1
          variants={headlineVariants}
          className="text-title-lg font-semibold text-white tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          What drives you?
        </motion.h1>

        <motion.p
          variants={sceneChildVariants}
          className="text-body text-white/50"
        >
          Pick 2-5 that resonate.
        </motion.p>
      </motion.div>

      {/* Category carousel */}
      <motion.div variants={sceneChildVariants} className="space-y-4">
        {/* Category header with arrows */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrev}
            className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/40 hover:bg-white/[0.08] hover:text-white/60 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <motion.div
            key={currentCategory.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-body font-medium text-white">
              {currentCategory.label}
            </p>
            {categorySelectionCounts[activeCategory] > 0 && (
              <p className="text-label text-white/40">
                {categorySelectionCounts[activeCategory]} selected
              </p>
            )}
          </motion.div>

          <button
            onClick={goToNext}
            className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/40 hover:bg-white/[0.08] hover:text-white/60 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Interest chips for current category */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCategory.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
            className="flex flex-wrap justify-center gap-2 min-h-[88px]"
          >
            {currentCategory.interests.map((interest, index) => {
              const isSelected = interests.includes(interest);
              const isDisabled = atLimit && !isSelected;

              return (
                <motion.button
                  key={interest}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: index * 0.04,
                    duration: DURATION.smooth,
                    ease: EASE_PREMIUM,
                  }}
                  onClick={() => toggleInterest(interest)}
                  disabled={isDisabled || isLoading}
                  className={cn(
                    'px-4 py-2 rounded-full border text-body-sm font-medium transition-all duration-200',
                    'disabled:opacity-30 disabled:cursor-not-allowed',
                    isSelected
                      ? 'border-transparent'
                      : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:bg-white/[0.06]'
                  )}
                  style={
                    isSelected
                      ? {
                          backgroundColor: `${GOLD.primary}1a`,
                          borderColor: `${GOLD.primary}40`,
                          color: GOLD.light,
                        }
                      : undefined
                  }
                >
                  {interest}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Category dots */}
        <div className="flex justify-center gap-2">
          {INTEREST_CATEGORIES.map((cat, index) => {
            const hasSelection = categorySelectionCounts[index] > 0;
            const isActive = index === activeCategory;

            return (
              <button
                key={cat.id}
                onClick={() => goToCategory(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  isActive
                    ? 'bg-white w-4'
                    : hasSelection
                    ? 'bg-white/40'
                    : 'bg-white/20 hover:bg-white/30'
                )}
                style={
                  hasSelection && !isActive
                    ? { backgroundColor: `${GOLD.primary}80` }
                    : undefined
                }
              />
            );
          })}
        </div>
      </motion.div>

      {/* Selected interests summary */}
      <AnimatePresence>
        {interests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-body-sm text-white/40">Your picks</p>
                <p className="text-label text-white/30">{interests.length}/5</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <motion.button
                    key={interest}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={SPRING_SNAPPY}
                    onClick={() => toggleInterest(interest)}
                    className="group px-3 py-1.5 rounded-full text-body-sm font-medium flex items-center gap-1.5"
                    style={{
                      backgroundColor: `${GOLD.primary}1a`,
                      border: `1px solid ${GOLD.primary}40`,
                      color: GOLD.light,
                    }}
                  >
                    {interest}
                    <span className="text-white/40 group-hover:text-white/60 transition-colors">
                      ×
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            variants={errorMessageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-body-sm text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* CTA */}
      <motion.div variants={sceneChildVariants}>
        <Button
          variant={canContinue ? 'cta' : 'default'}
          size="lg"
          onClick={handleComplete}
          disabled={!canContinue || isLoading}
          loading={isLoading}
          className="w-full"
        >
          {isLoading
            ? 'Setting up your profile...'
            : canContinue
            ? 'Complete setup'
            : `Pick ${2 - interests.length} more`}
        </Button>
      </motion.div>
    </motion.div>
  );
}

PassionsScene.displayName = 'PassionsScene';
