'use client';

import * as React from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
  AnimatePresence
} from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

import { cn } from '../lib/utils';

// Spring config matching UniversalShell
const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

// Smooth content transitions
const CONTENT_TRANSITION = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1],
};

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

export interface CollapsiblePageHeaderProps {
  /** Page title */
  title: string;
  /** Short title for collapsed state */
  shortTitle?: string;
  /** Page subtitle/description */
  subtitle?: string;
  /** Eyebrow text above title */
  eyebrow?: React.ReactNode;
  /** Tab items for filtering */
  tabs?: TabItem[];
  /** Currently active tab */
  activeTab?: string;
  /** Tab change handler */
  onTabChange?: (tabId: string) => void;
  /** Right-side actions (buttons, etc.) */
  actions?: React.ReactNode;
  /** Content below header (like stat cards) */
  children?: React.ReactNode;
  /** Custom scroll container ref (defaults to window) */
  scrollContainerRef?: React.RefObject<HTMLElement>;
  /** Additional className */
  className?: string;
  /** Disable collapse behavior */
  disableCollapse?: boolean;
}

export const CollapsiblePageHeader = React.forwardRef<
  HTMLDivElement,
  CollapsiblePageHeaderProps
>(({
  title,
  shortTitle,
  subtitle,
  eyebrow,
  tabs = [],
  activeTab,
  onTabChange,
  actions,
  children,
  scrollContainerRef,
  className,
  disableCollapse = false,
}, ref) => {
  const shouldReduceMotion = useReducedMotion();
  const [showTabDropdown, setShowTabDropdown] = React.useState(false);

  // Scroll tracking
  const { scrollY } = useScroll({
    container: scrollContainerRef,
  });

  // Smooth the scroll value
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Transform values based on scroll
  const headerHeight = useTransform(
    shouldReduceMotion || disableCollapse ? scrollY : smoothScrollY,
    [0, 100],
    [1, 0]
  );

  const titleScale = useTransform(
    shouldReduceMotion || disableCollapse ? scrollY : smoothScrollY,
    [0, 100],
    [1, 0.75]
  );

  const subtitleOpacity = useTransform(
    shouldReduceMotion || disableCollapse ? scrollY : smoothScrollY,
    [0, 60],
    [1, 0]
  );

  const eyebrowOpacity = useTransform(
    shouldReduceMotion || disableCollapse ? scrollY : smoothScrollY,
    [0, 40],
    [1, 0]
  );

  // For tabs collapse
  const tabsCollapsed = useTransform(
    shouldReduceMotion || disableCollapse ? scrollY : smoothScrollY,
    [0, 80],
    [0, 1]
  );

  const activeTabItem = tabs.find(t => t.id === activeTab);

  const springTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : SPRING_CONFIG;

  const contentTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : CONTENT_TRANSITION;

  return (
    <motion.header
      ref={ref}
      className={cn(
        'sticky top-0 z-30 bg-black/95 backdrop-blur-sm border-b border-neutral-800/50',
        className
      )}
      style={{
        paddingBottom: useTransform(headerHeight, [0, 1], [12, 24]),
      }}
    >
      <div className="px-6 pt-4">
        {/* Top row: Title + Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Eyebrow */}
            {eyebrow && (
              <motion.div
                style={{ opacity: eyebrowOpacity }}
                className="mb-2"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                  {eyebrow}
                </span>
              </motion.div>
            )}

            {/* Title */}
            <motion.div
              style={{ scale: titleScale, originX: 0, originY: 0.5 }}
            >
              <h1 className="text-2xl font-semibold text-white truncate">
                <motion.span
                  style={{
                    opacity: useTransform(headerHeight, [0, 0.5], [0, 1])
                  }}
                  className="inline"
                >
                  {shortTitle || title}
                </motion.span>
                <motion.span
                  style={{
                    opacity: useTransform(headerHeight, [0.5, 1], [0, 1]),
                    position: 'absolute',
                    left: 0,
                  }}
                  className="inline"
                >
                  {title}
                </motion.span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            {subtitle && (
              <motion.p
                style={{ opacity: subtitleOpacity }}
                className="mt-1 text-sm text-neutral-400 truncate"
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>

        {/* Tabs row */}
        {tabs.length > 0 && (
          <div className="mt-4 relative">
            {/* Expanded tabs */}
            <motion.div
              style={{
                opacity: useTransform(tabsCollapsed, [0, 1], [1, 0]),
                pointerEvents: useTransform(tabsCollapsed, v => v > 0.5 ? 'none' : 'auto'),
              }}
              className="flex items-center gap-1"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
                    activeTab === tab.id
                      ? 'bg-white/10 text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {tab.icon}
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-label-xs rounded-full bg-white/10">
                        {tab.badge}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </motion.div>

            {/* Collapsed tab dropdown */}
            <motion.div
              style={{
                opacity: useTransform(tabsCollapsed, [0, 1], [0, 1]),
                pointerEvents: useTransform(tabsCollapsed, v => v < 0.5 ? 'none' : 'auto'),
              }}
              className="absolute top-0 left-0"
            >
              <div className="relative">
                <button
                  onClick={() => setShowTabDropdown(!showTabDropdown)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
                    'bg-white/10 text-white',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20'
                  )}
                >
                  {activeTabItem?.icon}
                  {activeTabItem?.label || 'All'}
                  <ChevronDownIcon className="w-3.5 h-3.5 ml-0.5" />
                </button>

                <AnimatePresence>
                  {showTabDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={contentTransition}
                      className="absolute top-full left-0 mt-1 py-1 min-w-[140px] rounded-lg bg-neutral-900 border border-neutral-800 shadow-xl z-50"
                    >
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            onTabChange?.(tab.id);
                            setShowTabDropdown(false);
                          }}
                          className={cn(
                            'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
                            'hover:bg-white/5 transition-colors',
                            activeTab === tab.id
                              ? 'text-white bg-white/5'
                              : 'text-neutral-400'
                          )}
                        >
                          {tab.icon}
                          {tab.label}
                          {tab.badge !== undefined && tab.badge > 0 && (
                            <span className="ml-auto text-label-xs text-neutral-500">
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Children (like stat cards) - fade out on scroll */}
      {children && (
        <motion.div
          style={{
            opacity: subtitleOpacity,
            height: useTransform(headerHeight, [0, 1], [0, 'auto']),
            overflow: 'hidden',
          }}
          className="px-6 mt-4"
        >
          {children}
        </motion.div>
      )}
    </motion.header>
  );
});

CollapsiblePageHeader.displayName = 'CollapsiblePageHeader';

export default CollapsiblePageHeader;
