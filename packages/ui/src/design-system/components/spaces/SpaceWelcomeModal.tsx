'use client';

/**
 * SpaceWelcomeModal Component
 *
 * Welcome modal for new space members.
 * Shows space info, features, and leader introduction.
 */

import * as React from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '../../primitives';
import { ModalBody } from '../../primitives';
import { Button } from '../../primitives';
import { Text } from '../../primitives';
import { SimpleAvatar } from '../../primitives';
import { cn } from '../../../lib/utils';

export interface SpaceLeaderInfo {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: string;
}

export interface SpaceFeature {
  icon: string;
  title: string;
  description: string;
}

export interface SpaceWelcomeModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  spaceName?: string;
  spaceDescription?: string;
  spaceBannerUrl?: string;
  spaceIconUrl?: string;
  category?: string;
  memberCount?: number;
  leaders?: SpaceLeaderInfo[];
  features?: SpaceFeature[];
  onStartChatting?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const DEFAULT_FEATURES: SpaceFeature[] = [
  {
    icon: '💬',
    title: 'Real-time Chat',
    description: 'Connect with members instantly',
  },
  {
    icon: '📅',
    title: 'Events',
    description: 'Stay updated on what\'s happening',
  },
  {
    icon: '🔧',
    title: 'Custom Tools',
    description: 'Unique tools built for this community',
  },
];

const SpaceWelcomeModal: React.FC<SpaceWelcomeModalProps> = ({
  open = false,
  onOpenChange,
  spaceName = 'This Space',
  spaceDescription,
  spaceBannerUrl,
  spaceIconUrl,
  category,
  memberCount,
  leaders = [],
  features = DEFAULT_FEATURES,
  onStartChatting,
  onDismiss,
  className,
}) => {
  const handleDismiss = () => {
    onDismiss?.();
    onOpenChange?.(false);
  };

  const handleStartChatting = () => {
    onStartChatting?.();
    onOpenChange?.(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className={cn('max-w-md overflow-hidden', className)}>
        {/* Banner */}
        <div className="relative h-32 bg-[var(--color-bg-muted)]">
          {spaceBannerUrl ? (
            <img
              src={spaceBannerUrl}
              alt={`${spaceName} banner`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-muted)]" />
          )}

          {/* Space Icon Overlay */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
            <div className="w-16 h-16 rounded-xl bg-[var(--color-bg-surface)] border-4 border-[var(--color-bg-surface)] flex items-center justify-center overflow-hidden">
              {spaceIconUrl ? (
                <img
                  src={spaceIconUrl}
                  alt={spaceName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Text size="lg" className="text-[var(--color-text-muted)] text-xl">
                  {spaceName.charAt(0).toUpperCase()}
                </Text>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            className={cn(
              'absolute top-3 right-3 p-2 rounded-lg',
              'bg-black/30 text-white/80 hover:bg-black/50 hover:text-white',
              'transition-colors backdrop-blur-sm',
              'focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <ModalHeader className="sr-only">
          <ModalTitle>Welcome to {spaceName}</ModalTitle>
        </ModalHeader>

        <ModalBody className="pt-12 text-center space-y-6">
          {/* Space Info */}
          <div className="space-y-2">
            <Text size="lg" weight="semibold" className="text-[var(--color-text-primary)] text-xl">
              Welcome to {spaceName}
            </Text>
            {category && (
              <Text
                size="xs"
                className="inline-block px-2 py-0.5 rounded-full bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]"
              >
                {category}
              </Text>
            )}
            {spaceDescription && (
              <Text size="sm" tone="secondary" className="max-w-xs mx-auto">
                {spaceDescription}
              </Text>
            )}
            {memberCount !== undefined && (
              <Text size="xs" tone="muted">
                {memberCount.toLocaleString()} member{memberCount !== 1 ? 's' : ''}
              </Text>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3">
            {features.slice(0, 3).map((feature, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]"
              >
                <span className="text-xl mb-2 block">{feature.icon}</span>
                <Text size="xs" weight="medium" className="line-clamp-1">
                  {feature.title}
                </Text>
                <Text size="xs" tone="muted" className="line-clamp-2 mt-0.5">
                  {feature.description}
                </Text>
              </div>
            ))}
          </div>

          {/* Leaders */}
          {leaders.length > 0 && (
            <div className="bg-[var(--color-bg-muted)] rounded-xl p-4">
              <Text size="xs" tone="muted" className="mb-3">
                Led by
              </Text>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {leaders.slice(0, 3).map((leader) => (
                  <div key={leader.id} className="flex items-center gap-2">
                    <SimpleAvatar
                      src={leader.avatarUrl}
                      fallback={leader.name.charAt(0)}
                      size="sm"
                    />
                    <div className="text-left">
                      <Text size="sm" weight="medium" className="line-clamp-1">
                        {leader.name}
                      </Text>
                      {leader.role && (
                        <Text size="xs" tone="muted">
                          {leader.role}
                        </Text>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter className="flex-col gap-3">
          <Button
            variant="cta"
            onClick={handleStartChatting}
            className="w-full"
          >
            Start Chatting
          </Button>
          <button
            type="button"
            onClick={handleDismiss}
            className={cn(
              'text-sm text-[var(--color-text-muted)]',
              'hover:text-[var(--color-text-secondary)] transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg px-2 py-1'
            )}
          >
            Dismiss
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

SpaceWelcomeModal.displayName = 'SpaceWelcomeModal';

export { SpaceWelcomeModal };
