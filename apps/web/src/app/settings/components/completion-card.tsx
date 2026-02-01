'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { XMarkIcon, CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Card, Text, Button } from '@hive/ui/design-system/primitives';
import { EASE_PREMIUM } from '@hive/ui';
import {
  useProfileCompletion,
  isCompletionDismissed,
  dismissCompletion,
} from '@/hooks/use-profile-completion';

const EASE = EASE_PREMIUM;

// Field to link mapping
const FIELD_LINKS: Record<string, { label: string; href: string }> = {
  firstName: { label: 'Add your first name', href: '/settings?section=profile' },
  lastName: { label: 'Add your last name', href: '/settings?section=profile' },
  handle: { label: 'Choose a handle', href: '/settings?section=profile' },
  email: { label: 'Verify your email', href: '/settings?section=account' },
  campusId: { label: 'Confirm your school', href: '/settings?section=account' },
  major: { label: 'Select your major', href: '/settings?section=profile' },
  graduationYear: { label: 'Add graduation year', href: '/settings?section=profile' },
  bio: { label: 'Write a bio', href: '/settings?section=profile' },
  avatarUrl: { label: 'Upload a profile photo', href: '/settings?section=profile' },
  interests: { label: 'Add interests', href: '/settings?section=profile' },
};

interface CompletionCardProps {
  onDismiss?: () => void;
}

export function CompletionCard({ onDismiss }: CompletionCardProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Default to dismissed until we check
  const {
    isLoading,
    profileComplete,
    percentage,
    missingRequired,
    missingRecommended,
  } = useProfileCompletion();

  // Check dismissal state on mount
  useEffect(() => {
    setIsDismissed(isCompletionDismissed());
  }, []);

  // Don't render if:
  // - Still loading
  // - Profile is already complete
  // - User dismissed it within cooldown period
  if (isLoading || profileComplete || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    dismissCompletion();
    setIsDismissed(true);
    onDismiss?.();
  };

  // Combine missing fields, required first then recommended
  const missingFields = [
    ...missingRequired.map(field => ({ field, required: true })),
    ...missingRecommended.map(field => ({ field, required: false })),
  ].slice(0, 3); // Show max 3 items

  const remainingCount = (missingRequired.length + missingRecommended.length) - missingFields.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        <Card
          elevation="resting"
          className="relative overflow-hidden mb-8"
        >
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss for 7 days"
            className="absolute top-3 right-3 p-1 text-white/30 hover:text-white/60 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>

          {/* Progress bar */}
          <div className="h-1 w-full bg-white/[0.06] mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
              className="h-full bg-[var(--hive-brand-primary)]"
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <Text size="sm" weight="medium" className="text-white">
                Complete your profile
              </Text>
              <Text size="xs" className="text-white/40 mt-0.5">
                {percentage}% complete
              </Text>
            </div>
            {percentage >= 80 && (
              <div className="flex items-center gap-1.5 text-[var(--hive-brand-primary)]">
                <CheckCircleIcon className="h-4 w-4" />
                <Text size="xs">Almost there!</Text>
              </div>
            )}
          </div>

          {/* Missing fields */}
          <div className="space-y-2">
            {missingFields.map(({ field, required }) => {
              const config = FIELD_LINKS[field];
              if (!config) return null;

              return (
                <Link
                  key={field}
                  href={config.href}
                  className="flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-white/[0.04] transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${required ? 'bg-amber-400' : 'bg-white/20'}`} />
                    <Text size="sm" className="text-white/70 group-hover:text-white transition-colors">
                      {config.label}
                    </Text>
                  </div>
                  <ArrowRightIcon className="h-3.5 w-3.5 text-white/30 group-hover:text-white/60 transition-colors" />
                </Link>
              );
            })}

            {remainingCount > 0 && (
              <Text size="xs" className="text-white/30 pl-3.5">
                +{remainingCount} more {remainingCount === 1 ? 'field' : 'fields'}
              </Text>
            )}
          </div>

          {/* Action */}
          <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <Text size="xs" className="text-white/30">
              Dismiss for 7 days
            </Text>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                // Navigate to first missing field
                const firstField = missingFields[0];
                if (firstField) {
                  const config = FIELD_LINKS[firstField.field];
                  if (config) {
                    window.location.href = config.href;
                  }
                }
              }}
            >
              Complete now
            </Button>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
