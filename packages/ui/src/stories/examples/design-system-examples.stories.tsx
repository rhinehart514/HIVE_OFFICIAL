/**
 * Design System Examples
 *
 * This story demonstrates the complete HIVE design system:
 * - Semantic token usage
 * - Cognitive budget enforcement
 * - Type-safe component patterns
 * - Accessibility best practices
 */

import type { Meta, StoryObj } from '@storybook/react';
import { StatusIndicator } from '../../design-system/components/PresenceIndicator';
// TODO: These example components were removed when atomic/ was deleted.
// Need to recreate UserPresence and SpacePins examples in design-system/components/
// import { UserPresence } from '../../atomic/00-Global/examples/example-user-presence';
// import { SpacePins } from '../../atomic/00-Global/examples/example-space-pins';
// import type { Pin } from '../../atomic/00-Global/examples/example-space-pins';

const meta: Meta = {
  title: 'Design System/Examples',
  parameters: {
    docs: {
      description: {
        component: 'Complete examples demonstrating HIVE design system patterns and cognitive budget enforcement.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

/**
 * Example 1: StatusIndicator Atom
 * Demonstrates semantic token usage in atoms
 */
export const StatusIndicatorExample: StoryObj<typeof StatusIndicator> = {
  render: () => (
    <div className="space-y-6 p-6 bg-background-primary rounded-lg">
      <div>
        <h3 className="text-text-primary font-semibold mb-4">Status Indicator (Atom)</h3>
        <p className="text-text-secondary text-sm mb-4">
          Uses semantic status tokens: status-success-default, status-warning-default
        </p>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <StatusIndicator status="online" size="sm" />
            <span className="text-text-muted text-xs">Online (sm)</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <StatusIndicator status="online" size="md" />
            <span className="text-text-muted text-xs">Online (md)</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <StatusIndicator status="online" size="lg" />
            <span className="text-text-muted text-xs">Online (lg)</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <StatusIndicator status="online" size="md" pulse />
            <span className="text-text-muted text-xs">Online (pulse)</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <StatusIndicator status="away" size="md" />
            <span className="text-text-muted text-xs">Away</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <StatusIndicator status="offline" size="md" />
            <span className="text-text-muted text-xs">Offline</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border-default pt-4">
        <div className="text-xs text-text-muted">
          <p><strong>Tokens used:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>bg-status-success-default (online)</li>
            <li>bg-status-warning-default (away)</li>
            <li>bg-border-muted (offline)</li>
            <li>border-status-*-default/20 (border with opacity)</li>
          </ul>
        </div>
      </div>
    </div>
  ),
};

/**
 * Example 2: UserPresence Molecule
 * Demonstrates composition and semantic token usage
 *
 * TODO: Re-enable after recreating UserPresence component
 */
export const UserPresenceMoleculeExample: StoryObj<any> = {
  render: () => (
    <div className="space-y-6 p-6 bg-background-primary rounded-lg">
      <div className="p-8 bg-background-secondary rounded-lg border-2 border-dashed border-border-default">
        <p className="text-text-secondary text-center">
          UserPresence component example temporarily disabled.
          <br />
          Component needs to be recreated in design-system/components/
        </p>
      </div>
    </div>
  ),
};

/**
 * Example 3: Cognitive Budget Enforcement
 * Demonstrates type-safe budget enforcement with useCognitiveBudget
 *
 * TODO: Re-enable after recreating SpacePins component
 */
export const CognitiveBudgetExample: StoryObj<any> = {
  render: () => (
    <div className="space-y-6 p-6 bg-background-primary rounded-lg">
      <div className="p-8 bg-background-secondary rounded-lg border-2 border-dashed border-border-default">
        <p className="text-text-secondary text-center">
          SpacePins component example temporarily disabled.
          <br />
          Component needs to be recreated in design-system/components/
        </p>
      </div>
    </div>
  ),
};

/**
 * Example 4: Complete System Integration
 * Shows all patterns working together
 */
export const CompleteSystemExample: StoryObj = {
  render: () => (
    <div className="space-y-8 p-6 bg-background-primary rounded-lg max-w-4xl">
      <div className="space-y-3">
        <h2 className="text-text-primary text-2xl font-bold">HIVE Design System</h2>
        <p className="text-text-secondary">
          Complete example showing all design system patterns in one place.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Section 1: Atoms */}
        <div className="rounded-lg bg-background-secondary p-6 border border-border-default">
          <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">
              1
            </span>
            Atoms (Semantic Tokens)
          </h3>
          <div className="flex items-center gap-4">
            <StatusIndicator status="online" pulse />
            <StatusIndicator status="away" />
            <StatusIndicator status="offline" />
          </div>
        </div>

        {/* Section 2: Molecules */}
        <div className="rounded-lg bg-background-secondary p-6 border border-border-default">
          <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">
              2
            </span>
            Molecules (Composition + Semantic Tokens)
          </h3>
          <div className="p-4 bg-background-tertiary rounded border border-dashed border-border-default text-center text-text-secondary text-sm">
            TODO: Recreate UserPresence component
          </div>
        </div>

        {/* Section 3: Cognitive Budgets */}
        <div className="rounded-lg bg-background-secondary p-6 border border-border-default">
          <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">
              3
            </span>
            Cognitive Budget Enforcement (Type-Safe UX)
          </h3>
          <div className="p-4 bg-background-tertiary rounded border border-dashed border-border-default text-center text-text-secondary text-sm">
            TODO: Recreate SpacePins component
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="border-t border-border-default pt-6">
        <h4 className="text-text-primary font-semibold mb-3">Design System Principles</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="text-text-secondary">
              <strong className="text-text-primary">Token Usage:</strong> All colors use semantic tokens (bg-background-*, text-text-*, border-border-*)
            </p>
            <p className="text-text-secondary">
              <strong className="text-text-primary">Type Safety:</strong> Strict TypeScript interfaces with generic constraints
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-text-secondary">
              <strong className="text-text-primary">Composition:</strong> Atoms → Molecules → Organisms
            </p>
            <p className="text-text-secondary">
              <strong className="text-text-primary">UX Constraints:</strong> Programmatic budget enforcement via hooks
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
};
