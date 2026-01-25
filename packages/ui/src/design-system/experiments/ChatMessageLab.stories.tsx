import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback, Text, Card } from '../primitives';

/**
 * COMPONENT: ChatMessage
 * STATUS: IN LAB — Awaiting Jacob's selection
 *
 * Variables to test:
 * 1. Bubble Style — 5 options
 * 2. Avatar Treatment — 5 options
 * 3. Timestamp Display — 5 options
 * 4. Reaction Style — 4 options
 */

const meta: Meta = {
  title: 'Experiments/ChatMessage Lab',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// HELPER: Lab Card Container
// ============================================
const LabCard = ({
  label,
  title,
  description,
  children
}: {
  label: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
    {/* Header */}
    <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50">
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-lg bg-[var(--color-bg-surface)] flex items-center justify-center text-lg font-semibold">
          {label}
        </span>
        <div>
          <Text size="sm" weight="semibold">{title}</Text>
          <Text size="xs" tone="muted">{description}</Text>
        </div>
      </div>
    </div>
    {/* Content */}
    <div className="p-6 flex-1">
      {children}
    </div>
  </div>
);

// ============================================
// HELPER: Mock Conversation
// ============================================
const ConversationWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--color-bg-ground)] rounded-xl p-4 min-h-[280px]">
    {children}
  </div>
);

// ============================================
// VARIABLE 1: BUBBLE STYLE
// ============================================

const BubbleA_FullBubble = () => (
  <ConversationWrapper>
    <div className="space-y-4">
      {/* Other user */}
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <div className="bg-[var(--color-bg-elevated)] rounded-2xl rounded-tl-md px-4 py-2.5 max-w-[360px]">
            <Text size="sm">Hey everyone! Who's working on the hackathon project tonight?</Text>
          </div>
        </div>
      </div>
      {/* Own user */}
      <div className="flex gap-3 flex-row-reverse">
        <Avatar size="sm"><AvatarFallback>ME</AvatarFallback></Avatar>
        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-2 mb-1 flex-row-reverse">
            <Text size="sm" weight="medium">You</Text>
            <Text size="xs" tone="muted">2:31 PM</Text>
          </div>
          <div className="bg-[var(--color-interactive-active)] text-white rounded-2xl rounded-tr-md px-4 py-2.5 max-w-[360px]">
            <Text size="sm" className="text-inherit">I'll be there! Working on the frontend components.</Text>
          </div>
        </div>
      </div>
      {/* Another user */}
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <Text size="sm" weight="medium">John Smith</Text>
            <Text size="xs" tone="muted">2:32 PM</Text>
          </div>
          <div className="bg-[var(--color-bg-elevated)] rounded-2xl rounded-tl-md px-4 py-2.5 max-w-[360px]">
            <Text size="sm">Count me in! I can help with the backend.</Text>
          </div>
        </div>
      </div>
    </div>
  </ConversationWrapper>
);

const BubbleB_Borderless = () => (
  <ConversationWrapper>
    <div className="space-y-4">
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <Text size="sm" className="max-w-[400px]">Hey everyone! Who's working on the hackathon project tonight?</Text>
        </div>
      </div>
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>ME</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium" className="text-[var(--color-accent-gold)]">You</Text>
            <Text size="xs" tone="muted">2:31 PM</Text>
          </div>
          <Text size="sm" className="max-w-[400px]">I'll be there! Working on the frontend components.</Text>
        </div>
      </div>
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">John Smith</Text>
            <Text size="xs" tone="muted">2:32 PM</Text>
          </div>
          <Text size="sm" className="max-w-[400px]">Count me in! I can help with the backend.</Text>
        </div>
      </div>
    </div>
  </ConversationWrapper>
);

const BubbleC_LeftAccent = () => (
  <ConversationWrapper>
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div className="pl-3 border-l-2 border-[var(--color-border-emphasis)]">
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <Text size="sm">Hey everyone! Who's working on the hackathon project tonight?</Text>
        </div>
      </div>
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>ME</AvatarFallback></Avatar>
        <div className="pl-3 border-l-2 border-[var(--color-accent-gold)]">
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium" className="text-[var(--color-accent-gold)]">You</Text>
            <Text size="xs" tone="muted">2:31 PM</Text>
          </div>
          <Text size="sm">I'll be there! Working on the frontend components.</Text>
        </div>
      </div>
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
        <div className="pl-3 border-l-2 border-[var(--color-border-emphasis)]">
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">John Smith</Text>
            <Text size="xs" tone="muted">2:32 PM</Text>
          </div>
          <Text size="sm">Count me in! I can help with the backend.</Text>
        </div>
      </div>
    </div>
  </ConversationWrapper>
);

const BubbleD_Minimal = () => (
  <ConversationWrapper>
    <div className="space-y-1">
      <div className="group flex gap-3 py-1.5 px-3 -mx-3 rounded-lg hover:bg-[var(--color-bg-elevated)]/50 transition-colors cursor-default">
        <Avatar size="xs" className="mt-0.5"><AvatarFallback className="text-label-xs">JD</AvatarFallback></Avatar>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted" className="opacity-0 group-hover:opacity-100 transition-opacity">2:30 PM</Text>
          </div>
          <Text size="sm">Hey everyone! Who's working on the hackathon project tonight?</Text>
        </div>
      </div>
      <div className="group flex gap-3 py-1.5 px-3 -mx-3 rounded-lg hover:bg-[var(--color-bg-elevated)]/50 transition-colors cursor-default">
        <Avatar size="xs" className="mt-0.5"><AvatarFallback className="text-label-xs">ME</AvatarFallback></Avatar>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <Text size="sm" weight="medium" className="text-[var(--color-accent-gold)]">You</Text>
            <Text size="xs" tone="muted" className="opacity-0 group-hover:opacity-100 transition-opacity">2:31 PM</Text>
          </div>
          <Text size="sm">I'll be there! Working on the frontend components.</Text>
        </div>
      </div>
      <div className="group flex gap-3 py-1.5 px-3 -mx-3 rounded-lg hover:bg-[var(--color-bg-elevated)]/50 transition-colors cursor-default">
        <Avatar size="xs" className="mt-0.5"><AvatarFallback className="text-label-xs">JS</AvatarFallback></Avatar>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <Text size="sm" weight="medium">John Smith</Text>
            <Text size="xs" tone="muted" className="opacity-0 group-hover:opacity-100 transition-opacity">2:32 PM</Text>
          </div>
          <Text size="sm">Count me in! I can help with the backend.</Text>
        </div>
      </div>
    </div>
  </ConversationWrapper>
);

const BubbleE_Discord = () => (
  <ConversationWrapper>
    <div className="space-y-0 -mx-4">
      <div className="group flex gap-4 py-2 px-4 hover:bg-[var(--color-bg-elevated)]/30 transition-colors cursor-default">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <Text size="sm" weight="semibold">Jane Doe</Text>
            <Text size="xs" tone="muted">Today at 2:30 PM</Text>
          </div>
          <Text size="sm" className="mt-0.5">Hey everyone! Who's working on the hackathon project tonight?</Text>
        </div>
      </div>
      <div className="group flex gap-4 py-2 px-4 hover:bg-[var(--color-bg-elevated)]/30 transition-colors cursor-default">
        <Avatar size="sm"><AvatarFallback>ME</AvatarFallback></Avatar>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <Text size="sm" weight="semibold" className="text-[var(--color-accent-gold)]">You</Text>
            <Text size="xs" tone="muted">Today at 2:31 PM</Text>
          </div>
          <Text size="sm" className="mt-0.5">I'll be there! Working on the frontend components.</Text>
        </div>
      </div>
      <div className="group flex gap-4 py-2 px-4 hover:bg-[var(--color-bg-elevated)]/30 transition-colors cursor-default">
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <Text size="sm" weight="semibold">John Smith</Text>
            <Text size="xs" tone="muted">Today at 2:32 PM</Text>
          </div>
          <Text size="sm" className="mt-0.5">Count me in! I can help with the backend.</Text>
        </div>
      </div>
    </div>
  </ConversationWrapper>
);

