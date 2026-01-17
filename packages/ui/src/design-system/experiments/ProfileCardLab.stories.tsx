import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  Avatar,
  AvatarFallback,
  Text,
  Badge,
  Button,
  Card,
  getInitials,
} from '../primitives';
import { cn } from '../../lib/utils';

/**
 * # ProfileCard Lab — All Contexts
 *
 * ## LOCKED:
 * - Context 1 (Member List): Section grouping, presence dots, hover menu, 40px
 * - Context 2 (Hover Card): Horizontal 280px, bio+mutuals, single Message CTA
 * - Context 3 (Search Result): 44px rows, name+handle+major+mutuals, no actions
 *
 * ## IN LAB:
 * - Context 4 (Inline Chip): @mentions in chat
 * - Context 5 (Full Card): Profile page header / modal
 */
const meta: Meta = {
  title: 'Design System/Lab/ProfileCard',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// MOCK DATA
// ============================================

const profile = {
  id: '1',
  displayName: 'Jane Doe',
  handle: 'janedoe',
  bio: 'CS student at UB. Building AI tools and exploring startup ideas. Founder of UB Hackers.',
  presence: 'online' as const,
  role: 'leader' as const,
  major: 'Computer Science',
  year: 'Junior',
  connections: 156,
  mutualConnections: 12,
  spacesJoined: 8,
  isFounder: true,
};

const presenceColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-gray-500',
};

// ============================================
// CONTEXT 4: INLINE CHIP (@mentions)
// ============================================

export const Context4_InlineChip: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[1000px] mx-auto space-y-8">
        <div>
          <Text size="xl" weight="semibold">Context 4: Inline Chip (@mention)</Text>
          <Text size="sm" tone="muted" className="mt-1">
            How @mentions appear inline in chat messages
          </Text>
        </div>

        {/* Variable 1: Style */}
        <Card elevation="resting" noPadding className="p-6">
          <Text size="sm" weight="medium" className="mb-4">Variable 1: Chip Style</Text>

          <div className="space-y-6">
            {/* Option A: Text Only */}
            <div>
              <Text size="xs" tone="muted" className="mb-2">A: Text Only (just colored)</Text>
              <div className="bg-white/5 rounded-lg p-3">
                <Text size="sm">
                  Hey <span className="text-[var(--color-interactive-active)] cursor-pointer hover:underline">@janedoe</span> are you coming to the meeting?
                </Text>
              </div>
            </div>

            {/* Option B: Pill Background */}
            <div>
              <Text size="xs" tone="muted" className="mb-2">B: Pill Background (Recommended)</Text>
              <div className="bg-white/5 rounded-lg p-3">
                <Text size="sm">
                  Hey <span className="bg-[var(--color-interactive-active)]/20 text-[var(--color-interactive-active)] px-1.5 py-0.5 rounded cursor-pointer hover:bg-[var(--color-interactive-active)]/30">@janedoe</span> are you coming to the meeting?
                </Text>
              </div>
            </div>

            {/* Option C: With Avatar */}
            <div>
              <Text size="xs" tone="muted" className="mb-2">C: With Mini Avatar</Text>
              <div className="bg-white/5 rounded-lg p-3">
                <Text size="sm" className="inline-flex items-center gap-1">
                  Hey{' '}
                  <span className="inline-flex items-center gap-1 bg-[var(--color-interactive-active)]/20 text-[var(--color-interactive-active)] px-1.5 py-0.5 rounded cursor-pointer hover:bg-[var(--color-interactive-active)]/30">
                    <Avatar size="xs" className="w-4 h-4">
                      <AvatarFallback className="text-[8px]">JD</AvatarFallback>
                    </Avatar>
                    @janedoe
                  </span>{' '}
                  are you coming to the meeting?
                </Text>
              </div>
            </div>

            {/* Option D: Gold for Leaders */}
            <div>
              <Text size="xs" tone="muted" className="mb-2">D: Gold for Leaders/Founders</Text>
              <div className="bg-white/5 rounded-lg p-3">
                <Text size="sm">
                  Hey <span className="bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] px-1.5 py-0.5 rounded cursor-pointer hover:bg-[var(--color-accent-gold)]/30">@janedoe</span> are you coming to the meeting?
                </Text>
              </div>
            </div>
          </div>
        </Card>

        {/* Recommendation */}
        <Card warmth="subtle" noPadding className="p-6">
          <Text size="sm" weight="medium" className="mb-3 text-[var(--color-accent-gold)]">Recommendation: B (Pill Background)</Text>
          <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <li>• Pill makes mentions scannable in long messages</li>
            <li>• Blue color is consistent (not gold — save for achievements)</li>
            <li>• No avatar — too heavy for inline text</li>
            <li>• Hover triggers profile hover card (Context 2)</li>
          </ul>
        </Card>
      </div>
    </div>
  ),
};

// ============================================
// CONTEXT 5: FULL CARD (Profile Page/Modal)
// ============================================

