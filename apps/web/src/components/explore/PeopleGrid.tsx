'use client';

/**
 * PeopleGrid - Grid of people for discovery
 *
 * Shows classmates, mutual connections, and interesting people.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { GlassSurface, SimpleAvatar, Badge, MOTION } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

export interface PersonData {
  id: string;
  name: string;
  avatarUrl?: string;
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
  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <PersonCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (people.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        className="text-center py-16"
      >
        <p className="text-white/40 text-[15px] mb-2">
          {searchQuery
            ? `No people match "${searchQuery}"`
            : 'No people to show'}
        </p>
        <p className="text-white/25 text-[13px]">
          Join spaces to connect with others
        </p>
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
            'p-4 rounded-xl transition-all duration-200 text-center',
            'border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.02]'
          )}
        >
          {/* Avatar */}
          <div className="relative inline-block mb-3">
            <SimpleAvatar
              src={person.avatarUrl}
              fallback={person.name?.charAt(0) || '?'}
              size="lg"
            />
            {person.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[var(--life-gold)] border-2 border-[var(--bg-ground)]" />
            )}
          </div>

          {/* Name */}
          <h3 className="text-[14px] font-medium text-white truncate">
            {person.name}
          </h3>

          {/* Role */}
          {person.role && (
            <p className="text-[12px] text-white/40 truncate mt-0.5">
              {person.role}
            </p>
          )}

          {/* Mutual spaces */}
          {person.mutualSpaces && person.mutualSpaces > 0 && (
            <Badge variant="neutral" size="sm" className="mt-2">
              {person.mutualSpaces} mutual
            </Badge>
          )}
        </GlassSurface>
      </Link>
    </motion.div>
  );
}

// ============================================
// SKELETON
// ============================================

function PersonCardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse text-center">
      <div className="w-16 h-16 rounded-xl bg-white/[0.06] mx-auto mb-3" />
      <div className="h-4 w-20 bg-white/[0.06] rounded mx-auto mb-1" />
      <div className="h-3 w-16 bg-white/[0.04] rounded mx-auto" />
    </div>
  );
}
