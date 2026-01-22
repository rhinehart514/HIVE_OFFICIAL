'use client';

/**
 * BentoEditToolbar - Sticky toolbar for edit mode
 *
 * Apple-style bottom bar with save/cancel/reset actions.
 * Only visible in edit mode.
 *
 * @version 1.0.0
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// LOCKED: Premium easing
const EASE = [0.22, 1, 0.36, 1] as const;

interface BentoEditToolbarProps {
  isVisible: boolean;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
}

export function BentoEditToolbar({
  isVisible,
  isDirty,
  isSaving,
  onSave,
  onCancel,
  onReset,
}: BentoEditToolbarProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 px-4 pointer-events-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <motion.div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl pointer-events-auto"
            style={{
              backgroundColor: 'rgba(12, 12, 12, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Editing indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: isDirty ? 'var(--life-gold)' : 'rgba(255, 255, 255, 0.3)',
                }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                {isDirty ? 'Unsaved changes' : 'Editing layout'}
              </span>
            </div>

            {/* Divider */}
            <div
              className="w-px h-6"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            />

            {/* Reset button */}
            <motion.button
              onClick={onReset}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                color: 'var(--text-tertiary)',
                backgroundColor: 'transparent',
              }}
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              whileTap={{ opacity: 0.8 }}
            >
              Reset
            </motion.button>

            {/* Cancel button */}
            <motion.button
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                color: 'var(--text-secondary)',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              whileTap={{ opacity: 0.8 }}
            >
              Cancel
            </motion.button>

            {/* Save button */}
            <motion.button
              onClick={onSave}
              disabled={!isDirty || isSaving}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              style={{
                backgroundColor: isDirty ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                color: isDirty ? 'var(--life-gold)' : 'var(--text-tertiary)',
                border: isDirty ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
              }}
              whileHover={
                isDirty
                  ? { backgroundColor: 'rgba(255, 215, 0, 0.25)' }
                  : undefined
              }
              whileTap={{ opacity: 0.8 }}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    className="w-3 h-3 border-2 border-current border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Saving...
                </span>
              ) : (
                'Save Layout'
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BentoEditToolbar;
