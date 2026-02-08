'use client';

/**
 * SpaceJoinModal — Join Space via Invite Code
 *
 * DRAMA.md: Joining is a threshold moment.
 * Peak: "You're in." with WordReveal after ThresholdReveal anticipation.
 *
 * Extracted from /spaces/join/[code]/page.tsx for modal-based IA.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle } from 'lucide-react';
import {
  Button,
  Text,
  MOTION,
  ThresholdReveal,
  WordReveal,
} from '@hive/ui/design-system/primitives';
import { Avatar, AvatarImage, AvatarFallback } from '@hive/ui';

interface SpacePreview {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  memberCount: number;
  category: string;
  slug?: string;
}

type JoinStatus = 'loading' | 'preview' | 'joining' | 'success' | 'error';

interface SpaceJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Invite code to validate */
  code: string | null;
}

export function SpaceJoinModal({ isOpen, onClose, code }: SpaceJoinModalProps) {
  const router = useRouter();

  const [status, setStatus] = React.useState<JoinStatus>('loading');
  const [space, setSpace] = React.useState<SpacePreview | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Validate invite code when modal opens or code changes
  React.useEffect(() => {
    if (!isOpen || !code) return;

    setStatus('loading');
    setError(null);

    async function validateCode() {
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
  }, [isOpen, code]);

  // Handle join
  const handleJoin = async () => {
    if (!space || !code) return;

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
    } catch {
      setError('Failed to join space');
      setStatus('error');
    }
  };

  const handleEnterSpace = () => {
    if (space) {
      router.push(`/s/${space.slug || space.id}`);
      handleClose();
    }
  };

  const handleClose = () => {
    if (status === 'joining') return;
    setStatus('loading');
    setSpace(null);
    setError(null);
    onClose();
  };

  if (!isOpen || !code) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md bg-[var(--bg-ground)] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
        >
          {/* Close button - always visible except during joining */}
          {status !== 'joining' && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/40 hover:text-white/60 transition-colors z-10"
            >
              <X size={20} />
            </button>
          )}

          <div className="p-6">
            {/* Loading */}
            {status === 'loading' && (
              <div className="text-center py-8">
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

            {/* Preview */}
            {status === 'preview' && space && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Text className="text-white/50">You&apos;ve been invited to</Text>
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
                  onClick={handleClose}
                  className="w-full text-sm text-white/40 hover:text-white/60 transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            )}

            {/* Joining */}
            {status === 'joining' && (
              <div className="py-8">
                <ThresholdReveal
                  isReady={false}
                  preparingMessage="Joining..."
                  pauseDuration={400}
                >
                  <div />
                </ThresholdReveal>
              </div>
            )}

            {/* Success */}
            {status === 'success' && space && (
              <div className="py-8">
                <ThresholdReveal
                  isReady={true}
                  preparingMessage="Joining..."
                  pauseDuration={400}
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
                      <Check className="w-10 h-10 text-black" strokeWidth={3} />
                    </motion.div>

                    {/* Word-by-word reveal: "You're in." */}
                    <h2
                      className="text-2xl font-semibold mb-4"
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
                        onClick={handleEnterSpace}
                        className="px-12"
                      >
                        Enter Space
                      </Button>
                    </motion.div>
                  </div>
                </ThresholdReveal>
              </div>
            )}

            {/* Error */}
            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
                className="text-center space-y-6 py-4"
              >
                <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold mb-2">Unable to join</h1>
                  <Text className="text-white/50">{error}</Text>
                </div>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleClose}
                  className="w-full"
                >
                  Close
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SpaceJoinModal;
