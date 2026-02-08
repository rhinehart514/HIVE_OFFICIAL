'use client';

/**
 * SpaceTabs - Tab navigation for space pages
 *
 * Tabs: Tools (default) | Chat | Events
 */

import { motion } from 'framer-motion';
import { Wrench, MessageSquare, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOTION } from '@hive/ui/design-system/primitives';

export type SpaceTab = 'tools' | 'chat' | 'events';

interface SpaceTabsProps {
  activeTab: SpaceTab;
  onTabChange: (tab: SpaceTab) => void;
  toolsCount?: number;
  unreadCount?: number;
  eventsCount?: number;
}

export function SpaceTabs({
  activeTab,
  onTabChange,
  toolsCount = 0,
  unreadCount = 0,
  eventsCount = 0,
}: SpaceTabsProps) {
  const tabs: Array<{
    id: SpaceTab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }> = [
    {
      id: 'tools',
      label: 'Tools',
      icon: <Wrench className="w-4 h-4" />,
      count: toolsCount,
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageSquare className="w-4 h-4" />,
      count: unreadCount,
    },
    {
      id: 'events',
      label: 'Events',
      icon: <Calendar className="w-4 h-4" />,
      count: eventsCount,
    },
  ];

  return (
    <div className="border-b border-white/[0.06] bg-[var(--bg-ground)]">
      <div className="flex items-center gap-1 px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'text-white'
                  : 'text-white/50 hover:text-white/70'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cn(
                    'ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium',
                    isActive
                      ? 'bg-[var(--life-gold)] text-black'
                      : 'bg-white/[0.08] text-white/60'
                  )}
                >
                  {tab.count}
                </span>
              )}

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--life-gold)]"
                  layoutId="activeTab"
                  transition={{
                    duration: MOTION.duration.fast,
                    ease: MOTION.ease.premium,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
