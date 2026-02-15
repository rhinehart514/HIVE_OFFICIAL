'use client';

/**
 * /me/edit — Edit Own Profile
 *
 * Convenience redirect to /profile/edit.
 *
 * @version 1.0.0 - IA Unification (Jan 2026)
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MOTION } from '@hive/ui/design-system/primitives';

export default function MeEditPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profile/edit');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: MOTION.duration.fast }}
        className="text-center"
      >
        <div className="w-10 h-10 rounded-full border-2 border-white/[0.06] border-t-[#FFD700]  mx-auto mb-4" />
        <p className="text-white/50 text-body">Loading editor...</p>
      </motion.div>
    </div>
  );
}
