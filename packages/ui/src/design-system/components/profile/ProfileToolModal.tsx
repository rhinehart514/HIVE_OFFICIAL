'use client';

/**
 * ProfileToolModal Component
 *
 * Modal for viewing and managing tools in a user's profile.
 * Supports visibility toggle and removal for owners.
 */

import * as React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
} from '../../primitives/Modal';
import { Button } from '../../primitives/Button';
import { Text } from '../../primitives';
import { cn } from '../../../lib/utils';

export interface ProfileToolModalData {
  id?: string;
  name?: string;
  description?: string;
  toolId?: string;
  deploymentId?: string;
  icon?: string;
  usageCount?: number;
  deployedSpaces?: string[];
  deployedToSpaces?: string[];
}

export interface ProfileToolModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  tool?: ProfileToolModalData | null;
  data?: ProfileToolModalData | null;
  onUpdateVisibility?:
    | ((toolId: string, isPublic: boolean) => void | Promise<void>)
    | ((tool: ProfileToolModalData, visibility: string) => void | Promise<void>);
  onRemove?:
    | ((toolId: string) => void | Promise<void>)
    | ((tool: ProfileToolModalData) => void | Promise<void>);
  isOwner?: boolean;
}

const ProfileToolModal: React.FC<ProfileToolModalProps> = ({
  open,
  isOpen,
  onClose,
  onOpenChange,
  tool,
  data,
  onUpdateVisibility,
  onRemove,
  isOwner = false,
}) => {
  const [isPublic, setIsPublic] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = React.useState(false);

  // Support both open and isOpen props
  const isModalOpen = open ?? isOpen ?? false;
  // Support both tool and data props
  const toolData = tool ?? data;

  const handleOpenChange = React.useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        onClose?.();
        setShowRemoveConfirm(false);
      }
      onOpenChange?.(isOpen);
    },
    [onClose, onOpenChange]
  );

  const handleVisibilityToggle = async () => {
    if (!toolData || isUpdating) return;

    setIsUpdating(true);
    try {
      const newVisibility = !isPublic;
      // Support both callback signatures
      if (onUpdateVisibility) {
        const toolId = toolData.toolId || toolData.id;
        if (toolId) {
          // Try the (toolId, isPublic) signature first
          await (onUpdateVisibility as (id: string, pub: boolean) => void)(toolId, newVisibility);
        }
      }
      setIsPublic(newVisibility);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (!toolData || isUpdating) return;

    setIsUpdating(true);
    try {
      if (onRemove) {
        const toolId = toolData.toolId || toolData.id;
        if (toolId) {
          // Try the (toolId) signature first
          await (onRemove as (id: string) => void)(toolId);
        }
      }
      handleOpenChange(false);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!toolData) return null;

  const deployedSpaces = toolData.deployedSpaces ?? toolData.deployedToSpaces ?? [];
  const usageCount = toolData.usageCount ?? 0;

  return (
    <Modal open={isModalOpen} onOpenChange={handleOpenChange}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              {toolData.icon || '🔧'}
            </div>
            <div>
              <ModalTitle>{toolData.name || 'Creation'}</ModalTitle>
              {toolData.description && (
                <ModalDescription className="mt-1">
                  {toolData.description}
                </ModalDescription>
              )}
            </div>
          </div>
        </ModalHeader>

        <div className="space-y-4 py-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <Text size="xs" tone="muted">
                Usage Count
              </Text>
              <Text size="lg" weight="semibold">
                {usageCount.toLocaleString()}
              </Text>
            </div>
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <Text size="xs" tone="muted">
                Deployed To
              </Text>
              <Text size="lg" weight="semibold">
                {deployedSpaces.length} {deployedSpaces.length === 1 ? 'space' : 'spaces'}
              </Text>
            </div>
          </div>

          {/* Deployed Spaces List */}
          {deployedSpaces.length > 0 && (
            <div className="space-y-2">
              <Text size="sm" weight="medium">
                Active In
              </Text>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {deployedSpaces.map((space, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 rounded-lg flex items-center gap-2"
                    style={{ backgroundColor: 'var(--bg-elevated)' }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'var(--status-success)' }}
                    />
                    <Text size="sm">{space}</Text>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Owner Controls */}
          {isOwner && (
            <div
              className="space-y-3 pt-3"
              style={{ borderTop: '1px solid var(--border-default)' }}
            >
              {/* Visibility Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Text size="sm" weight="medium">
                    Public Visibility
                  </Text>
                  <Text size="xs" tone="muted">
                    Allow others to discover this tool
                  </Text>
                </div>
                <button
                  type="button"
                  onClick={handleVisibilityToggle}
                  disabled={isUpdating}
                  className={cn(
                    'w-12 h-6 rounded-full transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-white/50',
                    'disabled:opacity-50'
                  )}
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: isPublic ? '2px solid var(--life-gold)' : '2px solid var(--border-default)',
                    boxShadow: isPublic ? '0 0 8px var(--life-glow)' : undefined,
                  }}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full shadow transition-transform',
                      isPublic ? 'translate-x-6' : 'translate-x-0.5'
                    )}
                    style={{
                      backgroundColor: isPublic ? 'var(--life-gold)' : 'var(--text-secondary)',
                    }}
                  />
                </button>
              </div>

              {/* Remove Button */}
              {!showRemoveConfirm ? (
                <Button
                  variant="ghost"
                  onClick={() => setShowRemoveConfirm(true)}
                  className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  Remove Tool
                </Button>
              ) : (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Text size="sm" className="text-red-400 mb-3">
                    Are you sure? This will remove the tool from all spaces.
                  </Text>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setShowRemoveConfirm(false)}
                      className="flex-1"
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleRemove}
                      disabled={isUpdating}
                      loading={isUpdating}
                      className="flex-1 text-red-400 hover:bg-red-500/20"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

ProfileToolModal.displayName = 'ProfileToolModal';

export { ProfileToolModal };
