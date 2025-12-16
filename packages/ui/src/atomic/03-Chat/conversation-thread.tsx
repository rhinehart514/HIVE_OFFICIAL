'use client';

/**
 * ConversationThread - Scrollable message container
 *
 * Features:
 * - Auto-scroll to latest message
 * - Smooth scroll behavior
 * - Empty state support
 * - Virtualization-ready structure
 * - Mobile-optimized
 */

import React, { useEffect, useRef } from 'react';

import { cn } from '../../lib/utils';

export interface ConversationThreadProps {
  /** Messages to display */
  children: React.ReactNode;

  /** Auto-scroll to bottom on new messages */
  autoScroll?: boolean;

  /** Show empty state when no messages */
  emptyState?: React.ReactNode;

  /** Additional CSS classes */
  className?: string;
}

/**
 * ConversationThread Component
 *
 * Container for chat messages with auto-scrolling and smooth UX:
 * - Scrolls to latest message when new content appears
 * - Smooth scroll transitions
 * - Handles empty state gracefully
 * - Optimized for performance
 */
export function ConversationThread({
  children,
  autoScroll = true,
  emptyState,
  className
}: ConversationThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [children, autoScroll]);

  const hasMessages = React.Children.count(children) > 0;

  return (
    <div
      ref={scrollRef}
      className={cn(
        'flex-1 overflow-y-auto overflow-x-hidden',
        'scroll-smooth',
        // Custom scrollbar styling
        '[&::-webkit-scrollbar]:w-2',
        '[&::-webkit-scrollbar-track]:bg-transparent',
        '[&::-webkit-scrollbar-thumb]:bg-white/5',
        '[&::-webkit-scrollbar-thumb]:rounded-full',
        '[&::-webkit-scrollbar-thumb]:hover:bg-white/10',
        className
      )}
    >
      {hasMessages ? (
        <>
          {/* Message list */}
          <div className="min-h-full flex flex-col">
            {children}
          </div>

          {/* Scroll anchor */}
          <div ref={bottomRef} className="h-px" />
        </>
      ) : (
        /* Empty state */
        emptyState || null
      )}
    </div>
  );
}

/**
 * EmptyChatState - Starting state for conversations
 */
export interface EmptyChatStateProps {
  /** Headline */
  title?: string;

  /** Subtitle */
  description?: string;

  /** Example prompts to get started */
  examplePrompts?: Array<{
    label: string;
    prompt: string;
    onClick: (prompt: string) => void;
  }>;

  /** Additional CSS classes */
  className?: string;
}

export function EmptyChatState({
  title = 'Build campus tools with AI',
  description = 'Describe what you need and we\'ll generate it instantly. No code required.',
  examplePrompts = [],
  className
}: EmptyChatStateProps) {
  return (
    <div className={cn(
      'flex-1 flex flex-col items-center justify-center px-6 py-16',
      className
    )}>
      {/* Minimal icon - Gold accent */}
      <div className="mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8962E] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
          <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      {/* Hero text - Clean typography */}
      <div className="max-w-lg text-center space-y-3 mb-10">
        <h2 className="text-2xl font-semibold text-[#FAFAFA] tracking-tight">
          {title}
        </h2>
        <p className="text-[#A1A1A6] text-sm leading-relaxed">
          {description}
        </p>
      </div>

      {/* Example prompts - Refined buttons */}
      {examplePrompts.length > 0 && (
        <div className="w-full max-w-xl space-y-4">
          <p className="text-xs text-[#818187] font-medium text-center">
            Try an example
          </p>
          <div className="grid grid-cols-2 gap-2">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => example.onClick(example.prompt)}
                className={cn(
                  'group relative px-4 py-3 text-left rounded-lg',
                  'border border-[#2A2A2A]',
                  'bg-[#141414] hover:bg-[#1A1A1A]',
                  'transition-all duration-150',
                  'hover:border-[#2A2A2A]',
                  'focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-[#A1A1A6] group-hover:text-[#FAFAFA] transition-colors font-medium">
                    {example.label}
                  </span>
                  <svg className="w-3.5 h-3.5 text-[#818187] group-hover:text-[#FFD700] transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
