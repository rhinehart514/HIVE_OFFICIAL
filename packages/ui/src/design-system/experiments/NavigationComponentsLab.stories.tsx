import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

// Import navigation components
import { CommandPalette, type CommandPaletteItem } from '../components/CommandPalette';
import { Pagination, SimplePagination } from '../components/Pagination';
import { TabNav, SimpleTabNav, type TabNavItem } from '../components/TabNav';
import { Sidebar, type SidebarSpace, type SidebarTool } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { Button } from '../primitives/Button';

const meta: Meta = {
  title: 'Experiments/Navigation Components Lab',
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// COMMAND PALETTE LAB
// ============================================

const mockCommandItems: CommandPaletteItem[] = [
  { id: '1', label: 'Engineering Club', description: '42 members', category: 'Spaces', icon: '🔧' },
  { id: '2', label: 'Design Systems', description: '28 members', category: 'Spaces', icon: '🎨' },
  { id: '3', label: 'Photography', description: '156 members', category: 'Spaces', icon: '📷' },
  { id: '4', label: 'Create new tool', shortcut: ['⌘', 'N'], category: 'Actions', icon: '⚡', featured: true },
  { id: '5', label: 'Settings', shortcut: ['⌘', ','], category: 'Actions', icon: '⚙️' },
  { id: '6', label: 'Go to Profile', category: 'Navigation', icon: '👤' },
];

/**
 * EXPERIMENT: Command Palette
 * Compare: Item layouts, shortcuts display, featured items (gold)
 * Decisions: Visual hierarchy, keyboard hints
 */
export const CommandPaletteLab: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);

    return (
      <div className="space-y-8">
        <div className="text-sm text-[var(--color-text-muted)] mb-4">
          <strong>COMMAND PALETTE</strong> - ⌘K navigation modal
        </div>

        <div className="space-y-4">
          <Button onClick={() => setOpen(true)} variant="secondary">
            Open Command Palette (⌘K)
          </Button>

          <div className="text-xs text-[var(--color-text-tertiary)]">
            Features: Fuzzy search, keyboard navigation, categories, shortcuts, featured items (gold)
          </div>
        </div>

        <CommandPalette
          open={open}
          onOpenChange={setOpen}
          items={mockCommandItems}
          placeholder="Search or type a command..."
          onSelect={(item) => {
            console.log('Selected:', item);
            setOpen(false);
          }}
        />

        {/* Static preview of item states */}
        <div className="space-y-4 mt-8 max-w-md">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Item States Preview
          </div>
          <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-elevated)] p-4 space-y-2">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.04]">
              <div className="flex items-center gap-3">
                <span>🔧</span>
                <div>
                  <div className="text-sm text-white">Engineering Club</div>
                  <div className="text-xs text-[var(--color-text-muted)]">42 members</div>
                </div>
              </div>
              <span className="text-xs text-[var(--color-text-tertiary)]">→</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.04]">
              <div className="flex items-center gap-3">
                <span className="text-[#FFD700]">⚡</span>
                <span className="text-sm text-[#FFD700]">Create new tool</span>
              </div>
              <kbd className="text-xs text-[var(--color-text-tertiary)] bg-black/20 px-1.5 py-0.5 rounded">⌘N</kbd>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// PAGINATION LAB
// ============================================

/**
 * EXPERIMENT: Pagination Variants
 * Compare: default vs simple vs compact vs outline
 * Decisions: When to show page numbers, ellipsis behavior
 */
