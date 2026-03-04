'use client';

/**
 * SparkleCreateSheet — In-space creation bottom sheet
 *
 * Two states:
 * - Quick Create (~40% screen): prompt + format chips (Poll / Bracket / RSVP)
 * - Custom Create (~80% screen): code gen preview + iterate
 *
 * "Drop in chat" deploys the creation as a card in the stream.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, Send, BarChart3, Trophy, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOTION } from '@hive/tokens';

type SheetMode = 'quick' | 'custom';
type FormatChip = 'poll' | 'bracket' | 'rsvp';

interface SparkleCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  spaceName: string;
  /** Called when user selects a format chip — prefills chat input */
  onFormatSelect: (format: FormatChip) => void;
  /** Called when user wants AI custom create */
  onCustomCreate?: (prompt: string) => void;
}

const FORMAT_CHIPS: Array<{ id: FormatChip; label: string; icon: React.ComponentType<{ className?: string }>; slash: string }> = [
  { id: 'poll', label: 'Poll', icon: BarChart3, slash: '/poll ' },
  { id: 'bracket', label: 'Bracket', icon: Trophy, slash: '/bracket ' },
  { id: 'rsvp', label: 'RSVP', icon: CalendarCheck, slash: '/rsvp ' },
];

export function SparkleCreateSheet({
  open,
  onOpenChange,
  spaceId,
  spaceName,
  onFormatSelect,
  onCustomCreate,
}: SparkleCreateSheetProps) {
  const router = useRouter();
  const [mode, setMode] = React.useState<SheetMode>('quick');
  const [prompt, setPrompt] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setMode('quick');
      setPrompt('');
      setIsGenerating(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const handleFormatSelect = (format: FormatChip) => {
    onFormatSelect(format);
    onOpenChange(false);
  };

  const handleCustomSubmit = async () => {
    if (!prompt.trim()) return;
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
            transition={{ duration: 0.15 }}
            onClick={() => onOpenChange(false)}
          />

          {/* Sheet */}
          <motion.div
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-[var(--bg-ground)] border-t border-white/[0.08] rounded-t-2xl',
              'overflow-y-auto'
            )}
            style={{ maxHeight: mode === 'quick' ? '45vh' : '80vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-1 rounded-full bg-white/[0.12]" />
            </div>

            <div className="px-4 pb-8">
              <AnimatePresence mode="wait">
                {mode === 'quick' ? (
                  <motion.div
                    key="quick"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Title */}
                    <h3 className="text-[15px] font-medium text-white mb-1">
                      Create something for {spaceName}
                    </h3>
                    <p className="text-[13px] text-white/40 mb-4">
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
                              'flex items-center gap-2 px-4 py-2.5 rounded-xl',
                              'border border-white/[0.08] bg-white/[0.02]',
                              'text-[13px] font-medium text-white/60',
                              'hover:bg-white/[0.06] hover:text-white hover:border-white/[0.12]',
                              'transition-colors'
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
                            setMode('custom');
                            handleCustomSubmit();
                          }
                        }}
                        placeholder="Describe what you want to create..."
                        rows={2}
                        className={cn(
                          'w-full px-4 py-3 pr-12 rounded-xl text-[14px]',
                          'bg-white/[0.03] border border-white/[0.06]',
                          'text-white placeholder:text-white/30',
                          'focus:outline-none focus:ring-1 focus:ring-white/20',
                          'resize-none'
                        )}
                      />
                      {prompt.trim() && (
                        <button
                          onClick={() => {
                            setMode('custom');
                            handleCustomSubmit();
                          }}
                          className={cn(
                            'absolute right-3 bottom-3 p-1.5 rounded-lg',
                            'bg-[var(--color-gold)] text-black',
                            'hover:opacity-90 transition-opacity'
                          )}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="custom"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: MOTION.ease.premium }}
                  >
                    {/* Back button */}
                    <button
                      onClick={() => {
                        setMode('quick');
                        setIsGenerating(false);
                      }}
                      className="flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 mb-3 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>

                    <h3 className="text-[15px] font-medium text-white mb-2">
                      Custom Create
                    </h3>

                    {/* Prompt display */}
                    <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] mb-4">
                      <p className="text-[13px] text-white/50">{prompt}</p>
                    </div>

                    {isGenerating ? (
                      <div className="py-8 text-center">
                        <Loader2 className="w-6 h-6 text-white/40 animate-spin mx-auto mb-2" />
                        <p className="text-[13px] text-white/40">
                          Generating...
                        </p>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-[13px] text-white/40">
                          AI creation will appear here
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

SparkleCreateSheet.displayName = 'SparkleCreateSheet';
