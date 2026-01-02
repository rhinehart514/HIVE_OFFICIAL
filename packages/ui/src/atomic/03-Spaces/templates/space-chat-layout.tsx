'use client';

/**
 * SpaceChatLayout - Complete dark-first Space layout
 *
 * Design Direction:
 * - No persistent sidebar - uses Dock + Command palette + Context panels
 * - Featured Tool Slot above conversation
 * - Hero Input at bottom with action buttons
 * - Board tabs for channels
 * - Presence-aware header
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ ← UB Design Club                               ◉◉◉ 23   ⌘K │
 * ├─────────────────────────────────────────────────────────────┤
 * │ [● General]  [Events]  [Resources]  [+]                     │
 * ├─────────────────────────────────────────────────────────────┤
 * │   ┌───────────────────────────────────────────────────────┐ │
 * │   │  📊 QUICK POLL: Where should we meet?    [12 votes]   │ │ ← featured tool
 * │   └───────────────────────────────────────────────────────┘ │
 * │                                                             │
 * │   Messages...                                               │
 * │                                                             │
 * │         ╭─────────────────────────────────────────────╮     │
 * │         │   Message #general...                   ↵   │     │ ← hero input
 * │         ╰─────────────────────────────────────────────╯     │
 * │   ◉ Sarah typing...                 📎  /  @   ⚡  👥  📅   │
 * ├─────────────────────────────────────────────────────────────┤
 * │        ◉ Design   ○ Photo   ○ CS101   │  +  │  ⌘K          │ ← dock
 * └─────────────────────────────────────────────────────────────┘
 *
 * @author HIVE Frontend Team
 * @version 2.0.0 - Dark-first design
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Settings, MoreHorizontal } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../../lib/utils';
import { PresenceDot } from '../../../identity/presence';
import { Avatar, AvatarFallback, AvatarImage } from '../../00-Global/atoms/avatar';
import { BoardTabBar, type BoardData } from '../molecules/board-tab-bar';
import { FeaturedToolSlot, FeaturedToolEmpty } from '../molecules/featured-tool-slot';
import { HeroInput, type HeroInputHandle } from '../molecules/space-chat-input';

// ============================================================
// Types
// ============================================================

export interface SpaceChatLayoutProps {
  /** Space info */
  space: {
    id: string;
    name: string;
    category?: string;
    memberCount?: number;
  };
  /** Online members (show avatars stacked) */
  onlineMembers?: Array<{
    id: string;
    name: string;
    avatarUrl?: string;
  }>;
  /** Board/channel list */
  boards: BoardData[];
  /** Active board ID */
  activeBoardId: string;
  /** Featured tool data (if any) */
  featuredTool?: {
    id: string;
    name: string;
    icon?: React.ReactNode;
    interactionCount?: number;
    interactionLabel?: string;
    content: React.ReactNode;
  };
  /** Typing users */
  typingUsers?: Array<{
    id: string;
    name: string;
  }>;
  /** Whether user can add featured tool */
  canManageTool?: boolean;
  /** Whether user is a leader */
  isLeader?: boolean;

  // Callbacks
  onBack?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenSettings?: () => void;
  onBoardChange?: (boardId: string) => void;
  onCreateBoard?: () => void;
  onSendMessage?: (content: string) => void;
  onOpenTools?: () => void;
  onOpenMembers?: () => void;
  onOpenEvents?: () => void;
  onAddFeaturedTool?: () => void;
  onRemoveFeaturedTool?: () => void;

  /** Message content area */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function SpaceChatLayout({
  space,
  onlineMembers = [],
  boards,
  activeBoardId,
  featuredTool,
  typingUsers = [],
  canManageTool,
  isLeader,
  onBack,
  onOpenCommandPalette,
  onOpenSettings,
  onBoardChange,
  onCreateBoard,
  onSendMessage,
  onOpenTools,
  onOpenMembers,
  onOpenEvents,
  onAddFeaturedTool,
  onRemoveFeaturedTool,
  children,
  className,
}: SpaceChatLayoutProps) {
  const heroInputRef = React.useRef<HeroInputHandle>(null);
  const [featuredToolExpanded, setFeaturedToolExpanded] = React.useState(true);
  const activeBoard = boards.find((b) => b.id === activeBoardId);

  return (
    <div
      className={cn(
        'flex flex-col h-full',
        'bg-[#0A0A0A]',
        className
      )}
    >
      {/* Header */}
      <header
        className={cn(
          'flex-shrink-0 flex items-center justify-between',
          'px-4 py-3 border-b border-[#2A2A2A]'
        )}
      >
        {/* Left: Back + Space name */}
        <div className="flex items-center gap-3">
          {onBack && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className={cn(
                'p-2 rounded-lg',
                'text-[#818187] hover:text-[#FAFAFA]',
                'hover:bg-white/[0.04]',
                'transition-colors'
              )}
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          )}

          <div>
            <h1 className="font-semibold text-[#FAFAFA]">{space.name}</h1>
            {space.category && (
              <p className="text-xs text-[#818187]">{space.category}</p>
            )}
          </div>
        </div>

        {/* Right: Online members + Actions */}
        <div className="flex items-center gap-3">
          {/* Online members stack */}
          {onlineMembers.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {onlineMembers.slice(0, 4).map((member) => (
                  <Avatar
                    key={member.id}
                    className="w-7 h-7 ring-2 ring-[#0A0A0A]"
                  >
                    {member.avatarUrl ? (
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                    ) : (
                      <AvatarFallback className="bg-[#1A1A1A] text-[#818187] text-xs">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                ))}
              </div>
              <span className="text-sm text-[#818187]">
                {onlineMembers.length}
              </span>
            </div>
          )}

          {/* Command palette button */}
          {onOpenCommandPalette && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenCommandPalette}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                'bg-[#141414] border border-[#2A2A2A]',
                'text-[#818187] hover:text-[#FAFAFA]',
                'text-sm',
                'transition-colors'
              )}
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">⌘K</span>
            </motion.button>
          )}

          {/* Settings (leaders only) */}
          {isLeader && onOpenSettings && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenSettings}
              className={cn(
                'p-2 rounded-lg',
                'text-[#818187] hover:text-[#FAFAFA]',
                'hover:bg-white/[0.04]',
                'transition-colors'
              )}
              aria-label="Space settings"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </header>

      {/* Board tabs */}
      {boards.length > 0 && (
        <div className="flex-shrink-0 border-b border-[#2A2A2A]">
          <BoardTabBar
            boards={boards}
            activeBoardId={activeBoardId}
            onBoardChange={onBoardChange || (() => {})}
            onCreateBoard={isLeader ? onCreateBoard : undefined}
          />
        </div>
      )}

      {/* Featured tool slot */}
      {featuredTool ? (
        <FeaturedToolSlot
          toolId={featuredTool.id}
          toolName={featuredTool.name}
          toolIcon={featuredTool.icon}
          interactionCount={featuredTool.interactionCount}
          interactionLabel={featuredTool.interactionLabel}
          isExpanded={featuredToolExpanded}
          canManage={canManageTool}
          onToggleExpand={() => setFeaturedToolExpanded(!featuredToolExpanded)}
          onRemove={onRemoveFeaturedTool}
        >
          {featuredTool.content}
        </FeaturedToolSlot>
      ) : canManageTool ? (
        <FeaturedToolEmpty canAdd onAddTool={onAddFeaturedTool} />
      ) : null}

      {/* Messages area (children) - centered for intimate conversation feel */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {children}
        </div>
      </main>

      {/* Typing indicator - centered */}
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0"
          >
            <div className="max-w-3xl mx-auto px-4 py-2">
              <div className="flex items-center gap-2 text-sm text-[#818187]">
                <PresenceDot status="online" size="xs" pulse />
                <span>
                  {typingUsers.length === 1
                    ? `${typingUsers[0].name} is typing...`
                    : typingUsers.length === 2
                      ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`
                      : `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing...`}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero input - centered */}
      <div className="flex-shrink-0 border-t border-[#2A2A2A]">
        <div className="max-w-3xl mx-auto">
          <HeroInput
            ref={heroInputRef}
            boardName={activeBoard?.name || 'general'}
            onSubmit={onSendMessage}
            onOpenTools={onOpenTools}
            onOpenMembers={onOpenMembers}
            onOpenEvents={onOpenEvents}
          />
        </div>
      </div>
    </div>
  );
}

export default SpaceChatLayout;
