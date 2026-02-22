'use client';

/**
 * Tabs Primitive — LOCKED 2026-02-21
 *
 * Active = white text + white/8 bg. No gold. White focus ring.
 */

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

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
    defaultVariants: { size: 'default' },
  }
);

const tabsTriggerVariants = cva(
  [
    'rounded-full',
    'font-medium',
    'transition-colors duration-150',
    'text-white/50 hover:text-white/70',
    'data-[state=active]:text-white data-[state=active]:bg-white/[0.08]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-1 focus-visible:ring-offset-black',
    'disabled:pointer-events-none disabled:opacity-40',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'px-3 py-1 text-xs',
        default: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-base',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

export interface TabsProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  size?: 'sm' | 'default' | 'lg';
}

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  size?: 'sm' | 'default' | 'lg';
}

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  size?: 'sm' | 'default' | 'lg';
}

export interface TabsContentProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {}

const TabsContext = React.createContext<{ size: 'sm' | 'default' | 'lg' }>({ size: 'default' });

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ className, size = 'default', children, ...props }, ref) => (
  <TabsContext.Provider value={{ size }}>
    <TabsPrimitive.Root ref={ref} className={className} {...props}>
      {children}
    </TabsPrimitive.Root>
  </TabsContext.Provider>
));
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, size: sizeProp, ...props }, ref) => {
  const { size: contextSize } = React.useContext(TabsContext);
  const size = sizeProp ?? contextSize;
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabsListVariants({ size }), className)}
      {...props}
    />
  );
});
TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, size: sizeProp, ...props }, ref) => {
  const { size: contextSize } = React.useContext(TabsContext);
  const size = sizeProp ?? contextSize;
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(tabsTriggerVariants({ size }), className)}
      {...props}
    />
  );
});
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-3 focus-visible:outline-none', className)}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';

// ============================================
// ANIMATED TABS (sliding indicator)
// ============================================

export interface AnimatedTabsProps {
  tabs: Array<{
    value: string;
    label: React.ReactNode;
    content?: React.ReactNode;
  }>;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  size?: 'sm' | 'default' | 'lg';
  layoutId?: string;
  className?: string;
}

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
    if (!controlledValue) setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    default: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <TabsPrimitive.Root value={value} onValueChange={handleChange} className={className}>
      <TabsPrimitive.List className={cn('relative inline-flex items-center gap-1')}>
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'relative z-10 rounded-full font-medium transition-colors duration-150',
              'text-white/50 hover:text-white/70',
              'data-[state=active]:text-white',
              'focus-visible:outline-none',
              'disabled:pointer-events-none disabled:opacity-40',
              sizeClasses[size]
            )}
          >
            {tab.value === value && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-white/[0.08] rounded-full -z-10"
                transition={springConfig}
              />
            )}
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
  tabsListVariants,
  tabsTriggerVariants,
  springConfig,
};
