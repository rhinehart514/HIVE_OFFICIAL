'use client';

/**
 * PeopleGrid - Grid of people for discovery
 *
 * Shows classmates, mutual connections, and interesting people.
 * Enhanced with mutual space context and interaction affordances.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { GlassSurface, SimpleAvatar, Badge, MOTION } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

export interface PersonData {
  id: string;
  name: string;
  avatarUrl?: string;
  handle?: string;
  role?: string;
  mutualSpaces?: number;
  isOnline?: boolean;
}

export interface PeopleGridProps {
  people: PersonData[];
  loading?: boolean;
  searchQuery?: string;
}

export function PeopleGrid({ people, loading, searchQuery }: PeopleGridProps) {
  // Loading state - 8 skeletons for better visual balance
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <PersonCardSkeleton key={i} index={i} />
        ))}
      </div>
    );
  }

  // Empty state with HIVE personality
  if (people.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        className="text-center py-16"
      >
        {searchQuery ? (
          <>
            <p className="text-white/40 text-body mb-2">
              No one matches "{searchQuery}"
            </p>
            <p className="text-white/25 text-body-sm">
              Try a different name or major
            </p>
          </>
        ) : (
          <>
            <p className="text-white/40 text-body mb-2">
              Start typing to find people
            </p>
            <p className="text-white/25 text-body-sm">
              Search by name, handle, or major
            </p>
          </>
        )}
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {people.map((person, i) => (
        <PersonCard key={person.id} person={person} index={i} />
      ))}
    </div>
  );
}

// ============================================
// PERSON CARD
// ============================================

interface PersonCardProps {
  person: PersonData;
  index: number;
}

function PersonCard({ person, index }: PersonCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.fast,
        delay: index * 0.03,
        ease: MOTION.ease.premium,
      }}
    >
      <Link href={`/profile/${person.id}`}>
        <GlassSurface
          intensity="subtle"
          className={cn(
            'group p-4 rounded-xl transition-all duration-200',
            'border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.02]'
          )}
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="relative shrink-0">
              <SimpleAvatar
                src={person.avatarUrl}
                fallback={person.name?.charAt(0) || '?'}
                size="lg"
              />
              {person.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[var(--life-gold)] border-2 border-[var(--bg-ground)]" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Name */}
              <h3 className="text-body font-medium text-white truncate group-hover:text-white/90">
                {person.name}
              </h3>

              {/* Handle if available */}
              {person.handle && (
                <p className="text-label-sm text-white/30 truncate">
                  @{person.handle}
                </p>
              )}

              {/* Role */}
              {person.role && (
                <p className="text-label text-white/40 truncate mt-0.5">
                  {person.role}
                </p>
              )}

              {/* Mutual spaces - now with icon for clarity */}
              {person.mutualSpaces && person.mutualSpaces > 0 && (
                <div className="flex items-center gap-1 mt-2 text-white/30">
                  <Users className="w-3 h-3" />
                  <span className="text-label-sm">
                    {person.mutualSpaces} mutual {person.mutualSpaces === 1 ? 'space' : 'spaces'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* View profile affordance - appears on hover */}
          <div className="mt-3 pt-3 border-t border-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-label-sm text-white/40 group-hover:text-white/60">
              View profile →
            </span>
          </div>
        </GlassSurface>
      </Link>
    </motion.div>
  );
}

// ============================================
// SKELETON
// ============================================

function PersonCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
    >
      <div className="flex items-start gap-3">
        {/* Avatar skeleton */}
        <div className="w-12 h-12 rounded-xl bg-white/[0.06] shrink-0 animate-pulse" />

        {/* Info skeleton */}
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-white/[0.06] rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-white/[0.04] rounded animate-pulse" />
          <div className="h-3 w-2/3 bg-white/[0.04] rounded animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}
