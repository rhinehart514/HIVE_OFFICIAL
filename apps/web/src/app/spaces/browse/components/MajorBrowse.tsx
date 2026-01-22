'use client';

/**
 * MajorBrowse
 * Browse spaces by academic major, grouped by school
 * User's major is prominently featured first
 */

import * as React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
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
        console.error('Failed to fetch major browse data:', error);
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
      <div className="text-center py-16">
        <p className="text-white/40">Failed to load major spaces</p>
      </div>
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
            <span className="text-[13px] font-medium text-white/40 uppercase tracking-wider">
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
            <span className="text-[13px] font-medium text-white/40 uppercase tracking-wider">
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
                    duration: 0.5,
                    delay: 0.1 + sectionIndex * 0.05,
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
                      <span className="text-[15px] font-medium text-white/80">
                        {section.name}
                      </span>
                      <span className="text-[12px] text-white/30 bg-white/[0.04] px-2 py-0.5 rounded-full">
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
                      transition={{ duration: 0.3, ease: MOTION.ease.premium }}
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
        <div className="text-center py-16">
          <p className="text-white/40">
            {searchQuery
              ? `No majors found matching "${searchQuery}"`
              : 'No major spaces available yet'}
          </p>
        </div>
      )}
    </div>
  );
}

function MajorBrowseSkeleton() {
  return (
    <div className="space-y-12">
      {/* Featured skeleton */}
      <div className="space-y-4">
        <div className="h-4 w-24 rounded bg-white/[0.02] animate-pulse" />
        <div className="h-48 rounded-2xl bg-white/[0.02] animate-pulse" />
      </div>

      {/* Schools skeleton */}
      <div className="space-y-4">
        <div className="h-4 w-32 rounded bg-white/[0.02] animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-white/[0.02] animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
