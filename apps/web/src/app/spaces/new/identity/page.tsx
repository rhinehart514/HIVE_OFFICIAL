'use client';

/**
 * /spaces/new/identity - Name + Handle (THE ownership moment)
 *
 * This is THE step where ownership transfers.
 * Handle selection = claiming your territory.
 *
 * Features:
 * - Real-time handle availability check
 * - "It's yours." in gold when available
 * - Handle gets gold underline when claimed
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@hive/auth-logic';
import {
  BuilderShell,
  BuilderHeading,
  BuilderAction,
} from '@/components/spaces/builder';
import {
  Input,
  Textarea,
  GradientText,
  MOTION,
} from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

type HandleStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function IdentityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const templateId = searchParams.get('template') || 'blank';

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');
  const [handleStatus, setHandleStatus] = useState<HandleStatus>('idle');
  const [isCreating, setIsCreating] = useState(false);

  // Debounce handle for availability check
  const debouncedHandle = useDebounce(handle, 300);

  // Auto-generate handle from name
  const handleNameChange = (newName: string) => {
    setName(newName);

    // Auto-generate handle if user hasn't manually edited it
    if (!handle || handle === slugify(name)) {
      const slug = slugify(newName);
      setHandle(slug);
    }
  };

  // Check handle availability
  useEffect(() => {
    if (!debouncedHandle || debouncedHandle.length < 3) {
      setHandleStatus('idle');
      return;
    }

    // Validate handle format
    if (!/^[a-z0-9-]+$/.test(debouncedHandle)) {
      setHandleStatus('invalid');
      return;
    }

    // Check availability
    const checkAvailability = async () => {
      setHandleStatus('checking');

      try {
        // TODO: Replace with real API call
        // const available = await checkHandleAvailable(debouncedHandle);
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock: some handles are "taken"
        const takenHandles = ['test', 'admin', 'hive', 'space'];
        const available = !takenHandles.includes(debouncedHandle);

        setHandleStatus(available ? 'available' : 'taken');
      } catch (error) {
        console.error('Handle check failed:', error);
        setHandleStatus('idle');
      }
    };

    checkAvailability();
  }, [debouncedHandle]);

  const handleContinue = async () => {
    if (!name.trim() || handleStatus !== 'available') return;

    setIsCreating(true);

    try {
      // Store data for next step (or create space)
      const params = new URLSearchParams({
        template: templateId,
        name: name.trim(),
        handle: handle.trim(),
        ...(description.trim() && { description: description.trim() }),
      });

      router.push(`/spaces/new/access?${params.toString()}`);
    } catch (error) {
      console.error('Failed to continue:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const isValid = name.trim().length >= 2 && handleStatus === 'available';

  return (
    <BuilderShell currentStep={1} stepTitle="Identity">
      <div className="space-y-8">
        {/* Heading */}
        <BuilderHeading
          title="Name your space"
          subtitle="Choose a name and handle for your community"
        />

        {/* Form */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, delay: 0.2, ease: MOTION.ease.premium }}
        >
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-[12px] text-white/40 uppercase tracking-wider">
              Space Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Computer Science Club"
              className="w-full text-[16px]"
              maxLength={100}
            />
          </div>

          {/* Handle Input - THE OWNERSHIP MOMENT */}
          <div className="space-y-2">
            <label className="text-[12px] text-white/40 uppercase tracking-wider">
              Handle
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                @
              </span>
              <Input
                type="text"
                value={handle}
                onChange={(e) => setHandle(slugify(e.target.value))}
                placeholder="csclub"
                className={cn(
                  'w-full pl-8 text-[16px]',
                  handleStatus === 'available' &&
                    'border-[var(--life-gold)]/40 focus:border-[var(--life-gold)]'
                )}
                maxLength={50}
              />

              {/* Status Indicator */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <HandleStatusIndicator status={handleStatus} />
              </div>
            </div>

            {/* Handle Feedback */}
            <AnimatePresence mode="wait">
              {handleStatus === 'available' && (
                <motion.p
                  key="available"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-[12px]"
                >
                  <GradientText variant="gold">It&apos;s yours.</GradientText>{' '}
                  <span className="text-white/30">hive.so/s/{handle}</span>
                </motion.p>
              )}
              {handleStatus === 'taken' && (
                <motion.p
                  key="taken"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-[12px] text-[var(--status-error)]"
                >
                  This handle is already taken
                </motion.p>
              )}
              {handleStatus === 'invalid' && (
                <motion.p
                  key="invalid"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-[12px] text-[var(--status-warning)]"
                >
                  Only lowercase letters, numbers, and hyphens
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <label className="text-[12px] text-white/40 uppercase tracking-wider">
              Description <span className="text-white/20">(optional)</span>
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this space about?"
              className="w-full min-h-[80px]"
              maxLength={300}
            />
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, delay: 0.4, ease: MOTION.ease.premium }}
        >
          <BuilderAction
            onClick={handleContinue}
            disabled={!isValid}
            loading={isCreating}
          >
            Continue
          </BuilderAction>
        </motion.div>
      </div>
    </BuilderShell>
  );
}

// ============================================
// HELPERS
// ============================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

function HandleStatusIndicator({ status }: { status: HandleStatus }) {
  switch (status) {
    case 'checking':
      return (
        <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
      );
    case 'available':
      return (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-[var(--life-gold)]"
        >
          ✓
        </motion.span>
      );
    case 'taken':
      return <span className="text-[var(--status-error)]">✗</span>;
    case 'invalid':
      return <span className="text-[var(--status-warning)]">!</span>;
    default:
      return null;
  }
}
