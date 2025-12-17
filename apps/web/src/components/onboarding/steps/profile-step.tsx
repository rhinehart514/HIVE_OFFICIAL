'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, ChevronsUpDown, Loader2, AtSign } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@hive/ui';
import { Button, Input } from '@hive/ui';
import {
  containerVariants,
  itemVariants,
  GLOW_GOLD,
  goldenPulseVariants,
} from '../shared/motion';
import {
  UB_MAJORS,
  UB_GRADUATE_MAJORS,
  GRAD_YEARS,
  ALUMNI_GRAD_YEARS,
  FACULTY_GRAD_YEARS,
  LIVING_SITUATIONS,
} from '../shared/constants';
import type { OnboardingData, HandleStatus, UserType, LivingSituation } from '../shared/types';

interface ProfileStepProps {
  data: OnboardingData;
  handleStatus: HandleStatus;
  handleSuggestions: string[];
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  error: string | null;
  setError: (error: string | null) => void;
  isSubmitting?: boolean;
}

function getGradYearsForUserType(userType: UserType | null): number[] {
  switch (userType) {
    case 'alumni':
      return ALUMNI_GRAD_YEARS;
    case 'faculty':
      return FACULTY_GRAD_YEARS;
    case 'student':
    default:
      return GRAD_YEARS;
  }
}

/**
 * Get majors list based on user type
 * Students: 112 undergraduate programs
 * Alumni/Faculty: 112 undergrad + 368 graduate programs
 */
function getMajorsForUserType(userType: UserType | null): string[] {
  switch (userType) {
    case 'alumni':
    case 'faculty':
      // Graduate/Alumni can select from both undergrad and grad programs
      return [...UB_MAJORS, ...UB_GRADUATE_MAJORS];
    case 'student':
    default:
      return UB_MAJORS;
  }
}

/**
 * Step 2: Claim your @
 * Handle is the HERO - huge, live updating
 * Other fields compressed into metadata row
 */
