'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Text, Button } from '@hive/ui';
import type { SpaceData } from './types';
import { TransferOwnership } from './transfer-ownership';

interface SettingsDangerProps {
  space: SpaceData;
  currentUserId?: string;
  currentUserRole: 'owner' | 'admin' | 'moderator' | 'member';
  isLeader: boolean;
  onDelete?: () => Promise<void>;
  onLeave?: () => Promise<void>;
  onTransferOwnership?: (newOwnerId: string) => Promise<void>;
}

export function SettingsDanger({
  space,
  currentUserId,
  currentUserRole,
  isLeader,
  onDelete,
  onLeave,
  onTransferOwnership,
}: SettingsDangerProps) {
  const isOwner = currentUserRole === 'owner';
  const [isLeaving, setIsLeaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [confirmLeave, setConfirmLeave] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const handleLeave = async () => {
    if (!onLeave) return;
    setIsLeaving(true);
    try {
      await onLeave();
    } finally {
      setIsLeaving(false);
      setConfirmLeave(false);
    }
  };

  return (
    <>
      <h2
        className="text-title-lg font-semibold text-red-400 mb-2"
        style={{ fontFamily: 'var(--font-clash)' }}
      >
        Danger Zone
      </h2>
      <Text size="sm" tone="muted" className="mb-8">
        Irreversible actions — proceed with caution
      </Text>

      <div className="space-y-4">
        {/* Leave Space */}
        {onLeave && (
          <div className="p-4 rounded-lg bg-amber-400/[0.06] border border-amber-400/20">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <Text weight="medium" className="text-amber-400 mb-1">Leave Space</Text>
                <Text size="sm" className="text-amber-400/70">
                  You will lose access to this space&apos;s chat, events, and apps. You can rejoin
                  at any time if the space is public.
                </Text>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmLeave(true)}
              disabled={isLeaving || isDeleting || confirmLeave}
              className="text-amber-400 hover:bg-amber-400/10"
            >
              Leave Space
            </Button>

            {confirmLeave && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-400/10 border border-amber-400/20 mt-3">
                <p className="text-sm text-white/50 flex-1">
                  Are you sure you want to leave this space?
                </p>
                <button
                  onClick={handleLeave}
                  disabled={isLeaving}
                  className="text-sm text-amber-400 font-medium hover:text-amber-300 disabled:opacity-50"
                >
                  {isLeaving ? 'Leaving...' : 'Leave'}
                </button>
                <button
                  onClick={() => setConfirmLeave(false)}
                  disabled={isLeaving}
                  className="text-sm text-white/50 hover:text-white/50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Transfer Ownership */}
        {isOwner && onTransferOwnership && (
          <TransferOwnership
            space={space}
            currentUserId={currentUserId}
            onTransferOwnership={onTransferOwnership}
          />
        )}

        {/* Delete Space */}
        {isLeader && onDelete && (
          <div className="p-4 rounded-lg bg-red-500/[0.06] border border-red-500/20">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <Text weight="medium" className="text-red-400 mb-1">Delete Space</Text>
                <Text size="sm" className="text-red-400/70">
                  Once deleted, this space and all its content will be permanently removed. This
                  action cannot be undone.
                </Text>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={isDeleting || isLeaving || confirmDelete}
              className="text-red-400 hover:bg-red-500/10"
            >
              Delete Space
            </Button>

            {confirmDelete && (
              <div className="flex flex-col gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mt-3">
                <p className="text-sm text-red-400/80">
                  This will permanently delete{' '}
                  <span className="font-medium text-red-400">{space.name}</span> and all its
                  content. This cannot be undone.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      setIsDeleting(true);
                      try {
                        await onDelete();
                      } finally {
                        setIsDeleting(false);
                        setConfirmDelete(false);
                      }
                    }}
                    disabled={isDeleting}
                    className="text-sm text-red-400 font-medium hover:text-red-300 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, delete permanently'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={isDeleting}
                    className="text-sm text-white/50 hover:text-white/50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
