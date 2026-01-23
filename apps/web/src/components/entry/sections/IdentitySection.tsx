'use client';

/**
 * IdentitySection - Profile setup
 * REDESIGNED: Jan 21, 2026
 *
 * Premium form design:
 * - Apple-style inputs (h-14, rounded-2xl)
 * - Clash Display for headers
 * - Gold CTA button (earned moment - final step)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HandleInput,
  HandleStatusBadge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Button,
  type HandleStatus,
} from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  sectionEnterVariants,
  sectionChildVariants,
  shakeVariants,
  errorInlineVariants,
} from '../motion/section-motion';
import { DURATION, EASE_PREMIUM } from '../motion/entry-motion';
import type { SectionState } from '../hooks/useEvolvingEntry';

interface IdentitySectionProps {
  section: SectionState;
  firstName: string;
  lastName: string;
  handle: string;
  handleStatus: HandleStatus;
  handleSuggestions: string[];
  major: string;
  graduationYear: number | null;
  residenceType: 'on-campus' | 'off-campus' | 'commuter' | '';
  residentialSpaceId: string;
  interests: string[];
  communityIdentities: {
    international?: boolean;
    transfer?: boolean;
    firstGen?: boolean;
    commuter?: boolean;
    graduate?: boolean;
    veteran?: boolean;
  };
  onFirstNameChange: (name: string) => void;
  onLastNameChange: (name: string) => void;
  onHandleChange: (handle: string) => void;
  onSuggestionClick: (handle: string) => void;
  onMajorChange: (major: string) => void;
  onGraduationYearChange: (year: number | null) => void;
  onResidenceTypeChange: (type: 'on-campus' | 'off-campus' | 'commuter') => void;
  onResidentialChange: (spaceId: string) => void;
  onInterestsChange: (interests: string[]) => void;
  onCommunityIdentitiesChange: (identities: Record<string, boolean>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  majors: string[];
  graduationYears: number[];
  residentialSpaces: Array<{ id: string; name: string }>;
}

// Campus-authentic interests - curated from UB_INTEREST_CATEGORIES
// These are the most universally relatable interests that create connection
const CURATED_INTERESTS = [
  // Academic vibes (broad, relatable)
  { label: 'CS / Tech', value: 'cs' },
  { label: 'Pre-med / Bio', value: 'pre-med' },
  { label: 'Business', value: 'business' },
  { label: 'Engineering', value: 'engineering' },
  { label: 'Arts / Creative', value: 'arts' },
  { label: 'Social Sciences', value: 'social-sci' },
  // Study style (everyone relates)
  { label: 'Finals crammer', value: 'finals-crammer' },
  { label: 'Solo grinder', value: 'solo-grinder' },
  { label: 'Study pods', value: 'study-pods' },
  // Life vibes
  { label: 'Gaming', value: 'gaming' },
  { label: 'Music', value: 'music' },
  { label: 'Fitness', value: 'fitness' },
  { label: 'Film / TV', value: 'film' },
  { label: 'Sports', value: 'sports' },
  { label: 'Food culture', value: 'food' },
  // Builder energy
  { label: 'Side projects', value: 'side-projects' },
  { label: 'Startups', value: 'startups' },
  { label: 'AI / ML curious', value: 'ai-ml' },
];

export function IdentitySection({
  section,
  firstName,
  lastName,
  handle,
  handleStatus,
  handleSuggestions,
  major,
  graduationYear,
  residenceType,
  residentialSpaceId,
  interests,
  communityIdentities,
  onFirstNameChange,
  onLastNameChange,
  onHandleChange,
  onSuggestionClick,
  onMajorChange,
  onGraduationYearChange,
  onResidenceTypeChange,
  onResidentialChange,
  onInterestsChange,
  onCommunityIdentitiesChange,
  onSubmit,
  isLoading,
  majors,
  graduationYears,
  residentialSpaces,
}: IdentitySectionProps) {
  const isActive = section.status === 'active';
  const hasError = !!section.error;

  // Required: name, handle available, 2-3 interests
  // Optional: major, graduation year, community identities
  // NOTE: Living situation deferred to in-platform progressive profiling
  const canSubmit =
    firstName.trim() &&
    lastName.trim() &&
    handle.trim() &&
    handleStatus === 'available' &&
    interests.length >= 2 &&
    interests.length <= 3 &&
    !isLoading;

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && canSubmit) {
        onSubmit();
      }
    },
    [canSubmit, onSubmit]
  );

  // Hidden state
  if (section.status === 'hidden') {
    return null;
  }

  // Locked/complete state - identity section doesn't show a chip
  // (arrival section takes over)
  if (section.status === 'locked' || section.status === 'complete') {
    return null;
  }

  // Active state - show identity form
  return (
    <motion.div
      variants={sectionEnterVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-5"
    >
      {/* Header - premium /about-style typography */}
      <motion.div variants={sectionChildVariants} className="space-y-2 mb-2">
        <h2
          className="text-[24px] font-semibold text-white tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Create your identity
        </h2>
        <p className="text-[15px] text-white/40 leading-relaxed">
          How you'll show up across campus
        </p>
      </motion.div>

      {/* Form */}
      <div className="space-y-4">
        {/* Name row - Apple-style inputs */}
        <motion.div
          variants={sectionChildVariants}
          className="grid grid-cols-2 gap-3"
        >
          <div
            className={cn(
              'flex items-center h-14 rounded-2xl border transition-all duration-200',
              'bg-white/[0.03] border-white/[0.08]',
              'focus-within:bg-white/[0.05] focus-within:border-white/20'
            )}
          >
            <input
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="First name"
              disabled={isLoading}
              autoFocus
              className={cn(
                'w-full h-full px-4 bg-transparent text-[16px] text-white',
                'placeholder:text-white/25',
                'focus:outline-none',
                'disabled:opacity-50'
              )}
            />
          </div>
          <div
            className={cn(
              'flex items-center h-14 rounded-2xl border transition-all duration-200',
              'bg-white/[0.03] border-white/[0.08]',
              'focus-within:bg-white/[0.05] focus-within:border-white/20'
            )}
          >
            <input
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Last name"
              disabled={isLoading}
              className={cn(
                'w-full h-full px-4 bg-transparent text-[16px] text-white',
                'placeholder:text-white/25',
                'focus:outline-none',
                'disabled:opacity-50'
              )}
            />
          </div>
        </motion.div>

        {/* Handle */}
        <motion.div variants={sectionChildVariants}>
          <motion.div
            variants={shakeVariants}
            animate={hasError && !firstName && !lastName ? 'shake' : 'idle'}
          >
            <HandleInput
              value={handle}
              onChange={(e) => onHandleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              status={handleStatus}
              placeholder="yourhandle"
              disabled={isLoading}
              size="default"
            />
          </motion.div>

          <HandleStatusBadge
            status={handleStatus}
            suggestions={handleSuggestions}
            onSuggestionClick={onSuggestionClick}
          />
        </motion.div>

        {/* Identity dropdowns - Optional fields */}
        <motion.div variants={sectionChildVariants} className="space-y-3">
          {/* Major - Optional */}
          <div className="space-y-1.5">
            <label className="text-[12px] text-white/40">
              Major <span className="text-white/20">(optional)</span>
            </label>
            <Select
              value={major}
              onValueChange={onMajorChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your major" />
              </SelectTrigger>
              <SelectContent>
                {majors.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Graduation year - Optional */}
          <div className="space-y-1.5">
            <label className="text-[12px] text-white/40">
              Graduation year <span className="text-white/20">(optional)</span>
            </label>
            <Select
              value={graduationYear?.toString() || ''}
              onValueChange={(v) => onGraduationYearChange(parseInt(v, 10))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {graduationYears.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    Class of {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Interests multi-select - curated campus-authentic options */}
        <motion.div variants={sectionChildVariants} className="space-y-2">
          <label className="text-[12px] text-white/40">
            What are you into? <span className="text-white/60">(pick 2-3)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CURATED_INTERESTS.map(({ label, value }) => {
              const isSelected = interests.includes(value);
              const canSelect = !isSelected && interests.length < 3;
              const canDeselect = isSelected;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      onInterestsChange(interests.filter((i) => i !== value));
                    } else if (canSelect) {
                      onInterestsChange([...interests, value]);
                    }
                  }}
                  disabled={isLoading || (!canSelect && !canDeselect)}
                  className={cn(
                    'h-9 px-3.5 rounded-full text-[13px] font-medium transition-all duration-200',
                    'border',
                    isSelected
                      ? 'bg-[var(--color-gold)]/10 border-[var(--color-gold)]/30 text-[var(--color-gold)]'
                      : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:bg-white/[0.05] hover:border-white/15',
                    (!canSelect && !canDeselect) && 'opacity-30 cursor-not-allowed',
                    'disabled:opacity-50'
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {interests.length > 0 && (
            <p className="text-[11px] text-white/30">
              {interests.length}/3 selected
            </p>
          )}
        </motion.div>

        {/* Community identities - compact pills for optional self-identification */}
        <motion.div variants={sectionChildVariants} className="space-y-2">
          <label className="text-[12px] text-white/40">
            Describe you? <span className="text-white/20">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'international', label: 'International' },
              { key: 'transfer', label: 'Transfer' },
              { key: 'firstGen', label: 'First-Gen' },
              { key: 'commuter', label: 'Commuter' },
              { key: 'graduate', label: 'Grad Student' },
              { key: 'veteran', label: 'Veteran' },
            ].map(({ key, label }) => {
              const isSelected = communityIdentities[key as keyof typeof communityIdentities] || false;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onCommunityIdentitiesChange({
                      ...communityIdentities,
                      [key]: !isSelected,
                    });
                  }}
                  disabled={isLoading}
                  className={cn(
                    'h-9 px-3.5 rounded-full text-[13px] font-medium transition-all duration-200',
                    'border',
                    isSelected
                      ? 'bg-white/10 border-white/25 text-white'
                      : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:bg-white/[0.05] hover:border-white/15',
                    'disabled:opacity-50'
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {hasError && (
            <motion.p
              variants={errorInlineVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-[13px] text-red-400/90"
            >
              {section.error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* CTA Button - Gold (earned moment) */}
        <motion.div variants={sectionChildVariants}>
          <Button
            variant="cta"
            size="lg"
            onClick={onSubmit}
            disabled={!canSubmit}
            loading={isLoading}
            className="w-full"
          >
            {isLoading ? 'Setting up...' : 'Enter HIVE'}
          </Button>
        </motion.div>

        {/* Subtext */}
        <motion.p
          variants={sectionChildVariants}
          className="text-[12px] text-white/25 text-center"
        >
          You can change your handle later
        </motion.p>
      </div>
    </motion.div>
  );
}

IdentitySection.displayName = 'IdentitySection';