export const Context5_FullCard: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div>
          <Text size="xl" weight="semibold">Context 5: Full Profile Card</Text>
          <Text size="sm" tone="muted" className="mt-1">
            Profile page header or profile modal — full detail view
          </Text>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Option A: Centered */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">A: Centered Layout</Text>
            <Card elevation="resting" noPadding className="p-6 rounded-2xl">
              <div className="flex flex-col items-center text-center">
                {/* Portrait Avatar Card */}
                <div className="relative mb-5">
                  <Card elevation="raised" noPadding className="w-32 h-44 flex items-center justify-center">
                    <Text className="text-4xl font-semibold text-[var(--color-text-muted)]">
                      {getInitials(profile.displayName)}
                    </Text>
                  </Card>
                  {/* Subtle presence indicator */}
                  <div className={cn(
                    'absolute bottom-3 right-3 w-3 h-3 rounded-full',
                    profile.presence === 'online' && 'bg-green-500/80',
                    profile.presence === 'away' && 'bg-yellow-500/80',
                    profile.presence === 'offline' && 'bg-gray-500/50'
                  )} />
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <Text size="xl" weight="semibold">{profile.displayName}</Text>
                  {profile.role === 'leader' && <Badge variant="gold" size="sm">Leader</Badge>}
                </div>
                <Text size="sm" tone="muted" className="mb-4">@{profile.handle}</Text>

                <Text size="sm" tone="secondary" className="mb-6 max-w-sm">
                  {profile.bio}
                </Text>

                <div className="flex gap-8 mb-6 text-sm">
                  <div className="text-center">
                    <Text weight="semibold">{profile.connections}</Text>
                    <Text size="xs" tone="muted">Connections</Text>
                  </div>
                  <div className="text-center">
                    <Text weight="semibold">{profile.spacesJoined}</Text>
                    <Text size="xs" tone="muted">Spaces</Text>
                  </div>
                </div>

                {/* Card-style buttons - both identical glass styling */}
                <div className="flex gap-3">
                  <Card
                    as="button"
                    interactive
                    elevation="raised"
                    noPadding
                    className="px-6 py-2.5 rounded-full cursor-pointer"
                  >
                    <Text size="sm" weight="medium" className="text-[var(--color-accent-gold)]">Connect</Text>
                  </Card>
                  <Card
                    as="button"
                    interactive
                    elevation="raised"
                    noPadding
                    className="px-6 py-2.5 rounded-full cursor-pointer"
                  >
                    <Text size="sm" weight="medium">Message</Text>
                  </Card>
                </div>
              </div>
            </Card>
          </div>

          {/* Option B: Left-Aligned (Recommended) */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">B: Left-Aligned (Recommended)</Text>
            <Card elevation="resting" noPadding className="p-6 rounded-2xl">
              <div className="flex gap-6">
                {/* Portrait Avatar Card */}
                <div className="relative flex-shrink-0 self-start">
                  <Card elevation="raised" noPadding className="w-36 h-48 flex items-center justify-center">
                    <Text className="text-4xl font-semibold text-[var(--color-text-muted)]">
                      {getInitials(profile.displayName)}
                    </Text>
                  </Card>
                  {/* Subtle presence indicator - small, bottom right corner */}
                  <div className={cn(
                    'absolute bottom-3 right-3 w-3 h-3 rounded-full',
                    profile.presence === 'online' && 'bg-green-500/80',
                    profile.presence === 'away' && 'bg-yellow-500/80',
                    profile.presence === 'offline' && 'bg-gray-500/50'
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Text size="xl" weight="semibold">{profile.displayName}</Text>
                    {profile.role === 'leader' && <Badge variant="gold" size="sm">Leader</Badge>}
                  </div>
                  <Text size="sm" tone="muted">@{profile.handle}</Text>
                  <Text size="xs" tone="muted" className="mt-1">{profile.major} · {profile.year}</Text>

                  <Text size="sm" tone="secondary" className="mt-4 mb-4">
                    {profile.bio}
                  </Text>

                  <div className="flex gap-6 mb-5 text-sm">
                    <Text><strong>{profile.connections}</strong> <span className="text-[var(--color-text-muted)]">connections</span></Text>
                    <Text><strong>{profile.spacesJoined}</strong> <span className="text-[var(--color-text-muted)]">spaces</span></Text>
                  </div>

                  {/* Card-style buttons - both identical glass styling */}
                  <div className="flex gap-3">
                    <Card
                      as="button"
                      interactive
                      elevation="raised"
                      noPadding
                      className="px-6 py-2.5 rounded-full cursor-pointer"
                    >
                      <Text size="sm" weight="medium" className="text-[var(--color-accent-gold)]">Connect</Text>
                    </Card>
                    <Card
                      as="button"
                      interactive
                      elevation="raised"
                      noPadding
                      className="px-6 py-2.5 rounded-full cursor-pointer"
                    >
                      <Text size="sm" weight="medium">Message</Text>
                    </Card>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recommendation */}
        <Card warmth="subtle" noPadding className="p-6">
          <Text size="sm" weight="medium" className="mb-3 text-[var(--color-accent-gold)]">Recommendation: B (Left-Aligned)</Text>
          <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <li>• Left-aligned is easier to scan (F-pattern reading)</li>
            <li>• Matches horizontal patterns from other contexts</li>
            <li>• Room for future sections (badges, tools created, etc.)</li>
            <li>• Centered is more "hero" — save for landing pages</li>
          </ul>
        </Card>
      </div>
    </div>
  ),
};

