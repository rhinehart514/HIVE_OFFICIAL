'use client';

/**
 * SparkleCreateSheet — In-space creation bottom sheet
 *
 * Flow:
 * 1. Quick Create: format chips (Poll/Bracket/RSVP) → prefill chat input
 * 2. Custom prompt → classify → shell config editor → "Drop in chat"
 * 3. Non-shell prompts → redirect to /build with space context
 *
 * "Drop in chat" creates the tool, deploys to space, and notifies parent.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, Send, BarChart3, Trophy, CalendarCheck, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBuildMachine } from '@/hooks/use-build-machine';
import type { ShellFormat, ShellConfig, PollConfig, BracketConfig, RSVPConfig } from '@/lib/shells/types';

type FormatChip = 'poll' | 'bracket' | 'rsvp';

interface SparkleCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  spaceName: string;
  /** Called when user selects a format chip — prefills chat input */
  onFormatSelect: (format: FormatChip) => void;
  /** Called after tool is created and deployed to space */
  onToolDeployed?: (toolId: string) => void;
}

const FORMAT_CHIPS: Array<{ id: FormatChip; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'poll', label: 'Poll', icon: BarChart3 },
  { id: 'bracket', label: 'Bracket', icon: Trophy },
  { id: 'rsvp', label: 'RSVP', icon: CalendarCheck },
];

// ── Inline Shell Config Editors ──────────────────────────────────────

const inputClass = cn(
  'w-full px-3 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/[0.05]',
  'text-white placeholder:text-white/30 focus:outline-none focus:outline-2 focus:outline-[#FFD700]',
);

const smallInputClass = cn(
  'flex-1 px-3 py-1.5 rounded-lg text-sm bg-white/[0.03] border border-white/[0.05]',
  'text-white placeholder:text-white/30 focus:outline-none focus:outline-2 focus:outline-[#FFD700]',
);

