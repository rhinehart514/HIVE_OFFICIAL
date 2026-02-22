'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface RecommendedSpace {
  id: string;
  name: string;
  slug?: string;
  description: string;
  category: string;
  memberCount: number;
  avatarUrl?: string;
  iconURL?: string;
  isVerified?: boolean;
}

interface SectionGroup {
  key: string;
  label: string;
  spaces: RecommendedSpace[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  campus_living: 'Residential',
  greek_life: 'Greek Life',
  student_org: 'Organizations',
  student_organizations: 'Organizations',
  university_org: 'University',
  university_organizations: 'University',
  hive_exclusive: 'HIVE',
};

const SECTION_ORDER = [
  'campus_living',
  'greek_life',
  'student_org',
  'student_organizations',
  'university_org',
  'university_organizations',
  'hive_exclusive',
];

function groupByCategory(spaces: RecommendedSpace[]): SectionGroup[] {
  const map = new Map<string, RecommendedSpace[]>();

  for (const space of spaces) {
    const cat = space.category;
    const label = CATEGORY_LABELS[cat] ?? 'Other';
    // Normalize: group student_org + student_organizations under same key
    const normalizedKey =
      cat === 'student_organizations' ? 'student_org' :
      cat === 'university_organizations' ? 'university_org' :
      cat;

    if (!map.has(normalizedKey)) map.set(normalizedKey, []);
    map.get(normalizedKey)!.push(space);
  }

  return SECTION_ORDER
    .filter(key => map.has(key))
    .map(key => ({
      key,
      label: CATEGORY_LABELS[key] ?? key,
      spaces: map.get(key)!,
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Space selection row
// ─────────────────────────────────────────────────────────────────────────────

function SpaceRow({
  space,
  selected,
  onToggle,
  index,
}: {
  space: RecommendedSpace;
  selected: boolean;
  onToggle: () => void;
  index: number;
}) {
  const avatarUrl = space.avatarUrl || (space as { iconURL?: string }).iconURL;
  const initial = space.name.charAt(0).toUpperCase();

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all duration-150 text-left',
        selected
          ? 'border-[#FFD700]/25 bg-[#FFD700]/[0.03] border-l-[#FFD700] border-l-2'
          : 'border-white/[0.06] bg-[#0a0a0a] hover:border-white/[0.1] hover:bg-white/[0.02]'
      )}
    >
      {/* Avatar */}
      <div className="h-9 w-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-white/[0.06]">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[14px] font-medium text-white/40">{initial}</span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-[13px] font-medium leading-snug truncate transition-colors',
          selected ? 'text-white' : 'text-white/60'
        )}>
          {space.name}
        </p>
        {space.memberCount > 0 && (
          <p className="text-[11px] text-white/25 mt-0.5">
            {space.memberCount.toLocaleString()} members
          </p>
        )}
      </div>

      {/* Checkmark */}
      <div className={cn(
        'h-5 w-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-150',
        selected
          ? 'bg-[#FFD700]'
          : 'border border-white/[0.15]'
      )}>
        {selected && <Check className="h-3 w-3 text-black" strokeWidth={2.5} />}
      </div>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-[60px] rounded-xl bg-white/[0.04] animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface SpacesFirstEntryProps {
  onComplete: () => void;
}

export function SpacesFirstEntry({ onComplete }: SpacesFirstEntryProps) {
  const [sections, setSections] = React.useState<SectionGroup[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [joining, setJoining] = React.useState(false);
  const [done, setDone] = React.useState(false);

  // Fetch recommendations on mount
  React.useEffect(() => {
    async function load() {
      try {
        const res = await secureApiFetch('/api/spaces/recommended?limit=20&includePrivate=false');
        if (!res.ok) return;
        const data = await res.json();
        const spaces: RecommendedSpace[] =
          data?.data?.recommendations ?? data?.recommendations ?? [];

        const grouped = groupByCategory(spaces.slice(0, 16));
        setSections(grouped);

        // Pre-select everything
        setSelected(new Set(spaces.slice(0, 16).map(s => s.id)));
      } catch {
        // fail silently — just skip the onboarding if API fails
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleJoin = async () => {
    if (joining || selected.size === 0) return;
    setJoining(true);

    const ids = Array.from(selected);
    await Promise.allSettled(
      ids.map(spaceId =>
        secureApiFetch('/api/spaces/join-v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spaceId, joinMethod: 'auto' }),
        })
      )
    );

    setDone(true);
    await new Promise(r => setTimeout(r, 600));
    onComplete();
  };

  const allSpaces = sections.flatMap(s => s.spaces);
  let cardIndex = 0;

  return (
    <AnimatePresence mode="wait">
      {!done ? (
        <motion.div
          key="entry"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-xl px-6 py-10 pb-32"
        >
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <h1 className="text-[28px] font-semibold text-white leading-tight tracking-[-0.02em]">
              Your campus, matched.
            </h1>
            <p className="text-[14px] text-white/35 mt-2">
              {loading
                ? 'Finding your spaces…'
                : allSpaces.length > 0
                  ? `${allSpaces.length} spaces selected. Tap to remove any.`
                  : 'No spaces found — you can browse below.'}
            </p>
          </motion.div>

          {/* Sections */}
          {loading ? (
            <div className="flex flex-col gap-6">
              <SkeletonRows count={3} />
              <SkeletonRows count={4} />
              <SkeletonRows count={2} />
            </div>
          ) : (
            <div className="flex flex-col gap-7">
              {sections.map(section => (
                <div key={section.key}>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/25 mb-3">
                    {section.label}
                  </p>
                  <div className="flex flex-col gap-2">
                    {section.spaces.map(space => {
                      const idx = cardIndex++;
                      return (
                        <SpaceRow
                          key={space.id}
                          space={space}
                          selected={selected.has(space.id)}
                          onToggle={() => toggle(space.id)}
                          index={idx}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Skip if no recommendations */}
          {!loading && allSpaces.length === 0 && (
            <button
              onClick={onComplete}
              className="w-full py-3 text-[13px] text-white/30 hover:text-white/50 transition-colors"
            >
              Browse all spaces →
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="done"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-40"
        >
          <div className="w-5 h-5 rounded-full border-2 border-white/[0.06] border-t-[#FFD700] animate-spin" />
        </motion.div>
      )}

      {/* Sticky join CTA — outside scroll, anchored to viewport bottom-right of content */}
      {!loading && !done && allSpaces.length > 0 && (
        <motion.div
          key="cta"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-6 md:left-[calc(50%+110px)] md:-translate-x-1/2"
        >
          <button
            onClick={handleJoin}
            disabled={joining || selected.size === 0}
            className={cn(
              'w-full py-3.5 rounded-2xl text-[15px] font-semibold transition-all duration-200',
              selected.size > 0 && !joining
                ? 'bg-white text-black hover:bg-white/90 active:scale-[0.98]'
                : 'bg-white/[0.08] text-white/25 cursor-not-allowed'
            )}
          >
            {joining
              ? 'Joining…'
              : selected.size > 0
                ? `Join ${selected.size} space${selected.size !== 1 ? 's' : ''}`
                : 'Select spaces to join'}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
