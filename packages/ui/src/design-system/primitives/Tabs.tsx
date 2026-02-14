'use client';

/**
 * Tabs Primitive - LOCKED 2026-01-10
 *
 * LOCKED: Glass pill active indicator, sliding motion, no container
 * Matches Badge glass treatment and Button pill shape.
 *
 * Recipe:
 *   container: None (clean, no track)
 *   active: Glass pill with floating shadow
 *   shape: Pill (rounded-full)
 *   motion: Spring slide (stiffness: 400, damping: 30)
 */

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: Glass pill surface for active tab
const glassPillSurface = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
};

// LOCKED: Spring animation config
const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

// Size variants for tabs
const tabsSizeVariants = cva('', {
  variants: {
    size: {
      sm: 'text-xs',
      default: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

const tabsTriggerSizeVariants = cva('', {
  variants: {
    size: {
      sm: 'px-3 py-1',
      default: 'px-4 py-2',
      lg: 'px-5 py-2.5',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

// Exported variants for external use
const tabsListVariants = cva(
  'inline-flex items-center',
  {
    variants: {
      size: {
        sm: 'gap-0.5',
        default: 'gap-1',
        lg: 'gap-1',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const tabsTriggerVariants = cva(
  [
    'rounded-full',
    'font-medium',
    'transition-colors duration-150',
    'text-white/50 hover:text-white/70',
    'data-[state=active]:text-white',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[#000000]',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'px-3 py-1 text-xs',
        default: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-base',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// Types
export interface TabsProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
}

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  /** Size variant (inherited from parent) */
  size?: 'sm' | 'default' | 'lg';
}

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  /** Size variant (inherited from parent) */
  size?: 'sm' | 'default' | 'lg';
}

export interface TabsContentProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {}

// Context for sharing size
const TabsContext = React.createContext<{ size: 'sm' | 'default' | 'lg' }>({ size: 'default' });

// Components
const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ className, size = 'default', children, ...props }, ref) => (
  <TabsContext.Provider value={{ size }}>
    <TabsPrimitive.Root
      ref={ref}
      className={cn(tabsSizeVariants({ size }), className)}
      {...props}
    >
      {children}
    </TabsPrimitive.Root>
  </TabsContext.Provider>
));

Tabs.displayName = 'Tabs';

// LOCKED: No container - clean flex with gap
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, size: sizeProp, ...props }, ref) => {
  const { size: contextSize } = React.useContext(TabsContext);
  const size = sizeProp ?? contextSize;

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'inline-flex items-center',
        size === 'sm' ? 'gap-0.5' : 'gap-1',
        className
      )}
      {...props}
    />
  );
});

TabsList.displayName = 'TabsList';

// LOCKED: Glass pill trigger with transition
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, size: sizeProp, style, ...props }, ref) => {
  const { size: contextSize } = React.useContext(TabsContext);
  const size = sizeProp ?? contextSize;
  const [isActive, setIsActive] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Combine refs
  React.useImperativeHandle(ref, () => triggerRef.current!);

  // Check if active on mount and when data-state changes
  React.useEffect(() => {
    const checkActive = () => {
      if (triggerRef.current) {
        setIsActive(triggerRef.current.getAttribute('data-state') === 'active');
      }
    };

    checkActive();

    // Use MutationObserver to watch for data-state changes
    const observer = new MutationObserver(checkActive);
    if (triggerRef.current) {
      observer.observe(triggerRef.current, { attributes: true, attributeFilter: ['data-state'] });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <TabsPrimitive.Trigger
      ref={triggerRef}
      className={cn(
        // LOCKED: Pill shape
        'rounded-full',
        'font-medium',
        'transition-colors duration-150',
        // Inactive state
        'text-white/50 hover:text-white/70',
        // Active state (text only, bg handled by style)
        'data-[state=active]:text-white',
        // Focus (WHITE, never gold)
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-[#000000]',
        // Disabled
        'disabled:pointer-events-none disabled:opacity-50',
        tabsTriggerSizeVariants({ size }),
        className
      )}
      style={{
        ...(isActive ? glassPillSurface : {}),
        ...style,
      }}
      {...props}
    />
  );
});

TabsTrigger.displayName = 'TabsTrigger';

// Content styles
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-3',
      // Focus (WHITE, never gold)
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-[#000000]',
      className
    )}
    {...props}
  />
));

TabsContent.displayName = 'TabsContent';

// ============================================
// ANIMATED TABS (with sliding indicator)
// ============================================

export interface AnimatedTabsProps {
  /** Tab items */
  tabs: Array<{
    value: string;
    label: React.ReactNode;
    content?: React.ReactNode;
  }>;
  /** Default active tab */
  defaultValue?: string;
  /** Controlled value */
  value?: string;
  /** Change handler */
  onValueChange?: (value: string) => void;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Layout ID for framer motion (unique per instance) */
  layoutId?: string;
  /** Additional className for container */
  className?: string;
}

// LOCKED: Animated tabs with sliding glass pill
const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  defaultValue,
  value: controlledValue,
  onValueChange,
  size = 'default',
  layoutId = 'tabs-indicator',
  className,
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? tabs[0]?.value);
  const value = controlledValue ?? internalValue;

  const handleChange = (newValue: string) => {
    if (!controlledValue) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const activeIndex = tabs.findIndex((t) => t.value === value);

  const sizeClasses = {
    sm: { trigger: 'px-3 py-1 text-xs', gap: 'gap-0.5' },
    default: { trigger: 'px-4 py-2 text-sm', gap: 'gap-1' },
    lg: { trigger: 'px-5 py-2.5 text-base', gap: 'gap-1' },
  };

  return (
    <TabsPrimitive.Root value={value} onValueChange={handleChange} className={className}>
      <TabsPrimitive.List className={cn('relative inline-flex items-center', sizeClasses[size].gap)}>
        {/* LOCKED: Sliding glass pill indicator */}
        {activeIndex >= 0 && (
          <motion.div
            layoutId={layoutId}
            className="absolute inset-y-0 rounded-full -z-10"
            style={{
              ...glassPillSurface,
              left: 0,
              width: '100%',
            }}
            transition={springConfig}
          />
        )}
        {tabs.map((tab, index) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'relative z-10 rounded-full font-medium transition-colors duration-150',
              'text-white/50 hover:text-white/70',
              'data-[state=active]:text-white',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
              'focus-visible:ring-offset-2 focus-visible:ring-offset-[#000000]',
              'disabled:pointer-events-none disabled:opacity-50',
              sizeClasses[size].trigger
            )}
            style={index === activeIndex ? glassPillSurface : undefined}
          >
            {tab.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>

      {tabs.map((tab) => (
        tab.content && (
          <TabsPrimitive.Content
            key={tab.value}
            value={tab.value}
            className="mt-3 focus-visible:outline-none"
          >
            {tab.content}
          </TabsPrimitive.Content>
        )
      ))}
    </TabsPrimitive.Root>
  );
};

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  AnimatedTabs,
  // Export variants
  tabsListVariants,
  tabsTriggerVariants,
  // Export style helpers
  glassPillSurface,
  springConfig,
};
