'use client';

/**
 * MemberInviteModal Component
 *
 * Modal for inviting new members to a space.
 * Includes user search with debouncing.
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
import { Input } from '../../primitives/Input';
import { Text } from '../../primitives';
import { Avatar, AvatarImage, AvatarFallback } from '../../primitives/Avatar';
import { cn } from '../../../lib/utils';

export interface InviteableUser {
  id: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
}

export interface MemberInviteInput {
  email?: string;
  userId?: string;
  role?: string;
}

export interface MemberInviteModalProps {
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (data: MemberInviteInput) => void | Promise<void>;
  inviteableUsers?: InviteableUser[];
  onSearchUsers?: (query: string) => Promise<InviteableUser[]>;
  existingMemberIds?: string[];
}

const ROLES = [
  { value: 'member', label: 'Member', description: 'Can chat and participate' },
  { value: 'moderator', label: 'Moderator', description: 'Can manage content' },
  { value: 'admin', label: 'Admin', description: 'Full space permissions' },
] as const;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

const MemberInviteModal: React.FC<MemberInviteModalProps> = ({
  open = false,
  onClose,
  onOpenChange,
  onSubmit,
  inviteableUsers = [],
  onSearchUsers,
  existingMemberIds = [],
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<InviteableUser[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<InviteableUser | null>(null);
  const [role, setRole] = React.useState<string>('member');
  const [isSearching, setIsSearching] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Debounced search
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (onSearchUsers) {
          const results = await onSearchUsers(searchQuery);
          setSearchResults(
            results.filter((u) => !existingMemberIds.includes(u.id))
          );
        } else {
          // Filter from provided users
          const filtered = inviteableUsers.filter(
            (u) =>
              !existingMemberIds.includes(u.id) &&
              (u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
          );
          setSearchResults(filtered);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearchUsers, inviteableUsers, existingMemberIds]);

  const handleOpenChange = React.useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        onClose?.();
        setSearchQuery('');
        setSearchResults([]);
        setSelectedUser(null);
        setRole('member');
      }
      onOpenChange?.(isOpen);
    },
    [onClose, onOpenChange]
  );

  const handleSubmit = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await onSubmit?.({
        userId: selectedUser.id,
        role,
      });
      handleOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>Invite Member</ModalTitle>
          <ModalDescription>
            Search for users to invite to your space
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-4 py-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Text size="sm" weight="medium">
              Search Users
            </Text>
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedUser(null);
              }}
              placeholder="Search by name or email..."
              autoFocus
            />
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="space-y-2">
              {isSearching ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-[var(--color-life-gold)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      className={cn(
                        'w-full flex items-center gap-3 p-2 rounded-lg transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-white/50',
                        selectedUser?.id === user.id
                          ? 'bg-[var(--color-life-gold)]/10 border border-[var(--color-life-gold)]'
                          : 'hover:bg-[var(--color-bg-elevated)]'
                      )}
                    >
                      <Avatar size="sm">
                        <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
                        <AvatarFallback>
                          {getInitials(user.displayName || user.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <Text size="sm" weight="medium">
                          {user.displayName || 'Unknown User'}
                        </Text>
                        {user.email && (
                          <Text size="xs" tone="muted">
                            {user.email}
                          </Text>
                        )}
                      </div>
                      {selectedUser?.id === user.id && (
                        <svg
                          className="w-5 h-5 text-[var(--color-life-gold)]"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <Text size="sm" tone="muted" className="text-center py-4">
                  No users found
                </Text>
              )}
            </div>
          )}

          {/* Role Selection */}
          {selectedUser && (
            <div className="space-y-2">
              <Text size="sm" weight="medium">
                Role
              </Text>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={cn(
                      'p-2 rounded-lg border text-center transition-all',
                      'focus:outline-none focus:ring-2 focus:ring-white/50',
                      role === r.value
                        ? 'border-[var(--color-life-gold)] bg-[var(--color-life-gold)]/10'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-muted)]'
                    )}
                  >
                    <Text
                      size="sm"
                      weight="medium"
                      className={cn(
                        role === r.value && 'text-[var(--color-life-gold)]'
                      )}
                    >
                      {r.label}
                    </Text>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="cta"
            onClick={handleSubmit}
            disabled={!selectedUser || isSubmitting}
            loading={isSubmitting}
          >
            Send Invite
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

MemberInviteModal.displayName = 'MemberInviteModal';

export { MemberInviteModal };
