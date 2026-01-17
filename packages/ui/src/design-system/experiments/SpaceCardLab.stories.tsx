import type { Meta, StoryObj } from '@storybook/react';
import { cn } from '../../lib/utils';

// ============================================
// LOCKED PRIMITIVES (always import from here)
// ============================================
import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';
import { Badge } from '../primitives/Badge';
import { Avatar, AvatarImage, AvatarFallback, getInitials } from '../primitives/Avatar';
import { AvatarGroup } from '../primitives/AvatarGroup';
import { PresenceDot, PresenceWrapper } from '../primitives/PresenceDot';
import { ActivityEdge, getWarmthFromActiveUsers } from '../primitives/ActivityEdge';

const meta: Meta = {
  title: 'Experiments/SpaceCard Lab',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * COMPONENT: SpaceCard
 * STATUS: IN LAB — Awaiting Jacob's selection
 *
 * WORLDVIEW CONTEXT:
 * HIVE Spaces are NOT Discord servers, Slack channels, or Facebook groups.
 * They are STUDENT-OWNED COMMUNITY HUBS — founded by students, run by students.
 *
 * Key differentiators:
 * - Territory System: Spaces belong to categories (academic, creative, social, etc.)
 * - Living Communities: Active spaces glow with gold warmth
 * - Student Ownership: "Founded by" matters more than admin roles
 * - Tool Integration: Spaces can host HiveLab tools (creation, not just consumption)
 * - Connection Graph: "People you know" > raw member count
 *
 * Variables to test:
 * 1. Visual Identity — How spaces present themselves (logo, territory, banner)
 * 2. Activity Indicators — How we show a space is alive (warmth, presence, avatars)
 * 3. Information Density — What info matters at a glance
 * 4. Distinctive Layout — What makes HIVE spaces feel different
 */

// ============================================
// MOCK DATA
// ============================================

interface SpaceData {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  territory: 'academic' | 'creative' | 'social' | 'professional' | 'wellness';
  logo: string | null;
  banner: string | null;
  isActive: boolean;
  activeMembers: number;
  founders: Array<{ name: string; avatar: string | null; isOnline: boolean }>;
  mutualConnections: number;
  toolCount: number;
  recentActivity: string;
}

const mockSpaces: SpaceData[] = [
  {
    id: '1',
    name: 'UB Computer Science',
    description: 'Official CS department space for students, TAs, and faculty. Homework help, career advice, and memes.',
    memberCount: 1247,
    territory: 'academic',
    logo: null,
    banner: null,
    isActive: true,
    activeMembers: 89,
    founders: [
      { name: 'Sarah Chen', avatar: null, isOnline: true },
      { name: 'Mike Rodriguez', avatar: null, isOnline: false },
    ],
    mutualConnections: 12,
    toolCount: 3,
    recentActivity: '2 min ago',
  },
  {
    id: '2',
    name: 'Photography Club',
    description: 'Capture moments, share techniques, weekly photo walks across campus.',
    memberCount: 342,
    territory: 'creative',
    logo: null,
    banner: null,
    isActive: true,
    activeMembers: 23,
    founders: [{ name: 'Alex Kim', avatar: null, isOnline: true }],
    mutualConnections: 5,
    toolCount: 1,
    recentActivity: '5 min ago',
  },
  {
    id: '3',
    name: 'Startup Founders',
    description: 'Connect with fellow entrepreneurs building the future. Weekly pitch practice.',
    memberCount: 856,
    territory: 'professional',
    logo: null,
    banner: null,
    isActive: false,
    activeMembers: 0,
    founders: [
      { name: 'Jordan Lee', avatar: null, isOnline: false },
      { name: 'Taylor Park', avatar: null, isOnline: false },
    ],
    mutualConnections: 8,
    toolCount: 5,
    recentActivity: '3 hours ago',
  },
];

// ============================================
// TERRITORY SYSTEM
// Spaces belong to territories, each with distinct visual identity
// ============================================

const territoryConfig: Record<string, { gradient: string; color: string; label: string }> = {
  academic: {
    gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
    color: 'text-blue-400',
    label: 'Academic',
  },
  creative: {
    gradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
    color: 'text-purple-400',
    label: 'Creative',
  },
  social: {
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    color: 'text-amber-400',
    label: 'Social',
  },
  professional: {
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    color: 'text-emerald-400',
    label: 'Professional',
  },
  wellness: {
    gradient: 'from-rose-500/20 via-red-500/10 to-transparent',
    color: 'text-rose-400',
    label: 'Wellness',
  },
};

// ============================================
// VARIABLE 1: Visual Identity
// How spaces present themselves
// ============================================
/**
 * A: Logo Only — Clean, minimal (Discord-like)
 * B: Territory Gradient — Category-based identity (HIVE-specific)
 * C: Logo + Territory Badge — Combines both
 * D: Full Header — Logo + gradient + banner area (Recommended)
 */
export const Variable1_VisualIdentity: Story = {
  render: () => {
    const space = mockSpaces[0];
    const territory = territoryConfig[space.territory];

    return (
      <div className="flex flex-col gap-8 p-8">
        <Text size="sm" muted>
          How should spaces present their visual identity? Territory = category system
          (academic, creative, social, professional, wellness).
        </Text>

        <div className="grid grid-cols-2 gap-6" style={{ width: '640px' }}>
          {/* A: Logo Only */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>A: Logo Only</Text>
            <Card elevation="resting" interactive className="p-4">
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarFallback size="lg">{getInitials(space.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Text weight="medium" className="truncate">{space.name}</Text>
                  <Text size="sm" muted>{space.memberCount.toLocaleString()} members</Text>
                </div>
              </div>
            </Card>
          </div>

          {/* B: Territory Gradient */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>B: Territory Gradient</Text>
            <Card elevation="resting" interactive noPadding className="overflow-hidden">
              <div className={cn('h-12 bg-gradient-to-r', territory.gradient)} />
              <div className="p-4 -mt-4">
                <Avatar size="lg" className="border-2 border-[var(--bg-surface)]">
                  <AvatarFallback size="lg" className={territory.color}>
                    {getInitials(space.name)}
                  </AvatarFallback>
                </Avatar>
                <Text weight="medium" className="mt-2">{space.name}</Text>
                <Text size="sm" muted>{space.memberCount.toLocaleString()} members</Text>
              </div>
            </Card>
          </div>

          {/* C: Logo + Territory Badge */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>C: Logo + Territory Badge</Text>
            <Card elevation="resting" interactive className="p-4">
              <div className="flex items-start gap-3">
                <Avatar size="lg">
                  <AvatarFallback size="lg" className={territory.color}>
                    {getInitials(space.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Text weight="medium" className="truncate">{space.name}</Text>
                    <Badge variant="outline" size="sm" className={territory.color}>
                      {territory.label}
                    </Badge>
                  </div>
                  <Text size="sm" muted className="mt-1">
                    {space.memberCount.toLocaleString()} members
                  </Text>
                </div>
              </div>
            </Card>
          </div>

          {/* D: Full Header (Recommended) */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>D: Full Header (Recommended)</Text>
            <Card elevation="resting" interactive noPadding className="overflow-hidden">
              <div className={cn('h-16 bg-gradient-to-br', territory.gradient, 'relative')}>
                <Badge
                  variant="outline"
                  size="sm"
                  className={cn('absolute top-2 right-2', territory.color)}
                >
                  {territory.label}
                </Badge>
              </div>
              <div className="p-4 -mt-6">
                <Avatar size="lg" className="border-2 border-[var(--bg-surface)]">
                  <AvatarFallback size="lg" className={territory.color}>
                    {getInitials(space.name)}
                  </AvatarFallback>
                </Avatar>
                <Text weight="medium" className="mt-2">{space.name}</Text>
                <Text size="sm" muted className="line-clamp-2 mt-1">
                  {space.description}
                </Text>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// VARIABLE 2: Activity Indicators
// How we show a space is alive
// ============================================
/**
 * A: Card Warmth — Gold edge glow via Card primitive (Recommended)
 * B: Presence Dots — Show online founders via PresenceDot
 * C: Avatar Stack — Active members via AvatarGroup
 * D: Activity Edge — Wrapper component with activeUsers prop
 */
export const Variable2_ActivityIndicators: Story = {
  render: () => {
    const space = mockSpaces[0];
    const territory = territoryConfig[space.territory];
    const warmthLevel = getWarmthFromActiveUsers(space.activeMembers);

    return (
      <div className="flex flex-col gap-8 p-8">
        <Text size="sm" muted>
          How do we show a space has life? Active spaces should feel warm. Gold = life.
        </Text>

        <div className="grid grid-cols-2 gap-6" style={{ width: '640px' }}>
          {/* A: Card Warmth (using Card primitive warmth prop) */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>A: Card Warmth (Recommended)</Text>
            <Card
              elevation="resting"
              warmth={warmthLevel}
              interactive
              className="p-4"
            >
              <div className="flex items-start gap-3">
                <Avatar size="lg">
                  <AvatarFallback size="lg" className={territory.color}>
                    {getInitials(space.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Text weight="medium">{space.name}</Text>
                  <Text size="sm" muted className="mt-1">
                    {space.activeMembers} active now
                  </Text>
                </div>
              </div>
            </Card>
          </div>

          {/* B: Presence Dots on Founders */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>B: Presence Dots</Text>
            <Card elevation="resting" interactive className="p-4">
              <div className="flex items-start gap-3">
                <PresenceWrapper status={space.founders[0].isOnline ? 'online' : 'offline'}>
                  <Avatar size="lg">
                    <AvatarFallback size="lg" className={territory.color}>
                      {getInitials(space.name)}
                    </AvatarFallback>
                  </Avatar>
                </PresenceWrapper>
                <div className="flex-1 min-w-0">
                  <Text weight="medium">{space.name}</Text>
                  <div className="flex items-center gap-2 mt-1">
                    <PresenceDot status="online" size="sm" />
                    <Text size="xs" muted>
                      {space.founders.filter(f => f.isOnline).length} founder{space.founders.filter(f => f.isOnline).length !== 1 ? 's' : ''} online
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* C: Avatar Stack via AvatarGroup */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>C: Avatar Stack</Text>
            <Card elevation="resting" interactive className="p-4">
              <div className="flex items-start gap-3">
                <Avatar size="lg">
                  <AvatarFallback size="lg" className={territory.color}>
                    {getInitials(space.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Text weight="medium">{space.name}</Text>
                  <div className="flex items-center gap-2 mt-2">
                    <AvatarGroup
                      size="xs"
                      max={3}
                      users={space.founders.map(f => ({ name: f.name, src: f.avatar }))}
                    />
                    <Text size="xs" muted>
                      +{space.activeMembers} active
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* D: ActivityEdge wrapper */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>D: Activity Edge</Text>
            <ActivityEdge activeUsers={space.activeMembers} rounded="lg">
              <Card elevation="resting" interactive className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar size="lg">
                    <AvatarFallback size="lg" className={territory.color}>
                      {getInitials(space.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Text weight="medium">{space.name}</Text>
                    <Text size="sm" muted className="mt-1">
                      {space.activeMembers} active
                    </Text>
                  </div>
                </div>
              </Card>
            </ActivityEdge>
          </div>
        </div>

        {/* Show warmth levels for comparison */}
        <div className="flex flex-col gap-2">
          <Text size="xs" muted>Warmth levels comparison (hover to see interaction):</Text>
          <div className="flex gap-4">
            {(['none', 'low', 'medium', 'high'] as const).map((level) => (
              <Card key={level} elevation="resting" warmth={level} interactive className="p-3 w-24">
                <Text size="xs" className="text-center">{level}</Text>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// VARIABLE 3: Information Density
// What info matters at a glance
// ============================================
/**
 * HIVE Worldview: Connection > Raw Numbers
 * "12 people you know" is more meaningful than "1,247 members"
 *
 * A: Minimal — Logo + name only
 * B: Standard — + description + member count (Recommended)
 * C: Connection Focus — Emphasize mutuals and founders
 * D: Dense — All info including tools
 */
export const Variable3_InformationDensity: Story = {
  render: () => {
    const space = mockSpaces[0];
    const territory = territoryConfig[space.territory];
    const warmthLevel = getWarmthFromActiveUsers(space.activeMembers);

    return (
      <div className="flex flex-col gap-8 p-8">
        <Text size="sm" muted>
          What information matters at a glance? Consider: "12 people you know" vs "1,247 members"
        </Text>

        <div className="flex flex-col gap-6" style={{ width: '360px' }}>
          {/* A: Minimal */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>A: Minimal</Text>
            <Card elevation="resting" interactive className="p-3">
              <div className="flex items-center gap-3">
                <Avatar size="default">
                  <AvatarFallback className={territory.color}>
                    {getInitials(space.name)}
                  </AvatarFallback>
                </Avatar>
                <Text weight="medium" className="truncate">{space.name}</Text>
              </div>
            </Card>
          </div>

          {/* B: Standard (Recommended) */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>B: Standard (Recommended)</Text>
            <Card elevation="resting" warmth={warmthLevel} interactive className="p-4">
              <div className="flex items-start gap-3">
                <Avatar size="lg">
                  <AvatarFallback size="lg" className={territory.color}>
                    {getInitials(space.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Text weight="medium">{space.name}</Text>
                  <Text size="sm" muted className="line-clamp-2 mt-1">
                    {space.description}
                  </Text>
                  <Text size="xs" muted className="mt-2">
                    {space.memberCount.toLocaleString()} members
                  </Text>
                </div>
              </div>
            </Card>
          </div>

          {/* C: Connection Focus */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>C: Connection Focus</Text>
            <Card elevation="resting" warmth={warmthLevel} interactive className="p-4">
              <div className="flex items-start gap-3">
                <Avatar size="lg">
                  <AvatarFallback size="lg" className={territory.color}>
                    {getInitials(space.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Text weight="medium">{space.name}</Text>
                  <Text size="sm" muted className="mt-1">
                    {space.description}
                  </Text>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <AvatarGroup
                        size="xs"
                        max={3}
                        users={Array(Math.min(space.mutualConnections, 3)).fill(null).map((_, i) => ({
                          name: `Mutual ${i + 1}`,
                          src: null,
                        }))}
                      />
                      <Text size="xs" className="text-[var(--color-accent-gold)]">
                        {space.mutualConnections} you know
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* D: Dense (all info) */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>D: Dense</Text>
            <Card elevation="resting" warmth={warmthLevel} interactive className="p-4">
              <div className="flex items-start gap-3">
                <Avatar size="lg">
                  <AvatarFallback size="lg" className={territory.color}>
                    {getInitials(space.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Text weight="medium">{space.name}</Text>
                    <Badge variant="outline" size="sm" className={territory.color}>
                      {territory.label}
                    </Badge>
                  </div>
                  <Text size="sm" muted className="line-clamp-2 mt-1">
                    {space.description}
                  </Text>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Text size="xs" muted>
                        {space.memberCount.toLocaleString()} members
                      </Text>
                      <Text size="xs" className="text-[var(--color-accent-gold)]">
                        {space.mutualConnections} you know
                      </Text>
                    </div>
                    {space.toolCount > 0 && (
                      <Badge variant="default" size="sm">
                        {space.toolCount} tools
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Text size="xs" muted>Founded by</Text>
                    <AvatarGroup
                      size="xs"
                      max={2}
                      users={space.founders.map(f => ({ name: f.name, src: f.avatar }))}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// VARIABLE 4: Distinctive Layout (Apple-Inspired)
// What makes HIVE spaces feel different from Discord/Slack
// ============================================
/**
 * Apple Design Language:
 * - Full-bleed gradients (imagery fills the card)
 * - Glass morphism (frosted overlays)
 * - Generous whitespace (content breathes)
 * - Centered compositions (not cramped horizontal)
 * - Large avatars (personality-forward)
 * - Floating content (appears to hover)
 * - Minimal chrome (no unnecessary borders)
 *
 * A: Centered Hero — Large centered avatar, stacked vertical layout
 * B: Glass Overlay — Full gradient with frosted content panel
 * C: Floating Identity — Avatar floats over gradient
 * D: Territory Canvas — Full-bleed gradient, immersive entry
 * E: Immersive Portal — Apple-style hero card (Recommended)
 */
export const Variable4_DistinctiveLayout: Story = {
  render: () => {
    const space = mockSpaces[0];
    const territory = territoryConfig[space.territory];
    const warmthLevel = getWarmthFromActiveUsers(space.activeMembers);

    return (
      <div className="flex flex-col gap-8 p-8">
        <Text size="sm" muted>
          Apple design: generous space, full-bleed gradients, glass morphism, floating content.
        </Text>

        <div className="grid grid-cols-2 gap-6" style={{ width: '720px' }}>
          {/* A: Centered Hero */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>A: Centered Hero</Text>
            <Card
              elevation="resting"
              warmth={warmthLevel}
              interactive
              noPadding
              className="overflow-hidden"
            >
              <div className={cn('pt-8 pb-6 px-6 bg-gradient-to-b', territory.gradient)}>
                <div className="flex flex-col items-center text-center">
                  <Avatar size="lg" className="w-20 h-20 rounded-2xl">
                    <AvatarFallback size="lg" className={cn('text-2xl rounded-2xl', territory.color)}>
                      {getInitials(space.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Text size="lg" weight="medium" className="mt-4">
                    {space.name}
                  </Text>
                  <Text size="sm" muted className="mt-1">
                    {space.memberCount.toLocaleString()} members
                  </Text>
                </div>
              </div>
            </Card>
          </div>

          {/* B: Glass Overlay */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>B: Glass Overlay</Text>
            <Card
              elevation="resting"
              warmth={warmthLevel}
              interactive
              noPadding
              className="overflow-hidden relative h-[180px]"
            >
              {/* Full-bleed gradient */}
              <div className={cn('absolute inset-0 bg-gradient-to-br', territory.gradient)} />
              {/* Frosted glass panel */}
              <div className="absolute bottom-0 left-0 right-0 backdrop-blur-xl bg-black/40 p-4">
                <div className="flex items-center gap-3">
                  <Avatar size="lg" className="rounded-xl">
                    <AvatarFallback size="lg" className={cn('rounded-xl', territory.color)}>
                      {getInitials(space.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Text weight="medium">{space.name}</Text>
                    <Text size="xs" muted className="mt-0.5">
                      {space.memberCount.toLocaleString()} members
                    </Text>
                  </div>
                  {space.isActive && <PresenceDot status="online" size="default" />}
                </div>
              </div>
            </Card>
          </div>

          {/* C: Floating Identity */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>C: Floating Identity</Text>
            <Card
              elevation="resting"
              warmth={warmthLevel}
              interactive
              noPadding
              className="overflow-hidden"
            >
              {/* Hero gradient area */}
              <div className={cn('h-24 bg-gradient-to-br relative', territory.gradient)}>
                {/* Large floating avatar */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                  <Avatar size="lg" className="w-16 h-16 rounded-2xl shadow-2xl ring-4 ring-[rgba(18,18,18,0.92)]">
                    <AvatarFallback size="lg" className={cn('rounded-2xl text-xl', territory.color)}>
                      {getInitials(space.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              {/* Content below with breathing room */}
              <div className="pt-12 pb-5 px-5 text-center">
                <Text weight="medium">{space.name}</Text>
                <Text size="sm" muted className="mt-2 line-clamp-2">
                  {space.description}
                </Text>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <Text size="xs" muted>{space.memberCount.toLocaleString()} members</Text>
                  <Text size="xs" className="text-[var(--color-accent-gold)]">
                    {space.mutualConnections} you know
                  </Text>
                </div>
              </div>
            </Card>
          </div>

          {/* D: Territory Canvas */}
          <div className="flex flex-col gap-2">
            <Text size="xs" muted>D: Territory Canvas</Text>
            <Card
              elevation="resting"
              warmth={warmthLevel}
              interactive
              noPadding
              className={cn(
                'overflow-hidden h-[180px] relative',
                'bg-gradient-to-br',
                territory.gradient
              )}
            >
              {/* Territory badge floating top-right */}
              <Badge
                variant="outline"
                size="sm"
                className={cn('absolute top-4 right-4', territory.color, 'backdrop-blur-sm')}
              >
                {territory.label}
              </Badge>
              {/* Content anchored bottom with glass */}
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-end gap-3">
                  <Avatar size="lg" className="rounded-xl">
                    <AvatarFallback size="lg" className={cn('rounded-xl', territory.color)}>
                      {getInitials(space.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 pb-0.5">
                    <Text weight="medium">{space.name}</Text>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Text size="xs" className="text-white/70">
                        {space.memberCount.toLocaleString()} members
                      </Text>
                      {space.isActive && (
                        <div className="flex items-center gap-1">
                          <PresenceDot status="online" size="xs" />
                          <Text size="xs" className="text-white/70">
                            {space.activeMembers} active
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* E: Immersive Portal (Recommended) */}
          <div className="flex flex-col gap-2 col-span-2">
            <Text size="xs" muted>E: Immersive Portal (Recommended)</Text>
            <Card
              elevation="raised"
              warmth={warmthLevel}
              interactive
              noPadding
              className="overflow-hidden"
            >
              {/* Full-width hero gradient */}
              <div className={cn(
                'h-28 bg-gradient-to-br relative',
                territory.gradient
              )}>
                {/* Territory badge */}
                <Badge
                  variant="outline"
                  size="sm"
                  className={cn('absolute top-4 right-4 backdrop-blur-sm', territory.color)}
                >
                  {territory.label}
                </Badge>
                {/* Large floating avatar */}
                <div className="absolute -bottom-10 left-6">
                  <Avatar size="lg" className="w-20 h-20 rounded-2xl shadow-2xl ring-4 ring-[rgba(18,18,18,0.92)]">
                    <AvatarFallback size="lg" className={cn('rounded-2xl text-2xl', territory.color)}>
                      {getInitials(space.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* Content area with generous padding */}
              <div className="pt-14 pb-5 px-6">
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Text size="xl" weight="medium">{space.name}</Text>
                      {space.isActive && <PresenceDot status="online" size="default" animate />}
                    </div>
                    <Text size="sm" muted className="mt-2 line-clamp-2 max-w-md">
                      {space.description}
                    </Text>
                  </div>
                </div>

                {/* Stats row with glass-style divider */}
                <div className="flex items-center gap-6 mt-5 pt-4 border-t border-white/[0.06]">
                  {/* Member count */}
                  <div className="flex flex-col">
                    <Text size="lg" weight="medium">{space.memberCount.toLocaleString()}</Text>
                    <Text size="xs" muted>members</Text>
                  </div>

                  {/* Mutual connections - gold highlight */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <AvatarGroup
                        size="xs"
                        max={3}
                        users={Array(Math.min(space.mutualConnections, 3)).fill(null).map((_, i) => ({
                          name: `Mutual ${i + 1}`,
                          src: null,
                        }))}
                      />
                      <Text size="lg" weight="medium" className="text-[var(--color-accent-gold)]">
                        {space.mutualConnections}
                      </Text>
                    </div>
                    <Text size="xs" muted>you know</Text>
                  </div>

                  {/* Tools (if any) */}
                  {space.toolCount > 0 && (
                    <div className="flex flex-col">
                      <Text size="lg" weight="medium">{space.toolCount}</Text>
                      <Text size="xs" muted>tools</Text>
                    </div>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Founders */}
                  <div className="flex items-center gap-2">
                    <Text size="xs" muted>Founded by</Text>
                    {space.founders.map((founder, i) => (
                      <PresenceWrapper key={i} status={founder.isOnline ? 'online' : 'offline'} size="xs">
                        <Avatar size="sm" className="rounded-lg">
                          <AvatarFallback size="sm" className="rounded-lg">
                            {getInitials(founder.name)}
                          </AvatarFallback>
                        </Avatar>
                      </PresenceWrapper>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  },
};
