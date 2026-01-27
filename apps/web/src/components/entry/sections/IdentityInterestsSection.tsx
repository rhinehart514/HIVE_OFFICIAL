'use client';

/**
 * IdentityInterestsSection - Step 4 of paginated identity flow
 *
 * Category-based interest selection for 150+ items.
 * Organized into collapsible categories.
 * Requires 2-5 selections before advancing.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, Search } from 'lucide-react';
import { Button } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  sectionEnterVariants,
  sectionChildVariants,
  errorInlineVariants,
} from '../motion/section-motion';
import { StepCounter } from '../primitives';
import type { SectionState } from '../hooks/useEvolvingEntry';

// Interest category type
interface InterestCategory {
  id: string;
  title: string;
  icon?: string;
  items: string[];
}

interface IdentityInterestsSectionProps {
  section: SectionState;
  interests: string[];
  categories: InterestCategory[];
  onInterestsChange: (interests: string[]) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export function IdentityInterestsSection({
  section,
  interests,
  categories,
  onInterestsChange,
  onSubmit,
  isLoading = false,
}: IdentityInterestsSectionProps) {
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const hasError = !!section.error;
  const minInterests = 2;
  const maxInterests = 5;

  const canSubmit = interests.length >= minInterests && interests.length <= maxInterests && !isLoading;

  // Toggle interest selection
  const toggleInterest = React.useCallback(
    (interest: string) => {
      if (interests.includes(interest)) {
        onInterestsChange(interests.filter((i) => i !== interest));
      } else if (interests.length < maxInterests) {
        onInterestsChange([...interests, interest]);
      }
    },
    [interests, onInterestsChange, maxInterests]
  );

  // Remove interest
  const removeInterest = React.useCallback(
    (interest: string) => {
      onInterestsChange(interests.filter((i) => i !== interest));
    },
    [interests, onInterestsChange]
  );

  // Filter categories and items based on search
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => item.toLowerCase().includes(query)),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, searchQuery]);

  // Auto-expand first category with results when searching
  React.useEffect(() => {
    if (searchQuery && filteredCategories.length > 0 && !expandedCategory) {
      setExpandedCategory(filteredCategories[0].id);
    }
  }, [searchQuery, filteredCategories, expandedCategory]);

  if (section.status === 'hidden' || section.status === 'locked' || section.status === 'complete') {
    return null;
  }

  return (
    <motion.div
      variants={sectionEnterVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-5"
    >
      {/* Progress indicator */}
      <motion.div variants={sectionChildVariants}>
        <StepCounter current={4} total={4} />
      </motion.div>

      {/* Header */}
      <motion.div variants={sectionChildVariants} className="space-y-2">
        <h2
          className="text-title-lg font-semibold text-white tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          What are you into?
        </h2>
        <p className="text-body text-white/40 leading-relaxed">
          Select {minInterests}-{maxInterests} things that describe you
        </p>
      </motion.div>

      {/* Selected interests - chips at top */}
      <AnimatePresence mode="popLayout">
        {interests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-white/50">
                Selected ({interests.length}/{maxInterests})
              </span>
              {interests.length >= minInterests && (
                <span className="text-body-sm text-[var(--life-gold)]">
                  Ready to continue
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <motion.button
                  key={interest}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => removeInterest(interest)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-body-sm font-medium',
                    'bg-white/10 border border-white/20 text-white',
                    'hover:bg-white/15 transition-colors'
                  )}
                >
                  <span>{interest}</span>
                  <X size={14} className="text-white/50" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <motion.div variants={sectionChildVariants}>
        <div
          className={cn(
            'flex items-center h-11 px-3 rounded-xl border transition-all duration-200',
            'bg-white/[0.03] border-white/[0.08]',
            'focus-within:bg-white/[0.05] focus-within:border-[var(--color-gold)]/30',
            'focus-within:shadow-[0_0_0_4px_rgba(255,215,0,0.06)]'
          )}
        >
          <Search className="w-4 h-4 text-white/30 mr-2 flex-shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search interests..."
            disabled={isLoading}
            className={cn(
              'w-full bg-transparent text-body-sm text-white',
              'placeholder:text-white/25',
              'focus:outline-none',
              'disabled:opacity-50'
            )}
          />
        </div>
      </motion.div>

      {/* Categories - accordion style */}
      <motion.div
        variants={sectionChildVariants}
        className="space-y-2 max-h-[300px] overflow-y-auto pr-1"
      >
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8 text-body-sm text-white/30">
            No interests found for "{searchQuery}"
          </div>
        ) : (
          filteredCategories.map((category) => {
            const isExpanded = expandedCategory === category.id;
            const selectedInCategory = category.items.filter((item) =>
              interests.includes(item)
            ).length;

            return (
              <div
                key={category.id}
                className="border border-white/[0.08] rounded-xl overflow-hidden"
              >
                {/* Category header */}
                <button
                  type="button"
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 transition-colors',
                    'hover:bg-white/[0.03]',
                    isExpanded && 'bg-white/[0.02]'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {category.icon && <span className="text-lg">{category.icon}</span>}
                    <span className="text-body-sm font-medium text-white/80">
                      {category.title}
                    </span>
                    {selectedInCategory > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--life-gold)]/20 text-[var(--life-gold)]">
                        {selectedInCategory}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-white/40 transition-transform',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </button>

                {/* Category items */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                        {category.items.map((item) => {
                          const isSelected = interests.includes(item);
                          const isDisabled = !isSelected && interests.length >= maxInterests;

                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleInterest(item)}
                              disabled={isLoading || isDisabled}
                              className={cn(
                                'px-2.5 py-1.5 rounded-lg text-body-xs font-medium transition-all duration-150',
                                'border focus:outline-none',
                                isSelected
                                  ? 'bg-white/10 border-white/20 text-white'
                                  : 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:bg-white/[0.04] hover:border-white/[0.08] hover:text-white/70',
                                'disabled:opacity-30 disabled:cursor-not-allowed'
                              )}
                            >
                              {item}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {hasError && (
          <motion.p
            variants={errorInlineVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-body-sm text-red-400/90"
          >
            {section.error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* CTA */}
      <motion.div variants={sectionChildVariants}>
        <Button
          variant="cta"
          size="lg"
          onClick={onSubmit}
          disabled={!canSubmit}
          loading={isLoading}
          className="w-full"
        >
          {isLoading ? 'Setting up...' : 'Continue'}
        </Button>
      </motion.div>

      {/* Manifesto line */}
      <motion.p
        variants={sectionChildVariants}
        className="text-body-sm text-white/30 text-center"
      >
        Connect with what matters.
      </motion.p>
    </motion.div>
  );
}

IdentityInterestsSection.displayName = 'IdentityInterestsSection';
