'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { User, AtSign, GraduationCap, Calendar } from 'lucide-react';
import { GLOW_GOLD_SUBTLE, itemVariants } from '../shared/motion';
import type { HandleStatus } from '../shared/types';

interface LivePreviewProps {
  name: string;
  handle: string;
  handleStatus: HandleStatus;
  major: string;
  graduationYear: number | null;
}

/**
 * Live preview card that updates in real-time as user types
 * Shows on the left panel of the 50/50 split layout
 * YC/SF/OpenAI aesthetic
 */
export function LivePreview({
  name,
  handle,
  handleStatus,
  major,
  graduationYear,
}: LivePreviewProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isHandleValid = handleStatus === 'available';

  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <motion.div
        variants={itemVariants}
        initial="initial"
        animate="animate"
        className="relative"
      >
        {/* Preview label */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute -top-8 left-0 text-xs uppercase tracking-wider"
          style={{ color: 'var(--hive-text-disabled)' }}
        >
          Preview
        </motion.div>

        {/* Profile card */}
        <motion.div
          className="w-[280px] rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden backdrop-blur-sm"
          style={{ boxShadow: GLOW_GOLD_SUBTLE }}
          layout
        >
          {/* Avatar section */}
          <div className="p-6 flex flex-col items-center border-b border-white/[0.06]">
            {/* Avatar */}
            <motion.div
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/20 flex items-center justify-center mb-4"
              animate={{
                scale: name ? 1 : 0.95,
                opacity: name ? 1 : 0.5,
              }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence mode="wait">
                {initials ? (
                  <motion.span
                    key="initials"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-2xl font-bold text-gold-500"
                  >
                    {initials}
                  </motion.span>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <User className="w-8 h-8" style={{ color: 'var(--hive-text-disabled)' }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Name */}
            <AnimatePresence mode="wait">
              {name ? (
                <motion.h3
                  key="name"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-lg font-semibold text-white text-center"
                >
                  {name}
                </motion.h3>
              ) : (
                <motion.h3
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                  className="text-lg font-semibold"
                  style={{ color: 'var(--hive-text-subtle)' }}
                >
                  Your name
                </motion.h3>
              )}
            </AnimatePresence>

            {/* Handle */}
            <AnimatePresence mode="wait">
              {handle ? (
                <motion.div
                  key="handle"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={`flex items-center gap-1 mt-1 ${
                    isHandleValid ? 'text-gold-500' : handleStatus === 'checking' ? '' : 'text-red-400'
                  }`}
                  style={handleStatus === 'checking' ? { color: 'var(--hive-text-secondary)' } : {}}
                >
                  <AtSign className="w-3.5 h-3.5" />
                  <span className="text-sm font-medium">{handle}</span>
                  {isHandleValid && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-1 text-xs"
                    >
                      ✓
                    </motion.span>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 mt-1"
                  style={{ color: 'var(--hive-text-disabled)' }}
                >
                  <AtSign className="w-3.5 h-3.5" />
                  <span className="text-sm">yourhandle</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Details section */}
          <div className="p-4 space-y-3">
            {/* Major */}
            <motion.div
              className="flex items-center gap-3"
              animate={{ opacity: major ? 1 : 0.3 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <GraduationCap className="w-4 h-4" style={{ color: 'var(--hive-text-subtle)' }} />
              </div>
              <span className={`text-sm ${major ? 'text-white' : ''}`} style={major ? {} : { color: 'var(--hive-text-disabled)' }}>
                {major || 'Your major'}
              </span>
            </motion.div>

            {/* Year */}
            <motion.div
              className="flex items-center gap-3"
              animate={{ opacity: graduationYear ? 1 : 0.3 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <Calendar className="w-4 h-4" style={{ color: 'var(--hive-text-subtle)' }} />
              </div>
              <span className={`text-sm ${graduationYear ? 'text-white' : ''}`} style={graduationYear ? {} : { color: 'var(--hive-text-disabled)' }}>
                {graduationYear ? `Class of ${graduationYear}` : 'Graduation year'}
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* URL preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-center"
        >
          <span className="text-xs" style={{ color: 'var(--hive-text-disabled)' }}>
            hive.so/{handle || 'your-handle'}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
