'use client';

/**
 * BelongingScreen - Community Identity + Residence
 *
 * Phase 3.5 of Entry (between Field and Crossing):
 * "Do any of these describe you?" + "Where do you live?"
 *
 * All fields optional. User can skip entirely.
 * Community identities auto-join corresponding universal spaces.
 * Residence type + space enable home space assignment.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  ArrowRightLeft,
  Sparkles,
  GraduationCap,
  Shield,
  Building2,
  Home,
  Car,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UseEntryReturn } from '../hooks/useEntry';
import type { CommunityIdentities, ResidenceType } from '../hooks/useEntry';
import { DURATION, EASE_PREMIUM } from '../motion/entry-motion';
import { clashDisplay } from '../Entry';

const COMMUNITY_OPTIONS: Array<{
  key: keyof CommunityIdentities;
  label: string;
  icon: React.ElementType;
}> = [
  { key: 'international', label: 'International', icon: Globe },
  { key: 'transfer', label: 'Transfer', icon: ArrowRightLeft },
  { key: 'firstGen', label: 'First-Generation', icon: Sparkles },
  { key: 'graduate', label: 'Graduate Student', icon: GraduationCap },
  { key: 'veteran', label: 'Veteran', icon: Shield },
];

const RESIDENCE_OPTIONS: Array<{
  value: ResidenceType;
  label: string;
  icon: React.ElementType;
}> = [
  { value: 'on-campus', label: 'On Campus', icon: Building2 },
  { value: 'off-campus', label: 'Off Campus', icon: Home },
  { value: 'commuter', label: 'Commuter', icon: Car },
];

interface BelongingScreenProps {
  entry: UseEntryReturn;
}

export function BelongingScreen({ entry }: BelongingScreenProps) {
  const hasAnyIdentity = Object.values(entry.data.communityIdentities).some(Boolean);
  const hasResidence = entry.data.residenceType !== null;
  const hasAnySelection = hasAnyIdentity || hasResidence;

  return (
    <div className="min-h-[60vh] flex flex-col">
      {/* Top bar with back */}
      <div className="flex items-center justify-between mb-8">
        <motion.button
          onClick={entry.goBack}
          className="flex items-center gap-2 text-[13px] text-white/30 hover:text-white/50 transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center space-y-12">
        {/* Community Identities Section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
          className="space-y-6"
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
                Belonging
              </span>
            </motion.div>

            <motion.h1
              className={cn(
                clashDisplay,
                'text-[2rem] md:text-[2.5rem] font-medium leading-[1.05] tracking-[-0.02em]'
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: EASE_PREMIUM }}
            >
              <span className="text-white">Do any of these</span>
              <br />
              <span className="text-white/40">describe you?</span>
            </motion.h1>
          </div>

          {/* Community identity checkboxes */}
          <div className="space-y-2">
            {COMMUNITY_OPTIONS.map((option, i) => {
              const isSelected = entry.data.communityIdentities[option.key];
              const Icon = option.icon;

              return (
                <motion.button
                  key={option.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: DURATION.fast + i * 0.05,
                    duration: DURATION.quick,
                    ease: EASE_PREMIUM,
                  }}
                  onClick={() => entry.toggleCommunityIdentity(option.key)}
                  className={cn(
                    'w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300',
                    'border-2 text-left',
                    isSelected
                      ? 'bg-gold-500/[0.06] border-gold-500/40 text-white'
                      : 'bg-white/[0.02] border-white/10 text-white/50 hover:border-white/20 hover:text-white/70 hover:bg-white/[0.04]'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300',
                      isSelected
                        ? 'bg-gold-500/15 text-gold-500'
                        : 'bg-white/[0.04] text-white/30'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[15px] font-medium">{option.label}</span>
                  <div className="ml-auto">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-md border-2 transition-all duration-300 flex items-center justify-center',
                        isSelected
                          ? 'bg-gold-500 border-gold-500'
                          : 'border-white/20'
                      )}
                    >
                      {isSelected && (
                        <motion.svg
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.15 }}
                          className="w-3 h-3 text-neutral-950"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2.5 6L5 8.5L9.5 4"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </motion.svg>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div
          className="h-px bg-white/[0.06]"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: EASE_PREMIUM }}
        />

        {/* Residence Section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: DURATION.smooth, ease: EASE_PREMIUM }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <motion.h2
              className={cn(
                clashDisplay,
                'text-[1.5rem] md:text-[1.75rem] font-medium leading-[1.1] tracking-[-0.02em]'
              )}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: EASE_PREMIUM }}
            >
              <span className="text-white">Where do you</span>{' '}
              <span className="text-white/40">live?</span>
            </motion.h2>
          </div>

          {/* Residence type options */}
          <div className="flex flex-wrap gap-3">
            {RESIDENCE_OPTIONS.map((option, i) => {
              const isSelected = entry.data.residenceType === option.value;
              const Icon = option.icon;

              return (
                <motion.button
                  key={option.value}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.55 + i * 0.06,
                    duration: DURATION.quick,
                    ease: EASE_PREMIUM,
                  }}
                  onClick={() =>
                    entry.setResidenceType(isSelected ? null : option.value)
                  }
                  className={cn(
                    'flex items-center gap-3 px-5 py-4 rounded-xl transition-all duration-300',
                    'border-2',
                    isSelected
                      ? 'bg-gold-500/[0.06] border-gold-500/40 text-white'
                      : 'bg-white/[0.02] border-white/10 text-white/50 hover:border-white/20 hover:text-white/70 hover:bg-white/[0.04]'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-colors duration-300',
                      isSelected ? 'text-gold-500' : 'text-white/30'
                    )}
                  />
                  <span className="text-[15px] font-medium">{option.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {entry.error && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[13px] text-red-400"
            >
              {entry.error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Continue / Skip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: DURATION.gentle,
            duration: DURATION.fast,
            ease: EASE_PREMIUM,
          }}
        >
          <button
            onClick={entry.submitBelonging}
            className={cn(
              'group px-8 py-4 rounded-xl font-medium transition-all duration-300',
              'flex items-center gap-2',
              hasAnySelection
                ? 'bg-white text-neutral-950 hover:bg-white/90'
                : 'bg-white/10 text-white/50 hover:bg-white/15'
            )}
          >
            <span>{hasAnySelection ? 'Continue' : 'Skip for now'}</span>
            <ArrowRight
              className={cn(
                'w-4 h-4 transition-transform',
                hasAnySelection
                  ? 'text-neutral-950 group-hover:translate-x-0.5'
                  : 'text-white/30'
              )}
            />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
