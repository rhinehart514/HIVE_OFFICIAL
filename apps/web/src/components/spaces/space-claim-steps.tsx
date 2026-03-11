'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Text,
  Button,
  Input,
  MOTION,
  ThresholdReveal,
} from '@hive/ui/design-system/primitives';

/* ─── Shared types & constants ─────────────────────────────── */

export interface ClaimSpace {
  id: string;
  name: string;
  slug?: string;
  category: string;
  memberCount: number;
  isClaimed: boolean;
  status?: 'unclaimed' | 'active' | 'claimed' | 'verified';
}

export const CATEGORY_COLORS: Record<string, { accent: string; text: string; bg: string; border: string }> = {
  university: {
    accent: 'bg-white/30',
    text: 'text-white/50',
    bg: 'bg-white/[0.05]',
    border: 'border-white/[0.05]',
  },
  residential: {
    accent: 'bg-emerald-500',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  greek: {
    accent: 'bg-[#FFD700]',
    text: 'text-[#FFD700]',
    bg: 'bg-[#FFD700]/10',
    border: 'border-[#FFD700]/20',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  university: 'University',
  residential: 'Residential',
  greek: 'Greek Life',
};

const LOCKED_CATEGORIES = new Set(['residential']);

export const ROLE_OPTIONS = [
  { value: 'president', label: 'President' },
  { value: 'vice_president', label: 'Vice President' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'board_member', label: 'Board Member' },
  { value: 'advisor', label: 'Advisor' },
  { value: 'other', label: 'Other Role' },
];

/* ─── Success Step ─────────────────────────────────────────── */

interface SuccessStepProps {
  space: ClaimSpace;
  onEnter: () => void;
}

export function SuccessStep({ space, onEnter }: SuccessStepProps) {
  return (
    <div className="p-8">
      <ThresholdReveal
        isReady={true}
        preparingMessage="Claiming your territory..."
        pauseDuration={600}
      >
        <div className="relative text-center">
          <motion.div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
            style={{
              background: '#FFD700',
              boxShadow: '0 0 40px rgba(255,215,0,0.3)',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <Check className="w-10 h-10 text-black" strokeWidth={3} />
          </motion.div>

          <h2
            className="text-2xl font-semibold mb-4"
            style={{ fontFamily: 'var(--font-clash)' }}
          >
            It&apos;s yours.
          </h2>

          <motion.p
            className="text-white/50 text-lg mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <strong className="text-white">{space.name}</strong> is now yours to lead.
          </motion.p>

          {space.memberCount > 0 && (
            <motion.p
              className="text-white/50 text-sm mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {space.memberCount} members notified
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Button
              variant="cta"
              size="lg"
              onClick={onEnter}
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

/* ─── Search Step ──────────────────────────────────────────── */

interface SearchStepProps {
  query: string;
  onQueryChange: (q: string) => void;
  spaces: ClaimSpace[];
  isSearching: boolean;
  onSelect: (space: ClaimSpace) => void;
}

export function SearchStep({ query, onQueryChange, spaces, isSearching, onSelect }: SearchStepProps) {
  const handleSelect = (space: ClaimSpace) => {
    if (LOCKED_CATEGORIES.has(space.category)) return;
    if (space.isClaimed || space.status === 'claimed' || space.status === 'verified') return;
    onSelect(space);
  };

  return (
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
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search for your space..."
          autoFocus
          className={cn(
            'w-full pl-10 pr-4 py-3',
            'bg-white/[0.05] border border-white/[0.05]',
            'rounded-lg text-white placeholder:text-white/50',
            'focus:outline-none focus:outline-2 focus:outline-[#FFD700]',
            'transition-colors duration-300'
          )}
        />
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {isSearching && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 text-white/50" />
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
                onClick={() => handleSelect(space)}
                disabled={isLocked || isClaimed}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg text-left',
                  'border transition-colors',
                  isLocked || isClaimed
                    ? 'border-white/[0.05] opacity-50 cursor-not-allowed'
                    : 'border-white/[0.05] hover:border-white/[0.10] hover:bg-white/[0.10]'
                )}
              >
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
                  <Text size="xs" className="text-white/50 whitespace-nowrap">RA only</Text>
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
  );
}

/* ─── Confirm Step ─────────────────────────────────────────── */

interface ConfirmStepProps {
  space: ClaimSpace;
  role: string;
  onRoleChange: (r: string) => void;
  customRole: string;
  onCustomRoleChange: (r: string) => void;
  error: string | null;
  isSubmitting: boolean;
  onClaim: () => void;
}

export function ConfirmStep({
  space, role, onRoleChange, customRole, onCustomRoleChange,
  error, isSubmitting, onClaim,
}: ConfirmStepProps) {
  const colors = CATEGORY_COLORS[space.category] || CATEGORY_COLORS.university;

  return (
    <motion.div
      key="confirm"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <div className="p-4 rounded-lg bg-white/[0.05] border border-white/[0.05]">
        <div className="flex items-center gap-4 mb-3">
          <div className={cn('w-1 h-12 rounded-full', colors.accent)} />
          <div>
            <Text weight="semibold" size="lg" className="text-white">
              {space.name}
            </Text>
            <Text size="sm" className={colors.text}>
              {CATEGORY_LABELS[space.category] || space.category}
            </Text>
          </div>
        </div>
        <Text size="sm" className="text-white/50 pl-5">
          {space.memberCount > 0 ? (
            <>
              <strong className="text-[#FFD700]">{space.memberCount}</strong>{' '}
              student{space.memberCount !== 1 ? 's' : ''} waiting for a leader.
            </>
          ) : (
            'Unclaimed territory. Be the first.'
          )}
        </Text>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/50 mb-2">
          Your role <span className="text-white/50">(optional)</span>
        </label>
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          className={cn(
            'w-full px-4 py-3 rounded-lg',
            'bg-white/[0.05] border border-white/[0.05]',
            'text-white',
            'transition-colors duration-300',
            'focus:outline-none focus:outline-2 focus:outline-[#FFD700]',
            'hover:bg-white/[0.10] hover:border-white/[0.10]',
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
            onChange={(e) => onCustomRoleChange(e.target.value)}
            placeholder="Enter your role..."
            className="mt-2"
          />
        )}
      </div>

      <div className="p-4 rounded-lg bg-white/[0.05] border border-white/[0.05]">
        <Text size="xs" weight="medium" className="text-white/50 mb-3">
          As admin, you&apos;ll be able to:
        </Text>
        <ul className="space-y-2">
          {['Create official events', 'Pin announcements', 'Deploy apps', 'Manage members'].map((benefit) => (
            <li key={benefit} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
              <Text size="sm" className="text-white/50">{benefit}</Text>
            </li>
          ))}
        </ul>
      </div>

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

      <Button
        variant="cta"
        size="lg"
        onClick={onClaim}
        disabled={isSubmitting}
        loading={isSubmitting}
        className="w-full"
      >
        Claim Territory
      </Button>
    </motion.div>
  );
}
