'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { ScrollArea } from './ScrollArea';
import { Separator } from './Separator';

/**
 * ScrollArea - LOCKED: January 11, 2026
 *
 * LOCKED DECISIONS:
 * - Thumb opacity: Subtle (`bg-white/20` → `bg-white/40` on hover)
 * - Width: Thin 6px default (`w-1.5`) - minimal footprint
 * - Visibility: Auto (shows when content overflows)
 * - Shape: Fully rounded (`rounded-full`) - pill shape
 *
 * Custom scrollable container with styled scrollbars.
 */
const meta: Meta<typeof ScrollArea> = {
  title: 'Design System/Components/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component: `
**LOCKED: January 11, 2026**

ScrollArea provides custom scrollable containers with styled scrollbars.

### Locked Design Decisions
| Decision | Value | Rationale |
|----------|-------|-----------|
| Thumb opacity | Subtle (\`bg-white/20\` → \`bg-white/40\`) | Unobtrusive, visible on hover |
| Width | Thin 6px (\`w-1.5\`) | Minimal footprint |
| Visibility | Auto | Shows when content overflows |
| Shape | Pill (\`rounded-full\`) | Soft, modern aesthetic |
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

const tags = Array.from({ length: 50 }).map(
  (_, i) => `Tag ${i + 1}`
);

// =============================================================================
// LOCKED DESIGN SHOWCASE
// =============================================================================

/**
 * **LOCKED DESIGN** - The final approved visual treatment
 *
 * This showcases the canonical ScrollArea patterns:
 * - Subtle thumb (bg-white/20 → bg-white/40 on hover)
 * - Thin 6px width
 * - Auto visibility
 * - Pill shape
 */
export const LockedDesignShowcase: StoryObj = {
  name: '⭐ Locked Design',
  render: () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-lg font-medium text-white">ScrollArea - LOCKED</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          January 11, 2026 • Subtle thumb, Thin width, Auto visibility, Pill shape
        </p>
      </div>

      {/* Default Scrollbar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Default (Thin)
          </span>
          <span className="text-label-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">
            w-1.5 (6px)
          </span>
        </div>
        <ScrollArea className="h-48 w-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
          <div className="p-4">
            <h4 className="mb-4 text-sm font-medium text-white">Items</h4>
            {tags.slice(0, 20).map((tag) => (
              <div key={tag}>
                <div className="text-sm text-[var(--color-text-muted)] py-2">{tag}</div>
                <Separator />
              </div>
            ))}
          </div>
        </ScrollArea>
        <p className="text-xs text-white/40">
          Thumb: bg-white/20 → bg-white/40 on hover • Pill shape (rounded-full)
        </p>
      </div>

      {/* Scrollbar Variants */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Thumb Variants
          </span>
        </div>
        <div className="flex gap-4">
          <div>
            <p className="text-label-xs text-white/40 mb-2">Default</p>
            <ScrollArea
              className="h-32 w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
              thumbVariant="default"
            >
              <div className="p-3">
                {tags.slice(0, 15).map((tag) => (
                  <div key={tag} className="text-xs text-[var(--color-text-muted)] py-1.5">
                    {tag}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div>
            <p className="text-label-xs text-white/40 mb-2">Light</p>
            <ScrollArea
              className="h-32 w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
              thumbVariant="light"
            >
              <div className="p-3">
                {tags.slice(0, 15).map((tag) => (
                  <div key={tag} className="text-xs text-[var(--color-text-muted)] py-1.5">
                    {tag}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Visibility Options */}
      <div className="space-y-3">
        <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
          Visibility
        </span>
        <div className="flex gap-4">
          <div>
            <p className="text-label-xs text-white/40 mb-2">Auto (default)</p>
            <ScrollArea
              className="h-24 w-32 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
              scrollbarVisibility="auto"
            >
              <div className="p-3">
                {tags.slice(0, 10).map((tag) => (
                  <div key={tag} className="text-xs text-[var(--color-text-muted)] py-1">
                    {tag}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div>
            <p className="text-label-xs text-white/40 mb-2">Always</p>
            <ScrollArea
              className="h-24 w-32 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
              scrollbarVisibility="always"
            >
              <div className="p-3">
                {tags.slice(0, 10).map((tag) => (
                  <div key={tag} className="text-xs text-[var(--color-text-muted)] py-1">
                    {tag}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div>
            <p className="text-label-xs text-white/40 mb-2">Hover</p>
            <ScrollArea
              className="h-24 w-32 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
              scrollbarVisibility="hover"
            >
              <div className="p-3">
                {tags.slice(0, 10).map((tag) => (
                  <div key={tag} className="text-xs text-[var(--color-text-muted)] py-1">
                    {tag}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// FUNCTIONAL EXAMPLES
// =============================================================================

/**
 * Default scroll area with vertical scroll.
 */
export const Default: Story = {
  render: () => (
    <ScrollArea className="h-72 w-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium text-white">Tags</h4>
        {tags.map((tag) => (
          <div key={tag}>
            <div className="text-sm text-[var(--color-text-muted)] py-2">{tag}</div>
            <Separator />
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

/**
 * Scrollbar sizes.
 */
export const Sizes: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Thin</p>
        <ScrollArea
          className="h-48 w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
          scrollbarSize="thin"
        >
          <div className="p-4">
            {tags.slice(0, 20).map((tag) => (
              <div key={tag} className="text-sm text-[var(--color-text-muted)] py-2">
                {tag}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Default</p>
        <ScrollArea
          className="h-48 w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
          scrollbarSize="default"
        >
          <div className="p-4">
            {tags.slice(0, 20).map((tag) => (
              <div key={tag} className="text-sm text-[var(--color-text-muted)] py-2">
                {tag}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Wide</p>
        <ScrollArea
          className="h-48 w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
          scrollbarSize="wide"
        >
          <div className="p-4">
            {tags.slice(0, 20).map((tag) => (
              <div key={tag} className="text-sm text-[var(--color-text-muted)] py-2">
                {tag}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  ),
};

/**
 * Thumb variants.
 */
export const ThumbVariants: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Default</p>
        <ScrollArea
          className="h-48 w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
          thumbVariant="default"
        >
          <div className="p-4">
            {tags.slice(0, 20).map((tag) => (
              <div key={tag} className="text-sm text-[var(--color-text-muted)] py-2">
                {tag}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Light</p>
        <ScrollArea
          className="h-48 w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
          thumbVariant="light"
        >
          <div className="p-4">
            {tags.slice(0, 20).map((tag) => (
              <div key={tag} className="text-sm text-[var(--color-text-muted)] py-2">
                {tag}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Accent (Gold)</p>
        <ScrollArea
          className="h-48 w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
          thumbVariant="accent"
        >
          <div className="p-4">
            {tags.slice(0, 20).map((tag) => (
              <div key={tag} className="text-sm text-[var(--color-text-muted)] py-2">
                {tag}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  ),
};

/**
 * Horizontal scroll.
 */
export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-96 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]" showHorizontal showVertical={false}>
      <div className="flex w-max gap-4 p-4">
        {tags.slice(0, 15).map((tag) => (
          <div
            key={tag}
            className="flex h-20 w-40 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm text-white"
          >
            {tag}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

/**
 * Both directions.
 */
export const BothDirections: Story = {
  render: () => (
    <ScrollArea className="h-72 w-96 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]" showHorizontal showVertical>
      <div className="w-[800px] p-4">
        {Array.from({ length: 30 }).map((_, row) => (
          <div key={row} className="flex gap-4 mb-4">
            {Array.from({ length: 8 }).map((_, col) => (
              <div
                key={col}
                className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs text-[var(--color-text-muted)]"
              >
                {row + 1},{col + 1}
              </div>
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

/**
 * Scrollbar visibility options.
 */
export const Visibility: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Always</p>
        <ScrollArea
          className="h-48 w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
          scrollbarVisibility="always"
        >
          <div className="p-4">
            {tags.slice(0, 10).map((tag) => (
              <div key={tag} className="text-sm text-[var(--color-text-muted)] py-2">
                {tag}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Auto (default)</p>
        <ScrollArea
          className="h-48 w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
          scrollbarVisibility="auto"
        >
          <div className="p-4">
            {tags.slice(0, 20).map((tag) => (
              <div key={tag} className="text-sm text-[var(--color-text-muted)] py-2">
                {tag}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Hover</p>
        <ScrollArea
          className="h-48 w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
          scrollbarVisibility="hover"
        >
          <div className="p-4">
            {tags.slice(0, 20).map((tag) => (
              <div key={tag} className="text-sm text-[var(--color-text-muted)] py-2">
                {tag}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  ),
};

/**
 * Chat message list example.
 */
export const ChatExample: Story = {
  render: () => {
    const messages = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      user: i % 3 === 0 ? 'Alice' : i % 3 === 1 ? 'Bob' : 'Charlie',
      text: `This is message ${i + 1}. ${i % 2 === 0 ? 'A longer message with more content to show wrapping.' : 'Short message.'}`,
    }));

    return (
      <ScrollArea className="h-80 w-80 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-page)]">
        <div className="p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
                {msg.user[0]}
              </div>
              <div className="flex-1">
                <p className="text-xs text-[var(--color-text-muted)]">{msg.user}</p>
                <p className="text-sm text-white mt-1">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  },
};

/**
 * Dropdown menu example.
 */
export const DropdownExample: Story = {
  render: () => (
    <div className="w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-lg overflow-hidden">
      <div className="p-2 border-b border-[var(--color-border)]">
        <input
          type="text"
          placeholder="Search..."
          className="w-full px-3 py-2 bg-white/5 rounded text-sm text-white placeholder:text-[var(--color-text-muted)] outline-none"
        />
      </div>
      <ScrollArea className="h-48" scrollbarSize="thin">
        <div className="p-2">
          {tags.slice(0, 20).map((tag) => (
            <div
              key={tag}
              className="px-3 py-2 rounded-md text-sm text-white hover:bg-white/5 cursor-pointer"
            >
              {tag}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};

/**
 * Code block example.
 */
export const CodeBlock: Story = {
  render: () => {
    const code = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function isPrime(n) {
  if (n <= 1) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}

// Main program
const numbers = [5, 10, 15, 20, 25, 30];
console.log(numbers.map(fibonacci));
console.log(numbers.map(factorial));
console.log(numbers.map(isPrime));`;

    return (
      <div className="w-96 rounded-lg border border-[var(--color-border)] bg-[#1a1a1a] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--color-border)]">
          <span className="text-xs text-[var(--color-text-muted)]">fibonacci.js</span>
        </div>
        <ScrollArea className="h-64" showHorizontal>
          <pre className="p-4 text-sm text-white font-sans whitespace-pre">
            {code}
          </pre>
        </ScrollArea>
      </div>
    );
  },
};

