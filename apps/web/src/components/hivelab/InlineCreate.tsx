'use client';

/**
 * InlineCreate - Instant tool creation without leaving the page
 *
 * Single input → AI generates tool → Preview → Done
 * No editor, no complexity. Just "build a poll about..."
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOTION } from '@hive/ui/tokens/motion';

interface InlineCreateProps {
  spaceId?: string;
  placeholder?: string;
  onComplete: (tool: { id: string; name: string }) => void;
  onCancel?: () => void;
  className?: string;
}

export function InlineCreate({
  spaceId,
  placeholder = 'Build a poll about...',
  onComplete,
  onCancel,
  className = '',
}: InlineCreateProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus on mount
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/tools/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          spaceId,
          mode: 'instant', // Flag for minimal generation, no manual edits
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate tool');
      }

      const tool = await response.json();
      onComplete(tool);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
    // Escape to cancel
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isGenerating}
          rows={3}
          className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[var(--life-gold)] transition-colors resize-none disabled:opacity-50"
        />

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-white/40">
            {isGenerating ? (
              <span>Generating...</span>
            ) : (
              <span>
                Press <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded">⌘ Enter</kbd> to create
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isGenerating}
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className="px-4 py-2 bg-[var(--life-gold)] text-black rounded-lg text-sm font-medium hover:bg-[var(--life-gold)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create Tool'
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
              className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Examples (show when empty) */}
      {!prompt && !isGenerating && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-white/40 mb-2">Try:</p>
          {[
            'Poll about best study spots on campus',
            'Event RSVP for spring formal on March 15',
            'Signup sheet for office hours next week',
            'Countdown to finals week',
          ].map((example) => (
            <button
              key={example}
              onClick={() => setPrompt(example)}
              className="block w-full text-left px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
            >
              "{example}"
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * InlineCreateModal - Full-screen modal wrapper for InlineCreate
 */
interface InlineCreateModalProps {
  isOpen: boolean;
  spaceId?: string;
  onComplete: (tool: { id: string; name: string }) => void;
  onClose: () => void;
}

export function InlineCreateModal({ isOpen, spaceId, onComplete, onClose }: InlineCreateModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[var(--bg-surface)] border border-white/[0.06] rounded-2xl p-6 shadow-xl"
      >
        <h2 className="text-xl font-semibold text-white mb-4">Create a Tool</h2>
        <InlineCreate
          spaceId={spaceId}
          placeholder="Describe what you want to build..."
          onComplete={onComplete}
          onCancel={onClose}
        />
      </motion.div>
    </motion.div>
  );
}
