'use client';

/**
 * SplitView Pattern
 * Source: docs/design-system/COMPONENTS.md
 *
 * Split pane layouts for master-detail views, sidebars, and panels.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * HORIZONTAL SPLIT (default):
 * ┌───────────────────────────────────────────────────────────┐
 * │ ┌─────────────────┐ ┌──────────────────────────────────┐ │
 * │ │                 │ │                                  │ │
 * │ │    Primary      │ │           Secondary              │ │
 * │ │     Panel       │ │             Panel                │ │
 * │ │   (Sidebar)     │ │            (Main)                │ │
 * │ │                 │ │                                  │ │
 * │ │                 │ │                                  │ │
 * │ └─────────────────┘ └──────────────────────────────────┘ │
 * └───────────────────────────────────────────────────────────┘
 *
 * VERTICAL SPLIT:
 * ┌───────────────────────────────────────────────────────────┐
 * │ ┌───────────────────────────────────────────────────────┐ │
 * │ │              Primary Panel (Top)                      │ │
 * │ └───────────────────────────────────────────────────────┘ │
 * │ ┌───────────────────────────────────────────────────────┐ │
 * │ │              Secondary Panel (Bottom)                 │ │
 * │ └───────────────────────────────────────────────────────┘ │
 * └───────────────────────────────────────────────────────────┘
 *
 * MASTER-DETAIL:
 * ┌───────────────────────────────────────────────────────────┐
 * │ ┌──────────┐ ┌─────────────────────────────────────────┐ │
 * │ │ List     │ │                                         │ │
 * │ │ ┌──────┐ │ │              Detail View                │ │
 * │ │ │ Item │◄│ │                                         │ │
 * │ │ ├──────┤ │ │   Shows selected item details           │ │
 * │ │ │ Item │ │ │                                         │ │
 * │ │ ├──────┤ │ │                                         │ │
 * │ │ │ Item │ │ │                                         │ │
 * │ │ └──────┘ │ │                                         │ │
 * │ └──────────┘ └─────────────────────────────────────────┘ │
 * └───────────────────────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

// ============================================
// SPLIT VIEW VARIANTS
// ============================================

const splitViewVariants = cva('w-full h-full', {
  variants: {
    direction: {
      horizontal: 'flex flex-row',
      vertical: 'flex flex-col',
    },
    ratio: {
      '1/3': '',
      '1/2': '',
      '2/3': '',
      '1/4': '',
      '3/4': '',
      custom: '',
    },
  },
  defaultVariants: {
    direction: 'horizontal',
    ratio: '1/3',
  },
});

const splitPanelVariants = cva('overflow-auto', {
  variants: {
    type: {
      primary: 'flex-shrink-0',
      secondary: 'flex-1 min-w-0 min-h-0',
    },
    bordered: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    {
      type: 'primary',
      bordered: true,
      className: 'border-r border-[var(--border-subtle)]',
    },
    {
      type: 'secondary',
      bordered: true,
      className: 'border-l border-[var(--border-subtle)]',
    },
  ],
  defaultVariants: {
    type: 'primary',
    bordered: true,
  },
});

// ============================================
// TYPES
// ============================================

export type SplitRatio = '1/4' | '1/3' | '1/2' | '2/3' | '3/4' | 'custom';

export interface SplitViewProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof splitViewVariants> {
  /** Primary panel width/height (for custom ratio) */
  primarySize?: string | number;
  /** Whether primary panel is collapsible */
  collapsible?: boolean;
  /** Collapsed state (controlled) */
  collapsed?: boolean;
  /** Collapse toggle callback */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Min size of primary panel when resizable */
  minPrimarySize?: number;
  /** Max size of primary panel when resizable */
  maxPrimarySize?: number;
  /** Show border between panels */
  bordered?: boolean;
  /** Responsive: collapse on mobile */
  responsiveCollapse?: boolean;
}

