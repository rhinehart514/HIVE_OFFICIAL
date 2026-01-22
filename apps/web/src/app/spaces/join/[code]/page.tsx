'use client';

/**
 * /spaces/join/[code] — Join Space via Invite Code
 *
 * Archetype: Focus Flow
 * Purpose: Join a space using an invite code
 * Shell: OFF
 *
 * Per HIVE App Map v1:
 * - Single-task flow for invite redemption
 * - Validates code, shows space preview, confirms join
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button, Avatar, AvatarImage, AvatarFallback } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';
import { ArrowPathIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

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

  // Render based on status
  return (
    <div className="min-h-screen bg-[var(--bg-ground)] text-white flex flex-col">
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
              <ArrowPathIcon className="h-6 w-6 animate-spin text-white/60 mx-auto mb-3" />
              <p className="text-sm text-white/50">Validating invite code...</p>
            </div>
          )}

          {/* Auth required */}
          {status === 'auth-required' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="h-16 w-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto border border-white/[0.06]">
                <div className="w-6 h-px bg-white/40" />
              </div>
              <div>
                <h1 className="text-xl font-semibold mb-2">Sign in to join</h1>
                <p className="text-sm text-white/50">
                  You need to sign in before joining this space
                </p>
              </div>
              <Button
                onClick={() => router.push(`/enter?from=/spaces/join/${code}`)}
                className="w-full bg-white text-black hover:bg-white/90"
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
              className="space-y-6"
            >
              <div className="text-center">
                <p className="text-sm text-white/50 mb-2">You've been invited to join</p>
              </div>

              <div className="bg-[var(--bg-surface)] rounded-2xl p-6 border border-white/[0.06]">
                <div className="flex flex-col items-center text-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={space.avatarUrl} alt={space.name} />
                    <AvatarFallback className="text-2xl bg-white/[0.04]">
                      {space.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h1 className="text-xl font-semibold mb-1">{space.name}</h1>
                    {space.description && (
                      <p className="text-sm text-white/60 line-clamp-2">{space.description}</p>
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
                onClick={handleJoin}
                className="w-full bg-[var(--life-gold)] text-black hover:bg-[var(--life-gold)]/90 font-semibold"
              >
                Join Space
              </Button>

              <button
                onClick={() => router.push('/spaces')}
                className="w-full text-sm text-white/50 hover:text-white/80 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* Joining */}
          {status === 'joining' && (
            <div className="text-center">
              <ArrowPathIcon className="h-6 w-6 animate-spin text-white/60 mx-auto mb-3" />
              <p className="text-sm text-white/50">Joining space...</p>
            </div>
          )}

          {/* Success */}
          {status === 'success' && space && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="h-16 w-16 rounded-2xl bg-[rgba(255,215,0,0.1)] flex items-center justify-center mx-auto">
                <CheckIcon className="h-8 w-8 text-[#FFD700]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[#FFD700] mb-1">Welcome!</h1>
                <p className="text-sm text-white/60">
                  You've joined <strong className="text-white">{space.name}</strong>
                </p>
                <p className="text-xs text-white/40 mt-2">
                  Taking you there now...
                </p>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
                <XMarkIcon className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold mb-2">Unable to join</h1>
                <p className="text-sm text-white/50">{error}</p>
              </div>
              <Button
                onClick={() => router.push('/spaces')}
                variant="secondary"
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
        <p className="text-xs text-white/30">University at Buffalo</p>
      </footer>
    </div>
  );
}
