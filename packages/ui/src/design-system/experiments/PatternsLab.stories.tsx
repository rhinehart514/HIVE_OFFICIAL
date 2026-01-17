import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  FormLayout,
  FormField,
  FormActions,
  FormSection,
  FormDivider,
} from '../patterns/FormLayout';
import {
  ListLayout,
  ListItem,
  ListGroup,
  ListHeader,
} from '../patterns/ListLayout';
import {
  GridLayout,
  GridItem,
  BentoGrid,
  BentoItem,
} from '../patterns/GridLayout';
import {
  SplitView,
  SplitPanel,
} from '../patterns/SplitView';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';
import { Avatar } from '../primitives/Avatar';
import { Badge } from '../primitives/Badge';
import { Card } from '../primitives/Card';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PATTERNS LAB - UI Pattern Experiments
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Testing common layout patterns for forms, lists, grids, and split views.
 */

const meta: Meta = {
  title: 'Experiments/Patterns/PatternsLab',
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// FORM LAYOUT LAB
// ============================================

/**
 * [EXPERIMENT]: Form Layout Variants
 * [HYPOTHESIS]: Vertical layout works best for simple forms, horizontal for settings
 * [VARIABLES]: Layout direction (vertical vs horizontal vs inline)
 */
export const FormLayoutLab: Story = {
  render: () => (
    <div className="space-y-12 max-w-4xl">
      <div className="text-sm text-[var(--text-muted)] mb-4">
        Compare form layout directions. Evaluate visual hierarchy and density.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vertical Layout */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Vertical Layout (Default)
          </h3>
          <Card className="p-6">
            <FormLayout layout="vertical" spacing="default" onSubmit={(e) => e.preventDefault()}>
              <FormField label="Full Name" required htmlFor="name">
                <Input id="name" placeholder="Enter your name" />
              </FormField>
              <FormField label="Email" helperText="We'll never share your email" htmlFor="email">
                <Input id="email" type="email" placeholder="you@example.com" />
              </FormField>
              <FormField label="Password" error="Password must be at least 8 characters" htmlFor="password">
                <Input id="password" type="password" placeholder="Enter password" />
              </FormField>
              <FormActions>
                <Button variant="ghost">Cancel</Button>
                <Button variant="primary">Save</Button>
              </FormActions>
            </FormLayout>
          </Card>
        </div>

        {/* Horizontal Layout */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Horizontal Layout (Settings)
          </h3>
          <Card className="p-6">
            <FormLayout layout="horizontal" spacing="default" onSubmit={(e) => e.preventDefault()}>
              <FormField label="Display Name" htmlFor="display">
                <Input id="display" placeholder="Your display name" />
              </FormField>
              <FormField label="Bio" htmlFor="bio">
                <Input id="bio" placeholder="A short bio" />
              </FormField>
              <FormField label="Website" htmlFor="website">
                <Input id="website" placeholder="https://..." />
              </FormField>
              <FormActions>
                <Button variant="primary">Update Profile</Button>
              </FormActions>
            </FormLayout>
          </Card>
        </div>

        {/* Inline Layout */}
        <div className="space-y-4 lg:col-span-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Inline Layout (Compact Filters)
          </h3>
          <Card className="p-6">
            <FormLayout layout="inline" spacing="default" onSubmit={(e) => e.preventDefault()}>
              <FormField label="Search" htmlFor="search">
                <Input id="search" placeholder="Search..." className="w-48" />
              </FormField>
              <FormField label="Category" htmlFor="category">
                <Input id="category" placeholder="All" className="w-32" />
              </FormField>
              <FormField label="Status" htmlFor="status">
                <Input id="status" placeholder="Active" className="w-32" />
              </FormField>
              <Button variant="primary" className="mb-1">Filter</Button>
            </FormLayout>
          </Card>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// FORM SECTIONS LAB
// ============================================

/**
 * [EXPERIMENT]: Form Sections for Complex Forms
 * [HYPOTHESIS]: Sectioned forms reduce cognitive load on long forms
 * [VARIABLES]: With/without sections and dividers
 */
export const FormSectionsLab: Story = {
  render: () => (
    <div className="space-y-8 max-w-xl">
      <div className="text-sm text-[var(--text-muted)] mb-4">
        Testing form sections for organizing complex forms into logical groups.
      </div>

      <Card className="p-6">
        <FormLayout onSubmit={(e) => e.preventDefault()}>
          <FormSection
            title="Personal Information"
            description="Basic details about yourself"
          >
            <FormField label="First Name" required htmlFor="first">
              <Input id="first" placeholder="First name" />
            </FormField>
            <FormField label="Last Name" required htmlFor="last">
              <Input id="last" placeholder="Last name" />
            </FormField>
          </FormSection>

          <FormDivider />

          <FormSection
            title="Contact Information"
            description="How we can reach you"
          >
            <FormField label="Email" required htmlFor="contact-email">
              <Input id="contact-email" type="email" placeholder="you@example.com" />
            </FormField>
            <FormField label="Phone" htmlFor="phone">
              <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
            </FormField>
          </FormSection>

          <FormDivider />

          <FormSection
            title="Preferences"
            description="Customize your experience"
          >
            <FormField label="Timezone" htmlFor="timezone">
              <Input id="timezone" placeholder="America/New_York" />
            </FormField>
            <FormField label="Language" htmlFor="language">
              <Input id="language" placeholder="English" />
            </FormField>
          </FormSection>

          <FormActions align="right">
            <Button variant="ghost">Cancel</Button>
            <Button variant="primary">Save Changes</Button>
          </FormActions>
        </FormLayout>
      </Card>
    </div>
  ),
};

// ============================================
// LIST LAYOUT LAB
// ============================================

const sampleUsers = [
  { id: '1', name: 'Alex Chen', role: 'Admin', status: 'online' },
  { id: '2', name: 'Jordan Kim', role: 'Member', status: 'online' },
  { id: '3', name: 'Sam Wilson', role: 'Member', status: 'offline' },
  { id: '4', name: 'Taylor Brown', role: 'Moderator', status: 'online' },
  { id: '5', name: 'Casey Davis', role: 'Member', status: 'away' },
];

/**
 * [EXPERIMENT]: List Layout Variants
 * [HYPOTHESIS]: Different variants suit different contexts (settings vs members)
 * [VARIABLES]: Variant (basic, grouped, dense, card)
 */
export const ListLayoutLab: Story = {
  render: () => (
    <div className="space-y-12 max-w-4xl">
      <div className="text-sm text-[var(--text-muted)] mb-4">
        Compare list layout variants. Consider visual density and interaction patterns.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic List */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Basic List
          </h3>
          <ListLayout variant="basic">
            <ListHeader title="Team Members" subtitle="5 members" />
            {sampleUsers.map((user) => (
              <ListItem
                key={user.id}
                leading={<Avatar fallback={user.name[0]} size="sm" />}
                primary={user.name}
                secondary={user.role}
                trailing={
                  <Badge variant={user.status === 'online' ? 'success' : 'secondary'}>
                    {user.status}
                  </Badge>
                }
                interactive
                onClick={() => console.log('Clicked', user.name)}
              />
            ))}
          </ListLayout>
        </div>

        {/* Grouped List */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Grouped List
          </h3>
          <ListLayout variant="grouped">
            <ListGroup title="Online" subtitle="3 members">
              {sampleUsers
                .filter((u) => u.status === 'online')
                .map((user) => (
                  <ListItem
                    key={user.id}
                    leading={<Avatar fallback={user.name[0]} size="sm" />}
                    primary={user.name}
                    secondary={user.role}
                    interactive
                  />
                ))}
            </ListGroup>
            <ListGroup title="Offline" subtitle="2 members">
              {sampleUsers
                .filter((u) => u.status !== 'online')
                .map((user) => (
                  <ListItem
                    key={user.id}
                    leading={<Avatar fallback={user.name[0]} size="sm" />}
                    primary={user.name}
                    secondary={user.role}
                    interactive
                  />
                ))}
            </ListGroup>
          </ListLayout>
        </div>

        {/* Dense List */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Dense List (Settings)
          </h3>
          <Card className="overflow-hidden">
            <ListLayout variant="dense">
              <ListItem
                primary="Notifications"
                trailing={<Badge>Enabled</Badge>}
                interactive
              />
              <ListItem
                primary="Privacy"
                trailing={<Badge variant="secondary">Public</Badge>}
                interactive
              />
              <ListItem
                primary="Theme"
                trailing={<Badge variant="secondary">Dark</Badge>}
                interactive
              />
              <ListItem
                primary="Language"
                trailing={<Badge variant="secondary">English</Badge>}
                interactive
              />
            </ListLayout>
          </Card>
        </div>

        {/* Card List */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Card List
          </h3>
          <ListLayout variant="card">
            {sampleUsers.slice(0, 3).map((user) => (
              <ListItem
                key={user.id}
                leading={<Avatar fallback={user.name[0]} size="md" />}
                primary={user.name}
                secondary={`${user.role} · ${user.status}`}
                trailing={<Button variant="ghost" size="sm">View</Button>}
                interactive
              />
            ))}
          </ListLayout>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// GRID LAYOUT LAB
// ============================================

/**
 * [EXPERIMENT]: Grid Layout Variants
 * [HYPOTHESIS]: Fixed grids for uniform content, autoFit for responsive
 * [VARIABLES]: Variant (fixed, autoFit, masonry), columns
 */
export const GridLayoutLab: Story = {
  render: () => (
    <div className="space-y-12">
      <div className="text-sm text-[var(--text-muted)] mb-4">
        Compare grid variants. Test responsive behavior and content fit.
      </div>

      {/* Fixed Columns Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">
          Fixed Columns (3-col)
        </h3>
        <GridLayout variant="fixed" columns={3} gap="md">
          {Array.from({ length: 6 }).map((_, i) => (
            <GridItem key={i}>
              <Card className="aspect-video flex items-center justify-center">
                <span className="text-[var(--text-tertiary)]">Item {i + 1}</span>
              </Card>
            </GridItem>
          ))}
        </GridLayout>
      </div>

      {/* Auto-fit Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">
          Auto-fit (min 200px)
        </h3>
        <GridLayout variant="autoFit" minItemWidth="200px" gap="md">
          {Array.from({ length: 8 }).map((_, i) => (
            <GridItem key={i}>
              <Card className="aspect-video flex items-center justify-center">
                <span className="text-[var(--text-tertiary)]">Item {i + 1}</span>
              </Card>
            </GridItem>
          ))}
        </GridLayout>
      </div>

      {/* Masonry Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">
          Masonry Layout
        </h3>
        <GridLayout variant="masonry" gap="md">
          {[120, 180, 100, 200, 140, 160, 110, 190].map((height, i) => (
            <GridItem key={i}>
              <Card
                className="flex items-center justify-center"
                style={{ height: `${height}px` }}
              >
                <span className="text-[var(--text-tertiary)]">Item {i + 1}</span>
              </Card>
            </GridItem>
          ))}
        </GridLayout>
      </div>
    </div>
  ),
};

// ============================================
// BENTO GRID LAB
// ============================================

/**
 * [EXPERIMENT]: Bento Grid for Feature Layouts
 * [HYPOTHESIS]: Variable-sized items create visual hierarchy
 * [VARIABLES]: Item sizes (sm, md, lg, xl)
 */
export const BentoGridLab: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="text-sm text-[var(--text-muted)] mb-4">
        Bento grid for profile pages and feature showcases.
        XL items span 2x2, LG items span 1x2 (tall).
      </div>

      <BentoGrid gap="md">
        <BentoItem size="xl" className="p-6 flex flex-col justify-end">
          <div className="space-y-2">
            <Badge variant="gold">Featured</Badge>
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">
              Hero Section
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              The main highlight of this profile
            </p>
          </div>
        </BentoItem>

        <BentoItem size="sm" className="p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-[var(--text-primary)]">42</div>
            <div className="text-xs text-[var(--text-tertiary)]">Spaces</div>
          </div>
        </BentoItem>

        <BentoItem size="sm" className="p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-[var(--text-primary)]">128</div>
            <div className="text-xs text-[var(--text-tertiary)]">Connections</div>
          </div>
        </BentoItem>

        <BentoItem size="lg" className="p-4 flex flex-col justify-between">
          <h4 className="text-sm font-medium text-[var(--text-secondary)]">
            Recent Activity
          </h4>
          <div className="space-y-2">
            <div className="text-sm text-[var(--text-tertiary)]">Joined Design Club</div>
            <div className="text-sm text-[var(--text-tertiary)]">Posted in CS Study</div>
            <div className="text-sm text-[var(--text-tertiary)]">Created new tool</div>
          </div>
        </BentoItem>

        <BentoItem size="md" className="p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-semibold text-[var(--text-primary)]">
              About Me
            </div>
            <p className="text-sm text-[var(--text-tertiary)] mt-2">
              CS Major, coffee enthusiast, midnight coder
            </p>
          </div>
        </BentoItem>
      </BentoGrid>
    </div>
  ),
};

// ============================================
// SPLIT VIEW LAB
// ============================================

/**
 * [EXPERIMENT]: Split View Layouts
 * [HYPOTHESIS]: 1/3 ratio works for navigation, 1/2 for comparison
 * [VARIABLES]: Direction, ratio, collapsible
 */
export const SplitViewLab: Story = {
  render: () => (
    <div className="space-y-12">
      <div className="text-sm text-[var(--text-muted)] mb-4">
        Split view patterns for master-detail, sidebars, and comparisons.
      </div>

      {/* Horizontal Split - 1/3 */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">
          Horizontal Split (1/3 - Sidebar)
        </h3>
        <Card className="h-[400px] overflow-hidden">
          <SplitView direction="horizontal" ratio="1/3">
            <SplitPanel header={<span className="font-medium">Conversations</span>} padding="sm">
              <ListLayout variant="dense">
                {['Design Team', 'Engineering', 'Marketing', 'Support'].map((name) => (
                  <ListItem key={name} primary={name} interactive />
                ))}
              </ListLayout>
            </SplitPanel>
            <SplitPanel header={<span className="font-medium">Design Team</span>} padding="md">
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Welcome to the Design Team space. This is where we discuss UI/UX.
                </p>
                <div className="p-4 rounded-lg bg-[var(--bg-subtle)]">
                  <p className="text-sm text-[var(--text-tertiary)]">
                    No messages yet. Start a conversation!
                  </p>
                </div>
              </div>
            </SplitPanel>
          </SplitView>
        </Card>
      </div>

      {/* Horizontal Split - 1/2 */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">
          Horizontal Split (1/2 - Comparison)
        </h3>
        <Card className="h-[300px] overflow-hidden">
          <SplitView direction="horizontal" ratio="1/2">
            <SplitPanel header={<span className="font-medium">Before</span>} padding="md">
              <div className="h-full flex items-center justify-center text-[var(--text-tertiary)]">
                Original Version
              </div>
            </SplitPanel>
            <SplitPanel header={<span className="font-medium">After</span>} padding="md">
              <div className="h-full flex items-center justify-center text-[var(--text-tertiary)]">
                Updated Version
              </div>
            </SplitPanel>
          </SplitView>
        </Card>
      </div>

      {/* Vertical Split */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">
          Vertical Split (Editor + Preview)
        </h3>
        <Card className="h-[400px] overflow-hidden">
          <SplitView direction="vertical" ratio="1/2">
            <SplitPanel header={<span className="font-medium">Editor</span>} padding="md">
              <div className="h-full flex items-center justify-center text-[var(--text-tertiary)] font-mono">
                {'<div>Hello World</div>'}
              </div>
            </SplitPanel>
            <SplitPanel header={<span className="font-medium">Preview</span>} padding="md">
              <div className="h-full flex items-center justify-center text-[var(--text-primary)]">
                Hello World
              </div>
            </SplitPanel>
          </SplitView>
        </Card>
      </div>
    </div>
  ),
};

// ============================================
// MASTER SHOWCASE
// ============================================

/**
 * All patterns combined in a realistic example
 */
export const MasterShowcase: Story = {
  render: () => (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        Pattern Combinations
      </h2>

      <Card className="h-[600px] overflow-hidden">
        <SplitView direction="horizontal" ratio="1/4">
          {/* Sidebar */}
          <SplitPanel padding="sm">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] px-2">
                Navigation
              </h3>
              <ListLayout variant="dense">
                <ListItem primary="Dashboard" interactive />
                <ListItem primary="Members" interactive />
                <ListItem primary="Settings" interactive />
                <ListItem primary="Analytics" interactive />
              </ListLayout>
            </div>
          </SplitPanel>

          {/* Main Content */}
          <SplitPanel padding="lg">
            <div className="space-y-6 h-full overflow-auto">
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Members
                </h2>
                <p className="text-sm text-[var(--text-tertiary)]">
                  Manage your team members
                </p>
              </div>

              {/* Filter Form */}
              <FormLayout layout="inline" className="pb-4 border-b border-[var(--border-subtle)]">
                <FormField label="Search">
                  <Input placeholder="Search members..." className="w-48" />
                </FormField>
                <FormField label="Role">
                  <Input placeholder="All roles" className="w-32" />
                </FormField>
                <Button variant="secondary" size="sm">Filter</Button>
              </FormLayout>

              {/* Members Grid */}
              <GridLayout variant="fixed" columns={3} gap="md">
                {sampleUsers.map((user) => (
                  <GridItem key={user.id}>
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar fallback={user.name[0]} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[var(--text-primary)] truncate">
                            {user.name}
                          </div>
                          <div className="text-xs text-[var(--text-tertiary)]">
                            {user.role}
                          </div>
                        </div>
                        <Badge variant={user.status === 'online' ? 'success' : 'secondary'} size="sm">
                          {user.status}
                        </Badge>
                      </div>
                    </Card>
                  </GridItem>
                ))}
              </GridLayout>
            </div>
          </SplitPanel>
        </SplitView>
      </Card>
    </div>
  ),
};
