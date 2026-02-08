'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MOTION } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

export default function ProfileError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-foundation-gray-1000 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">&#9888;&#65039;</span>
        </div>
        <h1 className="text-title-lg font-semibold text-white mb-3">
          Something Went Wrong
        </h1>
        <p className="text-body text-white/50 mb-8">
          We couldn&apos;t load this profile. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl',
              'bg-white text-foundation-gray-1000 font-medium',
              'hover:bg-white/90 transition-colors'
            )}
          >
            Try Again
          </button>
          <Link
            href="/home"
            className={cn(
              'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl',
              'bg-white/[0.06] text-white/70 font-medium border border-white/[0.08]',
              'hover:bg-white/[0.08] transition-colors'
            )}
          >
            Go Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
