import type { Meta, StoryObj } from '@storybook/react';
import { HandleDot, HandleGroup, RotationHandle } from './HandleDot';
import { Text } from './Text';
import { Card } from './Card';

/**
 * HandleDot — Resize handles for HiveLab elements
 *
 * Positioned at corners and edges of selected elements
 * for resizing and manipulation.
 *
 * @see docs/design-system/PRIMITIVES.md (HandleDot)
 */
const meta: Meta<typeof HandleDot> = {
  title: 'Design System/Primitives/Workshop/HandleDot',
  component: HandleDot,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Resize handles for HiveLab canvas elements. Positioned at corners and edges.',
      },
    },
  },
  argTypes: {
    position: {
      control: 'select',
      options: [
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
        'top',
        'right',
        'bottom',
        'left',
        'center',
      ],
      description: 'Handle position',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Handle size',
    },
    active: {
      control: 'boolean',
      description: 'Active state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HandleDot>;

/**
 * Default — Single handle
 */
export const Default: Story = {
  render: () => (
    <div className="relative w-24 h-24 border border-[var(--color-interactive-active)] rounded">
      <HandleDot position="bottom-right" />
    </div>
  ),
};

/**
 * All positions
 */
export const AllPositions: Story = {
  render: () => (
    <div className="relative w-48 h-32 border-2 border-[var(--color-interactive-active)] rounded bg-[var(--color-bg-elevated)]">
      {/* Corners */}
      <HandleDot position="top-left" />
      <HandleDot position="top-right" />
      <HandleDot position="bottom-left" />
      <HandleDot position="bottom-right" />
      {/* Edges */}
      <HandleDot position="top" />
      <HandleDot position="right" />
      <HandleDot position="bottom" />
      <HandleDot position="left" />
      <div className="flex items-center justify-center h-full">
        <Text size="xs" tone="muted">All handles</Text>
      </div>
    </div>
  ),
};

/**
 * Sizes
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex gap-8">
      <div className="text-center">
        <div className="relative w-20 h-20 border border-[var(--color-interactive-active)] rounded mb-2">
          <HandleDot position="bottom-right" size="sm" />
        </div>
        <Text size="xs" tone="muted">sm</Text>
      </div>
      <div className="text-center">
        <div className="relative w-20 h-20 border border-[var(--color-interactive-active)] rounded mb-2">
          <HandleDot position="bottom-right" size="default" />
        </div>
        <Text size="xs" tone="muted">default</Text>
      </div>
      <div className="text-center">
        <div className="relative w-20 h-20 border border-[var(--color-interactive-active)] rounded mb-2">
          <HandleDot position="bottom-right" size="lg" />
        </div>
        <Text size="xs" tone="muted">lg</Text>
      </div>
    </div>
  ),
};

/**
 * Active state
 */
export const ActiveState: Story = {
  render: () => (
    <div className="flex gap-8">
      <div className="text-center">
        <div className="relative w-24 h-24 border border-[var(--color-interactive-active)] rounded mb-2">
          <HandleDot position="bottom-right" active={false} />
        </div>
        <Text size="xs" tone="muted">Normal</Text>
      </div>
      <div className="text-center">
        <div className="relative w-24 h-24 border border-[var(--color-interactive-active)] rounded mb-2">
          <HandleDot position="bottom-right" active />
        </div>
        <Text size="xs" className="text-[var(--color-accent-gold)]">Active (Gold)</Text>
      </div>
    </div>
  ),
};

/**
 * HandleGroup — Corners only
 */
export const HandleGroupCorners: Story = {
  render: () => (
    <div className="relative w-48 h-32 border-2 border-[var(--color-interactive-active)] rounded bg-[var(--color-bg-elevated)]">
      <HandleGroup corners edges={false} />
      <div className="flex items-center justify-center h-full">
        <Text size="xs" tone="muted">Corner handles</Text>
      </div>
    </div>
  ),
};

/**
 * HandleGroup — Corners and edges
 */
export const HandleGroupAll: Story = {
  render: () => (
    <div className="relative w-48 h-32 border-2 border-[var(--color-interactive-active)] rounded bg-[var(--color-bg-elevated)]">
      <HandleGroup corners edges />
      <div className="flex items-center justify-center h-full">
        <Text size="xs" tone="muted">All handles</Text>
      </div>
    </div>
  ),
};

/**
 * RotationHandle
 */
export const RotationHandleVariant: Story = {
  render: () => (
    <div className="pt-10">
      <div className="relative w-48 h-32 border-2 border-[var(--color-interactive-active)] rounded bg-[var(--color-bg-elevated)]">
        <HandleGroup corners />
        <RotationHandle />
        <div className="flex items-center justify-center h-full">
          <Text size="xs" tone="muted">With rotation</Text>
        </div>
      </div>
    </div>
  ),
};

/**
 * In context — Selected element
 */
export const SelectedElementContext: Story = {
  render: () => (
    <div className="p-8 bg-[var(--color-bg-page)] rounded-xl">
      <div
        className="relative"
        style={{
          width: 200,
          height: 100,
        }}
      >
        <Card className="w-full h-full p-3 ring-2 ring-[var(--color-interactive-active)] shadow-lg">
          <Text size="sm" weight="medium">Selected Card</Text>
          <Text size="xs" tone="muted">Drag handles to resize</Text>
        </Card>
        <HandleGroup corners />
      </div>
    </div>
  ),
};

/**
 * In context — Button element
 */
export const ButtonElementContext: Story = {
  render: () => (
    <div className="p-8 bg-[var(--color-bg-page)] rounded-xl">
      <div className="relative inline-block">
        <button className="px-4 py-2 bg-[var(--color-interactive-active)] text-[var(--color-text-primary)] rounded-lg ring-2 ring-[var(--color-interactive-active)] ring-offset-2 ring-offset-[var(--color-bg-page)]">
          Button
        </button>
        <HandleGroup corners size="sm" />
      </div>
    </div>
  ),
};

/**
 * In context — Text element
 */
export const TextElementContext: Story = {
  render: () => (
    <div className="p-8 bg-[var(--color-bg-page)] rounded-xl">
      <div className="relative inline-block">
        <div className="px-2 py-1 ring-2 ring-[var(--color-interactive-active)] rounded">
          <Text size="lg" weight="medium">Editable Text</Text>
        </div>
        <HandleGroup corners={false} edges size="sm" />
        <HandleDot position="left" size="sm" />
        <HandleDot position="right" size="sm" />
      </div>
    </div>
  ),
};

/**
 * Multiple elements
 */
export const MultipleElementsContext: Story = {
  render: () => (
    <div className="relative w-[400px] h-[250px] bg-[var(--color-bg-page)] rounded-xl p-4">
      {/* Element 1 - Not selected */}
      <div className="absolute" style={{ left: 20, top: 20, width: 120, height: 60 }}>
        <Card className="w-full h-full p-2">
          <Text size="xs">Not selected</Text>
        </Card>
      </div>

      {/* Element 2 - Selected */}
      <div className="absolute" style={{ left: 180, top: 80, width: 160, height: 100 }}>
        <Card className="w-full h-full p-3 ring-2 ring-[var(--color-interactive-active)] shadow-lg">
          <Text size="sm" weight="medium">Selected</Text>
          <Text size="xs" tone="muted">Resize me!</Text>
        </Card>
        <HandleGroup corners />
      </div>

      {/* Element 3 - Not selected */}
      <div className="absolute" style={{ left: 40, top: 120, width: 100, height: 80 }}>
        <Card className="w-full h-full p-2">
          <Text size="xs">Another element</Text>
        </Card>
      </div>
    </div>
  ),
};

/**
 * Cursor types
 */
export const CursorTypes: Story = {
  render: () => (
    <Card className="p-6">
      <Text weight="medium" className="mb-4">Handle Cursors</Text>
      <div className="grid grid-cols-3 gap-4">
        {[
          { pos: 'top-left', cursor: 'nw-resize' },
          { pos: 'top', cursor: 'n-resize' },
          { pos: 'top-right', cursor: 'ne-resize' },
          { pos: 'left', cursor: 'w-resize' },
          { pos: 'center', cursor: 'move' },
          { pos: 'right', cursor: 'e-resize' },
          { pos: 'bottom-left', cursor: 'sw-resize' },
          { pos: 'bottom', cursor: 's-resize' },
          { pos: 'bottom-right', cursor: 'se-resize' },
        ].map(({ pos, cursor }) => (
          <div
            key={pos}
            className="relative w-16 h-16 border border-[var(--color-border)] rounded flex items-center justify-center"
          >
            <HandleDot position={pos as any} />
            <Text size="[10px]" tone="muted" className="text-[10px]">{cursor}</Text>
          </div>
        ))}
      </div>
    </Card>
  ),
};