export const Variable1_BubbleStyle: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-8">
        <Text size="xl" weight="semibold" className="mb-2">Variable 1: Bubble Style</Text>
        <Text tone="muted">How should message containers look? Compare the overall feel of each approach.</Text>
      </div>

      {/* Grid - 3 columns for desktop */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-3 gap-6">
        <LabCard label="A" title="Full Bubble" description="Classic iMessage-style bubbles with backgrounds">
          <BubbleA_FullBubble />
        </LabCard>

        <LabCard label="B" title="Borderless" description="Clean text, no containers. Slack-like simplicity">
          <BubbleB_Borderless />
        </LabCard>

        <LabCard label="C" title="Left Accent" description="Colored left border indicates speaker. Notion-like">
          <BubbleC_LeftAccent />
        </LabCard>

        <LabCard label="D" title="Minimal Hover" description="Ultra-clean. Time appears on hover. Linear-like">
          <BubbleD_Minimal />
        </LabCard>

        <LabCard label="E" title="Discord Row" description="Full-width rows with hover highlight">
          <BubbleE_Discord />
        </LabCard>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 2: AVATAR TREATMENT
// ============================================

const AvatarA_Every = () => (
  <ConversationWrapper>
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <Text size="sm">Hey everyone!</Text>
        </div>
      </div>
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <Text size="sm">Who's working on the project tonight?</Text>
        </div>
      </div>
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">John Smith</Text>
            <Text size="xs" tone="muted">2:31 PM</Text>
          </div>
          <Text size="sm">I'll be there!</Text>
        </div>
      </div>
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">John Smith</Text>
            <Text size="xs" tone="muted">2:31 PM</Text>
          </div>
          <Text size="sm">Working on the backend API.</Text>
        </div>
      </div>
    </div>
  </ConversationWrapper>
);

const AvatarB_FirstOnly = () => (
  <ConversationWrapper>
    <div className="space-y-1">
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <Text size="sm">Hey everyone!</Text>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="w-8 flex-shrink-0" />
        <Text size="sm">Who's working on the project tonight?</Text>
      </div>
      <div className="flex gap-3 mt-3">
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">John Smith</Text>
            <Text size="xs" tone="muted">2:31 PM</Text>
          </div>
          <Text size="sm">I'll be there!</Text>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="w-8 flex-shrink-0" />
        <Text size="sm">Working on the backend API.</Text>
      </div>
    </div>
  </ConversationWrapper>
);

const AvatarC_Never = () => (
  <ConversationWrapper>
    <div className="space-y-3 pl-2">
      <div>
        <div className="flex items-baseline gap-2 mb-0.5">
          <Text size="sm" weight="medium">Jane Doe</Text>
          <Text size="xs" tone="muted">2:30 PM</Text>
        </div>
        <Text size="sm">Hey everyone!</Text>
        <Text size="sm" className="mt-1">Who's working on the project tonight?</Text>
      </div>
      <div>
        <div className="flex items-baseline gap-2 mb-0.5">
          <Text size="sm" weight="medium">John Smith</Text>
          <Text size="xs" tone="muted">2:31 PM</Text>
        </div>
        <Text size="sm">I'll be there!</Text>
        <Text size="sm" className="mt-1">Working on the backend API.</Text>
      </div>
    </div>
  </ConversationWrapper>
);

const AvatarD_HoverReveal = () => (
  <ConversationWrapper>
    <div className="space-y-1">
      <div className="group flex gap-3 py-1 px-2 -mx-2 rounded-lg hover:bg-[var(--color-bg-elevated)]/30 transition-colors cursor-default">
        <div className="w-8 flex-shrink-0 flex justify-center">
          <Avatar size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <Text size="sm">Hey everyone!</Text>
        </div>
      </div>
      <div className="group flex gap-3 py-1 px-2 -mx-2 rounded-lg hover:bg-[var(--color-bg-elevated)]/30 transition-colors cursor-default">
        <div className="w-8 flex-shrink-0 flex justify-center">
          <Avatar size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
        <Text size="sm">Who's working on the project tonight?</Text>
      </div>
      <div className="group flex gap-3 py-1 px-2 -mx-2 rounded-lg hover:bg-[var(--color-bg-elevated)]/30 transition-colors cursor-default mt-2">
        <div className="w-8 flex-shrink-0 flex justify-center">
          <Avatar size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <AvatarFallback>JS</AvatarFallback>
          </Avatar>
        </div>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">John Smith</Text>
            <Text size="xs" tone="muted">2:31 PM</Text>
          </div>
          <Text size="sm">I'll be there!</Text>
        </div>
      </div>
      <div className="group flex gap-3 py-1 px-2 -mx-2 rounded-lg hover:bg-[var(--color-bg-elevated)]/30 transition-colors cursor-default">
        <div className="w-8 flex-shrink-0 flex justify-center">
          <Avatar size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <AvatarFallback>JS</AvatarFallback>
          </Avatar>
        </div>
        <Text size="sm">Working on the backend API.</Text>
      </div>
    </div>
  </ConversationWrapper>
);

const AvatarE_LeftGutter = () => (
  <ConversationWrapper>
    <div className="flex gap-4">
      {/* Left gutter with aligned avatars */}
      <div className="flex flex-col gap-[52px] pt-1">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
      </div>
      {/* Messages */}
      <div className="flex-1 space-y-4">
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <Text size="sm">Hey everyone!</Text>
          <Text size="sm" className="mt-1">Who's working on the project tonight?</Text>
        </div>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">John Smith</Text>
            <Text size="xs" tone="muted">2:31 PM</Text>
          </div>
          <Text size="sm">I'll be there!</Text>
          <Text size="sm" className="mt-1">Working on the backend API.</Text>
        </div>
      </div>
    </div>
  </ConversationWrapper>
);

export const Variable2_AvatarTreatment: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[1600px] mx-auto mb-8">
        <Text size="xl" weight="semibold" className="mb-2">Variable 2: Avatar Treatment</Text>
        <Text tone="muted">When and how should avatars appear? Hover over option D to test progressive disclosure.</Text>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-3 gap-6">
        <LabCard label="A" title="Every Message" description="Avatar shown on every single message">
          <AvatarA_Every />
        </LabCard>

        <LabCard label="B" title="First in Group" description="Avatar only on first message from same author">
          <AvatarB_FirstOnly />
        </LabCard>

        <LabCard label="C" title="Never" description="No avatars at all, just names and content">
          <AvatarC_Never />
        </LabCard>

        <LabCard label="D" title="Hover Reveal" description="Hidden by default, appears on row hover">
          <AvatarD_HoverReveal />
        </LabCard>

        <LabCard label="E" title="Left Gutter" description="Avatars pinned in left column, messages grouped">
          <AvatarE_LeftGutter />
        </LabCard>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 3: TIMESTAMP DISPLAY
// ============================================

const TimestampA_Always = () => (
  <ConversationWrapper>
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <Text size="sm">Hey everyone!</Text>
        </div>
      </div>
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">John Smith</Text>
            <Text size="xs" tone="muted">2:31 PM</Text>
          </div>
          <Text size="sm">I'll be there!</Text>
        </div>
      </div>
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>AJ</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">Alice Johnson</Text>
            <Text size="xs" tone="muted">2:35 PM</Text>
          </div>
          <Text size="sm">Perfect, see you at 6!</Text>
        </div>
      </div>
    </div>
  </ConversationWrapper>
);

const TimestampB_HoverOnly = () => (
  <ConversationWrapper>
    <div className="space-y-3">
      <div className="group flex gap-3 py-1 px-2 -mx-2 rounded-lg hover:bg-[var(--color-bg-elevated)]/30 transition-colors cursor-default">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted" className="opacity-0 group-hover:opacity-100 transition-opacity">2:30 PM</Text>
          </div>
          <Text size="sm">Hey everyone!</Text>
        </div>
      </div>
      <div className="group flex gap-3 py-1 px-2 -mx-2 rounded-lg hover:bg-[var(--color-bg-elevated)]/30 transition-colors cursor-default">
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">John Smith</Text>
            <Text size="xs" tone="muted" className="opacity-0 group-hover:opacity-100 transition-opacity">2:31 PM</Text>
          </div>
          <Text size="sm">I'll be there!</Text>
        </div>
      </div>
      <div className="group flex gap-3 py-1 px-2 -mx-2 rounded-lg hover:bg-[var(--color-bg-elevated)]/30 transition-colors cursor-default">
        <Avatar size="sm"><AvatarFallback>AJ</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">Alice Johnson</Text>
            <Text size="xs" tone="muted" className="opacity-0 group-hover:opacity-100 transition-opacity">2:35 PM</Text>
          </div>
          <Text size="sm">Perfect, see you at 6!</Text>
        </div>
      </div>
    </div>
  </ConversationWrapper>
);

const TimestampC_GroupHeader = () => (
  <ConversationWrapper>
    <div className="space-y-4">
      {/* Time divider */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-[var(--color-border)]" />
        <Text size="xs" tone="muted" className="px-2">Today at 2:30 PM</Text>
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>
      <div className="space-y-3">
        <div className="flex gap-3">
          <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
          <div>
            <Text size="sm" weight="medium" className="mb-0.5">Jane Doe</Text>
            <Text size="sm">Hey everyone!</Text>
          </div>
        </div>
        <div className="flex gap-3">
          <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
          <div>
            <Text size="sm" weight="medium" className="mb-0.5">John Smith</Text>
            <Text size="sm">I'll be there!</Text>
          </div>
        </div>
      </div>
      {/* Another time divider */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-[var(--color-border)]" />
        <Text size="xs" tone="muted" className="px-2">Today at 2:35 PM</Text>
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>AJ</AvatarFallback></Avatar>
        <div>
          <Text size="sm" weight="medium" className="mb-0.5">Alice Johnson</Text>
          <Text size="sm">Perfect, see you at 6!</Text>
        </div>
      </div>
    </div>
  </ConversationWrapper>
);

const TimestampD_Relative = () => (
  <ConversationWrapper>
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">5 min ago</Text>
          </div>
          <Text size="sm">Hey everyone!</Text>
        </div>
      </div>
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">John Smith</Text>
            <Text size="xs" tone="muted">4 min ago</Text>
          </div>
          <Text size="sm">I'll be there!</Text>
        </div>
      </div>
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>AJ</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">Alice Johnson</Text>
            <Text size="xs" tone="muted">just now</Text>
          </div>
          <Text size="sm">Perfect, see you at 6!</Text>
        </div>
      </div>
    </div>
  </ConversationWrapper>
);

const TimestampE_RightAligned = () => (
  <ConversationWrapper>
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-0.5">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <Text size="sm">Hey everyone!</Text>
        </div>
      </div>
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-0.5">
            <Text size="sm" weight="medium">John Smith</Text>
            <Text size="xs" tone="muted">2:31 PM</Text>
          </div>
          <Text size="sm">I'll be there!</Text>
        </div>
      </div>
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>AJ</AvatarFallback></Avatar>
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-0.5">
            <Text size="sm" weight="medium">Alice Johnson</Text>
            <Text size="xs" tone="muted">2:35 PM</Text>
          </div>
          <Text size="sm">Perfect, see you at 6!</Text>
        </div>
      </div>
    </div>
  </ConversationWrapper>
);

export const Variable3_TimestampDisplay: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[1600px] mx-auto mb-8">
        <Text size="xl" weight="semibold" className="mb-2">Variable 3: Timestamp Display</Text>
        <Text tone="muted">How and when should timestamps appear? Hover over option B to test.</Text>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-3 gap-6">
        <LabCard label="A" title="Always Visible" description="Timestamp shown inline after every name">
          <TimestampA_Always />
        </LabCard>

        <LabCard label="B" title="Hover Only" description="Timestamp hidden until row is hovered">
          <TimestampB_HoverOnly />
        </LabCard>

        <LabCard label="C" title="Group Headers" description="Time shown as section dividers only">
          <TimestampC_GroupHeader />
        </LabCard>

        <LabCard label="D" title="Relative Time" description="'5 min ago' format for immediate context">
          <TimestampD_Relative />
        </LabCard>

        <LabCard label="E" title="Right Aligned" description="Timestamp pushed to far right of row">
          <TimestampE_RightAligned />
        </LabCard>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 4: REACTION STYLE
// ============================================

const ReactionA_InlineChips = () => (
  <ConversationWrapper>
    <div className="space-y-4">
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <Text size="sm">Hey everyone! Let's make this hackathon epic!</Text>
          {/* Reactions */}
          <div className="flex gap-1.5 mt-2">
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-surface)] transition-colors ring-1 ring-[var(--color-interactive-active)]">
              <span>👍</span>
              <span className="text-[var(--color-text-secondary)]">3</span>
            </button>
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-surface)] transition-colors">
              <span>🎉</span>
              <span className="text-[var(--color-text-secondary)]">5</span>
            </button>
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-surface)] transition-colors">
              <span>🔥</span>
              <span className="text-[var(--color-text-secondary)]">2</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </ConversationWrapper>
);

