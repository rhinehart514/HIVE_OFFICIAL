'use client';

/**
 * /spaces/claim — Claim Institutional Space
 *
 * DRAMA.md: Territory claim is a defining moment.
 * Peak: "It's yours." with gold reveal after 600ms anticipation.
 *
 * For claiming pre-seeded institutional spaces:
 * - University spaces (blue accent)
 * - Residential spaces (green accent) - LOCKED, RA-only
 * - Greek spaces (purple accent)
 *
 * Student orgs should use /spaces (modal) instead.
 *
 * @version 9.0.0 - DRAMA.md patterns (Jan 2026)
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Text,
  Button,
  Input,
  MOTION,
  ThresholdReveal,
  WordReveal,
} from '@hive/ui/design-system/primitives';
import { toast } from '@hive/ui';
import { ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';

// Category colors - used for accent bars and borders
const CATEGORY_COLORS: Record<string, { accent: string; text: string; bg: string; border: string }> = {
  university: {
    accent: 'bg-blue-500',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  residential: {
    accent: 'bg-emerald-500',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  greek: {
    accent: 'bg-purple-500',
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  university: 'University',
  residential: 'Residential',
  greek: 'Greek Life',
};

// Residential spaces have locked leadership (RA-only)
const LOCKED_CATEGORIES = new Set(['residential']);

// Role options
const ROLE_OPTIONS = [
  { value: 'president', label: 'President' },
  { value: 'vice_president', label: 'Vice President' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'board_member', label: 'Board Member' },
  { value: 'advisor', label: 'Advisor' },
  { value: 'other', label: 'Other Role' },
];

interface Space {
  id: string;
  name: string;
  slug?: string;
  category: string;
  memberCount: number;
  isClaimed: boolean;
  status?: 'unclaimed' | 'active' | 'claimed' | 'verified';
}

export default function ClaimSpacePage() {
  const router = useRouter();

  // Flow state: search → confirm → success
  const [step, setStep] = React.useState<'search' | 'confirm' | 'success'>('search');
  const [selectedSpace, setSelectedSpace] = React.useState<Space | null>(null);

  // Search state
  const [query, setQuery] = React.useState('');
  const [spaces, setSpaces] = React.useState<Space[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  // Confirm state
  const [role, setRole] = React.useState('');
  const [customRole, setCustomRole] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Debounced search
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>(undefined);

  React.useEffect(() => {
    if (!query.trim()) {
      setSpaces([]);
      return;
    }

    setIsSearching(true);
    clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/spaces/search?q=${encodeURIComponent(query)}&unclaimed=true`, {
          credentials: 'include',
        });
        const data = await res.json();
        setSpaces(data.spaces || []);
      } catch {
        setSpaces([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [query]);

  const handleSelectSpace = (space: Space) => {
    if (LOCKED_CATEGORIES.has(space.category)) return;
    if (space.isClaimed || space.status === 'claimed' || space.status === 'verified') return;

    setSelectedSpace(space);
    setStep('confirm');
    setError(null);
  };

  const handleClaim = async () => {
    if (!selectedSpace) return;

    // Validate custom role if selected
    if (role === 'other' && !customRole.trim()) {
      setError('Please specify your role');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const finalRole = role === 'other'
      ? customRole.trim()
      : ROLE_OPTIONS.find(r => r.value === role)?.label || 'Admin';

    try {
      const res = await fetch('/api/spaces/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          spaceId: selectedSpace.id,
          role: finalRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim space');
      }

      setStep('success');
      toast.success('Your space is live!', `You're now the admin of ${selectedSpace.name}`);

      // Set flag for onboarding banner
      try {
        localStorage.setItem(
          `hive_just_claimed_${selectedSpace.id}`,
          new Date().toISOString()
        );
      } catch {
        // Ignore storage errors
      }

      // Note: Redirect handled by success state's button now
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim space');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state - DRAMA.md: ThresholdReveal with gold "It's yours." moment
  if (step === 'success' && selectedSpace) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
        {/* Ambient gold glow */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: MOTION.duration.slow }}
        >
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]"
            style={{
              background: `radial-gradient(ellipse at center, rgba(255,215,0,0.2) 0%, transparent 70%)`,
              filter: 'blur(80px)',
            }}
          />
        </motion.div>

        <ThresholdReveal
          isReady={true}
          preparingMessage="Claiming your territory..."
          pauseDuration={600}
        >
          <div className="relative text-center">
            {/* Gold checkmark - earned */}
            <motion.div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
              style={{
                background: 'linear-gradient(135deg, #FFD700, #B8860B)',
                boxShadow: '0 0 40px rgba(255,215,0,0.3)',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <CheckIcon className="w-10 h-10 text-black" strokeWidth={3} />
            </motion.div>

            {/* Word-by-word reveal: "It's yours." */}
            <h2
              className="text-[32px] font-semibold mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <WordReveal
                text="It's yours."
                variant="gold"
                delay={0.2}
              />
            </h2>

            {/* Space name */}
            <motion.p
              className="text-white/60 text-lg mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <strong className="text-white">{selectedSpace.name}</strong> is now yours to lead.
            </motion.p>

            {/* Waitlist notification */}
            {selectedSpace.memberCount > 0 && (
              <motion.p
                className="text-white/40 text-sm mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {selectedSpace.memberCount} members notified
              </motion.p>
            )}

            {/* Enter button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <Button
                variant="cta"
                size="lg"
                onClick={() => router.push(`/s/${selectedSpace.slug || selectedSpace.id}`)}
                className="px-12"
              >
                Enter Your Territory
              </Button>
            </motion.div>
          </div>
        </ThresholdReveal>
      </div>
    );
  }

  // Confirm state
  if (step === 'confirm' && selectedSpace) {
    const colors = CATEGORY_COLORS[selectedSpace.category] || CATEGORY_COLORS.university;

    return (
      <div className="min-h-screen w-full relative">
        {/* Category accent line */}
        <motion.div
          className={cn('absolute top-0 left-0 right-0 h-px', colors.accent, 'opacity-40')}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: MOTION.duration.slower, ease: MOTION.ease.premium }}
          style={{ transformOrigin: 'left' }}
        />

        <div className="max-w-lg mx-auto px-6 py-12">
          {/* Back */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
          >
            <button
              onClick={() => {
                setStep('search');
                setError(null);
              }}
              className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M10 12L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back to search
            </button>
          </motion.div>

          {/* Selected space - colored accent bar instead of icon */}
          <motion.div
            className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION.duration.fast, delay: 0.04, ease: MOTION.ease.premium }}
          >
            <div className="flex items-center gap-4 mb-4">
              {/* Colored accent bar instead of category icon */}
              <div className={cn('w-1 h-14 rounded-full', colors.accent)} />
              <div>
                <Text weight="semibold" size="lg" className="text-white">
                  {selectedSpace.name}
                </Text>
                <Text size="sm" className={colors.text}>
                  {CATEGORY_LABELS[selectedSpace.category] || selectedSpace.category}
                </Text>
              </div>
            </div>
            <Text size="sm" className="text-white/60 pl-5">
              {selectedSpace.memberCount > 0 ? (
                <>
                  <strong className="text-[#FFD700]">{selectedSpace.memberCount}</strong>{' '}
                  student{selectedSpace.memberCount !== 1 ? 's' : ''} waiting for a leader.
                </>
              ) : (
                'Unclaimed territory. Be the first.'
              )}
            </Text>
          </motion.div>

          {/* Role selection */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION.duration.fast, delay: 0.08, ease: MOTION.ease.premium }}
          >
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Your role <span className="text-white/40">(optional)</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={cn(
                  'w-full px-3 py-2.5 rounded-lg',
                  'bg-white/[0.04] border border-white/[0.08]',
                  'text-white',
                  'focus:outline-none focus:ring-2 focus:ring-white/20'
                )}
              >
                <option value="">Select or skip</option>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {role === 'other' && (
                <Input
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="Enter your role..."
                  className="mt-2"
                />
              )}
            </div>

            {/* Admin benefits - dots instead of check icons */}
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <Text size="xs" weight="medium" className="text-white/50 mb-3">
                As admin, you&apos;ll be able to:
              </Text>
              <ul className="space-y-2">
                {['Create official events', 'Pin announcements', 'Deploy tools', 'Manage members'].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <Text size="sm" className="text-white/60">{benefit}</Text>
                  </li>
                ))}
              </ul>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: MOTION.duration.fast }}
              >
                <Text size="sm" className="text-red-400">
                  {error}
                </Text>
              </motion.div>
            )}

            {/* Submit - Gold CTA for claim moment */}
            <Button
              variant="cta"
              size="lg"
              onClick={handleClaim}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                'Claim Territory'
              )}
            </Button>

            <Text size="xs" className="text-white/30 text-center">
              You&apos;ll get instant access
            </Text>
          </motion.div>
        </div>
      </div>
    );
  }

  // Search state (default)
  return (
    <div className="min-h-screen w-full relative">
      {/* Default accent line (blue for university) */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px bg-blue-500/40"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: MOTION.duration.slower, ease: MOTION.ease.premium }}
        style={{ transformOrigin: 'left' }}
      />

      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Back */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
        >
          <Link
            href="/spaces"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to browse
          </Link>
        </motion.div>

        {/* Header - DRAMA.md: Territory language */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.fast, delay: 0.04, ease: MOTION.ease.premium }}
        >
          <h1 className="text-2xl font-semibold text-white mb-2 tracking-tight">
            Claim Your Territory
          </h1>
          <Text className="text-white/50">
            Your org exists. It just needs a leader.
          </Text>
        </motion.div>

        {/* Search */}
        <motion.div
          className="space-y-4 p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.fast, delay: 0.08, ease: MOTION.ease.premium }}
        >
          <div className="relative">
            {/* Search icon - functional, not decorative */}
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 14L10.5 10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for your space..."
              autoFocus
              className={cn(
                'w-full pl-10 pr-4 py-2.5',
                'bg-white/[0.04] border border-white/[0.08]',
                'rounded-lg text-white placeholder:text-white/30',
                'focus:outline-none focus:ring-2 focus:ring-white/20',
                'transition-all duration-150'
              )}
            />
          </div>

          {/* Results */}
          <div className="space-y-2 max-h-[40vh] sm:max-h-[300px] overflow-y-auto">
            {isSearching && (
              <div className="flex items-center justify-center py-6">
                <ArrowPathIcon className="h-4 w-4 animate-spin text-white/40" />
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {!isSearching && spaces.map((space) => {
                const isLocked = LOCKED_CATEGORIES.has(space.category);
                const isClaimed = space.isClaimed || space.status === 'claimed' || space.status === 'verified';
                const colors = CATEGORY_COLORS[space.category] || CATEGORY_COLORS.university;

                return (
                  <motion.button
                    key={space.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
                    onClick={() => handleSelectSpace(space)}
                    disabled={isLocked || isClaimed}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg text-left',
                      'border transition-all',
                      isLocked || isClaimed
                        ? 'border-white/[0.04] opacity-50 cursor-not-allowed'
                        : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]'
                    )}
                  >
                    {/* Colored accent bar instead of category icon */}
                    <div className={cn('w-1 h-10 rounded-full flex-shrink-0', colors.accent)} />
                    <div className="flex-1 min-w-0">
                      <Text weight="medium" className="text-white/90 truncate">
                        {space.name}
                      </Text>
                      <Text size="xs" className="text-white/40">
                        {space.memberCount > 0 ? (
                          <span className="text-[#FFD700]/70">
                            {space.memberCount} student{space.memberCount !== 1 ? 's' : ''} waiting
                          </span>
                        ) : (
                          CATEGORY_LABELS[space.category] || space.category
                        )}
                      </Text>
                    </div>
                    {isLocked ? (
                      <Text size="xs" className="text-white/40 whitespace-nowrap">
                        RA only
                      </Text>
                    ) : isClaimed ? (
                      <Text size="xs" className="text-white/40">Has admin</Text>
                    ) : (
                      <Text size="xs" className="text-white/50">Claim</Text>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>

            {!isSearching && query && spaces.length === 0 && (
              <div className="text-center py-6">
                <Text className="text-white/50 mb-1">No spaces found</Text>
                <Text size="sm" className="text-white/30">
                  Try a different search
                </Text>
              </div>
            )}
          </div>

          {/* Create alternative */}
          <div className="pt-4 border-t border-white/[0.04]">
            <Link
              href="/spaces/create"
              className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-white/[0.08] hover:border-white/[0.15] transition-colors"
            >
              <div className="w-1 h-10 rounded-full bg-teal-500/40 flex-shrink-0" />
              <div>
                <Text weight="medium" className="text-white/70">
                  Can&apos;t find your org?
                </Text>
                <Text size="xs" className="text-white/40">
                  Create a new student org space
                </Text>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
