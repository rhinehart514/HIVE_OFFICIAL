'use client';

import { motion, MOTION } from '@hive/ui/design-system/primitives';

export default function IdentityLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-md px-6 space-y-8">
        {/* Header skeleton */}
        <div className="text-center space-y-3">
          <motion.div
            className="h-8 w-48 mx-auto bg-white/[0.06] rounded-lg"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: MOTION.ease.smooth }}
          />
          <motion.div
            className="h-4 w-64 mx-auto bg-white/[0.04] rounded"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1, ease: MOTION.ease.smooth }}
          />
        </div>

        {/* Form skeleton */}
        <div className="space-y-6">
          {/* Name input */}
          <div className="space-y-2">
            <motion.div
              className="h-3 w-20 bg-white/[0.04] rounded"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2, ease: MOTION.ease.smooth }}
            />
            <motion.div
              className="h-12 w-full bg-white/[0.06] rounded-lg border border-white/[0.06]"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.25, ease: MOTION.ease.smooth }}
            />
          </div>

          {/* Handle input */}
          <div className="space-y-2">
            <motion.div
              className="h-3 w-16 bg-white/[0.04] rounded"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3, ease: MOTION.ease.smooth }}
            />
            <motion.div
              className="h-12 w-full bg-white/[0.06] rounded-lg border border-white/[0.06]"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.35, ease: MOTION.ease.smooth }}
            />
          </div>

          {/* Description input */}
          <div className="space-y-2">
            <motion.div
              className="h-3 w-24 bg-white/[0.04] rounded"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4, ease: MOTION.ease.smooth }}
            />
            <motion.div
              className="h-20 w-full bg-white/[0.06] rounded-lg border border-white/[0.06]"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.45, ease: MOTION.ease.smooth }}
            />
          </div>
        </div>

        {/* Button skeleton */}
        <motion.div
          className="h-12 w-full bg-white/[0.08] rounded-lg"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5, ease: MOTION.ease.smooth }}
        />
      </div>
    </div>
  );
}
