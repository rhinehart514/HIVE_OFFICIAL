'use client';

/**
 * FieldScene - "What are you building in?"
 *
 * Act II, Scene 4: Major/Year Selection
 * Apple-like sleek selection - no dropdowns.
 *
 * - Year: Horizontal tap chips
 * - Major: Search input with popular suggestions
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import { ManifestoLine } from '../primitives/ManifestoLine';
import {
  sceneMorphVariants,
  sceneChildVariants,
  headlineVariants,
  subtextVariants,
  errorMessageVariants,
} from '../motion/scene-transitions';
import { DURATION, EASE_PREMIUM, SPRING_SNAPPY } from '../motion/entry-motion';

// All majors for search
const ALL_MAJORS = [
  'Accounting',
  'Aerospace Engineering',
  'African American Studies',
  'Anthropology',
  'Architecture',
  'Art',
  'Art History',
  'Biochemistry',
  'Biomedical Engineering',
  'Biology',
  'Business',
  'Chemical Engineering',
  'Chemistry',
  'Civil Engineering',
  'Classics',
  'Communications',
  'Computer Engineering',
  'Computer Science',
  'Dance',
  'Data Science',
  'Economics',
  'Education',
  'Electrical Engineering',
  'English',
  'Environmental Engineering',
  'Environmental Science',
  'Film',
  'Finance',
  'History',
  'Information Science',
  'Journalism',
  'Law',
  'Marketing',
  'Mathematics',
  'Mechanical Engineering',
  'Medicine',
  'Music',
  'Nursing',
  'Philosophy',
  'Physics',
  'Political Science',
  'Psychology',
  'Public Health',
  'Sociology',
  'Theater',
];

// Popular at UB - shown when search is empty
const POPULAR_MAJORS = [
  'Computer Science',
  'Engineering',
  'Business',
  'Biology',
  'Psychology',
  'Communications',
];

// Graduation years
const GRADUATION_YEARS = [2025, 2026, 2027, 2028, 2029];

interface FieldSceneProps {
  major: string;
  graduationYear: number | null;
  onMajorChange: (major: string) => void;
  onGraduationYearChange: (year: number | null) => void;
  onContinue: () => void;
  error?: string;
}

export function FieldScene({
  major,
  graduationYear,
  onMajorChange,
  onGraduationYearChange,
  onContinue,
  error,
}: FieldSceneProps) {
  const [searchQuery, setSearchQuery] = React.useState(major || '');
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Filter majors based on search
  const filteredMajors = searchQuery.trim()
    ? ALL_MAJORS.filter((m) =>
        m.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleMajorSelect = (selectedMajor: string) => {
    setSearchQuery(selectedMajor);
    onMajorChange(selectedMajor);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Clear major if user is typing something different
    if (value !== major) {
      onMajorChange('');
    }
  };

  const handleSearchBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setIsFocused(false);
      // If no major selected but there's a query, try to match
      if (!major && searchQuery.trim()) {
        const match = ALL_MAJORS.find(
          (m) => m.toLowerCase() === searchQuery.toLowerCase()
        );
        if (match) {
          onMajorChange(match);
          setSearchQuery(match);
        }
      }
    }, 150);
  };

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
          What are you building in?
        </motion.h1>

        <motion.p
          variants={subtextVariants}
          className="text-body-lg text-white/50"
        >
          <ManifestoLine delay={0.4} stagger={0.1}>
            Your field is your foundation.
          </ManifestoLine>
        </motion.p>
      </motion.div>

      {/* Year selection - horizontal chips */}
      <motion.div variants={sceneChildVariants} className="space-y-3">
        <p className="text-body-sm text-white/40">Class of</p>
        <div className="flex gap-2">
          {GRADUATION_YEARS.map((year, index) => {
            const isSelected = graduationYear === year;
            return (
              <motion.button
                key={year}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.1 + index * 0.05,
                  duration: DURATION.smooth,
                  ease: EASE_PREMIUM,
                }}
                onClick={() => onGraduationYearChange(isSelected ? null : year)}
                className={cn(
                  'flex-1 py-3 rounded-xl text-body font-medium transition-all duration-200',
                  'border',
                  isSelected
                    ? 'bg-white text-ground border-white'
                    : 'bg-white/[0.02] text-white/60 border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                )}
              >
                {year}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Major search */}
      <motion.div variants={sceneChildVariants} className="space-y-3">
        <p className="text-body-sm text-white/40">Studying</p>

        <div className="relative">
          {/* Search input */}
          <div
            className={cn(
              'relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200',
              isFocused
                ? 'bg-white/[0.06] border-white/20'
                : 'bg-white/[0.02] border-white/10'
            )}
          >
            <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={handleSearchBlur}
              placeholder="Search majors..."
              className="flex-1 bg-transparent text-body text-white placeholder:text-white/30 focus:outline-none"
            />
            {major && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
              >
                <svg
                  className="w-3 h-3 text-white"
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

          {/* Search results dropdown */}
          <AnimatePresence>
            {isFocused && filteredMajors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: DURATION.fast, ease: EASE_PREMIUM }}
                className="absolute top-full left-0 right-0 mt-2 z-50 py-2 bg-elevated border border-white/[0.08] rounded-xl shadow-xl overflow-hidden"
              >
                {filteredMajors.map((m) => (
                  <button
                    key={m}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleMajorSelect(m)}
                    className="w-full px-4 py-2.5 text-left text-body text-white/80 hover:bg-white/[0.06] transition-colors"
                  >
                    {m}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Popular majors - shown when not searching */}
        <AnimatePresence>
          {!searchQuery && !major && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <p className="text-label text-white/30">Popular at UB</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_MAJORS.map((m, index) => (
                  <motion.button
                    key={m}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: index * 0.03,
                      duration: DURATION.smooth,
                      ease: EASE_PREMIUM,
                    }}
                    onClick={() => handleMajorSelect(m)}
                    className="px-3 py-1.5 rounded-full text-body-sm text-white/60 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/15 transition-all"
                  >
                    {m}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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
          variant="cta"
          size="lg"
          onClick={onContinue}
          className="w-full"
        >
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}

FieldScene.displayName = 'FieldScene';
