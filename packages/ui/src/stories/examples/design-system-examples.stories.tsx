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
import { StatusIndicator } from '../../atomic/00-Global/examples/example-status-indicator';
import { UserPresence } from '../../atomic/00-Global/examples/example-user-presence';
import { SpacePins } from '../../atomic/00-Global/examples/example-space-pins';
import type { Pin } from '../../atomic/00-Global/examples/example-space-pins';

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
 */
export const UserPresenceMoleculeExample: StoryObj<typeof UserPresence> = {
  render: () => (
    <div className="space-y-6 p-6 bg-background-primary rounded-lg">
      <div>
        <h3 className="text-text-primary font-semibold mb-4">User Presence (Molecule)</h3>
        <p className="text-text-secondary text-sm mb-4">
          Composes StatusIndicator atom + uses semantic tokens for text and backgrounds
        </p>

        <div className="space-y-4">
          <UserPresence
            user={{ name: "Sarah Chen", handle: "sarahc", avatarUrl: undefined }}
            status="online"
            size="sm"
          />

          <UserPresence
            user={{ name: "Alex Rodriguez", handle: "alexr", avatarUrl: undefined }}
            status="online"
            size="md"
            showHandle
          />

          <UserPresence
            user={{ name: "Jamie Kim", handle: "jamiek", avatarUrl: undefined }}
            status="away"
            size="lg"
            showHandle
          />
        </div>
      </div>

      <div className="border-t border-border-default pt-4">
        <div className="text-xs text-text-muted">
          <p><strong>Tokens used:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>bg-background-secondary (avatar fallback)</li>
            <li>border-border-default (avatar border)</li>
            <li>text-text-primary (user name)</li>
            <li>text-text-secondary (user handle)</li>
            <li>bg-background-tertiary (avatar initials)</li>
          </ul>
          <p className="mt-2"><strong>Composition:</strong> StatusIndicator + Avatar + Text</p>
        </div>
      </div>
    </div>
  ),
};

/**
 * Example 3: Cognitive Budget Enforcement
 * Demonstrates type-safe budget enforcement with useCognitiveBudget
 */
export const CognitiveBudgetExample: StoryObj<typeof SpacePins> = {
  render: () => {
    const mockPins: Pin[] = [
      {
        id: '1',
        title: 'Welcome to CS Club!',
        description: 'Join us for our first meeting of the semester. Pizza and coding!',
        createdAt: new Date(),
        isPinned: true,
      },
      {
        id: '2',
        title: 'Hackathon This Weekend',
        description: '24-hour hackathon at the Innovation Center. Register now!',
        createdAt: new Date(),
        isPinned: true,
      },
      {
        id: '3',
        title: 'Interview Prep Workshop',
        description: 'Learn how to ace technical interviews with FAANG engineers.',
        createdAt: new Date(),
        isPinned: true,
      },
    ];

    return (
      <div className="space-y-6 p-6 bg-background-primary rounded-lg">
        <div>
          <h3 className="text-text-primary font-semibold mb-4">Cognitive Budget Enforcement</h3>
          <p className="text-text-secondary text-sm mb-4">
            maxPins: 2 (enforced with useCognitiveBudget hook)
          </p>

          <SpacePins
            pins={mockPins}
            onUnpin={(id) => console.log('Unpin:', id)}
            showBudgetWarning
          />
        </div>

        <div className="border-t border-border-default pt-4">
          <div className="text-xs text-text-muted space-y-2">
            <p><strong>Cognitive Budget Pattern:</strong></p>
            <pre className="bg-background-secondary p-3 rounded text-[10px] overflow-x-auto">
{`const maxPins = useCognitiveBudget('spaceBoard', 'maxPins'); // 2
const { isWithinBudget, limit, overflow } = useIsBudgetExceeded(
  'spaceBoard',
  'maxPins',
  pins
);
const visiblePins = pins.slice(0, maxPins);`}
            </pre>
            <p className="mt-2"><strong>Budget: </strong>2/2 pins shown, 1 hidden (over budget)</p>
            <p><strong>Warning shown:</strong> Yes (3 pins provided, budget is 2)</p>
          </div>
        </div>
      </div>
    );
  },
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
          <div className="space-y-3">
            <UserPresence
              user={{ name: "Sarah Chen", handle: "sarahc" }}
              status="online"
              showHandle
            />
            <UserPresence
              user={{ name: "Alex Rodriguez", handle: "alexr" }}
              status="away"
              showHandle
            />
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
          <SpacePins
            pins={[
              {
                id: '1',
                title: 'Pin 1',
                description: 'First pinned post',
                createdAt: new Date(),
                isPinned: true,
              },
              {
                id: '2',
                title: 'Pin 2',
                description: 'Second pinned post',
                createdAt: new Date(),
                isPinned: true,
              },
              {
                id: '3',
                title: 'Pin 3 (Hidden)',
                description: 'Over budget',
                createdAt: new Date(),
                isPinned: true,
              },
            ]}
          />
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
