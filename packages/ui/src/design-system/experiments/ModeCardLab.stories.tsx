import type { Meta, StoryObj } from '@storybook/react';
import { Check, Zap, Shield, Eye, Moon, Sun, Sparkles, Lock, Globe, Users } from 'lucide-react';

// Import locked primitives
import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';
import { Badge } from '../primitives/Badge';

const meta: Meta = {
  title: 'Experiments/ModeCard Lab',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj;

/**
 * COMPONENT: ModeCard
 * STATUS: IN LAB - Awaiting Jacob's selection
 *
 * ModeCard represents selectable modes/options (privacy settings, themes, views)
 *
 * Variables to test:
 * 1. Selection Indicator - how we show selected state
 * 2. Icon Placement - where the mode icon sits
 * 3. Content Layout - title + description arrangement
 * 4. Interactive States - hover/press/disabled behavior
 */

// Sample mode data
const sampleMode = {
  icon: Shield,
  title: 'Private',
  description: 'Only members can see content',
  isSelected: true,
};

const unselectedMode = {
  icon: Globe,
  title: 'Public',
  description: 'Anyone can discover and view',
  isSelected: false,
};

// ============================================
// VARIABLE 1: Selection Indicator
// ============================================
/**
 * 5 options for showing selected state.
 *
 * A: Checkmark badge in corner
 * B: Gold border/warmth glow
 * C: Filled background tint
 * D: Left accent bar
 * E: Radio dot indicator
 * RECOMMENDED: Gold warmth + subtle check
 */
export const Variable1_SelectionIndicator: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <Text tone="muted" size="sm">
        Click/tap behavior. Which selection indicator feels right?
      </Text>
      <div className="grid grid-cols-3 gap-6">
        {/* A: Checkmark Badge */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">A: Checkmark Badge</Text>
          <Card className="p-4 relative cursor-pointer" interactive>
            <div className="absolute top-3 right-3">
              <Badge variant="gold" size="sm">
                <Check className="w-3 h-3" />
              </Badge>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Shield className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </div>
              <div>
                <Text weight="medium">Private</Text>
                <Text size="sm" tone="secondary">Only members can see</Text>
              </div>
            </div>
          </Card>
          <Card className="p-4 cursor-pointer" interactive>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Globe className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </div>
              <div>
                <Text weight="medium">Public</Text>
                <Text size="sm" tone="secondary">Anyone can discover</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* B: Gold Warmth Glow */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">B: Gold Warmth Glow</Text>
          <Card className="p-4 cursor-pointer" warmth="medium" interactive>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Shield className="w-5 h-5 text-[#FFD700]" />
              </div>
              <div>
                <Text weight="medium">Private</Text>
                <Text size="sm" tone="secondary">Only members can see</Text>
              </div>
            </div>
          </Card>
          <Card className="p-4 cursor-pointer" interactive>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Globe className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </div>
              <div>
                <Text weight="medium">Public</Text>
                <Text size="sm" tone="secondary">Anyone can discover</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* C: Filled Background */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">C: Filled Background</Text>
          <Card className="p-4 cursor-pointer bg-white/[0.08]" interactive>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/10">
                <Shield className="w-5 h-5 text-[var(--color-text-primary)]" />
              </div>
              <div>
                <Text weight="medium">Private</Text>
                <Text size="sm" tone="secondary">Only members can see</Text>
              </div>
            </div>
          </Card>
          <Card className="p-4 cursor-pointer" interactive>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Globe className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </div>
              <div>
                <Text weight="medium">Public</Text>
                <Text size="sm" tone="secondary">Anyone can discover</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* D: Left Accent Bar */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">D: Left Accent Bar</Text>
          <Card className="p-4 cursor-pointer relative overflow-hidden" interactive>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD700]" />
            <div className="flex items-start gap-3 pl-2">
              <div className="p-2 rounded-lg bg-white/5">
                <Shield className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </div>
              <div>
                <Text weight="medium">Private</Text>
                <Text size="sm" tone="secondary">Only members can see</Text>
              </div>
            </div>
          </Card>
          <Card className="p-4 cursor-pointer" interactive>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Globe className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </div>
              <div>
                <Text weight="medium">Public</Text>
                <Text size="sm" tone="secondary">Anyone can discover</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* E: Radio Dot */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">E: Radio Dot</Text>
          <Card className="p-4 cursor-pointer" interactive>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-[#FFD700] flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FFD700]" />
              </div>
              <div className="p-2 rounded-lg bg-white/5">
                <Shield className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </div>
              <div>
                <Text weight="medium">Private</Text>
                <Text size="sm" tone="secondary">Only members can see</Text>
              </div>
            </div>
          </Card>
          <Card className="p-4 cursor-pointer" interactive>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-white/20" />
              <div className="p-2 rounded-lg bg-white/5">
                <Globe className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </div>
              <div>
                <Text weight="medium">Public</Text>
                <Text size="sm" tone="secondary">Anyone can discover</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* RECOMMENDED: Warmth + Check */}
        <div className="flex flex-col gap-2">
          <Text size="xs" className="text-[#FFD700]">RECOMMENDED: Warmth + Check</Text>
          <Card className="p-4 cursor-pointer relative" warmth="low" interactive>
            <div className="absolute top-3 right-3">
              <Check className="w-4 h-4 text-[#FFD700]" />
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#FFD700]/10">
                <Shield className="w-5 h-5 text-[#FFD700]" />
              </div>
              <div>
                <Text weight="medium">Private</Text>
                <Text size="sm" tone="secondary">Only members can see</Text>
              </div>
            </div>
          </Card>
          <Card className="p-4 cursor-pointer" interactive>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Globe className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </div>
              <div>
                <Text weight="medium">Public</Text>
                <Text size="sm" tone="secondary">Anyone can discover</Text>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 2: Icon Placement
// ============================================
/**
 * 5 options for where the mode icon sits.
 *
 * A: Leading (left of text)
 * B: Top centered (above text)
 * C: Background watermark
 * D: Trailing (right side)
 * E: Inline with title
 * RECOMMENDED: Leading with tinted container
 */
export const Variable2_IconPlacement: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <Text tone="muted" size="sm">
        Where should the mode icon live?
      </Text>
      <div className="grid grid-cols-3 gap-6">
        {/* A: Leading */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">A: Leading (Left)</Text>
          <Card className="p-4 cursor-pointer" interactive>
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-[var(--color-text-secondary)] shrink-0" />
              <div>
                <Text weight="medium">Private Mode</Text>
                <Text size="sm" tone="secondary">Only members can see content</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* B: Top Centered */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">B: Top Centered</Text>
          <Card className="p-4 cursor-pointer text-center" interactive>
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-xl bg-white/5">
                <Shield className="w-6 h-6 text-[var(--color-text-secondary)]" />
              </div>
              <div>
                <Text weight="medium">Private Mode</Text>
                <Text size="sm" tone="secondary">Only members can see</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* C: Background Watermark */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">C: Background Watermark</Text>
          <Card className="p-4 cursor-pointer relative overflow-hidden" interactive>
            <Shield className="absolute right-2 bottom-2 w-16 h-16 text-white/[0.03]" />
            <div className="relative">
              <Text weight="medium">Private Mode</Text>
              <Text size="sm" tone="secondary">Only members can see content</Text>
            </div>
          </Card>
        </div>

        {/* D: Trailing */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">D: Trailing (Right)</Text>
          <Card className="p-4 cursor-pointer" interactive>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Text weight="medium">Private Mode</Text>
                <Text size="sm" tone="secondary">Only members can see</Text>
              </div>
              <div className="p-2 rounded-lg bg-white/5">
                <Shield className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </div>
            </div>
          </Card>
        </div>

        {/* E: Inline with Title */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">E: Inline with Title</Text>
          <Card className="p-4 cursor-pointer" interactive>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-[var(--color-text-secondary)]" />
              <Text weight="medium">Private Mode</Text>
            </div>
            <Text size="sm" tone="secondary">Only members can see content</Text>
          </Card>
        </div>

        {/* RECOMMENDED: Leading + Container */}
        <div className="flex flex-col gap-2">
          <Text size="xs" className="text-[#FFD700]">RECOMMENDED: Leading + Container</Text>
          <Card className="p-4 cursor-pointer" warmth="low" interactive>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#FFD700]/10">
                <Shield className="w-5 h-5 text-[#FFD700]" />
              </div>
              <div>
                <Text weight="medium">Private Mode</Text>
                <Text size="sm" tone="secondary">Only members can see content</Text>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 3: Content Layout
// ============================================
/**
 * 5 options for title + description arrangement.
 *
 * A: Stacked (title over description)
 * B: Single line (title only, no desc)
 * C: Dense (smaller text, tighter)
 * D: With status tag
 * E: With keyboard hint
 * RECOMMENDED: Stacked with status badge
 */
export const Variable3_ContentLayout: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <Text tone="muted" size="sm">
        How should content be arranged?
      </Text>
      <div className="grid grid-cols-3 gap-6">
        {/* A: Stacked */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">A: Stacked (Default)</Text>
          <Card className="p-4 cursor-pointer" interactive>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Moon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </div>
              <div>
                <Text weight="medium">Dark Mode</Text>
                <Text size="sm" tone="secondary">Easier on the eyes at night</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* B: Single Line */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">B: Single Line (Title Only)</Text>
          <Card className="p-3 cursor-pointer" interactive>
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-white/5">
                <Moon className="w-4 h-4 text-[var(--color-text-secondary)]" />
              </div>
              <Text weight="medium">Dark Mode</Text>
            </div>
          </Card>
        </div>

        {/* C: Dense */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">C: Dense (Compact)</Text>
          <Card className="p-3 cursor-pointer" size="compact" interactive>
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-[var(--color-text-secondary)]" />
              <div className="flex items-baseline gap-2">
                <Text size="sm" weight="medium">Dark Mode</Text>
                <Text size="xs" tone="muted">Easier on eyes</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* D: With Status Tag */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">D: With Status Tag</Text>
          <Card className="p-4 cursor-pointer" interactive>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Moon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <Text weight="medium">Dark Mode</Text>
                  <Badge variant="success" size="sm">Active</Badge>
                </div>
                <Text size="sm" tone="secondary">Easier on the eyes at night</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* E: With Keyboard Hint */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">E: With Keyboard Hint</Text>
          <Card className="p-4 cursor-pointer" interactive>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/5">
                  <Moon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </div>
                <div>
                  <Text weight="medium">Dark Mode</Text>
                  <Text size="sm" tone="secondary">Easier on the eyes</Text>
                </div>
              </div>
              <kbd className="px-1.5 py-0.5 rounded text-xs bg-white/5 text-[var(--color-text-muted)] font-mono">
                ⌘D
              </kbd>
            </div>
          </Card>
        </div>

        {/* RECOMMENDED */}
        <div className="flex flex-col gap-2">
          <Text size="xs" className="text-[#FFD700]">RECOMMENDED: Stacked + Badge</Text>
          <Card className="p-4 cursor-pointer" warmth="low" interactive>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#FFD700]/10">
                <Moon className="w-5 h-5 text-[#FFD700]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <Text weight="medium">Dark Mode</Text>
                  <Badge variant="gold" size="sm">Active</Badge>
                </div>
                <Text size="sm" tone="secondary">Easier on the eyes at night</Text>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 4: Interactive States
// ============================================
/**
 * 5 options for hover/press/disabled behavior.
 *
 * A: Subtle brightness
 * B: Border emphasis
 * C: Scale transform
 * D: Background shift
 * E: Icon animation
 * RECOMMENDED: Subtle brightness + border
 */
export const Variable4_InteractiveStates: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <Text tone="muted" size="sm">
        Hover each card to test interaction feel.
      </Text>
      <div className="grid grid-cols-3 gap-6">
        {/* A: Subtle Brightness */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">A: Subtle Brightness</Text>
          <Card
            className="p-4 cursor-pointer transition-all duration-200 hover:bg-[var(--color-bg-surface-hover)]"
            interactive
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Zap className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </div>
              <div>
                <Text weight="medium">Turbo Mode</Text>
                <Text size="sm" tone="secondary">Faster processing</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* B: Border Emphasis */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">B: Border Emphasis</Text>
          <Card
            className="p-4 cursor-pointer transition-all duration-200 hover:border-white/20"
            interactive
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Zap className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </div>
              <div>
                <Text weight="medium">Turbo Mode</Text>
                <Text size="sm" tone="secondary">Faster processing</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* C: Scale Transform */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">C: Scale Transform</Text>
          <Card
            className="p-4 cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            interactive
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Zap className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </div>
              <div>
                <Text weight="medium">Turbo Mode</Text>
                <Text size="sm" tone="secondary">Faster processing</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* D: Background Shift */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">D: Background Shift</Text>
          <Card
            className="p-4 cursor-pointer transition-colors duration-200 hover:bg-white/[0.08]"
            interactive
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5 transition-colors group-hover:bg-white/10">
                <Zap className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </div>
              <div>
                <Text weight="medium">Turbo Mode</Text>
                <Text size="sm" tone="secondary">Faster processing</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* E: Icon Animation */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted">E: Icon Animation</Text>
          <Card
            className="p-4 cursor-pointer group"
            interactive
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Zap className="w-5 h-5 text-[var(--color-text-secondary)] transition-all duration-200 group-hover:text-[#FFD700] group-hover:scale-110" />
              </div>
              <div>
                <Text weight="medium">Turbo Mode</Text>
                <Text size="sm" tone="secondary">Faster processing</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* RECOMMENDED */}
        <div className="flex flex-col gap-2">
          <Text size="xs" className="text-[#FFD700]">RECOMMENDED: Brightness + Border</Text>
          <Card
            className="p-4 cursor-pointer transition-all duration-200 hover:bg-[var(--color-bg-surface-hover)] hover:border-white/15"
            warmth="low"
            interactive
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#FFD700]/10">
                <Zap className="w-5 h-5 text-[#FFD700]" />
              </div>
              <div>
                <Text weight="medium">Turbo Mode</Text>
                <Text size="sm" tone="secondary">Faster processing</Text>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Also show disabled state */}
      <div className="mt-4">
        <Text size="xs" tone="muted" className="mb-2">Disabled State (all variants)</Text>
        <Card
          className="p-4 opacity-50 cursor-not-allowed"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white/5">
              <Lock className="w-5 h-5 text-[var(--color-text-muted)]" />
            </div>
            <div>
              <Text weight="medium" tone="muted">Locked Mode</Text>
              <Text size="sm" tone="muted">Upgrade to unlock</Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  ),
};
