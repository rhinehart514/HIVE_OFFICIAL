# HIVE Spaces System - UI/UX Design Audit

**Date**: February 4, 2026
**Codebase Version**: 4.0.0 (Split Panel Layout)
**Design References**: Discord, Slack, Linear, Notion, iMessage, Apple

---

## Executive Summary

The Spaces system is HIVE's core belonging infrastructure. After reviewing the codebase, this audit examines the UI/UX through 15 design perspectives, providing actionable recommendations that balance 2026 design sensibilities with the constraints of a campus-focused product.

**Current State**: Solid Linear-style split panel architecture with a 200px sidebar. Strong design token system (`packages/tokens/src/spaces.ts`). Good motion foundations. Multiple areas need elevation to match Discord/iMessage polish.

**Primary Gaps**:
1. Chat feels utilitarian - needs iMessage warmth
2. Presence system lacks personality
3. Empty states need more soul
4. Mobile experience requires dedicated attention
5. Board navigation lacks Linear's keyboard-first design

---

## 1. Color Alchemist

### Current Assessment

**What exists**:
- Base surface: `#0A0A09` (near-black void)
- Subtle borders: `rgba(255, 255, 255, 0.06)`
- Hover states: `rgba(255, 255, 255, 0.04)`
- Active states: `rgba(255, 255, 255, 0.08)`
- Online indicator: `#22C55E` (emerald green)
- Accent: `var(--color-gold)` (gold for premium actions)
- Category colors for space types (blue/amber/green/purple)

**What works**:
- The near-black base creates depth without being harsh
- Gold accent is distinctive and reserved for high-intent actions
- Subtle transparency layers create spatial depth

**What doesn't work**:
- No color differentiation between **your spaces** vs. **other spaces**
- Active vs. quiet spaces look identical until you count online dots
- No visual indication of unread urgency levels
- Board active state (white/8%) is too subtle

### 2026 Design Direction

**Discord approach**: Server icons glow with accent color when active, unread dots scale with urgency
**iMessage approach**: Blue for sent, gray for received - instant ownership recognition
**Linear approach**: Subtle blue tint on selected items, not just opacity changes

### Specific Recommendations

1. **Space ownership differentiation**
   - Spaces you lead: Subtle gold left border or icon ring
   - Spaces you're a member of: Default treatment
   - Spaces you're visiting: Slightly desaturated

2. **Activity-based color**
   - Busy spaces (20+ msgs/day): Warm undertone on surface
   - Active spaces (5-19 msgs): Default
   - Quiet spaces (1-4 msgs): Cooler/grayer undertone
   - Dead spaces (0 msgs): Desaturated avatar

3. **Unread intensity scale**
   ```css
   /* Current: single gold dot */
   .unread-badge { background: var(--color-gold); }

   /* Proposed: intensity levels */
   .unread-1-5 { background: rgba(255, 215, 0, 0.6); }  /* Subtle */
   .unread-6-20 { background: var(--color-gold); }      /* Standard */
   .unread-20-plus {
     background: var(--color-gold);
     box-shadow: 0 0 8px var(--color-gold);             /* Glow */
   }
   ```

4. **Active board enhancement**
   ```css
   /* Current */
   .board-active { background: rgba(255, 255, 255, 0.08); }

   /* Proposed */
   .board-active {
     background: rgba(255, 255, 255, 0.08);
     border-left: 2px solid rgba(255, 255, 255, 0.3);   /* Strong indicator */
   }
   ```

### Reference Patterns

- **Discord**: Server sidebar uses accent colors per-server, unread badges scale
- **Slack**: Bold vs. muted channel names based on unread state
- **Linear**: Selected issues have subtle blue background tint

---

## 2. Typography Surgeon

### Current Assessment

**What exists** (from `SPACE_TYPOGRAPHY`):
- Space name: 16px/600 weight, -0.01em tracking
- Board name: 14px/500 weight
- Section labels: 11px/600, 0.05em tracking, uppercase
- Message author: 14px/600
- Message content: 14px/400, 1.5 line-height
- Timestamps: 12px/400, 0.40 opacity

**What works**:
- Type scale is coherent
- Uppercase section labels work well for sidebar
- Message content line-height (1.5) is comfortable for reading

**What doesn't work**:
- All message authors at same weight - no hierarchy between leaders/mods/members
- Timestamps too subtle (0.40 opacity) - hard to scan
- Board names don't differentiate between channels (#general vs #announcements)
- No visual distinction for system messages vs user messages

### 2026 Design Direction

**iMessage approach**: Sent messages slightly smaller than received, dates break up conversation
**Slack approach**: Bot/integration messages have distinct styling
**Discord approach**: Role colors on usernames, system messages italicized

### Specific Recommendations

1. **Role-based author styling**
   ```tsx
   // Current: all authors same
   <span className="text-sm font-semibold">{authorName}</span>

   // Proposed: role differentiation
   <span className={cn(
     "text-sm font-semibold",
     role === 'owner' && "text-[var(--color-gold)]",
     role === 'admin' && "text-[var(--color-gold)]/80",
     role === 'moderator' && "text-blue-400"
   )}>
     {authorName}
   </span>
   ```

2. **Timestamp enhancement**
   ```css
   /* Current */
   .timestamp { opacity: 0.40; }

   /* Proposed: contextual opacity */
   .timestamp-today { opacity: 0.50; }
   .timestamp-recent { opacity: 0.40; }   /* Last 7 days */
   .timestamp-old { opacity: 0.30; }      /* Older */
   ```

3. **Board name hierarchy**
   ```tsx
   // Special boards get treatment
   const SPECIAL_BOARDS = {
     general: { emoji: null, weight: 600 },      // Bold, primary
     announcements: { emoji: null, weight: 500 }, // Medium, official
     events: { emoji: null, weight: 400 },        // Normal
   };
   ```

4. **System message distinction**
   ```css
   .message-system {
     font-style: italic;
     color: rgba(255, 255, 255, 0.50);
   }
   ```

5. **Date dividers in chat**
   ```tsx
   // Add date breaks in MessageFeed
   {isDifferentDay && (
     <div className="flex items-center gap-3 py-4">
       <div className="flex-1 h-px bg-white/[0.06]" />
       <span className="text-xs font-medium text-white/30 uppercase tracking-wider">
         {formatDate(message.timestamp)}
       </span>
       <div className="flex-1 h-px bg-white/[0.06]" />
     </div>
   )}
   ```

### Reference Patterns

- **Slack**: @mentions bold, channel links distinct, timestamps on hover for grouped messages
- **Discord**: Role colors prominent, system messages grayed
- **iMessage**: Date dividers centered, subtle but scannable

---

## 3. Spacing Perfectionist

### Current Assessment

**What exists** (from `SPACE_LAYOUT` and `SPACE_COMPONENTS`):
- Header height: 56px
- Sidebar width: 200px
- Sidebar padding: 12px
- Input height: 64px
- Board item height: 36px
- Section gap: 24px
- Message padding Y: 8px
- Message avatar size: 32px
- Message gap: 12px

**What works**:
- 200px sidebar is Linear-appropriate
- 36px board items are touch-friendly
- 56px header is compact but usable

