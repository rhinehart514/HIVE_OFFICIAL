'use client';

/**
 * TabNav - Horizontal tab navigation
 *
 * Animated tab indicator for discovery hub.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type ExploreTab = 'spaces' | 'people' | 'events' | 'tools';

export interface TabNavProps {
  activeTab: ExploreTab;
  onTabChange: (tab: ExploreTab) => void;
  className?: string;
}

const TABS: { id: ExploreTab; label: string; icon: string }[] = [
  { id: 'spaces', label: 'Spaces', icon: '🏠' },
  { id: 'people', label: 'People', icon: '👥' },
  { id: 'events', label: 'Events', icon: '📅' },
  { id: 'tools', label: 'Tools', icon: '🛠️' },
];

export function TabNav({ activeTab, onTabChange, className }: TabNavProps) {
  const [hoveredTab, setHoveredTab] = React.useState<ExploreTab | null>(null);

  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]',
        className
      )}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const isHovered = hoveredTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-[14px] font-medium transition-colors',
              isActive ? 'text-white' : 'text-white/50 hover:text-white/70'
            )}
          >
            {/* Active/hover background */}
            {(isActive || isHovered) && (
              <motion.div
                layoutId="tab-indicator"
                className={cn(
                  'absolute inset-0 rounded-lg',
                  isActive ? 'bg-white/[0.08]' : 'bg-white/[0.04]'
                )}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}

            {/* Content */}
            <span className="relative z-10">{tab.icon}</span>
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
