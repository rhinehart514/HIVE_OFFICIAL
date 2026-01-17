'use client';

/**
 * AddTabModal Component
 *
 * Modal for adding a new tab/channel to a space.
 * Uses the design-system Modal primitive.
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
import { cn } from '../../../lib/utils';

export interface AddTabInput {
  name: string;
  icon?: string;
  type: 'custom' | 'resource' | 'feed' | 'widget';
  order?: number;
  isVisible?: boolean;
}

export interface AddTabModalProps {
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (data: AddTabInput) => void | Promise<void>;
  existingTabNames?: string[];
}

const TAB_TYPES = [
  { value: 'custom', label: 'Custom', description: 'General purpose channel' },
  { value: 'resource', label: 'Resource', description: 'Share files and links' },
  { value: 'feed', label: 'Feed', description: 'Activity feed view' },
  { value: 'widget', label: 'Widget', description: 'Interactive tool space' },
] as const;

const TAB_ICONS = ['#', '📚', '🎯', '💬', '📅', '🔧', '📊', '🎨'];

const AddTabModal: React.FC<AddTabModalProps> = ({
  open = false,
  onClose,
  onOpenChange,
  onSubmit,
  existingTabNames = [],
}) => {
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<AddTabInput['type']>('custom');
  const [icon, setIcon] = React.useState('#');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleOpenChange = React.useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        onClose?.();
        setName('');
        setType('custom');
        setIcon('#');
        setError(null);
      }
      onOpenChange?.(isOpen);
    },
    [onClose, onOpenChange]
  );

  const validateName = React.useCallback(
    (value: string) => {
      if (!value.trim()) {
        return 'Name is required';
      }
      if (value.length < 2) {
        return 'Name must be at least 2 characters';
      }
      if (value.length > 30) {
        return 'Name must be less than 30 characters';
      }
      const normalizedName = value.toLowerCase().trim();
      if (existingTabNames.some((n) => n.toLowerCase() === normalizedName)) {
        return 'A channel with this name already exists';
      }
      return null;
    },
    [existingTabNames]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit?.({
        name: name.trim(),
        type,
        icon,
        isVisible: true,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create channel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>Add Channel</ModalTitle>
            <ModalDescription>
              Create a new channel for your space
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-4">
            {/* Name Input */}
            <div className="space-y-2">
              <Text size="sm" weight="medium">
                Channel Name
              </Text>
              <div className="flex items-center gap-2">
                {/* Icon Selector */}
                <div className="relative">
                  <button
                    type="button"
                    className={cn(
                      'h-10 w-10 rounded-lg border border-[var(--color-border)]',
                      'bg-[var(--color-bg-elevated)] flex items-center justify-center',
                      'hover:bg-[var(--color-bg-muted)] transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-white/50'
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      const currentIndex = TAB_ICONS.indexOf(icon);
                      const nextIndex = (currentIndex + 1) % TAB_ICONS.length;
                      setIcon(TAB_ICONS[nextIndex]);
                    }}
                  >
                    <span className="text-lg">{icon}</span>
                  </button>
                </div>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g., resources, announcements"
                  className="flex-1"
                  autoFocus
                />
              </div>
              {error && (
                <Text size="xs" className="text-red-400">
                  {error}
                </Text>
              )}
            </div>

            {/* Type Selection */}
            <div className="space-y-2">
              <Text size="sm" weight="medium">
                Channel Type
              </Text>
              <div className="grid grid-cols-2 gap-2">
                {TAB_TYPES.map((tabType) => (
                  <button
                    key={tabType.value}
                    type="button"
                    onClick={() => setType(tabType.value)}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all',
                      'focus:outline-none focus:ring-2 focus:ring-white/50',
                      type === tabType.value
                        ? 'border-[var(--color-life-gold)] bg-[var(--color-life-gold)]/10'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-muted)]'
                    )}
                  >
                    <Text
                      size="sm"
                      weight="medium"
                      className={cn(
                        type === tabType.value && 'text-[var(--color-life-gold)]'
                      )}
                    >
                      {tabType.label}
                    </Text>
                    <Text size="xs" tone="muted" className="mt-0.5">
                      {tabType.description}
                    </Text>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="cta"
              disabled={!name.trim() || isSubmitting}
              loading={isSubmitting}
            >
              Create Channel
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

AddTabModal.displayName = 'AddTabModal';

export { AddTabModal };
