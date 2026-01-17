import type { Meta, StoryObj } from '@storybook/react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './Select';
import { Label } from './Label';
import { Text } from './Text';

/**
 * Select — Dropdown selection
 *
 * Radix-based dropdown with WHITE focus ring (never gold).
 * Supports groups, labels, and separators.
 *
 * @see docs/design-system/PRIMITIVES.md (Select)
 */
const meta: Meta<typeof Select> = {
  title: 'Design System/Primitives/Inputs/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Dropdown select with WHITE focus ring (never gold). Built on Radix Select.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

/**
 * Default — Basic select
 */
export const Default: Story = {
  render: () => (
    <div className="w-56">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option-1">Option 1</SelectItem>
          <SelectItem value="option-2">Option 2</SelectItem>
          <SelectItem value="option-3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-56">
      <div>
        <Text size="xs" tone="muted" className="mb-1">Small</Text>
        <Select defaultValue="small">
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small trigger</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-1">Default</Text>
        <Select defaultValue="default">
          <SelectTrigger size="default">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default trigger</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-1">Large</Text>
        <Select defaultValue="large">
          <SelectTrigger size="lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="large">Large trigger</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
};

/**
 * With groups and labels
 */
export const WithGroups: Story = {
  render: () => (
    <div className="w-56">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select territory" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Academic</SelectLabel>
            <SelectItem value="engineering">Engineering</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="arts">Arts & Sciences</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Social</SelectLabel>
            <SelectItem value="greek">Greek Life</SelectItem>
            <SelectItem value="sports">Sports Clubs</SelectItem>
            <SelectItem value="cultural">Cultural Orgs</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Professional</SelectLabel>
            <SelectItem value="career">Career Development</SelectItem>
            <SelectItem value="research">Research Groups</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};

/**
 * With label
 */
export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-56">
      <Label htmlFor="role-select">Your role</Label>
      <Select>
        <SelectTrigger id="role-select">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="member">Member</SelectItem>
          <SelectItem value="moderator">Moderator</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="owner">Owner</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  render: () => (
    <div className="w-56">
      <Select disabled defaultValue="locked">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="locked">Locked selection</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

/**
 * Focus state — WHITE ring (never gold)
 */
export const FocusState: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-56">
      <Text size="sm" tone="muted">
        Tab to see WHITE focus ring (never gold):
      </Text>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Focus me" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="focus">White focus ring</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

/**
 * In context — Settings form
 */
export const SettingsFormContext: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80 p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <Text weight="medium">Space Settings</Text>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Visibility</Label>
          <Select defaultValue="public">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="invite">Invite Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Default role for new members</Label>
          <Select defaultValue="member">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="contributor">Contributor</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Territory</Label>
          <Select defaultValue="engineering">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Academic</SelectLabel>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="arts">Arts & Sciences</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Social</SelectLabel>
                <SelectItem value="greek">Greek Life</SelectItem>
                <SelectItem value="sports">Sports Clubs</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  ),
};

/**
 * In context — Filter bar
 */
export const FilterBarContext: Story = {
  render: () => (
    <div className="flex gap-3 p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
      <Select defaultValue="all">
        <SelectTrigger size="sm" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="academic">Academic</SelectItem>
          <SelectItem value="social">Social</SelectItem>
          <SelectItem value="professional">Professional</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="recent">
        <SelectTrigger size="sm" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Most recent</SelectItem>
          <SelectItem value="popular">Most popular</SelectItem>
          <SelectItem value="members">Most members</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="any">
        <SelectTrigger size="sm" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any size</SelectItem>
          <SelectItem value="small">Small (&lt;50)</SelectItem>
          <SelectItem value="medium">Medium (50-200)</SelectItem>
          <SelectItem value="large">Large (200+)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};
