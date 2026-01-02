'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { easingArrays } from '@hive/tokens';

/**
 * ConversationShell - The Conversation Experience
 *
 * ChatGPT/Claude-inspired centered conversation layout
 * For: Space chat, feed, notifications, direct messages
 * Feel: Intimate conversation, content is the star
 *
 * Design Principles:
 * - Single centered column (max-w-3xl = 768px)
 * - No persistent sidebar - context via sheets/command palette
 * - Composer anchored at bottom
 * - Header with presence indicators
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────────┐
 * │                      HEADER                                 │
 * ├─────────────────────────────────────────────────────────────┤
 * │                                                             │
 * │              ┌─────────────────────────┐                    │
 * │              │                         │                    │
 * │              │    CONVERSATION         │                    │
 * │              │       max-w-3xl         │                    │
 * │              │       centered          │                    │
 * │              │                         │                    │
 * │              └─────────────────────────┘                    │
 * │                                                             │
 * ├─────────────────────────────────────────────────────────────┤
 * │              [    COMPOSER     ]                            │
 * └─────────────────────────────────────────────────────────────┘
 *
 * @author HIVE Frontend Team
 * @version 1.0.0 - Phase 2 Layout Consolidation
 */

interface ConversationShellProps {
  children: React.ReactNode;
  /** Header content (space name, presence, actions) */
  header?: React.ReactNode;
  /** Composer/input area at bottom */
  composer?: React.ReactNode;
  /** Secondary header (tabs, filters) */
  subheader?: React.ReactNode;
  /** Status bar above composer (typing indicator) */
  statusBar?: React.ReactNode;
  /** Maximum content width */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  /** Enable content centering */
  centerContent?: boolean;
  /** Padding for content area */
  contentPadding?: 'none' | 'sm' | 'md' | 'lg';
  /** Background color variant */
  background?: 'black' | 'dark' | 'subtle';
  /** Additional className for root */
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',      // 384px
  md: 'max-w-md',      // 448px
  lg: 'max-w-lg',      // 512px
  xl: 'max-w-xl',      // 576px
  '2xl': 'max-w-2xl',  // 672px
  '3xl': 'max-w-3xl',  // 768px - default for conversations
};

const contentPaddingClasses = {
  none: '',
  sm: 'px-3 py-2',
  md: 'px-4 py-4',
  lg: 'px-6 py-6',
};

const backgroundClasses = {
  black: 'bg-black',
  dark: 'bg-[#0A0A0A]',
  subtle: 'bg-[#0D0D0D]',
};

// Smooth entrance animation
const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: easingArrays.default,
    },
  },
};

export function ConversationShell({
  children,
  header,
  composer,
  subheader,
  statusBar,
  maxWidth = '3xl',
  centerContent = true,
  contentPadding = 'md',
  background = 'dark',
  className,
}: ConversationShellProps) {
  return (
    <div className={`
      flex flex-col h-full
      ${backgroundClasses[background]}
      ${className || ''}
    `}>
      {/* Header - sticky at top */}
      {header && (
        <header className="
          flex-shrink-0
          border-b border-white/[0.06]
          backdrop-blur-xl
          bg-[#0A0A0A]/80
        ">
          {header}
        </header>
      )}

      {/* Subheader (tabs, filters) */}
      {subheader && (
        <div className="flex-shrink-0 border-b border-white/[0.06]">
          {subheader}
        </div>
      )}

      {/* Main conversation area - centered */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={contentVariants}
          className={`
            h-full
            ${centerContent ? 'mx-auto' : ''}
            ${maxWidthClasses[maxWidth]}
            ${contentPaddingClasses[contentPadding]}
          `}
        >
          {children}
        </motion.div>
      </main>

      {/* Status bar (typing indicators, etc) */}
      <AnimatePresence>
        {statusBar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-shrink-0"
          >
            <div className={`
              mx-auto
              ${maxWidthClasses[maxWidth]}
              ${contentPaddingClasses[contentPadding]}
              py-2
            `}>
              {statusBar}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer - anchored at bottom */}
      {composer && (
        <div className="
          flex-shrink-0
          border-t border-white/[0.06]
          backdrop-blur-xl
          bg-[#0A0A0A]/80
        ">
          <div className={`
            mx-auto
            ${maxWidthClasses[maxWidth]}
            ${contentPaddingClasses[contentPadding]}
          `}>
            {composer}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConversationShell;
