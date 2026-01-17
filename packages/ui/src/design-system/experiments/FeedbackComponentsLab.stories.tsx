import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

// Import feedback components
import {
  Callout,
  SimpleCallout,
} from '../components/Callout';
import {
  EmptyState,
  SimpleEmptyState,
} from '../components/EmptyState';
import {
  ErrorState,
  SimpleErrorState,
} from '../components/ErrorState';
import { LoadingOverlay } from '../components/LoadingOverlay';
import {
  NotificationBanner,
  NotificationBannerDismissible,
} from '../components/NotificationBanner';
import {
  ProgressBar,
  LabeledProgress,
  SegmentedProgress,
} from '../components/ProgressBar';
import {
  Stepper,
  SimpleStepper,
} from '../components/Stepper';
import { Button } from '../primitives/Button';

const meta: Meta = {
  title: 'Experiments/Feedback Components Lab',
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// CALLOUT LAB
// ============================================

/**
 * EXPERIMENT: Callout Variants
 * Compare: note vs tip vs warning vs danger vs gold
 * Decisions: When to use each variant, gold discipline
 */
export const CalloutLab: Story = {
  render: () => (
    <div className="space-y-8 max-w-2xl">
      <div className="text-sm text-[var(--color-text-muted)] mb-4">
        <strong>CALLOUT VARIANTS</strong> - Compare visual weight and emotional tone
      </div>

      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">Note (Default - Blue)</div>
        <SimpleCallout
          variant="note"
          title="Note"
          description="Important information to keep in mind. Use for general tips and neutral messages."
        />
      </div>

      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">Tip (Green)</div>
        <SimpleCallout
          variant="tip"
          title="Pro Tip"
          description="A helpful suggestion or best practice. Use for positive guidance and recommendations."
        />
      </div>

      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">Warning (Amber)</div>
        <SimpleCallout
          variant="warning"
          title="Warning"
          description="Be careful about this potential issue. Use when action may have consequences."
        />
      </div>

      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">Danger (Red)</div>
        <SimpleCallout
          variant="danger"
          title="Danger"
          description="Critical information - do not ignore this. Use for irreversible actions or errors."
        />
      </div>

      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">Gold (Special - Use Sparingly)</div>
        <SimpleCallout
          variant="gold"
          title="Achievement Unlocked"
          description="Advanced insight for power users. Use ONLY for achievements, rewards, premium features."
        />
      </div>
    </div>
  ),
};

// ============================================
// EMPTY STATE LAB
// ============================================

/**
 * EXPERIMENT: Empty State Layouts
 * Compare: default (centered) vs compact vs inline
 * Decisions: Size variants, icon prominence, CTA placement
 */
export const EmptyStateLab: Story = {
  render: () => (
    <div className="space-y-12 max-w-3xl">
      <div className="text-sm text-[var(--color-text-muted)] mb-4">
        <strong>EMPTY STATE VARIANTS</strong> - When to use which layout
      </div>

      {/* Default - Centered */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Default (Centered) - Full page empty states
        </div>
        <div className="border border-[var(--color-border)] rounded-xl p-8 bg-[var(--color-bg-surface)]">
          <SimpleEmptyState
            variant="default"
            title="No spaces yet"
            description="Join a space or create your own to get started"
            actionLabel="Browse Spaces"
            onAction={() => {}}
          />
        </div>
      </div>

      {/* Compact - Horizontal */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Compact - Sidebar panels, smaller containers
        </div>
        <div className="border border-[var(--color-border)] rounded-xl p-6 bg-[var(--color-bg-surface)]">
          <SimpleEmptyState
            variant="compact"
            title="No messages"
            description="Start the conversation"
            actionLabel="Say Hello"
            onAction={() => {}}
          />
        </div>
      </div>

      {/* Inline - Minimal */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Inline - Lists, tables, minimal containers
        </div>
        <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg-surface)]">
          <SimpleEmptyState
            variant="inline"
            title="No results found"
          />
        </div>
      </div>

      {/* Size comparison */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Size Comparison (sm / default / lg)
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg-surface)]">
            <SimpleEmptyState
              size="sm"
              title="Small"
              description="For tight spaces"
            />
          </div>
          <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg-surface)]">
            <SimpleEmptyState
              size="default"
              title="Default"
              description="Standard usage"
            />
          </div>
          <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg-surface)]">
            <SimpleEmptyState
              size="lg"
              title="Large"
              description="Hero empty states"
            />
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// ERROR STATE LAB
// ============================================

