"use client";

import * as React from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { cn } from "../../../lib/utils";
import { springPresets, easingArrays } from "@hive/tokens";
import { Plus, Settings, GripVertical } from "lucide-react";

/**
 * SpaceTabBar
 *
 * Horizontal tab navigation for Space detail pages.
 * Fetches tabs from API and renders with T2 motion tier.
 *
 * Features:
 * - Animated active indicator
 * - Activity badges
 * - Leader mode: add/reorder tabs
 * - Mobile horizontal scroll
 *
 * @example
 * <SpaceTabBar
 *   tabs={tabs}
 *   activeTabId="overview"
 *   onTabChange={(id) => setActiveTab(id)}
 *   isLeader={true}
 *   onAddTab={() => openAddModal()}
 * />
 */

// ============================================================
// Types
// ============================================================

export interface SpaceTabItem {
  id: string;
  name: string;
  type: "feed" | "widget" | "resource" | "custom";
  isDefault?: boolean;
  hasActivity?: boolean;
  badgeCount?: number;
}

export interface SpaceTabBarProps {
  tabs: SpaceTabItem[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  isLeader?: boolean;
  onAddTab?: () => void;
  onReorderTabs?: (orderedIds: string[]) => void;
  onSettingsClick?: () => void;
  className?: string;
  showSettings?: boolean;
}

// ============================================================
// Motion Variants
// ============================================================

const tabBarVariants: Variants = {
  initial: { opacity: 0, y: -10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: easingArrays.silk,
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

const tabItemVariants: Variants = {
  initial: { opacity: 0, y: -8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springPresets.snappy,
  },
  hover: {
    scale: 1.02,
    transition: springPresets.snappy,
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

const indicatorVariants: Variants = {
  initial: { scaleX: 0, opacity: 0 },
  animate: {
    scaleX: 1,
    opacity: 1,
    transition: {
      ...springPresets.bouncy,
      opacity: { duration: 0.15 },
    },
  },
};

const badgeVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: springPresets.bouncy,
  },
  pulse: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

// ============================================================
// Subcomponents
// ============================================================

interface TabPillProps {
  tab: SpaceTabItem;
  isActive: boolean;
  onClick: () => void;
  isLeader?: boolean;
}

function TabPill({ tab, isActive, onClick, isLeader }: TabPillProps) {
  return (
    <motion.button
      variants={tabItemVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      className={cn(
        "relative px-4 py-2 text-sm font-medium whitespace-nowrap",
        "rounded-full transition-colors duration-200",
        // White focus ring (not gold)
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
        isActive
          ? "text-white"
          : "text-[#A1A1A6] hover:text-[#FAFAFA]"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {/* Leader drag handle */}
      {isLeader && (
        <span className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 cursor-grab">
          <GripVertical className="w-3 h-3 text-[#818187]" />
        </span>
      )}

      {/* Tab name */}
      <span className="relative z-10">{tab.name}</span>

      {/* Activity badge */}
      <AnimatePresence>
        {tab.hasActivity && !isActive && (
          <motion.span
            variants={badgeVariants}
            initial="initial"
            animate="animate"
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
            className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#FFD700] rounded-full"
          />
        )}
      </AnimatePresence>

      {/* Badge count */}
      <AnimatePresence>
        {tab.badgeCount && tab.badgeCount > 0 && (
          <motion.span
            variants={badgeVariants}
            initial="initial"
            animate="animate"
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
            className={cn(
              "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1",
              "flex items-center justify-center",
              "text-[10px] font-bold text-black bg-[#FFD700] rounded-full"
            )}
          >
            {tab.badgeCount > 99 ? "99+" : tab.badgeCount}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Active indicator underline */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            layoutId="activeTabIndicator"
            variants={indicatorVariants}
            initial="initial"
            animate="animate"
            exit={{ scaleX: 0, opacity: 0, transition: { duration: 0.15 } }}
            className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#FFD700] rounded-full"
            style={{ originX: 0.5 }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ============================================================
// Main Component
// ============================================================

export function SpaceTabBar({
  tabs,
  activeTabId,
  onTabChange,
  isLeader = false,
  onAddTab,
  onReorderTabs,
  onSettingsClick,
  className,
  showSettings = true,
}: SpaceTabBarProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = React.useState(false);
  const [showRightFade, setShowRightFade] = React.useState(false);

  // Check scroll position for fade indicators
  const checkScrollPosition = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftFade(scrollLeft > 0);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // Check on mount and resize
  React.useEffect(() => {
    checkScrollPosition();
    window.addEventListener("resize", checkScrollPosition);
    return () => window.removeEventListener("resize", checkScrollPosition);
  }, [checkScrollPosition, tabs]);

  // Scroll active tab into view
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const activeTab = container.querySelector(`[data-tab-id="${activeTabId}"]`);
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeTabId]);

  return (
    <motion.div
      variants={tabBarVariants}
      initial="initial"
      animate="animate"
      className={cn(
        "relative flex items-center",
        "border-b border-white/[0.06]",
        className
      )}
    >
      {/* Left fade indicator */}
      <AnimatePresence>
        {showLeftFade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent pointer-events-none z-10"
          />
        )}
      </AnimatePresence>

      {/* Scrollable tab container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollPosition}
        className={cn(
          "flex items-center gap-1 overflow-x-auto scrollbar-hide",
          "py-1 px-1 -mx-1",
          "flex-1"
        )}
      >
        {tabs.map((tab) => (
          <div key={tab.id} data-tab-id={tab.id} className="group">
            <TabPill
              tab={tab}
              isActive={tab.id === activeTabId}
              onClick={() => onTabChange(tab.id)}
              isLeader={isLeader}
            />
          </div>
        ))}

        {/* Add tab button (leader only) */}
        {isLeader && onAddTab && (
          <motion.button
            variants={tabItemVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onAddTab}
            className={cn(
              "flex items-center justify-center",
              "w-11 h-11 ml-1 rounded-full",
              "text-[#818187] hover:text-[#A1A1A6]",
              "bg-white/5 hover:bg-white/10",
              "border border-white/[0.06] hover:border-white/[0.1]",
              "transition-colors duration-200",
              // White focus ring (not gold)
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            )}
            aria-label="Add new tab"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Right fade indicator */}
      <AnimatePresence>
        {showRightFade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-12 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none z-10"
          />
        )}
      </AnimatePresence>

      {/* Settings button */}
      {showSettings && isLeader && onSettingsClick && (
        <motion.button
          variants={tabItemVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={onSettingsClick}
          className={cn(
            "flex items-center justify-center",
            "w-11 h-11 ml-2 rounded-full flex-shrink-0",
            "text-[#818187] hover:text-[#A1A1A6]",
            "hover:bg-white/5",
            "transition-colors duration-200",
            // White focus ring (not gold)
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          )}
          aria-label="Space settings"
        >
          <Settings className="w-4 h-4" />
        </motion.button>
      )}
    </motion.div>
  );
}

// ============================================================
// Exports
// ============================================================

export default SpaceTabBar;
