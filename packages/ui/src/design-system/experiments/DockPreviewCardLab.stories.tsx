import type { Meta, StoryObj } from '@storybook/react';
import {
  MessageSquare,
  Calendar,
  Wrench,
  Users,
  Bell,
  Sparkles,
  Zap,
  FileText,
  Image,
} from 'lucide-react';

// Import locked primitives
import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';
import { Mono } from '../primitives/Mono';
import { Badge } from '../primitives/Badge';

const meta: Meta = {
  title: 'Experiments/DockPreviewCard Lab',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj;

/**
 * COMPONENT: DockPreviewCard
 * STATUS: IN LAB - Awaiting Jacob's selection
 *
 * DockPreviewCard is a mini preview card for dock/rail items
 * (spaces, tools, pinned items) showing activity state.
 *
 * Variables to test:
 * 1. Preview Style - how content is previewed (icon, thumbnail, live)
 * 2. Badge/Indicator - notification counts, activity dots
 * 3. Size Ratio - square, portrait, wide
 * 4. Label Display - tooltip, inline, hidden
 */

// ============================================
// VARIABLE 1: Preview Style
// ============================================
/**
 * 5 options for how content preview appears.
 *
 * A: Icon only (simple)
 * B: Icon + color background
 * C: Thumbnail image
 * D: Live mini-preview
 * E: Gradient + icon
 * RECOMMENDED: Icon + subtle gradient
 */
export const Variable1_PreviewStyle: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <Text tone="muted" size="sm">
        How should dock items show their content?
      </Text>
      <div className="flex gap-6 items-end">
        {/* A: Icon Only */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">A: Icon Only</Text>
          <Card
            className="w-14 h-14 flex items-center justify-center cursor-pointer"
            interactive
          >
            <MessageSquare className="w-6 h-6 text-[var(--color-text-secondary)]" />
          </Card>
        </div>

        {/* B: Icon + Color BG */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">B: Icon + Color</Text>
          <Card
            className="w-14 h-14 flex items-center justify-center cursor-pointer bg-blue-500/10"
            interactive
            noPadding
          >
            <MessageSquare className="w-6 h-6 text-blue-400" />
          </Card>
        </div>

        {/* C: Thumbnail */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">C: Thumbnail</Text>
          <Card
            className="w-14 h-14 flex items-center justify-center cursor-pointer overflow-hidden"
            interactive
            noPadding
          >
            <div className="w-full h-full bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center">
              <Image className="w-5 h-5 text-white/40" />
            </div>
          </Card>
        </div>

        {/* D: Live Preview */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">D: Live Preview</Text>
          <Card
            className="w-14 h-14 cursor-pointer overflow-hidden"
            interactive
            noPadding
          >
            <div className="w-full h-full bg-[var(--color-bg-elevated)] p-1.5 flex flex-col gap-0.5">
              <div className="h-1 w-8 rounded-full bg-white/20" />
              <div className="h-1 w-6 rounded-full bg-white/10" />
              <div className="h-1 w-7 rounded-full bg-white/10" />
              <div className="flex-1 flex items-end">
                <div className="h-1.5 w-3 rounded-full bg-[#FFD700]/40" />
              </div>
            </div>
          </Card>
        </div>

        {/* E: Gradient + Icon */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">E: Gradient + Icon</Text>
          <Card
            className="w-14 h-14 flex items-center justify-center cursor-pointer overflow-hidden"
            interactive
            noPadding
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-orange-500/10" />
            <MessageSquare className="w-6 h-6 text-amber-400/80 relative z-10" />
          </Card>
        </div>

        {/* RECOMMENDED */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" className="text-[#FFD700]">REC: Gradient</Text>
          <Card
            className="w-14 h-14 flex items-center justify-center cursor-pointer overflow-hidden relative"
            warmth="low"
            interactive
            noPadding
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/15 via-transparent to-[#FFD700]/5" />
            <MessageSquare className="w-6 h-6 text-[#FFD700] relative z-10" />
          </Card>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 2: Badge/Indicator
// ============================================
/**
 * 5 options for showing activity/notifications.
 *
 * A: Count badge (top-right)
 * B: Dot indicator
 * C: Ring/glow pulse
 * D: Bottom bar
 * E: No indicator (clean)
 * RECOMMENDED: Dot + warmth for active
 */
export const Variable2_BadgeIndicator: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <Text tone="muted" size="sm">
        How should we show activity or notifications?
      </Text>
      <div className="flex gap-6 items-end">
        {/* A: Count Badge */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">A: Count Badge</Text>
          <div className="relative">
            <Card
              className="w-14 h-14 flex items-center justify-center cursor-pointer"
              interactive
            >
              <MessageSquare className="w-6 h-6 text-[var(--color-text-secondary)]" />
            </Card>
            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 flex items-center justify-center">
              <Mono size="xs" className="text-white font-medium">3</Mono>
            </div>
          </div>
        </div>

        {/* B: Dot Indicator */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">B: Dot Indicator</Text>
          <div className="relative">
            <Card
              className="w-14 h-14 flex items-center justify-center cursor-pointer"
              interactive
            >
              <MessageSquare className="w-6 h-6 text-[var(--color-text-secondary)]" />
            </Card>
            <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#FFD700]" />
          </div>
        </div>

        {/* C: Ring Pulse */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">C: Ring Pulse</Text>
          <div className="relative">
            <Card
              className="w-14 h-14 flex items-center justify-center cursor-pointer ring-2 ring-[#FFD700]/30 ring-offset-2 ring-offset-[var(--color-bg-ground)]"
              interactive
            >
              <MessageSquare className="w-6 h-6 text-[#FFD700]" />
            </Card>
          </div>
        </div>

        {/* D: Bottom Bar */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">D: Bottom Bar</Text>
          <div className="relative">
            <Card
              className="w-14 h-14 flex items-center justify-center cursor-pointer overflow-hidden"
              interactive
            >
              <MessageSquare className="w-6 h-6 text-[var(--color-text-secondary)]" />
              <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#FFD700]" />
            </Card>
          </div>
        </div>

        {/* E: Clean (No Indicator) */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">E: Clean</Text>
          <Card
            className="w-14 h-14 flex items-center justify-center cursor-pointer"
            interactive
          >
            <Calendar className="w-6 h-6 text-[var(--color-text-secondary)]" />
          </Card>
        </div>

        {/* RECOMMENDED */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" className="text-[#FFD700]">REC: Dot + Warmth</Text>
          <div className="relative">
            <Card
              className="w-14 h-14 flex items-center justify-center cursor-pointer"
              warmth="low"
              interactive
            >
              <MessageSquare className="w-6 h-6 text-[#FFD700]" />
            </Card>
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FFD700]" />
          </div>
        </div>
      </div>

      {/* Show comparison row */}
      <div className="flex gap-3 items-center mt-4">
        <Text size="xs" tone="muted">Comparison:</Text>
        <div className="flex gap-2">
          {/* Inactive */}
          <Card className="w-12 h-12 flex items-center justify-center" interactive>
            <Wrench className="w-5 h-5 text-[var(--color-text-muted)]" />
          </Card>
          {/* Has updates */}
          <div className="relative">
            <Card className="w-12 h-12 flex items-center justify-center" interactive>
              <Users className="w-5 h-5 text-[var(--color-text-secondary)]" />
            </Card>
            <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#FFD700]" />
          </div>
          {/* Active now */}
          <Card className="w-12 h-12 flex items-center justify-center" warmth="low" interactive>
            <MessageSquare className="w-5 h-5 text-[#FFD700]" />
          </Card>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 3: Size Ratio
// ============================================
/**
 * 5 options for dock item dimensions.
 *
 * A: Square small (48px)
 * B: Square medium (56px)
 * C: Square large (64px)
 * D: Portrait (48x64)
 * E: Wide (64x48)
 * RECOMMENDED: Square 56px (comfortable touch)
 */
export const Variable3_SizeRatio: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <Text tone="muted" size="sm">
        What size feels right for dock items?
      </Text>
      <div className="flex gap-8 items-end">
        {/* A: Small 48px */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">A: 48px</Text>
          <Card
            className="w-12 h-12 flex items-center justify-center cursor-pointer"
            interactive
          >
            <MessageSquare className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </Card>
          <Text size="xs" tone="muted">Small</Text>
        </div>

        {/* B: Medium 56px */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">B: 56px</Text>
          <Card
            className="w-14 h-14 flex items-center justify-center cursor-pointer"
            interactive
          >
            <MessageSquare className="w-6 h-6 text-[var(--color-text-secondary)]" />
          </Card>
          <Text size="xs" tone="muted">Medium</Text>
        </div>

        {/* C: Large 64px */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">C: 64px</Text>
          <Card
            className="w-16 h-16 flex items-center justify-center cursor-pointer"
            interactive
          >
            <MessageSquare className="w-7 h-7 text-[var(--color-text-secondary)]" />
          </Card>
          <Text size="xs" tone="muted">Large</Text>
        </div>

        {/* D: Portrait */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">D: Portrait</Text>
          <Card
            className="w-12 h-16 flex items-center justify-center cursor-pointer"
            interactive
          >
            <FileText className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </Card>
          <Text size="xs" tone="muted">48x64</Text>
        </div>

        {/* E: Wide */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">E: Wide</Text>
          <Card
            className="w-16 h-12 flex items-center justify-center cursor-pointer"
            interactive
          >
            <Calendar className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </Card>
          <Text size="xs" tone="muted">64x48</Text>
        </div>

        {/* RECOMMENDED */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" className="text-[#FFD700]">REC: 56px</Text>
          <Card
            className="w-14 h-14 flex items-center justify-center cursor-pointer"
            warmth="low"
            interactive
          >
            <MessageSquare className="w-6 h-6 text-[#FFD700]" />
          </Card>
          <Text size="xs" tone="muted">Touch-friendly</Text>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 4: Label Display
// ============================================
/**
 * 5 options for showing item name.
 *
 * A: Tooltip on hover
 * B: Label below (always visible)
 * C: Label inside (overlay)
 * D: Hidden (icon only)
 * E: Expandable on hover
 * RECOMMENDED: Tooltip on hover
 */
export const Variable4_LabelDisplay: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <Text tone="muted" size="sm">
        How should item labels appear?
      </Text>
      <div className="flex gap-8 items-start">
        {/* A: Tooltip (simulated) */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">A: Tooltip (hover)</Text>
          <div className="relative group">
            <Card
              className="w-14 h-14 flex items-center justify-center cursor-pointer"
              interactive
            >
              <MessageSquare className="w-6 h-6 text-[var(--color-text-secondary)]" />
            </Card>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded-md bg-[var(--color-bg-elevated)] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              <Text size="xs">Space Chat</Text>
            </div>
          </div>
        </div>

        {/* B: Label Below */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">B: Label Below</Text>
          <div className="flex flex-col items-center gap-1.5">
            <Card
              className="w-14 h-14 flex items-center justify-center cursor-pointer"
              interactive
            >
              <Calendar className="w-6 h-6 text-[var(--color-text-secondary)]" />
            </Card>
            <Text size="xs" tone="secondary" className="truncate max-w-14">Events</Text>
          </div>
        </div>

        {/* C: Label Inside */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">C: Label Inside</Text>
          <Card
            className="w-14 h-14 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative"
            interactive
            noPadding
          >
            <Wrench className="w-5 h-5 text-[var(--color-text-secondary)] mb-0.5" />
            <div className="absolute bottom-0 left-0 right-0 bg-black/40 py-0.5">
              <Text size="xs" tone="secondary" className="text-center text-label-xs">Tools</Text>
            </div>
          </Card>
        </div>

        {/* D: Hidden */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">D: Hidden (icon only)</Text>
          <Card
            className="w-14 h-14 flex items-center justify-center cursor-pointer"
            interactive
          >
            <Users className="w-6 h-6 text-[var(--color-text-secondary)]" />
          </Card>
        </div>

        {/* E: Expandable */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" tone="muted">E: Expandable</Text>
          <Card
            className="h-14 flex items-center gap-2 cursor-pointer px-3 transition-all duration-200 hover:pr-4 group"
            interactive
          >
            <Bell className="w-6 h-6 text-[var(--color-text-secondary)] shrink-0" />
            <Text
              size="sm"
              tone="secondary"
              className="w-0 overflow-hidden group-hover:w-16 transition-all duration-200"
            >
              Alerts
            </Text>
          </Card>
        </div>

        {/* RECOMMENDED */}
        <div className="flex flex-col items-center gap-2">
          <Text size="xs" className="text-[#FFD700]">REC: Tooltip</Text>
          <div className="relative group">
            <Card
              className="w-14 h-14 flex items-center justify-center cursor-pointer"
              warmth="low"
              interactive
            >
              <Sparkles className="w-6 h-6 text-[#FFD700]" />
            </Card>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded-md bg-[var(--color-bg-elevated)] border border-[#FFD700]/20 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              <Text size="xs">AI Assistant</Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// SHOWCASE: Full Dock Row
// ============================================
/**
 * Complete dock row showing all states together.
 */
export const Showcase_FullDockRow: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <Text tone="muted" size="sm">
        Complete dock row with various states (using recommended options).
      </Text>

      <Card className="p-3 flex gap-2 items-center" noPadding>
        {/* Active item */}
        <div className="relative group">
          <Card
            className="w-14 h-14 flex items-center justify-center cursor-pointer"
            warmth="low"
            interactive
          >
            <MessageSquare className="w-6 h-6 text-[#FFD700]" />
          </Card>
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded-md bg-[var(--color-bg-elevated)] border border-[#FFD700]/20 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            <Text size="xs">Space Chat</Text>
          </div>
        </div>

        {/* Item with notification */}
        <div className="relative group">
          <Card
            className="w-14 h-14 flex items-center justify-center cursor-pointer"
            interactive
          >
            <Bell className="w-6 h-6 text-[var(--color-text-secondary)]" />
          </Card>
          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FFD700]" />
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded-md bg-[var(--color-bg-elevated)] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            <Text size="xs">Notifications</Text>
          </div>
        </div>

        {/* Normal item */}
        <div className="relative group">
          <Card
            className="w-14 h-14 flex items-center justify-center cursor-pointer"
            interactive
          >
            <Calendar className="w-6 h-6 text-[var(--color-text-secondary)]" />
          </Card>
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded-md bg-[var(--color-bg-elevated)] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            <Text size="xs">Events</Text>
          </div>
        </div>

        {/* Normal item */}
        <div className="relative group">
          <Card
            className="w-14 h-14 flex items-center justify-center cursor-pointer"
            interactive
          >
            <Wrench className="w-6 h-6 text-[var(--color-text-secondary)]" />
          </Card>
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded-md bg-[var(--color-bg-elevated)] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            <Text size="xs">Tools</Text>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/10 mx-1" />

        {/* AI Assistant */}
        <div className="relative group">
          <Card
            className="w-14 h-14 flex items-center justify-center cursor-pointer overflow-hidden relative"
            interactive
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10" />
            <Zap className="w-6 h-6 text-purple-400 relative z-10" />
          </Card>
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded-md bg-[var(--color-bg-elevated)] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            <Text size="xs">AI Assistant</Text>
          </div>
        </div>
      </Card>

      {/* State legend */}
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border border-[#FFD700]/30 bg-[#FFD700]/10" />
          <Text size="xs" tone="muted">Active</Text>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#FFD700]" />
          <Text size="xs" tone="muted">Has updates</Text>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border border-white/10" />
          <Text size="xs" tone="muted">Normal</Text>
        </div>
      </div>
    </div>
  ),
};
