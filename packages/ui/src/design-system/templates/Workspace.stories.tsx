import type { Meta, StoryObj } from '@storybook/react';
import { Workspace, WorkspaceHeader, WorkspaceStatusBar } from './Workspace';

/**
 * Workspace Template Stories
 *
 * Workspace is for creation—IDE layouts, builders, and editors.
 * Two modes for different creation experiences.
 */
const meta: Meta<typeof Workspace> = {
  title: 'Design System/Templates/Workspace',
  component: Workspace,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The Workspace template handles creation and editing layouts. It's designed for IDE-like experiences—
tool builders, editors, and composition interfaces.

### Modes
- **magic**: AI-first minimal chrome with floating action bar
- **build**: Full IDE layout with rails and status bar

### Key Features
- Collapsible left/right rails
- Canvas background options (grid, dots, none)
- Unsaved changes indicator
- Keyboard shortcut integration
- Atmosphere optimized for workshop density
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', background: 'var(--color-bg-void)' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Workspace>;

// ============================================
// MOCK COMPONENTS
// ============================================

function MockCommandBar() {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">HiveLab</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Describe what you want to build..."
          className="w-96 h-9 px-4 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
        />
      </div>
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          Help
        </button>
      </div>
    </div>
  );
}

function MockActionBar() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] shadow-lg">
      <input
        type="text"
        placeholder="What do you want to create?"
        className="w-80 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none"
      />
      <button className="px-4 py-2 rounded-lg bg-[var(--color-life-gold)] text-black text-sm font-medium">
        Generate
      </button>
    </div>
  );
}

function MockHeader() {
  return (
    <WorkspaceHeader
      title="My Awesome Tool"
      subtitle="Draft"
      backButton={
        <button className="p-2 rounded-lg hover:bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      }
      actions={
        <>
          <button className="px-3 py-1.5 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface)]">
            Preview
          </button>
          <button className="px-4 py-1.5 rounded-lg text-sm font-medium bg-[var(--color-life-gold)] text-black">
            Save
          </button>
        </>
      }
    />
  );
}

function MockLeftRail() {
  const elements = [
    { icon: '📝', name: 'Text Input' },
    { icon: '🔘', name: 'Button' },
    { icon: '📊', name: 'Poll' },
    { icon: '📅', name: 'Date Picker' },
    { icon: '🖼️', name: 'Image' },
    { icon: '📋', name: 'List' },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
        Elements
      </h2>
      <div className="space-y-1">
        {elements.map((el) => (
          <button
            key={el.name}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <span>{el.icon}</span>
            <span>{el.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MockRightRail() {
  return (
    <div className="p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
        Properties
      </h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-[var(--color-text-secondary)]">Label</label>
          <input
            type="text"
            defaultValue="Submit"
            className="w-full h-9 px-3 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[var(--color-text-secondary)]">Style</label>
          <select className="w-full h-9 px-3 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)]">
            <option>Primary</option>
            <option>Secondary</option>
            <option>Ghost</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[var(--color-text-secondary)]">Width</label>
          <div className="flex gap-2">
            <button className="flex-1 h-9 rounded-lg bg-[var(--color-life-gold)]/10 border border-[var(--color-life-gold)] text-[var(--color-life-gold)] text-sm">
              Auto
            </button>
            <button className="flex-1 h-9 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] text-sm">
              Full
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockCanvas() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="p-8 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] border-dashed">
        <div className="text-center">
          <div className="text-4xl mb-4">🎨</div>
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
            Canvas Area
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Drag elements here to start building
          </p>
        </div>
      </div>
    </div>
  );
}

function MockStatusBar() {
  return (
    <WorkspaceStatusBar
      left={
        <>
          <span>Zoom: 100%</span>
          <span>•</span>
          <span>Grid: On</span>
        </>
      }
      center={<span>3 elements</span>}
      right={
        <>
          <span>Last saved: 2 min ago</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Connected
          </span>
        </>
      }
    />
  );
}

// ============================================
// STORIES
// ============================================

/**
 * Magic mode with minimal chrome.
 * AI-first experience with floating prompt.
 */
export const Magic: Story = {
  args: {
    mode: 'magic',
    commandBar: <MockCommandBar />,
    actionBar: <MockActionBar />,
    canvasBackground: 'dots',
  },
  render: (args) => (
    <Workspace {...args}>
      <MockCanvas />
    </Workspace>
  ),
};

/**
 * Build mode with full IDE layout.
 * Rails, header, status bar—the works.
 */
export const Build: Story = {
  args: {
    mode: 'build',
    header: <MockHeader />,
    leftRail: <MockLeftRail />,
    rightRail: <MockRightRail />,
    statusBar: <MockStatusBar />,
    canvasBackground: 'grid',
  },
  render: (args) => (
    <Workspace {...args}>
      <MockCanvas />
    </Workspace>
  ),
};

/**
 * Build mode with unsaved changes.
 */
export const WithUnsavedChanges: Story = {
  args: {
    mode: 'build',
    header: <MockHeader />,
    leftRail: <MockLeftRail />,
    rightRail: <MockRightRail />,
    statusBar: <MockStatusBar />,
    canvasBackground: 'grid',
    hasUnsavedChanges: true,
  },
  render: (args) => (
    <Workspace {...args}>
      <MockCanvas />
    </Workspace>
  ),
};

/**
 * Build mode with collapsed rails.
 */
export const CollapsedRails: Story = {
  args: {
    mode: 'build',
    header: <MockHeader />,
    leftRail: <MockLeftRail />,
    rightRail: <MockRightRail />,
    leftRailState: 'collapsed',
    rightRailState: 'collapsed',
    statusBar: <MockStatusBar />,
    canvasBackground: 'grid',
  },
  render: (args) => (
    <Workspace {...args}>
      <MockCanvas />
    </Workspace>
  ),
};

/**
 * Build mode with only left rail.
 */
export const LeftRailOnly: Story = {
  args: {
    mode: 'build',
    header: <MockHeader />,
    leftRail: <MockLeftRail />,
    rightRailState: 'hidden',
    statusBar: <MockStatusBar />,
    canvasBackground: 'grid',
  },
  render: (args) => (
    <Workspace {...args}>
      <MockCanvas />
    </Workspace>
  ),
};

/**
 * Build mode with custom rail widths.
 */
export const CustomRailWidths: Story = {
  args: {
    mode: 'build',
    header: <MockHeader />,
    leftRail: <MockLeftRail />,
    rightRail: <MockRightRail />,
    leftRailWidth: 200,
    rightRailWidth: 400,
    statusBar: <MockStatusBar />,
    canvasBackground: 'grid',
  },
  render: (args) => (
    <Workspace {...args}>
      <MockCanvas />
    </Workspace>
  ),
};

/**
 * Build mode with no canvas background.
 */
export const NoCanvasBackground: Story = {
  args: {
    mode: 'build',
    header: <MockHeader />,
    leftRail: <MockLeftRail />,
    rightRail: <MockRightRail />,
    statusBar: <MockStatusBar />,
    canvasBackground: 'none',
  },
  render: (args) => (
    <Workspace {...args}>
      <MockCanvas />
    </Workspace>
  ),
};