/**
 * EXPERIMENT: Error State Severity
 * Compare: error vs warning vs info
 * Decisions: Icon treatment, color intensity, retry patterns
 */
export const ErrorStateLab: Story = {
  render: () => (
    <div className="space-y-12 max-w-3xl">
      <div className="text-sm text-[var(--color-text-muted)] mb-4">
        <strong>ERROR STATE SEVERITY</strong> - Matching severity to visual weight
      </div>

      {/* Severity comparison */}
      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">Error (Red)</div>
          <div className="border border-[var(--color-border)] rounded-xl p-6 bg-[var(--color-bg-surface)]">
            <SimpleErrorState
              severity="error"
              title="Failed to load"
              description="Something went wrong"
              onRetry={() => {}}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">Warning (Amber)</div>
          <div className="border border-[var(--color-border)] rounded-xl p-6 bg-[var(--color-bg-surface)]">
            <SimpleErrorState
              severity="warning"
              title="Connection unstable"
              description="Some features may be slow"
              onRetry={() => {}}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">Info (Blue)</div>
          <div className="border border-[var(--color-border)] rounded-xl p-6 bg-[var(--color-bg-surface)]">
            <SimpleErrorState
              severity="info"
              title="Offline mode"
              description="Working with cached data"
              onRetry={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Variant comparison */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Layout Variants
        </div>
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-muted)]">Full (page-level)</div>
          <div className="border border-[var(--color-border)] rounded-xl p-8 bg-[var(--color-bg-surface)]">
            <SimpleErrorState
              variant="full"
              title="Something went wrong"
              description="We couldn't load this content. Please try again."
              onRetry={() => {}}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-muted)]">Inline (component-level)</div>
          <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg-surface)]">
            <SimpleErrorState
              variant="inline"
              title="Failed to load messages"
              description="Connection timeout"
              onRetry={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// LOADING OVERLAY LAB
// ============================================

/**
 * EXPERIMENT: Loading States
 * Compare: fullscreen vs inline vs card
 * Decisions: Spinner style, blur effect, message positioning
 */
export const LoadingOverlayLab: Story = {
  render: () => (
    <div className="space-y-12 max-w-3xl">
      <div className="text-sm text-[var(--color-text-muted)] mb-4">
        <strong>LOADING VARIANTS</strong> - Context-appropriate loading states
      </div>

      {/* Variant comparison */}
      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">Inline</div>
          <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface)] h-48 relative">
            <LoadingOverlay
              variant="inline"
              message="Loading..."
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">Card</div>
          <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface)] h-48 relative">
            <LoadingOverlay
              variant="card"
              message="Fetching data..."
              subMessage="This may take a moment"
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">With Blur</div>
          <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface)] h-48 relative overflow-hidden">
            <div className="p-4 text-sm text-[var(--color-text-secondary)]">
              Content behind the overlay...
            </div>
            <div className="absolute inset-0">
              <LoadingOverlay
                variant="card"
                blur={true}
                message="Processing..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Size comparison */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Spinner Sizes
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface)] h-32 relative">
            <LoadingOverlay variant="inline" size="sm" />
            <div className="absolute bottom-2 left-2 text-xs text-[var(--color-text-tertiary)]">sm</div>
          </div>
          <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface)] h-32 relative">
            <LoadingOverlay variant="inline" size="default" />
            <div className="absolute bottom-2 left-2 text-xs text-[var(--color-text-tertiary)]">default</div>
          </div>
          <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface)] h-32 relative">
            <LoadingOverlay variant="inline" size="lg" />
            <div className="absolute bottom-2 left-2 text-xs text-[var(--color-text-tertiary)]">lg</div>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// NOTIFICATION BANNER LAB
// ============================================

/**
 * EXPERIMENT: Notification Banner Variants
 * Compare: info vs success vs warning vs error vs announcement
 * Decisions: Icon treatment, dismissibility, action placement
 */
