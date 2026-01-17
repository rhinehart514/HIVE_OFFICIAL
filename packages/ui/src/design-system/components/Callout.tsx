'use client';

/**
 * Callout Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Highlighted content blocks for emphasis.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * BASIC CALLOUT:
 * ┌────────────────────────────────────────────────────────────────┐
 * │ │  📝 Note                                                     │
 * │ │  This is important information that deserves attention.      │
 * │ │                                                              │
 * │ │  It can contain multiple paragraphs of content if needed.    │
 * └─┴──────────────────────────────────────────────────────────────┘
 *   │
 *   └── Left accent bar (color based on variant)
 *
 * CALLOUT VARIANTS:
 *
 * Note (default - blue):
 * ┌────────────────────────────────────────────────────────────────┐
 * │▐  📝 Note                                                      │
 * │▐  Important information to keep in mind.                       │
 * └────────────────────────────────────────────────────────────────┘
 *   Blue accent
 *
 * Tip (green):
 * ┌────────────────────────────────────────────────────────────────┐
 * │▐  💡 Tip                                                       │
 * │▐  A helpful suggestion or best practice.                       │
 * └────────────────────────────────────────────────────────────────┘
 *   Green accent
 *
 * Warning (amber):
 * ┌────────────────────────────────────────────────────────────────┐
 * │▐  ⚠️ Warning                                                   │
 * │▐  Be careful about this potential issue.                       │
 * └────────────────────────────────────────────────────────────────┘
 *   Amber accent
 *
 * Danger (red):
 * ┌────────────────────────────────────────────────────────────────┐
 * │▐  🚨 Danger                                                    │
 * │▐  Critical information - do not ignore this.                   │
 * └────────────────────────────────────────────────────────────────┘
 *   Red accent
 *
 * Gold (special):
 * ┌────────────────────────────────────────────────────────────────┐
 * │▐  ⭐ Pro Tip                                                   │
 * │▐  Advanced insight for power users.                            │
 * └────────────────────────────────────────────────────────────────┘
 *   Gold accent (use sparingly for special emphasis)
 *
 * WITH CUSTOM ICON:
 * ┌────────────────────────────────────────────────────────────────┐
 * │▐  🔧  Configuration                                            │
 * │▐      Set these environment variables...                       │
 * └────────────────────────────────────────────────────────────────┘
 *
 * WITHOUT TITLE:
 * ┌────────────────────────────────────────────────────────────────┐
 * │▐  Remember to save your changes before leaving this page.      │
 * └────────────────────────────────────────────────────────────────┘
 *
 * COLLAPSIBLE CALLOUT:
 * ┌────────────────────────────────────────────────────────────────┐
 * │▐  📝 Show Details                                          ▼   │
 * └────────────────────────────────────────────────────────────────┘
 * (Expanded)
 * ┌────────────────────────────────────────────────────────────────┐
 * │▐  📝 Show Details                                          ▲   │
 * │▐  ─────────────────────────────────────────────────────────    │
 * │▐  Hidden content is now visible here...                        │
 * └────────────────────────────────────────────────────────────────┘
 *
 * COLORS:
 * - Note: #4A9EFF (blue)
 * - Tip: #22C55E (green)
 * - Warning: #FFA500 (amber)
 * - Danger: #FF6B6B (red)
 * - Gold: #FFD700 (gold)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const calloutVariants = cva(
  'relative rounded-xl p-4 pl-6 border border-l-4',
  {
    variants: {
      variant: {
        note: 'bg-blue-500/10 border-blue-500/20 border-l-blue-500',
        tip: 'bg-green-500/10 border-green-500/20 border-l-green-500',
        warning: 'bg-amber-500/10 border-amber-500/20 border-l-amber-500',
        danger: 'bg-red-500/10 border-red-500/20 border-l-red-500',
        gold: 'bg-life-gold/10 border-life-gold/20 border-l-life-gold',
      },
    },
    defaultVariants: {
      variant: 'note',
    },
  }
);

const iconColors = {
  note: 'text-blue-500',
  tip: 'text-green-500',
  warning: 'text-amber-500',
  danger: 'text-red-500',
  gold: 'text-life-gold',
};

const defaultIcons = {
  note: '📝',
  tip: '💡',
  warning: '⚠️',
  danger: '🚨',
  gold: '⭐',
};

const defaultTitles = {
  note: 'Note',
  tip: 'Tip',
  warning: 'Warning',
  danger: 'Danger',
  gold: 'Pro Tip',
};

export interface CalloutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof calloutVariants> {
  /** Callout title */
  title?: string;
  /** Custom icon or emoji */
  icon?: React.ReactNode;
  /** Hide icon */
  hideIcon?: boolean;
  /** Hide title */
  hideTitle?: boolean;
}