**What doesn't work**:
- Chat density is inconsistent - same-author messages have 1.5px gap but different-author is 20px (`mt-5`)
- Sidebar sections (24px gap) feel cramped with only 3 items
- Input area (64px) doesn't account for typing indicator
- Thread panel overlap not defined

### 2026 Design Direction

**Discord approach**: Compact mode option, message grouping with 16px between authors
**Slack approach**: Dense vs comfortable modes, replies inline
**Linear approach**: Consistent 8px rhythm throughout

### Specific Recommendations

1. **Message grouping spacing**
   ```tsx
   // Current
   const groupSpacing = {
     sameAuthor: 'mt-1.5',      // 6px
     differentAuthor: 'mt-5',   // 20px
   };

   // Proposed: tighter, more consistent
   const groupSpacing = {
     sameAuthor: 'mt-1',        // 4px
     differentAuthor: 'mt-4',   // 16px - same as section padding
   };
   ```

2. **Sidebar section rhythm**
   ```tsx
   // Current: 24px gap between all sections

   // Proposed: variable by content type
   <section className="space-y-1">          {/* Boards: tight */}
     <h3>Boards</h3>
     <BoardsList />
   </section>
   <div className="h-6" />                   {/* 24px separator */}
   <section className="space-y-1">
     <h3>Tools</h3>
     <ToolsList />
   </section>
   <div className="flex-1 min-h-6" />        {/* Flexible spacer */}
   <section className="pt-4 border-t">       {/* Members anchored bottom */}
     <MembersPreview />
   </section>
   ```

3. **Input area with typing indicator**
   ```tsx
   // Current: 64px fixed

   // Proposed: dynamic
   const inputAreaHeight = typingUsers.length > 0 ? 88 : 64; // +24px for indicator
   ```

4. **8px rhythm enforcement**
   ```css
   /* All spacing should divide evenly by 8 */
   --space-1: 4px;   /* half-step for micro */
   --space-2: 8px;   /* base unit */
   --space-3: 12px;  /* 1.5x */
   --space-4: 16px;  /* 2x */
   --space-5: 24px;  /* 3x */
   --space-6: 32px;  /* 4x */
   ```

### Reference Patterns

- **Figma**: 8px grid, consistent across all UI
- **Linear**: Tight issue lists, generous section spacing
- **Discord**: Compact server list, comfortable message area

---

## 4. Iconography Curator

### Current Assessment

**What exists**:
- Board icons: `#` symbol (text, not icon)
- Space icons: Avatar with initials fallback
- Action icons: Lucide icons (consistent family)
- Role badges: Crown (owner/admin), Shield (moderator)
- Status icons: Green dot (online), animated pulse

**What works**:
- Lucide icon family is cohesive
- Crown/Shield role indicators are universally understood
- Green online dot is clear

**What doesn't work**:
- `#` for all boards - no visual differentiation for board types
- No custom space icons (only avatars)
- Action icons in hover menus are too small (3.5-4px)
- No animation on interactive icons

### 2026 Design Direction

**Discord approach**: Custom channel icons, animated icons on hover
**Slack approach**: Custom emoji as channel icons, app icons
**Linear approach**: Subtle icon transitions, consistent 16px size

### Specific Recommendations

1. **Board type icons**
   ```tsx
   const BOARD_ICONS = {
     general: Hash,           // #
     announcements: Megaphone,
     events: Calendar,
     resources: FileText,
     default: MessageCircle,
   };

   // In BoardItem
   <Icon className="w-4 h-4 text-white/50" />
   ```

2. **Action icon size standardization**
   ```tsx
   // Current: 3.5px in menus, 4px in buttons

   // Proposed: consistent 16px
   const ICON_SIZES = {
     xs: 12,  // Inline with text
     sm: 16,  // Standard actions
     md: 20,  // Prominent actions
     lg: 24,  // Hero actions
   };
   ```

3. **Interactive icon animation**
   ```tsx
   // Add subtle scale on hover
   <motion.button
     whileHover={{ scale: 1.1 }}
     whileTap={{ scale: 0.95 }}
     transition={{ duration: 0.1 }}
   >
     <Settings className="w-4 h-4" />
   </motion.button>
   ```

4. **Space icon enhancement**
   ```tsx
   // Support custom icons beyond avatars
   interface SpaceIcon {
     type: 'avatar' | 'emoji' | 'icon';
     value: string;           // URL, emoji, or Lucide icon name
     backgroundColor?: string; // For emoji/icon fallback
   }
   ```

### Reference Patterns

- **Discord**: Custom server icons, animated emoji
- **Notion**: Page icons (emoji + custom)
- **Linear**: Consistent 16px icons, subtle hover states

---

## 5. Split Panel Architect

### Current Assessment

**What exists** (from `SpaceLayout.tsx`):
- Header: 56px fixed top
- Sidebar: 200px fixed left, scrollable
- Main content: Flex-1, scrollable
- Input: Fixed bottom
- Mobile: Bottom sheet (80% max height)

**What works**:
- Basic split panel is functional
- Mobile sheet approach is sensible
- CSS custom properties for dimensions

**What doesn't work**:
- No sidebar collapse option on desktop
- No thread panel specification
- Mobile sidebar loses context when opening
- No keyboard shortcuts for panel navigation

### 2026 Design Direction

**Linear approach**: Collapsible sidebar, keyboard-first, resizable panels
**Discord approach**: Server list + channel list + content = 3-column
**Slack approach**: Thread panel slides in from right

### Specific Recommendations

1. **Add collapsible sidebar**
   ```tsx
   // SpaceLayout additions
   interface SpaceLayoutProps {
     sidebarCollapsed?: boolean;      // Current: exists
     sidebarWidth?: number;           // Add: custom width
     minSidebarWidth?: number;        // Add: 48px collapsed
     maxSidebarWidth?: number;        // Add: 320px expanded
     onResizeSidebar?: (w: number) => void;
   }

   // Collapsed state shows icons only
   {sidebarCollapsed && (
     <div className="w-12 flex flex-col items-center py-2 gap-2">
       {boards.map(b => <BoardIcon key={b.id} board={b} />)}
     </div>
   )}
   ```

2. **Thread panel integration**
   ```tsx
   // Add third column for threads
   <SpaceLayout
     sidebar={<SpaceSidebar />}
     threadPanel={activeThread ? <ThreadPanel thread={activeThread} /> : null}
   >
     <MessageFeed />
   </SpaceLayout>

   // Layout behavior
   // No thread: sidebar (200px) + main (flex-1)
   // With thread: sidebar (200px) + main (flex-1) + thread (400px)
   // Mobile: thread replaces main
   ```

3. **Panel keyboard navigation**
   ```tsx
   // Global shortcuts
   useKeyboardShortcut('cmd+\\', toggleSidebar);
   useKeyboardShortcut('cmd+shift+\\', toggleThread);
   useKeyboardShortcut('cmd+[', focusSidebar);
   useKeyboardShortcut('cmd+]', focusMain);
   ```

4. **Mobile context preservation**
   ```tsx
   // Instead of full sheet, use half-sheet with peek
   <MobileSheet
     snapPoints={['20%', '60%', '95%']}
     defaultSnap="20%"
     onSnap={setSheetSnap}
   >
     {/* 20%: Just boards list header + 2 visible items */}
     {/* 60%: Full boards + tools */}
     {/* 95%: Full sidebar content */}
   </MobileSheet>
   ```

