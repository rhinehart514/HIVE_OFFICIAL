'use client';

/**
 * TabNav - Horizontal tab navigation
 *
 * Animated tab indicator for discovery hub.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Calendar, Wrench, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ExploreTab = 'spaces' | 'people' | 'events' | 'tools';

export interface TabNavProps {
  activeTab: ExploreTab;
  onTabChange: (tab: ExploreTab) => void;
  className?: string;
}

const TABS: { id: ExploreTab; label: string; icon: LucideIcon }[] = [
  { id: 'spaces', label: 'Spaces', icon: Building2 },
  { id: 'people', label: 'People', icon: Users },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'tools', label: 'Tools', icon: Wrench },
];

export function TabNav({ activeTab, onTabChange, className }: TabNavProps) {
  const [hoveredTab, setHoveredTab] = React.useState<ExploreTab | null>(null);

  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 rounded-lg bg-white/[0.06] border border-white/[0.06]',
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
              'relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-body font-medium transition-colors',
              isActive ? 'text-white' : 'text-white/50 hover:text-white/50'
            )}
          >
            {/* Active/hover background with glass treatment */}
            {(isActive || isHovered) && (
              <motion.div
                layoutId="tab-indicator"
                className={cn(
                  'absolute inset-0 rounded-lg',
                  isActive
                    ? 'bg-white/[0.06] border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                    : 'bg-white/[0.06]'
                )}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}

            {/* Content */}
            <tab.icon className="relative z-10 w-4 h-4" />
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
