'use client';

import { motion } from 'framer-motion';
import { MOTION } from '@hive/ui/design-system/primitives';

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: MOTION.duration.fast }}
        className="text-center"
      >
        <div className="w-12 h-12 rounded-full bg-white/[0.04] animate-pulse mx-auto mb-4" />
        <p className="text-white/30 text-body">Loading profile...</p>
      </motion.div>
    </div>
  );
}
