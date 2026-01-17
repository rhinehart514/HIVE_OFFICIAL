import type { Meta, StoryObj } from '@storybook/react';
import { CanvasArea, CanvasElement, CanvasGuides } from './CanvasArea';
import { Text } from './Text';
import { Card } from './Card';
import { Button } from './Button';

/**
 * CanvasArea — Building surface for HiveLab
 *
 * The workspace where users construct tools via drag-and-drop.
 * Supports grid patterns, zoom, and alignment guides.
 *
 * @see docs/design-system/PRIMITIVES.md (CanvasArea)
 */
const meta: Meta<typeof CanvasArea> = {
  title: 'Design System/Primitives/Workshop/CanvasArea',
  component: CanvasArea,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Building surface for HiveLab tool construction. Provides a grid-aligned workspace.',
      },
    },
  },
  argTypes: {
    background: {
      control: 'select',
      options: ['solid', 'elevated', 'dots', 'grid', 'transparent'],
      description: 'Background style',
    },
    border: {
      control: 'select',
      options: ['none', 'subtle', 'dashed'],
      description: 'Border style',
    },
    rounded: {
      control: 'select',
      options: ['none', 'sm', 'default', 'lg'],
      description: 'Border radius',
    },
    showGrid: {
      control: 'boolean',
      description: 'Show grid pattern',
    },
    gridSize: {
      control: { type: 'number', min: 8, max: 64, step: 4 },
      description: 'Grid size in pixels',
    },
    interactive: {
      control: 'boolean',
      description: 'Interactive mode',
    },
    isDropTarget: {
      control: 'boolean',
      description: 'Drop target active',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CanvasArea>;

/**
 * Default — Solid background
 */
export const Default: Story = {
  render: () => (
    <CanvasArea
      className="w-96 h-64"
      background="solid"
    >
      <div className="flex items-center justify-center h-full">
        <Text tone="muted">Canvas Area</Text>
      </div>
    </CanvasArea>
  ),
};

/**
 * Dot grid pattern
 */
export const DotGrid: Story = {
  render: () => (
    <CanvasArea
      className="w-96 h-64"
      background="dots"
      showGrid
      gridSize={20}
    />
  ),
};

/**
 * Line grid pattern
 */
export const LineGrid: Story = {
  render: () => (
    <CanvasArea
      className="w-96 h-64"
      background="grid"
      showGrid
      gridSize={20}
    />
  ),
};

/**
 * Grid sizes
 */
export const GridSizes: Story = {
  render: () => (
    <div className="flex gap-4">
      <div className="text-center">
        <CanvasArea
          className="w-48 h-32 mb-2"
          background="dots"
          showGrid
          gridSize={10}
        />
        <Text size="xs" tone="muted">10px</Text>
      </div>
      <div className="text-center">
        <CanvasArea
          className="w-48 h-32 mb-2"
          background="dots"
          showGrid
          gridSize={20}
        />
        <Text size="xs" tone="muted">20px</Text>
      </div>
      <div className="text-center">
        <CanvasArea
          className="w-48 h-32 mb-2"
          background="dots"
          showGrid
          gridSize={40}
        />
        <Text size="xs" tone="muted">40px</Text>
      </div>
    </div>
  ),
};

/**
 * Border variants
 */
export const BorderVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <div className="text-center">
        <CanvasArea className="w-40 h-24 mb-2" border="none" />
        <Text size="xs" tone="muted">none</Text>
      </div>
      <div className="text-center">
        <CanvasArea className="w-40 h-24 mb-2" border="subtle" />
        <Text size="xs" tone="muted">subtle</Text>
      </div>
      <div className="text-center">
        <CanvasArea className="w-40 h-24 mb-2" border="dashed" />
        <Text size="xs" tone="muted">dashed</Text>
      </div>
    </div>
  ),
};

/**
 * Drop target state
 */
export const DropTargetState: Story = {
  render: () => (
    <div className="flex gap-4">
      <div className="text-center">
        <CanvasArea className="w-48 h-32 mb-2" isDropTarget={false}>
          <div className="flex items-center justify-center h-full">
            <Text size="sm" tone="muted">Normal</Text>
          </div>
        </CanvasArea>
        <Text size="xs" tone="muted">Default</Text>
      </div>
      <div className="text-center">
        <CanvasArea className="w-48 h-32 mb-2" isDropTarget>
          <div className="flex items-center justify-center h-full">
            <Text size="sm" className="text-[var(--color-accent-gold)]">Drop here</Text>
          </div>
        </CanvasArea>
        <Text size="xs" className="text-[var(--color-accent-gold)]">Drop Target</Text>
      </div>
    </div>
  ),
};

/**
 * CanvasElement — Positioned elements
 */
export const WithElements: Story = {
  render: () => (
    <CanvasArea className="w-[500px] h-[300px]" background="dots" showGrid gridSize={20}>
      <CanvasElement position={{ x: 40, y: 40 }} size={{ width: 120, height: 40 }}>
        <Button size="sm" className="w-full h-full">Button</Button>
      </CanvasElement>
      <CanvasElement position={{ x: 200, y: 80 }} size={{ width: 160, height: 60 }}>
        <Card className="w-full h-full p-2">
          <Text size="sm">Card Element</Text>
        </Card>
      </CanvasElement>
      <CanvasElement position={{ x: 60, y: 140 }} size={{ width: 100, height: 32 }}>
        <input
          type="text"
          placeholder="Input"
          className="w-full h-full px-2 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
        />
      </CanvasElement>
    </CanvasArea>
  ),
};

/**
 * Selected element
 */
