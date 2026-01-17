/**
 * Pre-Lab Components Audit
 *
 * These components were built BEFORE the Storybook lab process established
 * the HIVE design approach. They need to be reviewed one-by-one to get:
 *
 * - Locked hover behaviors (opacity not scale)
 * - Warmth system integration (gold edge glow)
 * - Information density decisions
 * - Context-specific variants
 * - Motion choreography
 * - Visual hierarchy
 *
 * STATUS KEY:
 * - 🔴 NOT STARTED — Needs full lab treatment
 * - 🟡 NEEDS REVIEW — Has some issues (tokens, hover, etc.)
 * - 🟢 APPROVED — Went through lab, decisions locked
 *
 * HOW TO USE:
 * 1. Pick a component from 🔴 NOT STARTED
 * 2. Create a dedicated lab story (e.g., PostCardLab.stories.tsx)
 * 3. Test 4-5 variations per design variable
 * 4. Lock decisions in DECISIONS.md
 * 5. Move to 🟢 APPROVED
 */

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

const meta: Meta = {
  title: 'Audit/Pre-Lab Components',
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// COMPONENT REGISTRY
// ============================================

interface ComponentEntry {
  name: string;
  category: string;
  status: 'not-started' | 'needs-review' | 'approved';
  issues?: string[];
  notes?: string;
}

const PRE_LAB_COMPONENTS: ComponentEntry[] = [
  // ============================================
  // 🟢 APPROVED (Lab-tested, decisions locked)
  // ============================================
  { name: 'ChatMessage', category: 'Core', status: 'approved', notes: 'LOCKED 2026-01-11 — Glass bubbles, gold own messages' },
  { name: 'ProfileCard', category: 'Core', status: 'approved', notes: 'LOCKED 2026-01-11 — 5 context variants' },
  { name: 'EventCard', category: 'Core', status: 'approved', notes: 'LOCKED 2026-01-11 — Toggle chip RSVP, edge warmth' },
  { name: 'SpaceCard', category: 'Core', status: 'approved', notes: 'LOCKED 2026-01-11 — Immersive portal, territory gradient' },
  { name: 'ToolCard', category: 'Core', status: 'approved', notes: 'LOCKED 2026-01-11 — Workshop layout, Heroicons' },
  { name: 'CommandBar', category: 'Core', status: 'approved', notes: 'LOCKED 2026-01-11 — 560px modal, keyboard hints' },

  // ============================================
  // 🟡 NEEDS REVIEW (Known issues)
  // ============================================
  { name: 'Sidebar', category: 'Navigation', status: 'needs-review', issues: ['Hardcoded COLORS object', 'Not using CSS variables'] },
  { name: 'Avatar (primitive)', category: 'Primitives', status: 'needs-review', issues: ['Status rings use green/amber instead of gold'] },
  { name: 'SpaceSwitcher', category: 'Navigation', status: 'needs-review', issues: ['Presence uses emerald instead of gold'] },
  { name: 'SpaceHub', category: 'Spaces', status: 'needs-review', issues: ['Uses hover:scale-110'] },
  { name: 'ReactionPicker', category: 'Chat', status: 'needs-review', issues: ['Uses hover:scale-110'] },
  { name: 'ReactionBadge', category: 'Chat', status: 'needs-review', issues: ['Uses hover:scale-105'] },

  // ============================================
  // 🔴 NOT STARTED — High Visibility (User sees daily)
  // ============================================
  { name: 'PostCard', category: 'Feed', status: 'not-started', issues: ['Flat bg, no glass', 'No warmth system'] },
  { name: 'TopBar', category: 'Navigation', status: 'not-started' },
  { name: 'TopNavBar', category: 'Navigation', status: 'not-started' },
  { name: 'SpaceHeader', category: 'Spaces', status: 'not-started' },
  { name: 'SpaceSidebar', category: 'Spaces', status: 'not-started' },
  { name: 'MemberList', category: 'Spaces', status: 'not-started', issues: ['Flat bg, no glass'] },
  { name: 'AttendeeList', category: 'Events', status: 'not-started', issues: ['Flat bg, no glass'] },
  { name: 'ChatComposer', category: 'Chat', status: 'not-started', issues: ['Flat bg, no glass'] },
  { name: 'ThreadDrawer', category: 'Chat', status: 'not-started' },
  { name: 'SearchInput', category: 'Input', status: 'not-started', notes: 'Token-compliant, needs UX review' },
  { name: 'OTPInput', category: 'Auth', status: 'not-started', notes: 'Has gold animation, needs UX review' },
  { name: 'NotificationBanner', category: 'Feedback', status: 'not-started' },

  // ============================================
  // 🔴 NOT STARTED — Cards & Content
  // ============================================
  { name: 'FileCard', category: 'Cards', status: 'not-started', issues: ['Flat bg, no glass'] },
  { name: 'StatCard', category: 'Cards', status: 'not-started', notes: 'Uses Card primitive' },
  { name: 'ModeCard', category: 'Cards', status: 'not-started' },
  { name: 'DockPreviewCard', category: 'Cards', status: 'not-started' },
  { name: 'ProfileConnectionsCard', category: 'Profile', status: 'not-started' },
  { name: 'ProfileSpacesCard', category: 'Profile', status: 'not-started' },
  { name: 'ProfileToolsCard', category: 'Profile', status: 'not-started' },
  { name: 'ProfileInterestsCard', category: 'Profile', status: 'not-started' },
  { name: 'ProfileHero', category: 'Profile', status: 'not-started' },
  { name: 'ProfileStatsRow', category: 'Profile', status: 'not-started' },
  { name: 'ProfileActivityHeatmap', category: 'Profile', status: 'not-started' },

  // ============================================
  // 🔴 NOT STARTED — Modals & Overlays
  // ============================================
  { name: 'Dialog', category: 'Overlays', status: 'not-started', notes: 'Wrapper for Modal' },
  { name: 'Sheet', category: 'Overlays', status: 'not-started' },
  { name: 'Drawer', category: 'Overlays', status: 'not-started' },
  { name: 'ConfirmDialog', category: 'Overlays', status: 'not-started' },
  { name: 'Popover', category: 'Overlays', status: 'not-started' },
  { name: 'MemberInviteModal', category: 'Modals', status: 'not-started' },
  { name: 'EventCreateModal', category: 'Modals', status: 'not-started' },
  { name: 'EventDetailsModal', category: 'Modals', status: 'not-started' },
  { name: 'SpaceWelcomeModal', category: 'Modals', status: 'not-started' },
  { name: 'SpaceLeaderOnboardingModal', category: 'Modals', status: 'not-started' },
  { name: 'ProfileToolModal', category: 'Modals', status: 'not-started' },
  { name: 'AddWidgetModal', category: 'Modals', status: 'not-started' },
  { name: 'AddTabModal', category: 'Modals', status: 'not-started' },

  // ============================================
  // 🔴 NOT STARTED — Forms & Inputs
  // ============================================
  { name: 'FormField', category: 'Forms', status: 'not-started' },
  { name: 'EmailInput', category: 'Forms', status: 'not-started' },
  { name: 'NumberInput', category: 'Forms', status: 'not-started' },
  { name: 'TagInput', category: 'Forms', status: 'not-started', issues: ['Flat bg, no glass'] },
  { name: 'DatePicker', category: 'Forms', status: 'not-started', issues: ['Flat bg, no glass'] },
  { name: 'ImageUploader', category: 'Forms', status: 'not-started' },
  { name: 'MentionAutocomplete', category: 'Forms', status: 'not-started' },
  { name: 'Combobox', category: 'Forms', status: 'not-started' },
  { name: 'RadioGroup', category: 'Forms', status: 'not-started' },
  { name: 'ToggleGroup', category: 'Forms', status: 'not-started' },
  { name: 'Slider', category: 'Forms', status: 'not-started' },

  // ============================================
  // 🔴 NOT STARTED — Feedback & State
  // ============================================
  { name: 'LoadingOverlay', category: 'Feedback', status: 'not-started', notes: 'Token-compliant, gold spinner' },
  { name: 'EmptyState', category: 'Feedback', status: 'not-started', notes: 'Uses primitives' },
  { name: 'ErrorState', category: 'Feedback', status: 'not-started' },
  { name: 'ProgressBar', category: 'Feedback', status: 'not-started' },
  { name: 'Stepper', category: 'Feedback', status: 'not-started' },
  { name: 'PresenceIndicator', category: 'Feedback', status: 'not-started' },
  { name: 'TypingDots', category: 'Feedback', status: 'not-started' },
  { name: 'AuthSuccessState', category: 'Auth', status: 'not-started' },
  { name: 'LeaderSetupProgress', category: 'Onboarding', status: 'not-started' },

  // ============================================
  // 🔴 NOT STARTED — Layout & Navigation
  // ============================================
  { name: 'Accordion', category: 'Layout', status: 'not-started' },
  { name: 'Collapsible', category: 'Layout', status: 'not-started' },
  { name: 'TabNav', category: 'Navigation', status: 'not-started' },
  { name: 'Pagination', category: 'Navigation', status: 'not-started' },
  { name: 'ScrollArea', category: 'Layout', status: 'not-started' },
  { name: 'Command', category: 'Navigation', status: 'not-started' },
  { name: 'CommandPalette', category: 'Navigation', status: 'not-started', notes: 'Legacy, may remove' },

  // ============================================
  // 🔴 NOT STARTED — Space-Specific
  // ============================================
  { name: 'SpaceEntryAnimation', category: 'Spaces', status: 'not-started' },
  { name: 'EventsMode', category: 'Spaces', status: 'not-started' },
  { name: 'MembersMode', category: 'Spaces', status: 'not-started' },
  { name: 'ToolsMode', category: 'Spaces', status: 'not-started' },
  { name: 'ModeTransition', category: 'Spaces', status: 'not-started' },
  { name: 'ContextPill', category: 'Spaces', status: 'not-started' },
  { name: 'ContextBanner', category: 'Spaces', status: 'not-started' },
  { name: 'IntentConfirmationInline', category: 'Spaces', status: 'not-started', issues: ['Flat bg, no glass'] },
  { name: 'TheaterChatBoard', category: 'Chat', status: 'not-started' },
  { name: 'PinnedMessagesWidget', category: 'Chat', status: 'not-started' },
  { name: 'MessageGroup', category: 'Chat', status: 'not-started' },
  { name: 'ChatRowMessage', category: 'Chat', status: 'not-started' },

  // ============================================
  // 🔴 NOT STARTED — Campus/Dock
  // ============================================
  { name: 'CampusDock', category: 'Campus', status: 'not-started' },
  { name: 'DockOrb', category: 'Campus', status: 'not-started' },
  { name: 'CampusDrawer', category: 'Campus', status: 'not-started' },
  { name: 'CampusProvider', category: 'Campus', status: 'not-started', notes: 'Context provider, may skip' },
  { name: 'MobileActionBar', category: 'Mobile', status: 'not-started' },
  { name: 'MobileDrawer', category: 'Mobile', status: 'not-started' },

  // ============================================
  // 🔴 NOT STARTED — Utilities (May skip some)
  // ============================================
  { name: 'Portal', category: 'Utility', status: 'not-started', notes: 'React portal, may skip' },
  { name: 'Slot', category: 'Utility', status: 'not-started', notes: 'Composition slot, may skip' },
  { name: 'VisuallyHidden', category: 'Utility', status: 'not-started', notes: 'A11y helper, may skip' },
  { name: 'SidebarPrimitives', category: 'Utility', status: 'not-started' },
  { name: 'AspectRatio', category: 'Utility', status: 'not-started' },
  { name: 'Callout', category: 'Feedback', status: 'not-started' },
  { name: 'Alert', category: 'Feedback', status: 'not-started', notes: 'LOCKED Jan 11, token-compliant' },
  { name: 'RSVPButton', category: 'Events', status: 'not-started', issues: ['Flat bg, no glass'] },
  { name: 'EventCalendar', category: 'Events', status: 'not-started' },
  { name: 'DataTable', category: 'Data', status: 'not-started', issues: ['Flat bg, no glass'] },
  { name: 'Dropdown', category: 'Navigation', status: 'not-started' },
];

// ============================================
// STATS CALCULATION
// ============================================

const stats = {
  total: PRE_LAB_COMPONENTS.length,
  approved: PRE_LAB_COMPONENTS.filter(c => c.status === 'approved').length,
  needsReview: PRE_LAB_COMPONENTS.filter(c => c.status === 'needs-review').length,
  notStarted: PRE_LAB_COMPONENTS.filter(c => c.status === 'not-started').length,
};

const categories = [...new Set(PRE_LAB_COMPONENTS.map(c => c.category))].sort();

// ============================================
// STATUS BADGE
// ============================================

function StatusBadge({ status }: { status: ComponentEntry['status'] }) {
  const config = {
    'approved': { bg: 'bg-green-500/20', text: 'text-green-400', label: 'APPROVED' },
    'needs-review': { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'NEEDS REVIEW' },
    'not-started': { bg: 'bg-red-500/20', text: 'text-red-400', label: 'NOT STARTED' },
  };
  const c = config[status];
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

// ============================================
// MAIN AUDIT VIEW
// ============================================

export const AuditDashboard: Story = {
  render: () => (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white mb-2">Pre-Lab Components Audit</h1>
        <p className="text-white/60 text-sm">
          Components that need to go through the Storybook lab to get the HIVE design approach.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="text-3xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-white/40">Total Components</div>
        </div>
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="text-3xl font-bold text-green-400">{stats.approved}</div>
          <div className="text-xs text-green-400/60">Approved</div>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="text-3xl font-bold text-amber-400">{stats.needsReview}</div>
          <div className="text-xs text-amber-400/60">Needs Review</div>
        </div>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="text-3xl font-bold text-red-400">{stats.notStarted}</div>
          <div className="text-xs text-red-400/60">Not Started</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-white/40">
          <span>Progress</span>
          <span>{Math.round((stats.approved / stats.total) * 100)}% complete</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden flex">
          <div
            className="h-full bg-green-500"
            style={{ width: `${(stats.approved / stats.total) * 100}%` }}
          />
          <div
            className="h-full bg-amber-500"
            style={{ width: `${(stats.needsReview / stats.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Component List by Category */}
      <div className="space-y-6">
        {categories.map(category => {
          const components = PRE_LAB_COMPONENTS.filter(c => c.category === category);
          return (
            <div key={category}>
              <h2 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">
                {category} ({components.length})
              </h2>
              <div className="space-y-1">
                {components.map(comp => (
                  <div
                    key={comp.name}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <StatusBadge status={comp.status} />
                    <span className="text-sm text-white font-medium flex-1">{comp.name}</span>
                    {comp.issues && comp.issues.length > 0 && (
                      <span className="text-xs text-red-400/80">
                        {comp.issues.length} issue{comp.issues.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {comp.notes && (
                      <span className="text-xs text-white/30 max-w-[200px] truncate">
                        {comp.notes}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <h3 className="text-xs font-medium text-white/60 mb-3 uppercase tracking-wider">How to Lab a Component</h3>
        <ol className="text-sm text-white/60 space-y-2">
          <li>1. Pick a component from 🔴 NOT STARTED</li>
          <li>2. Create <code className="px-1 py-0.5 rounded bg-white/[0.06] text-xs">[Component]Lab.stories.tsx</code> in experiments/</li>
          <li>3. Identify 2-4 independent variables (hover, density, warmth, etc.)</li>
          <li>4. Create 4-5 variations per variable</li>
          <li>5. Review with Jacob, lock decisions</li>
          <li>6. Update component, move to 🟢 APPROVED in this file</li>
        </ol>
      </div>
    </div>
  ),
};

// ============================================
// PRIORITY VIEW — High Visibility First
// ============================================

export const PriorityQueue: Story = {
  render: () => {
    const highVisibility = PRE_LAB_COMPONENTS.filter(c =>
      c.status !== 'approved' &&
      ['Feed', 'Navigation', 'Chat', 'Spaces', 'Core'].includes(c.category)
    );

    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-xl font-semibold text-white mb-2">Priority Queue</h1>
          <p className="text-white/60 text-sm">
            High-visibility components that users see daily. Start here.
          </p>
        </div>

        <div className="space-y-2">
          {highVisibility.map((comp, i) => (
            <div
              key={comp.name}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
            >
              <span className="text-xs text-white/30 w-6">#{i + 1}</span>
              <StatusBadge status={comp.status} />
              <span className="text-sm text-white font-medium flex-1">{comp.name}</span>
              <span className="text-xs text-white/40">{comp.category}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// ============================================
// ISSUES VIEW — Known Problems
// ============================================

export const KnownIssues: Story = {
  render: () => {
    const withIssues = PRE_LAB_COMPONENTS.filter(c => c.issues && c.issues.length > 0);

    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-xl font-semibold text-white mb-2">Known Issues</h1>
          <p className="text-white/60 text-sm">
            Components with identified problems that need fixing.
          </p>
        </div>

        <div className="space-y-3">
          {withIssues.map(comp => (
            <div
              key={comp.name}
              className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
            >
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge status={comp.status} />
                <span className="text-sm text-white font-medium">{comp.name}</span>
                <span className="text-xs text-white/40">{comp.category}</span>
              </div>
              <ul className="space-y-1 ml-4">
                {comp.issues?.map((issue, i) => (
                  <li key={i} className="text-xs text-red-400/80 flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  },
};
