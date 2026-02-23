'use client';

import { useState, useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowsPointingOutIcon, MinusIcon, PlusIcon, Squares2X2Icon, ArrowUturnLeftIcon, ArrowUturnRightIcon, SparklesIcon, ArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { PlayIcon as PlayIconSolid } from '@heroicons/react/24/solid';

const ZoomOut = MinusIcon;
const ZoomIn = PlusIcon;
const Grid3X3 = Squares2X2Icon;
import { cn } from '../../../lib/utils';
import { FOCUS_RING, WORKSHOP_TRANSITION } from '../tokens';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface FloatingActionBarRef {
  focusInput: () => void;
  clearMessages: () => void;
}

interface FloatingActionBarProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onFitToScreen: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  onRun?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  // AI props
  onAISubmit: (prompt: string, type: string) => Promise<void>;
  aiLoading?: boolean;
  aiStreamingText?: string;
  selectedCount?: number;
  onAICancel?: () => void;
  /** Initial prompt to pre-fill the AI input */
  initialPrompt?: string | null;
}

export const FloatingActionBar = forwardRef<FloatingActionBarRef, FloatingActionBarProps>(function FloatingActionBar({
  zoom,
  onZoomChange,
  showGrid,
  onToggleGrid,
  onFitToScreen,
  snapToGrid,
  onToggleSnap,
  onRun,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  // AI props
  onAISubmit,
  aiLoading = false,
  aiStreamingText,
  selectedCount = 0,
  onAICancel,
  initialPrompt,
}, ref) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showConversation, setShowConversation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    focusInput: () => inputRef.current?.focus(),
    clearMessages: () => {
      setMessages([]);
      setInput('');
      setShowConversation(false);
    },
  }));

  // Pre-fill input with initial prompt
  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
    }
  }, [initialPrompt]);

  // Get contextual placeholder
  const getPlaceholder = useCallback(() => {
    if (aiLoading) return 'AI is thinking...';
    if (selectedCount === 0) return 'Describe what you want...';
    if (selectedCount === 1) return 'Modify this element...';
    return `Modify ${selectedCount} elements...`;
  }, [aiLoading, selectedCount]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!input.trim() || aiLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setShowConversation(true);
    setInput('');

    const actionType = selectedCount > 0 ? 'modify' : 'generate';

    try {
      await onAISubmit(input.trim(), actionType);
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: 'Done! Elements have been added to the canvas.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      // Error handling done by parent
    }
  }, [input, aiLoading, selectedCount, onAISubmit]);

  // Handle key down
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') {
        if (aiLoading && onAICancel) {
          onAICancel();
        } else if (messages.length > 0) {
          setMessages([]);
          setShowConversation(false);
        } else {
          inputRef.current?.blur();
        }
      }
    },
    [handleSubmit, aiLoading, onAICancel, messages.length]
  );

  // Clear conversation
  const handleClear = useCallback(() => {
    setMessages([]);
    setShowConversation(false);
    inputRef.current?.focus();
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3">
      {/* Conversation Panel (expands up) */}
      <AnimatePresence>
        {showConversation && (messages.length > 0 || aiStreamingText) && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-h-[40vh] overflow-hidden"
          >
            <div className="rounded-2xl border overflow-hidden bg-[var(--hivelab-panel)] border-[var(--hivelab-border)]">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--hivelab-border)]">
                <span className="text-xs font-medium text-[var(--hivelab-text-tertiary)]">
                  AI Conversation
                </span>
                <button
                  type="button"
                  onClick={handleClear}
                  className={cn(
                    'p-1 rounded-md transition-colors text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)]',
                    FOCUS_RING
                  )}
                  title="Clear conversation"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="max-h-[30vh] overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] px-4 py-2.5 rounded-2xl text-sm',
                        message.role === 'user'
                          ? 'rounded-br-md bg-[var(--life-gold)] text-black'
                          : 'rounded-bl-md bg-[var(--hivelab-surface)] text-[var(--hivelab-text-primary)]'
                      )}
                    >
                      {message.content}
                    </div>
                  </motion.div>
                ))}

                {/* Streaming response */}
                {aiStreamingText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-bl-md text-sm bg-[var(--hivelab-surface)] text-[var(--hivelab-text-primary)]">
                      <div className="flex items-center gap-2">
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full animate-bounce bg-[var(--life-gold)]" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full animate-bounce bg-[var(--life-gold)]" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full animate-bounce bg-[var(--life-gold)]" style={{ animationDelay: '300ms' }} />
                        </span>
                        <span className="text-[var(--hivelab-text-secondary)]">{aiStreamingText}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unified Bottom Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={WORKSHOP_TRANSITION}
        className="flex items-center gap-2 px-2 py-1.5 rounded-2xl shadow-lg bg-[var(--hivelab-panel)] border border-[var(--hivelab-border)]"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
      >
        {/* AI Input Section */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl min-w-[280px] bg-[var(--hivelab-surface)]">
          <SparklesIcon
            className={cn('h-4 w-4 flex-shrink-0 text-[var(--life-gold)]', aiLoading && 'animate-pulse')}
          />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => messages.length > 0 && setShowConversation(true)}
            placeholder={getPlaceholder()}
            disabled={aiLoading}
            className="flex-1 bg-transparent text-sm outline-none min-w-[180px] disabled:cursor-not-allowed text-[var(--hivelab-text-primary)] placeholder:text-[var(--hivelab-text-tertiary)]"
          />
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-label-xs rounded bg-[var(--hivelab-panel)] text-[var(--hivelab-text-tertiary)]">
            ⌘K
          </kbd>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() || aiLoading}
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200',
              input.trim() && !aiLoading
                ? 'bg-[var(--life-gold)] text-black cursor-pointer'
                : 'bg-[var(--hivelab-panel)] text-[var(--hivelab-text-tertiary)] cursor-not-allowed',
              FOCUS_RING
            )}
            title="Send"
          >
            {aiLoading ? (
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowUpIcon className="h-3 w-3" />
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-[var(--hivelab-border)]" />

        {/* Run Button */}
        <button
          type="button"
          onClick={onRun}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl',
            'bg-[var(--life-gold)] text-black font-semibold text-sm',
            'transition-all duration-200',
            'hover:brightness-110 active:brightness-90',
            FOCUS_RING
          )}
          title="Run once"
        >
          <PlayIconSolid className="h-4 w-4" />
          <span className="hidden sm:inline">Run once</span>
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-[var(--hivelab-border)]" />

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={cn(
            'p-2 rounded-lg transition-colors duration-200',
            canUndo
              ? 'text-[var(--hivelab-text-secondary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)]'
              : 'text-[var(--hivelab-text-tertiary)] opacity-50',
            FOCUS_RING
          )}
          title="Undo (⌘Z)"
        >
          <ArrowUturnLeftIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={cn(
            'p-2 rounded-lg transition-colors duration-200',
            canRedo
              ? 'text-[var(--hivelab-text-secondary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)]'
              : 'text-[var(--hivelab-text-tertiary)] opacity-50',
            FOCUS_RING
          )}
          title="Redo (⌘⇧Z)"
        >
          <ArrowUturnRightIcon className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-[var(--hivelab-border)]" />

        {/* Grid Toggle */}
        <button
          type="button"
          onClick={onToggleGrid}
          className={cn(
            'p-2 rounded-lg transition-colors duration-200',
            showGrid
              ? 'text-[var(--hivelab-text-primary)] bg-[var(--hivelab-surface)]'
              : 'text-[var(--hivelab-text-secondary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)]',
            FOCUS_RING
          )}
          title={`Grid: ${showGrid ? 'On' : 'Off'} (⌘G)`}
        >
          <Grid3X3 className="h-4 w-4" />
        </button>

        {/* Snap Toggle */}
        <button
          type="button"
          onClick={onToggleSnap}
          className={cn(
            'px-2 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200',
            snapToGrid
              ? 'text-[var(--hivelab-text-primary)] bg-[var(--hivelab-surface)]'
              : 'text-[var(--hivelab-text-tertiary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)]',
            FOCUS_RING
          )}
          title={`Snap to Grid: ${snapToGrid ? 'On' : 'Off'}`}
        >
          Snap
        </button>

        {/* Fit to Screen */}
        <button
          type="button"
          onClick={onFitToScreen}
          className={cn(
            'p-2 rounded-lg transition-colors duration-200',
            'text-[var(--hivelab-text-secondary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)]',
            FOCUS_RING
          )}
          title="Fit to Screen"
        >
          <ArrowsPointingOutIcon className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-[var(--hivelab-border)]" />

        {/* Zoom Controls */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(0.25, zoom - 0.1))}
            className={cn(
              'p-2 rounded-lg transition-colors duration-200',
              'text-[var(--hivelab-text-secondary)] hover:text-[var(--hivelab-text-primary)]',
              FOCUS_RING
            )}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onZoomChange(1)}
            className={cn(
              'px-2 py-1.5 min-w-[52px] text-center text-sm rounded-lg transition-colors duration-200',
              'text-[var(--hivelab-text-secondary)] hover:text-[var(--hivelab-text-primary)] hover:bg-[var(--hivelab-surface)]',
              FOCUS_RING
            )}
            title="Reset to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            type="button"
            onClick={() => onZoomChange(Math.min(3, zoom + 0.1))}
            className={cn(
              'p-2 rounded-lg transition-colors duration-200',
              'text-[var(--hivelab-text-secondary)] hover:text-[var(--hivelab-text-primary)]',
              FOCUS_RING
            )}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Selection indicator */}
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full"
        >
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border bg-[var(--hivelab-surface)] border-[var(--hivelab-border)] text-[var(--hivelab-text-secondary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--life-gold)]" />
            {selectedCount} element{selectedCount > 1 ? 's' : ''} selected
          </span>
        </motion.div>
      )}
    </div>
  );
});
