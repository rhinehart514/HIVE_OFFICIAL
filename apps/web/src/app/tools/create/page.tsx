'use client';

/**
 * AI Tool Creator Page
 *
 * Simple, working AI chat for tool generation.
 * Matches The Void aesthetic from /tools.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@hive/auth-logic';
import { useStreamingGeneration } from '@hive/hooks';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { ToolComposition } from '@hive/core';

const EASE = [0.22, 1, 0.36, 1] as const;

export default function CreateToolPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<{ toolId: string; name: string } | null>(null);

  // Streaming generation hook
  const { state, generate, reset } = useStreamingGeneration({
    onComplete: (composition) => {
      // Tool ready - focus input for iteration
      inputRef.current?.focus();
    },
    onError: (error) => {
      console.error('Generation error:', error);
    }
  });

  // Pick up initial prompt from sessionStorage (from The Void)
  useEffect(() => {
    const initialPrompt = sessionStorage.getItem('hivelab_initial_prompt');
    if (initialPrompt) {
      sessionStorage.removeItem('hivelab_initial_prompt');
      setPrompt(initialPrompt);
      // Auto-generate on mount if we have a prompt
      generate({ prompt: initialPrompt });
    } else {
      // Focus input if no initial prompt
      inputRef.current?.focus();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle user prompt submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || state.isGenerating) return;

    const currentPrompt = prompt.trim();
    setPrompt('');

    // Check if this is iteration (existing composition)
    const hasExisting = state.composition && state.composition.elements.length > 0;
    const iterationSignals = ['add', 'also', 'include', 'change', 'modify', 'update', 'remove', 'make it', 'can you'];
    const lowerPrompt = currentPrompt.toLowerCase();
    const isIteration = Boolean(hasExisting && iterationSignals.some(
      signal => lowerPrompt.startsWith(signal) || lowerPrompt.includes(` ${signal} `)
    ));

    await generate({
      prompt: currentPrompt,
      existingComposition: isIteration ? state.composition ?? undefined : undefined,
      isIteration,
    });
  };

  // Handle save
  const handleSave = useCallback(async () => {
    if (!state.composition || !user) return;

    setIsSaving(true);
    try {
      const response = await apiClient.post('/api/tools', {
        name: state.composition.name,
        description: state.composition.description,
        type: 'ai-generated',
        status: 'draft',
        config: { composition: state.composition },
        elements: state.composition.elements,
      });

      if (!response.ok) throw new Error('Failed to save');

      const data = await response.json();
      const toolId = data.tool?.id || data.toolId;

      setSaveSuccess({ toolId, name: state.composition.name || 'Your tool' });

      // Redirect to studio after brief success state
      setTimeout(() => {
        router.push(`/tools/${toolId}`);
      }, 1500);
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save tool', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSaving(false);
    }
  }, [state.composition, user, router]);

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#050504' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-5 h-5 border-2 border-white/10 border-t-white/50 rounded-full animate-spin"
        />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    router.push('/enter?redirect=/tools/create');
    return null;
  }

  // Success state
  if (saveSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#050504' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center"
          >
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <h2 className="text-2xl font-semibold text-white mb-2">Saved!</h2>
          <p className="text-white/40 text-sm">Opening {saveSuccess.name}...</p>
        </motion.div>
      </div>
    );
  }

  const hasComposition = state.composition && state.composition.elements.length > 0;
  const isGenerating = state.isGenerating;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#050504' }}>
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 30%, rgba(255,255,255,0.015) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 50% 70%, rgba(255,215,0,0.01) 0%, transparent 50%)
          `,
        }}
      />

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        onClick={() => router.push('/tools')}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        <span className="text-sm">Back</span>
      </motion.button>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="w-full max-w-2xl"
        >
          {/* Status / Preview area */}
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="generating"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center mb-12"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 mx-auto mb-4 border-2 border-white/10 border-t-[var(--hive-gold)] rounded-full"
                />
                <p className="text-white/50 text-sm">{state.currentStatus || 'Generating...'}</p>
                <div className="mt-4 w-48 mx-auto h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[var(--hive-gold)]/50 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${state.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            ) : hasComposition ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-12"
              >
                {/* Tool preview card */}
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-medium text-white mb-1">
                        {state.composition?.name || 'Your Tool'}
                      </h2>
                      <p className="text-sm text-white/40">
                        {state.composition?.elements.length} element{state.composition?.elements.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      Ready
                    </div>
                  </div>

                  {/* Element list */}
                  <div className="space-y-2">
                    {state.composition?.elements.slice(0, 4).map((el, i) => (
                      <div
                        key={el.instanceId || i}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02]"
                      >
                        <div className="w-6 h-6 rounded bg-white/[0.05] flex items-center justify-center">
                          <span className="text-xs text-white/40">{i + 1}</span>
                        </div>
                        <span className="text-sm text-white/70">
                          {(el.config as { _name?: string })?._name || el.elementId}
                        </span>
                      </div>
                    ))}
                    {(state.composition?.elements.length || 0) > 4 && (
                      <p className="text-xs text-white/30 px-3">
                        +{(state.composition?.elements.length || 0) - 4} more elements
                      </p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => reset()}
                    className="px-5 py-2.5 text-sm text-white/40 hover:text-white/70 transition-colors"
                  >
                    Start over
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 text-sm font-medium rounded-full
                      bg-white/[0.06] border border-[var(--hive-gold)]/30 text-[var(--hive-gold)]
                      hover:bg-white/[0.10] hover:border-[var(--hive-gold)]/50
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200"
                  >
                    {isSaving ? 'Saving...' : 'Save & Continue'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center mb-12"
              >
                <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-semibold text-white tracking-[-0.02em] mb-4">
                  What will you build?
                </h1>
                <p className="text-white/30 text-base">
                  Describe your tool and AI will create it
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <form onSubmit={handleSubmit} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={hasComposition ? 'Refine or add more...' : 'A voting poll for club meetings...'}
              disabled={isGenerating}
              className="w-full bg-transparent text-center text-xl md:text-2xl text-white/90
                placeholder:text-white/20 py-4 focus:outline-none transition-all
                disabled:opacity-50 caret-[var(--hive-gold)]"
            />
          </form>

          {/* Hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-sm text-white/20 mt-4"
          >
            press <span className="text-white/35">enter</span> to {hasComposition ? 'update' : 'create'}
          </motion.p>

          {/* Quick templates (only when empty) */}
          <AnimatePresence>
            {!hasComposition && !isGenerating && !prompt && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.4, duration: 0.4, ease: EASE }}
                className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-12"
              >
                {[
                  { label: 'Poll', prompt: 'A voting poll for ' },
                  { label: 'RSVP', prompt: 'An event RSVP form for ' },
                  { label: 'Feedback', prompt: 'An anonymous feedback form for ' },
                  { label: 'Sign-up', prompt: 'A sign-up sheet for ' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setPrompt(item.prompt);
                      inputRef.current?.focus();
                    }}
                    className="text-sm text-white/25 hover:text-white/50 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Bottom branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/10 tracking-widest uppercase"
      >
        HiveLab
      </motion.div>
    </div>
  );
}
