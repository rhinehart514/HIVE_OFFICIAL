'use client';

/**
 * FieldScreen - Year + Major selection
 *
 * Phase 3 of Entry: "Class of..." → "What are you studying?"
 * Purpose: Add context. Year is required; major is optional.
 *
 * Design: Screen morphs between year and major steps
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UseEntryReturn } from '../hooks/useEntry';
import { DURATION, EASE_PREMIUM } from '../motion/entry-motion';
import { clashDisplay } from '../Entry';

const ALL_MAJORS = [
  'Accounting', 'Aerospace Engineering', 'Anthropology', 'Architecture', 'Art',
  'Biochemistry', 'Biology', 'Biomedical Engineering', 'Business',
  'Chemical Engineering', 'Chemistry', 'Civil Engineering', 'Communications',
  'Computer Engineering', 'Computer Science', 'Data Science', 'Economics',
  'Education', 'Electrical Engineering', 'English', 'Environmental Science',
  'Film', 'Finance', 'History', 'Information Science', 'Journalism',
  'Marketing', 'Mathematics', 'Mechanical Engineering', 'Music', 'Nursing',
  'Philosophy', 'Physics', 'Political Science', 'Psychology', 'Public Health',
  'Sociology', 'Theater',
];

const POPULAR_MAJORS = ['Computer Science', 'Engineering', 'Business', 'Biology', 'Psychology'];
const currentYear = new Date().getFullYear();
const GRADUATION_YEARS = Array.from({ length: 5 }, (_, i) => currentYear + i);

interface FieldScreenProps {
  entry: UseEntryReturn;
}

export function FieldScreen({ entry }: FieldScreenProps) {
  const [majorSearch, setMajorSearch] = React.useState(entry.data.major || '');
  const [majorFocused, setMajorFocused] = React.useState(false);
  const majorInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus major input when step changes
  React.useEffect(() => {
    if (entry.fieldStep === 'major') {
      const timer = setTimeout(() => {
        majorInputRef.current?.focus();
      }, DURATION.smooth * 1000);
      return () => clearTimeout(timer);
    }
  }, [entry.fieldStep]);

  const filteredMajors = majorSearch.trim()
    ? ALL_MAJORS.filter((m) =>
        m.toLowerCase().includes(majorSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleMajorSelect = (major: string) => {
    setMajorSearch(major);
    entry.setMajor(major);
    setMajorFocused(false);
    majorInputRef.current?.blur();
  };

  const handleMajorSearchChange = (value: string) => {
    setMajorSearch(value);
    if (value !== entry.data.major) {
      entry.setMajor('');
    }
  };

  const handleMajorBlur = () => {
    setTimeout(() => {
      setMajorFocused(false);
      if (!entry.data.major && majorSearch.trim()) {
        const match = ALL_MAJORS.find(
          (m) => m.toLowerCase() === majorSearch.toLowerCase()
        );
        if (match) {
          entry.setMajor(match);
          setMajorSearch(match);
        }
      }
    }, 150);
  };

  return (
    <div className="min-h-[60vh] flex flex-col">
      {/* Top bar with back */}
      <div className="flex items-center justify-between mb-8">
        <motion.button
          onClick={entry.goBack}
          className="flex items-center gap-2 text-[13px] text-white/30 hover:text-white/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>

        {/* Year chip shows when on major step */}
        {entry.fieldStep === 'major' && entry.data.graduationYear && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-gold-500/10 text-gold-500 border border-gold-500/20"
          >
            Class of {entry.data.graduationYear}
          </motion.div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* YEAR STEP */}
          {entry.fieldStep === 'year' && (
            <motion.div
              key="year"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
              className="space-y-10"
            >
              {/* Header */}
              <div className="space-y-4">
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: EASE_PREMIUM }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500/60" />
                  <span className="text-[11px] uppercase tracking-[0.3em] text-white/30">
                    Timeline
                  </span>
                </motion.div>

                <motion.h1
                  className={cn(
                    clashDisplay,
                    'text-[2rem] md:text-[2.5rem] lg:text-[3rem] font-medium leading-[1.05] tracking-[-0.02em]'
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.6, ease: EASE_PREMIUM }}
                >
                  <span className="text-white">Class of</span>
                  <span className="text-white/30">...</span>
                </motion.h1>
              </div>

              {/* Year selection */}
              <div className="flex flex-wrap gap-3">
                {GRADUATION_YEARS.map((year, i) => {
                  const isSelected = entry.data.graduationYear === year;
                  return (
                    <motion.button
                      key={year}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: DURATION.fast + i * 0.05, duration: DURATION.quick, ease: EASE_PREMIUM }}
                      onClick={() => entry.setGraduationYear(isSelected ? null : year)}
                      className={cn(
                        'px-8 py-5 rounded-xl text-xl font-medium transition-all duration-300',
                        'border-2',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                        isSelected
                          ? 'bg-gold-500/10 border-gold-500/60 text-gold-500'
                          : 'bg-white/[0.02] border-white/10 text-white/50 hover:border-white/25 hover:text-white/70 hover:bg-white/[0.04]'
                      )}
                    >
                      {year}
                    </motion.button>
                  );
                })}
              </div>

              {/* Error */}
              {entry.error && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[13px] text-red-400"
                >
                  {entry.error}
                </motion.p>
              )}

              {/* Continue */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: DURATION.quick, duration: DURATION.fast, ease: EASE_PREMIUM }}
              >
                <button
                  onClick={entry.submitYear}
                  disabled={entry.data.graduationYear === null}
                  className={cn(
                    'group px-8 py-4 rounded-xl font-medium transition-all duration-300',
                    'flex items-center gap-2',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                    entry.data.graduationYear !== null
                      ? 'bg-white text-neutral-950 hover:bg-white/90'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                  )}
                >
                  <span>Continue</span>
                  <ArrowRight className={cn(
                    'w-4 h-4 transition-transform',
                    entry.data.graduationYear !== null && 'group-hover:translate-x-0.5'
                  )} />
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* MAJOR STEP */}
          {entry.fieldStep === 'major' && (
            <motion.div
              key="major"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
              className="space-y-10"
            >
              {/* Header */}
              <div className="space-y-4">
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: EASE_PREMIUM }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500/60" />
                  <span className="text-[11px] uppercase tracking-[0.3em] text-white/30">
                    Craft
                  </span>
                </motion.div>

                <motion.h1
                  className={cn(
                    clashDisplay,
                    'text-[2rem] md:text-[2.5rem] lg:text-[3rem] font-medium leading-[1.05] tracking-[-0.02em]'
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.6, ease: EASE_PREMIUM }}
                >
                  <span className="text-white">What are you</span>
                  <br />
                  <span className="text-white/40">studying?</span>
                </motion.h1>
              </div>

              {/* Major search */}
              <motion.div
                className="max-w-lg space-y-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: DURATION.fast, duration: DURATION.quick, ease: EASE_PREMIUM }}
              >
                <div className="relative">
                  <div
                    className={cn(
                      'flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300',
                      'bg-white/[0.03] border-2',
                      majorFocused || entry.data.major
                        ? 'border-gold-500/40 bg-gold-500/[0.02]'
                        : 'border-white/10'
                    )}
                  >
                    <Search className="w-5 h-5 text-white/30 flex-shrink-0" />
                    <input
                      ref={majorInputRef}
                      type="text"
                      value={majorSearch}
                      onChange={(e) => handleMajorSearchChange(e.target.value)}
                      onFocus={() => setMajorFocused(true)}
                      onBlur={handleMajorBlur}
                      placeholder="Search majors..."
                      className="flex-1 bg-transparent text-lg text-white placeholder:text-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg"
                    />
                    {entry.data.major && (
                      <Check className="w-5 h-5 text-gold-500" />
                    )}
                  </div>

                  {/* Search results dropdown */}
                  <AnimatePresence>
                    {majorFocused && filteredMajors.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-2 z-50 py-2 bg-[var(--bg-ground)] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                      >
                        {filteredMajors.map((m, i) => (
                          <motion.button
                            key={m}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleMajorSelect(m)}
                            className="w-full px-5 py-3 text-left text-[15px] text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                          >
                            {m}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Popular suggestions */}
                <AnimatePresence>
                  {!majorSearch && !entry.data.major && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: DURATION.fast, ease: EASE_PREMIUM }}
                    >
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 mb-3">Popular choices</p>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_MAJORS.map((m, i) => (
                          <motion.button
                            key={m}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: DURATION.quick + i * 0.04, duration: DURATION.fast, ease: EASE_PREMIUM }}
                            onClick={() => handleMajorSelect(m)}
                            className="px-4 py-2 rounded-lg text-[13px] text-white/50 bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:text-white/70 hover:border-white/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                          >
                            {m}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Actions */}
              <motion.div
                className="flex items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: DURATION.quick, duration: DURATION.fast, ease: EASE_PREMIUM }}
              >
                <button
                  onClick={entry.submitField}
                  className={cn(
                    'group px-8 py-4 rounded-xl font-medium transition-all duration-300',
                    'flex items-center gap-2',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                    entry.data.major
                      ? 'bg-white text-neutral-950 hover:bg-white/90'
                      : 'bg-white/10 text-white/50 hover:bg-white/15'
                  )}
                >
                  <span>{entry.data.major ? 'Continue' : 'Skip for now'}</span>
                  <ArrowRight className={cn(
                    'w-4 h-4 transition-transform',
                    entry.data.major ? 'text-neutral-950 group-hover:translate-x-0.5' : 'text-white/30'
                  )} />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error at bottom */}
      {entry.error && entry.fieldStep === 'major' && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-[13px] text-red-400"
        >
          {entry.error}
        </motion.p>
      )}
    </div>
  );
}