export interface SplitPanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof splitPanelVariants> {
  /** Panel header content */
  header?: React.ReactNode;
  /** Panel footer content */
  footer?: React.ReactNode;
  /** Padding preset */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// ============================================
// CONTEXT
// ============================================

interface SplitViewContextValue {
  direction: 'horizontal' | 'vertical';
  collapsed: boolean;
  bordered: boolean;
}

const SplitViewContext = React.createContext<SplitViewContextValue>({
  direction: 'horizontal',
  collapsed: false,
  bordered: true,
});

const useSplitView = () => React.useContext(SplitViewContext);

// ============================================
// HELPER FUNCTIONS
// ============================================

function getRatioSize(ratio: SplitRatio, direction: 'horizontal' | 'vertical'): string {
  const sizeMap: Record<SplitRatio, string> = {
    '1/4': '25%',
    '1/3': '33.333%',
    '1/2': '50%',
    '2/3': '66.666%',
    '3/4': '75%',
    custom: 'auto',
  };
  return sizeMap[ratio];
}

// ============================================
// COMPONENTS
// ============================================

/**
 * SplitView - Container for split pane layout
 */
const SplitView = React.forwardRef<HTMLDivElement, SplitViewProps>(
  (
    {
      className,
      direction = 'horizontal',
      ratio = '1/3',
      primarySize,
      collapsible = false,
      collapsed: controlledCollapsed,
      onCollapsedChange,
      bordered = true,
      responsiveCollapse = false,
      children,
      ...props
    },
    ref
  ) => {
    const [internalCollapsed, setInternalCollapsed] = React.useState(false);
    const collapsed = controlledCollapsed ?? internalCollapsed;

    const handleCollapsedChange = (newCollapsed: boolean) => {
      setInternalCollapsed(newCollapsed);
      onCollapsedChange?.(newCollapsed);
    };

    return (
      <SplitViewContext.Provider
        value={{ direction: direction ?? 'horizontal', collapsed, bordered }}
      >
        <div
          ref={ref}
          className={cn(
            splitViewVariants({ direction }),
            responsiveCollapse && 'flex-col lg:flex-row',
            className
          )}
          {...props}
        >
          {React.Children.map(children, (child, index) => {
            if (!React.isValidElement(child)) return child;

            // Type the child element properly
            const childElement = child as React.ReactElement<SplitPanelProps>;
            const childProps = childElement.props as SplitPanelProps;

            // Pass ratio/size to primary panel
            if (index === 0 && (child.type as React.FC)?.displayName === 'SplitPanel') {
              const size = primarySize ?? getRatioSize(ratio ?? '1/3', direction ?? 'horizontal');
              const sizeStyle =
                direction === 'horizontal'
                  ? { width: collapsed ? 0 : size }
                  : { height: collapsed ? 0 : size };

              return React.cloneElement(childElement, {
                ...childProps,
                style: { ...(childProps.style ?? {}), ...sizeStyle },
                type: 'primary',
              });
            }

            // Secondary panel
            if (index === 1 && (child.type as React.FC)?.displayName === 'SplitPanel') {
              return React.cloneElement(childElement, {
                ...childProps,
                type: 'secondary',
              });
            }

            return child;
          })}

          {collapsible && (
            <SplitToggle
              collapsed={collapsed}
              onToggle={() => handleCollapsedChange(!collapsed)}
              direction={direction ?? 'horizontal'}
            />
          )}
        </div>
      </SplitViewContext.Provider>
    );
  }
);
SplitView.displayName = 'SplitView';

/**
 * SplitPanel - Individual panel within SplitView
 */
const SplitPanel = React.forwardRef<HTMLDivElement, SplitPanelProps>(
  (
    {
      className,
      type = 'primary',
      header,
      footer,
      padding = 'none',
      children,
      // Omit event handlers that conflict with framer-motion
      onAnimationStart: _onAnimationStart,
      onAnimationEnd: _onAnimationEnd,
      onDrag: _onDrag,
      onDragEnd: _onDragEnd,
      onDragStart: _onDragStart,
      ...props
    },
    ref
  ) => {
    const { collapsed, bordered } = useSplitView();

    const paddingClasses = {
      none: '',
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6',
    };

    const isPrimary = type === 'primary';

    return (
      <AnimatePresence mode="wait">
        <motion.div
          ref={ref}
          className={cn(
            splitPanelVariants({ type, bordered }),
            'flex flex-col',
            isPrimary && collapsed && 'overflow-hidden',
            className
          )}
          initial={false}
          animate={{
            opacity: isPrimary && collapsed ? 0 : 1,
          }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          {...props}
        >
          {header && (
            <div className="flex-shrink-0 border-b border-[var(--border-subtle)] px-4 py-3">
              {header}
            </div>
          )}
          <div className={cn('flex-1 overflow-auto', paddingClasses[padding])}>
            {children}
          </div>
          {footer && (
            <div className="flex-shrink-0 border-t border-[var(--border-subtle)] px-4 py-3">
              {footer}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }
);
SplitPanel.displayName = 'SplitPanel';

/**
 * SplitToggle - Button to collapse/expand the primary panel
 */
interface SplitToggleProps {
  collapsed: boolean;
  onToggle: () => void;
  direction: 'horizontal' | 'vertical';
}

const SplitToggle: React.FC<SplitToggleProps> = ({
  collapsed,
  onToggle,
  direction,
}) => {
  const isHorizontal = direction === 'horizontal';

  return (
    <button
      onClick={onToggle}
      className={cn(
        'absolute z-10 flex items-center justify-center',
        'w-6 h-6 rounded-full bg-[var(--bg-elevated)]',
        'border border-[var(--border-default)]',
        'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-white/50',
        isHorizontal
          ? 'top-1/2 -translate-y-1/2 left-0 -translate-x-1/2'
          : 'left-1/2 -translate-x-1/2 top-0 -translate-y-1/2'
      )}
      aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        className={cn(
          'transition-transform duration-200',
          collapsed && (isHorizontal ? 'rotate-180' : 'rotate-180')
        )}
      >
        <path
          d={
            isHorizontal
              ? 'M8 2L4 6L8 10'
              : 'M2 8L6 4L10 8'
          }
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

/**
 * SplitHandle - Draggable resize handle between panels
 * (For future resizable implementation)
 */
interface SplitHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical';
}

const SplitHandle = React.forwardRef<HTMLDivElement, SplitHandleProps>(
  ({ className, direction = 'horizontal', ...props }, ref) => {
    const isHorizontal = direction === 'horizontal';

    return (
      <div
        ref={ref}
        className={cn(
          'flex-shrink-0 bg-[var(--border-subtle)]',
          'hover:bg-[var(--border-default)] transition-colors',
          'cursor-col-resize',
          isHorizontal ? 'w-px hover:w-1' : 'h-px hover:h-1',
          className
        )}
        {...props}
      />
    );
  }
);
SplitHandle.displayName = 'SplitHandle';

export {
  SplitView,
  SplitPanel,
  SplitToggle,
  SplitHandle,
  splitViewVariants,
  splitPanelVariants,
};