const ReactionB_CornerBadge = () => (
  <ConversationWrapper>
    <div className="space-y-4">
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div className="relative">
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <div className="relative inline-block">
            <div className="bg-[var(--color-bg-elevated)] rounded-xl px-4 py-2.5 max-w-[360px]">
              <Text size="sm">Hey everyone! Let's make this hackathon epic!</Text>
            </div>
            {/* Corner badge */}
            <div className="absolute -bottom-2 left-4 flex items-center bg-[var(--color-bg-card)] rounded-full px-2 py-0.5 shadow-md border border-[var(--color-border)]">
              <span className="text-xs">👍 3</span>
              <span className="text-xs ml-1.5">🎉 5</span>
              <span className="text-xs ml-1.5">🔥 2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ConversationWrapper>
);

const ReactionC_HoverBar = () => (
  <ConversationWrapper>
    <div className="space-y-4">
      <div className="group flex gap-3 relative">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <Text size="sm">Hey everyone! Let's make this hackathon epic!</Text>
        </div>
        {/* Hover action bar */}
        <div className="absolute -top-3 right-0 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-[var(--color-bg-card)] rounded-lg px-2 py-1.5 shadow-lg border border-[var(--color-border)]">
          <button className="p-1.5 hover:bg-[var(--color-bg-elevated)] rounded transition-colors" title="React">
            <span className="text-sm">😀</span>
          </button>
          <button className="p-1.5 hover:bg-[var(--color-bg-elevated)] rounded transition-colors" title="Reply">
            <span className="text-sm">↩️</span>
          </button>
          <button className="p-1.5 hover:bg-[var(--color-bg-elevated)] rounded transition-colors" title="More">
            <span className="text-sm">⋯</span>
          </button>
        </div>
      </div>
      <Text size="xs" tone="muted" className="text-center mt-4">Hover over the message above to see the action bar</Text>
    </div>
  </ConversationWrapper>
);