function PollEditor({ config, onChange }: { config: PollConfig; onChange: (c: PollConfig) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] text-white/50 mb-1 block">Question</label>
        <input type="text" value={config.question} onChange={(e) => onChange({ ...config, question: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className="text-[11px] text-white/50 mb-1 block">Options</label>
        <div className="space-y-2">
          {config.options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => { const o = [...config.options]; o[i] = e.target.value; onChange({ ...config, options: o }); }}
                placeholder={`Option ${i + 1}`}
                className={smallInputClass}
              />
              {config.options.length > 2 && (
                <button onClick={() => onChange({ ...config, options: config.options.filter((_, j) => j !== i) })} className="text-white/30 hover:text-white/50 text-xs px-2">
                  Remove
                </button>
              )}
            </div>
          ))}
          {config.options.length < 6 && (
            <button onClick={() => onChange({ ...config, options: [...config.options, ''] })} className="text-xs text-white/30 hover:text-white/50 transition-colors duration-100">
              + Add option
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BracketEditor({ config, onChange }: { config: BracketConfig; onChange: (c: BracketConfig) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] text-white/50 mb-1 block">Topic</label>
        <input type="text" value={config.topic} onChange={(e) => onChange({ ...config, topic: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className="text-[11px] text-white/50 mb-1 block">Entries</label>
        <div className="space-y-2">
          {config.entries.map((entry, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={entry}
                onChange={(e) => { const e2 = [...config.entries]; e2[i] = e.target.value; onChange({ ...config, entries: e2 }); }}
                placeholder={`Entry ${i + 1}`}
                className={smallInputClass}
              />
              {config.entries.length > 4 && (
                <button onClick={() => onChange({ ...config, entries: config.entries.filter((_, j) => j !== i) })} className="text-white/30 hover:text-white/50 text-xs px-2">
                  Remove
                </button>
              )}
            </div>
          ))}
          {config.entries.length < 16 && (
            <button onClick={() => onChange({ ...config, entries: [...config.entries, ''] })} className="text-xs text-white/30 hover:text-white/50 transition-colors duration-100">
              + Add entry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RSVPEditor({ config, onChange }: { config: RSVPConfig; onChange: (c: RSVPConfig) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] text-white/50 mb-1 block">Title</label>
        <input type="text" value={config.title} onChange={(e) => onChange({ ...config, title: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className="text-[11px] text-white/50 mb-1 block">Location (optional)</label>
        <input
          type="text"
          value={config.location ?? ''}
          onChange={(e) => onChange({ ...config, location: e.target.value || undefined })}
          placeholder="e.g. Student Union Room 210"
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-white/50 mb-1 block">Date & time</label>
          <input
            type="datetime-local"
            value={config.dateTime ?? ''}
            onChange={(e) => onChange({ ...config, dateTime: e.target.value || undefined })}
            className={cn(inputClass, '[color-scheme:dark]')}
          />
        </div>
        <div>
          <label className="text-[11px] text-white/50 mb-1 block">Capacity</label>
          <input
            type="number"
            min={1}
            max={10000}
            value={config.capacity ?? ''}
            onChange={(e) => onChange({ ...config, capacity: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="No limit"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}

function ShellEditor({ format, config, onChange }: { format: ShellFormat; config: ShellConfig; onChange: (c: ShellConfig) => void }) {
  if (!config) return null;
  switch (format) {
    case 'poll': return <PollEditor config={config as PollConfig} onChange={onChange} />;
    case 'bracket': return <BracketEditor config={config as BracketConfig} onChange={onChange} />;
    case 'rsvp': return <RSVPEditor config={config as RSVPConfig} onChange={onChange} />;
    default: return null;
  }
}

// ── Main Component ───────────────────────────────────────────────────

export function SparkleCreateSheet({
  open,
  onOpenChange,
  spaceId,
  spaceName,
  onFormatSelect,
  onToolDeployed,
}: SparkleCreateSheetProps) {
  const router = useRouter();
  const [prompt, setPrompt] = React.useState('');
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const { state, submitPrompt, updateShellConfig, acceptShell, reset } = useBuildMachine({
    spaceId,
    spaceContext: { spaceId, spaceName },
    onToolCreated: (toolId) => {
      onToolDeployed?.(toolId);
    },
  });

  const isInline = state.phase === 'classifying' || state.phase === 'shell-matched' || state.phase === 'complete';
  const sheetHeight = isInline ? '80vh' : '45vh';

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setPrompt('');
      reset();
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, reset]);

  // Close sheet after successful deploy
  React.useEffect(() => {
    if (state.phase === 'complete' && state.toolId) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.toolId, onOpenChange]);

  const handleFormatSelect = (format: FormatChip) => {
    onFormatSelect(format);
    onOpenChange(false);
  };

  const handlePromptSubmit = async () => {
    if (!prompt.trim()) return;
    await submitPrompt(prompt.trim());
  };

  const handleFallbackToBuild = () => {
    onOpenChange(false);
    const params = new URLSearchParams({ spaceId, spaceName, prompt: prompt.trim() });
    router.push(`/build?${params.toString()}`);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={() => onOpenChange(false)}
          />

          {/* Sheet */}
          <motion.div
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-void border-t border-white/[0.05] rounded-t-2xl',
              'overflow-y-auto'
            )}
            style={{ maxHeight: sheetHeight }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-1 rounded-full bg-white/[0.10]" />
            </div>

            <div className="px-4 pb-8">
              {/* ── IDLE: Quick Create ── */}
              {state.phase === 'idle' && (
                <div>
                  <h3 className="text-[15px] font-medium text-white mb-1">
                    Create for {spaceName}
                  </h3>
                  <p className="text-[13px] text-white/50 mb-4">
                    Pick a format or describe what you need
                  </p>

                  {/* Format chips */}
                  <div className="flex gap-2 mb-4">
                    {FORMAT_CHIPS.map((chip) => {
                      const Icon = chip.icon;
                      return (
                        <button
                          key={chip.id}
                          onClick={() => handleFormatSelect(chip.id)}
                          className={cn(
                            'flex items-center gap-2 px-4 py-2.5 rounded-full',
                            'border border-white/[0.05]',
                            'text-[13px] font-medium text-white/50',
                            'hover:text-white hover:border-white/10',
                            'transition-colors duration-100'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Prompt input */}
                  <div className="relative">
                    <textarea
                      ref={inputRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
                          e.preventDefault();
                          handlePromptSubmit();
                        }
                      }}
                      placeholder="Describe what you want to create..."
                      rows={2}
                      className={cn(
                        'w-full px-4 py-3 pr-12 rounded-2xl text-[14px]',
                        'bg-white/[0.03] border border-white/[0.05]',
                        'text-white placeholder:text-white/30',
                        'focus:outline-none focus:outline-2 focus:outline-[#FFD700]',
                        'resize-none'
                      )}
                    />
                    {prompt.trim() && (
                      <button
                        onClick={handlePromptSubmit}
                        className={cn(
                          'absolute right-3 bottom-3 p-1.5 rounded-full',
                          'bg-white text-black',
                          'hover:opacity-90 transition-opacity duration-100'
                        )}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── CLASSIFYING ── */}
              {state.phase === 'classifying' && (
                <div className="py-8 text-center">
                  <Loader2 className="w-6 h-6 text-[#FFD700] animate-spin mx-auto mb-2" />
                  <p className="text-[13px] text-white/50">Understanding your request...</p>
                </div>
              )}

              {/* ── SHELL MATCHED: Config editor ── */}
              {state.phase === 'shell-matched' && state.classification && (
                <div>
                  <button
                    onClick={() => { reset(); setTimeout(() => inputRef.current?.focus(), 100); }}
                    className="flex items-center gap-1.5 text-[13px] text-white/50 hover:text-white mb-3 transition-colors duration-100"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[11px] font-medium text-[#FFD700]">
                      {state.classification.format.toUpperCase()}
                    </span>
                    <span className="text-[13px] text-white/50">Ready to configure</span>
                  </div>

                  {/* Shell config editor */}
                  <ShellEditor
                    format={state.classification.format as ShellFormat}
                    config={state.shellConfig}
                    onChange={updateShellConfig}
                  />

                  {/* Deploy button */}
                  <button
                    onClick={acceptShell}
                    className={cn(
                      'w-full mt-4 py-3 rounded-full font-semibold text-[14px]',
                      'bg-white text-black',
                      'hover:bg-white/90 transition-colors duration-100',
                      'active:scale-[0.98]'
                    )}
                  >
                    Drop in chat
                  </button>

                  <button
                    onClick={handleFallbackToBuild}
                    className="w-full mt-2 py-2 text-[13px] text-white/30 hover:text-white/50 transition-colors duration-100"
                  >
                    Open in Build instead
                  </button>
                </div>
              )}

              {/* ── GENERATING (custom) → redirect to /build ── */}
              {state.phase === 'generating' && (
                <div className="py-8 text-center">
                  <Loader2 className="w-6 h-6 text-white/50 animate-spin mx-auto mb-2" />
                  <p className="text-[13px] text-white/50">
                    {state.streamingStatus || 'Generating...'}
                  </p>
                </div>
              )}

              {/* ── COMPLETE ── */}
              {state.phase === 'complete' && (
                <div className="py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#FFD700]/10 flex items-center justify-center mx-auto mb-2">
                    <Check className="w-5 h-5 text-[#FFD700]" />
                  </div>
                  <p className="text-[14px] font-medium text-white">Dropped in chat</p>
                  <p className="text-[12px] text-white/50 mt-1">Your app is live in {spaceName}</p>
                </div>
              )}

              {/* ── ERROR ── */}
              {state.phase === 'error' && (
                <div className="py-8 text-center">
                  <p className="text-[13px] text-white/50 mb-3">{state.error}</p>
                  <button
                    onClick={() => { reset(); setTimeout(() => inputRef.current?.focus(), 100); }}
                    className="px-4 py-2 rounded-full border border-white/[0.05] text-[13px] text-white/50 hover:text-white transition-colors duration-100"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

SparkleCreateSheet.displayName = 'SparkleCreateSheet';
