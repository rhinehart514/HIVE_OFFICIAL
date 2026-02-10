'use client';

/**
 * PeopleGrid - Grid of people for discovery
 *
 * Shows classmates, mutual connections, and interesting people.
 * Enhanced with mutual space context and interaction affordances.
 * Uses stagger container for orchestrated reveals.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, Search, UserPlus } from 'lucide-react';
import { SimpleAvatar, Badge, Button } from '@hive/ui/design-system/primitives';
import { MOTION } from '@hive/tokens';
import { cn } from '@/lib/utils';

export interface PersonData {
  id: string;
  name: string;
  avatarUrl?: string;
  handle?: string;
  role?: string;
  mutualSpaces?: number;
  isOnline?: boolean;
  isConnected?: boolean;
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

  // Empty state with helpful guidance
  if (people.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.standard, ease: MOTION.ease.premium }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <div
         
          className="p-8 rounded-lg max-w-md w-full text-center"
        >
          {/* Icon */}
          <motion.div
            className="w-14 h-14 rounded-lg bg-white/[0.06] flex items-center justify-center mx-auto mb-5"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {searchQuery ? (
              <Search className="w-6 h-6 text-white/50" />
            ) : (
              <UserPlus className="w-6 h-6 text-white/50" />
            )}
          </motion.div>

          {/* Title */}
          <motion.h3
            className="text-body-lg font-medium text-white mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.15 }}
          >
            {searchQuery
              ? `No one matches "${searchQuery}"`
              : 'Find your people'}
          </motion.h3>

          {/* Subtitle */}
          <motion.p
            className="text-body-sm text-white/50 mb-6 max-w-xs mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.2 }}
          >
            {searchQuery
              ? 'Try adjusting your search or filters to find more classmates'
              : 'Join spaces to discover people with shared interests. The more you participate, the more connections you\'ll make.'}
          </motion.p>

          {/* Actions */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.25 }}
          >
            <Button variant="default" size="sm" asChild>
              <Link href="/discover?tab=spaces">
                <Users className="w-4 h-4 mr-1.5" />
                Browse Spaces
              </Link>
            </Button>
            {searchQuery && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/discover?tab=people">Clear Search</Link>
              </Button>
            )}
          </motion.div>

          {/* Helpful hint */}
          {!searchQuery && (
            <motion.p
              className="text-label text-white/25 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.3 }}
            >
              Tip: Filter by major or year to find classmates
            </motion.p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      initial="initial"
      animate="animate"
    >
      {people.map((person) => (
        <PersonCard key={person.id} person={person} />
      ))}
    </motion.div>
  );
}

// ============================================
// PERSON CARD
// ============================================

interface PersonCardProps {
  person: PersonData;
}

function PersonCard({ person }: PersonCardProps) {
  return (
    <motion.div
      whileHover="hover"
      initial="initial"
    >
      <Link href={`/profile/${person.id}`}>
        <motion.div>
          <div
           
            className={cn(
              'group p-4 rounded-lg transition-colors duration-200',
              'border border-white/[0.06] hover:border-white/[0.06]'
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
                {/* Name + Connection Badge */}
                <div className="flex items-center gap-2">
                  <h3 className="text-body font-medium text-white truncate group-hover:text-white">
                    {person.name}
                  </h3>
                  {person.isConnected && (
                    <Badge variant="success" size="sm" className="shrink-0 text-[10px] px-1.5 py-0.5">
                      Connected
                    </Badge>
                  )}
                  {!person.isConnected && person.mutualSpaces && person.mutualSpaces > 0 && (
                    <Badge variant="neutral" size="sm" className="shrink-0 text-[10px] px-1.5 py-0.5 bg-[var(--life-gold)]/10 text-[var(--life-gold)]">
                      Mutual
                    </Badge>
                  )}
                </div>

                {/* Handle if available */}
                {person.handle && (
                  <p className="text-label-sm text-white/50 truncate">
                    @{person.handle}
                  </p>
                )}

                {/* Role */}
                {person.role && (
                  <p className="text-label text-white/50 truncate mt-0.5">
                    {person.role}
                  </p>
                )}

                {/* Mutual spaces - now with icon for clarity */}
                {person.mutualSpaces && person.mutualSpaces > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-white/50">
                    <Users className="w-3 h-3" />
                    <span className="text-label-sm">
                      {person.mutualSpaces} mutual {person.mutualSpaces === 1 ? 'space' : 'spaces'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* View profile affordance - appears on hover */}
            <div className="mt-3 pt-3 border-t border-white/[0.06] opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-label-sm text-white/50 group-hover:text-white/50">
                View profile →
              </span>
            </div>
          </div>
        </motion.div>
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
      className="p-4 rounded-lg bg-white/[0.06] border border-white/[0.06]"
    >
      <div className="flex items-start gap-3">
        {/* Avatar skeleton */}
        <div className="w-12 h-12 rounded-lg bg-white/[0.06] shrink-0" />

        {/* Info skeleton */}
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-white/[0.06] rounded" />
          <div className="h-3 w-1/2 bg-white/[0.06] rounded" />
          <div className="h-3 w-2/3 bg-white/[0.06] rounded" />
        </div>
      </div>
    </motion.div>
  );
}
