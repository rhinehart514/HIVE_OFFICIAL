'use client';

/**
 * /spaces/join/[code] — Join Space via Invite Code
 *
 * DRAMA.md: Joining is a threshold moment.
 * Peak: "You're in." with WordReveal after ThresholdReveal anticipation.
 *
 * @version 9.0.0 - DRAMA.md patterns (Jan 2026)
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Button,
  Text,
  MOTION,
  ThresholdReveal,
  WordReveal,
} from '@hive/ui/design-system/primitives';
import { Avatar, AvatarImage, AvatarFallback } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SpacePreview {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  memberCount: number;
  category: string;
  isValid: boolean;
}

type JoinStatus = 'loading' | 'preview' | 'joining' | 'success' | 'error' | 'auth-required';

export default function JoinSpacePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const code = params?.code as string;

  const [status, setStatus] = React.useState<JoinStatus>('loading');
  const [space, setSpace] = React.useState<SpacePreview | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Validate invite code and fetch space preview
  React.useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setStatus('auth-required');
      return;
    }

    async function validateCode() {
      if (!code) {
        setError('Invalid invite code');
        setStatus('error');
        return;
      }

      try {
        const res = await fetch(`/api/spaces/invite/${code}/validate`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || 'Invalid or expired invite code');
          setStatus('error');
          return;
        }

        setSpace(data.space);
        setStatus('preview');
      } catch {
        setError('Failed to validate invite code');
        setStatus('error');
      }
    }

    validateCode();
  }, [code, authLoading, isAuthenticated]);

  // Handle join
  const handleJoin = async () => {
    if (!space) return;

    setStatus('joining');

    try {
      const res = await fetch(`/api/spaces/invite/${code}/redeem`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to join space');
        setStatus('error');
        return;
      }

      setStatus('success');

      // Redirect to space after delay
      setTimeout(() => {
        router.push(`/spaces/${space.id}`);
      }, 2000);
    } catch {
      setError('Failed to join space');
      setStatus('error');
    }
  };

  // State for success ready (after API completes)
  const [successReady, setSuccessReady] = React.useState(false);

  // Render based on status
  return (
    <div className="min-h-screen bg-[#0A0A09] text-white flex flex-col">
      {/* Header */}
      <header className="p-4">
        <div className="flex items-center gap-2">
          <Image src="/assets/hive-logo-gold.svg" alt="HIVE" width={28} height={28} />
          <span className="text-lg font-bold">HIVE</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Loading */}
          {status === 'loading' && (
            <div className="text-center">
              <motion.div
                className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center mx-auto mb-4"
                animate={{
                  scale: [1, 1.05, 1],
                  borderColor: ['rgba(255,255,255,0.2)', 'rgba(255,215,0,0.3)', 'rgba(255,255,255,0.2)'],
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-white/40"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>
              <Text className="text-white/50">Validating invite...</Text>
            </div>
          )}

          {/* Auth required */}
          {status === 'auth-required' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
              className="text-center space-y-6"
            >
              <div className="h-16 w-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto border border-white/[0.06]">
                <div className="w-6 h-px bg-white/40" />
              </div>
              <div>
                <h1 className="text-xl font-semibold mb-2">Sign in to join</h1>
                <Text className="text-white/50">
                  You need to sign in before joining this space
                </Text>
              </div>
              <Button
                variant="default"
                size="lg"
                onClick={() => router.push(`/enter?from=/spaces/join/${code}`)}
                className="w-full"
              >
                Sign In
              </Button>
            </motion.div>
          )}

          {/* Preview */}
          {status === 'preview' && space && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
              className="space-y-6"
            >
              <div className="text-center">
                <Text className="text-white/50">You've been invited to</Text>
              </div>

              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06]">
                <div className="flex flex-col items-center text-center gap-4">
                  <Avatar className="h-20 w-20 rounded-xl">
                    <AvatarImage src={space.avatarUrl} alt={space.name} />
                    <AvatarFallback className="text-2xl bg-white/[0.04] rounded-xl">
                      {space.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h1 className="text-xl font-semibold mb-1">{space.name}</h1>
                    {space.description && (
                      <Text size="sm" className="text-white/60 line-clamp-2">
                        {space.description}
                      </Text>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-white/50">
                    <span>{space.memberCount} members</span>
                    <span>·</span>
                    <span className="capitalize">{space.category.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              <Button
                variant="cta"
                size="lg"
                onClick={handleJoin}
                className="w-full"
              >
                Enter
              </Button>

              <button
                onClick={() => router.push('/spaces')}
                className="w-full text-sm text-white/40 hover:text-white/60 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* Joining - ThresholdReveal anticipation */}
          {status === 'joining' && (
            <ThresholdReveal
              isReady={false}
              preparingMessage="Joining..."
              pauseDuration={400}
            >
              <div />
            </ThresholdReveal>
          )}

          {/* Success - DRAMA.md: "You're in." with gold reveal */}
          {status === 'success' && space && (
            <ThresholdReveal
              isReady={true}
              preparingMessage="Joining..."
              pauseDuration={400}
              onReveal={() => setSuccessReady(true)}
            >
              <div className="text-center">
                {/* Gold checkmark */}
                <motion.div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700, #B8860B)',
                    boxShadow: '0 0 40px rgba(255,215,0,0.3)',
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <CheckIcon className="w-10 h-10 text-black" strokeWidth={3} />
                </motion.div>

                {/* Word-by-word reveal: "You're in." */}
                <h2
                  className="text-heading font-semibold mb-4"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <WordReveal
                    text="You're in."
                    variant="gold"
                    delay={0.2}
                  />
                </h2>

                {/* Space name */}
                <motion.p
                  className="text-white/60 text-lg mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Welcome to <strong className="text-white">{space.name}</strong>
                </motion.p>

                {/* Enter button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Button
                    variant="cta"
                    size="lg"
                    onClick={() => router.push(`/s/${space.id}`)}
                    className="px-12"
                  >
                    Enter Space
                  </Button>
                </motion.div>
              </div>
            </ThresholdReveal>
          )}

          {/* Error */}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
              className="text-center space-y-6"
            >
              <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
                <XMarkIcon className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold mb-2">Unable to join</h1>
                <Text className="text-white/50">{error}</Text>
              </div>
              <Button
                variant="default"
                size="lg"
                onClick={() => router.push('/spaces')}
                className="w-full"
              >
                Browse Spaces
              </Button>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <Text size="xs" className="text-white/30">University at Buffalo</Text>
      </footer>
    </div>
  );
}
