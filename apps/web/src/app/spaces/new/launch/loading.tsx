'use client';

import { motion, MOTION } from '@hive/ui/design-system/primitives';

export default function LaunchLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-md px-6 text-center space-y-6">
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

        {/* Text */}
        <div className="space-y-2">
          <motion.p
            className="text-body-lg text-white"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: MOTION.ease.smooth }}
          >
            Creating your space...
          </motion.p>
          <motion.div
            className="h-4 w-24 mx-auto bg-white/[0.04] rounded"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2, ease: MOTION.ease.smooth }}
          />
        </div>
      </div>
    </div>
  );
}