/**
 * Callout - Highlighted content block
 */
const Callout = React.forwardRef<HTMLDivElement, CalloutProps>(
  (
    {
      className,
      variant = 'note',
      title,
      icon,
      hideIcon = false,
      hideTitle = false,
      children,
      ...props
    },
    ref
  ) => {
    const displayTitle = title || defaultTitles[variant || 'note'];
    const displayIcon = icon || defaultIcons[variant || 'note'];

    return (
      <div
        ref={ref}
        className={cn(calloutVariants({ variant }), className)}
        {...props}
      >
        {(!hideIcon || !hideTitle) && (
          <div className="flex items-center gap-2 mb-2">
            {!hideIcon && (
              <span className={cn('text-base', iconColors[variant || 'note'])}>
                {displayIcon}
              </span>
            )}
            {!hideTitle && (
              <span className="text-sm font-medium text-white">{displayTitle}</span>
            )}
          </div>
        )}
        <div className="text-sm text-[var(--color-text-muted)]">{children}</div>
      </div>
    );
  }
);
Callout.displayName = 'Callout';

/**
 * CollapsibleCallout - Expandable callout
 */
export interface CollapsibleCalloutProps extends CalloutProps {
  /** Default expanded state */
  defaultExpanded?: boolean;
}

const CollapsibleCallout = React.forwardRef<HTMLDivElement, CollapsibleCalloutProps>(
  (
    {
      className,
      variant = 'note',
      title,
      icon,
      hideIcon = false,
      defaultExpanded = false,
      children,
      ...props
    },
    ref
  ) => {
    const [expanded, setExpanded] = React.useState(defaultExpanded);
    const displayTitle = title || defaultTitles[variant || 'note'];
    const displayIcon = icon || defaultIcons[variant || 'note'];

    return (
      <div
        ref={ref}
        className={cn(calloutVariants({ variant }), className)}
        {...props}
      >
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            {!hideIcon && (
              <span className={cn('text-base', iconColors[variant || 'note'])}>
                {displayIcon}
              </span>
            )}
            <span className="text-sm font-medium text-white">{displayTitle}</span>
          </div>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className={cn(
              'w-4 h-4 text-[var(--color-text-muted)] transition-transform',
              expanded && 'rotate-180'
            )}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {expanded && (
          <div className="mt-3 pt-3 border-t border-current/20">
            <div className="text-sm text-[var(--color-text-muted)]">{children}</div>
          </div>
        )}
      </div>
    );
  }
);
CollapsibleCallout.displayName = 'CollapsibleCallout';

/**
 * QuoteCallout - Blockquote-style callout
 */
export interface QuoteCalloutProps extends React.HTMLAttributes<HTMLQuoteElement> {
  /** Quote author */
  author?: string;
  /** Author title/role */
  authorTitle?: string;
}

const QuoteCallout = React.forwardRef<HTMLQuoteElement, QuoteCalloutProps>(
  ({ className, author, authorTitle, children, ...props }, ref) => (
    <blockquote
      ref={ref}
      className={cn(
        'relative rounded-xl p-4 pl-6 border border-l-4',
        'bg-[var(--color-bg-elevated)] border-[var(--color-border)] border-l-[var(--color-text-muted)]',
        className
      )}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="absolute top-4 right-4 w-8 h-8 text-white/10"
      >
        <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
      </svg>
      <div className="text-sm text-white italic">{children}</div>
      {(author || authorTitle) && (
        <footer className="mt-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-bg-hover)]" />
          <div>
            {author && <div className="text-sm font-medium text-white">{author}</div>}
            {authorTitle && (
              <div className="text-xs text-[var(--color-text-muted)]">{authorTitle}</div>
            )}
          </div>
        </footer>
      )}
    </blockquote>
  )
);
QuoteCallout.displayName = 'QuoteCallout';

export { Callout, CollapsibleCallout, QuoteCallout, calloutVariants };
