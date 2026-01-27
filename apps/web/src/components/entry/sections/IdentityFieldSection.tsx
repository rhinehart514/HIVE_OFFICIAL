'use client';

/**
 * IdentityFieldSection - Step 3 of paginated identity flow
 *
 * Major selection with search/filter for 30+ options.
 * Year selection with simple list.
 * Auto-advances to interests when both selected.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, ChevronDown } from 'lucide-react';
import { Button } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  sectionEnterVariants,
  sectionChildVariants,
  errorInlineVariants,
} from '../motion/section-motion';
import { StepCounter } from '../primitives';
import type { SectionState } from '../hooks/useEvolvingEntry';

// Major options - comprehensive list
const MAJOR_OPTIONS = [
  'Undeclared',
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
  'Business Administration',
  'Chemical Engineering',
  'Chemistry',
  'Civil Engineering',
  'Classics',
  'Communication',
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
  'Exercise Science',
  'Film Studies',
  'Finance',
  'Geography',
  'Geology',
  'Graphic Design',
  'History',
  'Industrial Engineering',
  'Information Science',
  'International Studies',
  'Journalism',
  'Linguistics',
  'Management',
  'Marketing',
  'Mathematics',
  'Mechanical Engineering',
  'Media Study',
  'Music',
  'Neuroscience',
  'Nursing',
  'Pharmacology',
  'Philosophy',
  'Physics',
  'Political Science',
  'Pre-Law',
  'Pre-Med',
  'Psychology',
  'Public Health',
  'Social Work',
  'Sociology',
  'Spanish',
  'Statistics',
  'Theater',
  'Urban Planning',
  'Other',
];

// Graduation year options
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => currentYear + i);

interface IdentityFieldSectionProps {
  section: SectionState;
  major: string;
  graduationYear: number | null;
  onMajorChange: (major: string) => void;
  onYearChange: (year: number | null) => void;
  onAdvance: () => void;
  isLoading?: boolean;
}

export function IdentityFieldSection({
  section,
  major,
  graduationYear,
  onMajorChange,
  onYearChange,
  onAdvance,
  isLoading = false,
}: IdentityFieldSectionProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [yearOpen, setYearOpen] = React.useState(false);
  const yearRef = React.useRef<HTMLDivElement>(null);

  const hasError = !!section.error;

  // Filter majors based on search
  const filteredMajors = React.useMemo(() => {
    if (!searchQuery.trim()) return MAJOR_OPTIONS;
    const query = searchQuery.toLowerCase();
    return MAJOR_OPTIONS.filter((m) => m.toLowerCase().includes(query));
  }, [searchQuery]);

  // Close year dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setYearOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Can always advance - major/year are optional
  const canAdvance = !isLoading;

  if (section.status === 'hidden' || section.status === 'locked' || section.status === 'complete') {
    return null;
  }

  return (
    <motion.div
      variants={sectionEnterVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Progress indicator */}
      <motion.div variants={sectionChildVariants}>
        <StepCounter current={3} total={4} />
      </motion.div>

      {/* Header */}
      <motion.div variants={sectionChildVariants} className="space-y-3">
        <h2
          className="text-title-lg font-semibold text-white tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          What's your field?
        </h2>
        <p className="text-body text-white/40 leading-relaxed">
          Help others find you
        </p>
      </motion.div>

      {/* Major search and list */}
      <motion.div variants={sectionChildVariants} className="space-y-3">
        {/* Search input */}
        <div
          className={cn(
            'flex items-center h-12 px-4 rounded-xl border transition-all duration-200',
            'bg-white/[0.03] border-white/[0.08]',
            'focus-within:bg-white/[0.05] focus-within:border-[var(--color-gold)]/30',
            'focus-within:shadow-[0_0_0_4px_rgba(255,215,0,0.06)]'
          )}
        >
          <Search className="w-4 h-4 text-white/30 mr-3 flex-shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search majors..."
            disabled={isLoading}
            autoFocus
            className={cn(
              'w-full bg-transparent text-body text-white',
              'placeholder:text-white/25',
              'focus:outline-none',
              'disabled:opacity-50'
            )}
          />
        </div>

        {/* Major list - scrollable */}
        <div className="h-[200px] overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.02]">
          {filteredMajors.length === 0 ? (
            <div className="flex items-center justify-center h-full text-body-sm text-white/30">
              No majors found
            </div>
          ) : (
            filteredMajors.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onMajorChange(m);
                  setSearchQuery('');
                }}
                disabled={isLoading}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
                  'hover:bg-white/[0.04] border-b border-white/[0.04] last:border-b-0',
                  major === m && 'bg-white/[0.06]',
                  'disabled:opacity-50'
                )}
              >
                <span className={cn('text-body', major === m ? 'text-white' : 'text-white/70')}>
                  {m}
                </span>
                {major === m && <Check size={16} className="text-[var(--life-gold)]" />}
              </button>
            ))
          )}
        </div>

        {/* Selected major indicator */}
        {major && (
          <div className="flex items-center gap-2 text-body-sm text-white/50">
            <Check size={14} className="text-[var(--life-gold)]" />
            <span>{major}</span>
          </div>
        )}
      </motion.div>

      {/* Year dropdown - appears after major selection */}
      <AnimatePresence>
        {major && (
          <motion.div
            variants={sectionChildVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            ref={yearRef}
            className="relative"
          >
            <button
              type="button"
              onClick={() => setYearOpen(!yearOpen)}
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-between h-14 px-4 rounded-2xl border transition-all duration-200',
                'bg-white/[0.03] border-white/[0.08]',
                yearOpen && 'bg-white/[0.05] border-[var(--color-gold)]/30 shadow-[0_0_0_4px_rgba(255,215,0,0.06)]',
                'focus:outline-none focus-visible:border-[var(--color-gold)]/30 focus-visible:shadow-[0_0_0_4px_rgba(255,215,0,0.06)]',
                'disabled:opacity-50'
              )}
            >
              <span className={cn('text-body-lg', graduationYear ? 'text-white' : 'text-white/25')}>
                {graduationYear ? `Class of ${graduationYear}` : 'Graduation year'}
              </span>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-white/40 transition-transform',
                  yearOpen && 'rotate-180'
                )}
              />
            </button>

            <AnimatePresence>
              {yearOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 z-50 py-2 bg-[#1a1a19] border border-white/[0.08] rounded-xl shadow-xl"
                >
                  {YEAR_OPTIONS.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        onYearChange(y);
                        setYearOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors',
                        'hover:bg-white/[0.04]',
                        graduationYear === y && 'bg-white/[0.06]'
                      )}
                    >
                      <span className={cn('text-body', graduationYear === y ? 'text-white' : 'text-white/70')}>
                        {y}
                      </span>
                      {graduationYear === y && <Check size={16} className="text-[var(--life-gold)]" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
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
          onClick={onAdvance}
          disabled={!canAdvance}
          loading={isLoading}
          className="w-full"
        >
          {major ? 'Continue' : 'Skip for now'}
        </Button>
      </motion.div>

      {/* Manifesto line */}
      <motion.p
        variants={sectionChildVariants}
        className="text-body-sm text-white/30 text-center"
      >
        Find others building in your space.
      </motion.p>
    </motion.div>
  );
}

IdentityFieldSection.displayName = 'IdentityFieldSection';
