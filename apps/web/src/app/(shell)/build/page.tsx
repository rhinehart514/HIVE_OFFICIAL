'use client';

export const dynamic = 'force-dynamic';

/**
 * /build — Classification-First Build Entry
 *
 * 1. User types a prompt
 * 2. /api/tools/classify runs (~500ms)
 * 3. Native format (poll/bracket/rsvp) with confidence > 0.5 → shell preview
 * 4. Custom or low confidence → streaming code generation
 *
 * Split panel: prompt left, preview right (desktop). Stacked on mobile.
 * Non-authed users can create but hit a signup gate at deploy.
 */

import React, { useState, useCallback, useRef, useEffect, Suspense, lazy } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@hive/auth-logic';
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  Loader2,
  Send,
  Wand2,
  Check,
  Zap,
} from 'lucide-react';
import { MOTION, durationSeconds, CARD } from '@hive/tokens';
import { BrandSpinner } from '@hive/ui';

import { useBuildMachine, type BuildPhase } from '@/hooks/use-build-machine';
import { isNativeFormat, SHELL_REGISTRY } from '@/lib/shells';
import type { ShellFormat, ShellConfig, PollConfig, BracketConfig, RSVPConfig } from '@/lib/shells/types';
import { useAnalytics } from '@/hooks/use-analytics';

const ShellRenderer = lazy(() => import('@/components/shells/ShellRenderer'));

const EASE = MOTION.ease.premium;

const DEPLOY_STORAGE_KEY = 'hive_pending_deploy';

// ============================================================================
// PROMPT INPUT
// ============================================================================

