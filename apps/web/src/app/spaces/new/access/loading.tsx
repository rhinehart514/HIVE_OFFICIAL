'use client';

import { motion, MOTION } from '@hive/ui/design-system/primitives';

export default function AccessLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-md px-6 space-y-8">
        {/* Header skeleton */}
        <div className="text-center space-y-3">
          <motion.div
            className="h-8 w-40 mx-auto bg-white/[0.06] rounded-lg"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: MOTION.ease.smooth }}
          />
          <motion.div
            className="h-4 w-56 mx-auto bg-white/[0.04] rounded"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1, ease: MOTION.ease.smooth }}
          />
        </div>

        {/* Access options skeleton */}
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-20 w-full bg-white/[0.04] rounded-xl border border-white/[0.06]"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 + i * 0.1, ease: MOTION.ease.smooth }}
            />
          ))}
        </div>

        {/* Helper text skeleton */}
        <motion.div
          className="h-4 w-48 mx-auto bg-white/[0.03] rounded"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5, ease: MOTION.ease.smooth }}
        />

        {/* Button skeleton */}
        <motion.div
          className="h-12 w-full bg-white/[0.08] rounded-lg"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6, ease: MOTION.ease.smooth }}
        />
      </div>
    </div>
  );
}
