'use client';

import { useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Governance', value: 'governance' },
  { label: 'Scheduling', value: 'scheduling' },
  { label: 'Commerce', value: 'commerce' },
  { label: 'Content', value: 'content' },
  { label: 'Social', value: 'social' },
  { label: 'Events', value: 'events' },
  { label: 'Org Management', value: 'org-management' },
  { label: 'Campus Life', value: 'campus-life' },
] as const;

type SortOption = 'trending' | 'popular' | 'recent';

interface ToolsFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
}

export function ToolsFilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
}: ToolsFilterBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearchOpen = () => {
    setSearchOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
    onSearchChange('');
  };

  return (
    <div className="space-y-3">
      {/* Search + Sort row */}
      <div className="flex items-center gap-2">
        <AnimatePresence mode="wait">
          {searchOpen ? (
            <motion.div
              key="input"
              initial={{ width: 120, opacity: 0 }}
              animate={{ width: '100%', opacity: 1 }}
              exit={{ width: 120, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="flex-1 flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2"
            >
              <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search tools..."
                className="flex-1 bg-transparent text-[13px] text-white/70 placeholder:text-white/25 outline-none"
              />
              <button onClick={handleSearchClose} className="text-white/30 hover:text-white/50 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleSearchOpen}
              className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/50 hover:bg-white/[0.06] transition-all"
            >
              <Search className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </AnimatePresence>

        {!searchOpen && (
          <div className="flex items-center gap-1 ml-auto">
            {(['trending', 'popular', 'recent'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => onSortChange(opt)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 capitalize',
                  sort === opt
                    ? 'bg-white/[0.08] text-white/60 border border-white/[0.10]'
                    : 'text-white/25 hover:text-white/40'
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(cat.value)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150 whitespace-nowrap',
              category === cat.value
                ? 'bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700]/70'
                : 'bg-white/[0.03] border border-white/[0.06] text-white/30 hover:bg-white/[0.05] hover:text-white/45'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