// ============================================
// COMPLETE OVERVIEW
// ============================================

export const AllContextsOverview: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[1000px] mx-auto space-y-8">
        <div>
          <Text size="xl" weight="semibold">ProfileCard — All 5 Contexts</Text>
          <Text size="sm" tone="muted" className="mt-2">
            Complete overview of ProfileCard decisions across contexts
          </Text>
        </div>

        {/* Locked Contexts */}
        <Card elevation="resting" noPadding className="p-6">
          <Text size="sm" weight="medium" className="mb-4 text-green-400">LOCKED (3/5)</Text>

          <div className="space-y-4">
            <div className="border-b border-[var(--color-border)] pb-4">
              <Text size="sm" weight="medium">1. Member List</Text>
              <Text size="xs" tone="muted" className="mt-1">
                Section grouping by role, presence dot, hover menu (···), 40px rows
              </Text>
            </div>

            <div className="border-b border-[var(--color-border)] pb-4">
              <Text size="sm" weight="medium">2. Hover Card</Text>
              <Text size="xs" tone="muted" className="mt-1">
                Horizontal 280px, name + handle + bio + mutuals, single "Message" CTA
              </Text>
            </div>

            <div className="pb-2">
              <Text size="sm" weight="medium">3. Search Result</Text>
              <Text size="xs" tone="muted" className="mt-1">
                44px rows, name + handle + major + mutuals, click to select (no actions)
              </Text>
            </div>
          </div>
        </Card>

        {/* Pending Contexts */}
        <Card elevation="raised" warmth="subtle" noPadding className="p-6">
          <Text size="sm" weight="medium" className="mb-4 text-[var(--color-accent-gold)]">PENDING APPROVAL (2/5)</Text>

          <div className="space-y-4">
            <div className="border-b border-[var(--color-border)] pb-4">
              <Text size="sm" weight="medium">4. Inline Chip (@mention)</Text>
              <Text size="xs" tone="muted" className="mt-1">
                <strong>Rec:</strong> Blue pill background, no avatar, hover triggers hover card
              </Text>
            </div>

            <div className="pb-2">
              <Text size="sm" weight="medium">5. Full Card (Profile Page)</Text>
              <Text size="xs" tone="muted" className="mt-1">
                <strong>Rec:</strong> Left-aligned, xl avatar, bio + stats + Connect/Message CTAs
              </Text>
            </div>
          </div>
        </Card>

        {/* Summary Table */}
        <Card elevation="resting" noPadding className="p-6">
          <Text size="sm" weight="medium" className="mb-4">Quick Reference</Text>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--color-text-muted)]">
                  <th className="pb-2 pr-4">Context</th>
                  <th className="pb-2 pr-4">Avatar</th>
                  <th className="pb-2 pr-4">Info</th>
                  <th className="pb-2 pr-4">Actions</th>
                  <th className="pb-2">Size</th>
                </tr>
              </thead>
              <tbody className="text-[var(--color-text-secondary)]">
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-2 pr-4">Member List</td>
                  <td className="py-2 pr-4">sm + dot</td>
                  <td className="py-2 pr-4">Name + handle</td>
                  <td className="py-2 pr-4">Hover menu</td>
                  <td className="py-2">40px row</td>
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-2 pr-4">Hover Card</td>
                  <td className="py-2 pr-4">md + dot</td>
                  <td className="py-2 pr-4">+ bio + mutuals</td>
                  <td className="py-2 pr-4">Message btn</td>
                  <td className="py-2">280px card</td>
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-2 pr-4">Search Result</td>
                  <td className="py-2 pr-4">sm</td>
                  <td className="py-2 pr-4">+ major + mutuals</td>
                  <td className="py-2 pr-4">Click row</td>
                  <td className="py-2">44px row</td>
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-2 pr-4">Inline Chip</td>
                  <td className="py-2 pr-4">None</td>
                  <td className="py-2 pr-4">@handle</td>
                  <td className="py-2 pr-4">Hover card</td>
                  <td className="py-2">Inline</td>
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-2 pr-4">Full Card</td>
                  <td className="py-2 pr-4">xl + dot</td>
                  <td className="py-2 pr-4">Everything</td>
                  <td className="py-2 pr-4">Connect + Msg</td>
                  <td className="py-2">Full width</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Next Steps */}
        <Card elevation="resting" noPadding className="p-6 border-dashed">
          <Text size="sm" weight="medium" className="mb-2">Next Steps</Text>
          <Text size="xs" tone="muted">
            Review Context 4 & 5 recommendations above. Say "lock" to finalize ProfileCard and move to EventCard.
          </Text>
        </Card>
      </div>
    </div>
  ),
};
