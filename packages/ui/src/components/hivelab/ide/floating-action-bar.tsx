'use client';

import { useState, useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowsPointingOutIcon, MinusIcon, PlusIcon, Squares2X2Icon, ArrowUturnLeftIcon, ArrowUturnRightIcon, SparklesIcon, ArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { PlayIcon as PlayIconSolid } from '@heroicons/react/24/solid';

const ZoomOut = MinusIcon;
const ZoomIn = PlusIcon;
const Grid3X3 = Squares2X2Icon;
import { cn } from '../../../lib/utils';

// HiveLab Dark Toolbar Colors
const TOOLBAR_COLORS = {
  bg: 'var(--hivelab-panel, #1A1A1A)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  textPrimary: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  runButton: 'var(--life-gold, #D4AF37)',
  runButtonHover: 'var(--life-gold, #D4AF37)',
  activeButton: 'var(--hivelab-surface, #141414)',
};

// Workshop tokens
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-panel)]';
const workshopTransition = { type: 'spring' as const, stiffness: 400, damping: 25 };

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
    if (selectedCount === 0) return 'Create a tool that...';
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
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                backgroundColor: TOOLBAR_COLORS.bg,
                borderColor: TOOLBAR_COLORS.border,
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-2 border-b"
                style={{ borderColor: TOOLBAR_COLORS.border }}
              >
                <span className="text-xs font-medium" style={{ color: TOOLBAR_COLORS.textTertiary }}>
                  AI Conversation
                </span>
                <button
                  type="button"
                  onClick={handleClear}
                  className={cn(
                    'p-1 rounded-md transition-colors',
                    focusRing
                  )}
                  style={{ color: TOOLBAR_COLORS.textTertiary }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = TOOLBAR_COLORS.textPrimary; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = TOOLBAR_COLORS.textTertiary; }}
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
                          ? 'rounded-br-md'
                          : 'rounded-bl-md'
                      )}
                      style={{
                        backgroundColor: message.role === 'user' ? TOOLBAR_COLORS.runButton : TOOLBAR_COLORS.activeButton,
                        color: message.role === 'user' ? '#000' : TOOLBAR_COLORS.textPrimary,
                      }}
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
                    <div
                      className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-bl-md text-sm"
                      style={{ backgroundColor: TOOLBAR_COLORS.activeButton, color: TOOLBAR_COLORS.textPrimary }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: TOOLBAR_COLORS.runButton, animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: TOOLBAR_COLORS.runButton, animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: TOOLBAR_COLORS.runButton, animationDelay: '300ms' }} />
                        </span>
                        <span style={{ color: TOOLBAR_COLORS.textSecondary }}>{aiStreamingText}</span>
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
        transition={workshopTransition}
        className="flex items-center gap-2 px-2 py-1.5 rounded-2xl shadow-lg"
        style={{
          backgroundColor: TOOLBAR_COLORS.bg,
          border: `1px solid ${TOOLBAR_COLORS.border}`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        {/* AI Input Section */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl min-w-[280px]" style={{ backgroundColor: TOOLBAR_COLORS.activeButton }}>
          <SparklesIcon
            className={cn('h-4 w-4 flex-shrink-0', aiLoading && 'animate-pulse')}
            style={{ color: TOOLBAR_COLORS.runButton }}
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
            className="flex-1 bg-transparent text-sm outline-none min-w-[180px] disabled:cursor-not-allowed"
            style={{
              color: TOOLBAR_COLORS.textPrimary,
            }}
          />
          <kbd
            className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded"
            style={{ backgroundColor: TOOLBAR_COLORS.bg, color: TOOLBAR_COLORS.textTertiary }}
          >
            ⌘K
          </kbd>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() || aiLoading}
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200',
              focusRing
            )}
            style={{
              backgroundColor: input.trim() && !aiLoading ? TOOLBAR_COLORS.runButton : TOOLBAR_COLORS.bg,
              color: input.trim() && !aiLoading ? '#000' : TOOLBAR_COLORS.textTertiary,
              cursor: !input.trim() || aiLoading ? 'not-allowed' : 'pointer',
            }}
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
        <div className="w-px h-8" style={{ backgroundColor: TOOLBAR_COLORS.border }} />

        {/* Run Button */}
        <button
          type="button"
          onClick={onRun}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl',
            'text-black font-semibold text-sm',
            'transition-all duration-200',
            'hover:opacity-90 hover:shadow-[0_0_16px_rgba(212,175,55,0.4)] active:opacity-80',
            focusRing
          )}
          style={{ backgroundColor: TOOLBAR_COLORS.runButton }}
          title="Run once"
        >
          <PlayIconSolid className="h-4 w-4" />
          <span className="hidden sm:inline">Run once</span>
        </button>

        {/* Divider */}
        <div className="w-px h-8" style={{ backgroundColor: TOOLBAR_COLORS.border }} />

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={cn('p-2 rounded-lg transition-colors duration-200', focusRing)}
          style={{
            color: canUndo ? TOOLBAR_COLORS.textSecondary : TOOLBAR_COLORS.textTertiary,
            opacity: canUndo ? 1 : 0.5,
          }}
          title="Undo (⌘Z)"
        >
          <ArrowUturnLeftIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={cn('p-2 rounded-lg transition-colors duration-200', focusRing)}
          style={{
            color: canRedo ? TOOLBAR_COLORS.textSecondary : TOOLBAR_COLORS.textTertiary,
            opacity: canRedo ? 1 : 0.5,
          }}
          title="Redo (⌘⇧Z)"
        >
          <ArrowUturnRightIcon className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-8" style={{ backgroundColor: TOOLBAR_COLORS.border }} />

        {/* Grid Toggle */}
        <button
          type="button"
          onClick={onToggleGrid}
          className={cn('p-2 rounded-lg transition-colors duration-200', focusRing)}
          style={{
            color: showGrid ? TOOLBAR_COLORS.textPrimary : TOOLBAR_COLORS.textSecondary,
            backgroundColor: showGrid ? TOOLBAR_COLORS.activeButton : 'transparent',
          }}
          title={`Grid: ${showGrid ? 'On' : 'Off'} (⌘G)`}
        >
          <Grid3X3 className="h-4 w-4" />
        </button>

        {/* Snap Toggle */}
        <button
          type="button"
          onClick={onToggleSnap}
          className={cn('px-2 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200', focusRing)}
          style={{
            color: snapToGrid ? TOOLBAR_COLORS.textPrimary : TOOLBAR_COLORS.textTertiary,
            backgroundColor: snapToGrid ? TOOLBAR_COLORS.activeButton : 'transparent',
          }}
          title={`Snap to Grid: ${snapToGrid ? 'On' : 'Off'}`}
        >
          Snap
        </button>

        {/* Fit to Screen */}
        <button
          type="button"
          onClick={onFitToScreen}
          className={cn('p-2 rounded-lg transition-colors duration-200', focusRing)}
          style={{ color: TOOLBAR_COLORS.textSecondary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = TOOLBAR_COLORS.textPrimary;
            e.currentTarget.style.backgroundColor = TOOLBAR_COLORS.activeButton;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = TOOLBAR_COLORS.textSecondary;
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Fit to Screen"
        >
          <ArrowsPointingOutIcon className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-8" style={{ backgroundColor: TOOLBAR_COLORS.border }} />

        {/* Zoom Controls */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(0.25, zoom - 0.1))}
            className={cn('p-2 rounded-lg transition-colors duration-200', focusRing)}
            style={{ color: TOOLBAR_COLORS.textSecondary }}
            onMouseEnter={(e) => { e.currentTarget.style.color = TOOLBAR_COLORS.textPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = TOOLBAR_COLORS.textSecondary; }}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onZoomChange(1)}
            className={cn('px-2 py-1.5 min-w-[52px] text-center text-sm rounded-lg transition-colors duration-200', focusRing)}
            style={{ color: TOOLBAR_COLORS.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = TOOLBAR_COLORS.textPrimary;
              e.currentTarget.style.backgroundColor = TOOLBAR_COLORS.activeButton;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = TOOLBAR_COLORS.textSecondary;
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Reset to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            type="button"
            onClick={() => onZoomChange(Math.min(3, zoom + 0.1))}
            className={cn('p-2 rounded-lg transition-colors duration-200', focusRing)}
            style={{ color: TOOLBAR_COLORS.textSecondary }}
            onMouseEnter={(e) => { e.currentTarget.style.color = TOOLBAR_COLORS.textPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = TOOLBAR_COLORS.textSecondary; }}
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
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border"
            style={{
              backgroundColor: TOOLBAR_COLORS.activeButton,
              borderColor: TOOLBAR_COLORS.border,
              color: TOOLBAR_COLORS.textSecondary,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TOOLBAR_COLORS.runButton }} />
            {selectedCount} element{selectedCount > 1 ? 's' : ''} selected
          </span>
        </motion.div>
      )}
    </div>
  );
});