### Reference Patterns

- **Linear**: Cmd+\ to toggle sidebar, resizable panels
- **Slack**: Thread panel from right, closes with Escape
- **Figma**: Floating panels, snap points, persistent position

---

## 6. Chat Flow Designer

### Current Assessment

**What exists** (from `MessageItem.tsx`, `MessageFeed.tsx`):
- Full-row messages (not bubbles)
- Author grouping (avatar only on first message)
- Hover actions (react, reply, delete, edit, report)
- Reactions display with count
- Reply count linking to thread
- Edit mode inline
- Attachments (images with lightbox)
- Unread divider
- "Scroll to latest" button

**What works**:
- Author grouping reduces visual noise
- Hover actions are comprehensive
- Unread divider is clear

**What doesn't work**:
- No read receipts
- No message delivery status (sent/delivered/failed)
- Reactions require hover to add
- No reply preview in thread count
- No message search highlighting
- No emoji picker (only quick emojis)

### 2026 Design Direction

**iMessage approach**: Read receipts, delivery status, bubble differentiation
**Discord approach**: Reaction bar persistent on mobile, reply preview
**Slack approach**: Full emoji picker, message actions on right-click

### Specific Recommendations

1. **Add delivery status**
   ```tsx
   interface Message {
     // ...existing
     status?: 'sending' | 'sent' | 'delivered' | 'failed';
   }

   // Status indicator
   {isOwn && (
     <span className="ml-1 text-xs">
       {status === 'sending' && <Loader2 className="w-3 h-3 animate-spin" />}
       {status === 'sent' && <Check className="w-3 h-3 text-white/30" />}
       {status === 'delivered' && <CheckCheck className="w-3 h-3 text-white/40" />}
       {status === 'failed' && <AlertCircle className="w-3 h-3 text-red-400" />}
     </span>
   )}
   ```

2. **Reply preview enhancement**
   ```tsx
   // Current
   <button>{message.replyCount} replies</button>

   // Proposed
   <button className="flex items-center gap-2 mt-2">
     <div className="flex -space-x-1">
       {replyParticipants.slice(0, 3).map(p => (
         <Avatar key={p.id} size="xs" src={p.avatarUrl} />
       ))}
     </div>
     <span className="text-xs text-white/50">
       {message.replyCount} replies
       {lastReplyTime && ` · Last reply ${formatRelative(lastReplyTime)}`}
     </span>
   </button>
   ```

3. **Quick reaction bar (persistent on touch)**
   ```tsx
   // Add always-visible reactions on mobile
   <div className={cn(
     "flex items-center gap-1 mt-2",
     "md:opacity-0 md:group-hover:opacity-100",  // Desktop: hover
     "touch:opacity-100"                          // Mobile: always
   )}>
     {['👍', '❤️', '😂', '👀', '🎉'].map(emoji => (
       <button
         key={emoji}
         onClick={() => onReact(emoji)}
         className="p-1 rounded hover:bg-white/[0.08]"
       >
         {emoji}
       </button>
     ))}
     <button onClick={openFullPicker}>
       <SmilePlus className="w-4 h-4" />
     </button>
   </div>
   ```

4. **Full emoji picker integration**
   ```tsx
   // Add emoji-mart or similar
   import { Picker } from '@emoji-mart/react';

   {showEmojiPicker && (
     <div className="absolute bottom-full right-0 mb-2">
       <Picker
         theme="dark"
         onEmojiSelect={(emoji) => {
           onReact(emoji.native);
           setShowEmojiPicker(false);
         }}
       />
     </div>
   )}
   ```

5. **Message context menu (right-click)**
   ```tsx
   <ContextMenu>
     <ContextMenuTrigger asChild>
       <MessageItem message={message} />
     </ContextMenuTrigger>
     <ContextMenuContent>
       <ContextMenuItem onClick={() => onReply(message.id)}>
         Reply in thread
       </ContextMenuItem>
       <ContextMenuItem onClick={() => copyToClipboard(message.content)}>
         Copy text
       </ContextMenuItem>
       <ContextMenuItem onClick={() => onReact(message.id)}>
         Add reaction
       </ContextMenuItem>
       {isOwn && (
         <ContextMenuItem onClick={() => setEditing(true)}>
           Edit message
         </ContextMenuItem>
       )}
       <ContextMenuSeparator />
       <ContextMenuItem onClick={() => onReport(message.id)}>
         Report message
       </ContextMenuItem>
     </ContextMenuContent>
   </ContextMenu>
   ```

### Reference Patterns

- **iMessage**: Double-check for delivered, "Read" timestamp
- **Discord**: Persistent reaction bar, full emoji picker
- **Slack**: Thread preview with participants, context menu

---

## 7. Member List Organizer

### Current Assessment

**What exists** (from `MembersList.tsx`, `MembersPreview.tsx`):
- Search filter
- Role-based grouping (Leaders, Moderators, Members)
- Online indicator (green dot)
- Recently active indicator (amber dot for <1h)
- Activity timestamp ("Active 5m ago", "Last seen 3d ago")
- Role badges (Crown for owner/admin, Shield for mod)
- Click to view profile

**What works**:
- Role grouping is logical
- Activity timestamps provide context
- Online/recent indicators are clear

**What doesn't work**:
- No "currently in this space" vs "online elsewhere"
- No quick actions (DM, mention)
- No mutual connections indicator
- Alphabetical within groups - no activity sorting
- Overflow handling is basic (+N count)

### 2026 Design Direction

**Discord approach**: Per-role colors, hover card with full profile preview
**Slack approach**: Status messages, quick DM action
**Linear approach**: Compact list with keyboard navigation

### Specific Recommendations

1. **Presence granularity**
   ```tsx
   type PresenceStatus =
     | 'here'        // In this space
     | 'online'      // Online, different space
     | 'away'        // Online, idle >15m
     | 'recently'    // Last active <1h
     | 'offline';    // No recent activity

   const PRESENCE_STYLES = {
     here: 'bg-emerald-400 ring-2 ring-emerald-400/30',      // Green + glow
     online: 'bg-emerald-400',                                // Solid green
     away: 'bg-amber-400',                                    // Yellow
     recently: 'bg-amber-400/60',                             // Faded yellow
     offline: 'bg-white/10',                                  // Gray
   };
   ```

2. **Activity-based sorting**
   ```tsx
   // Sort within role groups
   const sortedMembers = members.sort((a, b) => {
     if (a.isOnline && !b.isOnline) return -1;
     if (!a.isOnline && b.isOnline) return 1;
     if (a.lastSeen && b.lastSeen) {
       return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
     }
     return a.name.localeCompare(b.name);
   });
   ```

3. **Quick actions on hover**
   ```tsx
   <MemberRow>
     {/* ...existing avatar + info */}
     <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
       <button onClick={() => startDM(member.id)} title="Send message">
         <MessageCircle className="w-4 h-4" />
       </button>
       <button onClick={() => insertMention(member.handle)} title="Mention">
         <AtSign className="w-4 h-4" />
       </button>
     </div>
   </MemberRow>
   ```

