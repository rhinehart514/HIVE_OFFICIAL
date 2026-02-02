'use client';

/**
 * EnterScreen - Interests selection
 * Editorial design with search-first and category filters
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, X, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UseEntryReturn } from '../hooks/useEntry';
import { DURATION, EASE_PREMIUM } from '../motion/entry-motion';
import { clashDisplay } from '../Entry';

// 150+ interests organized by category
const INTEREST_CATEGORIES = [
  {
    id: 'tech',
    label: 'Tech',
    interests: [
      'Software Engineering', 'Web Development', 'Mobile Development', 'AI/ML',
      'Data Science', 'Cybersecurity', 'Cloud Computing', 'DevOps', 'Blockchain',
      'Game Development', 'AR/VR', 'Robotics', 'IoT', 'Systems Programming',
      'Frontend', 'Backend', 'Full Stack', 'Open Source', 'Computer Vision',
      'NLP', 'Quantum Computing', 'Hardware', 'Embedded Systems',
    ],
  },
  {
    id: 'design',
    label: 'Design',
    interests: [
      'UI Design', 'UX Design', 'Product Design', 'Graphic Design', 'Brand Design',
      'Motion Design', 'Illustration', '3D Design', 'Typography', 'Design Systems',
      'User Research', 'Interaction Design', 'Visual Design', 'Design Thinking',
      'Figma', 'Prototyping', 'Information Architecture', 'Accessibility',
    ],
  },
  {
    id: 'business',
    label: 'Business',
    interests: [
      'Entrepreneurship', 'Startups', 'Venture Capital', 'Finance', 'Marketing',
      'Product Management', 'Growth', 'Strategy', 'Consulting', 'Operations',
      'Sales', 'Business Development', 'Investing', 'Real Estate', 'E-commerce',
      'Supply Chain', 'Analytics', 'Leadership', 'Management',
    ],
  },
  {
    id: 'science',
    label: 'Science',
    interests: [
      'Biology', 'Chemistry', 'Physics', 'Mathematics', 'Neuroscience',
      'Genetics', 'Biotechnology', 'Environmental Science', 'Astronomy',
      'Medicine', 'Public Health', 'Psychology', 'Cognitive Science',
      'Materials Science', 'Nanotechnology', 'Research', 'Lab Work',
    ],
  },
  {
    id: 'engineering',
    label: 'Engineering',
    interests: [
      'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering',
      'Chemical Engineering', 'Aerospace Engineering', 'Biomedical Engineering',
      'Industrial Engineering', 'Nuclear Engineering', 'Automotive',
      'Manufacturing', 'Structural Engineering', 'CAD', 'Simulation',
    ],
  },
  {
    id: 'creative',
    label: 'Creative',
    interests: [
      'Photography', 'Videography', 'Film', 'Music Production', 'Podcasting',
      'Writing', 'Creative Writing', 'Journalism', 'Blogging', 'Content Creation',
      'Animation', 'Sound Design', 'Voice Acting', 'Directing', 'Screenwriting',
      'Digital Art', 'Traditional Art', 'Comics', 'Crafts',
    ],
  },
  {
    id: 'social',
    label: 'Social Impact',
    interests: [
      'Sustainability', 'Climate Tech', 'Social Entrepreneurship', 'Nonprofit',
      'Education', 'Policy', 'Advocacy', 'Community Organizing', 'Volunteering',
      'Mental Health', 'Diversity & Inclusion', 'Social Justice', 'Humanitarian',
      'International Development', 'Civic Tech', 'Food Security',
    ],
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    interests: [
      'Fitness', 'Sports', 'Running', 'Weightlifting', 'Yoga', 'Meditation',
      'Nutrition', 'Cooking', 'Travel', 'Outdoors', 'Hiking', 'Camping',
      'Fashion', 'Personal Finance', 'Productivity', 'Reading', 'Gaming',
      'Board Games', 'Esports', 'Streaming',
    ],
  },
];

// Flatten all interests for search
const ALL_INTERESTS = INTEREST_CATEGORIES.flatMap((cat) => cat.interests);

interface EnterScreenProps {
  entry: UseEntryReturn;
}

export function EnterScreen({ entry }: EnterScreenProps) {
  const [search, setSearch] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const canContinue = entry.data.interests.length >= 2;
  const atLimit = entry.data.interests.length >= 5;

  // Filter interests
  const filteredInterests = React.useMemo(() => {
    let interests = activeCategory
      ? INTEREST_CATEGORIES.find((c) => c.id === activeCategory)?.interests || []
      : ALL_INTERESTS;

    if (search.trim()) {
      const query = search.toLowerCase();
      interests = interests.filter((i) => i.toLowerCase().includes(query));
    }

    return interests.slice(0, 30); // Limit display for performance
  }, [search, activeCategory]);

  const handleToggle = (interest: string) => {
    entry.toggleInterest(interest);
  };

  const clearSearch = () => {
    setSearch('');
    searchInputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)]">
      {/* Header */}
      <div className="space-y-4 mb-8">
        <button
          onClick={entry.goBack}
          className="flex items-center gap-2 text-[13px] text-white/30 hover:text-white/50 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Section label with gold dot */}
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-500/60" />
          <span className="text-[11px] uppercase tracking-[0.3em] text-white/30">
            Connect
          </span>
        </div>

        <h1 className={cn(
          clashDisplay,
          'text-[1.75rem] md:text-[2rem] font-medium leading-[1.1] tracking-[-0.02em]'
        )}>
          <span className="text-white">What drives</span>
          <br />
          <span className="text-white/40">you?</span>
        </h1>

        <p className="text-[15px] text-white/40">
          Pick 2-5 interests to help us connect you.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
            'bg-white/[0.03] border-2 border-white/10',
            'focus-within:border-white/20 focus-within:bg-white/[0.05]'
          )}
        >
          <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search interests..."
            className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/30 focus:outline-none"
          />
          {search && (
            <button
              onClick={clearSearch}
              className="text-white/40 hover:text-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            'px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-200',
            'border',
            activeCategory === null
              ? 'bg-white text-neutral-950 border-white'
              : 'bg-white/[0.03] text-white/50 border-white/10 hover:bg-white/[0.06] hover:text-white/70'
          )}
        >
          All
        </button>
        {INTEREST_CATEGORIES.map((cat) => {
          const count = cat.interests.filter((i) =>
            entry.data.interests.includes(i)
          ).length;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-200',
                'border flex items-center gap-1.5',
                activeCategory === cat.id
                  ? 'bg-white text-neutral-950 border-white'
                  : 'bg-white/[0.03] text-white/50 border-white/10 hover:bg-white/[0.06] hover:text-white/70'
              )}
            >
              {cat.label}
              {count > 0 && (
                <span
                  className={cn(
                    'w-5 h-5 rounded-full text-[10px] flex items-center justify-center',
                    activeCategory === cat.id
                      ? 'bg-black/10 text-black'
                      : 'bg-gold-500/20 text-gold-500'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Interests grid - scrollable */}
      <div className="flex-1 overflow-y-auto pb-4 scrollbar-hide">
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {filteredInterests.map((interest) => {
              const isSelected = entry.data.interests.includes(interest);
              const isDisabled = atLimit && !isSelected;

              return (
                <motion.button
                  key={interest}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: DURATION.snap, ease: EASE_PREMIUM }}
                  onClick={() => handleToggle(interest)}
                  disabled={isDisabled}
                  className={cn(
                    'px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-300',
                    'border',
                    'disabled:opacity-30 disabled:cursor-not-allowed',
                    isSelected
                      ? 'bg-gold-500 text-neutral-950 border-gold-500'
                      : 'bg-white/[0.03] text-white/60 border-white/10 hover:bg-white/[0.06] hover:text-white/80 hover:border-white/20'
                  )}
                >
                  {interest}
                </motion.button>
              );
            })}
          </AnimatePresence>

          {filteredInterests.length === 0 && (
            <p className="text-[13px] text-white/40 py-8 w-full text-center">
              No interests match "{search}"
            </p>
          )}
        </div>
      </div>

      {/* Selected summary */}
      <AnimatePresence>
        {entry.data.interests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/[0.06] pt-4 mb-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] text-white/40">Your picks</p>
              <p className="text-[11px] text-gold-500/60">
                {entry.data.interests.length}/5
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {entry.data.interests.map((interest) => (
                <motion.button
                  key={interest}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => handleToggle(interest)}
                  className="group px-3 py-1.5 rounded-full text-[13px] font-medium bg-gold-500/10 text-gold-500 border border-gold-500/20 flex items-center gap-1.5 hover:bg-gold-500/15 transition-all"
                >
                  {interest}
                  <span className="text-gold-500/50 group-hover:text-gold-500">
                    ×
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {entry.error && (
        <p className="text-[13px] text-red-400 mb-4">{entry.error}</p>
      )}

      {/* CTA */}
      <button
        onClick={entry.completeEntry}
        disabled={!canContinue || entry.isLoading}
        className={cn(
          'group w-full py-4 rounded-xl font-medium transition-all duration-300',
          canContinue
            ? 'bg-gold-500 text-neutral-950 hover:bg-gold-500/90'
            : 'bg-white/10 text-white/40',
          'disabled:cursor-not-allowed',
          'flex items-center justify-center gap-2'
        )}
      >
        {entry.isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creating your profile...</span>
          </>
        ) : canContinue ? (
          <>
            <span>Enter HIVE</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </>
        ) : (
          `Pick ${2 - entry.data.interests.length} more`
        )}
      </button>
    </div>
  );
}