/**
 * Sidebar navigation example.
 */
export const SidebarExample: Story = {
  render: () => {
    const sections = [
      { title: 'Getting Started', items: ['Introduction', 'Installation', 'Quick Start'] },
      { title: 'Components', items: ['Button', 'Input', 'Card', 'Dialog', 'Dropdown', 'Modal', 'Tabs', 'Toast'] },
      { title: 'Hooks', items: ['useToast', 'useModal', 'useDebounce', 'useLocalStorage'] },
      { title: 'Utilities', items: ['cn', 'formatDate', 'parseJSON', 'debounce', 'throttle'] },
      { title: 'Examples', items: ['Dashboard', 'Forms', 'Tables', 'Charts'] },
    ];

    return (
      <div className="w-56 h-80 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <span className="text-sm font-medium text-white">Documentation</span>
        </div>
        <ScrollArea className="h-[calc(100%-48px)]" scrollbarSize="thin">
          <div className="p-2">
            {sections.map((section) => (
              <div key={section.title} className="mb-4">
                <h4 className="px-3 py-1 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                  {section.title}
                </h4>
                {section.items.map((item) => (
                  <div
                    key={item}
                    className="px-3 py-1.5 text-sm text-white hover:bg-white/5 rounded cursor-pointer"
                  >
                    {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  },
};
