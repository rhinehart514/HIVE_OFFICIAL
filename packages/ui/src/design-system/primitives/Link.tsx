'use client';

/**
 * Link Primitive
 * LOCKED: January 2026
 *
 * Decisions:
 * - Underline: Slide-in animation (400ms, left-to-right)
 * - Hover: Opacity fade to 60%
 * - External: Minimal diagonal arrow (↗)
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const linkVariants = cva(
  [
    'relative inline-block',
    'text-[var(--color-text-primary)]',
    'no-underline',
    'transition-opacity duration-[var(--duration-snap)] ease-[var(--easing-default)]',
    'hover:opacity-60',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-page)]',
  ].join(' '),
  {
    variants: {
      variant: {
        default: '',
        subtle: 'text-[var(--color-text-secondary)]',
        muted: 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:opacity-100',
      },
      size: {
        inherit: '',
        sm: 'text-[var(--font-size-body-sm)]',
        xs: 'text-[var(--font-size-body-xs)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'inherit',
    },
  }
);

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof linkVariants> {
  /** Open in new tab with security attributes */
  external?: boolean;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, variant, size, external, children, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);

    const externalProps = external
      ? {
          target: '_blank',
          rel: 'noopener noreferrer',
        }
      : {};

    return (
      <a
        ref={ref}
        className={cn(linkVariants({ variant, size }), className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...externalProps}
        {...props}
      >
        <span className="relative">
          {children}
          {external && (
            <svg
              className="inline-block ml-0.5 w-2.5 h-2.5 -mt-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 17L17 7M17 7H7M17 7v10"
              />
            </svg>
          )}
          {/* Slide-in underline */}
          <span
            className="absolute left-0 bottom-0 h-px bg-current opacity-50"
            style={{
              width: isHovered ? '100%' : '0%',
              transition: 'width 400ms ease-out',
            }}
            aria-hidden
          />
        </span>
      </a>
    );
  }
);

Link.displayName = 'Link';

export { Link, linkVariants };
