'use client';

/**
 * SpaceTabs - Tab navigation for space pages
 *
 * Chat / Events / Posts navigation
 */

import { motion } from 'framer-motion';
import { Calendar, FileText, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOTION } from '@hive/ui/design-system/primitives';

export type SpaceTab = 'chat' | 'events' | 'posts';

interface SpaceTabsProps {
  activeTab: SpaceTab;
  onTabChange?: (tab: SpaceTab) => void;
  unreadCount?: number;
  eventCount?: number;
  postCount?: number;
}

export function SpaceTabs({
  activeTab,
  onTabChange,
  unreadCount = 0,
  eventCount,
  postCount,
}: SpaceTabsProps) {
  const tabs: Array<{
    id: SpaceTab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }> = [
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
      count: eventCount,
    },
    {
      id: 'posts',
      label: 'Posts',
      icon: <FileText className="w-4 h-4" />,
      count: postCount,
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
              onClick={() => onTabChange?.(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/70'
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
                      : 'bg-white/[0.06] text-white/50'
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
