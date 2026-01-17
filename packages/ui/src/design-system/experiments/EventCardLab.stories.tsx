import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  Card,
  Text,
  Badge,
  Button,
  Avatar,
  AvatarFallback,
  getInitials,
} from '../primitives';
import { cn } from '../../lib/utils';

/**
 * # EventCard Lab
 *
 * Testing EventCard variations across 4 independent variables:
 * 1. Time Display
 * 2. RSVP Style
 * 3. Live/Active Indicator
 * 4. Information Density
 */
const meta: Meta = {
  title: 'Design System/Lab/EventCard',
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

const upcomingEvent = {
  id: '1',
  title: 'Weekly Standup',
  description: 'Quick sync on project progress and blockers. All team members encouraged to attend.',
  location: 'Davis Hall 101',
  startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
  endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
  rsvpCount: 12,
  maxCapacity: 20,
  isRsvped: false,
  host: { id: '1', name: 'Jane Doe' },
  space: { id: '1', name: 'UB Hackers' },
};

const liveEvent = {
  ...upcomingEvent,
  id: '2',
  title: 'Hackathon Kickoff',
  startTime: new Date(Date.now() - 30 * 60 * 1000), // Started 30 min ago
  endTime: new Date(Date.now() + 5.5 * 60 * 60 * 1000),
  rsvpCount: 45,
  maxCapacity: 50,
  isLive: true,
};

const tomorrowEvent = {
  ...upcomingEvent,
  id: '3',
  title: 'Design Workshop',
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  endTime: new Date(Date.now() + 26 * 60 * 60 * 1000),
  rsvpCount: 8,
  isRsvped: true,
};

// Helper functions
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (diff < 0) return 'Live now';
  if (hours < 1) return `in ${minutes}m`;
  if (hours < 24) return `in ${hours}h`;
  if (hours < 48) return 'Tomorrow';
  return `in ${Math.floor(hours / 24)}d`;
}

function formatAbsoluteTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatCountdown(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff < 0) return 'NOW';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ============================================
// VARIABLE 1: TIME DISPLAY
// ============================================