export const PaginationLab: Story = {
  render: () => {
    const [page, setPage] = React.useState(5);

    return (
      <div className="space-y-12 max-w-3xl">
        <div className="text-sm text-[var(--color-text-muted)] mb-4">
          <strong>PAGINATION VARIANTS</strong> - Context-appropriate navigation
        </div>

        {/* Variant comparison */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Default (Numbers with ellipsis)
            </div>
            <SimplePagination
              currentPage={page}
              totalPages={20}
              onPageChange={setPage}
              variant="default"
            />
          </div>

          <div className="space-y-4">
            <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Simple (Prev/Next only)
            </div>
            <SimplePagination
              currentPage={page}
              totalPages={20}
              onPageChange={setPage}
              variant="simple"
            />
          </div>

          <div className="space-y-4">
            <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Compact (Current/Total)
            </div>
            <SimplePagination
              currentPage={page}
              totalPages={20}
              onPageChange={setPage}
              variant="compact"
            />
          </div>

          <div className="space-y-4">
            <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Outline (Bordered)
            </div>
            <SimplePagination
              currentPage={page}
              totalPages={20}
              onPageChange={setPage}
              variant="outline"
            />
          </div>
        </div>

        {/* Size comparison */}
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Size Comparison
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-xs text-[var(--color-text-muted)] w-16">sm</span>
              <SimplePagination currentPage={page} totalPages={20} onPageChange={setPage} size="sm" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[var(--color-text-muted)] w-16">md</span>
              <SimplePagination currentPage={page} totalPages={20} onPageChange={setPage} size="md" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[var(--color-text-muted)] w-16">lg</span>
              <SimplePagination currentPage={page} totalPages={20} onPageChange={setPage} size="lg" />
            </div>
          </div>
        </div>

        {/* Edge cases */}
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Edge Cases
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-[var(--color-text-muted)]">First Page (Prev disabled)</div>
              <SimplePagination currentPage={1} totalPages={20} onPageChange={() => {}} />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-[var(--color-text-muted)]">Last Page (Next disabled)</div>
              <SimplePagination currentPage={20} totalPages={20} onPageChange={() => {}} />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-[var(--color-text-muted)]">Few Pages (No ellipsis)</div>
              <SimplePagination currentPage={2} totalPages={5} onPageChange={() => {}} />
            </div>
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// TAB NAV LAB
// ============================================

const mockTabs: TabNavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'members', label: 'Members', badge: '24' },
  { id: 'events', label: 'Events', dot: true },
  { id: 'settings', label: 'Settings' },
];

const mockTabsWithIcons: TabNavItem[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'members', label: 'Members', icon: '👥', badge: '24' },
  { id: 'events', label: 'Events', icon: '📅', dot: true },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

/**
 * EXPERIMENT: Tab Navigation Variants
 * Compare: underline vs pills vs segment
 * Decisions: Gold underline vs white, icon placement, badge styling
 */
export const TabNavLab: Story = {
  render: () => {
    const [activeTab, setActiveTab] = React.useState('overview');

    return (
      <div className="space-y-12 max-w-3xl">
        <div className="text-sm text-[var(--color-text-muted)] mb-4">
          <strong>TAB NAV VARIANTS</strong> - Visual styles for tab navigation
        </div>

        {/* Variant comparison */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Underline (Default) - Gold active indicator
            </div>
            <div className="border-b border-[var(--color-border)]">
              <SimpleTabNav
                tabs={mockTabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                variant="underline"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Pills - Elevated background
            </div>
            <SimpleTabNav
              tabs={mockTabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="pills"
            />
          </div>

          <div className="space-y-4">
            <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Segment - Connected pills
            </div>
            <SimpleTabNav
              tabs={mockTabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="segment"
            />
          </div>
        </div>

        {/* With icons */}
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            With Icons
          </div>
          <div className="border-b border-[var(--color-border)]">
            <SimpleTabNav
              tabs={mockTabsWithIcons}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="underline"
            />
          </div>
        </div>

        {/* Size comparison */}
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Sizes
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-[var(--color-text-muted)]">Small</div>
              <SimpleTabNav tabs={mockTabs.slice(0, 3)} activeTab={activeTab} onTabChange={setActiveTab} size="sm" />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-[var(--color-text-muted)]">Default</div>
              <SimpleTabNav tabs={mockTabs.slice(0, 3)} activeTab={activeTab} onTabChange={setActiveTab} size="default" />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-[var(--color-text-muted)]">Large</div>
              <SimpleTabNav tabs={mockTabs.slice(0, 3)} activeTab={activeTab} onTabChange={setActiveTab} size="lg" />
            </div>
          </div>
        </div>

        {/* Vertical orientation */}
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Vertical Orientation
          </div>
          <div className="inline-block border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg-surface)]">
            <SimpleTabNav
              tabs={mockTabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              orientation="vertical"
            />
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// SIDEBAR LAB
// ============================================

const mockSpaces: SidebarSpace[] = [
  { id: '1', name: 'Engineering Club', avatar: '', onlineCount: 12, unreadCount: 3, status: 'chatting' },
  { id: '2', name: 'Design Systems', avatar: '', onlineCount: 5, status: 'quiet' },
  { id: '3', name: 'Photography', avatar: '', onlineCount: 0, hasUpcomingEvent: true },
  { id: '4', name: 'AI/ML Research', avatar: '', onlineCount: 8, status: 'busy' },
];

const mockTools: SidebarTool[] = [
  { id: '1', name: 'Event Planner', icon: '📅', usageCount: 42 },
  { id: '2', name: 'Poll Creator', icon: '📊', usageCount: 28 },
];

/**
 * EXPERIMENT: Sidebar
 * Compare: Collapsed vs expanded, warmth indicators
 * Decisions: Space card density, online indicators, tool section
 */
export const SidebarLab: Story = {
  render: () => {
    const [expanded, setExpanded] = React.useState(true);
    const [activeSpace, setActiveSpace] = React.useState('1');

    return (
      <div className="space-y-8">
        <div className="text-sm text-[var(--color-text-muted)] mb-4">
          <strong>SIDEBAR</strong> - Space navigation with social signals
        </div>

        <div className="flex gap-4 mb-4">
          <Button
            variant={expanded ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setExpanded(true)}
          >
            Expanded
          </Button>
          <Button
            variant={!expanded ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setExpanded(false)}
          >
            Collapsed
          </Button>
        </div>

        <div className="flex gap-8">
          <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-ground)] overflow-hidden h-[500px]">
            <Sidebar
              spaces={mockSpaces}
              tools={mockTools}
              activeSpaceId={activeSpace}
              onSpaceSelect={setActiveSpace}
              onToolSelect={(id) => console.log('Tool:', id)}
              expanded={expanded}
              onExpandedChange={setExpanded}
            />
          </div>

          <div className="flex-1 space-y-4">
            <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Features
            </div>
            <ul className="text-sm text-[var(--color-text-secondary)] space-y-2">
              <li>• Online count with presence dots</li>
              <li>• Unread badge for new messages</li>
              <li>• Status indicators (chatting, quiet, event, busy)</li>
              <li>• Warmth glow based on activity</li>
              <li>• Collapse/expand animation</li>
              <li>• Your Tools section for builders</li>
            </ul>
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// TOP BAR LAB
// ============================================

/**
 * EXPERIMENT: Top Bar Variants
 * Compare: minimal vs breadcrumbs vs collapsible
 * Decisions: Avatar placement, badge styling, action buttons
 */
export const TopBarLab: Story = {
  render: () => (
    <div className="space-y-12 max-w-3xl">
      <div className="text-sm text-[var(--color-text-muted)] mb-4">
        <strong>TOP BAR VARIANTS</strong> - Page headers for different contexts
      </div>

      {/* Minimal */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Minimal - Simple page headers
        </div>
        <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface)] overflow-hidden">
          <TopBar
            variant="minimal"
            title="Settings"
            subtitle="Manage your account preferences"
            actions={<Button size="sm">Save</Button>}
          />
        </div>
      </div>

      {/* With avatar */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          With Avatar - Space headers
        </div>
        <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface)] overflow-hidden">
          <TopBar
            variant="minimal"
            title="Engineering Club"
            subtitle="42 members"
            avatar={{ src: '', fallback: 'EC' }}
            badge="12 online"
            badgeVariant="success"
            actions={
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Share</Button>
                <Button variant="secondary" size="sm">Settings</Button>
              </div>
            }
          />
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Breadcrumbs - Deep navigation
        </div>
        <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface)] overflow-hidden">
          <TopBar
            variant="breadcrumbs"
            title="Event Settings"
            breadcrumbs={[
              { label: 'Spaces', onClick: () => {} },
              { label: 'Engineering Club', onClick: () => {} },
              { label: 'Events', onClick: () => {} },
              { label: 'Event Settings' },
            ]}
            actions={<Button size="sm">Save Changes</Button>}
          />
        </div>
      </div>

      {/* Collapsible preview */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Collapsible States
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Expanded</div>
            <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface)] overflow-hidden">
              <TopBar
                variant="collapsible"
                title="Engineering Club"
                subtitle="Where builders come together to create amazing things"
                avatar={{ src: '', fallback: 'EC' }}
                badge="42 members"
                collapsed={false}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Collapsed</div>
            <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface)] overflow-hidden">
              <TopBar
                variant="collapsible"
                title="Engineering Club"
                subtitle="Where builders come together to create amazing things"
                avatar={{ src: '', fallback: 'EC' }}
                badge="42 members"
                collapsed={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky + bordered */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Bordered (With bottom border)
        </div>
        <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface)] overflow-hidden">
          <TopBar
            variant="minimal"
            title="Dashboard"
            bordered
            actions={<Button size="sm" variant="ghost">Refresh</Button>}
          />
          <div className="p-4 text-sm text-[var(--color-text-muted)]">
            Content below the bordered top bar...
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// MASTER SHOWCASE
// ============================================

/**
 * MASTER SHOWCASE: All Navigation Components
 */
export const MasterShowcase: Story = {
  render: () => {
    const [activeTab, setActiveTab] = React.useState('overview');
    const [page, setPage] = React.useState(5);

    return (
      <div className="space-y-16 max-w-3xl">
        <div className="text-lg font-medium text-white">
          Navigation Components - Complete Collection
        </div>

        {/* Tab Nav */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Tab Navigation</h3>
          <SimpleTabNav
            tabs={mockTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="underline"
          />
        </section>

        {/* Pagination */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Pagination</h3>
          <SimplePagination
            currentPage={page}
            totalPages={20}
            onPageChange={setPage}
          />
        </section>

        {/* Top Bar */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Top Bar</h3>
          <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface)] overflow-hidden">
            <TopBar
              title="Engineering Club"
              subtitle="42 members"
              avatar={{ fallback: 'EC' }}
              badge="12 online"
              badgeVariant="success"
              bordered
            />
          </div>
        </section>

        {/* Sidebar preview */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Sidebar</h3>
          <div className="text-xs text-[var(--color-text-muted)]">
            See SidebarLab story for interactive demo
          </div>
        </section>

        {/* Command Palette note */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Command Palette</h3>
          <div className="text-xs text-[var(--color-text-muted)]">
            See CommandPaletteLab story for interactive demo (⌘K)
          </div>
        </section>
      </div>
    );
  },
};