4. **Hover profile card**
   ```tsx
   <HoverCard openDelay={500}>
     <HoverCardTrigger asChild>
       <MemberRow member={member} />
     </HoverCardTrigger>
     <HoverCardContent className="w-80">
       <ProfileMiniCard
         user={member}
         mutualSpaces={getMutualSpaces(member.id)}
         mutualConnections={getMutualConnections(member.id)}
         onDM={() => startDM(member.id)}
         onViewProfile={() => navigateToProfile(member.id)}
       />
     </HoverCardContent>
   </HoverCard>
   ```

5. **Mutual connections indicator**
   ```tsx
   {member.mutualCount > 0 && (
     <div className="flex items-center gap-1 text-xs text-white/30">
       <Users className="w-3 h-3" />
       {member.mutualCount} mutual
     </div>
   )}
   ```

### Reference Patterns

- **Discord**: Status circle colors, hover profile card
- **Slack**: Quick DM, status text under name
- **LinkedIn**: Mutual connection count

---

## 8. Board Navigator

### Current Assessment

**What exists** (from `BoardsList.tsx`, `BoardItem.tsx`):
- Vertical list in sidebar
- Active board highlight (bg-white/8%)
- Unread badge (gold dot)
- Drag-to-reorder (leaders only)
- Add board button (dashed border, leaders only)
- Keyboard navigation (Arrow keys, J/K)

**What works**:
- Reorderable boards for customization
- Keyboard nav exists

**What doesn't work**:
- No board preview/description
- No pinned boards concept (general is just first)
- No board-specific settings inline
- Keyboard shortcuts not discoverable
- No command palette integration

### 2026 Design Direction

**Discord approach**: Category groups, collapsible, drag between categories
**Slack approach**: Sections (Starred, Channels, DMs), recent switcher
**Linear approach**: Command palette for fast switching, Cmd+K

### Specific Recommendations

1. **Board sections**
   ```tsx
   interface BoardSection {
     id: string;
     name: string;
     boards: Board[];
     collapsed?: boolean;
   }

   // Default sections
   const sections = [
     { id: 'pinned', name: 'Pinned', boards: pinnedBoards },
     { id: 'all', name: 'Boards', boards: regularBoards },
   ];

   // Leaders can create custom sections
   ```

2. **Board preview on hover**
   ```tsx
   <HoverCard openDelay={800}>
     <HoverCardTrigger asChild>
       <BoardItem board={board} />
     </HoverCardTrigger>
     <HoverCardContent side="right" className="w-64">
       <div>
         <h4 className="font-medium">#{board.name}</h4>
         {board.description && (
           <p className="text-sm text-white/50 mt-1">{board.description}</p>
         )}
         <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
           <span>{board.messageCount} messages</span>
           <span>Created {formatDate(board.createdAt)}</span>
         </div>
       </div>
     </HoverCardContent>
   </HoverCard>
   ```

3. **Command palette integration**
   ```tsx
   // In search overlay (Cmd+K)
   {searchQuery.startsWith('#') && (
     <CommandGroup heading="Boards">
       {filteredBoards.map(board => (
         <CommandItem
           key={board.id}
           onSelect={() => setActiveBoard(board.id)}
         >
           <Hash className="w-4 h-4 mr-2" />
           {board.name}
           {board.unreadCount > 0 && (
             <span className="ml-auto text-xs text-gold">{board.unreadCount}</span>
           )}
         </CommandItem>
       ))}
     </CommandGroup>
   )}
   ```

4. **Quick switcher shortcut**
   ```tsx
   // Cmd+Shift+A - recent boards
   useKeyboardShortcut('cmd+shift+a', () => {
     setShowQuickSwitcher(true);
   });

   // Quick switcher shows recent boards across spaces
   <QuickSwitcher
     items={recentBoards}
     onSelect={(board) => navigateToBoard(board.spaceId, board.id)}
   />
   ```

5. **Keyboard shortcut hints**
   ```tsx
   // In sidebar header
   <Tooltip>
     <TooltipTrigger asChild>
       <span className="text-xs text-white/20">J/K to navigate</span>
     </TooltipTrigger>
     <TooltipContent>
       <div className="text-xs space-y-1">
         <p><kbd>J</kbd> / <kbd>K</kbd> - Navigate boards</p>
         <p><kbd>Enter</kbd> - Select board</p>
         <p><kbd>Cmd+K</kbd> - Quick search</p>
       </div>
     </TooltipContent>
   </Tooltip>
   ```

### Reference Patterns

- **Discord**: Channel categories, mute per-category
- **Slack**: Starred channels section, recent switcher (Cmd+K)
- **Linear**: Team/project filtering, Cmd+K command palette

---

## 9. Event Card Composer

### Current Assessment

**What exists** (from `EventCard.tsx`):
- Calendar icon with gold background
- Title with time badge ("In 2h", "Starting soon!")
- Date/time with clock icon
- Location with MapPin or Video icon
- Description (2 lines truncated)
- RSVP count with Users icon
- RSVP button (toggles going/not going)
- Space badge (for cross-space contexts)
- "Starting soon" glow animation

**What works**:
- "Starting soon" urgency indicator is compelling
- Location flexibility (physical/virtual)
- Cross-space context with space badge

**What doesn't work**:
- No attendee avatars preview
- RSVP only binary (going/not going), no "maybe" visible
- No quick-add to calendar action
- No time until event countdown
- No conflict indicator (if user has another event)

### 2026 Design Direction

**Google Calendar approach**: Attendee avatars, "Add to calendar" action
**Eventbrite approach**: Social proof (friend going), capacity indicator
**Apple Calendar approach**: Travel time consideration, conflict detection

### Specific Recommendations

1. **Attendee preview**
   ```tsx
   // Show who's going
   <div className="flex items-center gap-2 mt-3">
     <div className="flex -space-x-1.5">
       {attendees.slice(0, 3).map(a => (
         <Avatar key={a.id} size="xs" src={a.avatarUrl} className="ring-2 ring-[#0A0A09]" />
       ))}
       {attendees.length > 3 && (
         <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center ring-2 ring-[#0A0A09]">
           <span className="text-[10px]">+{attendees.length - 3}</span>
         </div>
       )}
     </div>
     {friendsGoing.length > 0 && (
       <span className="text-xs text-white/50">
         {friendsGoing[0].name} {friendsGoing.length > 1 && `and ${friendsGoing.length - 1} others`} going
       </span>
     )}
   </div>
   ```

2. **Full RSVP options**
   ```tsx
   <DropdownMenu>
     <DropdownMenuTrigger asChild>
       <Button variant="ghost" size="sm">
         {userRsvp === 'going' ? (
           <><Check className="w-4 h-4 mr-1" /> Going</>
         ) : userRsvp === 'maybe' ? (
           <><HelpCircle className="w-4 h-4 mr-1" /> Maybe</>
         ) : (
           'RSVP'
         )}
       </Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent>
       <DropdownMenuItem onClick={() => onRsvp('going')}>
         <Check className="w-4 h-4 mr-2" /> Going
       </DropdownMenuItem>
       <DropdownMenuItem onClick={() => onRsvp('maybe')}>
         <HelpCircle className="w-4 h-4 mr-2" /> Maybe
       </DropdownMenuItem>
       <DropdownMenuItem onClick={() => onRsvp('not_going')}>
         <X className="w-4 h-4 mr-2" /> Can't go
       </DropdownMenuItem>
     </DropdownMenuContent>
   </DropdownMenu>
   ```

