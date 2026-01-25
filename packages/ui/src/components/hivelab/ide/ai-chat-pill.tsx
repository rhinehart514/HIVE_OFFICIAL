'use client';

/**
 * AIChatPill — Floating/Dockable AI Chat Interface
 *
 * Per DRAMA plan:
 * - Default: Compact floating pill (bottom-right)
 * - On click: Expands to chat panel
 * - Dockable: Can drag to left side or keep floating
 * - Conversational interface for iterative building
 */

import {
  useState,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SparklesIcon, XMarkIcon, ArrowUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '../../../lib/utils';
import { MOTION } from '../../../tokens/motion';

const EASE = MOTION.ease.premium;

// Colors matching HiveLab dark theme
const COLORS = {
  bg: 'var(--hivelab-panel, #1A1A1A)',
  bgDark: 'var(--hivelab-bg, #0A0A0A)',
  surface: 'var(--hivelab-surface, #141414)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  textPrimary: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  gold: 'var(--life-gold, #D4AF37)',
};

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'status';
  content: string;
  timestamp: number;
}

export interface AIChatPillRef {
  focusInput: () => void;
  expand: () => void;
  collapse: () => void;
  addMessage: (role: 'user' | 'assistant' | 'status', content: string) => void;
  clearMessages: () => void;
}

interface AIChatPillProps {
  onSubmit: (prompt: string, type: 'generate' | 'modify') => Promise<void>;
  isLoading?: boolean;
  streamingStatus?: string;
  selectedCount?: number;
  onCancel?: () => void;
  /** Initial prompt to pre-fill */
  initialPrompt?: string | null;
  /** Dock position: 'float' (bottom-right) or 'left' (docked to left rail) */
  dockPosition?: 'float' | 'left';
  onDockChange?: (position: 'float' | 'left') => void;
}

export const AIChatPill = forwardRef<AIChatPillRef, AIChatPillProps>(
  function AIChatPill(
    {
      onSubmit,
      isLoading = false,
      streamingStatus,
      selectedCount = 0,
      onCancel,
      initialPrompt,
      dockPosition = 'float',
      onDockChange,
    },
    ref
  ) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const shouldReduceMotion = useReducedMotion();

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focusInput: () => {
        setIsExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      },
      expand: () => setIsExpanded(true),
      collapse: () => setIsExpanded(false),
      addMessage: (role, content) => {
        const message: Message = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          role,
          content,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, message]);
      },
      clearMessages: () => {
        setMessages([]);
        setInput('');
      },
    }));

    // Pre-fill input with initial prompt
    useEffect(() => {
      if (initialPrompt) {
        setInput(initialPrompt);
        setIsExpanded(true);
      }
    }, [initialPrompt]);

    // Scroll to bottom on new messages
    useEffect(() => {
      if (isExpanded && messages.length > 0) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, [messages, isExpanded]);

    // Get contextual placeholder
    const getPlaceholder = useCallback(() => {
      if (isLoading) return 'AI is thinking...';
      if (selectedCount === 0) return 'Describe what to build...';
      if (selectedCount === 1) return 'Modify this element...';
      return `Modify ${selectedCount} elements...`;
    }, [isLoading, selectedCount]);

    // Handle submit
    const handleSubmit = useCallback(async () => {
      if (!input.trim() || isLoading) return;

      const userMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: input.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      const actionType = selectedCount > 0 ? 'modify' : 'generate';

      try {
        await onSubmit(input.trim(), actionType);
        // Success message will be added via ref by parent
      } catch {
        // Error handled by parent
      }
    }, [input, isLoading, selectedCount, onSubmit]);

    // Handle key down
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
        if (e.key === 'Escape') {
          if (isLoading && onCancel) {
            onCancel();
          } else if (isExpanded) {
            setIsExpanded(false);
          }
        }
      },
      [handleSubmit, isLoading, onCancel, isExpanded]
    );

    // Toggle dock position
    const toggleDock = useCallback(() => {
      const newPosition = dockPosition === 'float' ? 'left' : 'float';
      onDockChange?.(newPosition);
    }, [dockPosition, onDockChange]);

    const isFloating = dockPosition === 'float';

    return (
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* Collapsed Pill */
          <motion.button
            key="pill"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
              ease: EASE,
            }}
            onClick={() => setIsExpanded(true)}
            className={cn(
              'fixed z-50 flex items-center gap-2 px-4 py-2.5 rounded-full',
              'border shadow-lg backdrop-blur-sm cursor-pointer',
              'transition-colors duration-200',
              'hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
              isFloating ? 'bottom-6 right-6' : 'bottom-6 left-[calc(64px+1.5rem)]'
            )}
            style={{
              backgroundColor: COLORS.bg,
              borderColor: `${COLORS.gold}40`,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <SparklesIcon className="h-4 w-4" style={{ color: COLORS.gold }} />
            <span
              className="text-sm font-medium"
              style={{ color: COLORS.textPrimary }}
            >
              Ask AI
            </span>
            <kbd
              className="px-1.5 py-0.5 text-label-xs rounded"
              style={{ backgroundColor: COLORS.surface, color: COLORS.textTertiary }}
            >
              ⌘K
            </kbd>
          </motion.button>
        ) : (
          /* Expanded Chat Panel */
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
              ease: EASE,
            }}
            className={cn(
              'fixed z-50 flex flex-col rounded-2xl border shadow-2xl overflow-hidden',
              isFloating
                ? 'bottom-6 right-6 w-[380px] max-h-[480px]'
                : 'bottom-6 left-[calc(64px+1.5rem)] w-[340px] max-h-[60vh]'
            )}
            style={{
              backgroundColor: COLORS.bg,
              borderColor: COLORS.border,
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: COLORS.border }}
            >
              <div className="flex items-center gap-2">
                <SparklesIcon
                  className={cn('h-4 w-4', isLoading && 'animate-pulse')}
                  style={{ color: COLORS.gold }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: COLORS.textPrimary }}
                >
                  AI Assistant
                </span>
                {selectedCount > 0 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${COLORS.gold}20`,
                      color: COLORS.gold,
                    }}
                  >
                    {selectedCount} selected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Dock toggle button - only show in float mode */}
                {onDockChange && (
                  <button
                    type="button"
                    onClick={toggleDock}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: COLORS.textTertiary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = COLORS.textPrimary;
                      e.currentTarget.style.backgroundColor = COLORS.surface;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = COLORS.textTertiary;
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    title={isFloating ? 'Dock to left' : 'Float'}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      {isFloating ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                      )}
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: COLORS.textTertiary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = COLORS.textPrimary;
                    e.currentTarget.style.backgroundColor = COLORS.surface;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = COLORS.textTertiary;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title="Collapse"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]"
              style={{ backgroundColor: COLORS.bgDark }}
            >
              {messages.length === 0 && !streamingStatus && (
                <div className="text-center py-8">
                  <SparklesIcon
                    className="h-8 w-8 mx-auto mb-3 opacity-30"
                    style={{ color: COLORS.gold }}
                  />
                  <p
                    className="text-sm mb-1"
                    style={{ color: COLORS.textSecondary }}
                  >
                    Describe what you want to build
                  </p>
                  <p className="text-xs" style={{ color: COLORS.textTertiary }}>
                    AI will create the elements for you
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: MOTION.duration.instant }}
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm',
                      message.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md',
                      message.role === 'status' && 'italic'
                    )}
                    style={{
                      backgroundColor:
                        message.role === 'user' ? COLORS.gold : COLORS.surface,
                      color:
                        message.role === 'user' ? '#000' : COLORS.textPrimary,
                    }}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}

              {/* Streaming status */}
              {streamingStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div
                    className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-bl-md text-sm"
                    style={{
                      backgroundColor: COLORS.surface,
                      color: COLORS.textPrimary,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{
                            backgroundColor: COLORS.gold,
                            animationDelay: '0ms',
                          }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{
                            backgroundColor: COLORS.gold,
                            animationDelay: '150ms',
                          }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{
                            backgroundColor: COLORS.gold,
                            animationDelay: '300ms',
                          }}
                        />
                      </span>
                      <span style={{ color: COLORS.textSecondary }}>
                        {streamingStatus}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="p-3 border-t"
              style={{ borderColor: COLORS.border }}
            >
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ backgroundColor: COLORS.surface }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={getPlaceholder()}
                  disabled={isLoading}
                  autoFocus
                  className="flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed"
                  style={{ color: COLORS.textPrimary }}
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center',
                    'transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
                  )}
                  style={{
                    backgroundColor:
                      input.trim() && !isLoading ? COLORS.gold : COLORS.bg,
                    color:
                      input.trim() && !isLoading
                        ? '#000'
                        : COLORS.textTertiary,
                    cursor:
                      !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isLoading ? (
                    <div
                      className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
                    />
                  ) : (
                    <ArrowUpIcon className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              {isLoading && onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full mt-2 py-1.5 text-xs rounded-lg transition-colors"
                  style={{
                    color: COLORS.textTertiary,
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = COLORS.textPrimary;
                    e.currentTarget.style.backgroundColor = COLORS.surface;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = COLORS.textTertiary;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Cancel generation
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
