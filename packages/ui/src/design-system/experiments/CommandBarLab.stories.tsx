import type { Meta, StoryObj } from '@storybook/react';
import { cn } from '../../lib/utils';

// ============================================
// LOCKED PRIMITIVES ONLY
// ============================================
import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';
import { Mono } from '../primitives/Mono';
import { Badge } from '../primitives/Badge';
import { Avatar, AvatarFallback, getInitials } from '../primitives/Avatar';
import { PresenceDot } from '../primitives/PresenceDot';
import { Separator } from '../primitives/Separator';
import { Label } from '../primitives/Label';

const meta: Meta = {
  title: 'Experiments/CommandBar Lab',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * COMPONENT: CommandBar
 * STATUS: IN LAB — Awaiting Jacob's selection
 * CONTEXT: Desktop/Web — keyboard-first, hover states matter
 *
 * WORLDVIEW CONTEXT:
 * CommandBar is the keyboard-first navigation system (⌘K).
 * Inspired by: Linear, Raycast, Spotlight, VS Code command palette.
 *
 * Key principles:
 * - Keyboard-first: Arrow keys, Enter, Escape
 * - Frecency: Results sorted by frequency + recency
 * - Categories: Spaces, People, Tools, Actions
 * - Fast: <100ms response feel
 * - Minimal chrome: Content-forward, not UI-forward
 *
 * Variables to test:
 * 1. Container Style — Modal overlay vs floating vs inline
 * 2. Search Input — Icon placement, placeholder, border
 * 3. Result Grouping — By type, flat list, recency
 * 4. Keyboard Hints — Visibility and styling
 */

// ============================================
// MOCK DATA
// ============================================

interface SearchResult {
  id: string;
  type: 'space' | 'person' | 'tool' | 'action';
  title: string;
  subtitle?: string;
  isOnline?: boolean;
  shortcut?: string;
}

const mockResults: SearchResult[] = [
  { id: '1', type: 'space', title: 'UB Computer Science', subtitle: '1,247 members' },
  { id: '2', type: 'space', title: 'Photography Club', subtitle: '342 members' },
  { id: '3', type: 'person', title: 'Sarah Chen', subtitle: '@sarahc', isOnline: true },
  { id: '4', type: 'person', title: 'Mike Rodriguez', subtitle: '@miker', isOnline: false },
  { id: '5', type: 'tool', title: 'GPA Calculator', subtitle: 'Academic • 2.4k uses' },
  { id: '6', type: 'tool', title: 'Room Finder', subtitle: 'Housing • 1.1k uses' },
  { id: '7', type: 'action', title: 'Create New Space', shortcut: '⌘N' },
  { id: '8', type: 'action', title: 'Go to Settings', shortcut: '⌘,' },
];

// Type icons (text placeholders for demo)
const typeIcons: Record<string, string> = {
  space: '◈',
  person: '○',
  tool: '⚡',
  action: '→',
};

// ============================================
// VARIABLE 1: Container Style
// ============================================
/**
 * A: Modal Overlay — Centered modal with backdrop (Raycast/Spotlight style)
 * B: Floating Glass — Floating card, no backdrop (Linear style)
 * C: Dropdown — Attached to trigger, dropdown pattern
 * D: Full Modal — Large centered modal (VS Code style)
 */
export const Variable1_ContainerStyle: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <Text size="sm" muted>
        How should the command bar appear? Consider: focus, context preservation, speed feel.
      </Text>

      <div className="grid grid-cols-2 gap-8" style={{ width: '800px' }}>
        {/* A: Modal Overlay (Raycast) */}
        <div className="flex flex-col gap-2">
          <Text size="xs" muted>A: Modal Overlay (Raycast)</Text>
          <div className="relative h-[300px] rounded-xl bg-black/40 backdrop-blur-sm flex items-start justify-center pt-16">
            <Card elevation="floating" noPadding className="w-[480px] overflow-hidden">
              <div className="p-3 border-b border-white/5">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                  <Mono inline size="xs">⌘</Mono>
                  <Text size="sm" className="text-white/40">Search spaces, people, tools...</Text>
                </div>
              </div>
              <div className="p-2 max-h-[180px]">
                {mockResults.slice(0, 4).map((r, i) => (
                  <div
                    key={r.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                      i === 0 ? 'bg-white/10' : 'hover:bg-white/5'
                    )}
                  >
                    {r.type === 'person' ? (
                      <div className="relative">
                        <Avatar size="sm" className="rounded-lg">
                          <AvatarFallback size="sm" className="rounded-lg">
                            {getInitials(r.title)}
                          </AvatarFallback>
                        </Avatar>
                        {r.isOnline !== undefined && (
                          <PresenceDot
                            status={r.isOnline ? 'online' : 'offline'}
                            size="xs"
                            className="absolute -bottom-0.5 -right-0.5"
                            withRing
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                        {typeIcons[r.type]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Text size="sm" weight="medium" className="truncate">{r.title}</Text>
                      {r.subtitle && <Text size="xs" muted className="truncate">{r.subtitle}</Text>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* B: Floating Glass (Linear) */}
        <div className="flex flex-col gap-2">
          <Text size="xs" muted>B: Floating Glass (Linear)</Text>
          <div className="relative h-[300px] rounded-xl bg-[var(--bg-ground)] flex items-start justify-center pt-16">
            <Card elevation="floating" noPadding className="w-[480px] overflow-hidden shadow-2xl">
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <Mono inline size="xs">⌘</Mono>
                  <input
                    type="text"
                    placeholder="Type a command or search..."
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                  />
                </div>
              </div>
              <Separator />
              <div className="p-2 max-h-[180px]">
                {mockResults.slice(0, 4).map((r, i) => (
                  <div
                    key={r.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                      i === 0 ? 'bg-white/10' : 'hover:bg-white/5'
                    )}
                  >
                    {r.type === 'person' ? (
                      <div className="relative">
                        <Avatar size="sm" className="rounded-lg">
                          <AvatarFallback size="sm" className="rounded-lg">
                            {getInitials(r.title)}
                          </AvatarFallback>
                        </Avatar>
                        {r.isOnline !== undefined && (
                          <PresenceDot
                            status={r.isOnline ? 'online' : 'offline'}
                            size="xs"
                            className="absolute -bottom-0.5 -right-0.5"
                            withRing
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                        {typeIcons[r.type]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Text size="sm" weight="medium" className="truncate">{r.title}</Text>
                      {r.subtitle && <Text size="xs" muted className="truncate">{r.subtitle}</Text>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* C: Dropdown */}
        <div className="flex flex-col gap-2">
          <Text size="xs" muted>C: Dropdown</Text>
          <div className="relative h-[300px] rounded-xl bg-[var(--bg-ground)] p-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 w-[300px]">
              <Mono inline size="xs">⌘K</Mono>
              <Text size="sm" className="text-white/40">Search...</Text>
            </div>
            <Card elevation="raised" noPadding className="w-[300px] mt-2 overflow-hidden">
              <div className="p-2">
                {mockResults.slice(0, 3).map((r, i) => (
                  <div
                    key={r.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                      i === 0 ? 'bg-white/10' : 'hover:bg-white/5'
                    )}
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/50 text-sm">
                      {typeIcons[r.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text size="sm" weight="medium" className="truncate">{r.title}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* D: Full Modal */}
        <div className="flex flex-col gap-2">
          <Text size="xs" muted>D: Full Modal</Text>
          <div className="relative h-[300px] rounded-xl bg-black/60 backdrop-blur-md flex items-start justify-center pt-12">
            <Card elevation="floating" noPadding className="w-[560px] overflow-hidden">
              {/* Search input area */}
              <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center">
                    <Text size="xs" muted>⌘</Text>
                  </div>
                  <input
                    type="text"
                    placeholder="Search spaces, people, tools, or actions..."
                    className="flex-1 bg-transparent text-base text-white placeholder:text-white/30 outline-none"
                  />
                  <Mono inline size="xs">ESC</Mono>
                </div>
              </div>
              {/* Results */}
              <div className="p-2 max-h-[200px]">
                {mockResults.slice(0, 5).map((r, i) => (
                  <div
                    key={r.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                      i === 0 ? 'bg-white/10' : 'hover:bg-white/5'
                    )}
                  >
                    {r.type === 'person' ? (
                      <div className="relative">
                        <Avatar size="sm" className="rounded-lg">
                          <AvatarFallback size="sm" className="rounded-lg">
                            {getInitials(r.title)}
                          </AvatarFallback>
                        </Avatar>
                        {r.isOnline !== undefined && (
                          <PresenceDot
                            status={r.isOnline ? 'online' : 'offline'}
                            size="xs"
                            className="absolute -bottom-0.5 -right-0.5"
                            withRing
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                        {typeIcons[r.type]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Text size="sm" weight="medium" className="truncate">{r.title}</Text>
                      {r.subtitle && <Text size="xs" muted className="truncate">{r.subtitle}</Text>}
                    </div>
                    {r.shortcut && <Mono inline size="xs">{r.shortcut}</Mono>}
                  </div>
                ))}
              </div>
              {/* Footer hints */}
              <div className="px-4 py-2 border-t border-white/[0.06] flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Mono inline size="xs">↑↓</Mono>
                  <Text size="xs" muted>navigate</Text>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mono inline size="xs">↵</Mono>
                  <Text size="xs" muted>select</Text>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mono inline size="xs">esc</Mono>
                  <Text size="xs" muted>close</Text>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 2: Search Input Style
// ============================================
/**
 * A: Icon Left — Search icon on left (standard)
 * B: Shortcut Left — ⌘K badge on left (Linear)
 * C: Minimal — No icon, just placeholder
 * D: Integrated — Icon + shortcut hint
 */
export const Variable2_SearchInput: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <Text size="sm" muted>
        How should the search input look? This is the first thing users see.
      </Text>

      <div className="flex flex-col gap-6" style={{ width: '560px' }}>
        {/* A: Icon Left */}
        <div className="flex flex-col gap-2">
          <Text size="xs" muted>A: Icon Left</Text>
          <Card elevation="resting" noPadding>
            <div className="p-4 flex items-center gap-3">
              <Text size="lg" muted>🔍</Text>
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent text-base text-white placeholder:text-white/30 outline-none"
              />
            </div>
          </Card>
        </div>

        {/* B: Shortcut Left (Linear) */}
        <div className="flex flex-col gap-2">
          <Text size="xs" muted>B: Shortcut Left (Linear)</Text>
          <Card elevation="resting" noPadding>
            <div className="p-4 flex items-center gap-3">
              <Mono inline size="xs">⌘K</Mono>
              <input
                type="text"
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent text-base text-white placeholder:text-white/30 outline-none"
              />
            </div>
          </Card>
        </div>

        {/* C: Minimal */}
        <div className="flex flex-col gap-2">
          <Text size="xs" muted>C: Minimal</Text>
          <Card elevation="resting" noPadding>
            <div className="p-4">
              <input
                type="text"
                placeholder="What are you looking for?"
                className="w-full bg-transparent text-base text-white placeholder:text-white/40 outline-none"
              />
            </div>
          </Card>
        </div>

        {/* D: Integrated */}
        <div className="flex flex-col gap-2">
          <Text size="xs" muted>D: Integrated</Text>
          <Card elevation="resting" noPadding>
            <div className="p-4 flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                <Text size="xs" className="text-white/50">⌘</Text>
              </div>
              <input
                type="text"
                placeholder="Search spaces, people, tools..."
                className="flex-1 bg-transparent text-base text-white placeholder:text-white/30 outline-none"
              />
              <Mono size="xs" className="text-white/30">ESC</Mono>
            </div>
          </Card>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 3: Result Grouping
// ============================================
/**
 * A: Flat List — All results in one list, sorted by relevance
 * B: By Type — Grouped by category (Spaces, People, Tools, Actions)
 * C: By Recency — Recent first, then suggestions
 * D: Smart Groups — Type headers only when multiple
 */
export const Variable3_ResultGrouping: Story = {
  render: () => {
    const spaces = mockResults.filter(r => r.type === 'space');
    const people = mockResults.filter(r => r.type === 'person');
    const tools = mockResults.filter(r => r.type === 'tool');

    return (
      <div className="flex flex-col gap-8 p-8">
        <Text size="sm" muted>
          How should results be organized? Consider: scan speed, discoverability, cognitive load.
        </Text>

        <div className="grid grid-cols-2 gap-6" style={{ width: '720px' }}>
          {/* A: Flat List */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>A: Flat List</Text>
            <Card elevation="resting" noPadding className="overflow-hidden">
              <div className="p-2">
                {mockResults.slice(0, 6).map((r, i) => (
                  <div
                    key={r.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                      i === 0 ? 'bg-white/10' : 'hover:bg-white/5'
                    )}
                  >
                    {r.type === 'person' ? (
                      <div className="relative">
                        <Avatar size="sm" className="rounded-lg">
                          <AvatarFallback size="sm" className="rounded-lg">
                            {getInitials(r.title)}
                          </AvatarFallback>
                        </Avatar>
                        {r.isOnline !== undefined && (
                          <PresenceDot
                            status={r.isOnline ? 'online' : 'offline'}
                            size="xs"
                            className="absolute -bottom-0.5 -right-0.5"
                            withRing
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                        {typeIcons[r.type]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Text size="sm" weight="medium" className="truncate">{r.title}</Text>
                      {r.subtitle && <Text size="xs" muted className="truncate">{r.subtitle}</Text>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* B: By Type */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>B: By Type</Text>
            <Card elevation="resting" noPadding className="overflow-hidden">
              <div className="p-2">
                <Label size="xs" className="px-3 py-1.5 uppercase tracking-wider text-white/40">Spaces</Label>
                {spaces.map((r, i) => (
                  <div
                    key={r.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                      i === 0 ? 'bg-white/10' : 'hover:bg-white/5'
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                      {typeIcons[r.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text size="sm" weight="medium" className="truncate">{r.title}</Text>
                      {r.subtitle && <Text size="xs" muted className="truncate">{r.subtitle}</Text>}
                    </div>
                  </div>
                ))}
                <Label size="xs" className="px-3 py-1.5 uppercase tracking-wider text-white/40 mt-2">People</Label>
                {people.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-white/5"
                  >
                    <div className="relative">
                      <Avatar size="sm" className="rounded-lg">
                        <AvatarFallback size="sm" className="rounded-lg">
                          {getInitials(r.title)}
                        </AvatarFallback>
                      </Avatar>
                      {r.isOnline !== undefined && (
                        <PresenceDot
                          status={r.isOnline ? 'online' : 'offline'}
                          size="xs"
                          className="absolute -bottom-0.5 -right-0.5"
                          withRing
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text size="sm" weight="medium" className="truncate">{r.title}</Text>
                      {r.subtitle && <Text size="xs" muted className="truncate">{r.subtitle}</Text>}
                    </div>
                  </div>
                ))}
                <Label size="xs" className="px-3 py-1.5 uppercase tracking-wider text-white/40 mt-2">Tools</Label>
                {tools.slice(0, 1).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-white/5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                      {typeIcons[r.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text size="sm" weight="medium" className="truncate">{r.title}</Text>
                      {r.subtitle && <Text size="xs" muted className="truncate">{r.subtitle}</Text>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* C: By Recency */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>C: By Recency</Text>
            <Card elevation="resting" noPadding className="overflow-hidden">
              <div className="p-2">
                <Label size="xs" className="px-3 py-1.5 text-white/40">Recent</Label>
                {mockResults.slice(0, 3).map((r, i) => (
                  <div
                    key={r.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                      i === 0 ? 'bg-white/10' : 'hover:bg-white/5'
                    )}
                  >
                    {r.type === 'person' ? (
                      <div className="relative">
                        <Avatar size="sm" className="rounded-lg">
                          <AvatarFallback size="sm" className="rounded-lg">
                            {getInitials(r.title)}
                          </AvatarFallback>
                        </Avatar>
                        {r.isOnline !== undefined && (
                          <PresenceDot
                            status={r.isOnline ? 'online' : 'offline'}
                            size="xs"
                            className="absolute -bottom-0.5 -right-0.5"
                            withRing
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                        {typeIcons[r.type]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Text size="sm" weight="medium" className="truncate">{r.title}</Text>
                      {r.subtitle && <Text size="xs" muted className="truncate">{r.subtitle}</Text>}
                    </div>
                  </div>
                ))}
                <Separator className="my-2" />
                <Label size="xs" className="px-3 py-1.5 text-white/40">Suggestions</Label>
                {mockResults.slice(3, 5).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-white/5"
                  >
                    {r.type === 'person' ? (
                      <div className="relative">
                        <Avatar size="sm" className="rounded-lg">
                          <AvatarFallback size="sm" className="rounded-lg">
                            {getInitials(r.title)}
                          </AvatarFallback>
                        </Avatar>
                        {r.isOnline !== undefined && (
                          <PresenceDot
                            status={r.isOnline ? 'online' : 'offline'}
                            size="xs"
                            className="absolute -bottom-0.5 -right-0.5"
                            withRing
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                        {typeIcons[r.type]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Text size="sm" weight="medium" className="truncate">{r.title}</Text>
                      {r.subtitle && <Text size="xs" muted className="truncate">{r.subtitle}</Text>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* D: Smart Groups */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>D: Smart Groups</Text>
            <Card elevation="resting" noPadding className="overflow-hidden">
              <div className="p-2">
                {/* Show header only when multiple of same type */}
                <div className="flex items-center justify-between px-3 py-1.5">
                  <Label size="xs" className="uppercase tracking-wider text-white/40">Spaces</Label>
                  <Text size="xs" muted>2 results</Text>
                </div>
                {spaces.map((r, i) => (
                  <div
                    key={r.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                      i === 0 ? 'bg-white/10' : 'hover:bg-white/5'
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                      {typeIcons[r.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text size="sm" weight="medium" className="truncate">{r.title}</Text>
                      {r.subtitle && <Text size="xs" muted className="truncate">{r.subtitle}</Text>}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between px-3 py-1.5 mt-2">
                  <Label size="xs" className="uppercase tracking-wider text-white/40">People</Label>
                  <Text size="xs" muted>2 results</Text>
                </div>
                {people.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-white/5"
                  >
                    <div className="relative">
                      <Avatar size="sm" className="rounded-lg">
                        <AvatarFallback size="sm" className="rounded-lg">
                          {getInitials(r.title)}
                        </AvatarFallback>
                      </Avatar>
                      {r.isOnline !== undefined && (
                        <PresenceDot
                          status={r.isOnline ? 'online' : 'offline'}
                          size="xs"
                          className="absolute -bottom-0.5 -right-0.5"
                          withRing
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text size="sm" weight="medium" className="truncate">{r.title}</Text>
                      {r.subtitle && <Text size="xs" muted className="truncate">{r.subtitle}</Text>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// VARIABLE 4: Keyboard Hints
// ============================================
/**
 * A: Always Visible — Show all shortcuts in footer
 * B: Hover Reveal — Show on row hover only
 * C: Minimal — Only ESC visible
 * D: Contextual Footer — Navigation + action hints
 */
export const Variable4_KeyboardHints: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <Text size="sm" muted>
        How should keyboard shortcuts be displayed? Power users need them, new users shouldn't be overwhelmed.
      </Text>

      <div className="grid grid-cols-2 gap-6" style={{ width: '720px' }}>
        {/* A: Always Visible */}
        <div className="flex flex-col gap-2">
          <Text size="xs" muted>A: Always Visible</Text>
          <Card elevation="resting" noPadding className="overflow-hidden">
            <div className="p-2">
              {mockResults.slice(0, 4).map((r, i) => (
                <div
                  key={r.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                    i === 0 ? 'bg-white/10' : 'hover:bg-white/5'
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                    {typeIcons[r.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text size="sm" weight="medium">{r.title}</Text>
                  </div>
                  <Mono inline size="xs">⌘{i + 1}</Mono>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-white/[0.06] flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Mono inline size="xs">↑↓</Mono>
                <Text size="xs" muted>navigate</Text>
              </div>
              <div className="flex items-center gap-1.5">
                <Mono inline size="xs">↵</Mono>
                <Text size="xs" muted>open</Text>
              </div>
              <div className="flex items-center gap-1.5">
                <Mono inline size="xs">⌘↵</Mono>
                <Text size="xs" muted>new tab</Text>
              </div>
              <div className="flex items-center gap-1.5">
                <Mono inline size="xs">esc</Mono>
                <Text size="xs" muted>close</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* B: Hover Reveal */}
        <div className="flex flex-col gap-2">
          <Text size="xs" muted>B: Hover Reveal</Text>
          <Card elevation="resting" noPadding className="overflow-hidden">
            <div className="p-2">
              {mockResults.slice(0, 4).map((r, i) => (
                <div
                  key={r.id}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                    i === 0 ? 'bg-white/10' : 'hover:bg-white/5'
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                    {typeIcons[r.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text size="sm" weight="medium">{r.title}</Text>
                  </div>
                  <span className={cn(
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    i === 0 && 'opacity-100'
                  )}>
                    <Mono size="xs" className="text-white/30">↵</Mono>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* C: Minimal */}
        <div className="flex flex-col gap-2">
          <Text size="xs" muted>C: Minimal</Text>
          <Card elevation="resting" noPadding className="overflow-hidden">
            <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
              />
              <Mono size="xs" className="text-white/30">ESC</Mono>
            </div>
            <div className="p-2">
              {mockResults.slice(0, 4).map((r, i) => (
                <div
                  key={r.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                    i === 0 ? 'bg-white/10' : 'hover:bg-white/5'
                  )}
                >
                  {r.type === 'person' ? (
                    <div className="relative">
                      <Avatar size="sm" className="rounded-lg">
                        <AvatarFallback size="sm" className="rounded-lg">
                          {getInitials(r.title)}
                        </AvatarFallback>
                      </Avatar>
                      {r.isOnline !== undefined && (
                        <PresenceDot
                          status={r.isOnline ? 'online' : 'offline'}
                          size="xs"
                          className="absolute -bottom-0.5 -right-0.5"
                          withRing
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                      {typeIcons[r.type]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Text size="sm" weight="medium" className="truncate">{r.title}</Text>
                    {r.subtitle && <Text size="xs" muted className="truncate">{r.subtitle}</Text>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* D: Contextual Footer */}
        <div className="flex flex-col gap-2">
          <Text size="xs" muted>D: Contextual Footer</Text>
          <Card elevation="resting" noPadding className="overflow-hidden">
            <div className="p-2">
              {mockResults.slice(0, 4).map((r, i) => (
                <div
                  key={r.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                    i === 0 ? 'bg-white/10' : 'hover:bg-white/5'
                  )}
                >
                  {r.type === 'person' ? (
                    <div className="relative">
                      <Avatar size="sm" className="rounded-lg">
                        <AvatarFallback size="sm" className="rounded-lg">
                          {getInitials(r.title)}
                        </AvatarFallback>
                      </Avatar>
                      {r.isOnline !== undefined && (
                        <PresenceDot
                          status={r.isOnline ? 'online' : 'offline'}
                          size="xs"
                          className="absolute -bottom-0.5 -right-0.5"
                          withRing
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                      {typeIcons[r.type]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Text size="sm" weight="medium" className="truncate">{r.title}</Text>
                    {r.subtitle && <Text size="xs" muted className="truncate">{r.subtitle}</Text>}
                  </div>
                  {r.shortcut && <Mono inline size="xs">{r.shortcut}</Mono>}
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Mono inline size="xs">↑↓</Mono>
                  <Text size="xs" muted>navigate</Text>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mono inline size="xs">↵</Mono>
                  <Text size="xs" muted>select</Text>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Mono inline size="xs">esc</Mono>
                <Text size="xs" muted>close</Text>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  ),
};