3. **Add to calendar action**
   ```tsx
   <DropdownMenuItem onClick={() => addToCalendar(event, 'google')}>
     <Calendar className="w-4 h-4 mr-2" /> Add to Google Calendar
   </DropdownMenuItem>
   <DropdownMenuItem onClick={() => addToCalendar(event, 'apple')}>
     <Apple className="w-4 h-4 mr-2" /> Add to Apple Calendar
   </DropdownMenuItem>
   <DropdownMenuItem onClick={() => downloadIcs(event)}>
     <Download className="w-4 h-4 mr-2" /> Download .ics
   </DropdownMenuItem>
   ```

4. **Countdown timer for imminent events**
   ```tsx
   // For events starting in < 1 hour
   {minutesUntil < 60 && (
     <div className="flex items-center gap-1 text-xs font-mono text-[var(--color-gold)]">
       <Timer className="w-3 h-3" />
       {formatCountdown(event.startDate)} {/* "47:32" */}
     </div>
   )}
   ```

5. **Conflict indicator**
   ```tsx
   {hasConflict && (
     <div className="flex items-center gap-1 text-xs text-amber-400">
       <AlertTriangle className="w-3 h-3" />
       Conflicts with: {conflictingEvent.title}
     </div>
   )}
   ```

### Reference Patterns

- **Google Calendar**: Guest avatars, "Add" dropdown
- **Luma**: Social proof, countdown, share button
- **Cal.com**: Time zone display, conflict detection

---

## 10. Presence Animator

### Current Assessment

**What exists**:
- Online indicator: Green dot with `animate-pulse`
- Typing indicator: 3 dots with staggered opacity animation
- Members preview: Avatar stack with online dots
- Header online count: Green dot + count
- Activity timestamps: Static text

**What works**:
- Green for online is universally understood
- Typing dots animation is smooth
- Gold escalation for 3+ typists is nice touch

**What doesn't work**:
- All online users look identical (no "active here" vs "online elsewhere")
- No activity heartbeat (space feels static without live motion)
- Pulse animation is too subtle
- No "just joined" or "just left" indicators
- No space-level activity indicator in navigation

### 2026 Design Direction

**Discord approach**: Animated status icons, join/leave notifications
**Slack approach**: Status ring colors, typing with user faces
**Linear approach**: Live cursor presence, subtle activity indicators

### Specific Recommendations

1. **Presence hierarchy with distinct animations**
   ```tsx
   const PRESENCE_ANIMATIONS = {
     here: {
       // Active in this space: breathing glow
       animate: {
         boxShadow: [
           '0 0 0 0 rgba(34, 197, 94, 0.4)',
           '0 0 8px 2px rgba(34, 197, 94, 0.2)',
           '0 0 0 0 rgba(34, 197, 94, 0.4)',
         ],
       },
       transition: { duration: 2, repeat: Infinity },
     },
     online: {
       // Online elsewhere: static glow
       boxShadow: '0 0 4px rgba(34, 197, 94, 0.3)',
     },
     typing: {
       // Currently typing: rapid pulse
       animate: { scale: [1, 1.2, 1] },
       transition: { duration: 0.6, repeat: Infinity },
     },
   };
   ```

2. **Activity heartbeat strip**
   ```tsx
   // Show recent activity as visual heartbeat
   <div className="h-1 bg-white/[0.02] rounded-full overflow-hidden">
     <motion.div
       className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
       animate={{ x: ['-100%', '100%'] }}
       transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
     />
   </div>
   ```

3. **Join/leave toast notifications**
   ```tsx
   // Ephemeral notification when members join/leave
   useEffect(() => {
     const unsubscribe = onPresenceChange(spaceId, (event) => {
       if (event.type === 'join') {
         toast.custom((t) => (
           <div className="flex items-center gap-2 text-sm text-white/60">
             <Avatar size="xs" src={event.user.avatarUrl} />
             <span>{event.user.name} joined</span>
           </div>
         ), { duration: 2000 });
       }
     });
     return unsubscribe;
   }, [spaceId]);
   ```

4. **Typing indicator with faces**
   ```tsx
   // Show who's typing with avatars
   <div className="flex items-center gap-2">
     <div className="flex -space-x-1">
       {typingUsers.slice(0, 3).map(user => (
         <Avatar key={user.id} size="xs" src={user.avatarUrl} />
       ))}
     </div>
     <TypingDots count={typingUsers.length} />
   </div>
   ```

5. **Space-level activity indicator**
   ```tsx
   // In space card/list, show activity level
   <div className="relative">
     <SpaceAvatar src={space.avatarUrl} />
     {space.activityLevel === 'high' && (
       <motion.div
         className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--color-gold)]"
         animate={{ scale: [1, 1.3, 1] }}
         transition={{ duration: 1.5, repeat: Infinity }}
       />
     )}
   </div>
   ```

### Reference Patterns

- **Discord**: Streaming/gaming status indicators, animated badges
- **Figma**: Cursor presence with name labels
- **Notion**: "Currently viewing" indicators

---

## 11. Join Flow Choreographer

### Current Assessment

**What exists** (from `ThresholdView.tsx`, `GatheringThreshold.tsx`, `JoinCeremony.tsx`):
- Split layout: 60% space identity, 40% activity preview
- Activity preview behind glass barrier (blur effect)
- Familiar faces section (mutual connections)
- "Join" CTA in gold
- Error handling with inline display
- Gathering threshold for pre-launch spaces (quorum progress)
- Post-join toast notification

**What works**:
- Glass barrier metaphor communicates "inside/outside"
- Familiar faces builds social proof
- Quorum progress gamifies early adoption
- Split layout is visually balanced

**What doesn't work**:
- No preview of actual messages (just counts)
- No "what you'll see" teaser
- Join success feels abrupt (just closes threshold)
- No onboarding for first-time space experience
- No pending join request flow for private spaces

### 2026 Design Direction

**Discord approach**: Server preview with sample messages, animated join celebration
**Slack approach**: Channel preview, onboarding checklist
**Clubhouse approach**: "Rooms you might like" social suggestions

### Specific Recommendations

1. **Message preview behind glass**
   ```tsx
   <GlassBarrier>
     <div className="space-y-3 opacity-60 blur-[1px]">
       {previewMessages.slice(0, 3).map(msg => (
         <div key={msg.id} className="flex items-start gap-2">
           <Avatar size="xs" />
           <div>
             <span className="text-xs font-medium">{msg.authorName}</span>
             <p className="text-xs text-white/50">{msg.content.slice(0, 80)}...</p>
           </div>
         </div>
       ))}
     </div>
     <div className="absolute inset-0 flex items-center justify-center">
       <span className="text-sm text-white/40">Join to read more</span>
     </div>
   </GlassBarrier>
   ```

