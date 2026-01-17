'use client';

/**
 * SpaceShell Template — 60/40 Split Layout for Space Residence
 *
 * The immersive frame for being "inside" a Space:
 * - Header: @handle + name + online count + settings
 * - Board tabs: Navigate between boards with unread indicators
 * - Main content (60%): Chat or other content
 * - Panel (40%): NOW/NEXT UP/PINNED contextual info
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYOUT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ← Back     @ubconsulting · UB Consulting        ●47 online    ⚙️        │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  [#general●] [#events] [#announcements] [#random] [+]       ⌘1-4        │
 * ├────────────────────────────────────────────┬────────────────────────────┤
 * │                                            │  NOW                       │
 * │                                            │    @alice ●                │
 * │                                            │    @bob ●                  │
 * │           MAIN CONTENT (60%)               │    +3 more                 │
 * │           Chat messages, events,           │ ─────────────────────────  │
 * │           members, tools, etc.             │  NEXT UP                   │
 * │                                            │    📅 Weekly Meeting       │
 * │                                            │       Tomorrow 3pm         │
 * │                                            │ ─────────────────────────  │
 * │                                            │  PINNED                    │
 * │                                            │    📌 Welcome doc          │
 * ├────────────────────────────────────────────┤                            │
 * │  [input field]                      [Send] │   ⌘⇧P to toggle           │
 * └────────────────────────────────────────────┴────────────────────────────┘
 *
 * Mobile:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ← Back    @ubconsulting                             ●47     ⚙️  [≡]    │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  [#general●] [#events] [#announcements] →                               │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                        FULL WIDTH CONTENT                               │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  [input field]                                              [Send]      │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 *            ↓ Swipe up or tap [≡] for context panel (bottom sheet)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  Text,
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
} from '../primitives';
import { BoardTabs, type Board } from '../components/BoardTabs';
import {
  SpacePanel,
  type OnlineMember,
  type UpcomingEvent,
  type PinnedItem,
} from '../components/SpacePanel';

// ============================================
// CONSTANTS
// ============================================

const HEADER_HEIGHT = 56;
const BOARD_TABS_HEIGHT = 48;
const INPUT_HEIGHT = 56;
const PANEL_WIDTH_PERCENT = 40;
const MOBILE_BREAKPOINT = 1024; // lg breakpoint for panel collapse

// LOCKED: Spring animation config
const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

// ============================================
// TYPES
// ============================================

export interface SpaceIdentity {
  id: string;
  handle: string;
  name: string;
  avatarUrl?: string;
}

export interface SpaceShellProps {
  children: React.ReactNode;
  /** Space identity */
  space: SpaceIdentity;
  /** Boards for navigation */
  boards: Board[];
  /** Currently active board ID */
  activeBoard: string;
  /** Online members for NOW section */
  onlineMembers: OnlineMember[];
  /** Total online count */
  onlineCount: number;
  /** Upcoming events for NEXT UP section */
  upcomingEvents: UpcomingEvent[];
  /** Pinned items for PINNED section */
  pinnedItems: PinnedItem[];
  /** Whether user can add boards (leader) */
  canAddBoard?: boolean;
  /** Whether user can access settings (leader) */
  canAccessSettings?: boolean;
  /** Panel collapsed state (controlled) */
  panelCollapsed?: boolean;
  /** Input area (chat input, etc.) */
  inputArea?: React.ReactNode;
  /** Callback when board changes */
  onBoardChange: (boardId: string) => void;
  /** Callback when add board is clicked */
  onAddBoard?: () => void;
  /** Callback when back is clicked */
  onBack?: () => void;
  /** Callback when settings is clicked */
  onSettings?: () => void;
  /** Callback when member is clicked */
  onMemberClick?: (memberId: string) => void;
  /** Callback when event is clicked */
  onEventClick?: (eventId: string) => void;
  /** Callback when RSVP is clicked */
  onRsvp?: (eventId: string) => void;
  /** Callback when pinned item is clicked */
  onPinnedClick?: (itemId: string) => void;
  /** Callback when panel toggle is clicked */
  onPanelToggle?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================
// CONTEXT
// ============================================

