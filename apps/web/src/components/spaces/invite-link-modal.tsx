'use client';

/**
 * InviteLinkModal - Modal for generating and managing invite links
 *
 * Allows space leaders to:
 * - Generate new invite links with expiry settings
 * - Copy shareable links
 * - View QR code for easy sharing
 * - Manage existing invite links
 *
 * @version 1.0.0 - Leader Power Suite (Jan 2026)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  QrCodeIcon,
  TrashIcon,
  CheckIcon,
  ArrowPathIcon,
  ClockIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Text, Button, Skeleton } from '@hive/ui/design-system/primitives';
import { toast } from '@hive/ui';
import { secureApiFetch } from '@/lib/secure-auth-utils';

// ============================================================
// Types
// ============================================================

interface InviteLink {
  id: string;
  code: string;
  spaceId: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  maxUses?: number;
  uses: number;
  isActive: boolean;
}

interface InviteLinkModalProps {
  spaceId: string;
  spaceName: string;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================
// Expiry Options
// ============================================================

const EXPIRY_OPTIONS = [
  { value: 1, label: '1 day' },
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
];

const MAX_USE_OPTIONS = [
  { value: undefined, label: 'Unlimited' },
  { value: 10, label: '10 uses' },
  { value: 25, label: '25 uses' },
  { value: 50, label: '50 uses' },
  { value: 100, label: '100 uses' },
];

// ============================================================
// QR Code Component (using simple inline SVG)
// ============================================================

function QRCodeDisplay({ value }: { value: string }) {
  // For simplicity, we'll show a placeholder with a copy link option
  // In production, you'd use a library like 'qrcode' or 'qrcode.react'
  return (
    <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-lg">
      <div className="w-32 h-32 bg-[var(--bg-ground)] rounded-lg flex items-center justify-center">
        <QrCodeIcon className="w-16 h-16 text-white/50" />
      </div>
      <Text size="xs" className="text-[#0A0A09]/60 text-center max-w-[200px] break-all">
        {value}
      </Text>
    </div>
  );
}

// ============================================================
// Invite Link Row
// ============================================================

function InviteLinkRow({
  invite,
  onCopy,
  onRevoke,
  isRevoking,
}: {
  invite: InviteLink;
  onCopy: () => void;
  onRevoke: () => void;
  isRevoking: boolean;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expiresIn = invite.expiresAt
    ? formatTimeRemaining(new Date(invite.expiresAt))
    : 'Never';

  const usageText = invite.maxUses
    ? `${invite.uses}/${invite.maxUses} uses`
    : `${invite.uses} uses`;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.06] border border-white/[0.06]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <LinkIcon className="w-4 h-4 text-white/50 flex-shrink-0" />
          <Text size="sm" className="text-white font-mono truncate">
            .../{invite.code.slice(0, 8)}
          </Text>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span className="flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            {expiresIn}
          </span>
          <span className="flex items-center gap-1">
            <UsersIcon className="w-3 h-3" />
            {usageText}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className={cn(
            'p-2 rounded-lg transition-colors',
            copied
              ? 'bg-[var(--status-success-subtle)] text-[var(--status-success)]'
              : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.06] hover:text-white'
          )}
          aria-label={copied ? 'Link copied' : 'Copy invite link'}
        >
          {copied ? (
            <CheckIcon className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ClipboardDocumentIcon className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
        <button
          onClick={onRevoke}
          disabled={isRevoking}
          className="p-2 rounded-lg bg-white/[0.06] text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-50"
          aria-label={isRevoking ? 'Revoking link' : 'Revoke invite link'}
        >
          {isRevoking ? (
            <ArrowPathIcon className="w-4 h-4 " aria-hidden="true" />
          ) : (
            <TrashIcon className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Helper Functions
// ============================================================

function formatTimeRemaining(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return 'Soon';
}

// ============================================================
// Main Component
// ============================================================

export function InviteLinkModal({
  spaceId,
  spaceName,
  isOpen,
  onClose,
}: InviteLinkModalProps) {
  const [invites, setInvites] = React.useState<InviteLink[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [revokingId, setRevokingId] = React.useState<string | null>(null);
  const [showQR, setShowQR] = React.useState(false);
  const [selectedInvite, setSelectedInvite] = React.useState<InviteLink | null>(null);

  // Settings for new invite
  const [expiryDays, setExpiryDays] = React.useState(7);
  const [maxUses, setMaxUses] = React.useState<number | undefined>(undefined);

  // Fetch existing invites
  const fetchInvites = React.useCallback(async () => {
    if (!spaceId) return;

    setLoading(true);
    try {
      const res = await secureApiFetch(`/api/spaces/${spaceId}/invite`, {
        method: 'GET',
      });
      const data = await res.json();

      if (data.success !== false && data.invites) {
        setInvites(
          data.invites.map((inv: InviteLink) => ({
            ...inv,
            createdAt: new Date(inv.createdAt),
            expiresAt: inv.expiresAt ? new Date(inv.expiresAt) : undefined,
          }))
        );
      }
    } catch {
      // Failed to fetch invites - will show empty list
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  React.useEffect(() => {
    if (isOpen) {
      fetchInvites();
    }
  }, [isOpen, fetchInvites]);

  // Generate new invite
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await secureApiFetch(`/api/spaces/${spaceId}/invite`, {
        method: 'POST',
        body: JSON.stringify({
          expiresInDays: expiryDays,
          maxUses,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to create invite');
      }

      // Add new invite to list
      const newInvite = {
        ...data.invite,
        createdAt: new Date(data.invite.createdAt),
        expiresAt: data.invite.expiresAt ? new Date(data.invite.expiresAt) : undefined,
      };
      setInvites((prev) => [newInvite, ...prev]);

      // Copy to clipboard
      await navigator.clipboard.writeText(data.link);
      toast.success('Invite link created!', 'Link copied to clipboard');

      // Select for QR display
      setSelectedInvite(newInvite);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create invite';
      toast.error('Error', message);
    } finally {
      setGenerating(false);
    }
  };

  // Copy invite link
  const handleCopy = async (invite: InviteLink) => {
    const link = `${process.env.NEXT_PUBLIC_APP_URL || 'https://hive.college'}/spaces/join/${invite.code}`;
    await navigator.clipboard.writeText(link);
    toast.success('Copied!', 'Invite link copied to clipboard');
  };

  // Revoke invite
  const handleRevoke = async (inviteId: string) => {
    setRevokingId(inviteId);
    try {
      const res = await secureApiFetch(
        `/api/spaces/${spaceId}/invite?inviteId=${inviteId}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        throw new Error('Failed to revoke invite');
      }

      setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
      toast.success('Revoked', 'Invite link has been disabled');
    } catch {
      toast.error('Error', 'Failed to revoke invite');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 "
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'fixed z-50',
              'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-full max-w-lg',
              'bg-[var(--bg-surface)] border border-white/[0.06]',
              'rounded-lg',
              'overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/[0.06]">
                  <LinkIcon className="w-5 h-5 text-white/50" />
                </div>
                <div>
                  <Text weight="semibold" className="text-white">
                    Invite Members
                  </Text>
                  <Text size="xs" className="text-white/50">
                    Share a link to invite people to {spaceName}
                  </Text>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-white/50 hover:text-white/50 hover:bg-white/[0.06] transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
              {/* QR Code Display (when invite selected) */}
              {showQR && selectedInvite && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex justify-center mb-4"
                >
                  <QRCodeDisplay
                    value={`${process.env.NEXT_PUBLIC_APP_URL || 'https://hive.college'}/spaces/join/${selectedInvite.code}`}
                  />
                </motion.div>
              )}

              {/* Generate New Invite */}
              <div className="space-y-3">
                <Text weight="medium" size="sm" className="text-white/50">
                  Create New Link
                </Text>

                <div className="flex gap-3">
                  {/* Expiry selector */}
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg',
                      'bg-white/[0.06] border border-white/[0.06]',
                      'text-white text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-white/50'
                    )}
                  >
                    {EXPIRY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        Expires in {opt.label}
                      </option>
                    ))}
                  </select>

                  {/* Max uses selector */}
                  <select
                    value={maxUses ?? ''}
                    onChange={(e) =>
                      setMaxUses(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg',
                      'bg-white/[0.06] border border-white/[0.06]',
                      'text-white text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-white/50'
                    )}
                  >
                    {MAX_USE_OPTIONS.map((opt) => (
                      <option key={opt.label} value={opt.value ?? ''}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  variant="solid"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full"
                >
                  {generating ? (
                    <ArrowPathIcon className="w-4 h-4  mr-2" />
                  ) : (
                    <LinkIcon className="w-4 h-4 mr-2" />
                  )}
                  {generating ? 'Generating...' : 'Generate Invite Link'}
                </Button>
              </div>

              {/* Existing Invites */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Text weight="medium" size="sm" className="text-white/50">
                    Active Links
                  </Text>
                  {invites.length > 0 && (
                    <button
                      onClick={() => setShowQR(!showQR)}
                      className="flex items-center gap-1 text-xs text-white/50 hover:text-white/50 transition-colors"
                    >
                      <QrCodeIcon className="w-3.5 h-3.5" />
                      {showQR ? 'Hide QR' : 'Show QR'}
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                  </div>
                ) : invites.length === 0 ? (
                  <div className="py-8 text-center">
                    <LinkIcon className="w-8 h-8 text-white/50 mx-auto mb-2" />
                    <Text size="sm" className="text-white/50">
                      No active invite links
                    </Text>
                    <Text size="xs" className="text-white/50">
                      Generate one to start inviting members
                    </Text>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {invites.map((invite) => (
                      <InviteLinkRow
                        key={invite.id}
                        invite={invite}
                        onCopy={() => {
                          handleCopy(invite);
                          setSelectedInvite(invite);
                        }}
                        onRevoke={() => handleRevoke(invite.id)}
                        isRevoking={revokingId === invite.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-white/[0.06] bg-white/[0.06]">
              <Text size="xs" className="text-white/50 text-center">
                Invite links allow anyone with the link to join your space
              </Text>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default InviteLinkModal;
