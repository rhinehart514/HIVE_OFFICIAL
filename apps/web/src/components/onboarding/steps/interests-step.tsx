'use client';

import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Plus, ChevronDown, Search } from 'lucide-react';
import { Button } from '@hive/ui';
import {
  containerVariants,
  itemVariants,
} from '../shared/motion';
import {
  UB_INTEREST_CATEGORIES,
  MAX_INTERESTS,
  MAX_INTEREST_LENGTH,
} from '../shared/constants';
import type { OnboardingData } from '../shared/types';

interface InterestsStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
  error: string | null;
  setError: (error: string | null) => void;
  isSubmitting?: boolean;
}

/**
 * Step 3: Interests
 * Category-based selection with authentic UB campus lore
 * 15 categories, ~200+ items - users can pick up to 10
 */
export function InterestsStep({
  data,
  onUpdate,
  onNext,
  onBack,
  error,
  setError,
}: InterestsStepProps) {
  const { interests } = data;
  const [customInput, setCustomInput] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Apply reduced motion to variants
  const safeContainerVariants = shouldReduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : containerVariants;

  const safeItemVariants = shouldReduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : itemVariants;

  // Filter items based on search query across all categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return UB_INTEREST_CATEGORIES;

    const query = searchQuery.toLowerCase();
    return UB_INTEREST_CATEGORIES.map(cat => ({
      ...cat,
      items: cat.items.filter(item => item.toLowerCase().includes(query)),
    })).filter(cat => cat.items.length > 0);
  }, [searchQuery]);

  // Get current category's items (or all if searching)
  const displayedCategory = activeCategory
    ? filteredCategories.find(c => c.id === activeCategory)
    : null;

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      // Remove
      onUpdate({ interests: interests.filter((i) => i !== interest) });
    } else if (interests.length < MAX_INTERESTS) {
      // Add
      onUpdate({ interests: [...interests, interest] });
    }
    setError(null);
  };

  const addCustomInterest = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;

    if (trimmed.length > MAX_INTEREST_LENGTH) {
      setError(`Interest must be ${MAX_INTEREST_LENGTH} characters or less`);
      return;
    }

    if (interests.length >= MAX_INTERESTS) {
      setError(`Maximum ${MAX_INTERESTS} interests allowed`);
      return;
    }

    // Check for duplicates (case-insensitive)
    const lowerTrimmed = trimmed.toLowerCase();
    if (interests.some((i) => i.toLowerCase() === lowerTrimmed)) {
      setError('Already added');
      return;
    }

    onUpdate({ interests: [...interests, trimmed] });
    setCustomInput('');
    setError(null);
    inputRef.current?.focus();
  };

  const removeInterest = (interest: string) => {
    onUpdate({ interests: interests.filter((i) => i !== interest) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomInterest();
    }
  };

  const handleSkip = () => {
    // Clear interests and proceed
    onUpdate({ interests: [] });
    onNext();
  };

  const handleContinue = () => {
    onNext();
  };

  // Total items count for display
  const totalItems = UB_INTEREST_CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <motion.div
      variants={safeContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen flex flex-col justify-center px-4 py-8 md:px-6 md:py-12"
      role="main"
      aria-labelledby="interests-title"
    >
      <div className="w-full max-w-3xl mx-auto">
        {/* Header */}
        <motion.h1
          id="interests-title"
          variants={safeItemVariants}
          className="text-2xl md:text-4xl font-semibold tracking-tight leading-tight mb-2 text-center"
        >
          What are you into?
        </motion.h1>
        <motion.p
          variants={safeItemVariants}
          className="text-center mb-4 text-sm md:text-base"
          style={{ color: 'var(--hive-text-subtle)' }}
        >
          Pick up to {MAX_INTERESTS} to personalize your experience{' '}
          <span style={{ color: 'var(--hive-text-disabled)' }}>(optional)</span>
        </motion.p>

        {/* Selected interests - sticky at top */}
        <AnimatePresence>
          {interests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 sticky top-4 z-10 bg-black/80 backdrop-blur-sm rounded-xl p-3 border border-white/[0.06]"
            >
              <div className="flex flex-wrap gap-1.5 justify-center">
                {interests.map((interest) => (
                  <motion.button
                    key={interest}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={() => removeInterest(interest)}
                    className="group flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-full bg-gold-500/10 border border-gold-500 text-gold-500 text-sm font-medium transition-colors hover:bg-gold-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    aria-label={`Remove ${interest}`}
                  >
                    {interest}
                    <X className="w-4 h-4 opacity-60 group-hover:opacity-100" />
                  </motion.button>
                ))}
              </div>
              <p
                className="text-xs text-center mt-2"
                style={{ color: 'var(--hive-text-subtle)' }}
              >
                {interests.length} of {MAX_INTERESTS} selected
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search bar */}
        <motion.div variants={safeItemVariants} className="mb-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--hive-text-subtle)' }} />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveCategory(null); // Clear category filter when searching
              }}
              placeholder={`Search ${totalItems} interests...`}
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white text-base md:text-sm focus:outline-none focus:border-gold-500/40 focus:ring-2 focus:ring-gold-500/20 transition-all"
              style={{ '--tw-placeholder-opacity': 1 } as React.CSSProperties}
              aria-label="Search interests"
            />
          </div>
        </motion.div>

        {/* Category tabs - horizontal scroll */}
        <motion.div variants={safeItemVariants} className="mb-4">
          {/* Category tabs - 44px min height for touch targets */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                activeCategory === null && !searchQuery
                  ? 'bg-gold-500/10 border border-gold-500 text-gold-500'
                  : 'bg-white/[0.02] border border-white/[0.06] hover:text-white hover:border-white/[0.12]'
              }`}
              style={activeCategory === null && !searchQuery ? {} : { color: 'var(--hive-text-secondary)' }}
            >
              All
            </button>
            {UB_INTEREST_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearchQuery('');
                }}
                className={`shrink-0 px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                  activeCategory === cat.id
                    ? 'bg-gold-500/10 border border-gold-500 text-gold-500'
                    : 'bg-white/[0.02] border border-white/[0.06] hover:text-white hover:border-white/[0.12]'
                }`}
                style={activeCategory === cat.id ? {} : { color: 'var(--hive-text-secondary)' }}
              >
                {cat.icon && <span>{cat.icon}</span>}
                <span className="whitespace-nowrap">{cat.title.split('(')[0].trim()}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Interest items - grid layout */}
        <motion.div variants={safeItemVariants} className="mb-6">
          {searchQuery ? (
            // Search results - show all matching
            <div className="space-y-4">
              {filteredCategories.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--hive-text-subtle)' }}>
                  No interests found for "{searchQuery}"
                </p>
              ) : (
                filteredCategories.map((cat) => (
                  <div key={cat.id} className="space-y-2">
                    <h3 className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--hive-text-subtle)' }}>
                      {cat.icon && <span>{cat.icon}</span>}
                      {cat.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {cat.items.map((item) => {
                        const isSelected = interests.includes(item);
                        const isDisabled = !isSelected && interests.length >= MAX_INTERESTS;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleInterest(item)}
                            disabled={isDisabled}
                            className={`px-3 py-2 min-h-[44px] rounded-full text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                              isSelected
                                ? 'bg-gold-500/10 border border-gold-500 text-gold-500'
                                : isDisabled
                                ? 'bg-white/[0.02] border border-white/[0.08] opacity-40 cursor-not-allowed'
                                : 'bg-white/[0.02] border border-white/[0.06] hover:text-white hover:border-white/[0.12]'
                            }`}
                            style={isSelected ? {} : { color: isDisabled ? 'var(--hive-text-subtle)' : 'var(--hive-text-secondary)' }}
                            aria-pressed={isSelected}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeCategory && displayedCategory ? (
            // Single category view
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--hive-text-secondary)' }}>
                {displayedCategory.icon && <span className="text-lg">{displayedCategory.icon}</span>}
                {displayedCategory.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                {displayedCategory.items.map((item) => {
                  const isSelected = interests.includes(item);
                  const isDisabled = !isSelected && interests.length >= MAX_INTERESTS;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleInterest(item)}
                      disabled={isDisabled}
                      className={`px-3 py-2 min-h-[44px] rounded-full text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                        isSelected
                          ? 'bg-gold-500/10 border border-gold-500 text-gold-500'
                          : isDisabled
                          ? 'bg-white/[0.02] border border-white/[0.08] opacity-40 cursor-not-allowed'
                          : 'bg-white/[0.02] border border-white/[0.06] hover:text-white hover:border-white/[0.12]'
                      }`}
                      style={isSelected ? {} : { color: isDisabled ? 'var(--hive-text-subtle)' : 'var(--hive-text-secondary)' }}
                      aria-pressed={isSelected}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            // All categories - compact view showing first few items each
            <div className="space-y-5 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent" style={{ scrollbarColor: 'var(--hive-text-disabled) transparent' }}>
              {UB_INTEREST_CATEGORIES.map((cat) => (
                <div key={cat.id} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className="text-sm font-medium flex items-center gap-1.5 hover:text-white transition-colors group min-h-[44px] py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg"
                    style={{ color: 'var(--hive-text-subtle)' }}
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    <span>{cat.title}</span>
                    <span className="group-hover:opacity-80" style={{ color: 'var(--hive-text-disabled)' }}>
                      ({cat.items.length})
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {cat.items.slice(0, 5).map((item) => {
                      const isSelected = interests.includes(item);
                      const isDisabled = !isSelected && interests.length >= MAX_INTERESTS;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleInterest(item)}
                          disabled={isDisabled}
                          className={`px-3 py-2 min-h-[44px] rounded-full text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                            isSelected
                              ? 'bg-gold-500/10 border border-gold-500 text-gold-500'
                              : isDisabled
                              ? 'bg-white/[0.02] border border-white/[0.08] opacity-40 cursor-not-allowed'
                              : 'bg-white/[0.02] border border-white/[0.06] hover:text-white hover:border-white/[0.12]'
                          }`}
                          style={isSelected ? {} : { color: 'var(--hive-text-subtle)' }}
                          aria-pressed={isSelected}
                        >
                          {item}
                        </button>
                      );
                    })}
                    {cat.items.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className="px-3 py-2 min-h-[44px] rounded-full text-sm font-medium bg-white/[0.02] border border-white/[0.06] hover:text-gold-500 hover:border-gold-500/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        style={{ color: 'var(--hive-text-subtle)' }}
                      >
                        +{cat.items.length - 5} more
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Custom interest input */}
        <motion.div variants={safeItemVariants} className="mb-6">
          <div className="flex items-center gap-2 max-w-sm mx-auto">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={customInput}
                onChange={(e) => {
                  setCustomInput(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Add your own..."
                maxLength={MAX_INTEREST_LENGTH}
                disabled={interests.length >= MAX_INTERESTS}
                className="w-full h-10 px-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white text-base md:text-sm focus:outline-none focus:border-gold-500/40 focus:ring-2 focus:ring-gold-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ '--tw-placeholder-opacity': 1 } as React.CSSProperties}
                aria-label="Add custom interest"
              />
            </div>
            <button
              type="button"
              onClick={addCustomInterest}
              disabled={!customInput.trim() || interests.length >= MAX_INTERESTS}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.06] hover:text-white hover:border-white/[0.12] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              style={{ color: 'var(--hive-text-secondary)' }}
              aria-label="Add interest"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-sm font-medium text-red-400 text-center mb-6"
              role="alert"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Actions */}
        <motion.div
          variants={safeItemVariants}
          className="flex flex-col items-center gap-4"
        >
          <Button onClick={handleContinue} showArrow size="lg">
            {interests.length > 0 ? 'Continue' : 'Next'}
          </Button>

          <button
            type="button"
            onClick={handleSkip}
            className="text-sm hover:text-white transition-colors underline underline-offset-2"
            style={{ color: 'var(--hive-text-subtle)' }}
          >
            Skip for now
          </button>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-sm hover:text-white transition-colors"
              style={{ color: 'var(--hive-text-disabled)' }}
            >
              Back
            </button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
