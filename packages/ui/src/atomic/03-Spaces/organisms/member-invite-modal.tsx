'use client';

/**
 * Member Invite Modal
 * Modal for inviting new members to a space with role selection
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User, Shield, Crown, Loader2, Check } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { Button } from '../../00-Global/atoms/button';
import { Input } from '../../00-Global/atoms/input';

// ============================================================
// Types
// ============================================================

export type MemberRole = 'member' | 'moderator' | 'admin';

export interface MemberInviteInput {
  userId: string;
  role: MemberRole;
}

export interface InviteableUser {
  id: string;
  name: string;
  handle: string;
  email?: string;
  avatarUrl?: string;
}

export interface MemberInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: MemberInviteInput) => Promise<void>;
  onSearchUsers: (query: string) => Promise<InviteableUser[]>;
  existingMemberIds?: string[];
  className?: string;
}

// ============================================================
// Role Options
// ============================================================

const ROLE_OPTIONS: Array<{
  role: MemberRole;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    role: 'member',
    label: 'Member',
    description: 'Can post and participate',
    icon: User,
  },
  {
    role: 'moderator',
    label: 'Moderator',
    description: 'Can manage posts and members',
    icon: Shield,
  },
  {
    role: 'admin',
    label: 'Admin',
    description: 'Full space management access',
    icon: Crown,
  },
];

// ============================================================
// Main Component
// ============================================================

export function MemberInviteModal({
  open,
  onOpenChange,
  onSubmit,
  onSearchUsers,
  existingMemberIds = [],
  className,
}: MemberInviteModalProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<InviteableUser[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<InviteableUser | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<MemberRole>('member');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setSelectedRole('member');
      setError(null);
    }
  }, [open]);

  // Close on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  // Debounced search
  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await onSearchUsers(searchQuery.trim());
        // Filter out existing members
        const filtered = results.filter(
          (user) => !existingMemberIds.includes(user.id)
        );
        setSearchResults(filtered);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, onSearchUsers, existingMemberIds]);

  const handleSelectUser = (user: InviteableUser) => {
    setSelectedUser(user);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleClearUser = () => {
    setSelectedUser(null);
  };

  const handleSubmit = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({ userId: selectedUser.id, role: selectedRole });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = selectedUser !== null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'relative w-full max-w-md mx-4 bg-[var(--hive-background-secondary)] border border-[var(--hive-border-default)] rounded-2xl shadow-2xl',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--hive-border-default)]">
              <h2 className="text-base font-semibold text-[var(--hive-text-primary)]">Invite Member</h2>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1.5 rounded-lg text-[var(--hive-text-tertiary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-tertiary)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Search / Selected User */}
              {selectedUser ? (
                <div className="flex items-center gap-3 p-3 bg-[var(--hive-background-tertiary)] rounded-xl">
                  {selectedUser.avatarUrl ? (
                    <img
                      src={selectedUser.avatarUrl}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-[var(--hive-brand-primary)]/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-[var(--hive-brand-primary)]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--hive-text-primary)] truncate">
                      {selectedUser.name}
                    </p>
                    <p className="text-xs text-[var(--hive-text-tertiary)] truncate">
                      @{selectedUser.handle}
                    </p>
                  </div>
                  <button
                    onClick={handleClearUser}
                    className="p-1.5 rounded-lg text-[var(--hive-text-tertiary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-secondary)] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <label className="block text-sm font-medium text-[var(--hive-text-primary)] mb-1.5">
                    Search User
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--hive-text-tertiary)]" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or handle..."
                      className="pl-9 bg-[var(--hive-background-tertiary)] border-[var(--hive-border-default)]"
                      autoFocus
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[var(--hive-text-tertiary)]" />
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-[var(--hive-background-secondary)] border border-[var(--hive-border-default)] rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleSelectUser(user)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-[var(--hive-background-tertiary)] transition-colors text-left"
                        >
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-[var(--hive-brand-primary)]/20 flex items-center justify-center">
                              <User className="h-4 w-4 text-[var(--hive-brand-primary)]" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--hive-text-primary)] truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-[var(--hive-text-tertiary)] truncate">
                              @{user.handle}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
                    <p className="mt-2 text-sm text-[var(--hive-text-tertiary)]">
                      No users found matching &quot;{searchQuery}&quot;
                    </p>
                  )}
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--hive-text-primary)] mb-2">
                  Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLE_OPTIONS.map((roleOption) => {
                    const Icon = roleOption.icon;
                    const isSelected = selectedRole === roleOption.role;
                    return (
                      <button
                        key={roleOption.role}
                        onClick={() => setSelectedRole(roleOption.role)}
                        className={cn(
                          'flex flex-col items-center p-3 rounded-xl border transition-all text-center',
                          isSelected
                            ? 'border-[var(--hive-brand-primary)] bg-[var(--hive-brand-primary)]/10'
                            : 'border-[var(--hive-border-default)] hover:border-[var(--hive-border-hover)] bg-[var(--hive-background-tertiary)]'
                        )}
                      >
                        <div className="relative mb-2">
                          <Icon
                            className={cn(
                              'h-5 w-5',
                              isSelected
                                ? 'text-[var(--hive-brand-primary)]'
                                : 'text-[var(--hive-text-tertiary)]'
                            )}
                          />
                          {isSelected && (
                            <Check className="absolute -top-1 -right-1 h-3 w-3 text-[var(--hive-brand-primary)]" />
                          )}
                        </div>
                        <span
                          className={cn(
                            'text-sm font-medium',
                            isSelected
                              ? 'text-[var(--hive-text-primary)]'
                              : 'text-[var(--hive-text-secondary)]'
                          )}
                        >
                          {roleOption.label}
                        </span>
                        <span className="text-xs text-[var(--hive-text-tertiary)] mt-0.5">
                          {roleOption.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-[var(--hive-status-error)] bg-[var(--hive-status-error)]/10 rounded-lg p-2">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--hive-border-default)]">
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className="bg-white text-black hover:bg-neutral-100"
              >
                {isSubmitting ? 'Inviting...' : 'Invite Member'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

MemberInviteModal.displayName = 'MemberInviteModal';
