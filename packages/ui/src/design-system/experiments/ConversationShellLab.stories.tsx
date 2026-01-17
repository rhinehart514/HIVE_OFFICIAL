'use client';

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { motion } from 'framer-motion';

/**
 * ConversationShell Lab
 * STATUS: IN LAB — Awaiting selection
 *
 * Variables to test:
 * 1. Density — compact / comfortable / spacious
 * 2. Composer Style — fixed bottom / floating / minimal
 * 3. Content Width — narrow (672px) / medium (768px) / wide (896px)
 *
 * Context: Space chat, DMs, notifications, feed
 * Feel: "Intimate conversation. Content is the star."
 */

const meta: Meta = {
  title: 'Experiments/ConversationShell Lab',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// MOCK CONTENT
// ============================================

interface MockMessageProps {
  isOwn?: boolean;
  compact?: boolean;
  showAvatar?: boolean;
}

function MockMessage({ isOwn = false, compact = false, showAvatar = true }: MockMessageProps) {
  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} ${compact ? 'py-1' : 'py-2'}`}>
      {showAvatar && (
        <div className={`w-8 h-8 rounded-xl bg-white/[0.08] flex-shrink-0 ${compact ? 'w-6 h-6' : ''}`} />
      )}
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!compact && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white">
              {isOwn ? 'You' : 'Sarah Chen'}
            </span>
            <span className="text-xs text-neutral-500">2:34 PM</span>
          </div>
        )}
        <div
          className={`
            rounded-2xl px-4 py-2
            ${isOwn ? 'bg-white/[0.08] rounded-br-md' : 'bg-white/[0.04] rounded-bl-md'}
            ${compact ? 'text-sm' : ''}
          `}
        >
          <p className="text-white/90">
            {isOwn
              ? "Yeah, I'll be there! Looking forward to it."
              : 'Hey! Are you coming to the study session tonight?'}
          </p>
        </div>
      </div>
    </div>
  );
}

function MockTypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-500">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#FFD700]"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      <span>Sarah is typing...</span>
    </div>
  );
}

function MockComposer({ style }: { style: 'fixed' | 'floating' | 'minimal' }) {
  if (style === 'minimal') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Message..."
          className="flex-1 bg-transparent text-white placeholder:text-neutral-500 focus:outline-none"
        />
        <button className="text-[#FFD700] font-medium">Send</button>
      </div>
    );
  }

  if (style === 'floating') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl bg-[#141312] border border-white/[0.08] p-3">
          <input
            type="text"
            placeholder="Type a message..."
            className="w-full bg-transparent text-white placeholder:text-neutral-500 focus:outline-none"
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-lg hover:bg-white/[0.04] text-neutral-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <button className="p-1.5 rounded-lg hover:bg-white/[0.04] text-neutral-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            <button className="px-4 py-1.5 rounded-full bg-white/[0.06] border border-[#FFD700]/30 text-[#FFD700] text-sm font-medium">
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  // fixed (default)
  return (
    <div className="flex items-center gap-3">
      <button className="p-2 rounded-lg hover:bg-white/[0.04] text-neutral-400">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <input
        type="text"
        placeholder="Type a message..."
        className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/[0.16]"
      />
      <button className="p-2.5 rounded-xl bg-white/[0.06] border border-[#FFD700]/30 text-[#FFD700]">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  );
}

function MockHeader() {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30" />
        <div>
          <h1 className="text-base font-semibold text-white">CS Study Group</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#FFD700]" />
            <span className="text-xs text-neutral-400">12 online</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-white/[0.04] text-neutral-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        <button className="p-2 rounded-lg hover:bg-white/[0.04] text-neutral-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================
// SHELL VARIANTS
// ============================================

interface ConversationShellVariantProps {
  children: React.ReactNode;
  density?: 'compact' | 'comfortable' | 'spacious';
  composerStyle?: 'fixed' | 'floating' | 'minimal';
  contentWidth?: 'narrow' | 'medium' | 'wide';
}

function ConversationShellVariant({
  children,
  density = 'comfortable',
  composerStyle = 'fixed',
  contentWidth = 'medium',
}: ConversationShellVariantProps) {
  const widthClasses = {
    narrow: 'max-w-2xl',   // 672px
    medium: 'max-w-3xl',   // 768px
    wide: 'max-w-4xl',     // 896px
  };

  const paddingClasses = {
    compact: 'px-3 py-2',
    comfortable: 'px-4 py-4',
    spacious: 'px-6 py-6',
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A09]">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-white/[0.06] backdrop-blur-xl bg-[#0A0A09]/80">
        <MockHeader />
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className={`mx-auto h-full ${widthClasses[contentWidth]} ${paddingClasses[density]}`}>
          {children}
        </div>
      </main>

      {/* Typing indicator */}
      <div className={`mx-auto w-full ${widthClasses[contentWidth]} px-4 py-2`}>
        <MockTypingIndicator />
      </div>

      {/* Composer */}
      <div
        className={`
          flex-shrink-0
          ${composerStyle === 'floating' ? 'py-4 px-4' : 'border-t border-white/[0.06] backdrop-blur-xl bg-[#0A0A09]/80'}
        `}
      >
        <div className={`mx-auto ${widthClasses[contentWidth]} ${composerStyle !== 'floating' ? 'px-4 py-3' : ''}`}>
          <MockComposer style={composerStyle} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// VARIABLE 1: Message Density
// ============================================

/**
 * 3 options for message density.
 * How tight should the conversation feel?
 *
 * A: Compact — Tight spacing, smaller avatars, inline timestamps
 * B: Comfortable — Standard spacing, clear hierarchy
 * C: Spacious — Generous padding, breathing room
 */
export const Variable1_MessageDensity: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8 bg-[#0A0A09]">
      <div className="text-sm text-neutral-500 mb-4">
        Compare message density. Which feels right for HIVE chat?
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            A: Compact (tight)
          </span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <ConversationShellVariant density="compact">
              <div className="space-y-1">
                <MockMessage compact showAvatar={false} />
                <MockMessage isOwn compact showAvatar={false} />
                <MockMessage compact showAvatar={false} />
                <MockMessage isOwn compact showAvatar={false} />
                <MockMessage compact showAvatar={false} />
              </div>
            </ConversationShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            B: Comfortable (standard)
          </span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <ConversationShellVariant density="comfortable">
              <div className="space-y-2">
                <MockMessage />
                <MockMessage isOwn />
                <MockMessage />
                <MockMessage isOwn />
              </div>
            </ConversationShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            C: Spacious (roomy)
          </span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <ConversationShellVariant density="spacious">
              <div className="space-y-4">
                <MockMessage />
                <MockMessage isOwn />
                <MockMessage />
              </div>
            </ConversationShellVariant>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 2: Composer Style
// ============================================

/**
 * 3 options for message composer.
 * How should the input area feel?
 *
 * A: Fixed — Anchored to bottom, full-width input
 * B: Floating — Card-style composer with rounded edges
 * C: Minimal — Just text and send, no container
 */
export const Variable2_ComposerStyle: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8 bg-[#0A0A09]">
      <div className="text-sm text-neutral-500 mb-4">
        Compare composer styles. Which invites conversation?
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            A: Fixed (anchored)
          </span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <ConversationShellVariant composerStyle="fixed">
              <div className="space-y-2">
                <MockMessage />
                <MockMessage isOwn />
                <MockMessage />
              </div>
            </ConversationShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            B: Floating (card-style)
          </span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <ConversationShellVariant composerStyle="floating">
              <div className="space-y-2">
                <MockMessage />
                <MockMessage isOwn />
                <MockMessage />
              </div>
            </ConversationShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            C: Minimal (text only)
          </span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <ConversationShellVariant composerStyle="minimal">
              <div className="space-y-2">
                <MockMessage />
                <MockMessage isOwn />
                <MockMessage />
              </div>
            </ConversationShellVariant>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 3: Content Width
// ============================================

/**
 * 3 options for conversation width.
 * How wide should the message column be?
 *
 * A: Narrow (672px) — Focused, intimate
 * B: Medium (768px) — Balanced, standard
 * C: Wide (896px) — More space for long messages
 */
export const Variable3_ContentWidth: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8 bg-[#0A0A09]">
      <div className="text-sm text-neutral-500 mb-4">
        Compare content widths. Narrow focus or wide canvas?
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            A: Narrow (672px)
          </span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <ConversationShellVariant contentWidth="narrow">
              <div className="space-y-2">
                <MockMessage />
                <MockMessage isOwn />
                <MockMessage />
              </div>
            </ConversationShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            B: Medium (768px)
          </span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <ConversationShellVariant contentWidth="medium">
              <div className="space-y-2">
                <MockMessage />
                <MockMessage isOwn />
                <MockMessage />
              </div>
            </ConversationShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">
            C: Wide (896px)
          </span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <ConversationShellVariant contentWidth="wide">
              <div className="space-y-2">
                <MockMessage />
                <MockMessage isOwn />
                <MockMessage />
              </div>
            </ConversationShellVariant>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// FULL SCREEN PREVIEW
// ============================================

export const FullScreenPreview: Story = {
  render: () => (
    <ConversationShellVariant density="comfortable" composerStyle="fixed" contentWidth="medium">
      <div className="space-y-2 pt-4">
        <MockMessage />
        <MockMessage isOwn />
        <MockMessage />
        <MockMessage isOwn />
        <MockMessage />
        <MockMessage isOwn />
      </div>
    </ConversationShellVariant>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};
