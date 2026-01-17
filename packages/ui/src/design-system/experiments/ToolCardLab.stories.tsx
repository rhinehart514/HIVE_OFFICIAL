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
 * # ToolCard Lab
 *
 * Testing ToolCard variations across 5 independent variables:
 * 1. Visual Identity (how the tool is visually represented)
 * 2. Status Indicators
 * 3. Action Treatment
 * 4. Information Density
 * 5. Distinctive Layouts
 *
 * NOTE: Real tools will have screenshots, space logos, category icons —
 * NOT emojis. This lab uses placeholder visuals that represent real assets.
 */
const meta: Meta = {
  title: 'Design System/Lab/ToolCard',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// MOCK DATA (with realistic visual assets)
// ============================================

const tools = {
  calculator: {
    id: '1',
    name: 'GPA Calculator',
    description: 'Calculate your semester and cumulative GPA with automatic grade conversion.',
    // Real tool would have: thumbnail URL, or generate preview
    thumbnail: null,
    author: { name: 'UB Hackers', avatar: null },
    space: { name: 'UB Hackers', logo: null },
    stats: { uses: 1234, saves: 89 },
    status: 'published',
    category: 'Academic',
  },
  roommate: {
    id: '2',
    name: 'Roommate Finder',
    description: 'Find compatible roommates based on lifestyle, schedule, and preferences.',
    thumbnail: null,
    author: { name: 'Housing Office', avatar: null },
    space: { name: 'UB Housing', logo: null },
    stats: { uses: 567, saves: 45 },
    status: 'published',
    category: 'Housing',
  },
  studyTimer: {
    id: '3',
    name: 'Pomodoro Timer',
    description: 'Focus timer with customizable work/break intervals and session tracking.',
    thumbnail: null,
    author: { name: 'Productivity Club', avatar: null },
    space: null, // Personal tool, not from a space
    stats: { uses: 2341, saves: 156 },
    status: 'published',
    category: 'Productivity',
  },
  draft: {
    id: '4',
    name: 'Course Scheduler',
    description: 'Plan your semester schedule with conflict detection and professor ratings.',
    thumbnail: null,
    author: { name: 'You', avatar: null },
    space: null,
    stats: { uses: 0, saves: 0 },
    status: 'draft',
    category: 'Academic',
  },
  popular: {
    id: '5',
    name: 'Grade Tracker',
    description: 'Track assignments, calculate weighted grades, and predict final scores.',
    thumbnail: null,
    author: { name: 'CS Club', avatar: null },
    space: { name: 'CS Club', logo: null },
    stats: { uses: 5678, saves: 342 },
    status: 'featured',
    category: 'Academic',
  },
};

// Category icons (would be real SVG icons in production)
// Using Card primitive for consistent glass treatment
const CategoryIcon = ({ category, size = 'md' }: { category: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  // In production: Use real Heroicons/Lucide icons
  // These emoji are PLACEHOLDERS representing system category icons
  const iconMap: Record<string, string> = {
    Academic: '📚', // Would be: <AcademicCapIcon />
    Housing: '🏠',  // Would be: <HomeIcon />
    Productivity: '⚡', // Would be: <BoltIcon />
    Social: '👥', // Would be: <UsersIcon />
  };

  return (
    <Card
      elevation="resting"
      noPadding
      className={cn(sizeClasses[size], 'flex items-center justify-center rounded-xl')}
    >
      <span className={textSizes[size]}>{iconMap[category] || '🔧'}</span>
    </Card>
  );
};

// Thumbnail placeholder (represents screenshot/preview)
const ThumbnailPlaceholder = ({ tool, size = 'md' }: { tool: typeof tools.calculator; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-16 h-12',
    md: 'w-24 h-16',
    lg: 'w-full h-32',
  };

  // If tool has thumbnail, show image
  // Otherwise show gradient placeholder with category hint
  return (
    <div className={cn(
      sizeClasses[size],
      'rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center overflow-hidden'
    )}>
      {tool.thumbnail ? (
        <img src={tool.thumbnail} alt={tool.name} className="w-full h-full object-cover" />
      ) : (
        <div className="text-white/20 text-xs font-medium uppercase tracking-wider">
          Preview
        </div>
      )}
    </div>
  );
};

// Space logo (for tools from spaces)
// Using Card primitive for consistent glass treatment
const SpaceLogo = ({ space, size = 'sm' }: { space: { name: string; logo: string | null } | null; size?: 'sm' | 'md' }) => {
  if (!space) return null;

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
  };

  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
  };

  return (
    <Card
      elevation="resting"
      noPadding
      className={cn(sizeClasses[size], 'flex items-center justify-center rounded-lg overflow-hidden')}
    >
      {space.logo ? (
        <img src={space.logo} alt={space.name} className="w-full h-full object-cover" />
      ) : (
        <Text className={cn(textSizes[size], 'font-medium text-white/60')}>
          {getInitials(space.name)}
        </Text>
      )}
    </Card>
  );
};

