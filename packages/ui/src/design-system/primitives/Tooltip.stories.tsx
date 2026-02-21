import type { Meta, StoryObj } from '@storybook/react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  SimpleTooltip,
} from './Tooltip';
import { Button } from './Button';
import { Text } from './Text';

/**
 * Tooltip — Hover hints
 *
 * Simple information on hover using Radix Tooltip.
 * Use for clarifying UI elements.
 *
 * @see docs/design-system/PRIMITIVES.md (Tooltip)
 */
const meta: Meta<typeof Tooltip> = {
  title: 'Design System/Primitives/Feedback/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Hover hints for clarifying UI elements. Built on Radix Tooltip.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

/**
 * Default — Basic tooltip
 */
export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button>Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>
          This is a tooltip
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

/**
 * With arrow
 */
export const WithArrow: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary">With arrow</Button>
        </TooltipTrigger>
        <TooltipContent showArrow>
          Arrow points to trigger
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

/**
 * All sides
 */
export const AllSides: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-8">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary">Top</Button>
          </TooltipTrigger>
          <TooltipContent side="top">Tooltip on top</TooltipContent>
        </Tooltip>
        <div className="flex gap-16">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary">Left</Button>
            </TooltipTrigger>
            <TooltipContent side="left">Tooltip on left</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary">Right</Button>
            </TooltipTrigger>
            <TooltipContent side="right">Tooltip on right</TooltipContent>
          </Tooltip>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary">Bottom</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Tooltip on bottom</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

/**
 * SimpleTooltip helper
 */
export const SimpleTooltipExample: Story = {
  render: () => (
    <SimpleTooltip content="Quick tooltip">
      <Button>Simple wrapper</Button>
    </SimpleTooltip>
  ),
};

/**
 * On icon button
 */
export const IconButtonTooltip: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Create new</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Search</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

/**
 * With keyboard shortcut
 */
export const WithKeyboardShortcut: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary">Save</Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2">
            <span>Save changes</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-card)] text-xs font-sans">
              ⌘S
            </kbd>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

/**
 * Delayed appearance
 */
export const Delayed: Story = {
  render: () => (
    <TooltipProvider delayDuration={500}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary">500ms delay</Button>
        </TooltipTrigger>
        <TooltipContent>
          This tooltip appears after 500ms
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

/**
 * Rich content
 */
export const RichContent: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary">Rich tooltip</Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="flex flex-col gap-1">
            <Text weight="medium" size="sm">Pro tip</Text>
            <Text size="xs" tone="secondary">
              You can use keyboard shortcuts to navigate faster. Press ? to see all available shortcuts.
            </Text>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

/**
 * In context — Toolbar
 */
export const ToolbarContext: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-2 rounded hover:bg-[var(--color-bg-card)] transition-colors">
              <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </TooltipTrigger>
          <TooltipContent>Align left</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-2 rounded hover:bg-[var(--color-bg-card)] transition-colors">
              <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </TooltipTrigger>
          <TooltipContent>Align center</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-2 rounded hover:bg-[var(--color-bg-card)] transition-colors">
              <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </button>
          </TooltipTrigger>
          <TooltipContent>Align right</TooltipContent>
        </Tooltip>
        <div className="w-px h-4 bg-[var(--color-border)] mx-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-2 rounded hover:bg-[var(--color-bg-card)] transition-colors font-bold text-sm text-[var(--color-text-secondary)]">
              B
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex items-center gap-2">
              Bold <kbd className="px-1 py-0.5 rounded bg-[var(--color-bg-card)] text-xs">⌘B</kbd>
            </div>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-2 rounded hover:bg-[var(--color-bg-card)] transition-colors italic text-sm text-[var(--color-text-secondary)]">
              I
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex items-center gap-2">
              Italic <kbd className="px-1 py-0.5 rounded bg-[var(--color-bg-card)] text-xs">⌘I</kbd>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};