export const NotificationBannerLab: Story = {
  render: () => {
    const [dismissed, setDismissed] = React.useState<string[]>([]);
    const isDismissed = (id: string) => dismissed.includes(id);
    const dismiss = (id: string) => setDismissed(prev => [...prev, id]);

    return (
      <div className="space-y-8 max-w-3xl">
        <div className="text-sm text-[var(--color-text-muted)] mb-4">
          <strong>NOTIFICATION BANNER VARIANTS</strong> - Semantic color coding
        </div>

        <div className="space-y-4">
          {!isDismissed('info') && (
            <NotificationBannerDismissible
              variant="info"
              message="New features are available! Check out what's new."
              onDismiss={() => dismiss('info')}
            />
          )}
          {!isDismissed('success') && (
            <NotificationBannerDismissible
              variant="success"
              message="Your changes have been saved successfully!"
              onDismiss={() => dismiss('success')}
            />
          )}
          {!isDismissed('warning') && (
            <NotificationBannerDismissible
              variant="warning"
              message="Your session will expire in 5 minutes."
              actionLabel="Extend"
              onAction={() => {}}
              onDismiss={() => dismiss('warning')}
            />
          )}
          {!isDismissed('error') && (
            <NotificationBannerDismissible
              variant="error"
              message="Connection lost. Some features may not work."
              actionLabel="Retry"
              onAction={() => {}}
              onDismiss={() => dismiss('error')}
            />
          )}
          {!isDismissed('announcement') && (
            <NotificationBannerDismissible
              variant="announcement"
              message="HIVE 2.0 is here! Discover the new features."
              actionLabel="Learn More"
              onAction={() => {}}
              onDismiss={() => dismiss('announcement')}
            />
          )}
        </div>

        {dismissed.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setDismissed([])}>
            Reset Banners
          </Button>
        )}

        {/* Size comparison */}
        <div className="space-y-4 mt-8">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Size Comparison
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Compact</div>
            <NotificationBanner
              variant="info"
              size="compact"
              message="Compact banner for subtle notifications"
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Default</div>
            <NotificationBanner
              variant="info"
              size="default"
              message="Default banner for standard notifications"
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Prominent</div>
            <NotificationBanner
              variant="info"
              size="prominent"
              message="Prominent banner for important announcements"
            />
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// PROGRESS BAR LAB
// ============================================

/**
 * EXPERIMENT: Progress Bar Variants
 * Compare: default vs gold vs success vs warning vs error
 * Decisions: When to use gold, indeterminate patterns
 */
export const ProgressBarLab: Story = {
  render: () => (
    <div className="space-y-12 max-w-2xl">
      <div className="text-sm text-[var(--color-text-muted)] mb-4">
        <strong>PROGRESS BAR VARIANTS</strong> - Color semantics for progress
      </div>

      {/* Variant comparison */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">Default (Muted)</div>
          <ProgressBar value={65} variant="default" />
        </div>
        <div className="space-y-2">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">Gold (Key Progress - Use Sparingly)</div>
          <ProgressBar value={65} variant="gold" />
        </div>
        <div className="space-y-2">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">Success (Completion)</div>
          <ProgressBar value={100} variant="success" />
        </div>
        <div className="space-y-2">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">Warning (Quota/Limit)</div>
          <ProgressBar value={85} variant="warning" />
        </div>
        <div className="space-y-2">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">Error (Over Limit)</div>
          <ProgressBar value={95} variant="error" />
        </div>
      </div>

      {/* Size comparison */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Size Comparison
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="text-xs text-[var(--color-text-muted)] w-16">xs (2px)</span>
            <div className="flex-1"><ProgressBar value={65} size="xs" /></div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[var(--color-text-muted)] w-16">sm (4px)</span>
            <div className="flex-1"><ProgressBar value={65} size="sm" /></div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[var(--color-text-muted)] w-16">default</span>
            <div className="flex-1"><ProgressBar value={65} size="default" /></div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[var(--color-text-muted)] w-16">lg (12px)</span>
            <div className="flex-1"><ProgressBar value={65} size="lg" /></div>
          </div>
        </div>
      </div>

      {/* Labeled progress */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Labeled Progress
        </div>
        <LabeledProgress
          value={65}
          label="Profile Completion"
          showPercentage
          variant="gold"
        />
      </div>

      {/* Indeterminate */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Indeterminate (Loading)
        </div>
        <ProgressBar indeterminate />
      </div>

      {/* Segmented */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Segmented (Steps)
        </div>
        <SegmentedProgress segments={4} completed={2} />
      </div>
    </div>
  ),
};

// ============================================
// STEPPER LAB
// ============================================

/**
 * EXPERIMENT: Stepper Variants
 * Compare: horizontal vs vertical, numbered vs dots
 * Decisions: Step state styling, connector treatment
 */
export const StepperLab: Story = {
  render: () => {
    const steps = [
      { label: 'Account', description: 'Create your account' },
      { label: 'Profile', description: 'Tell us about yourself' },
      { label: 'Interests', description: 'Choose your interests' },
      { label: 'Complete', description: 'All done!' },
    ];

    return (
      <div className="space-y-12 max-w-3xl">
        <div className="text-sm text-[var(--color-text-muted)] mb-4">
          <strong>STEPPER VARIANTS</strong> - Multi-step progress patterns
        </div>

        {/* Horizontal */}
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Horizontal (Default)
          </div>
          <div className="border border-[var(--color-border)] rounded-xl p-6 bg-[var(--color-bg-surface)]">
            <SimpleStepper
              steps={steps}
              currentStep={1}
              orientation="horizontal"
            />
          </div>
        </div>

        {/* Vertical */}
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Vertical (Detailed)
          </div>
          <div className="border border-[var(--color-border)] rounded-xl p-6 bg-[var(--color-bg-surface)]">
            <SimpleStepper
              steps={steps}
              currentStep={1}
              orientation="vertical"
            />
          </div>
        </div>

        {/* Step states side-by-side */}
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Step States Comparison
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <div className="text-xs text-[var(--color-text-muted)]">Completed</div>
              <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg-surface)]">
                <SimpleStepper steps={[{ label: 'Done' }]} currentStep={1} />
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-xs text-[var(--color-text-muted)]">Active</div>
              <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg-surface)]">
                <SimpleStepper steps={[{ label: 'Active' }]} currentStep={0} />
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-xs text-[var(--color-text-muted)]">Upcoming</div>
              <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg-surface)]">
                <SimpleStepper steps={[{ label: 'Step 1' }, { label: 'Next' }]} currentStep={0} />
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-xs text-[var(--color-text-muted)]">Error</div>
              <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg-surface)]">
                <Stepper currentStep={0}>
                  <Stepper.Item status="error" label="Error" />
                </Stepper>
              </div>
            </div>
          </div>
        </div>

        {/* Variant comparison */}
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Variant Styles
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="text-xs text-[var(--color-text-muted)]">Default (Numbered)</div>
              <SimpleStepper steps={steps.slice(0, 3)} currentStep={1} variant="default" />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-[var(--color-text-muted)]">Dots (Minimal)</div>
              <SimpleStepper steps={steps.slice(0, 3)} currentStep={1} variant="dots" />
            </div>
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// MASTER SHOWCASE
// ============================================

/**
 * MASTER SHOWCASE: All Feedback Components
 */
export const MasterShowcase: Story = {
  render: () => (
    <div className="space-y-16 max-w-3xl">
      <div className="text-lg font-medium text-white">
        Feedback Components - Complete Collection
      </div>

      {/* Callouts */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Callout</h3>
        <div className="space-y-3">
          <SimpleCallout variant="note" title="Note" description="General information" />
          <SimpleCallout variant="tip" title="Tip" description="Helpful suggestion" />
          <SimpleCallout variant="warning" title="Warning" description="Be careful" />
        </div>
      </section>

      {/* Empty States */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Empty State</h3>
        <div className="border border-[var(--color-border)] rounded-xl p-8 bg-[var(--color-bg-surface)]">
          <SimpleEmptyState
            title="No items yet"
            description="Create your first item to get started"
            actionLabel="Create Item"
            onAction={() => {}}
          />
        </div>
      </section>

      {/* Error States */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Error State</h3>
        <div className="border border-[var(--color-border)] rounded-xl p-6 bg-[var(--color-bg-surface)]">
          <SimpleErrorState
            title="Something went wrong"
            description="We couldn't load this content"
            onRetry={() => {}}
          />
        </div>
      </section>

      {/* Loading */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Loading Overlay</h3>
        <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface)] h-32 relative">
          <LoadingOverlay variant="inline" message="Loading..." />
        </div>
      </section>

      {/* Notification Banners */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Notification Banner</h3>
        <NotificationBanner variant="info" message="New features available" />
        <NotificationBanner variant="announcement" message="HIVE 2.0 is here!" />
      </section>

      {/* Progress */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Progress Bar</h3>
        <LabeledProgress value={75} label="Profile Completion" showPercentage variant="gold" />
      </section>

      {/* Stepper */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Stepper</h3>
        <SimpleStepper
          steps={[
            { label: 'Account' },
            { label: 'Profile' },
            { label: 'Interests' },
            { label: 'Complete' },
          ]}
          currentStep={2}
        />
      </section>
    </div>
  ),
};