const ReactionD_Inline = () => (
  <ConversationWrapper>
    <div className="space-y-4">
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <div className="flex items-center gap-3">
            <Text size="sm">Hey everyone! Let's make this hackathon epic!</Text>
            <span className="text-sm flex-shrink-0">👍🎉🔥</span>
          </div>
        </div>
      </div>
    </div>
  </ConversationWrapper>
);

export const Variable4_ReactionStyle: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[1600px] mx-auto mb-8">
        <Text size="xl" weight="semibold" className="mb-2">Variable 4: Reaction Style</Text>
        <Text tone="muted">How should emoji reactions appear on messages? Hover over option C.</Text>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-2 gap-6">
        <LabCard label="A" title="Inline Chips" description="Pill-shaped buttons below message with counts">
          <ReactionA_InlineChips />
        </LabCard>

        <LabCard label="B" title="Corner Badge" description="Compact badge attached to message bubble corner">
          <ReactionB_CornerBadge />
        </LabCard>

        <LabCard label="C" title="Hover Action Bar" description="Floating toolbar appears on message hover">
          <ReactionC_HoverBar />
        </LabCard>

        <LabCard label="D" title="Inline Emojis" description="Just emojis inline with text, no counts">
          <ReactionD_Inline />
        </LabCard>
      </div>
    </div>
  ),
};

// ============================================
// FINAL RECOMMENDATIONS - 5 Complete Combinations
// ============================================

// Recommendation 1: Discord Mode (E, A, A, C)
const Combo1_Discord = () => (
  <div className="bg-[var(--color-bg-ground)] rounded-xl p-4 min-h-[320px]">
    <div className="space-y-0 -mx-4">
      <div className="group flex gap-4 py-2 px-4 hover:bg-[var(--color-bg-elevated)]/30 transition-colors cursor-default relative">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <Text size="sm" weight="semibold">Jane Doe</Text>
            <Text size="xs" tone="muted">Today at 2:30 PM</Text>
          </div>
          <Text size="sm" className="mt-0.5">Hey everyone! Who's working on the hackathon project tonight?</Text>
        </div>
        <div className="absolute -top-2 right-4 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-[var(--color-bg-card)] rounded-lg px-2 py-1 shadow-lg border border-[var(--color-border)]">
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">😀</button>
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">↩️</button>
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">⋯</button>
        </div>
      </div>
      <div className="group flex gap-4 py-2 px-4 hover:bg-[var(--color-bg-elevated)]/30 transition-colors cursor-default relative">
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <Text size="sm" weight="semibold">John Smith</Text>
            <Text size="xs" tone="muted">Today at 2:31 PM</Text>
          </div>
          <Text size="sm" className="mt-0.5">I'll be there! Working on the backend API.</Text>
        </div>
        <div className="absolute -top-2 right-4 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-[var(--color-bg-card)] rounded-lg px-2 py-1 shadow-lg border border-[var(--color-border)]">
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">😀</button>
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">↩️</button>
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">⋯</button>
        </div>
      </div>
      <div className="group flex gap-4 py-2 px-4 hover:bg-[var(--color-bg-elevated)]/30 transition-colors cursor-default relative">
        <Avatar size="sm"><AvatarFallback>ME</AvatarFallback></Avatar>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <Text size="sm" weight="semibold" className="text-[var(--color-accent-gold)]">You</Text>
            <Text size="xs" tone="muted">Today at 2:32 PM</Text>
          </div>
          <Text size="sm" className="mt-0.5">Perfect! I'll handle the frontend components. See you at 6!</Text>
        </div>
        <div className="absolute -top-2 right-4 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-[var(--color-bg-card)] rounded-lg px-2 py-1 shadow-lg border border-[var(--color-border)]">
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">😀</button>
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">↩️</button>
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">⋯</button>
        </div>
      </div>
      <div className="group flex gap-4 py-2 px-4 hover:bg-[var(--color-bg-elevated)]/30 transition-colors cursor-default relative">
        <Avatar size="sm"><AvatarFallback>AJ</AvatarFallback></Avatar>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <Text size="sm" weight="semibold">Alice Johnson</Text>
            <Text size="xs" tone="muted">Today at 2:33 PM</Text>
          </div>
          <Text size="sm" className="mt-0.5">Count me in! This is going to be great 🎉</Text>
        </div>
        <div className="absolute -top-2 right-4 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-[var(--color-bg-card)] rounded-lg px-2 py-1 shadow-lg border border-[var(--color-border)]">
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">😀</button>
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">↩️</button>
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">⋯</button>
        </div>
      </div>
    </div>
  </div>
);

// Recommendation 2: Slack Mode (B, B, A, A)
const Combo2_Slack = () => (
  <div className="bg-[var(--color-bg-ground)] rounded-xl p-4 min-h-[320px]">
    <div className="space-y-1">
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <Text size="sm">Hey everyone! Who's working on the hackathon project tonight?</Text>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="w-8 flex-shrink-0" />
        <Text size="sm">We need to finalize the design by tomorrow.</Text>
      </div>
      <div className="flex gap-3 mt-3">
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">John Smith</Text>
            <Text size="xs" tone="muted">2:31 PM</Text>
          </div>
          <Text size="sm">I'll be there! Working on the backend API.</Text>
          <div className="flex gap-1.5 mt-2">
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-surface)] ring-1 ring-[var(--color-interactive-active)]">
              <span>👍</span>
              <span className="text-[var(--color-text-secondary)]">2</span>
            </button>
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-3">
        <Avatar size="sm"><AvatarFallback>ME</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium" className="text-[var(--color-accent-gold)]">You</Text>
            <Text size="xs" tone="muted">2:32 PM</Text>
          </div>
          <Text size="sm">Perfect! I'll handle the frontend components. See you at 6!</Text>
          <div className="flex gap-1.5 mt-2">
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[var(--color-bg-elevated)]">
              <span>🎉</span>
              <span className="text-[var(--color-text-secondary)]">3</span>
            </button>
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[var(--color-bg-elevated)]">
              <span>🔥</span>
              <span className="text-[var(--color-text-secondary)]">1</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Recommendation 3: Linear Mode (D, D, B, C)
const Combo3_Linear = () => (
  <div className="bg-[var(--color-bg-ground)] rounded-xl p-4 min-h-[320px]">
    <div className="space-y-1">
      <div className="group flex gap-3 py-1.5 px-3 -mx-3 rounded-lg hover:bg-[var(--color-bg-elevated)]/50 transition-colors cursor-default relative">
        <div className="w-6 flex-shrink-0 flex justify-center">
          <Avatar size="xs" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <AvatarFallback className="text-label-xs">JD</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted" className="opacity-0 group-hover:opacity-100 transition-opacity">2:30 PM</Text>
          </div>
          <Text size="sm">Hey everyone! Who's working on the hackathon project tonight?</Text>
        </div>
        <div className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-[var(--color-bg-card)] rounded-lg px-2 py-1 shadow-lg border border-[var(--color-border)]">
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">😀</button>
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">↩️</button>
        </div>
      </div>
      <div className="group flex gap-3 py-1.5 px-3 -mx-3 rounded-lg hover:bg-[var(--color-bg-elevated)]/50 transition-colors cursor-default relative">
        <div className="w-6 flex-shrink-0 flex justify-center">
          <Avatar size="xs" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <AvatarFallback className="text-label-xs">JS</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <Text size="sm" weight="medium">John Smith</Text>
            <Text size="xs" tone="muted" className="opacity-0 group-hover:opacity-100 transition-opacity">2:31 PM</Text>
          </div>
          <Text size="sm">I'll be there! Working on the backend API.</Text>
        </div>
        <div className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-[var(--color-bg-card)] rounded-lg px-2 py-1 shadow-lg border border-[var(--color-border)]">
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">😀</button>
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">↩️</button>
        </div>
      </div>
      <div className="group flex gap-3 py-1.5 px-3 -mx-3 rounded-lg hover:bg-[var(--color-bg-elevated)]/50 transition-colors cursor-default relative">
        <div className="w-6 flex-shrink-0 flex justify-center">
          <Avatar size="xs" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <AvatarFallback className="text-label-xs">ME</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <Text size="sm" weight="medium" className="text-[var(--color-accent-gold)]">You</Text>
            <Text size="xs" tone="muted" className="opacity-0 group-hover:opacity-100 transition-opacity">2:32 PM</Text>
          </div>
          <Text size="sm">Perfect! I'll handle the frontend components.</Text>
        </div>
        <div className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-[var(--color-bg-card)] rounded-lg px-2 py-1 shadow-lg border border-[var(--color-border)]">
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">😀</button>
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">↩️</button>
        </div>
      </div>
      <div className="group flex gap-3 py-1.5 px-3 -mx-3 rounded-lg hover:bg-[var(--color-bg-elevated)]/50 transition-colors cursor-default relative">
        <div className="w-6 flex-shrink-0 flex justify-center">
          <Avatar size="xs" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <AvatarFallback className="text-label-xs">AJ</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <Text size="sm" weight="medium">Alice Johnson</Text>
            <Text size="xs" tone="muted" className="opacity-0 group-hover:opacity-100 transition-opacity">2:33 PM</Text>
          </div>
          <Text size="sm">See you all at 6! This is going to be great.</Text>
        </div>
        <div className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-[var(--color-bg-card)] rounded-lg px-2 py-1 shadow-lg border border-[var(--color-border)]">
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">😀</button>
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">↩️</button>
        </div>
      </div>
    </div>
  </div>
);