function PromptInput({
  onSubmit,
  disabled,
  autoPrompt,
}: {
  onSubmit: (prompt: string) => void;
  disabled: boolean;
  autoPrompt?: string;
}) {
  const [value, setValue] = useState(autoPrompt ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoPrompt) {
      setValue(autoPrompt);
      // Auto-submit if we got a prompt from query params
      setTimeout(() => onSubmit(autoPrompt), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder={`Describe what you want to make... "best dining hall on campus" "who's coming to the study session"`}
          disabled={disabled}
          rows={2}
          className="w-full px-4 py-3 pr-12 rounded-2xl text-[15px] bg-white/[0.03] border border-white/[0.08]
            text-white placeholder:text-white/25 resize-none focus:outline-none focus:ring-1 focus:ring-white/20
            disabled:opacity-50 transition-colors"
          style={{ minHeight: 56, maxHeight: 160 }}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="absolute right-2 bottom-2 h-9 w-9 flex items-center justify-center
            rounded-xl bg-white text-black disabled:opacity-30 disabled:bg-white/20
            hover:bg-white/90 transition-all"
        >
          {disabled ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SHELL CONFIG EDITOR — inline editing for matched shells
// ============================================================================

function PollConfigEditor({
  config,
  onChange,
}: {
  config: PollConfig;
  onChange: (c: PollConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-white/40 mb-1 block">Question</label>
        <input
          type="text"
          value={config.question}
          onChange={(e) => onChange({ ...config, question: e.target.value })}
          className="w-full px-3 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06]
            text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>
      <div>
        <label className="text-xs text-white/40 mb-1 block">Options</label>
        <div className="space-y-2">
          {config.options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const newOptions = [...config.options];
                  newOptions[i] = e.target.value;
                  onChange({ ...config, options: newOptions });
                }}
                placeholder={`Option ${i + 1}`}
                className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-white/[0.03] border border-white/[0.06]
                  text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
              {config.options.length > 2 && (
                <button
                  onClick={() => {
                    const newOptions = config.options.filter((_, j) => j !== i);
                    onChange({ ...config, options: newOptions });
                  }}
                  className="text-white/20 hover:text-white/40 text-xs px-2"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {config.options.length < 6 && (
            <button
              onClick={() => onChange({ ...config, options: [...config.options, ''] })}
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              + Add option
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BracketConfigEditor({
  config,
  onChange,
}: {
  config: BracketConfig;
  onChange: (c: BracketConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-white/40 mb-1 block">Topic</label>
        <input
          type="text"
          value={config.topic}
          onChange={(e) => onChange({ ...config, topic: e.target.value })}
          className="w-full px-3 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06]
            text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>
      <div>
        <label className="text-xs text-white/40 mb-1 block">Entries</label>
        <div className="space-y-2">
          {config.entries.map((entry, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={entry}
                onChange={(e) => {
                  const newEntries = [...config.entries];
                  newEntries[i] = e.target.value;
                  onChange({ ...config, entries: newEntries });
                }}
                placeholder={`Entry ${i + 1}`}
                className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-white/[0.03] border border-white/[0.06]
                  text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
              {config.entries.length > 4 && (
                <button
                  onClick={() => {
                    const newEntries = config.entries.filter((_, j) => j !== i);
                    onChange({ ...config, entries: newEntries });
                  }}
                  className="text-white/20 hover:text-white/40 text-xs px-2"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {config.entries.length < 16 && (
            <button
              onClick={() => onChange({ ...config, entries: [...config.entries, ''] })}
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              + Add entry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RSVPConfigEditor({
  config,
  onChange,
}: {
  config: RSVPConfig;
  onChange: (c: RSVPConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-white/40 mb-1 block">Title</label>
        <input
          type="text"
          value={config.title}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="w-full px-3 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06]
            text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>
      <div>
        <label className="text-xs text-white/40 mb-1 block">Location (optional)</label>
        <input
          type="text"
          value={config.location ?? ''}
          onChange={(e) => onChange({ ...config, location: e.target.value || undefined })}
          placeholder="e.g. Student Union Room 210"
          className="w-full px-3 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06]
            text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/40 mb-1 block">Date & time (optional)</label>
          <input
            type="datetime-local"
            value={config.dateTime ?? ''}
            onChange={(e) => onChange({ ...config, dateTime: e.target.value || undefined })}
            className="w-full px-3 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06]
              text-white focus:outline-none focus:ring-1 focus:ring-white/20
              [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Capacity (optional)</label>
          <input
            type="number"
            min={1}
            max={10000}
            value={config.capacity ?? ''}
            onChange={(e) =>
              onChange({ ...config, capacity: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="No limit"
            className="w-full px-3 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06]
              text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
        </div>
      </div>
    </div>
  );
}

function ShellConfigEditor({
  format,
  config,
  onChange,
}: {
  format: ShellFormat;
  config: ShellConfig;
  onChange: (config: ShellConfig) => void;
}) {
  if (!config) return null;

  switch (format) {
    case 'poll':
      return <PollConfigEditor config={config as PollConfig} onChange={onChange} />;
    case 'bracket':
      return <BracketConfigEditor config={config as BracketConfig} onChange={onChange} />;
    case 'rsvp':
      return <RSVPConfigEditor config={config as RSVPConfig} onChange={onChange} />;
    default:
      return null;
  }
}

// ============================================================================
// PHASE INDICATORS
// ============================================================================

function PhaseIndicator({ phase }: { phase: BuildPhase }) {
  const labels: Record<BuildPhase, string> = {
    idle: '',
    classifying: 'Understanding your idea...',
    'shell-matched': 'Format detected',
    generating: 'Building your app...',
    complete: 'Ready to share',
    error: 'Something went wrong',
  };

  if (phase === 'idle') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-xs text-white/40 mt-3"
    >
      {(phase === 'classifying' || phase === 'generating') && (
        <Loader2 className="w-3 h-3 animate-spin text-white/30" />
      )}
      {phase === 'shell-matched' && <Wand2 className="w-3 h-3 text-[#FFD700]/60" />}
      {phase === 'complete' && <Check className="w-3 h-3 text-[#10B981]/60" />}
      <span>{labels[phase]}</span>
    </motion.div>
  );
}

// ============================================================================
// CODE PREVIEW (streaming custom gen)
// ============================================================================

function CodePreview({
  status,
  codeOutput,
}: {
  status: string;
  codeOutput: { html: string; css: string; js: string } | null;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!codeOutput || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #0a0a0a; color: #fff; font-family: system-ui, sans-serif; }
          ${codeOutput.css}
        </style>
      </head>
      <body>
        ${codeOutput.html}
        <script>${codeOutput.js}<\/script>
      </body>
      </html>
    `);
    doc.close();
  }, [codeOutput]);

  return (
    <div className="w-full h-full flex flex-col">
      {status && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-white/30 border-b border-white/[0.06]">
          <Loader2 className="w-3 h-3 animate-spin" />
          {status}
        </div>
      )}
      {codeOutput ? (
        <iframe
          ref={iframeRef}
          className="flex-1 w-full border-0 rounded-b-2xl bg-[#0a0a0a]"
          sandbox="allow-scripts"
          title="App preview"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <BrandSpinner size="md" variant="gold" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DEPLOY GATE
// ============================================================================

function savePendingDeploy(state: { prompt: string; format?: string; config?: ShellConfig }) {
  try {
    localStorage.setItem(DEPLOY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable
  }
}

function loadPendingDeploy(): { prompt: string; format?: string; config?: ShellConfig } | null {
  try {
    const raw = localStorage.getItem(DEPLOY_STORAGE_KEY);
    if (!raw) return null;
    localStorage.removeItem(DEPLOY_STORAGE_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function BuildPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { track } = useAnalytics();

  const originSpaceId = searchParams.get('spaceId');
  const autoPrompt = searchParams.get('prompt') || undefined;

  const {
    state,
    submitPrompt,
    updateShellConfig,
    acceptShell,
    escalateToCustom,
    reset,
  } = useBuildMachine({
    spaceId: originSpaceId,
    onToolCreated: (toolId) => {
      track('creation_completed', { toolId, source: 'build-page' });
    },
  });

  // On mount: check for pending deploy from auth flow
  useEffect(() => {
    if (!authLoading && user) {
      const pending = loadPendingDeploy();
      if (pending?.prompt) {
        submitPrompt(pending.prompt);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleDeploy = useCallback(async () => {
    if (!user) {
      // Save creation state and redirect to auth
      savePendingDeploy({
        prompt: state.prompt,
        format: state.classification?.format,
        config: state.shellConfig,
      });
      router.push('/enter?redirect=/build');
      return;
    }

    await acceptShell();
  }, [user, state.prompt, state.classification, state.shellConfig, acceptShell, router]);

  const handleShare = useCallback(() => {
    if (!state.toolId) return;
    const url = `${window.location.origin}/t/${state.toolId}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success('Link copied!'),
      () => toast.success(`Share: ${url}`)
    );
  }, [state.toolId]);

  const isWorking = state.phase === 'classifying' || state.phase === 'generating';
  const showPreview = state.phase !== 'idle';
  const shellFormat = state.classification?.format;
  const isShellMatched = state.phase === 'shell-matched' && shellFormat && isNativeFormat(shellFormat);
  const registryEntry = isShellMatched ? SHELL_REGISTRY[shellFormat as Exclude<ShellFormat, 'custom'>] : null;

  // Loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <BrandSpinner size="md" variant="gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Split panel: left prompt, right preview */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* ============================================ */}
        {/* LEFT PANEL — Prompt + controls               */}
        {/* ============================================ */}
        <div className="w-full lg:w-[420px] lg:min-w-[400px] lg:border-r lg:border-white/[0.06] flex flex-col">
          <div className="flex-1 px-6 py-8 flex flex-col">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-[#FFD700]/60" />
                <h1 className="text-lg font-medium text-white">Make something</h1>
              </div>
              <p className="text-sm text-white/35">
                Describe it. We figure out the format.
              </p>
            </motion.div>

            {/* Prompt input */}
            <PromptInput
              onSubmit={submitPrompt}
              disabled={isWorking}
              autoPrompt={autoPrompt}
            />

            {/* Phase indicator */}
            <PhaseIndicator phase={state.phase} />

            {/* Shell config editor (only in shell-matched phase) */}
            <AnimatePresence mode="wait">
              {isShellMatched && state.shellConfig && (
                <motion.div
                  key="shell-editor"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="mt-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-3.5 h-3.5 text-[#FFD700]/50" />
                      <span className="text-xs font-medium text-white/50">
                        {registryEntry?.displayName} detected
                      </span>
                    </div>
                    <span className="text-[10px] text-white/20 px-2 py-0.5 rounded-full bg-white/[0.04]">
                      {Math.round((state.classification?.confidence ?? 0) * 100)}% match
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    <ShellConfigEditor
                      format={shellFormat!}
                      config={state.shellConfig}
                      onChange={updateShellConfig}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleDeploy}
                      className="flex-1 flex items-center justify-center gap-2 h-10 rounded-2xl
                        bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors"
                    >
                      <Zap className="w-4 h-4" />
                      {user ? 'Deploy' : 'Sign in to deploy'}
                    </button>
                    <button
                      onClick={escalateToCustom}
                      className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-2xl
                        text-sm text-white/40 bg-white/[0.04] hover:bg-white/[0.06] hover:text-white/60
                        transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Make it custom
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Complete state actions */}
            <AnimatePresence>
              {state.phase === 'complete' && state.toolId && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-3"
                >
                  <div className="flex items-center gap-2 text-sm text-[#10B981]/70">
                    <Check className="w-4 h-4" />
                    <span>
                      {state.toolName || 'Your app'} is live
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleShare}
                      className="flex-1 flex items-center justify-center gap-2 h-10 rounded-2xl
                        bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors"
                    >
                      Copy link
                    </button>
                    <button
                      onClick={() => router.push(`/build/${state.toolId}`)}
                      className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-2xl
                        text-sm text-white/50 bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
                    >
                      Edit
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={reset}
                    className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/40 transition-colors mt-2"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Make another
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error state */}
            {state.phase === 'error' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6"
              >
                <p className="text-sm text-red-400/80 mb-3">{state.error}</p>
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Try again
                </button>
              </motion.div>
            )}

            {/* Spacer to push help text to bottom */}
            <div className="flex-1" />

            {/* Help text */}
            {state.phase === 'idle' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 space-y-2"
              >
                <p className="text-xs text-white/20">Try something like:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Best dining hall on campus',
                    'Who\'s coming to the pregame',
                    'Rate the professors bracket',
                    'Study group signup sheet',
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => submitPrompt(example)}
                      className="px-3 py-1.5 rounded-full text-xs text-white/30 bg-white/[0.03]
                        border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/50
                        transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* ============================================ */}
        {/* RIGHT PANEL — Preview                        */}
        {/* ============================================ */}
        <div className="flex-1 flex flex-col min-h-[50vh] lg:min-h-0">
          <AnimatePresence mode="wait">
            {!showPreview ? (
              /* Empty state */
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center px-6"
              >
                <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/[0.06]
                  flex items-center justify-center mb-4"
                >
                  <Sparkles className="w-7 h-7 text-white/10" />
                </div>
                <p className="text-sm text-white/20 text-center max-w-xs">
                  Your creation will appear here
                </p>
              </motion.div>
            ) : isShellMatched ? (
              /* Shell preview */
              <motion.div
                key="shell-preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="flex-1 flex items-center justify-center p-6"
              >
                <div className="w-full max-w-sm">
                  <Suspense
                    fallback={
                      <div className="h-48 rounded-2xl bg-white/[0.03] animate-pulse" />
                    }
                  >
                    <ShellRenderer
                      format={shellFormat!}
                      shellId="preview"
                      config={state.shellConfig}
                      state={null}
                      currentUserId="preview-user"
                      creatorId="preview-user"
                      isCreator={true}
                      onAction={() => {}}
                      compact={false}
                    />
                  </Suspense>

                  <p className="text-center text-[11px] text-white/15 mt-4">
                    Live preview — this is what people will see
                  </p>
                </div>
              </motion.div>
            ) : (state.phase === 'generating' || state.phase === 'complete') ? (
              /* Code gen preview */
              <motion.div
                key="code-preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col rounded-2xl overflow-hidden m-3 lg:m-4
                  border border-white/[0.06] bg-[#0a0a0a]"
              >
                <CodePreview
                  status={state.phase === 'generating' ? state.streamingStatus : ''}
                  codeOutput={state.codeOutput}
                />
              </motion.div>
            ) : state.phase === 'classifying' ? (
              /* Classifying state */
              <motion.div
                key="classifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-center"
              >
                <div className="text-center">
                  <BrandSpinner size="md" variant="gold" />
                  <p className="text-xs text-white/25 mt-4">
                    Understanding your idea...
                  </p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
