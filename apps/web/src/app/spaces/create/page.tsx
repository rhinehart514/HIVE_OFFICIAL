'use client';

/**
 * /spaces/create — Create Student Organization
 *
 * Archetype: Focus Flow (Shell ON, centered form)
 * Pattern: Progressive form
 * Shell: ON
 *
 * IMPORTANT: Only student organizations can be created here.
 * University, Residential, and Greek spaces are pre-seeded and
 * must be claimed at /spaces/claim with institutional verification.
 *
 * @version 7.0.0 - Student org only (Jan 2026)
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Text, Button, Input } from '@hive/ui/design-system/primitives';
import { toast } from '@hive/ui';

// Animation
const EASE = [0.22, 1, 0.36, 1] as const;
const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: EASE },
});

export default function CreateSpacePage() {
  const router = useRouter();

  // Form state
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [agreedToGuidelines, setAgreedToGuidelines] = React.useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [createdSpace, setCreatedSpace] = React.useState<{ id: string; name: string } | null>(null);

  const handleCreate = async () => {
    // Validate
    if (!name.trim()) {
      setError('Please enter a space name');
      return;
    }
    if (name.length > 100) {
      setError('Name must be under 100 characters');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }
    if (description.length > 500) {
      setError('Description must be under 500 characters');
      return;
    }
    if (!agreedToGuidelines) {
      setError('You must agree to the community guidelines');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category: 'student_org', // Always student_org
          joinPolicy: 'open',
          visibility: 'public',
          tags: [],
          agreedToGuidelines,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create space');
      }

      setCreatedSpace({ id: data.space?.id, name: name.trim() });
      toast.success('Space created!');

      // Redirect after brief delay
      setTimeout(() => {
        router.push(`/spaces/${data.space?.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create space');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (createdSpace) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <motion.div
          className="text-center space-y-4"
          {...fadeIn(0)}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto category-bg-student">
            <Check className="h-8 w-8 category-text-student" />
          </div>
          <div>
            <Text weight="semibold" size="lg" className="text-white mb-1">
              It&apos;s yours.
            </Text>
            <Text className="text-white/60">
              <strong className="text-white">{createdSpace.name}</strong> is live.
            </Text>
            <Text size="sm" className="text-white/40 mt-2">
              Taking you there now...
            </Text>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative">
      {/* Category accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 category-accent-student" />

      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Back link */}
        <motion.div className="mb-8" {...fadeIn(0)}>
          <Link
            href="/spaces/browse"
            className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to browse
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div className="mb-8" {...fadeIn(0.04)}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center category-bg-student">
              <Users className="h-5 w-5 category-text-student" />
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Create Student Org
            </h1>
          </div>
          <Text className="text-white/50">
            Start a new club, team, or student organization.
          </Text>
        </motion.div>

        {/* Form */}
        <motion.div
          className="space-y-6 p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]"
          {...fadeIn(0.08)}
        >
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Space name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., UB Photography Club"
              maxLength={100}
            />
            <Text size="xs" className="text-white/30 mt-1.5 text-right">
              {name.length}/100
            </Text>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this space about? What will members do here?"
              maxLength={500}
              rows={4}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg',
                'bg-white/[0.04] border border-white/[0.08]',
                'text-white placeholder:text-white/30',
                'focus:outline-none focus:ring-2 focus:ring-white/20',
                'resize-none transition-all duration-150'
              )}
            />
            <Text size="xs" className="text-white/30 mt-1.5 text-right">
              {description.length}/500
            </Text>
          </div>

          {/* Guidelines */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="guidelines"
              checked={agreedToGuidelines}
              onChange={(e) => setAgreedToGuidelines(e.target.checked)}
              className={cn(
                'mt-0.5 h-4 w-4 rounded',
                'border border-white/20 bg-transparent',
                'focus:ring-2 focus:ring-white/20 focus:ring-offset-0',
                'checked:bg-white checked:border-white'
              )}
            />
            <label htmlFor="guidelines" className="text-sm text-white/60">
              I agree to the{' '}
              <Link href="/legal/community-guidelines" className="underline hover:text-white/80">
                community guidelines
              </Link>{' '}
              and will moderate this space responsibly.
            </label>
          </div>

          {/* Error */}
          {error && (
            <Text size="sm" className="text-red-400">
              {error}
            </Text>
          )}

          {/* Submit */}
          <Button
            variant="default"
            size="lg"
            onClick={handleCreate}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Create Space'
            )}
          </Button>

          <Text size="xs" className="text-white/30 text-center">
            Your space will be visible in browse once created.
          </Text>
        </motion.div>

        {/* Alternative */}
        <motion.div className="mt-8 text-center" {...fadeIn(0.12)}>
          <Text size="sm" className="text-white/40">
            Looking for an existing university, residential, or Greek space?{' '}
            <Link
              href="/spaces/claim"
              className="text-white/60 hover:text-white/80 underline underline-offset-2"
            >
              Claim it instead
            </Link>
          </Text>
        </motion.div>
      </div>
    </div>
  );
}
