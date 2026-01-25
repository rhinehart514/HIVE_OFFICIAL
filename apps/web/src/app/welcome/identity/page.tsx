'use client';

/**
 * /welcome/identity - Quick profile setup
 *
 * Avatar + Display Name
 *
 * Emotional arc: OWNERSHIP → AUTONOMY
 * - User controls their identity
 * - Quick, non-blocking setup
 * - Can skip with defaults
 *
 * Connected to real API:
 * - Profile: PUT /api/profile
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@hive/auth-logic';
import {
  WelcomeShell,
  WelcomeHeading,
  WelcomeAction,
} from '@/components/onboarding';
import {
  Input,
  SimpleAvatar,
  MOTION,
} from '@hive/ui/design-system/primitives';

// ============================================
// API FETCHERS
// ============================================

async function updateProfile(data: {
  fullName?: string;
  profileImageUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result = await response.json();
    return { success: false, error: result.error || 'Failed to update profile' };
  }

  return { success: true };
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function IdentityPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Initialize with existing user data
  const [displayName, setDisplayName] = useState(
    user?.displayName || user?.email?.split('@')[0] || ''
  );
  const [avatarUrl, setAvatarUrl] = useState(user?.photoURL || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = useCallback(async () => {
    setIsUpdating(true);
    setError(null);

    try {
      const result = await updateProfile({
        fullName: displayName.trim(),
        ...(avatarUrl && { profileImageUrl: avatarUrl }),
      });

      if (result.success) {
        router.push('/welcome/territory');
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  }, [router, displayName, avatarUrl]);

  const isValid = displayName.trim().length >= 2;

  return (
    <WelcomeShell currentStep={1}>
      <div className="space-y-8">
        {/* Heading */}
        <WelcomeHeading
          title="How you appear"
          subtitle="This is how others will see you on campus"
        />

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <p className="text-body-sm text-red-400 text-center">{error}</p>
          </motion.div>
        )}

        {/* Avatar Section */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: MOTION.duration.base, delay: 0.1, ease: MOTION.ease.premium }}
        >
          <button
            type="button"
            className="relative group"
            onClick={() => {
              // TODO: Open avatar picker/camera
            }}
          >
            <SimpleAvatar
              src={avatarUrl}
              fallback={displayName?.charAt(0) || '?'}
              size="xl"
              className="w-24 h-24"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-label text-white font-medium">Change</span>
            </div>
          </button>
        </motion.div>

        {/* Form */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, delay: 0.2, ease: MOTION.ease.premium }}
        >
          <div className="space-y-2">
            <label className="text-label text-white/40 uppercase tracking-wider">
              Display Name
            </label>
            <Input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full"
              maxLength={50}
            />
            <p className="text-label-sm text-white/30">
              This is how you&apos;ll appear to others
            </p>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, delay: 0.3, ease: MOTION.ease.premium }}
        >
          <WelcomeAction
            onClick={handleContinue}
            disabled={!isValid}
            loading={isUpdating}
          >
            Continue
          </WelcomeAction>

          <WelcomeAction
            variant="secondary"
            onClick={() => router.push('/welcome/territory')}
          >
            Skip for now
          </WelcomeAction>
        </motion.div>
      </div>
    </WelcomeShell>
  );
}
