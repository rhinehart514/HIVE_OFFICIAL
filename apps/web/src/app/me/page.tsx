'use client';

/**
 * /me — Personal Hub Redirect
 *
 * Redirects authenticated users to their canonical profile URL (/u/[handle]).
 * Unauthenticated users are redirected to /enter.
 *
 * This is a convenience URL that can be bookmarked.
 *
 * @version 2.0.0 - IA Unification (Jan 2026)
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@hive/auth-logic';
import { motion } from 'framer-motion';
import { MOTION } from '@hive/ui/design-system/primitives';

export default function MePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to resolve
    if (isLoading) return;

    if (user?.handle) {
      // Authenticated with handle - go to canonical profile URL
      router.replace(`/u/${user.handle}`);
    } else if (user?.id) {
      // Authenticated but no handle (edge case) - fall back to ID-based URL
      // The ID-based URL will redirect to handle URL once resolved
      router.replace(`/profile/${user.id}`);
    } else {
      // Not authenticated - go to entry with redirect back
      router.replace('/enter?redirect=/me');
    }
  }, [user?.handle, user?.id, isLoading, router]);

  // Show loading while determining redirect
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: MOTION.duration.fast }}
        className="text-center"
      >
        <div className="w-10 h-10 rounded-full border border-2 border-white/[0.06] border-t-gold-500  mx-auto mb-4" />
        <p className="text-white/50 text-body">Loading your profile...</p>
      </motion.div>
    </div>
  );
}