export const Variable1_TimeDisplay: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div>
          <Text size="xl" weight="semibold">Variable 1: Time Display</Text>
          <Text size="sm" tone="muted" className="mt-1">
            How should event times be shown?
          </Text>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* A: Relative */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">A: Relative ("in 2h")</Text>
            <Card elevation="resting" noPadding className="p-4">
              <div className="flex justify-between items-start mb-3">
                <Text size="lg" weight="semibold">{upcomingEvent.title}</Text>
                <Badge variant="default" size="sm">{formatRelativeTime(upcomingEvent.startTime)}</Badge>
              </div>
              <Text size="sm" tone="muted">{upcomingEvent.location}</Text>
              <Text size="xs" tone="muted" className="mt-2">{upcomingEvent.rsvpCount} going</Text>
            </Card>
          </div>

          {/* B: Absolute (Recommended) */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">B: Absolute ("3:00 PM") — Recommended</Text>
            <Card elevation="resting" noPadding className="p-4">
              <div className="flex justify-between items-start mb-3">
                <Text size="lg" weight="semibold">{upcomingEvent.title}</Text>
                <Text size="sm" weight="medium">{formatAbsoluteTime(upcomingEvent.startTime)}</Text>
              </div>
              <Text size="sm" tone="muted">{upcomingEvent.location}</Text>
              <Text size="xs" tone="muted" className="mt-2">{upcomingEvent.rsvpCount} going</Text>
            </Card>
          </div>

          {/* C: Countdown */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">C: Countdown ("1:45:30")</Text>
            <Card elevation="resting" noPadding className="p-4">
              <div className="flex justify-between items-start mb-3">
                <Text size="lg" weight="semibold">{upcomingEvent.title}</Text>
                <Text size="sm" weight="semibold" className="font-mono text-[var(--color-accent-gold)]">
                  {formatCountdown(upcomingEvent.startTime)}
                </Text>
              </div>
              <Text size="sm" tone="muted">{upcomingEvent.location}</Text>
              <Text size="xs" tone="muted" className="mt-2">{upcomingEvent.rsvpCount} going</Text>
            </Card>
          </div>

          {/* D: Smart (Context-Aware) */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">D: Smart (relative for near, absolute for far)</Text>
            <Card elevation="resting" noPadding className="p-4">
              <div className="flex justify-between items-start mb-3">
                <Text size="lg" weight="semibold">{upcomingEvent.title}</Text>
                <div className="text-right">
                  <Text size="sm" weight="medium">{formatAbsoluteTime(upcomingEvent.startTime)}</Text>
                  <Text size="xs" tone="muted">{formatRelativeTime(upcomingEvent.startTime)}</Text>
                </div>
              </div>
              <Text size="sm" tone="muted">{upcomingEvent.location}</Text>
              <Text size="xs" tone="muted" className="mt-2">{upcomingEvent.rsvpCount} going</Text>
            </Card>
          </div>
        </div>

        {/* Recommendation */}
        <Card warmth="subtle" noPadding className="p-6">
          <Text size="sm" weight="medium" className="mb-3 text-[var(--color-accent-gold)]">Recommendation: B (Absolute)</Text>
          <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <li>• Absolute times are more actionable (can plan around "3:00 PM")</li>
            <li>• Relative is ambiguous (when exactly is "in 2h"?)</li>
            <li>• Countdown is too urgent for general use (save for rituals)</li>
            <li>• Smart is good but adds cognitive load with two values</li>
          </ul>
        </Card>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 2: RSVP STYLE
// ============================================

export const Variable2_RSVPStyle: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div>
          <Text size="xl" weight="semibold">Variable 2: RSVP Style</Text>
          <Text size="sm" tone="muted" className="mt-1">
            How should RSVP interaction look?
          </Text>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* A: Button */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">A: Button</Text>
            <Card elevation="resting" noPadding className="p-4">
              <Text size="lg" weight="semibold" className="mb-1">{upcomingEvent.title}</Text>
              <Text size="sm" tone="muted" className="mb-3">{formatAbsoluteTime(upcomingEvent.startTime)} · {upcomingEvent.location}</Text>
              <div className="flex items-center justify-between">
                <Text size="xs" tone="muted">{upcomingEvent.rsvpCount}/{upcomingEvent.maxCapacity} going</Text>
                <Button variant="cta" size="sm">RSVP</Button>
              </div>
            </Card>
          </div>

          {/* B: Toggle Chip (Recommended) */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">B: Toggle Chip — Recommended</Text>
            <Card elevation="resting" noPadding className="p-4">
              <Text size="lg" weight="semibold" className="mb-1">{upcomingEvent.title}</Text>
              <Text size="sm" tone="muted" className="mb-3">{formatAbsoluteTime(upcomingEvent.startTime)} · {upcomingEvent.location}</Text>
              <div className="flex items-center justify-between">
                <Text size="xs" tone="muted">{upcomingEvent.rsvpCount}/{upcomingEvent.maxCapacity} going</Text>
                <button className="px-3 py-1.5 rounded-full text-sm font-medium bg-white/10 hover:bg-white/15 transition-colors">
                  Going?
                </button>
              </div>
            </Card>
            {/* Toggled state */}
            <Card elevation="resting" noPadding className="p-4 mt-3">
              <Text size="lg" weight="semibold" className="mb-1">{tomorrowEvent.title}</Text>
              <Text size="sm" tone="muted" className="mb-3">{formatAbsoluteTime(tomorrowEvent.startTime)} · {tomorrowEvent.location}</Text>
              <div className="flex items-center justify-between">
                <Text size="xs" tone="muted">{tomorrowEvent.rsvpCount}/{upcomingEvent.maxCapacity} going</Text>
                <button className="px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]">
                  ✓ Going
                </button>
              </div>
            </Card>
          </div>

          {/* C: Count Badge */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">C: Clickable Count Badge</Text>
            <Card elevation="resting" noPadding className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <Text size="lg" weight="semibold">{upcomingEvent.title}</Text>
                  <Text size="sm" tone="muted">{formatAbsoluteTime(upcomingEvent.startTime)} · {upcomingEvent.location}</Text>
                </div>
                <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 transition-colors">
                  <span className="text-sm">👋</span>
                  <span className="text-sm font-medium">{upcomingEvent.rsvpCount}</span>
                </button>
              </div>
            </Card>
          </div>

          {/* D: Inline Text */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">D: Inline Text Link</Text>
            <Card elevation="resting" noPadding className="p-4">
              <Text size="lg" weight="semibold" className="mb-1">{upcomingEvent.title}</Text>
              <Text size="sm" tone="muted" className="mb-3">{formatAbsoluteTime(upcomingEvent.startTime)} · {upcomingEvent.location}</Text>
              <Text size="sm" tone="muted">
                {upcomingEvent.rsvpCount} going · <span className="text-[var(--color-interactive-active)] cursor-pointer hover:underline">Join</span>
              </Text>
            </Card>
          </div>
        </div>

        {/* Recommendation */}
        <Card warmth="subtle" noPadding className="p-6">
          <Text size="sm" weight="medium" className="mb-3 text-[var(--color-accent-gold)]">Recommendation: B (Toggle Chip)</Text>
          <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <li>• Toggle shows clear state (Going vs not going)</li>
            <li>• Gold tint for "Going" matches achievement/earned feel</li>
            <li>• Less aggressive than CTA button (events aren't conversions)</li>
            <li>• Button is too sales-y, count badge hides the action</li>
          </ul>
        </Card>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 3: LIVE INDICATOR
// ============================================

export const Variable3_LiveIndicator: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div>
          <Text size="xl" weight="semibold">Variable 3: Live/Active Indicator</Text>
          <Text size="sm" tone="muted" className="mt-1">
            How to show an event is happening now?
          </Text>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* A: Pulse Dot */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">A: Pulse Dot</Text>
            <Card elevation="resting" noPadding className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                </div>
                <Text size="lg" weight="semibold">{liveEvent.title}</Text>
              </div>
              <Text size="sm" tone="muted">{liveEvent.location}</Text>
              <Text size="xs" tone="muted" className="mt-2">{liveEvent.rsvpCount} attending</Text>
            </Card>
          </div>

          {/* B: Edge Warmth (Recommended) */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">B: Edge Warmth — Recommended</Text>
            <Card elevation="resting" warmth="edge" noPadding className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="gold" size="sm">LIVE</Badge>
                <Text size="lg" weight="semibold">{liveEvent.title}</Text>
              </div>
              <Text size="sm" tone="muted">{liveEvent.location}</Text>
              <Text size="xs" tone="muted" className="mt-2">{liveEvent.rsvpCount} attending</Text>
            </Card>
          </div>

          {/* C: Badge Only */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">C: Badge Only</Text>
            <Card elevation="resting" noPadding className="p-4">
              <div className="flex justify-between items-start mb-1">
                <Text size="lg" weight="semibold">{liveEvent.title}</Text>
                <Badge variant="gold" size="sm">LIVE</Badge>
              </div>
              <Text size="sm" tone="muted">{liveEvent.location}</Text>
              <Text size="xs" tone="muted" className="mt-2">{liveEvent.rsvpCount} attending</Text>
            </Card>
          </div>

          {/* D: Red Border */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">D: Red Border (YouTube-style)</Text>
            <Card elevation="resting" noPadding className="p-4 ring-2 ring-red-500/50">
              <div className="flex items-center gap-2 mb-1">
                <div className="px-1.5 py-0.5 rounded bg-red-500 text-white text-xs font-bold">LIVE</div>
                <Text size="lg" weight="semibold">{liveEvent.title}</Text>
              </div>
              <Text size="sm" tone="muted">{liveEvent.location}</Text>
              <Text size="xs" tone="muted" className="mt-2">{liveEvent.rsvpCount} attending</Text>
            </Card>
          </div>
        </div>

        {/* Recommendation */}
        <Card warmth="subtle" noPadding className="p-6">
          <Text size="sm" weight="medium" className="mb-3 text-[var(--color-accent-gold)]">Recommendation: B (Edge Warmth)</Text>
          <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <li>• Gold warmth = activity/life (locked design system pattern)</li>
            <li>• Matches SpaceCard warmth for active spaces</li>
            <li>• LIVE badge provides explicit label</li>
            <li>• Red feels too aggressive/YouTube-ish for campus events</li>
          </ul>
        </Card>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 4: INFORMATION DENSITY
// ============================================

export const Variable4_InformationDensity: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div>
          <Text size="xl" weight="semibold">Variable 4: Information Density</Text>
          <Text size="sm" tone="muted" className="mt-1">
            How much info to show on the card?
          </Text>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* A: Minimal */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">A: Minimal</Text>
            <Card elevation="resting" noPadding className="p-4">
              <Text size="lg" weight="semibold">{upcomingEvent.title}</Text>
              <Text size="sm" tone="muted">{formatAbsoluteTime(upcomingEvent.startTime)}</Text>
            </Card>
          </div>

          {/* B: Standard (Recommended) */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">B: Standard — Recommended</Text>
            <Card elevation="resting" noPadding className="p-4">
              <Text size="lg" weight="semibold" className="mb-1">{upcomingEvent.title}</Text>
              <Text size="sm" tone="muted">{formatAbsoluteTime(upcomingEvent.startTime)} · {upcomingEvent.location}</Text>
              <div className="flex items-center justify-between mt-3">
                <Text size="xs" tone="muted">{upcomingEvent.rsvpCount} going</Text>
                <button className="px-3 py-1.5 rounded-full text-sm font-medium bg-white/10 hover:bg-white/15 transition-colors">
                  Going?
                </button>
              </div>
            </Card>
          </div>

          {/* C: Dense */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">C: Dense</Text>
            <Card elevation="resting" noPadding className="p-4">
              <div className="flex justify-between items-start mb-2">
                <Text size="lg" weight="semibold">{upcomingEvent.title}</Text>
                <Text size="sm" weight="medium">{formatAbsoluteTime(upcomingEvent.startTime)}</Text>
              </div>
              <Text size="sm" tone="muted" className="mb-2">{upcomingEvent.location}</Text>
              <Text size="sm" tone="secondary" className="mb-3 line-clamp-2">{upcomingEvent.description}</Text>
              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <Avatar size="xs">
                    <AvatarFallback className="text-[8px]">{getInitials(upcomingEvent.host.name)}</AvatarFallback>
                  </Avatar>
                  <Text size="xs" tone="muted">Hosted by {upcomingEvent.host.name}</Text>
                </div>
                <Text size="xs" tone="muted">{upcomingEvent.rsvpCount}/{upcomingEvent.maxCapacity}</Text>
              </div>
            </Card>
          </div>
        </div>

        {/* Recommendation */}
        <Card warmth="subtle" noPadding className="p-6">
          <Text size="sm" weight="medium" className="mb-3 text-[var(--color-accent-gold)]">Recommendation: B (Standard)</Text>
          <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <li>• Title + time + location + count covers 90% of use cases</li>
            <li>• Minimal lacks actionable info (where? how many?)</li>
            <li>• Dense is overwhelming for feed/list contexts</li>
            <li>• Save dense info for event detail page</li>
          </ul>
        </Card>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 5: DISTINCTIVE TREATMENTS
// ============================================

export const Variable5_DistinctiveLayouts: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div>
          <Text size="xl" weight="semibold">Variable 5: Distinctive Layouts</Text>
          <Text size="sm" tone="muted" className="mt-1">
            Push beyond generic — what makes HIVE events feel different?
          </Text>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* A: Time Block Left */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">A: Time Block (Calendar-style)</Text>
            <Card elevation="resting" noPadding className="overflow-hidden">
              <div className="flex">
                {/* Time block */}
                <div className="w-20 bg-white/5 flex flex-col items-center justify-center p-4 border-r border-white/10">
                  <Text className="text-2xl font-bold">3</Text>
                  <Text size="xs" tone="muted" className="uppercase">PM</Text>
                </div>
                {/* Content */}
                <div className="flex-1 p-4">
                  <Text size="lg" weight="semibold" className="mb-1">{upcomingEvent.title}</Text>
                  <Text size="sm" tone="muted">{upcomingEvent.location}</Text>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-lg bg-white/10 ring-2 ring-[var(--color-bg-card)]" />
                      ))}
                    </div>
                    <Text size="xs" tone="muted">+{upcomingEvent.rsvpCount - 3} going</Text>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* B: Horizontal Timeline */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">B: Timeline Row (Feed-style)</Text>
            <Card elevation="resting" noPadding className="p-4">
              <div className="flex items-center gap-4">
                {/* Time pill */}
                <div className="flex-shrink-0 px-3 py-2 rounded-xl bg-white/5 text-center min-w-[60px]">
                  <Text size="sm" weight="semibold">3:00</Text>
                  <Text size="xs" tone="muted">PM</Text>
                </div>
                {/* Connector line */}
                <div className="w-8 h-px bg-white/20" />
                {/* Content */}
                <div className="flex-1">
                  <Text weight="semibold">{upcomingEvent.title}</Text>
                  <Text size="sm" tone="muted">{upcomingEvent.location}</Text>
                </div>
                {/* RSVP */}
                <button className="px-3 py-1.5 rounded-full text-sm font-medium bg-white/10">
                  Going?
                </button>
              </div>
            </Card>
          </div>

          {/* C: Social Proof Heavy */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">C: Friends-First (Social Proof)</Text>
            <Card elevation="resting" noPadding className="p-4">
              {/* Friends going - the hook */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-7 h-7 rounded-lg bg-white/10 ring-2 ring-[var(--color-bg-card)] flex items-center justify-center">
                      <Text size="xs" tone="muted">👤</Text>
                    </div>
                  ))}
                </div>
                <Text size="sm"><strong>3 friends</strong> <span className="text-[var(--color-text-muted)]">are going</span></Text>
              </div>
              {/* Event details */}
              <Text size="lg" weight="semibold" className="mb-1">{upcomingEvent.title}</Text>
              <Text size="sm" tone="muted">{formatAbsoluteTime(upcomingEvent.startTime)} · {upcomingEvent.location}</Text>
              <div className="flex justify-between items-center mt-3">
                <Text size="xs" tone="muted">{upcomingEvent.rsvpCount} total</Text>
                <button className="px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]">
                  Join them
                </button>
              </div>
            </Card>
          </div>

          {/* D: Compact Pill */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">D: Compact Pill (Inline)</Text>
            <Card elevation="raised" interactive noPadding className="px-4 py-3 rounded-full cursor-pointer inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Text size="sm" weight="semibold">3PM</Text>
              </div>
              <div>
                <Text size="sm" weight="semibold">{upcomingEvent.title}</Text>
                <Text size="xs" tone="muted">{upcomingEvent.rsvpCount} going · {upcomingEvent.location}</Text>
              </div>
              <div className="w-2 h-2 rounded-full bg-[var(--color-accent-gold)]" />
            </Card>
          </div>

          {/* E: Poster Style (Recommended) */}
          <div className="col-span-2">
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">E: Poster Card (Premium) — Recommended</Text>
            <div className="grid grid-cols-2 gap-4">
              {/* Standard event */}
              <Card elevation="raised" noPadding className="overflow-hidden">
                <div className="p-5">
                  {/* Header with time */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Text size="xs" tone="muted" className="uppercase tracking-wider mb-1">
                        {upcomingEvent.space.name}
                      </Text>
                      <Text size="xl" weight="semibold">{upcomingEvent.title}</Text>
                    </div>
                    <Card elevation="resting" noPadding className="px-3 py-2 rounded-xl text-center">
                      <Text size="lg" weight="bold">3:00</Text>
                      <Text size="xs" tone="muted">PM</Text>
                    </Card>
                  </div>

                  {/* Location */}
                  <Text size="sm" tone="secondary" className="mb-4">{upcomingEvent.location}</Text>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="w-7 h-9 rounded-lg bg-white/10 ring-2 ring-[var(--color-bg-card)]" />
                        ))}
                      </div>
                      <Text size="sm" tone="muted">+{upcomingEvent.rsvpCount - 4}</Text>
                    </div>
                    <Card
                      as="button"
                      interactive
                      elevation="raised"
                      noPadding
                      className="px-5 py-2 rounded-full cursor-pointer"
                    >
                      <Text size="sm" weight="medium">Going?</Text>
                    </Card>
                  </div>
                </div>
              </Card>

              {/* Live event with warmth */}
              <Card elevation="raised" warmth="edge" noPadding className="overflow-hidden">
                <div className="p-5">
                  {/* Header with LIVE */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="gold" size="sm">LIVE</Badge>
                        <Text size="xs" tone="muted" className="uppercase tracking-wider">
                          {liveEvent.space.name}
                        </Text>
                      </div>
                      <Text size="xl" weight="semibold">{liveEvent.title}</Text>
                    </div>
                    <Card elevation="resting" warmth="subtle" noPadding className="px-3 py-2 rounded-xl text-center">
                      <Text size="lg" weight="bold" className="text-[var(--color-accent-gold)]">NOW</Text>
                      <Text size="xs" tone="muted">Live</Text>
                    </Card>
                  </div>

                  {/* Location */}
                  <Text size="sm" tone="secondary" className="mb-4">{liveEvent.location}</Text>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--color-accent-gold)]/20">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="w-7 h-9 rounded-lg bg-white/10 ring-2 ring-[var(--color-bg-card)]" />
                        ))}
                      </div>
                      <Text size="sm" className="text-[var(--color-accent-gold)]">{liveEvent.rsvpCount} there</Text>
                    </div>
                    <Card
                      as="button"
                      interactive
                      elevation="raised"
                      noPadding
                      className="px-5 py-2 rounded-full cursor-pointer"
                    >
                      <Text size="sm" weight="medium" className="text-[var(--color-accent-gold)]">✓ Going</Text>
                    </Card>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <Card warmth="subtle" noPadding className="p-6">
          <Text size="sm" weight="medium" className="mb-3 text-[var(--color-accent-gold)]">Recommendation: E (Poster Card)</Text>
          <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <li>• Time card in corner is distinctive (not generic list item)</li>
            <li>• Portrait avatar stack matches locked ProfileCard pattern</li>
            <li>• Space name attribution adds context</li>
            <li>• Card-as-button for RSVP matches locked Full Card buttons</li>
            <li>• Edge warmth for live events matches system patterns</li>
            <li>• Feels like an invitation, not a calendar entry</li>
          </ul>
        </Card>
      </div>
    </div>
  ),
};

// ============================================
// ALL VARIABLES OVERVIEW
// ============================================

export const AllVariablesOverview: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[800px] mx-auto space-y-8">
        <div>
          <Text size="xl" weight="semibold">EventCard — All Variables</Text>
          <Text size="sm" tone="muted" className="mt-2">
            Review all recommendations before locking
          </Text>
        </div>

        {/* Summary Table */}
        <Card elevation="resting" noPadding className="p-6">
          <Text size="sm" weight="medium" className="mb-4">Recommendations Summary</Text>

          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border)]">
              <div>
                <Text size="sm" weight="medium">1. Time Display</Text>
                <Text size="xs" tone="muted">How to show when</Text>
              </div>
              <Badge variant="default" size="sm">B: Absolute</Badge>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border)]">
              <div>
                <Text size="sm" weight="medium">2. RSVP Style</Text>
                <Text size="xs" tone="muted">How to interact</Text>
              </div>
              <Badge variant="default" size="sm">B: Toggle Chip</Badge>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border)]">
              <div>
                <Text size="sm" weight="medium">3. Live Indicator</Text>
                <Text size="xs" tone="muted">Happening now</Text>
              </div>
              <Badge variant="default" size="sm">B: Edge Warmth</Badge>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <Text size="sm" weight="medium">4. Info Density</Text>
                <Text size="xs" tone="muted">How much to show</Text>
              </div>
              <Badge variant="default" size="sm">B: Standard</Badge>
            </div>
          </div>
        </Card>

        {/* Final Card Preview */}
        <div>
          <Text size="sm" weight="medium" className="mb-3">Final Recommended EventCard</Text>
          <Card elevation="resting" noPadding className="p-4">
            <Text size="lg" weight="semibold" className="mb-1">{upcomingEvent.title}</Text>
            <Text size="sm" tone="muted">{formatAbsoluteTime(upcomingEvent.startTime)} · {upcomingEvent.location}</Text>
            <div className="flex items-center justify-between mt-3">
              <Text size="xs" tone="muted">{upcomingEvent.rsvpCount} going</Text>
              <button className="px-3 py-1.5 rounded-full text-sm font-medium bg-white/10 hover:bg-white/15 transition-colors">
                Going?
              </button>
            </div>
          </Card>

          {/* Live version */}
          <Text size="xs" tone="muted" className="mt-4 mb-2">Live Event (with edge warmth):</Text>
          <Card elevation="resting" warmth="edge" noPadding className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="gold" size="sm">LIVE</Badge>
              <Text size="lg" weight="semibold">{liveEvent.title}</Text>
            </div>
            <Text size="sm" tone="muted">{liveEvent.location}</Text>
            <div className="flex items-center justify-between mt-3">
              <Text size="xs" tone="muted">{liveEvent.rsvpCount} attending</Text>
              <button className="px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]">
                ✓ Going
              </button>
            </div>
          </Card>
        </div>

        {/* Next Steps */}
        <Card elevation="resting" noPadding className="p-6 border-dashed">
          <Text size="sm" weight="medium" className="mb-2">Next Steps</Text>
          <Text size="xs" tone="muted">
            Review each variable story above. Say "lock" to finalize EventCard and move to ToolCard.
          </Text>
        </Card>
      </div>
    </div>
  ),
};