export const SelectedElement: Story = {
  render: () => (
    <CanvasArea className="w-[400px] h-[200px]" background="dots" showGrid>
      <CanvasElement position={{ x: 40, y: 40 }} size={{ width: 100, height: 36 }}>
        <Button size="sm" variant="ghost" className="w-full h-full">Not Selected</Button>
      </CanvasElement>
      <CanvasElement position={{ x: 180, y: 60 }} size={{ width: 140, height: 80 }} selected>
        <Card className="w-full h-full p-3">
          <Text size="sm" weight="medium">Selected</Text>
          <Text size="xs" tone="muted">Has ring highlight</Text>
        </Card>
      </CanvasElement>
    </CanvasArea>
  ),
};

/**
 * Element states
 */
export const ElementStates: Story = {
  render: () => (
    <CanvasArea className="w-[500px] h-[100px]" background="elevated">
      <CanvasElement position={{ x: 20, y: 20 }} size={{ width: 100, height: 60 }}>
        <Card className="w-full h-full p-2 flex items-center justify-center">
          <Text size="xs">Normal</Text>
        </Card>
      </CanvasElement>
      <CanvasElement position={{ x: 140, y: 20 }} size={{ width: 100, height: 60 }} hovered>
        <Card className="w-full h-full p-2 flex items-center justify-center">
          <Text size="xs">Hovered</Text>
        </Card>
      </CanvasElement>
      <CanvasElement position={{ x: 260, y: 20 }} size={{ width: 100, height: 60 }} selected>
        <Card className="w-full h-full p-2 flex items-center justify-center">
          <Text size="xs">Selected</Text>
        </Card>
      </CanvasElement>
      <CanvasElement position={{ x: 380, y: 20 }} size={{ width: 100, height: 60 }} locked>
        <Card className="w-full h-full p-2 flex items-center justify-center">
          <Text size="xs">Locked</Text>
        </Card>
      </CanvasElement>
    </CanvasArea>
  ),
};

/**
 * With alignment guides
 */
export const WithAlignmentGuides: Story = {
  render: () => (
    <CanvasArea className="w-[400px] h-[250px]" background="dots" showGrid>
      <CanvasGuides
        horizontal={[125]}
        vertical={[200]}
      />
      <CanvasElement position={{ x: 50, y: 50 }} size={{ width: 100, height: 75 }} selected>
        <Card className="w-full h-full p-2">
          <Text size="xs">Element 1</Text>
        </Card>
      </CanvasElement>
      <CanvasElement position={{ x: 250, y: 125 }} size={{ width: 100, height: 75 }}>
        <Card className="w-full h-full p-2">
          <Text size="xs">Element 2</Text>
        </Card>
      </CanvasElement>
    </CanvasArea>
  ),
};

/**
 * In context — HiveLab IDE
 */
export const HiveLabIDEContext: Story = {
  render: () => (
    <div className="flex gap-0 bg-[var(--color-bg-page)] rounded-xl overflow-hidden border border-[var(--color-border)]">
      {/* Left sidebar */}
      <div className="w-48 border-r border-[var(--color-border)] p-2 bg-[var(--color-bg-elevated)]">
        <Text size="xs" weight="medium" className="px-2 py-1 text-[var(--color-text-muted)] uppercase tracking-wider">
          Elements
        </Text>
        <div className="space-y-1 mt-2">
          {['Button', 'Text', 'Input', 'Card', 'Image'].map((el) => (
            <div
              key={el}
              className="px-2 py-1.5 rounded text-sm hover:bg-[var(--color-bg-page)] cursor-grab transition-colors"
            >
              {el}
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-4">
        <CanvasArea
          className="w-full h-[300px]"
          background="dots"
          showGrid
          gridSize={20}
        >
          <CanvasElement position={{ x: 80, y: 40 }} size={{ width: 240, height: 180 }}>
            <Card className="w-full h-full p-4">
              <Text weight="medium" className="mb-2">Sign Up</Text>
              <div className="space-y-2">
                <input
                  placeholder="Email"
                  className="w-full h-8 px-2 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg-page)]"
                />
                <input
                  placeholder="Password"
                  type="password"
                  className="w-full h-8 px-2 text-sm rounded border border-[var(--color-border)] bg-[var(--color-bg-page)]"
                />
                <Button size="sm" variant="primary" className="w-full">
                  Create Account
                </Button>
              </div>
            </Card>
          </CanvasElement>
        </CanvasArea>
      </div>

      {/* Right sidebar */}
      <div className="w-56 border-l border-[var(--color-border)] p-2 bg-[var(--color-bg-elevated)]">
        <Text size="xs" weight="medium" className="px-2 py-1 text-[var(--color-text-muted)] uppercase tracking-wider">
          Properties
        </Text>
        <div className="mt-2 space-y-2 px-2">
          <div className="flex justify-between items-center">
            <Text size="xs" tone="secondary">X</Text>
            <Text size="xs" className="font-mono">80</Text>
          </div>
          <div className="flex justify-between items-center">
            <Text size="xs" tone="secondary">Y</Text>
            <Text size="xs" className="font-mono">40</Text>
          </div>
          <div className="flex justify-between items-center">
            <Text size="xs" tone="secondary">Width</Text>
            <Text size="xs" className="font-mono">240</Text>
          </div>
          <div className="flex justify-between items-center">
            <Text size="xs" tone="secondary">Height</Text>
            <Text size="xs" className="font-mono">180</Text>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Empty state
 */
export const EmptyState: Story = {
  render: () => (
    <CanvasArea
      className="w-[400px] h-[250px]"
      background="dots"
      showGrid
      border="dashed"
    >
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center">
          <svg
            className="w-6 h-6 text-[var(--color-text-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <Text tone="muted">Drag elements here to start building</Text>
        <Text size="xs" tone="muted">or click an element from the palette</Text>
      </div>
    </CanvasArea>
  ),
};
