'use client';

/**
 * /spaces/claim — Claim Institutional Space
 *
 * Archetype: Focus Flow (Shell ON, centered form)
 * Pattern: Search + Confirm flow
 * Shell: ON
 *
 * For claiming pre-seeded institutional spaces:
 * - University spaces (blue accent)
 * - Residential spaces (green accent) - LOCKED, RA-only
 * - Greek spaces (purple accent)
 *
 * Student orgs should use /spaces/create instead.
 *
 * @version 7.0.0 - Institutional verification (Jan 2026)
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Check, Loader2, Building2, Home, Crown, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Text, Button, Input } from '@hive/ui/design-system/primitives';
import { toast } from '@hive/ui';

// Category helper functions (use CSS classes defined in globals.css)
function getCategoryAccentClass(category: string): string {
  const map: Record<string, string> = {
    university: 'category-accent-university',
    residential: 'category-accent-residential',
    greek: 'category-accent-greek',
  };
  return map[category] || 'category-accent-university';
}

function getCategoryTextClass(category: string): string {
  const map: Record<string, string> = {
    university: 'category-text-university',
    residential: 'category-text-residential',
    greek: 'category-text-greek',
  };
  return map[category] || 'category-text-university';
}

function getCategoryBgClass(category: string): string {
  const map: Record<string, string> = {
    university: 'category-bg-university',
    residential: 'category-bg-residential',
    greek: 'category-bg-greek',
  };
  return map[category] || 'category-bg-university';
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  university: Building2,
  residential: Home,
  greek: Crown,
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

// Animation
const EASE = [0.22, 1, 0.36, 1] as const;
const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: EASE },
});

interface Space {
  id: string;
  name: string;
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
      toast.success('Space claimed!');

      // Redirect after brief delay
      setTimeout(() => {
        router.push(`/spaces/${selectedSpace.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim space');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (step === 'success' && selectedSpace) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <motion.div className="text-center space-y-4" {...fadeIn(0)}>
          <div
            className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto',
              getCategoryBgClass(selectedSpace.category)
            )}
          >
            <Check className={cn('h-8 w-8', getCategoryTextClass(selectedSpace.category))} />
          </div>
          <div>
            <Text weight="semibold" size="lg" className="text-white mb-1">
              You&apos;re the admin.
            </Text>
            <Text className="text-white/60">
              <strong className="text-white">{selectedSpace.name}</strong> is yours to lead.
            </Text>
            <Text size="sm" className="text-white/40 mt-2">
              Taking you there now...
            </Text>
          </div>
        </motion.div>
      </div>
    );
  }

  // Confirm state
  if (step === 'confirm' && selectedSpace) {
    const CategoryIcon = CATEGORY_ICONS[selectedSpace.category] || Building2;

    return (
      <div className="min-h-screen w-full relative">
        {/* Category accent line */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-1',
            getCategoryAccentClass(selectedSpace.category)
          )}
        />

        <div className="max-w-lg mx-auto px-6 py-12">
          {/* Back */}
          <motion.div className="mb-8" {...fadeIn(0)}>
            <button
              onClick={() => {
                setStep('search');
                setError(null);
              }}
              className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to search
            </button>
          </motion.div>

          {/* Selected space */}
          <motion.div
            className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-8"
            {...fadeIn(0.04)}
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center',
                  getCategoryBgClass(selectedSpace.category)
                )}
              >
                <CategoryIcon className={cn('h-7 w-7', getCategoryTextClass(selectedSpace.category))} />
              </div>
              <div>
                <Text weight="semibold" size="lg" className="text-white">
                  {selectedSpace.name}
                </Text>
                <Text size="sm" className="text-white/50">
                  {CATEGORY_LABELS[selectedSpace.category] || selectedSpace.category}
                </Text>
              </div>
            </div>
            <Text size="sm" className="text-white/60">
              {selectedSpace.memberCount > 0 ? (
                <>
                  <strong className="text-white">{selectedSpace.memberCount}</strong> members already here.
                  They need an admin.
                </>
              ) : (
                'This space is waiting for its first admin.'
              )}
            </Text>
          </motion.div>

          {/* Role selection */}
          <motion.div className="space-y-6" {...fadeIn(0.08)}>
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

            {/* Admin benefits */}
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <Text size="xs" weight="medium" className="text-white/50 mb-3">
                As admin, you&apos;ll be able to:
              </Text>
              <ul className="space-y-2">
                {['Create official events', 'Pin announcements', 'Deploy tools', 'Manage members'].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <Text size="sm" className="text-white/60">{benefit}</Text>
                  </li>
                ))}
              </ul>
            </div>

            {/* Error */}
            {error && (
              <Text size="sm" className="text-red-400">
                {error}
              </Text>
            )}

            {/* Submit */}
            <Button
              variant="default"
              size="lg"
              onClick={handleClaim}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Take Ownership'
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
      {/* Default accent line (university blue) */}
      <div className="absolute top-0 left-0 right-0 h-1 category-accent-university" />

      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Back */}
        <motion.div className="mb-8" {...fadeIn(0)}>
          <Link
            href="/spaces/browse"
            className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to browse
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div className="mb-8" {...fadeIn(0.04)}>
          <h1 className="text-2xl font-semibold text-white mb-2 tracking-tight">
            Claim Your Space
          </h1>
          <Text className="text-white/50">
            Find your university, residential, or Greek space and become the admin.
          </Text>
        </motion.div>

        {/* Search */}
        <motion.div
          className="space-y-4 p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]"
          {...fadeIn(0.08)}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
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

          {/* Results - responsive height for mobile */}
          <div className="space-y-2 max-h-[40vh] sm:max-h-[300px] overflow-y-auto">
            {isSearching && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-white/40" />
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {!isSearching && spaces.map((space) => {
                const isLocked = LOCKED_CATEGORIES.has(space.category);
                const isClaimed = space.isClaimed || space.status === 'claimed' || space.status === 'verified';
                const Icon = CATEGORY_ICONS[space.category] || Building2;

                return (
                  <motion.button
                    key={space.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => handleSelectSpace(space)}
                    disabled={isLocked || isClaimed}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg text-left',
                      'border transition-all duration-150',
                      isLocked || isClaimed
                        ? 'border-white/[0.04] opacity-50 cursor-not-allowed'
                        : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        getCategoryBgClass(space.category)
                      )}
                    >
                      <Icon className={cn('h-5 w-5', getCategoryTextClass(space.category))} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text weight="medium" className="text-white/90 truncate">
                        {space.name}
                      </Text>
                      <Text size="xs" className="text-white/40">
                        {space.memberCount > 0
                          ? `${space.memberCount} members · No admin`
                          : CATEGORY_LABELS[space.category] || space.category}
                      </Text>
                    </div>
                    {isLocked ? (
                      <div className="flex items-center gap-1 text-xs text-white/40">
                        <Lock className="h-3 w-3" />
                        <span>RA only</span>
                      </div>
                    ) : isClaimed ? (
                      <Text size="xs" className="text-white/40">Has admin</Text>
                    ) : (
                      <Text size="xs" className="text-white/50">Claim →</Text>
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
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
                <Text className="text-white/40">+</Text>
              </div>
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