// ============================================
// VARIABLE 1: VISUAL IDENTITY
// ============================================

export const Variable1_VisualIdentity: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div>
          <Text size="xl" weight="semibold">Variable 1: Visual Identity</Text>
          <Text size="sm" tone="muted" className="mt-1">
            How should the tool be visually represented? (No emojis in production)
          </Text>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* A: Screenshot/Thumbnail */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">A: Screenshot Thumbnail</Text>
            <Card elevation="resting" noPadding className="overflow-hidden">
              {/* Thumbnail header */}
              <div className="h-32 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border-b border-white/10">
                <Text size="xs" tone="muted" className="uppercase tracking-wider">[Tool Screenshot]</Text>
              </div>
              <div className="p-4">
                <Text size="lg" weight="semibold">{tools.calculator.name}</Text>
                <Text size="sm" tone="muted" className="mt-1 line-clamp-1">
                  {tools.calculator.description}
                </Text>
                <Text size="xs" tone="muted" className="mt-2">
                  {tools.calculator.stats.uses.toLocaleString()} uses
                </Text>
              </div>
            </Card>
          </div>

          {/* B: Category Icon (Recommended) */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">B: Category Icon — Recommended</Text>
            <Card elevation="resting" noPadding className="p-4">
              <div className="flex items-start gap-4">
                <CategoryIcon category={tools.calculator.category} />
                <div className="flex-1">
                  <Text size="lg" weight="semibold">{tools.calculator.name}</Text>
                  <Text size="sm" tone="muted" className="line-clamp-2 mt-1">
                    {tools.calculator.description}
                  </Text>
                  <Text size="xs" tone="muted" className="mt-2">
                    {tools.calculator.stats.uses.toLocaleString()} uses
                  </Text>
                </div>
              </div>
            </Card>
          </div>

          {/* C: Space Logo (if from space) */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">C: Space Logo (for space tools)</Text>
            <Card elevation="resting" noPadding className="p-4">
              <div className="flex items-start gap-4">
                {/* Space logo as primary visual */}
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Text size="lg" weight="medium" tone="muted">
                    {tools.calculator.space ? getInitials(tools.calculator.space.name) : '?'}
                  </Text>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Text size="lg" weight="semibold">{tools.calculator.name}</Text>
                  </div>
                  <Text size="xs" tone="muted" className="mb-1">
                    by {tools.calculator.space?.name || tools.calculator.author.name}
                  </Text>
                  <Text size="sm" tone="muted" className="line-clamp-1">
                    {tools.calculator.description}
                  </Text>
                  <Text size="xs" tone="muted" className="mt-2">
                    {tools.calculator.stats.uses.toLocaleString()} uses
                  </Text>
                </div>
              </div>
            </Card>
          </div>

          {/* D: Gradient Placeholder */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">D: Gradient Placeholder (no image)</Text>
            <Card elevation="resting" noPadding className="p-4">
              <div className="flex items-start gap-4">
                {/* Gradient square with first letter */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
                  <Text size="xl" weight="semibold" className="text-white/80">
                    {tools.calculator.name.charAt(0)}
                  </Text>
                </div>
                <div className="flex-1">
                  <Text size="lg" weight="semibold">{tools.calculator.name}</Text>
                  <Text size="sm" tone="muted" className="line-clamp-2 mt-1">
                    {tools.calculator.description}
                  </Text>
                  <Text size="xs" tone="muted" className="mt-2">
                    {tools.calculator.stats.uses.toLocaleString()} uses
                  </Text>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recommendation */}
        <Card warmth="subtle" noPadding className="p-6">
          <Text size="sm" weight="medium" className="mb-3 text-[var(--color-accent-gold)]">Recommendation: B (Category Icon)</Text>
          <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <li>• Category icons are consistent and load instantly</li>
            <li>• Screenshots require generation, storage, can become stale</li>
            <li>• Space logo is good for space-specific tools but not all tools have spaces</li>
            <li>• Gradient placeholder is fallback when nothing else works</li>
            <li>• In production: Use real Heroicons/Lucide for categories</li>
          </ul>
        </Card>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 2: STATUS INDICATORS
// ============================================

export const Variable2_StatusIndicators: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div>
          <Text size="xl" weight="semibold">Variable 2: Status Indicators</Text>
          <Text size="sm" tone="muted" className="mt-1">
            How to show tool status (draft, published, featured)?
          </Text>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* A: Badge (Recommended) */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">A: Badge — Recommended</Text>
            <div className="space-y-3">
              {/* Draft */}
              <Card elevation="resting" noPadding className="p-4">
                <div className="flex items-start gap-4">
                  <CategoryIcon category={tools.draft.category} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Text size="lg" weight="semibold">{tools.draft.name}</Text>
                      <Badge variant="default" size="sm">Draft</Badge>
                    </div>
                    <Text size="sm" tone="muted" className="line-clamp-1 mt-1">
                      {tools.draft.description}
                    </Text>
                  </div>
                </div>
              </Card>
              {/* Featured */}
              <Card elevation="resting" warmth="edge" noPadding className="p-4">
                <div className="flex items-start gap-4">
                  <CategoryIcon category={tools.popular.category} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Text size="lg" weight="semibold">{tools.popular.name}</Text>
                      <Badge variant="gold" size="sm">Featured</Badge>
                    </div>
                    <Text size="sm" tone="muted" className="line-clamp-1 mt-1">
                      {tools.popular.description}
                    </Text>
                    <Text size="xs" tone="muted" className="mt-2">
                      {tools.popular.stats.uses.toLocaleString()} uses
                    </Text>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* B: Opacity Treatment */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">B: Opacity Treatment (Draft = dim)</Text>
            <div className="space-y-3">
              {/* Draft - dimmed */}
              <Card elevation="resting" noPadding className="p-4 opacity-60">
                <div className="flex items-start gap-4">
                  <CategoryIcon category={tools.draft.category} />
                  <div className="flex-1">
                    <Text size="lg" weight="semibold">{tools.draft.name}</Text>
                    <Text size="sm" tone="muted" className="line-clamp-1 mt-1">
                      {tools.draft.description}
                    </Text>
                    <Text size="xs" tone="muted" className="mt-2">Not published</Text>
                  </div>
                </div>
              </Card>
              {/* Featured - full */}
              <Card elevation="resting" warmth="edge" noPadding className="p-4">
                <div className="flex items-start gap-4">
                  <CategoryIcon category={tools.popular.category} />
                  <div className="flex-1">
                    <Text size="lg" weight="semibold">{tools.popular.name}</Text>
                    <Text size="sm" tone="muted" className="line-clamp-1 mt-1">
                      {tools.popular.description}
                    </Text>
                    <Text size="xs" tone="muted" className="mt-2">
                      {tools.popular.stats.uses.toLocaleString()} uses
                    </Text>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* C: Icon Indicator */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">C: Icon on Category Icon</Text>
            <div className="space-y-3">
              {/* Draft */}
              <Card elevation="resting" noPadding className="p-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <CategoryIcon category={tools.draft.category} />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <Text size="lg" weight="semibold">{tools.draft.name}</Text>
                    <Text size="sm" tone="muted" className="line-clamp-1 mt-1">
                      {tools.draft.description}
                    </Text>
                  </div>
                </div>
              </Card>
              {/* Featured */}
              <Card elevation="resting" noPadding className="p-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <CategoryIcon category={tools.popular.category} />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-[var(--color-accent-gold)]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <Text size="lg" weight="semibold">{tools.popular.name}</Text>
                    <Text size="sm" tone="muted" className="line-clamp-1 mt-1">
                      {tools.popular.description}
                    </Text>
                    <Text size="xs" tone="muted" className="mt-2">
                      {tools.popular.stats.uses.toLocaleString()} uses
                    </Text>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* D: Text Only */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">D: Text Label Only</Text>
            <div className="space-y-3">
              {/* Draft */}
              <Card elevation="resting" noPadding className="p-4">
                <div className="flex items-start gap-4">
                  <CategoryIcon category={tools.draft.category} />
                  <div className="flex-1">
                    <Text size="lg" weight="semibold">{tools.draft.name}</Text>
                    <Text size="xs" className="text-yellow-500 mt-0.5">Draft · Not published</Text>
                    <Text size="sm" tone="muted" className="line-clamp-1 mt-1">
                      {tools.draft.description}
                    </Text>
                  </div>
                </div>
              </Card>
              {/* Featured */}
              <Card elevation="resting" noPadding className="p-4">
                <div className="flex items-start gap-4">
                  <CategoryIcon category={tools.popular.category} />
                  <div className="flex-1">
                    <Text size="lg" weight="semibold">{tools.popular.name}</Text>
                    <Text size="xs" className="text-[var(--color-accent-gold)] mt-0.5">Featured Tool</Text>
                    <Text size="sm" tone="muted" className="line-clamp-1 mt-1">
                      {tools.popular.description}
                    </Text>
                    <Text size="xs" tone="muted" className="mt-2">
                      {tools.popular.stats.uses.toLocaleString()} uses
                    </Text>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <Card warmth="subtle" noPadding className="p-6">
          <Text size="sm" weight="medium" className="mb-3 text-[var(--color-accent-gold)]">Recommendation: A (Badge)</Text>
          <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <li>• Badge provides explicit label (matches EventCard, ProfileCard patterns)</li>
            <li>• Featured gets edge warmth + gold badge</li>
            <li>• Opacity dimming is subtle, can miss draft state</li>
            <li>• Icon indicator is too small to notice</li>
          </ul>
        </Card>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 3: ACTION TREATMENT
// ============================================

export const Variable3_ActionTreatment: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div>
          <Text size="xl" weight="semibold">Variable 3: Action Treatment</Text>
          <Text size="sm" tone="muted" className="mt-1">
            How to show/access tool actions (use, save, deploy)?
          </Text>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* A: Click-Through Only (Recommended) */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">A: Click-Through Only — Recommended</Text>
            <Card elevation="resting" interactive noPadding className="p-4 cursor-pointer">
              <div className="flex items-start gap-4">
                <CategoryIcon category={tools.calculator.category} />
                <div className="flex-1">
                  <Text size="lg" weight="semibold">{tools.calculator.name}</Text>
                  <Text size="sm" tone="muted" className="line-clamp-2 mt-1">
                    {tools.calculator.description}
                  </Text>
                  <Text size="xs" tone="muted" className="mt-2">
                    {tools.calculator.stats.uses.toLocaleString()} uses
                  </Text>
                </div>
              </div>
            </Card>
            <Text size="xs" tone="muted" className="mt-2">
              Entire card is clickable → opens tool page
            </Text>
          </div>

          {/* B: Hover Menu */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">B: Hover Menu (three-dot)</Text>
            <Card elevation="resting" noPadding className="p-4 relative group">
              <div className="flex items-start gap-4">
                <CategoryIcon category={tools.calculator.category} />
                <div className="flex-1">
                  <Text size="lg" weight="semibold">{tools.calculator.name}</Text>
                  <Text size="sm" tone="muted" className="line-clamp-2 mt-1">
                    {tools.calculator.description}
                  </Text>
                  <Text size="xs" tone="muted" className="mt-2">
                    {tools.calculator.stats.uses.toLocaleString()} uses
                  </Text>
                </div>
              </div>
              {/* Hover menu button */}
              <button className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/10">
                <span className="text-white/60">•••</span>
              </button>
            </Card>
            <Text size="xs" tone="muted" className="mt-2">
              Hover reveals menu (save, share, deploy)
            </Text>
          </div>

          {/* C: Always Visible CTA */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">C: Always Visible CTA</Text>
            <Card elevation="resting" noPadding className="p-4">
              <div className="flex items-start gap-4">
                <CategoryIcon category={tools.calculator.category} />
                <div className="flex-1">
                  <Text size="lg" weight="semibold">{tools.calculator.name}</Text>
                  <Text size="sm" tone="muted" className="line-clamp-1 mt-1">
                    {tools.calculator.description}
                  </Text>
                  <div className="flex items-center justify-between mt-3">
                    <Text size="xs" tone="muted">
                      {tools.calculator.stats.uses.toLocaleString()} uses
                    </Text>
                    <Button variant="cta" size="sm">Use</Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* D: Deploy Action */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">D: Deploy to Space Action</Text>
            <Card elevation="resting" noPadding className="p-4">
              <div className="flex items-start gap-4">
                <CategoryIcon category={tools.calculator.category} />
                <div className="flex-1">
                  <Text size="lg" weight="semibold">{tools.calculator.name}</Text>
                  <Text size="sm" tone="muted" className="line-clamp-1 mt-1">
                    {tools.calculator.description}
                  </Text>
                  <div className="flex items-center justify-between mt-3">
                    <Text size="xs" tone="muted">
                      {tools.calculator.stats.uses.toLocaleString()} uses
                    </Text>
                    <button className="text-sm text-[var(--color-interactive-active)] hover:underline">
                      + Add to Space
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recommendation */}
        <Card warmth="subtle" noPadding className="p-6">
          <Text size="sm" weight="medium" className="mb-3 text-[var(--color-accent-gold)]">Recommendation: A (Click-Through)</Text>
          <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <li>• Browse → click → opens tool page. Simple mental model.</li>
            <li>• Actions (save, deploy, share) belong on tool detail page</li>
            <li>• Always-visible CTA is too aggressive for browse</li>
            <li>• Hover menu adds complexity to discovery</li>
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
            <Card elevation="resting" interactive noPadding className="p-4 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Text size="lg" weight="medium" className="text-white/40">
                    {tools.calculator.name.charAt(0)}
                  </Text>
                </div>
                <Text weight="semibold">{tools.calculator.name}</Text>
              </div>
            </Card>
          </div>

          {/* B: Standard (Recommended) */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">B: Standard — Recommended</Text>
            <Card elevation="resting" interactive noPadding className="p-4 cursor-pointer">
              <div className="flex items-start gap-4">
                <CategoryIcon category={tools.calculator.category} />
                <div className="flex-1">
                  <Text size="lg" weight="semibold">{tools.calculator.name}</Text>
                  <Text size="sm" tone="muted" className="line-clamp-2 mt-1">
                    {tools.calculator.description}
                  </Text>
                  <Text size="xs" tone="muted" className="mt-2">
                    {tools.calculator.stats.uses.toLocaleString()} uses
                  </Text>
                </div>
              </div>
            </Card>
          </div>

          {/* C: Dense */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">C: Dense</Text>
            <Card elevation="resting" noPadding className="p-4">
              <div className="flex items-start gap-4">
                <CategoryIcon category={tools.calculator.category} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Text size="lg" weight="semibold">{tools.calculator.name}</Text>
                    <Badge variant="default" size="sm">{tools.calculator.category}</Badge>
                  </div>
                  <Text size="sm" tone="muted" className="line-clamp-2">
                    {tools.calculator.description}
                  </Text>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--color-border)]">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-6 rounded bg-white/10 flex items-center justify-center">
                        <Text className="text-[8px]" tone="muted">
                          {getInitials(tools.calculator.author.name)}
                        </Text>
                      </div>
                      <Text size="xs" tone="muted">{tools.calculator.author.name}</Text>
                    </div>
                    <Text size="xs" tone="muted">
                      {tools.calculator.stats.uses.toLocaleString()} uses · {tools.calculator.stats.saves} saves
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recommendation */}
        <Card warmth="subtle" noPadding className="p-6">
          <Text size="sm" weight="medium" className="mb-3 text-[var(--color-accent-gold)]">Recommendation: B (Standard)</Text>
          <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <li>• Name + description + use count is enough to decide to click</li>
            <li>• Minimal lacks context (what does this tool do?)</li>
            <li>• Dense shows author + category which belongs on detail page</li>
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
            Tools are student creations — how do we make that feel distinctive?
          </Text>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* A: Screenshot Header */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">A: Screenshot Header</Text>
            <Card elevation="raised" interactive noPadding className="overflow-hidden cursor-pointer">
              {/* Screenshot preview area */}
              <div className="h-28 bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center border-b border-white/10">
                <Text size="xs" tone="muted" className="uppercase tracking-wider">[Tool Preview]</Text>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Text size="lg" weight="semibold">{tools.calculator.name}</Text>
                  <SpaceLogo space={tools.calculator.space} />
                </div>
                <Text size="sm" tone="muted" className="line-clamp-2">
                  {tools.calculator.description}
                </Text>
                <Text size="xs" tone="muted" className="mt-3">
                  {tools.calculator.stats.uses.toLocaleString()} uses
                </Text>
              </div>
            </Card>
          </div>

          {/* B: Activity Warmth */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">B: Activity Warmth (Popular = Glow)</Text>
            <div className="space-y-3">
              {/* Normal */}
              <Card elevation="resting" interactive noPadding className="p-4 cursor-pointer">
                <div className="flex items-start gap-4">
                  <CategoryIcon category={tools.roommate.category} />
                  <div className="flex-1">
                    <Text size="lg" weight="semibold">{tools.roommate.name}</Text>
                    <Text size="sm" tone="muted" className="line-clamp-1 mt-1">
                      {tools.roommate.description}
                    </Text>
                    <Text size="xs" tone="muted" className="mt-2">{tools.roommate.stats.uses} uses</Text>
                  </div>
                </div>
              </Card>
              {/* Popular — warm */}
              <Card elevation="resting" warmth="edge" interactive noPadding className="p-4 cursor-pointer">
                <div className="flex items-start gap-4">
                  <CategoryIcon category={tools.popular.category} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Text size="lg" weight="semibold">{tools.popular.name}</Text>
                      <Badge variant="gold" size="sm">Trending</Badge>
                    </div>
                    <Text size="sm" tone="muted" className="line-clamp-1 mt-1">
                      {tools.popular.description}
                    </Text>
                    <Text size="xs" className="mt-2 text-[var(--color-accent-gold)]">
                      {tools.popular.stats.uses.toLocaleString()} uses this week
                    </Text>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* C: Canvas Element Style */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">C: Canvas Element (Deployable Block)</Text>
            <Card elevation="raised" interactive noPadding className="overflow-hidden cursor-pointer">
              {/* Mini canvas preview */}
              <div className="h-20 bg-[var(--color-bg-ground)] relative">
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                    backgroundSize: '12px 12px'
                  }}
                />
                <div className="absolute inset-3 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center">
                  <CategoryIcon category={tools.calculator.category} size="sm" />
                </div>
              </div>
              <div className="p-4">
                <Text weight="semibold">{tools.calculator.name}</Text>
                <Text size="sm" tone="muted" className="line-clamp-1 mt-1">
                  {tools.calculator.description}
                </Text>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                  <Text size="xs" tone="muted">{tools.calculator.stats.uses.toLocaleString()} deployments</Text>
                  <Text size="xs" className="text-[var(--color-interactive-active)]">Add to Space →</Text>
                </div>
              </div>
            </Card>
          </div>

          {/* D: Stats Showcase */}
          <div>
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">D: Stats Showcase (Achievement Feel)</Text>
            <Card elevation="raised" interactive noPadding className="p-5 cursor-pointer">
              <div className="flex items-start gap-4 mb-4">
                <CategoryIcon category={tools.popular.category} size="lg" />
                <div className="flex-1">
                  <Text size="xl" weight="semibold">{tools.popular.name}</Text>
                  <Text size="sm" tone="muted">by {tools.popular.author.name}</Text>
                </div>
              </div>
              {/* Stats row */}
              <div className="flex gap-6 py-3 border-y border-white/10">
                <div>
                  <Text size="lg" weight="semibold" className="text-[var(--color-accent-gold)]">
                    {(tools.popular.stats.uses / 1000).toFixed(1)}k
                  </Text>
                  <Text size="xs" tone="muted">uses</Text>
                </div>
                <div>
                  <Text size="lg" weight="semibold">{tools.popular.stats.saves}</Text>
                  <Text size="xs" tone="muted">saves</Text>
                </div>
                <div>
                  <Text size="lg" weight="semibold">12</Text>
                  <Text size="xs" tone="muted">spaces</Text>
                </div>
              </div>
              <Text size="sm" tone="secondary" className="mt-3 line-clamp-2">
                {tools.popular.description}
              </Text>
            </Card>
          </div>

          {/* E: Workshop Card (Recommended) */}
          <div className="col-span-2">
            <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wide">E: Workshop Card (Creation + Origin) — Recommended</Text>
            <div className="grid grid-cols-2 gap-4">
              {/* Standard tool */}
              <Card elevation="raised" interactive noPadding className="overflow-hidden cursor-pointer">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <Text size="xs" tone="muted" className="uppercase tracking-wider mb-1">
                        {tools.calculator.category}
                      </Text>
                      <Text size="xl" weight="semibold">{tools.calculator.name}</Text>
                    </div>
                    <CategoryIcon category={tools.calculator.category} />
                  </div>

                  {/* Description */}
                  <Text size="sm" tone="secondary" className="mb-4 line-clamp-2">
                    {tools.calculator.description}
                  </Text>

                  {/* Footer: Origin + Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <SpaceLogo space={tools.calculator.space} />
                      <Text size="sm" tone="muted">
                        {tools.calculator.space?.name || tools.calculator.author.name}
                      </Text>
                    </div>
                    <Text size="sm" tone="muted">
                      {tools.calculator.stats.uses.toLocaleString()} uses
                    </Text>
                  </div>
                </div>
              </Card>

              {/* Popular/Featured tool with warmth */}
              <Card elevation="raised" warmth="edge" interactive noPadding className="overflow-hidden cursor-pointer">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="gold" size="sm">Trending</Badge>
                        <Text size="xs" tone="muted" className="uppercase tracking-wider">
                          {tools.popular.category}
                        </Text>
                      </div>
                      <Text size="xl" weight="semibold">{tools.popular.name}</Text>
                    </div>
                    <CategoryIcon category={tools.popular.category} />
                  </div>

                  {/* Description */}
                  <Text size="sm" tone="secondary" className="mb-4 line-clamp-2">
                    {tools.popular.description}
                  </Text>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--color-accent-gold)]/20">
                    <div className="flex items-center gap-2">
                      <SpaceLogo space={tools.popular.space} />
                      <Text size="sm" tone="muted">
                        {tools.popular.space?.name || tools.popular.author.name}
                      </Text>
                    </div>
                    <Text size="sm" className="text-[var(--color-accent-gold)]">
                      {tools.popular.stats.uses.toLocaleString()} uses
                    </Text>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <Card warmth="subtle" noPadding className="p-6">
          <Text size="sm" weight="medium" className="mb-3 text-[var(--color-accent-gold)]">Recommendation: E (Workshop Card)</Text>
          <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <li>• Category icon in corner (distinctive, matches EventCard time card)</li>
            <li>• Space logo shows origin (tools belong to communities)</li>
            <li>• Category label provides context</li>
            <li>• Edge warmth for trending (life = activity)</li>
            <li>• No emojis — uses real icons and space branding</li>
            <li>• Feels like browsing creations from spaces, not app store</li>
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
          <Text size="xl" weight="semibold">ToolCard — All Variables</Text>
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
                <Text size="sm" weight="medium">1. Visual Identity</Text>
                <Text size="xs" tone="muted">How tool is represented</Text>
              </div>
              <Badge variant="default" size="sm">B: Category Icon</Badge>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border)]">
              <div>
                <Text size="sm" weight="medium">2. Status Indicators</Text>
                <Text size="xs" tone="muted">Draft/Published/Featured</Text>
              </div>
              <Badge variant="default" size="sm">A: Badge</Badge>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border)]">
              <div>
                <Text size="sm" weight="medium">3. Action Treatment</Text>
                <Text size="xs" tone="muted">How to interact</Text>
              </div>
              <Badge variant="default" size="sm">A: Click-Through</Badge>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border)]">
              <div>
                <Text size="sm" weight="medium">4. Info Density</Text>
                <Text size="xs" tone="muted">How much to show</Text>
              </div>
              <Badge variant="default" size="sm">B: Standard</Badge>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <Text size="sm" weight="medium">5. Distinctive Layout</Text>
                <Text size="xs" tone="muted">HIVE-specific feel</Text>
              </div>
              <Badge variant="default" size="sm">E: Workshop Card</Badge>
            </div>
          </div>
        </Card>

        {/* Final Card Preview */}
        <div>
          <Text size="sm" weight="medium" className="mb-3">Final Recommended ToolCard</Text>

          {/* Standard */}
          <Card elevation="raised" interactive noPadding className="overflow-hidden cursor-pointer">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <Text size="xs" tone="muted" className="uppercase tracking-wider mb-1">
                    {tools.calculator.category}
                  </Text>
                  <Text size="xl" weight="semibold">{tools.calculator.name}</Text>
                </div>
                <CategoryIcon category={tools.calculator.category} />
              </div>
              <Text size="sm" tone="secondary" className="mb-4 line-clamp-2">
                {tools.calculator.description}
              </Text>
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <SpaceLogo space={tools.calculator.space} />
                  <Text size="sm" tone="muted">
                    {tools.calculator.space?.name || tools.calculator.author.name}
                  </Text>
                </div>
                <Text size="sm" tone="muted">
                  {tools.calculator.stats.uses.toLocaleString()} uses
                </Text>
              </div>
            </div>
          </Card>

          {/* Trending version */}
          <Text size="xs" tone="muted" className="mt-4 mb-2">Trending Tool (with edge warmth):</Text>
          <Card elevation="raised" warmth="edge" interactive noPadding className="overflow-hidden cursor-pointer">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="gold" size="sm">Trending</Badge>
                    <Text size="xs" tone="muted" className="uppercase tracking-wider">
                      {tools.popular.category}
                    </Text>
                  </div>
                  <Text size="xl" weight="semibold">{tools.popular.name}</Text>
                </div>
                <CategoryIcon category={tools.popular.category} />
              </div>
              <Text size="sm" tone="secondary" className="mb-4 line-clamp-2">
                {tools.popular.description}
              </Text>
              <div className="flex items-center justify-between pt-4 border-t border-[var(--color-accent-gold)]/20">
                <div className="flex items-center gap-2">
                  <SpaceLogo space={tools.popular.space} />
                  <Text size="sm" tone="muted">
                    {tools.popular.space?.name || tools.popular.author.name}
                  </Text>
                </div>
                <Text size="sm" className="text-[var(--color-accent-gold)]">
                  {tools.popular.stats.uses.toLocaleString()} uses
                </Text>
              </div>
            </div>
          </Card>
        </div>

        {/* Next Steps */}
        <Card elevation="resting" noPadding className="p-6 border-dashed">
          <Text size="sm" weight="medium" className="mb-2">Next Steps</Text>
          <Text size="xs" tone="muted">
            Review each variable story above. Say "lock" to finalize ToolCard and move to SpaceCard.
          </Text>
        </Card>
      </div>
    </div>
  ),
};
