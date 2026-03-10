'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, Crown, ChevronDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Button, ConfirmDialog } from '@hive/ui';
import type { SpaceData, TransferCandidate } from './types';

interface TransferOwnershipProps {
  space: SpaceData;
  currentUserId?: string;
  onTransferOwnership: (newOwnerId: string) => Promise<void>;
}

export function TransferOwnership({
  space,
  currentUserId,
  onTransferOwnership,
}: TransferOwnershipProps) {
  const [transferCandidates, setTransferCandidates] = React.useState<TransferCandidate[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = React.useState(false);
  const [selectedTransferTarget, setSelectedTransferTarget] = React.useState<string | null>(null);
  const [showTransferConfirm, setShowTransferConfirm] = React.useState(false);
  const [isTransferring, setIsTransferring] = React.useState(false);
  const [showTransferDropdown, setShowTransferDropdown] = React.useState(false);
  const transferDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (transferCandidates.length > 0) return;
    setIsLoadingCandidates(true);
    fetch(`/api/spaces/${space.id}/members?limit=100`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { data: { members: [] } }))
      .then((data) => {
        const allMembers = data.data?.members || data.members || [];
        const eligible = allMembers
          .filter((m: { id?: string; userId?: string }) => {
            const memberId = m.id || m.userId;
            return memberId !== currentUserId;
          })
          .map(
            (m: {
              id?: string;
              userId?: string;
              profile?: { displayName?: string; handle?: string; avatar?: string };
              name?: string;
              username?: string;
              avatar?: string;
              membership?: { role?: string };
              role?: string;
            }) => ({
              id: m.id || m.userId || '',
              name: m.profile?.displayName || m.name || 'Unknown',
              username: m.profile?.handle || m.username || '',
              avatar: m.profile?.avatar || m.avatar,
              role: m.membership?.role || m.role || 'member',
            })
          )
          .sort((a: { role: string }, b: { role: string }) => {
            const order: Record<string, number> = { admin: 0, moderator: 1, member: 2 };
            return (order[a.role] ?? 3) - (order[b.role] ?? 3);
          });
        setTransferCandidates(eligible);
      })
      .catch(() => setTransferCandidates([]))
      .finally(() => setIsLoadingCandidates(false));
  }, [space.id, currentUserId, transferCandidates.length]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (transferDropdownRef.current && !transferDropdownRef.current.contains(event.target as Node)) {
        setShowTransferDropdown(false);
      }
    }
    if (showTransferDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTransferDropdown]);

  const selectedCandidate = transferCandidates.find((c) => c.id === selectedTransferTarget);

  const handleTransfer = async () => {
    if (!selectedTransferTarget) return;
    setIsTransferring(true);
    try {
      await onTransferOwnership(selectedTransferTarget);
      setShowTransferConfirm(false);
      setSelectedTransferTarget(null);
    } catch {
      // Error handled by caller
    } finally {
      setIsTransferring(false);
    }
  };

  const roleBadge = (role: string) => (
    <span
      className={cn(
        'text-xs px-1.5 py-0.5 rounded-md',
        role === 'admin'
          ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)]'
          : 'bg-white/[0.06] text-white/50'
      )}
    >
      {role === 'admin' ? 'Leader' : role === 'moderator' ? 'Mod' : 'Member'}
    </span>
  );

  return (
    <>
      <div className="p-4 rounded-lg bg-amber-500/[0.06] border border-amber-500/20">
        <div className="flex items-start gap-3 mb-4">
          <ArrowRightLeft className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <Text weight="medium" className="text-amber-400 mb-1">Transfer Ownership</Text>
            <Text size="sm" className="text-amber-400/70">
              Hand off ownership to another member. You will become an admin. This cannot be
              undone without the new owner&apos;s consent.
            </Text>
          </div>
        </div>

        <div className="mb-3">
          <Text size="xs" weight="medium" tone="muted" className="mb-2 block">
            Select new owner
          </Text>

          {isLoadingCandidates ? (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.06]">
              <Loader2 className="w-4 h-4 text-white/50" />
              <Text size="sm" tone="muted">Loading members...</Text>
            </div>
          ) : transferCandidates.length === 0 ? (
            <div className="px-3 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.06]">
              <Text size="sm" tone="muted">No eligible members found</Text>
            </div>
          ) : (
            <div className="relative" ref={transferDropdownRef}>
              <button
                type="button"
                onClick={() => setShowTransferDropdown(!showTransferDropdown)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5',
                  'rounded-lg text-sm text-left',
                  'bg-white/[0.06] border border-white/[0.06]',
                  'hover:bg-white/[0.06] transition-colors',
                  showTransferDropdown && 'outline outline-2 outline-[#FFD700]'
                )}
              >
                {selectedCandidate ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white/[0.06] flex items-center justify-center text-xs font-medium text-white/50 overflow-hidden flex-shrink-0">
                      {selectedCandidate.avatar ? (
                        <img src={selectedCandidate.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        selectedCandidate.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-white">{selectedCandidate.name}</span>
                    {roleBadge(selectedCandidate.role)}
                  </div>
                ) : (
                  <span className="text-white/50">Choose a member...</span>
                )}
                <ChevronDown className={cn('w-4 h-4 text-white/50 transition-transform', showTransferDropdown && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {showTransferDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'absolute left-0 right-0 top-full mt-1 z-50',
                      'max-h-[240px] overflow-y-auto',
                      'rounded-lg border border-white/[0.06] bg-[var(--bg-elevated)]',
                      'py-1'
                    )}
                  >
                    {transferCandidates.map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => {
                          setSelectedTransferTarget(candidate.id);
                          setShowTransferDropdown(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-left',
                          'hover:bg-white/[0.06] transition-colors',
                          selectedTransferTarget === candidate.id && 'bg-white/[0.06]'
                        )}
                      >
                        <div className="w-6 h-6 rounded-md bg-white/[0.06] flex items-center justify-center text-xs font-medium text-white/50 overflow-hidden flex-shrink-0">
                          {candidate.avatar ? (
                            <img src={candidate.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            candidate.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Text size="sm" weight="medium" className="truncate">{candidate.name}</Text>
                          {candidate.username && (
                            <Text size="xs" tone="muted" className="font-sans truncate">@{candidate.username}</Text>
                          )}
                        </div>
                        <span className="flex-shrink-0">{roleBadge(candidate.role)}</span>
                        {selectedTransferTarget === candidate.id && (
                          <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTransferConfirm(true)}
          disabled={!selectedTransferTarget || isTransferring}
          className="text-amber-400 hover:bg-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Crown className="w-4 h-4 mr-2" />
          Transfer Ownership
        </Button>
      </div>

      <ConfirmDialog
        open={showTransferConfirm}
        onOpenChange={setShowTransferConfirm}
        variant="warning"
        title="Transfer ownership?"
        description={
          selectedCandidate
            ? `You are about to make ${selectedCandidate.name} the owner of "${space.name}". You will be demoted to admin. Only the new owner can reverse this.`
            : 'Select a member to transfer ownership to.'
        }
        confirmText={isTransferring ? 'Transferring...' : 'Transfer Ownership'}
        onConfirm={handleTransfer}
        loading={isTransferring}
      />
    </>
  );
}
