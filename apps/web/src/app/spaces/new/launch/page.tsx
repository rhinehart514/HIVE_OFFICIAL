'use client';

/**
 * /spaces/new/launch - Celebration + Share
 *
 * THE PAYOFF MOMENT
 *
 * "It's yours."
 *
 * Features:
 * - Creates the space via API
 * - Celebration animation
 * - Shareable link front and center
 * - "Invite your people" optional
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@hive/auth-logic';
import { logger } from '@/lib/logger';
import {
  BuilderShell,
  type PrivacyLevel,
} from '@/components/spaces/builder';
import {
  Button,
  GradientText,
  GlassSurface,
  MOTION,
} from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

export default function LaunchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Get all data from previous steps
  const templateId = searchParams.get('template') || 'blank';
  const name = searchParams.get('name') || '';
  const handle = searchParams.get('handle') || '';
  const description = searchParams.get('description') || '';
  const privacy = (searchParams.get('privacy') as PrivacyLevel) || 'approval';

  const [isCreating, setIsCreating] = useState(true);
  const [isCreated, setIsCreated] = useState(false);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [spaceSlug, setSpaceSlug] = useState<string>(handle); // Default to handle, updated from API
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Use the slug from API response (set after creation)
  const spaceUrl = `hive.so/s/${spaceSlug}`;
  const fullUrl = `https://hive.so/s/${spaceSlug}`;

  // Map template to category (API requires category)
  const getCategory = (template: string): string => {
    const templateCategories: Record<string, string> = {
      org: 'student_organizations',
      club: 'student_organizations',
      study: 'student_organizations',
      project: 'student_organizations',
      residential: 'campus_living',
      greek: 'greek_life',
      blank: 'student_organizations',
    };
    return templateCategories[template] || 'student_organizations';
  };

  // Map privacy to joinPolicy (API terminology)
  const getJoinPolicy = (privacyLevel: string): string => {
    const policyMap: Record<string, string> = {
      open: 'open',
      approval: 'approval',
      invite: 'invite_only',
    };
    return policyMap[privacyLevel] || 'approval';
  };

  // Create the space on mount via real API
  useEffect(() => {
    const createSpace = async () => {
      if (!name || !handle || !user) {
        setError('Missing required information');
        setIsCreating(false);
        return;
      }

      try {
        const response = await fetch('/api/spaces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description: description || `Welcome to ${name}`,
            category: getCategory(templateId),
            joinPolicy: getJoinPolicy(privacy),
            tags: [],
            agreedToGuidelines: true, // User implicitly agrees by creating
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 403) {
            setError(data.error || 'You do not have permission to create spaces yet.');
          } else if (response.status === 409) {
            setError('A space with this name already exists. Please go back and choose a different name.');
          } else if (response.status === 429) {
            setError('You have reached the daily limit for creating spaces. Please try again tomorrow.');
          } else {
            setError(data.error || 'Failed to create space. Please try again.');
          }
          return;
        }

        setSpaceId(data.space.id);
        setSpaceSlug(data.space.slug);
        setIsCreated(true);
        setShowConfetti(true);

        // Hide confetti after animation
        setTimeout(() => setShowConfetti(false), 3000);
      } catch (err) {
        logger.error('Failed to create space', { component: 'LaunchPage' }, err instanceof Error ? err : undefined);
        setError('Failed to create space. Please try again.');
      } finally {
        setIsCreating(false);
      }
    };

    createSpace();
  }, [name, handle, description, privacy, templateId, user]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fullUrl]);

  const handleEnterSpace = () => {
    router.push(`/s/${spaceSlug}`);
  };

  // Loading state
  if (isCreating) {
    return (
      <BuilderShell currentStep={3} stepTitle="Creating">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 text-center"
          >
            {/* Spinner */}
            <div className="relative w-16 h-16 mx-auto">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-white/10"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--life-gold)]"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            <div className="space-y-2">
              <p className="text-body-lg text-white">Creating your space...</p>
              <p className="text-body-sm text-white/40">@{handle}</p>
            </div>
          </motion.div>
        </div>
      </BuilderShell>
    );
  }

  // Error state
  if (error) {
    return (
      <BuilderShell currentStep={3} stepTitle="Error">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-center"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-[var(--status-error)]/10 flex items-center justify-center">
              <span className="text-[var(--status-error)] text-xl">✗</span>
            </div>

            <div className="space-y-2">
              <p className="text-body-lg text-white">Something went wrong</p>
              <p className="text-body-sm text-white/40">{error}</p>
            </div>

            <Button
              variant="default"
              onClick={() => router.back()}
            >
              Go Back
            </Button>
          </motion.div>
        </div>
      </BuilderShell>
    );
  }

  // Success state - THE CELEBRATION
  return (
    <BuilderShell currentStep={3} stepTitle="Live">
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && <Confetti />}
      </AnimatePresence>

      <div className="space-y-8">
        {/* Celebration Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.slow, ease: MOTION.ease.premium }}
          className="text-center space-y-4"
        >
          {/* Checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
            className="w-16 h-16 mx-auto rounded-full bg-[var(--life-gold)]/10 flex items-center justify-center"
          >
            <span className="text-[var(--life-gold)] text-2xl">✓</span>
          </motion.div>

          {/* "It's yours." */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <GradientText
              variant="gold"
              className="text-heading font-semibold"
            >
              It&apos;s yours.
            </GradientText>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-body text-white/60"
          >
            {name} is live at
          </motion.p>
        </motion.div>

        {/* Space URL Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, ease: MOTION.ease.premium }}
        >
          <GlassSurface
            intensity="subtle"
            className="p-6 rounded-xl border border-[var(--life-gold)]/20"
          >
            <div className="flex items-center justify-between gap-4">
              {/* URL */}
              <div className="flex-1 min-w-0">
                <p className="text-title font-medium text-white truncate">
                  {spaceUrl}
                </p>
              </div>

              {/* Copy Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className={cn(
                  'transition-all duration-200',
                  copied && 'text-[var(--life-gold)]'
                )}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </GlassSurface>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-3 gap-3 text-center"
        >
          <div className="p-3 rounded-lg bg-white/[0.02]">
            <p className="text-label-sm text-white/30 uppercase tracking-wider">Privacy</p>
            <p className="text-body text-white mt-1 capitalize">{privacy}</p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02]">
            <p className="text-label-sm text-white/30 uppercase tracking-wider">Template</p>
            <p className="text-body text-white mt-1 capitalize">{templateId}</p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02]">
            <p className="text-label-sm text-white/30 uppercase tracking-wider">Members</p>
            <p className="text-body text-white mt-1">1</p>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, ease: MOTION.ease.premium }}
          className="space-y-3"
        >
          {/* Primary CTA */}
          <Button
            variant="cta"
            size="lg"
            className="w-full"
            onClick={handleEnterSpace}
          >
            Enter Your Space
          </Button>

          {/* Secondary: Invite */}
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={() => {
              // TODO: Open invite modal
              handleCopyLink();
            }}
          >
            Invite Your People
          </Button>
        </motion.div>

        {/* Tip */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-label text-white/30 text-center"
        >
          Share your link on social, text it to your e-board, or paste it in your bio
        </motion.p>
      </div>
    </BuilderShell>
  );
}

// ============================================
// CONFETTI ANIMATION
// ============================================

function Confetti() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    size: 4 + Math.random() * 8,
    color: Math.random() > 0.5 ? 'var(--life-gold)' : 'white',
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: `${particle.x}vw`,
            y: -20,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: '110vh',
            rotate: 360 + Math.random() * 360,
            opacity: [1, 1, 0],
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}