// Recommendation 4: iMessage Mode (A, A, A, B)
const Combo4_iMessage = () => (
  <div className="bg-[var(--color-bg-ground)] rounded-xl p-4 min-h-[320px]">
    <div className="space-y-4">
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <div className="bg-[var(--color-bg-elevated)] rounded-2xl rounded-tl-md px-4 py-2.5 max-w-[320px]">
            <Text size="sm">Hey everyone! Who's working on the hackathon?</Text>
          </div>
        </div>
      </div>
      <div className="flex gap-3 flex-row-reverse">
        <Avatar size="sm"><AvatarFallback>ME</AvatarFallback></Avatar>
        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-2 mb-1 flex-row-reverse">
            <Text size="sm" weight="medium">You</Text>
            <Text size="xs" tone="muted">2:31 PM</Text>
          </div>
          <div className="relative">
            <div className="bg-[var(--color-interactive-active)] text-white rounded-2xl rounded-tr-md px-4 py-2.5 max-w-[320px]">
              <Text size="sm" className="text-inherit">I'll be there! Handling the frontend.</Text>
            </div>
            <div className="absolute -bottom-2 right-4 flex items-center bg-[var(--color-bg-card)] rounded-full px-2 py-0.5 shadow-md border border-[var(--color-border)]">
              <span className="text-xs">👍 2</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <Text size="sm" weight="medium">John Smith</Text>
            <Text size="xs" tone="muted">2:32 PM</Text>
          </div>
          <div className="relative">
            <div className="bg-[var(--color-bg-elevated)] rounded-2xl rounded-tl-md px-4 py-2.5 max-w-[320px]">
              <Text size="sm">Perfect! I'll work on the backend API.</Text>
            </div>
            <div className="absolute -bottom-2 left-4 flex items-center bg-[var(--color-bg-card)] rounded-full px-2 py-0.5 shadow-md border border-[var(--color-border)]">
              <span className="text-xs">🎉 3</span>
              <span className="text-xs ml-1.5">🔥 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Recommendation 5: Notion Mode (C, B, C, A)
const Combo5_Notion = () => (
  <div className="bg-[var(--color-bg-ground)] rounded-xl p-4 min-h-[320px]">
    <div className="space-y-4">
      {/* Time divider */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-[var(--color-border)]" />
        <Text size="xs" tone="muted" className="px-2">Today at 2:30 PM</Text>
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>
      <div className="space-y-1">
        <div className="flex gap-3">
          <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
          <div className="pl-3 border-l-2 border-[var(--color-border-emphasis)] flex-1">
            <Text size="sm" weight="medium" className="mb-0.5">Jane Doe</Text>
            <Text size="sm">Hey everyone! Who's working on the hackathon project tonight?</Text>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-8 flex-shrink-0" />
          <div className="pl-3 border-l-2 border-[var(--color-border-emphasis)] flex-1">
            <Text size="sm">We need to finalize the design by tomorrow.</Text>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
        <div className="pl-3 border-l-2 border-[var(--color-border-emphasis)] flex-1">
          <Text size="sm" weight="medium" className="mb-0.5">John Smith</Text>
          <Text size="sm">I'll be there! Working on the backend API.</Text>
          <div className="flex gap-1.5 mt-2">
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[var(--color-bg-elevated)]">
              <span>👍</span>
              <span className="text-[var(--color-text-secondary)]">2</span>
            </button>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <Avatar size="sm"><AvatarFallback>ME</AvatarFallback></Avatar>
        <div className="pl-3 border-l-2 border-[var(--color-accent-gold)] flex-1">
          <Text size="sm" weight="medium" className="text-[var(--color-accent-gold)] mb-0.5">You</Text>
          <Text size="sm">Perfect! I'll handle the frontend. See you at 6!</Text>
          <div className="flex gap-1.5 mt-2">
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[var(--color-bg-elevated)] ring-1 ring-[var(--color-interactive-active)]">
              <span>🎉</span>
              <span className="text-[var(--color-text-secondary)]">3</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RecommendationCard = ({
  number,
  name,
  description,
  formula,
  children
}: {
  number: number;
  name: string;
  description: string;
  formula: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
    <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] flex items-center justify-center text-lg font-semibold">
            {number}
          </span>
          <div>
            <Text size="sm" weight="semibold">{name}</Text>
            <Text size="xs" tone="muted">{description}</Text>
          </div>
        </div>
        <div className="flex gap-1">
          {formula.split(', ').map((f, i) => (
            <span key={i} className="px-2 py-0.5 rounded text-xs bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
    <div className="p-6 flex-1">
      {children}
    </div>
  </div>
);

// ============================================
// DISCORD × APPLE HYBRID VARIATIONS
// ============================================

// Hybrid V1: Discord rows for others, Apple bubbles for self
const HybridV1_SplitStyle = () => (
  <div className="bg-[var(--color-bg-ground)] rounded-xl p-4 min-h-[360px]">
    <div className="space-y-0 -mx-4">
      {/* Other user - Discord style row */}
      <div className="group flex gap-4 py-2 px-4 hover:bg-[var(--color-bg-elevated)]/30 transition-colors cursor-default relative">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <Text size="sm" weight="semibold">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <Text size="sm" className="mt-0.5">Hey everyone! Who's working on the hackathon project tonight?</Text>
        </div>
        <div className="absolute -top-2 right-4 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-[var(--color-bg-card)] rounded-lg px-2 py-1 shadow-lg border border-[var(--color-border)]">
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">😀</button>
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">↩️</button>
        </div>
      </div>
      {/* Own message - Apple bubble, right-aligned */}
      <div className="flex justify-end px-4 py-2">
        <div className="group relative">
          <div className="bg-[var(--color-interactive-active)] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[360px]">
            <Text size="sm" className="text-inherit">I'll be there! Working on the frontend components.</Text>
          </div>
          <div className="absolute -top-2 left-0 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-[var(--color-bg-card)] rounded-lg px-2 py-1 shadow-lg border border-[var(--color-border)]">
            <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">😀</button>
            <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">↩️</button>
          </div>
          <Text size="xs" tone="muted" className="text-right mt-1">2:31 PM</Text>
        </div>
      </div>
      {/* Another user - Discord row */}
      <div className="group flex gap-4 py-2 px-4 hover:bg-[var(--color-bg-elevated)]/30 transition-colors cursor-default relative">
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <Text size="sm" weight="semibold">John Smith</Text>
            <Text size="xs" tone="muted">2:32 PM</Text>
          </div>
          <Text size="sm" className="mt-0.5">Perfect! I'll handle the backend API. See you at 6!</Text>
        </div>
        <div className="absolute -top-2 right-4 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-[var(--color-bg-card)] rounded-lg px-2 py-1 shadow-lg border border-[var(--color-border)]">
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">😀</button>
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">↩️</button>
        </div>
      </div>
      {/* Own message - Apple bubble */}
      <div className="flex justify-end px-4 py-2">
        <div className="group relative">
          <div className="bg-[var(--color-interactive-active)] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[360px]">
            <Text size="sm" className="text-inherit">See you then! This is going to be great 🎉</Text>
          </div>
          <div className="absolute -top-2 left-0 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-[var(--color-bg-card)] rounded-lg px-2 py-1 shadow-lg border border-[var(--color-border)]">
            <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">😀</button>
            <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">↩️</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Hybrid V2: Subtle glass bubbles for all, Discord hover bar
const HybridV2_GlassBubbles = () => (
  <div className="bg-[var(--color-bg-ground)] rounded-xl p-4 min-h-[360px]">
    <div className="space-y-3">
      {/* Other user - Glass bubble */}
      <div className="group flex gap-3 relative">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <Text size="sm" weight="medium">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[360px] border border-white/10">
            <Text size="sm">Hey everyone! Who's working on the hackathon project tonight?</Text>
          </div>
        </div>
        <div className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-[var(--color-bg-card)] rounded-lg px-2 py-1 shadow-lg border border-[var(--color-border)]">
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">😀</button>
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">↩️</button>
        </div>
      </div>
      {/* Own message - Gold tint glass bubble */}
      <div className="group flex gap-3 flex-row-reverse relative">
        <Avatar size="sm"><AvatarFallback>ME</AvatarFallback></Avatar>
        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-2 mb-1 flex-row-reverse">
            <Text size="sm" weight="medium" className="text-[var(--color-accent-gold)]">You</Text>
            <Text size="xs" tone="muted">2:31 PM</Text>
          </div>
          <div className="bg-[var(--color-accent-gold)]/15 backdrop-blur-sm rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[360px] border border-[var(--color-accent-gold)]/20">
            <Text size="sm">I'll be there! Working on the frontend components.</Text>
          </div>
        </div>
        <div className="absolute -top-2 left-0 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-[var(--color-bg-card)] rounded-lg px-2 py-1 shadow-lg border border-[var(--color-border)]">
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">😀</button>
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">↩️</button>
        </div>
      </div>
      {/* Another user */}
      <div className="group flex gap-3 relative">
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <Text size="sm" weight="medium">John Smith</Text>
            <Text size="xs" tone="muted">2:32 PM</Text>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[360px] border border-white/10">
            <Text size="sm">Perfect! See you at 6!</Text>
          </div>
        </div>
        <div className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-[var(--color-bg-card)] rounded-lg px-2 py-1 shadow-lg border border-[var(--color-border)]">
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">😀</button>
          <button className="p-1 hover:bg-[var(--color-bg-elevated)] rounded text-sm">↩️</button>
        </div>
      </div>
    </div>
  </div>
);

// Hybrid V3: Discord density with Apple bubble aesthetics
const HybridV3_DenseApple = () => (
  <div className="bg-[var(--color-bg-ground)] rounded-xl p-4 min-h-[360px]">
    <div className="space-y-2 -mx-2">
      {/* Other - Compact bubble in Discord-like row */}
      <div className="group flex gap-3 py-1.5 px-2 hover:bg-[var(--color-bg-elevated)]/20 rounded-lg transition-colors relative">
        <Avatar size="xs"><AvatarFallback className="text-label-xs">JD</AvatarFallback></Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="xs" weight="semibold">Jane Doe</Text>
            <Text size="xs" tone="muted" className="opacity-60">2:30 PM</Text>
          </div>
          <div className="bg-[var(--color-bg-elevated)] rounded-xl rounded-tl-sm px-3 py-1.5 inline-block max-w-[85%]">
            <Text size="sm">Hey everyone! Who's working on the hackathon project tonight?</Text>
          </div>
        </div>
        <div className="absolute -top-1 right-2 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-0.5 bg-[var(--color-bg-card)] rounded-md px-1.5 py-0.5 shadow-lg border border-[var(--color-border)]">
          <button className="p-0.5 hover:bg-[var(--color-bg-elevated)] rounded text-xs">😀</button>
          <button className="p-0.5 hover:bg-[var(--color-bg-elevated)] rounded text-xs">↩️</button>
        </div>
      </div>
      {/* Own - Apple style but compact */}
      <div className="group flex gap-3 py-1.5 px-2 hover:bg-[var(--color-bg-elevated)]/20 rounded-lg transition-colors relative flex-row-reverse">
        <Avatar size="xs"><AvatarFallback className="text-label-xs">ME</AvatarFallback></Avatar>
        <div className="flex-1 min-w-0 flex flex-col items-end">
          <div className="flex items-baseline gap-2 mb-0.5 flex-row-reverse">
            <Text size="xs" weight="semibold" className="text-[var(--color-accent-gold)]">You</Text>
            <Text size="xs" tone="muted" className="opacity-60">2:31 PM</Text>
          </div>
          <div className="bg-[var(--color-interactive-active)] text-white rounded-xl rounded-tr-sm px-3 py-1.5 inline-block max-w-[85%]">
            <Text size="sm" className="text-inherit">I'll be there! Working on the frontend.</Text>
          </div>
        </div>
        <div className="absolute -top-1 left-2 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-0.5 bg-[var(--color-bg-card)] rounded-md px-1.5 py-0.5 shadow-lg border border-[var(--color-border)]">
          <button className="p-0.5 hover:bg-[var(--color-bg-elevated)] rounded text-xs">😀</button>
          <button className="p-0.5 hover:bg-[var(--color-bg-elevated)] rounded text-xs">↩️</button>
        </div>
      </div>
      {/* Follow-up from same user (grouped) */}
      <div className="group flex gap-3 py-1 px-2 hover:bg-[var(--color-bg-elevated)]/20 rounded-lg transition-colors relative flex-row-reverse">
        <div className="w-5 flex-shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col items-end">
          <div className="bg-[var(--color-interactive-active)] text-white rounded-xl px-3 py-1.5 inline-block max-w-[85%]">
            <Text size="sm" className="text-inherit">Building out the component library now.</Text>
          </div>
        </div>
        <div className="absolute -top-1 left-2 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-0.5 bg-[var(--color-bg-card)] rounded-md px-1.5 py-0.5 shadow-lg border border-[var(--color-border)]">
          <button className="p-0.5 hover:bg-[var(--color-bg-elevated)] rounded text-xs">😀</button>
          <button className="p-0.5 hover:bg-[var(--color-bg-elevated)] rounded text-xs">↩️</button>
        </div>
      </div>
      {/* Another user */}
      <div className="group flex gap-3 py-1.5 px-2 hover:bg-[var(--color-bg-elevated)]/20 rounded-lg transition-colors relative">
        <Avatar size="xs"><AvatarFallback className="text-label-xs">JS</AvatarFallback></Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="xs" weight="semibold">John Smith</Text>
            <Text size="xs" tone="muted" className="opacity-60">2:32 PM</Text>
          </div>
          <div className="bg-[var(--color-bg-elevated)] rounded-xl rounded-tl-sm px-3 py-1.5 inline-block max-w-[85%]">
            <Text size="sm">Perfect! I'll handle the backend API. See you at 6!</Text>
          </div>
        </div>
        <div className="absolute -top-1 right-2 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-0.5 bg-[var(--color-bg-card)] rounded-md px-1.5 py-0.5 shadow-lg border border-[var(--color-border)]">
          <button className="p-0.5 hover:bg-[var(--color-bg-elevated)] rounded text-xs">😀</button>
          <button className="p-0.5 hover:bg-[var(--color-bg-elevated)] rounded text-xs">↩️</button>
        </div>
      </div>
    </div>
  </div>
);

// Hybrid V4: All centered flow, bubbles with hover highlight
const HybridV4_CenteredFlow = () => (
  <div className="bg-[var(--color-bg-ground)] rounded-xl p-4 min-h-[360px]">
    <div className="space-y-3 max-w-[500px] mx-auto">
      {/* Other user */}
      <div className="group flex gap-3 relative">
        <Avatar size="sm"><AvatarFallback>JD</AvatarFallback></Avatar>
        <div className="flex-1">
          <Text size="xs" weight="medium" className="mb-1 text-[var(--color-text-secondary)]">Jane Doe</Text>
          <div className="bg-[var(--color-bg-elevated)] rounded-2xl rounded-tl-md px-4 py-3 hover:bg-[var(--color-bg-surface)] transition-colors">
            <Text size="sm">Hey everyone! Who's working on the hackathon project tonight?</Text>
          </div>
          <Text size="xs" tone="muted" className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">2:30 PM</Text>
        </div>
        <div className="absolute top-6 -right-2 opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-0.5 bg-[var(--color-bg-card)] rounded-lg p-1 shadow-lg border border-[var(--color-border)]">
          <button className="p-1.5 hover:bg-[var(--color-bg-elevated)] rounded text-sm">😀</button>
          <button className="p-1.5 hover:bg-[var(--color-bg-elevated)] rounded text-sm">↩️</button>
        </div>
      </div>
      {/* Own message */}
      <div className="group flex gap-3 flex-row-reverse relative">
        <Avatar size="sm"><AvatarFallback>ME</AvatarFallback></Avatar>
        <div className="flex-1 flex flex-col items-end">
          <Text size="xs" weight="medium" className="mb-1 text-[var(--color-accent-gold)]">You</Text>
          <div className="bg-gradient-to-br from-[var(--color-interactive-active)] to-[var(--color-interactive-active)]/80 text-white rounded-2xl rounded-tr-md px-4 py-3 hover:from-[var(--color-interactive-active)]/90 hover:to-[var(--color-interactive-active)]/70 transition-colors">
            <Text size="sm" className="text-inherit">I'll be there! Working on the frontend components.</Text>
          </div>
          <Text size="xs" tone="muted" className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">2:31 PM</Text>
        </div>
        <div className="absolute top-6 -left-2 opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-0.5 bg-[var(--color-bg-card)] rounded-lg p-1 shadow-lg border border-[var(--color-border)]">
          <button className="p-1.5 hover:bg-[var(--color-bg-elevated)] rounded text-sm">😀</button>
          <button className="p-1.5 hover:bg-[var(--color-bg-elevated)] rounded text-sm">↩️</button>
        </div>
      </div>
      {/* Another */}
      <div className="group flex gap-3 relative">
        <Avatar size="sm"><AvatarFallback>JS</AvatarFallback></Avatar>
        <div className="flex-1">
          <Text size="xs" weight="medium" className="mb-1 text-[var(--color-text-secondary)]">John Smith</Text>
          <div className="bg-[var(--color-bg-elevated)] rounded-2xl rounded-tl-md px-4 py-3 hover:bg-[var(--color-bg-surface)] transition-colors">
            <Text size="sm">Perfect! I'll handle the backend API. See you at 6!</Text>
          </div>
          <Text size="xs" tone="muted" className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">2:32 PM</Text>
        </div>
        <div className="absolute top-6 -right-2 opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-0.5 bg-[var(--color-bg-card)] rounded-lg p-1 shadow-lg border border-[var(--color-border)]">
          <button className="p-1.5 hover:bg-[var(--color-bg-elevated)] rounded text-sm">😀</button>
          <button className="p-1.5 hover:bg-[var(--color-bg-elevated)] rounded text-sm">↩️</button>
        </div>
      </div>
    </div>
  </div>
);

// Hybrid V5: Premium — Glass bubbles, gold accents, vertical action bar
const HybridV5_Premium = () => (
  <div className="bg-gradient-to-b from-[var(--color-bg-ground)] to-[var(--color-bg-ground)]/95 rounded-xl p-6 min-h-[360px]">
    <div className="space-y-4">
      {/* Other user */}
      <div className="group flex gap-4 relative">
        <div className="relative">
          <Avatar size="md"><AvatarFallback>JD</AvatarFallback></Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--color-bg-ground)]" />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1.5">
            <Text size="sm" weight="semibold">Jane Doe</Text>
            <Text size="xs" tone="muted">2:30 PM</Text>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl rounded-tl-sm px-5 py-3 border border-white/[0.06] shadow-lg shadow-black/10 max-w-[400px]">
            <Text size="sm">Hey everyone! Who's working on the hackathon project tonight?</Text>
          </div>
        </div>
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-black/50 backdrop-blur-xl rounded-full px-2 py-1 border border-white/10">
          <button className="p-1 hover:bg-white/10 rounded-full text-sm transition-colors">😀</button>
          <button className="p-1 hover:bg-white/10 rounded-full text-sm transition-colors">↩️</button>
          <button className="p-1 hover:bg-white/10 rounded-full text-sm transition-colors">⋯</button>
        </div>
      </div>
      {/* Own message */}
      <div className="group flex gap-4 flex-row-reverse relative">
        <div className="relative">
          <Avatar size="md"><AvatarFallback className="bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]">ME</AvatarFallback></Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--color-accent-gold)] rounded-full border-2 border-[var(--color-bg-ground)]" />
        </div>
        <div className="flex-1 flex flex-col items-end">
          <div className="flex items-baseline gap-2 mb-1.5 flex-row-reverse">
            <Text size="sm" weight="semibold" className="text-[var(--color-accent-gold)]">You</Text>
            <Text size="xs" tone="muted">2:31 PM</Text>
          </div>
          <div className="bg-gradient-to-br from-[var(--color-accent-gold)]/20 to-[var(--color-accent-gold)]/10 backdrop-blur-xl rounded-2xl rounded-tr-sm px-5 py-3 border border-[var(--color-accent-gold)]/20 shadow-lg shadow-[var(--color-accent-gold)]/5 max-w-[400px]">
            <Text size="sm">I'll be there! Working on the frontend components.</Text>
          </div>
        </div>
        <div className="absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-black/50 backdrop-blur-xl rounded-full px-2 py-1 border border-white/10">
          <button className="p-1 hover:bg-white/10 rounded-full text-sm transition-colors">😀</button>
          <button className="p-1 hover:bg-white/10 rounded-full text-sm transition-colors">↩️</button>
          <button className="p-1 hover:bg-white/10 rounded-full text-sm transition-colors">⋯</button>
        </div>
      </div>
      {/* Another user */}
      <div className="group flex gap-4 relative">
        <div className="relative">
          <Avatar size="md"><AvatarFallback>JS</AvatarFallback></Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--color-bg-ground)]" />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1.5">
            <Text size="sm" weight="semibold">John Smith</Text>
            <Text size="xs" tone="muted">2:32 PM</Text>
          </div>
          <div className="relative">
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl rounded-tl-sm px-5 py-3 border border-white/[0.06] shadow-lg shadow-black/10 max-w-[400px]">
              <Text size="sm">Perfect! I'll handle the backend API. See you at 6! 🔥</Text>
            </div>
            {/* Reaction badge */}
            <div className="absolute -bottom-2 left-4 flex items-center bg-[var(--color-bg-card)] rounded-full px-2 py-0.5 shadow-md border border-[var(--color-border)]">
              <span className="text-xs">🔥 3</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-black/50 backdrop-blur-xl rounded-full px-2 py-1 border border-white/10">
          <button className="p-1 hover:bg-white/10 rounded-full text-sm transition-colors">😀</button>
          <button className="p-1 hover:bg-white/10 rounded-full text-sm transition-colors">↩️</button>
          <button className="p-1 hover:bg-white/10 rounded-full text-sm transition-colors">⋯</button>
        </div>
      </div>
    </div>
  </div>
);

const HybridCard = ({
  label,
  name,
  description,
  children
}: {
  label: string;
  name: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
    <div className="px-6 py-4 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-accent-gold)]/5 to-transparent">
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-lg bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] flex items-center justify-center text-lg font-bold">
          {label}
        </span>
        <div>
          <Text size="sm" weight="semibold">{name}</Text>
          <Text size="xs" tone="muted">{description}</Text>
        </div>
      </div>
    </div>
    <div className="p-4 flex-1">
      {children}
    </div>
  </div>
);

export const DiscordAppleHybrid: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[1600px] mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🎮</span>
          <span className="text-xl">×</span>
          <span className="text-2xl">🍎</span>
        </div>
        <Text size="xl" weight="semibold" className="mb-2">Discord × Apple Hybrid</Text>
        <Text tone="muted">5 variations combining Discord's efficiency with Apple's polish. Hover each to test interactions.</Text>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-2 gap-6">
        <HybridCard
          label="1"
          name="Split Style"
          description="Discord rows for others, Apple bubbles for you"
        >
          <HybridV1_SplitStyle />
        </HybridCard>

        <HybridCard
          label="2"
          name="Glass Bubbles"
          description="Frosted glass bubbles with Discord hover bar"
        >
          <HybridV2_GlassBubbles />
        </HybridCard>

        <HybridCard
          label="3"
          name="Dense Apple"
          description="Discord density + Apple bubble aesthetics"
        >
          <HybridV3_DenseApple />
        </HybridCard>

        <HybridCard
          label="4"
          name="Centered Flow"
          description="Centered conversation with hover timestamps"
        >
          <HybridV4_CenteredFlow />
        </HybridCard>

        <div className="col-span-2">
          <HybridCard
            label="5"
            name="Premium"
            description="Glass morphism, gold accents, presence indicators, corner reactions"
          >
            <HybridV5_Premium />
          </HybridCard>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto mt-8 p-6 bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)]">
        <Text size="sm" weight="medium" className="mb-3">Hybrid Features Summary</Text>
        <div className="grid grid-cols-5 gap-4 text-xs">
          <div>
            <Text size="xs" weight="medium" className="mb-1 text-[var(--color-accent-gold)]">V1: Split Style</Text>
            <div className="space-y-0.5 text-[var(--color-text-muted)]">
              <div>• Discord rows for others</div>
              <div>• Apple bubbles for self</div>
              <div>• Hover action bar</div>
            </div>
          </div>
          <div>
            <Text size="xs" weight="medium" className="mb-1 text-[var(--color-accent-gold)]">V2: Glass Bubbles</Text>
            <div className="space-y-0.5 text-[var(--color-text-muted)]">
              <div>• Frosted glass effect</div>
              <div>• Gold tint for self</div>
              <div>• Subtle borders</div>
            </div>
          </div>
          <div>
            <Text size="xs" weight="medium" className="mb-1 text-[var(--color-accent-gold)]">V3: Dense Apple</Text>
            <div className="space-y-0.5 text-[var(--color-text-muted)]">
              <div>• Compact layout</div>
              <div>• Grouped messages</div>
              <div>• Small avatars</div>
            </div>
          </div>
          <div>
            <Text size="xs" weight="medium" className="mb-1 text-[var(--color-accent-gold)]">V4: Centered Flow</Text>
            <div className="space-y-0.5 text-[var(--color-text-muted)]">
              <div>• Centered layout</div>
              <div>• Hover timestamps</div>
              <div>• Gradient bubbles</div>
            </div>
          </div>
          <div>
            <Text size="xs" weight="medium" className="mb-1 text-[var(--color-accent-gold)]">V5: Premium</Text>
            <div className="space-y-0.5 text-[var(--color-text-muted)]">
              <div>• Glass morphism</div>
              <div>• Presence dots</div>
              <div>• Corner reactions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const FinalRecommendations: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[1600px] mx-auto mb-8">
        <Text size="xl" weight="semibold" className="mb-2">Final Recommendations</Text>
        <Text tone="muted">5 complete combinations to choose from. Each represents a different design philosophy. Hover to test interactions.</Text>
        <div className="flex gap-4 mt-4 text-xs">
          <span className="text-[var(--color-text-muted)]">Formula: Bubble, Avatar, Timestamp, Reaction</span>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-2 gap-6">
        <RecommendationCard
          number={1}
          name="Discord Mode"
          description="Dense, information-rich, gamer-friendly"
          formula="E, A, A, C"
        >
          <Combo1_Discord />
        </RecommendationCard>

        <RecommendationCard
          number={2}
          name="Slack Mode"
          description="Professional, grouped, clear threading"
          formula="B, B, A, A"
        >
          <Combo2_Slack />
        </RecommendationCard>

        <RecommendationCard
          number={3}
          name="Linear Mode"
          description="Ultra-minimal, progressive disclosure"
          formula="D, D, B, C"
        >
          <Combo3_Linear />
        </RecommendationCard>

        <RecommendationCard
          number={4}
          name="iMessage Mode"
          description="Familiar, personal, conversation-focused"
          formula="A, A, A, B"
        >
          <Combo4_iMessage />
        </RecommendationCard>

        <RecommendationCard
          number={5}
          name="Notion Mode"
          description="Document-like, structured, thoughtful"
          formula="C, B, C, A"
        >
          <Combo5_Notion />
        </RecommendationCard>
      </div>

      <div className="max-w-[1600px] mx-auto mt-8 p-6 bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)]">
        <Text size="sm" weight="medium" className="mb-3">Variable Key</Text>
        <div className="grid grid-cols-4 gap-6 text-xs">
          <div>
            <Text size="xs" weight="medium" className="mb-1">Bubble Style</Text>
            <div className="space-y-0.5 text-[var(--color-text-muted)]">
              <div>A = Full Bubble</div>
              <div>B = Borderless</div>
              <div>C = Left Accent</div>
              <div>D = Minimal Hover</div>
              <div>E = Discord Row</div>
            </div>
          </div>
          <div>
            <Text size="xs" weight="medium" className="mb-1">Avatar Treatment</Text>
            <div className="space-y-0.5 text-[var(--color-text-muted)]">
              <div>A = Every Message</div>
              <div>B = First in Group</div>
              <div>C = Never</div>
              <div>D = Hover Reveal</div>
              <div>E = Left Gutter</div>
            </div>
          </div>
          <div>
            <Text size="xs" weight="medium" className="mb-1">Timestamp Display</Text>
            <div className="space-y-0.5 text-[var(--color-text-muted)]">
              <div>A = Always Visible</div>
              <div>B = Hover Only</div>
              <div>C = Group Headers</div>
              <div>D = Relative Time</div>
              <div>E = Right Aligned</div>
            </div>
          </div>
          <div>
            <Text size="xs" weight="medium" className="mb-1">Reaction Style</Text>
            <div className="space-y-0.5 text-[var(--color-text-muted)]">
              <div>A = Inline Chips</div>
              <div>B = Corner Badge</div>
              <div>C = Hover Action Bar</div>
              <div>D = Inline Emojis</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};