export function ProfileStep({
  data,
  handleStatus,
  handleSuggestions,
  onUpdate,
  onNext,
  error,
  setError,
}: ProfileStepProps) {
  const { name, handle, major, graduationYear, userType, livingSituation } = data;
  const [majorOpen, setMajorOpen] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);
  const prevHandleStatus = useRef<HandleStatus>(handleStatus);
  const handleInputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const gradYears = getGradYearsForUserType(userType);
  const availableMajors = getMajorsForUserType(userType);

  // Apply reduced motion to variants
  const safeContainerVariants = shouldReduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : containerVariants;

  const safeItemVariants = shouldReduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : itemVariants;

  // Trigger golden pulse when handle becomes available
  useEffect(() => {
    if (prevHandleStatus.current !== 'available' && handleStatus === 'available') {
      setShouldPulse(true);
      const timer = setTimeout(() => setShouldPulse(false), 700);
      return () => clearTimeout(timer);
    }
    prevHandleStatus.current = handleStatus;
  }, [handleStatus]);

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Enter your name');
      return;
    }
    if (!handle.trim()) {
      setError('Choose a handle');
      return;
    }
    if (handleStatus === 'invalid') {
      setError('3-20 characters, letters/numbers/._- only');
      return;
    }
    if (handleStatus === 'taken') {
      setError('That one\'s taken');
      return;
    }
    if (handleStatus !== 'available' && handleStatus !== 'idle') {
      return; // Still checking
    }
    if (!major) {
      setError('Pick a major');
      return;
    }
    if (!graduationYear) {
      setError('Pick a year');
      return;
    }
    setError(null);
    onNext();
  };

  const getHandleColor = () => {
    switch (handleStatus) {
      case 'available':
        return 'text-gold-500';
      case 'taken':
      case 'invalid':
        return 'text-red-400';
      case 'checking':
        return 'checking';
      default:
        return handle ? 'text-white' : 'placeholder';
    }
  };

  const canContinue =
    name.trim().length > 0 &&
    handle.trim().length > 0 &&
    (handleStatus === 'available' || handleStatus === 'idle') &&
    major &&
    graduationYear;

  return (
    <motion.div
      variants={safeContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen flex flex-col justify-center px-6 py-12"
      role="main"
      aria-labelledby="profile-title"
    >
      <div className="w-full max-w-2xl mx-auto">
        {/* Header - dynamic based on handle status */}
        <motion.h1
          id="profile-title"
          variants={safeItemVariants}
          className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight mb-4 text-center"
        >
          {handleStatus === 'available' ? "This one's yours." : 'Claim your @'}
        </motion.h1>

        {/* THE HANDLE - Huge, live updating, the star */}
        <motion.div
          variants={safeItemVariants}
          className="mb-12"
        >
          <motion.div
            variants={goldenPulseVariants}
            initial="initial"
            animate={shouldPulse ? 'pulse' : 'initial'}
            className="relative"
          >
            {/* Giant handle display */}
            <div
              className="text-center cursor-text"
              onClick={() => handleInputRef.current?.focus()}
            >
              <span
                className={`text-5xl md:text-7xl font-bold tracking-tight transition-colors ${getHandleColor() === 'text-gold-500' ? 'text-gold-500' : getHandleColor() === 'text-red-400' ? 'text-red-400' : getHandleColor() === 'text-white' ? 'text-white' : ''}`}
                style={getHandleColor() === 'checking' ? { color: 'var(--hive-text-secondary)' } : getHandleColor() === 'placeholder' ? { color: 'var(--hive-text-disabled)' } : {}}
              >
                @{handle || <span style={{ color: 'var(--hive-text-subtle)' }}>_</span>}
              </span>

              {/* Status indicator */}
              <div id="handle-status" className="h-6 flex items-center justify-center mt-2" role="status" aria-live="polite">
                {handleStatus === 'checking' && (
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-500" aria-label="Checking availability" />
                )}
                {handleStatus === 'available' && (
                  <motion.span
                    initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-sm text-gold-500 flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" aria-hidden="true" /> yours
                  </motion.span>
                )}
                {handleStatus === 'taken' && (
                  <span className="text-sm text-red-400">taken</span>
                )}
                {handleStatus === 'invalid' && handle.length > 0 && (
                  <span className="text-sm text-red-400">invalid</span>
                )}
              </div>
            </div>

            {/* Hidden input for actual typing */}
            <input
              ref={handleInputRef}
              type="text"
              value={handle}
              onChange={(e) => {
                onUpdate({ handle: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') });
                setError(null);
              }}
              className="absolute inset-0 opacity-0 cursor-text"
              autoComplete="off"
              autoFocus
              aria-label="Enter your handle"
              aria-describedby="handle-status"
            />
          </motion.div>

          {/* Handle suggestions when taken */}
          <AnimatePresence>
            {handleStatus === 'taken' && handleSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 flex flex-wrap justify-center gap-2"
              >
                {handleSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => onUpdate({ handle: suggestion })}
                    className="px-3 py-1.5 text-sm rounded-lg bg-white/[0.03] border border-white/[0.06] hover:text-white hover:border-gold-500/30 transition-colors"
                    style={{ color: 'var(--hive-text-secondary)' }}
                  >
                    @{suggestion}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Metadata section - vertical stack for clarity */}
        <motion.div
          variants={safeItemVariants}
          className="space-y-4 mb-8"
        >
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="name-input" className="text-xs font-medium" style={{ color: 'var(--hive-text-subtle)' }}>
              Name <span className="text-gold-500" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <input
              id="name-input"
              type="text"
              value={name}
              onChange={(e) => {
                onUpdate({ name: e.target.value });
                setError(null);
              }}
              placeholder="Your name"
              className="w-full h-12 px-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-gold-500/40 focus:ring-2 focus:ring-gold-500/20 transition-all"
              aria-describedby="name-hint"
              required
            />
            <p id="name-hint" className="text-xs" style={{ color: 'var(--hive-text-disabled)' }}>How people will see you</p>
          </div>

          {/* Major and Year row */}
          <div className="grid grid-cols-2 gap-3">
          {/* Major combobox */}
          <div className="space-y-1.5">
            <label id="major-label" className="text-xs font-medium" style={{ color: 'var(--hive-text-subtle)' }}>
              Major <span className="text-gold-500" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <Popover open={majorOpen} onOpenChange={setMajorOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-labelledby="major-label"
                  aria-expanded={majorOpen}
                  aria-haspopup="listbox"
                  className={`w-full h-12 rounded-xl border bg-white/[0.02] px-4 text-sm text-left flex items-center justify-between transition-all ${
                    majorOpen
                      ? 'border-gold-500/40 ring-2 ring-gold-500/20'
                      : 'border-white/[0.06]'
                  }`}
                  style={majorOpen ? { boxShadow: GLOW_GOLD } : {}}
                >
                  <span className={major ? 'text-white truncate' : ''} style={major ? {} : { color: 'var(--hive-text-disabled)' }}>
                    {major || 'Select major'}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0" style={{ color: 'var(--hive-text-subtle)' }} aria-hidden="true" />
                </button>
              </PopoverTrigger>
            <PopoverContent
              className="p-0 rounded-xl shadow-2xl w-[calc(100vw-3rem)] sm:w-[320px] max-w-[320px]"
              style={{ backgroundColor: 'var(--hive-bg-surface)', borderColor: 'var(--hive-border-default)' }}
              align="start"
              sideOffset={4}
            >
              <Command className="bg-transparent">
                <CommandInput
                  placeholder="Search majors..."
                  className="h-11 bg-transparent px-4 text-sm text-white"
                />
                <div className="px-3 py-1.5 text-xs" style={{ color: 'var(--hive-text-subtle)', borderBottomColor: 'var(--hive-border-default)', borderBottomWidth: '1px' }}>
                  {availableMajors.length} programs available
                </div>
                <CommandList className="max-h-[280px] overflow-y-auto p-1">
                  <CommandEmpty className="py-4 text-center text-sm" style={{ color: 'var(--hive-text-subtle)' }}>
                    No matching major found
                  </CommandEmpty>
                  <CommandGroup>
                    {availableMajors.map((m) => (
                      <CommandItem
                        key={m}
                        value={m}
                        onSelect={() => {
                          onUpdate({ major: m });
                          setMajorOpen(false);
                          setError(null);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer text-white hover:bg-white/[0.06]"
                      >
                        <Check
                          className={`h-4 w-4 shrink-0 ${
                            major === m ? 'opacity-100 text-gold-500' : 'opacity-0'
                          }`}
                        />
                        <span className="truncate">{m}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
            </Popover>
            <p className="text-xs" style={{ color: 'var(--hive-text-disabled)' }}>Helps us suggest relevant spaces</p>
          </div>

          {/* Year dropdown-style pills */}
          <div className="space-y-1.5">
            <label id="year-label" className="text-xs font-medium" style={{ color: 'var(--hive-text-subtle)' }}>
              Year <span className="text-gold-500" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <div className="flex items-center gap-1" role="radiogroup" aria-labelledby="year-label">
            {gradYears.map((year) => (
              <button
                key={year}
                type="button"
                role="radio"
                aria-checked={graduationYear === year}
                onClick={() => {
                  onUpdate({ graduationYear: year });
                  setError(null);
                }}
                className={`flex-1 h-12 rounded-xl text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                  graduationYear === year
                    ? 'bg-gold-500/10 border border-gold-500 text-gold-500'
                    : 'bg-white/[0.02] border border-white/[0.06] hover:text-white hover:border-white/[0.12]'
                }`}
                style={graduationYear === year ? {} : { color: 'var(--hive-text-secondary)' }}
              >
                '{String(year).slice(-2)}
              </button>
            ))}
            </div>
            <p id="year-hint" className="text-xs" style={{ color: 'var(--hive-text-disabled)' }}>Connect with your class</p>
          </div>
          </div>

          {/* Residential status - optional, only show for students */}
          {userType === 'student' && (
            <div className="space-y-2">
              <label id="living-label" className="text-xs font-medium" style={{ color: 'var(--hive-text-subtle)' }}>
                Where do you live? <span style={{ color: 'var(--hive-text-disabled)' }}>(optional)</span>
              </label>
              {/* 2x2 grid on mobile, row on larger screens */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-labelledby="living-label">
                {LIVING_SITUATIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={livingSituation === option.value}
                    onClick={() => {
                      onUpdate({ livingSituation: option.value as LivingSituation });
                    }}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                      livingSituation === option.value
                        ? 'bg-gold-500/10 border border-gold-500 text-gold-500'
                        : 'bg-white/[0.02] border border-white/[0.06] hover:text-white hover:border-white/[0.12]'
                    }`}
                    style={livingSituation === option.value ? {} : { color: 'var(--hive-text-secondary)' }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs" style={{ color: 'var(--hive-text-disabled)' }}>Helps us recommend nearby activities</p>
            </div>
          )}
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-sm font-medium text-red-400 text-center mb-6"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Continue */}
        <motion.div variants={safeItemVariants} className="flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={!canContinue}
            showArrow
            size="lg"
          >
            Continue
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
