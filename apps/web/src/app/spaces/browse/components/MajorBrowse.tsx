'use client';

/**
 * MajorBrowse
 * Browse spaces by academic major, grouped by school
 * User's major is prominently featured first
 */

import * as React from 'react';
import { ChevronDown, ChevronRight, GraduationCap, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
  motion,
  MOTION,
  RevealSection,
} from '@hive/ui/design-system/primitives';
import { SpaceBrowseCard, FeaturedSpaceCard } from './SpaceBrowseCard';

interface MajorBrowseProps {
  searchQuery?: string;
}

interface SpaceDTO {
  id: string;
  name: string;
  slug?: string;
  handle?: string;
  description?: string;
  avatarUrl?: string;
  memberCount?: number;
  isMember?: boolean;
  isVerified?: boolean;
  category?: string;
  upcomingEventCount?: number;
  nextEvent?: { title: string; startAt: string };
}

interface BrowseResponse {
  category: string;
  userMajor: {
    space: SpaceDTO;
    majorName: string;
    school: string;
  } | null;
  sections: Array<{
    name: string;
    spaces: SpaceDTO[];
  }>;
  copy: {
    hero: string;
    fragment: string;
  };
  totalCount: number;
}

export function MajorBrowse({ searchQuery }: MajorBrowseProps) {
  const [data, setData] = React.useState<BrowseResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [expandedSchools, setExpandedSchools] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ category: 'major' });
        if (searchQuery) params.set('q', searchQuery);

        const res = await fetch(`/api/spaces/browse?${params}`);
        const json = await res.json();
        setData(json);

        // Auto-expand first school
        if (json.sections && json.sections.length > 0) {
          setExpandedSchools(new Set([json.sections[0].name]));
        }
      } catch (error) {
        logger.error('Failed to fetch major browse data', { component: 'MajorBrowse' }, error instanceof Error ? error : undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery]);

  const toggleSchool = (schoolName: string) => {
    setExpandedSchools((prev) => {
      const next = new Set(prev);
      if (next.has(schoolName)) {
        next.delete(schoolName);
      } else {
        next.add(schoolName);
      }
      return next;
    });
  };

  if (loading) {
    return <MajorBrowseSkeleton />;
  }

  if (!data) {
    return (
      <RevealSection>
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-6">
            <BookOpen size={24} className="text-white/40" />
          </div>
          <h3 className="text-title-sm font-medium text-white/80 mb-2">
            Couldn&apos;t load majors
          </h3>
          <p className="text-body text-white/40 max-w-md mx-auto mb-6">
            We had trouble loading academic spaces. This might be a temporary issue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-white/[0.06] text-white/60 hover:bg-white/[0.08] hover:text-white/80 transition-colors text-body"
          >
            Try again
          </button>
        </div>
      </RevealSection>
    );
  }

  // Filter sections based on search
  const filteredSections = searchQuery
    ? data.sections.filter((section) => section.spaces.length > 0)
    : data.sections;

  const hasNoResults = filteredSections.length === 0 && !data.userMajor;

  return (
    <div className="space-y-12">
      {/* User's Major - Featured */}
      {data.userMajor && (
        <RevealSection className="mb-16">
          <div className="mb-6">
            <span className="text-body-sm font-medium text-white/40 uppercase tracking-wider">
              Your field
            </span>
          </div>
          <FeaturedSpaceCard
            space={data.userMajor.space}
            label={data.userMajor.majorName}
          />
        </RevealSection>
      )}

      {/* All Schools */}
      {filteredSections.length > 0 && (
        <RevealSection delay={0.2}>
          <div className="mb-8">
            <span className="text-body-sm font-medium text-white/40 uppercase tracking-wider">
              Every discipline
            </span>
          </div>

          <div className="space-y-4">
            {filteredSections.map((section, sectionIndex) => {
              const isExpanded = expandedSchools.has(section.name);

              return (
                <motion.div
                  key={section.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: MOTION.duration.base,
                    delay: MOTION.stagger.base + sectionIndex * MOTION.stagger.tight,
                    ease: MOTION.ease.premium,
                  }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(255,255,255,0.02)',
                  }}
                >
                  {/* School Header */}
                  <button
                    onClick={() => toggleSchool(section.name)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-body font-medium text-white/80">
                        {section.name}
                      </span>
                      <span className="text-label text-white/30 bg-white/[0.04] px-2 py-0.5 rounded-full">
                        {section.spaces.length}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-white/30" />
                    ) : (
                      <ChevronRight size={18} className="text-white/30" />
                    )}
                  </button>

                  {/* School Spaces */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
                      className="px-4 pb-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                        {section.spaces.map((space, index) => (
                          <SpaceBrowseCard
                            key={space.id}
                            space={space}
                            index={index}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </RevealSection>
      )}

      {/* No Results */}
      {hasNoResults && (
        <RevealSection>
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-6">
              <GraduationCap size={24} className="text-white/40" />
            </div>
            <h3 className="text-title-sm font-medium text-white/80 mb-2">
              {searchQuery ? 'No results' : 'No majors yet'}
            </h3>
            <p className="text-body text-white/40 max-w-md mx-auto">
              {searchQuery
                ? `No academic spaces found matching "${searchQuery}"`
                : 'Academic spaces will appear here as they join HIVE.'}
            </p>
          </div>
        </RevealSection>
      )}
    </div>
  );
}

function MajorBrowseSkeleton() {
  return (
    <div className="space-y-12">
      {/* Featured skeleton */}
      <div className="space-y-4">
        <motion.div
          className="h-4 w-24 rounded bg-white/[0.02]"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: MOTION.ease.smooth }}
        />
        <motion.div
          className="h-48 rounded-2xl bg-white/[0.02]"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.1, ease: MOTION.ease.smooth }}
        />
      </div>

      {/* Schools skeleton */}
      <div className="space-y-4">
        <motion.div
          className="h-4 w-32 rounded bg-white/[0.02]"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2, ease: MOTION.ease.smooth }}
        />
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="h-16 rounded-2xl bg-white/[0.02]"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.3 + i * 0.1,
              ease: MOTION.ease.smooth,
            }}
          />
        ))}
      </div>
    </div>
  );
}