2. **Join celebration animation**
   ```tsx
   const handleJoin = async () => {
     await joinSpace();
     // Confetti or success animation
     confetti({
       particleCount: 50,
       spread: 60,
       origin: { y: 0.7 },
       colors: ['#FFD700', '#FFFFFF'],
     });
     // Brief success state before transitioning
     setShowSuccess(true);
     await delay(1500);
     setShowSuccess(false);
   };

   {showSuccess && (
     <motion.div
       initial={{ opacity: 0, scale: 0.8 }}
       animate={{ opacity: 1, scale: 1 }}
       className="absolute inset-0 flex items-center justify-center bg-black/80 z-50"
     >
       <div className="text-center">
         <motion.div
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           transition={{ type: 'spring', bounce: 0.5 }}
         >
           <Check className="w-16 h-16 text-[var(--color-gold)] mx-auto" />
         </motion.div>
         <h2 className="text-xl font-semibold mt-4">Welcome to {space.name}!</h2>
       </div>
     </motion.div>
   )}
   ```

3. **First-time space onboarding**
   ```tsx
   // Show after join for new members
   {showOnboarding && (
     <SpaceOnboardingModal
       space={space}
       steps={[
         {
           title: 'Say hello in #general',
           description: 'Introduce yourself to the community',
           action: () => scrollToInput(),
         },
         {
           title: 'Check upcoming events',
           description: 'See what\'s happening soon',
           action: () => setActiveBoard('events'),
         },
         {
           title: 'Explore tools',
           description: 'Discover what this space has built',
           action: () => setShowTools(true),
         },
       ]}
       onComplete={() => setShowOnboarding(false)}
       onSkip={() => {
         setShowOnboarding(false);
         localStorage.setItem(`onboarding-${space.id}`, 'skipped');
       }}
     />
   )}
   ```

4. **Private space request flow**
   ```tsx
   // For spaces requiring approval
   {space.isPrivate && !isMember && (
     <div className="space-y-4">
       <p className="text-white/50">This space requires approval to join.</p>
       {pendingRequest ? (
         <div className="flex items-center gap-2 text-white/60">
           <Clock className="w-4 h-4" />
           Request pending since {formatDate(pendingRequest.createdAt)}
         </div>
       ) : (
         <>
           <textarea
             placeholder="Why do you want to join? (optional)"
             value={requestMessage}
             onChange={(e) => setRequestMessage(e.target.value)}
             className="w-full p-3 rounded-lg bg-white/[0.04] border border-white/[0.06]"
           />
           <Button variant="cta" onClick={submitJoinRequest}>
             Request to Join
           </Button>
         </>
       )}
     </div>
   )}
   ```

### Reference Patterns

- **Discord**: Server preview, splash screen on join
- **Slack**: "You're in!" celebration, suggested channels
- **Reddit**: Community onboarding rules acknowledgment

---

## 12. Message Composer

### Current Assessment

**What exists** (from `ChatInput.tsx`):
- Auto-resizing textarea (40-120px height)
- Image attachment with preview
- File upload to Firebase Storage
- Send button (gold CTA)
- Enter to send, Shift+Enter for newline
- Typing indicator integration
- Placeholder with board name

**What works**:
- Auto-resize is smooth
- Attachment preview is clear
- Send shortcut is standard

**What doesn't work**:
- No markdown preview
- No mention autocomplete (@user)
- No emoji picker
- No formatting toolbar
- No drag-and-drop upload
- No paste-to-upload
- No character limit indicator
- No draft persistence

### 2026 Design Direction

**Slack approach**: Full formatting toolbar, slash commands, file drag
**Discord approach**: Emoji picker, GIF search, markdown preview
**iMessage approach**: Media picker, effects

### Specific Recommendations

1. **Mention autocomplete**
   ```tsx
   // Trigger on @ character
   const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
     const value = e.target.value;
     setValue(value);

     // Check for @mention trigger
     const mentionMatch = value.match(/@(\w*)$/);
     if (mentionMatch) {
       setMentionQuery(mentionMatch[1]);
       setShowMentionPicker(true);
     } else {
       setShowMentionPicker(false);
     }
   };

   {showMentionPicker && (
     <MentionPicker
       query={mentionQuery}
       members={filteredMembers}
       onSelect={(member) => {
         insertMention(member);
         setShowMentionPicker(false);
       }}
     />
   )}
   ```

2. **Formatting toolbar**
   ```tsx
   <div className="flex items-center gap-1 px-2 py-1 border-b border-white/[0.06]">
     <button onClick={() => format('bold')} title="Bold (Cmd+B)">
       <Bold className="w-4 h-4" />
     </button>
     <button onClick={() => format('italic')} title="Italic (Cmd+I)">
       <Italic className="w-4 h-4" />
     </button>
     <button onClick={() => format('code')} title="Code">
       <Code className="w-4 h-4" />
     </button>
     <div className="w-px h-4 bg-white/[0.06]" />
     <button onClick={() => setShowEmojiPicker(true)} title="Emoji">
       <Smile className="w-4 h-4" />
     </button>
     <button onClick={() => fileInputRef.current?.click()} title="Attach file">
       <Paperclip className="w-4 h-4" />
     </button>
   </div>
   ```

3. **Drag-and-drop + paste upload**
   ```tsx
   const handleDrop = (e: React.DragEvent) => {
     e.preventDefault();
     const files = Array.from(e.dataTransfer.files);
     files.forEach(uploadFile);
   };

   const handlePaste = (e: React.ClipboardEvent) => {
     const items = Array.from(e.clipboardData.items);
     const imageItem = items.find(item => item.type.startsWith('image/'));
     if (imageItem) {
       e.preventDefault();
       const file = imageItem.getAsFile();
       if (file) uploadFile(file);
     }
   };

   <div
     onDrop={handleDrop}
     onDragOver={(e) => e.preventDefault()}
     onPaste={handlePaste}
   >
     <textarea />
   </div>
   ```

4. **Draft persistence**
   ```tsx
   // Save draft on change
   useEffect(() => {
     const timer = setTimeout(() => {
       if (value.trim()) {
         localStorage.setItem(`draft-${spaceId}-${boardId}`, value);
       } else {
         localStorage.removeItem(`draft-${spaceId}-${boardId}`);
       }
     }, 500);
     return () => clearTimeout(timer);
   }, [value, spaceId, boardId]);

   // Restore draft on mount
   useEffect(() => {
     const draft = localStorage.getItem(`draft-${spaceId}-${boardId}`);
     if (draft) setValue(draft);
   }, [spaceId, boardId]);
   ```

5. **Character limit indicator**
   ```tsx
   const MAX_LENGTH = 4000;
   const remaining = MAX_LENGTH - value.length;

   {value.length > MAX_LENGTH * 0.8 && (
     <span className={cn(
       "text-xs",
       remaining < 0 ? "text-red-400" : "text-white/30"
     )}>
       {remaining}
     </span>
   )}
   ```

### Reference Patterns

- **Slack**: Full rich text editor, slash commands
- **Discord**: Emoji/GIF pickers, markdown preview
- **Notion**: Slash commands, block types

---

## 13. Empty Space Designer

### Current Assessment

**What exists** (from `BoardEmptyState.tsx`):
- Board-type-specific empty states (general, announcements, events, resources)
- Icon + title + subtitle + CTA pattern
- Leader-specific CTA for announcements
- Motion entrance animation

**What works**:
- Contextual messaging per board type
- Leader-specific differentiation
- Clear CTA focus

