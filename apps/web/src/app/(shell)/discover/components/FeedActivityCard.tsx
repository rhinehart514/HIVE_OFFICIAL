'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActivityItem {
  id: string;
  type: string;
  headline: string;
  toolId?: string;
  toolName?: string;
  spaceId?: string;
  spaceName?: string;
  timestamp: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function FeedActivityCard({ item, index }: { item: ActivityItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={item.toolId ? `/t/${item.toolId}` : '#'}
        className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#080808] px-4 py-3 hover:border-[#FFD700]/10 hover:bg-[#FFD700]/[0.02] transition-all duration-200 border-l-2 border-l-[#FFD700]/20"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#FFD700]/50 shrink-0" />
        <span className="flex-1 min-w-0 text-[13px] text-white/60 truncate group-hover:text-white/80 transition-colors">
          {item.headline}
        </span>
        <span className="text-[11px] text-white/20 shrink-0 tabular-nums">{relativeTime(item.timestamp)}</span>
      </Link>
    </motion.div>
  );
}
