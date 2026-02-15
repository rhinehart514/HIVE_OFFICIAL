'use client';

/**
 * SpaceClaimModal — Claim Institutional Space
 *
 * DRAMA.md: Territory claim is a defining moment.
 * Peak: "It's yours." with gold reveal after 600ms anticipation.
 *
 * Extracted from /spaces/claim/page.tsx for modal-based IA.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Text,
  Button,
  Input,
  MOTION,
  ThresholdReveal,
} from '@hive/ui/design-system/primitives';
import { toast } from '@hive/ui';

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

interface SpaceClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultQuery?: string;
}

export function SpaceClaimModal({ isOpen, onClose, defaultQuery = '' }: SpaceClaimModalProps) {
  const router = useRouter();

  // Flow state: search → confirm → success
  const [step, setStep] = React.useState<'search' | 'confirm' | 'success'>('search');
  const [selectedSpace, setSelectedSpace] = React.useState<Space | null>(null);

  // Search state
  const [query, setQuery] = React.useState(defaultQuery);
  const [spaces, setSpaces] = React.useState<Space[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  // Confirm state
  const [role, setRole] = React.useState('');
  const [customRole, setCustomRole] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Sync defaultQuery when modal opens
  React.useEffect(() => {
    if (isOpen && defaultQuery && !query) {
      setQuery(defaultQuery);
    }
  }, [isOpen, defaultQuery]); // eslint-disable-line react-hooks/exhaustive-deps

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim space');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnterSpace = () => {
    if (selectedSpace) {
      router.push(`/s/${selectedSpace.slug || selectedSpace.id}`);
      handleClose();
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setStep('search');
    setSelectedSpace(null);
    setQuery('');
    setSpaces([]);
    setRole('');
    setCustomRole('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 "
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-lg bg-[var(--bg-ground)] border border-white/[0.06] rounded-lg overflow-hidden"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
        >
          {/* Success state - full modal take-over */}
          {step === 'success' && selectedSpace ? (
            <div className="p-8">
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
                    <Check className="w-10 h-10 text-black" strokeWidth={3} />
                  </motion.div>

                  {/* Word-by-word reveal: "It's yours." */}
                  <h2
                    className="text-2xl font-semibold mb-4"
                    style={{ fontFamily: 'var(--font-clash)' }}
                  >
                    It&apos;s yours.
                  </h2>

                  {/* Space name */}
                  <motion.p
                    className="text-white/50 text-lg mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <strong className="text-white">{selectedSpace.name}</strong> is now yours to lead.
                  </motion.p>

                  {/* Waitlist notification */}
                  {selectedSpace.memberCount > 0 && (
                    <motion.p
                      className="text-white/50 text-sm mb-8"
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
                      onClick={handleEnterSpace}
                      className="px-12"
                    >
                      Enter Your Territory
                    </Button>
                  </motion.div>
                </div>
              </ThresholdReveal>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <button
                  onClick={step === 'search' ? handleClose : () => {
                    setStep('search');
                    setError(null);
                  }}
                  className="text-white/50 hover:text-white/50 text-sm transition-colors flex items-center gap-1"
                >
                  {step === 'search' ? 'Cancel' : (
                    <>
                      <ArrowLeft size={16} />
                      Back
                    </>
                  )}
                </button>
                <span className="text-white/50 text-sm font-medium">
                  Claim Space
                </span>
                <button onClick={handleClose} className="text-white/50 hover:text-white/50 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {/* Search step */}
                  {step === 'search' && (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-6">
                        <h2 className="text-xl font-semibold text-white mb-2 tracking-tight">
                          Claim Your Territory
                        </h2>
                        <Text className="text-white/50">
                          Your org exists. It just needs a leader.
                        </Text>
                      </div>

                      {/* Search */}
                      <div className="relative">
                        <svg
                          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50"
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
                            'w-full pl-10 pr-4 py-3',
                            'bg-white/[0.06] border border-white/[0.06]',
                            'rounded-lg text-white placeholder:text-white/50',
                            'focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50',
                            'transition-all duration-300'
                          )}
                        />
                      </div>

                      {/* Results */}
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {isSearching && (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4  text-white/50" />
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
                                    ? 'border-white/[0.06] opacity-50 cursor-not-allowed'
                                    : 'border-white/[0.06] hover:border-white/[0.06] hover:bg-white/[0.06]'
                                )}
                              >
                                {/* Colored accent bar */}
                                <div className={cn('w-1 h-10 rounded-full flex-shrink-0', colors.accent)} />
                                <div className="flex-1 min-w-0">
                                  <Text weight="medium" className="text-white truncate">
                                    {space.name}
                                  </Text>
                                  <Text size="xs" className="text-white/50">
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
                                  <Text size="xs" className="text-white/50 whitespace-nowrap">
                                    RA only
                                  </Text>
                                ) : isClaimed ? (
                                  <Text size="xs" className="text-white/50">Has admin</Text>
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
                            <Text size="sm" className="text-white/50">
                              Try a different search
                            </Text>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Confirm step */}
                  {step === 'confirm' && selectedSpace && (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6"
                    >
                      {/* Selected space preview */}
                      {(() => {
                        const colors = CATEGORY_COLORS[selectedSpace.category] || CATEGORY_COLORS.university;
                        return (
                          <div className="p-4 rounded-lg bg-white/[0.06] border border-white/[0.06]">
                            <div className="flex items-center gap-4 mb-3">
                              <div className={cn('w-1 h-12 rounded-full', colors.accent)} />
                              <div>
                                <Text weight="semibold" size="lg" className="text-white">
                                  {selectedSpace.name}
                                </Text>
                                <Text size="sm" className={colors.text}>
                                  {CATEGORY_LABELS[selectedSpace.category] || selectedSpace.category}
                                </Text>
                              </div>
                            </div>
                            <Text size="sm" className="text-white/50 pl-5">
                              {selectedSpace.memberCount > 0 ? (
                                <>
                                  <strong className="text-[#FFD700]">{selectedSpace.memberCount}</strong>{' '}
                                  student{selectedSpace.memberCount !== 1 ? 's' : ''} waiting for a leader.
                                </>
                              ) : (
                                'Unclaimed territory. Be the first.'
                              )}
                            </Text>
                          </div>
                        );
                      })()}

                      {/* Role selection */}
                      <div>
                        <label className="block text-sm font-medium text-white/50 mb-2">
                          Your role <span className="text-white/50">(optional)</span>
                        </label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className={cn(
                            'w-full px-4 py-3 rounded-lg',
                            'bg-white/[0.06] border border-white/[0.06]',
                            'text-white',
                            'transition-all duration-300',
                            'focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50',
                            'hover:bg-white/[0.06] hover:border-white/25',
                            'appearance-none bg-no-repeat bg-right cursor-pointer'
                          )}
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff50' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 12px center',
                            backgroundSize: '20px 20px',
                            paddingRight: '44px',
                          }}
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
                      <div className="p-4 rounded-lg bg-white/[0.06] border border-white/[0.06]">
                        <Text size="xs" weight="medium" className="text-white/50 mb-3">
                          As admin, you&apos;ll be able to:
                        </Text>
                        <ul className="space-y-2">
                          {['Create official events', 'Pin announcements', 'Deploy tools', 'Manage members'].map((benefit) => (
                            <li key={benefit} className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                              <Text size="sm" className="text-white/50">{benefit}</Text>
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

                      {/* Submit */}
                      <Button
                        variant="cta"
                        size="lg"
                        onClick={handleClaim}
                        disabled={isSubmitting}
                        loading={isSubmitting}
                        className="w-full"
                      >
                        Claim Territory
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SpaceClaimModal;
