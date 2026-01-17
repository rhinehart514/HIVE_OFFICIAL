'use client';

/**
 * TabNav Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Horizontal tab navigation for switching between views.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * UNDERLINE VARIANT (default):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Overview    Members    Events    Settings                              │
 * │  ─────────                                                             │
 * │     │                                                                   │
 * │     └── Active tab: white text, gold underline                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * With full underline animation:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Overview    Members    Events    Settings                              │
 * │              ─────────                                                  │
 * │                  │                                                      │
 * │                  └── Underline slides to active tab                     │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * PILLS VARIANT:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  (▓Overview▓)   (Members)   (Events)   (Settings)                       │
 * │       │                                                                 │
 * │       └── Active: bg-elevated, white text                               │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * SEGMENT VARIANT (connected pills):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ┌───────────────────────────────────────────────────────────────────┐ │
 * │  │ ▓Overview▓ │  Members  │  Events  │  Settings                    │ │
 * │  └───────────────────────────────────────────────────────────────────┘ │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * WITH ICONS:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  📊 Overview    👥 Members    📅 Events    ⚙️ Settings                  │
 * │  ───────────                                                            │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * WITH BADGES (notification counts):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Overview    Members (24)    Events 🔴    Settings                      │
 * │  ─────────                     │                                        │
 * │                                └── Badge or dot for notifications       │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * VERTICAL ORIENTATION:
 * ┌──────────────────┐
 * │  ▓ Overview ▓    │
 * │  Members         │
 * │  Events          │
 * │  Settings        │
 * └──────────────────┘
 *
 * STATES:
 * - Active: white text, accent indicator
 * - Inactive: muted text
 * - Hover: slightly brighter
 * - Disabled: 50% opacity
 *
 * SIZES:
 * - sm: text-xs, h-8
 * - default: text-sm, h-10
 * - lg: text-base, h-12
 *
 * COLORS:
 * - Active text: white
 * - Inactive text: var(--color-text-muted)
 * - Underline: #FFD700 (gold) - indicates selection
 * - Pills active bg: var(--color-bg-elevated)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';

const tabNavVariants = cva('flex', {
  variants: {
    variant: {
      underline: 'gap-1 border-b border-border',
      pills: 'gap-2',
      segment: 'p-1 bg-elevated border border-border rounded-xl gap-0',
    },
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    },
    size: {
      sm: '',
      default: '',
      lg: '',
    },
  },
  compoundVariants: [
    {
      variant: 'underline',
      orientation: 'vertical',
      className: 'border-b-0 border-r',
    },
  ],
  defaultVariants: {
    variant: 'underline',
    orientation: 'horizontal',
    size: 'default',
  },
});

const tabItemVariants = cva(
  'relative inline-flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer',
  {
    variants: {
      variant: {
        underline: '',
        pills: 'rounded-lg',
        segment: 'rounded-lg',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
      active: {
        true: 'text-white',
        false: 'text-muted hover:text-white',
      },
    },
    compoundVariants: [
      {
        variant: 'pills',
        active: true,
        className: 'bg-white/10',
      },
      {
        variant: 'segment',
        active: true,
        className: 'bg-white/10',
      },
    ],
    defaultVariants: {
      variant: 'underline',
      size: 'default',
      active: false,
    },
  }
);

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | boolean;
  disabled?: boolean;
}

export interface TabNavProps extends VariantProps<typeof tabNavVariants> {
  /** Tab items */
  tabs: TabItem[];
  /** Active tab id */
  activeTab: string;
  /** Tab change handler */
  onTabChange: (tabId: string) => void;
  /** Show animated underline (for underline variant) */
  animatedIndicator?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * TabNav - Tab navigation component
 */
const TabNav: React.FC<TabNavProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'underline',
  orientation = 'horizontal',
  size = 'default',
  animatedIndicator = true,
  className,
}) => {
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({});
  const tabRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Update indicator position
  React.useEffect(() => {
    if (variant !== 'underline' || !animatedIndicator) return;

    const activeTabEl = tabRefs.current.get(activeTab);
    const container = containerRef.current;

    if (activeTabEl && container) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTabEl.getBoundingClientRect();

      if (orientation === 'horizontal') {
        setIndicatorStyle({
          width: tabRect.width,
          transform: `translateX(${tabRect.left - containerRect.left}px)`,
        });
      } else {
        setIndicatorStyle({
          height: tabRect.height,
          transform: `translateY(${tabRect.top - containerRect.top}px)`,
        });
      }
    }
  }, [activeTab, variant, orientation, animatedIndicator]);

  return (
    <div
      ref={containerRef}
      className={cn(tabNavVariants({ variant, orientation, size }), 'relative', className)}
      role="tablist"
      aria-orientation={orientation ?? undefined}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => {
            if (el) tabRefs.current.set(tab.id, el);
          }}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-disabled={tab.disabled}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
          disabled={tab.disabled}
          className={cn(
            tabItemVariants({
              variant,
              size,
              active: activeTab === tab.id,
            }),
            tab.disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.badge !== undefined && (
            typeof tab.badge === 'number' ? (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-medium bg-white/10 rounded-full">
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            ) : tab.badge ? (
              <span className="w-2 h-2 rounded-full bg-red-500" />
            ) : null
          )}
        </button>
      ))}

      {/* Animated underline indicator */}
      {variant === 'underline' && animatedIndicator && (
        <div
          className={cn(
            'absolute bg-life-gold transition-all duration-200 ease-out',
            orientation === 'horizontal'
              ? 'bottom-0 h-0.5'
              : 'right-0 w-0.5'
          )}
          style={indicatorStyle}
        />
      )}
    </div>
  );
};

TabNav.displayName = 'TabNav';

/**
 * TabPanel - Content panel for tabs
 */
export interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

const TabPanel: React.FC<TabPanelProps> = ({
  id,
  activeTab,
  children,
  className,
}) => {
  if (id !== activeTab) return null;

  return (
    <div
      role="tabpanel"
      aria-labelledby={id}
      className={cn('animate-in fade-in-0 duration-200', className)}
    >
      {children}
    </div>
  );
};

TabPanel.displayName = 'TabPanel';

export { TabNav, TabPanel, tabNavVariants, tabItemVariants };