**What doesn't work**:
- All empty states use same icon size/style
- No suggested actions beyond single CTA
- No social proof ("3 other members online")
- No time-based prompts ("Good morning!")
- Empty space (no members) vs empty board (no messages) use same pattern

### 2026 Design Direction

**Linear approach**: Keyboard shortcut hints in empty states
**Notion approach**: Template suggestions, /command hints
**Discord approach**: Social prompt ("Sarah is typing...")

### Specific Recommendations

1. **Time-aware prompts**
   ```tsx
   const getGreeting = () => {
     const hour = new Date().getHours();
     if (hour < 12) return 'Good morning';
     if (hour < 17) return 'Good afternoon';
     return 'Good evening';
   };

   // In empty state
   <p className="text-white/40">
     {getGreeting()}! Start the conversation.
   </p>
   ```

2. **Social proof in empty states**
   ```tsx
   {onlineMembers.length > 0 && (
     <div className="flex items-center gap-2 mt-4">
       <div className="flex -space-x-1">
         {onlineMembers.slice(0, 3).map(m => (
           <Avatar key={m.id} size="xs" src={m.avatarUrl} />
         ))}
       </div>
       <span className="text-xs text-white/40">
         {onlineMembers[0].name} {onlineMembers.length > 1 && `and ${onlineMembers.length - 1} others`} online
       </span>
     </div>
   )}
   ```

3. **Multi-action suggestions**
   ```tsx
   <div className="flex flex-wrap gap-2 justify-center mt-6">
     <Button variant="ghost" size="sm" onClick={() => focusInput()}>
       <MessageCircle className="w-4 h-4 mr-1" />
       Send a message
     </Button>
     {isLeader && (
       <Button variant="ghost" size="sm" onClick={() => setShowEventModal(true)}>
         <Calendar className="w-4 h-4 mr-1" />
         Create an event
       </Button>
     )}
     <Button variant="ghost" size="sm" onClick={() => setShowInviteModal(true)}>
       <UserPlus className="w-4 h-4 mr-1" />
       Invite members
     </Button>
   </div>
   ```

4. **Keyboard hint**
   ```tsx
   <p className="text-xs text-white/20 mt-4">
     Press <kbd className="px-1 py-0.5 rounded bg-white/[0.06]">Enter</kbd> to start typing
   </p>
   ```

5. **Different empty state for brand new space**
   ```tsx
   {isBrandNewSpace && (
     <div className="text-center py-16">
       <Sparkles className="w-12 h-12 text-[var(--color-gold)] mx-auto mb-4" />
       <h3 className="text-lg font-medium mb-2">Your space is ready!</h3>
       <p className="text-white/50 mb-6 max-w-sm mx-auto">
         You're the founding member. Invite others to build something great together.
       </p>
       <div className="flex gap-3 justify-center">
         <Button variant="cta" onClick={() => setShowInviteModal(true)}>
           Invite Members
         </Button>
         <Button variant="ghost" onClick={() => focusInput()}>
           Post First Message
         </Button>
       </div>
     </div>
   )}
   ```

### Reference Patterns

- **Linear**: Onboarding checklist in empty project
- **Notion**: "Press / for commands" hint
- **Discord**: Server setup checklist for new servers

---

## 14. Active Space Enhancer

### Current Assessment

**What exists**:
- Message feed with author grouping
- "Scroll to latest" button when not at bottom
- Unread divider with count
- Typing indicator above input
- Online member count in header
- Energy dots (1-3 based on activity)

**What works**:
- Author grouping reduces noise
- Unread divider is helpful
- "Scroll to latest" prevents disorientation

**What doesn't work**:
- No message batching during rapid fire
- No "X new messages" banner while scrolled up
- No activity summary ("50 messages while you were away")
- No smart notifications (only show if mentioned)
- No thread activity indicator in sidebar

### 2026 Design Direction

**Slack approach**: "X new messages" banner, smart notifications
**Discord approach**: Mention highlighting, @everyone/@here
**Linear approach**: Activity feed sidebar, filter by type

### Specific Recommendations

1. **New messages banner**
   ```tsx
   // Current: just "Scroll to latest"

   // Proposed: show count when scrolled up
   {!isAtBottom && newMessageCount > 0 && (
     <motion.button
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       className="sticky bottom-4 mx-auto flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-gold)] text-black text-sm font-medium shadow-lg"
       onClick={scrollToBottom}
     >
       <ArrowDown className="w-4 h-4" />
       {newMessageCount} new {newMessageCount === 1 ? 'message' : 'messages'}
     </motion.button>
   )}
   ```

2. **Message batching during rapid fire**
   ```tsx
   // Batch messages arriving within 500ms
   const [messageQueue, setMessageQueue] = useState<Message[]>([]);

   useEffect(() => {
     if (messageQueue.length === 0) return;

     const timer = setTimeout(() => {
       setMessages(prev => [...prev, ...messageQueue]);
       setMessageQueue([]);
     }, 500);

     return () => clearTimeout(timer);
   }, [messageQueue]);
   ```

3. **Mention highlighting**
   ```tsx
   // Highlight messages that mention current user
   const highlightMentions = (content: string) => {
     return content.replace(
       new RegExp(`@${currentUser.handle}`, 'gi'),
       `<mark class="bg-[var(--color-gold)]/20 px-1 rounded">@${currentUser.handle}</mark>`
     );
   };

   <p dangerouslySetInnerHTML={{ __html: highlightMentions(message.content) }} />
   ```

4. **Activity summary for returning users**
   ```tsx
   // On mount, if >24h since last visit
   {showReturningSummary && (
     <div className="p-4 mx-4 mt-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
       <h4 className="text-sm font-medium mb-2">While you were away...</h4>
       <ul className="space-y-1 text-sm text-white/60">
         <li>{newMessagesSinceLastVisit} new messages</li>
         {mentionsCount > 0 && <li className="text-[var(--color-gold)]">{mentionsCount} mentions</li>}
         {newEventCount > 0 && <li>{newEventCount} new events</li>}
       </ul>
       <Button variant="ghost" size="sm" className="mt-2" onClick={dismissSummary}>
         Got it
       </Button>
     </div>
   )}
   ```

5. **Thread activity in sidebar**
   ```tsx
   // In boards list, show active threads
   {board.activeThreads > 0 && (
     <span className="text-xs text-white/30">
       {board.activeThreads} active thread{board.activeThreads !== 1 && 's'}
     </span>
   )}
   ```

### Reference Patterns

- **Slack**: "X new messages" pill, "Mark as read" action
- **Discord**: @mention notification, unread bar
- **Teams**: Activity feed with filters

---

## 15. Mobile Space Experience

### Current Assessment

**What exists**:
- Mobile detection at 768px breakpoint
- Sidebar collapses to bottom sheet (80% max height)
- Touch-friendly 36px board items
- Mobile action bar component exists

**What works**:
- Bottom sheet pattern is native-feeling
- Breakpoint is appropriate

**What doesn't work**:
- No swipe gestures (swipe back, swipe to reply)
- Sidebar sheet has no peek state (all or nothing)
- Input keyboard handling not optimized
- No haptic feedback
- Thread panel takes over entire screen
- No landscape optimization