interface SpaceShellContextValue {
  isMobile: boolean;
  panelCollapsed: boolean;
  togglePanel: () => void;
  headerHeight: number;
  boardTabsHeight: number;
}

const SpaceShellContext = React.createContext<SpaceShellContextValue | null>(null);

export function useSpaceShell() {
  const context = React.useContext(SpaceShellContext);
  if (!context) {
    throw new Error('useSpaceShell must be used within a SpaceShell');
  }
  return context;
}

// ============================================
// RESPONSIVE HOOK
// ============================================

function useResponsive() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile };
}

// ============================================
// HEADER COMPONENT
// ============================================

interface SpaceShellHeaderProps {
  space: SpaceIdentity;
  onlineCount: number;
  canAccessSettings?: boolean;
  onBack?: () => void;
  onSettings?: () => void;
  onPanelToggle?: () => void;
  isMobile: boolean;
  panelCollapsed: boolean;
}

function SpaceShellHeader({
  space,
  onlineCount,
  canAccessSettings,
  onBack,
  onSettings,
  onPanelToggle,
  isMobile,
  panelCollapsed,
}: SpaceShellHeaderProps) {
  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'flex items-center gap-3',
        'px-3 lg:px-4',
        'border-b border-white/[0.06]'
      )}
      style={{
        height: HEADER_HEIGHT,
        background: 'rgba(5, 5, 4, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Back</span>
      </Button>

      {/* Space identity */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Avatar size="sm">
          {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
          <AvatarFallback>{getInitials(space.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <Text size="xs" className="font-mono text-muted-foreground truncate">
            @{space.handle}
          </Text>
          <Text size="sm" weight="medium" className="truncate">
            {space.name}
          </Text>
        </div>
      </div>

      {/* Online count + Actions */}
      <div className="flex items-center gap-2">
        {/* Online indicator */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--color-accent-gold)] animate-pulse" />
          <Text size="xs" tone="muted">
            {onlineCount}
          </Text>
        </div>

        {/* Settings (leader only) */}
        {canAccessSettings && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onSettings}
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
        )}

        {/* Mobile panel toggle */}
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onPanelToggle}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle context panel</span>
          </Button>
        )}
      </div>
    </header>
  );
}

// ============================================
// MOBILE BOTTOM SHEET
// ============================================

interface MobilePanelSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onlineMembers: OnlineMember[];
  onlineCount: number;
  upcomingEvents: UpcomingEvent[];
  pinnedItems: PinnedItem[];
  onMemberClick?: (memberId: string) => void;
  onEventClick?: (eventId: string) => void;
  onRsvp?: (eventId: string) => void;
  onPinnedClick?: (itemId: string) => void;
}

function MobilePanelSheet({
  isOpen,
  onClose,
  onlineMembers,
  onlineCount,
  upcomingEvents,
  pinnedItems,
  onMemberClick,
  onEventClick,
  onRsvp,
  onPinnedClick,
}: MobilePanelSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={springConfig}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50',
              'bg-[var(--color-bg-page)]',
              'border-t border-white/[0.06]',
              'rounded-t-2xl',
              'max-h-[80vh] overflow-hidden'
            )}
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-48px)]">
              <SpacePanel
                now={{ members: onlineMembers, total: onlineCount }}
                nextUp={upcomingEvents}
                pinned={pinnedItems}
                onMemberClick={onMemberClick}
                onEventClick={onEventClick}
                onRsvp={onRsvp}
                onPinnedClick={onPinnedClick}
                className="border-l-0"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * SpaceShell Template - 60/40 split layout for Space residence
 *
 * Provides the immersive frame for being "inside" a Space with
 * header, board tabs, main content area, and contextual panel.
 *
 * @example
 * ```tsx
 * <SpaceShell
 *   space={{ id: '1', handle: 'ubconsulting', name: 'UB Consulting' }}
 *   boards={[{ id: 'general', name: 'general' }]}
 *   activeBoard="general"
 *   onlineMembers={[{ id: '1', handle: 'alice' }]}
 *   onlineCount={47}
 *   upcomingEvents={[]}
 *   pinnedItems={[]}
 *   onBoardChange={(id) => setActiveBoard(id)}
 *   inputArea={<ChatInput />}
 * >
 *   <ChatMessages />
 * </SpaceShell>
 * ```
 */
