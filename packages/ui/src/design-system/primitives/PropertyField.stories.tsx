import type { Meta, StoryObj } from '@storybook/react';
import { PropertyField, PropertyGroup, PropertySection } from './PropertyField';
import { Input } from './Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './Select';
import { Switch } from './Switch';
import { Checkbox } from './Checkbox';
import { Text } from './Text';
import { Card } from './Card';

/**
 * PropertyField — IDE form field layout
 *
 * Used in HiveLab properties panel for consistent field layout.
 * Supports horizontal (label left), vertical (label above), and full-width layouts.
 *
 * @see docs/design-system/PRIMITIVES.md (PropertyField)
 */
const meta: Meta<typeof PropertyField> = {
  title: 'Design System/Primitives/Workshop/PropertyField',
  component: PropertyField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'IDE-style form field layout for HiveLab properties panel. Consistent layout with label positioning.',
      },
    },
  },
  argTypes: {
    layout: {
      control: 'select',
      options: ['horizontal', 'vertical', 'full'],
      description: 'Field layout style',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Field size',
    },
    label: {
      control: 'text',
      description: 'Field label',
    },
    description: {
      control: 'text',
      description: 'Help text',
    },
    error: {
      control: 'text',
      description: 'Error message',
    },
    required: {
      control: 'boolean',
      description: 'Required indicator',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PropertyField>;

/**
 * Default — Horizontal layout
 */
export const Default: Story = {
  render: () => (
    <div className="w-80">
      <PropertyField label="Label" htmlFor="text-input">
        <Input id="text-input" placeholder="Enter value..." size="sm" />
      </PropertyField>
    </div>
  ),
};

/**
 * Horizontal layout (default)
 */
export const HorizontalLayout: Story = {
  render: () => (
    <div className="w-80 space-y-1">
      <PropertyField label="Name" layout="horizontal">
        <Input placeholder="Element name" size="sm" />
      </PropertyField>
      <PropertyField label="Width" layout="horizontal">
        <Input type="number" placeholder="auto" size="sm" />
      </PropertyField>
      <PropertyField label="Height" layout="horizontal">
        <Input type="number" placeholder="auto" size="sm" />
      </PropertyField>
    </div>
  ),
};

/**
 * Vertical layout
 */
export const VerticalLayout: Story = {
  render: () => (
    <div className="w-64 space-y-3">
      <PropertyField label="Element Name" layout="vertical" description="A unique identifier">
        <Input placeholder="my-element" size="sm" />
      </PropertyField>
      <PropertyField label="Description" layout="vertical">
        <Input placeholder="Optional description" size="sm" />
      </PropertyField>
    </div>
  ),
};

/**
 * With select control
 */
export const WithSelect: Story = {
  render: () => (
    <div className="w-80 space-y-1">
      <PropertyField label="Type">
        <Select>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
          </SelectContent>
        </Select>
      </PropertyField>
      <PropertyField label="Position">
        <Select>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="static">Static</SelectItem>
            <SelectItem value="relative">Relative</SelectItem>
            <SelectItem value="absolute">Absolute</SelectItem>
          </SelectContent>
        </Select>
      </PropertyField>
    </div>
  ),
};

/**
 * With switch control
 */
export const WithSwitch: Story = {
  render: () => (
    <div className="w-80 space-y-1">
      <PropertyField label="Visible">
        <Switch defaultChecked size="sm" />
      </PropertyField>
      <PropertyField label="Interactive">
        <Switch size="sm" />
      </PropertyField>
      <PropertyField label="Locked">
        <Switch size="sm" />
      </PropertyField>
    </div>
  ),
};

/**
 * With checkbox control
 */
export const WithCheckbox: Story = {
  render: () => (
    <div className="w-80 space-y-1">
      <PropertyField label="Options" layout="vertical">
        <div className="flex flex-col gap-2 ml-1">
          <div className="flex items-center gap-2">
            <Checkbox id="opt1" size="sm" />
            <label htmlFor="opt1" className="text-sm text-[var(--color-text-secondary)]">Auto-resize</label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="opt2" size="sm" />
            <label htmlFor="opt2" className="text-sm text-[var(--color-text-secondary)]">Maintain aspect ratio</label>
          </div>
        </div>
      </PropertyField>
    </div>
  ),
};

/**
 * With error
 */
export const WithError: Story = {
  render: () => (
    <div className="w-80">
      <PropertyField
        label="Name"
        error="Name is required"
        required
      >
        <Input placeholder="Enter name" size="sm" className="border-[var(--color-status-error)]" />
      </PropertyField>
    </div>
  ),
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="w-80">
        <Text size="xs" tone="muted" className="mb-2">Size: sm</Text>
        <PropertyField label="Small field" size="sm">
          <Input placeholder="Value" size="sm" />
        </PropertyField>
      </div>
      <div className="w-80">
        <Text size="xs" tone="muted" className="mb-2">Size: default</Text>
        <PropertyField label="Default field" size="default">
          <Input placeholder="Value" size="sm" />
        </PropertyField>
      </div>
      <div className="w-80">
        <Text size="xs" tone="muted" className="mb-2">Size: lg</Text>
        <PropertyField label="Large field" size="lg">
          <Input placeholder="Value" />
        </PropertyField>
      </div>
    </div>
  ),
};

/**
 * PropertyGroup — Collapsible groups
 */
export const PropertyGroupVariant: Story = {
  render: () => (
    <div className="w-80 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elevated)]">
      <PropertyGroup title="Transform">
        <PropertyField label="X">
          <Input type="number" placeholder="0" size="sm" />
        </PropertyField>
        <PropertyField label="Y">
          <Input type="number" placeholder="0" size="sm" />
        </PropertyField>
        <PropertyField label="Rotation">
          <Input type="number" placeholder="0°" size="sm" />
        </PropertyField>
      </PropertyGroup>
      <PropertyGroup title="Appearance">
        <PropertyField label="Opacity">
          <Input type="number" placeholder="100%" size="sm" />
        </PropertyField>
        <PropertyField label="Visible">
          <Switch defaultChecked size="sm" />
        </PropertyField>
      </PropertyGroup>
      <PropertyGroup title="Layout" defaultCollapsed>
        <PropertyField label="Width">
          <Input type="number" placeholder="auto" size="sm" />
        </PropertyField>
        <PropertyField label="Height">
          <Input type="number" placeholder="auto" size="sm" />
        </PropertyField>
      </PropertyGroup>
    </div>
  ),
};

/**
 * PropertySection — Dividers
 */
export const PropertySectionVariant: Story = {
  render: () => (
    <div className="w-80 p-3 bg-[var(--color-bg-elevated)] rounded-lg">
      <PropertyField label="Name">
        <Input placeholder="Element" size="sm" />
      </PropertyField>
      <PropertySection label="Position" />
      <PropertyField label="X">
        <Input type="number" placeholder="0" size="sm" />
      </PropertyField>
      <PropertyField label="Y">
        <Input type="number" placeholder="0" size="sm" />
      </PropertyField>
      <PropertySection label="Size" />
      <PropertyField label="Width">
        <Input type="number" placeholder="auto" size="sm" />
      </PropertyField>
      <PropertyField label="Height">
        <Input type="number" placeholder="auto" size="sm" />
      </PropertyField>
    </div>
  ),
};

/**
 * In context — HiveLab properties panel
 */
export const HiveLabPropertiesPanelContext: Story = {
  render: () => (
    <Card className="w-72 !p-0 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-page)]">
        <div className="flex items-center justify-between">
          <Text size="xs" weight="medium" className="uppercase tracking-wider text-[var(--color-text-muted)]">
            Properties
          </Text>
          <Text size="xs" tone="muted">Button</Text>
        </div>
      </div>

      {/* Content */}
      <div className="bg-[var(--color-bg-elevated)]">
        <PropertyGroup title="Content" collapsible={false}>
          <PropertyField label="Label">
            <Input defaultValue="Submit" size="sm" />
          </PropertyField>
          <PropertyField label="Variant">
            <Select defaultValue="primary">
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="ghost">Ghost</SelectItem>
              </SelectContent>
            </Select>
          </PropertyField>
        </PropertyGroup>

        <PropertyGroup title="Layout">
          <PropertyField label="Width">
            <Input type="number" placeholder="auto" size="sm" />
          </PropertyField>
          <PropertyField label="Full width">
            <Switch size="sm" />
          </PropertyField>
        </PropertyGroup>

        <PropertyGroup title="Interaction">
          <PropertyField label="Disabled">
            <Switch size="sm" />
          </PropertyField>
          <PropertyField label="Loading">
            <Switch size="sm" />
          </PropertyField>
        </PropertyGroup>
      </div>
    </Card>
  ),
};

/**
 * In context — Element inspector
 */
export const ElementInspectorContext: Story = {
  render: () => (
    <Card className="w-64 !p-0 overflow-hidden">
      <div className="px-3 py-2 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[var(--color-bg-page)] flex items-center justify-center">
            <Text size="xs">T</Text>
          </div>
          <Text size="sm" weight="medium">Text Element</Text>
        </div>
      </div>
      <div className="p-3 space-y-1">
        <PropertyField label="Content" layout="vertical">
          <Input defaultValue="Hello, World!" size="sm" />
        </PropertyField>
        <PropertyField label="Font Size">
          <Input type="number" defaultValue="16" size="sm" />
        </PropertyField>
        <PropertyField label="Color">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-[var(--color-border)] bg-[var(--color-text-primary)]" />
            <Input defaultValue="#FAFAFA" size="sm" className="flex-1" />
          </div>
        </PropertyField>
        <PropertyField label="Bold">
          <Switch size="sm" />
        </PropertyField>
      </div>
    </Card>
  ),
};