### 2026 Design Direction

**iMessage approach**: Swipe to reply, haptics, smooth keyboard transitions
**Discord approach**: Bottom tab bar, hold-to-react
**Slack approach**: Slide-over panels, native-feeling navigation

### Specific Recommendations

1. **Swipe gestures**
   ```tsx
   import { useSwipeable } from 'react-swipeable';

   const swipeHandlers = useSwipeable({
     onSwipedRight: () => navigateBack(),
     onSwipedLeft: (e) => {
       if (e.event.target === messageRef.current) {
         setReplyTo(message.id);
       }
     },
     delta: 50,
   });

   <div {...swipeHandlers}>
     <MessageItem ref={messageRef} />
   </div>
   ```

2. **Peek-able sidebar sheet**
   ```tsx
   <Sheet snapPoints={['15%', '50%', '95%']} defaultSnap="15%">
     <SheetContent>
       {/* 15%: Just header + online count */}
       {/* 50%: Boards list */}
       {/* 95%: Full sidebar */}
     </SheetContent>
   </Sheet>
   ```

3. **Keyboard-aware input**
   ```tsx
   // Adjust layout when keyboard opens
   useEffect(() => {
     if (window.visualViewport) {
       const handleResize = () => {
         const keyboardHeight = window.innerHeight - window.visualViewport.height;
         document.documentElement.style.setProperty(
           '--keyboard-height',
           `${keyboardHeight}px`
         );
       };
       window.visualViewport.addEventListener('resize', handleResize);
       return () => window.visualViewport.removeEventListener('resize', handleResize);
     }
   }, []);

   // In CSS
   .input-area {
     padding-bottom: calc(16px + var(--keyboard-height, 0px));
   }
   ```

4. **Hold-to-react pattern**
   ```tsx
   import { useLongPress } from 'use-long-press';

   const bind = useLongPress(() => {
     hapticFeedback('medium');
     setShowReactionPicker(true);
   }, { threshold: 500 });

   <MessageItem {...bind()} />
   ```

5. **Mobile-specific thread UI**
   ```tsx
   // Instead of slide-over, use full-screen with back nav
   {activeThread && isMobile && (
     <div className="fixed inset-0 z-50 bg-[#0A0A09]">
       <header className="flex items-center gap-3 px-4 h-14 border-b border-white/[0.06]">
         <button onClick={closeThread}>
           <ChevronLeft className="w-6 h-6" />
         </button>
         <span className="font-medium">Thread</span>
       </header>
       <ThreadPanel thread={activeThread} />
     </div>
   )}
   ```

6. **Bottom navigation for mobile**
   ```tsx
   // Replace sidebar with bottom tabs on mobile
   {isMobile && (
     <nav className="fixed bottom-0 left-0 right-0 h-14 bg-[#0A0A09] border-t border-white/[0.06] flex items-center justify-around z-40">
       <button onClick={() => setView('chat')}>
         <MessageCircle className={cn(view === 'chat' && 'text-white')} />
       </button>
       <button onClick={() => setView('events')}>
         <Calendar className={cn(view === 'events' && 'text-white')} />
       </button>
       <button onClick={() => setView('members')}>
         <Users className={cn(view === 'members' && 'text-white')} />
       </button>
       <button onClick={() => setView('settings')}>
         <Settings className={cn(view === 'settings' && 'text-white')} />
       </button>
     </nav>
   )}
   ```

### Reference Patterns

- **iMessage**: Swipe-back, keyboard handling, effects
- **Discord**: Bottom tabs, long-press reactions
- **Slack**: Full-screen threads, native navigation feel

---

## Implementation Priority

### P0 - Ship Blockers
1. Mobile keyboard handling (users can't type comfortably)
2. Mention autocomplete (core collaboration feature)
3. Message delivery status (users don't know if message sent)

### P1 - Week 1
4. Presence hierarchy (here vs online elsewhere)
5. Board type icons (visual differentiation)
6. Full emoji picker (replace quick emoji only)
7. New messages banner when scrolled up

### P2 - Week 2
8. Swipe gestures for mobile
9. Message context menu (right-click actions)
10. Draft persistence
11. Activity summary for returning users

### P3 - Week 3
12. Join celebration animation
13. First-time space onboarding
14. Hover profile cards
15. Thread activity in sidebar

### P4 - Polish
16. Formatting toolbar
17. Drag-and-drop file upload
18. Color-based activity indicators
19. Haptic feedback
20. Collapsible sidebar with resize

---

## Design Token Updates Required

```typescript
// packages/tokens/src/spaces.ts additions

// Presence colors
export const PRESENCE_COLORS = {
  here: '#22C55E',           // Bright green
  online: '#22C55E',         // Same green, no glow
  away: '#F59E0B',           // Amber
  recently: 'rgba(245, 158, 11, 0.6)', // Faded amber
  offline: 'rgba(255, 255, 255, 0.1)', // Gray
};

// Activity levels
export const ACTIVITY_LEVELS = {
  busy: { threshold: 20, color: 'rgba(255, 215, 0, 0.15)' },
  active: { threshold: 5, color: 'transparent' },
  quiet: { threshold: 1, color: 'transparent' },
  dead: { threshold: 0, color: 'rgba(255, 255, 255, 0.02)' },
};

// Mobile breakpoints
export const MOBILE_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  toggleSidebar: 'cmd+\\',
  toggleThread: 'cmd+shift+\\',
  quickSwitcher: 'cmd+k',
  search: 'cmd+f',
  newMessage: 'cmd+n',
  navigateUp: 'k',
  navigateDown: 'j',
  react: 'r',
  reply: 't',
};
```

---

## Files to Create/Modify

### New Components
- `MentionPicker.tsx` - @mention autocomplete
- `EmojiPicker.tsx` - Full emoji picker wrapper
- `MessageContextMenu.tsx` - Right-click actions
- `QuickSwitcher.tsx` - Cmd+K board/space switcher
- `ProfileMiniCard.tsx` - Hover profile preview
- `MobileBottomNav.tsx` - Bottom tab bar
- `ActivitySummary.tsx` - "While you were away"

### Modified Components
- `MessageItem.tsx` - Add delivery status, context menu
- `ChatInput.tsx` - Add mention autocomplete, formatting, draft persistence
- `MessageFeed.tsx` - Add new messages banner, batching
- `MembersList.tsx` - Add presence hierarchy, quick actions
- `BoardItem.tsx` - Add type icons, hover preview
- `SpaceLayout.tsx` - Add collapsible sidebar, thread panel slot
- `TypingIndicator.tsx` - Add avatar faces

---

## Conclusion

The HIVE Spaces system has a solid architectural foundation. The Linear-inspired split panel, comprehensive design tokens, and motion system provide a strong base. The primary opportunities are:

1. **Warmth** - Add iMessage-like personality to chat (delivery status, reactions, gestures)
2. **Presence** - Make spaces feel alive with better activity indicators
3. **Discovery** - Command palette, keyboard shortcuts, hover previews
4. **Mobile** - Native-feeling gestures, bottom navigation, keyboard handling
5. **Onboarding** - Celebration moments, guided first actions

The recommendations prioritize functionality over decoration. Each change should make the space feel more alive, more connected, and more campus-native.