export function SpaceShell({
  children,
  space,
  boards,
  activeBoard,
  onlineMembers,
  onlineCount,
  upcomingEvents,
  pinnedItems,
  canAddBoard = false,
  canAccessSettings = false,
  panelCollapsed: controlledPanelCollapsed,
  inputArea,
  onBoardChange,
  onAddBoard,
  onBack,
  onSettings,
  onMemberClick,
  onEventClick,
  onRsvp,
  onPinnedClick,
  onPanelToggle,
  className,
}: SpaceShellProps) {
  const { isMobile } = useResponsive();
  const [internalPanelCollapsed, setInternalPanelCollapsed] = React.useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);

  const isControlled = controlledPanelCollapsed !== undefined;
  const panelCollapsed = isControlled ? controlledPanelCollapsed : internalPanelCollapsed;

  // Toggle panel
  const togglePanel = React.useCallback(() => {
    if (isMobile) {
      setMobileSheetOpen((prev) => !prev);
    } else if (isControlled) {
      onPanelToggle?.();
    } else {
      setInternalPanelCollapsed((prev) => !prev);
    }
  }, [isMobile, isControlled, onPanelToggle]);

  // Keyboard shortcut: ⌘⇧P to toggle panel
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        togglePanel();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePanel]);

  const contextValue: SpaceShellContextValue = React.useMemo(
    () => ({
      isMobile,
      panelCollapsed: isMobile ? true : panelCollapsed,
      togglePanel,
      headerHeight: HEADER_HEIGHT,
      boardTabsHeight: BOARD_TABS_HEIGHT,
    }),
    [isMobile, panelCollapsed, togglePanel]
  );

  const mainWidth = isMobile || panelCollapsed ? '100%' : `${100 - PANEL_WIDTH_PERCENT}%`;
  const panelWidth = isMobile || panelCollapsed ? '0%' : `${PANEL_WIDTH_PERCENT}%`;

  return (
    <SpaceShellContext.Provider value={contextValue}>
      <div
        className={cn('relative min-h-screen', className)}
        style={{ backgroundColor: '#050504' }}
      >
        {/* Header */}
        <SpaceShellHeader
          space={space}
          onlineCount={onlineCount}
          canAccessSettings={canAccessSettings}
          onBack={onBack}
          onSettings={onSettings}
          onPanelToggle={togglePanel}
          isMobile={isMobile}
          panelCollapsed={panelCollapsed}
        />

        {/* Board Tabs */}
        <div
          className="fixed left-0 right-0 z-40 border-b border-white/[0.06]"
          style={{
            top: HEADER_HEIGHT,
            height: BOARD_TABS_HEIGHT,
            background: 'rgba(5, 5, 4, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <BoardTabs
            boards={boards}
            activeBoard={activeBoard}
            onBoardChange={onBoardChange}
            onAddBoard={onAddBoard}
            canAddBoard={canAddBoard}
            className="h-full"
          />
        </div>

        {/* Main Layout */}
        <div
          className="flex"
          style={{
            paddingTop: HEADER_HEIGHT + BOARD_TABS_HEIGHT,
            minHeight: '100vh',
          }}
        >
          {/* Main Content */}
          <motion.div
            className="flex flex-col flex-1 min-w-0"
            initial={false}
            animate={{ width: mainWidth }}
            transition={springConfig}
          >
            {/* Content Area */}
            <div
              className="flex-1 overflow-y-auto"
              style={{
                paddingBottom: inputArea ? INPUT_HEIGHT : 0,
              }}
            >
              {children}
            </div>

            {/* Input Area */}
            {inputArea && (
              <div
                className="fixed bottom-0 left-0 z-40 border-t border-white/[0.06]"
                style={{
                  height: INPUT_HEIGHT,
                  width: mainWidth,
                  background: 'rgba(5, 5, 4, 0.95)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              >
                {inputArea}
              </div>
            )}
          </motion.div>

          {/* Panel (desktop only) */}
          {!isMobile && (
            <motion.div
              className="flex-shrink-0 overflow-hidden"
              initial={false}
              animate={{
                width: panelWidth,
                opacity: panelCollapsed ? 0 : 1,
              }}
              transition={springConfig}
            >
              {!panelCollapsed && (
                <SpacePanel
                  now={{ members: onlineMembers, total: onlineCount }}
                  nextUp={upcomingEvents}
                  pinned={pinnedItems}
                  collapsed={panelCollapsed}
                  onToggle={togglePanel}
                  onMemberClick={onMemberClick}
                  onEventClick={onEventClick}
                  onRsvp={onRsvp}
                  onPinnedClick={onPinnedClick}
                  className="h-full"
                />
              )}
            </motion.div>
          )}
        </div>

        {/* Mobile Panel Sheet */}
        {isMobile && (
          <MobilePanelSheet
            isOpen={mobileSheetOpen}
            onClose={() => setMobileSheetOpen(false)}
            onlineMembers={onlineMembers}
            onlineCount={onlineCount}
            upcomingEvents={upcomingEvents}
            pinnedItems={pinnedItems}
            onMemberClick={onMemberClick}
            onEventClick={onEventClick}
            onRsvp={onRsvp}
            onPinnedClick={onPinnedClick}
          />
        )}
      </div>
    </SpaceShellContext.Provider>
  );
}

// ============================================
// SKELETON
// ============================================

interface SpaceShellSkeletonProps {
  className?: string;
}

export function SpaceShellSkeleton({ className }: SpaceShellSkeletonProps) {
  return (
    <div className={cn('relative min-h-screen', className)} style={{ backgroundColor: '#050504' }}>
      {/* Header skeleton */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 border-b border-white/[0.06]"
        style={{
          height: HEADER_HEIGHT,
          background: 'rgba(5, 5, 4, 0.95)',
        }}
      >
        <div className="h-8 w-8 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-8 w-8 rounded-lg bg-white/[0.06] animate-pulse" />
        <div className="flex-1 space-y-1">
          <div className="h-3 w-24 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-4 w-32 rounded bg-white/[0.06] animate-pulse" />
        </div>
        <div className="h-4 w-8 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-8 w-8 rounded bg-white/[0.06] animate-pulse" />
      </div>

      {/* Board tabs skeleton */}
      <div
        className="fixed left-0 right-0 z-40 flex items-center gap-2 px-4 border-b border-white/[0.06]"
        style={{
          top: HEADER_HEIGHT,
          height: BOARD_TABS_HEIGHT,
          background: 'rgba(5, 5, 4, 0.95)',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'h-7 rounded-full bg-white/[0.06] animate-pulse',
              i === 1 ? 'w-20' : 'w-16'
            )}
          />
        ))}
      </div>

      {/* Content + Panel skeleton */}
      <div
        className="flex"
        style={{
          paddingTop: HEADER_HEIGHT + BOARD_TABS_HEIGHT,
          minHeight: '100vh',
        }}
      >
        {/* Main content */}
        <div className="flex-1 p-4 space-y-4" style={{ width: '60%' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/[0.06] animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded bg-white/[0.06] animate-pulse" />
                <div className="h-4 w-full rounded bg-white/[0.06] animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Panel */}
        <div
          className="border-l border-white/[0.06] p-4 space-y-4 hidden lg:block"
          style={{ width: '40%' }}
        >
          <div className="h-3 w-12 rounded bg-white/[0.06] animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-white/[0.06] animate-pulse" />
              <div className="h-4 w-20 rounded bg-white/[0.06] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

SpaceShell.displayName = 'SpaceShell';
SpaceShellSkeleton.displayName = 'SpaceShellSkeleton';

export {
  HEADER_HEIGHT as SPACE_SHELL_HEADER_HEIGHT,
  BOARD_TABS_HEIGHT as SPACE_SHELL_BOARD_TABS_HEIGHT,
  INPUT_HEIGHT as SPACE_SHELL_INPUT_HEIGHT,
  PANEL_WIDTH_PERCENT as SPACE_SHELL_PANEL_WIDTH_PERCENT,
};
