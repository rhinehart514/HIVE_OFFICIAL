'use client';

/**
 * /schools — Campus Selection
 * REDESIGNED: Jan 2026
 *
 * Minimal, confident cards:
 * - School logo + name + status badge
 * - Enter or Join waitlist button
 * - No stats, progress bars, or locations
 */

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Logo,
  Button,
  Input,
  Badge,
  Heading,
  MOTION,
  NoiseOverlay,
  GlassSurface,
  GradientText,
  Tilt,
  Skeleton,
} from '@hive/ui/design-system/primitives';
import { ArrowRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

// Premium easing
const EASE = MOTION.ease.premium;

// ============================================
// TYPES
// ============================================

interface School {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
  isActive?: boolean;
  status?: 'active' | 'waitlist' | 'inactive';
}

// ============================================
// FALLBACK DATA
// ============================================

const fallbackSchools: School[] = [
  {
    id: 'test-university',
    name: 'Test University (Development)',
    domain: 'test.edu',
    isActive: true,
  },
  {
    id: 'ub',
    name: 'University at Buffalo',
    domain: 'buffalo.edu',
    isActive: true,
  },
  {
    id: 'stonybrook',
    name: 'Stony Brook University',
    domain: 'stonybrook.edu',
    isActive: false,
  },
  {
    id: 'binghamton',
    name: 'Binghamton University',
    domain: 'binghamton.edu',
    isActive: false,
  },
  {
    id: 'albany',
    name: 'University at Albany',
    domain: 'albany.edu',
    isActive: false,
  },
  {
    id: 'nyu',
    name: 'New York University',
    domain: 'nyu.edu',
    isActive: false,
  },
  {
    id: 'cornell',
    name: 'Cornell University',
    domain: 'cornell.edu',
    isActive: false,
  },
  {
    id: 'columbia',
    name: 'Columbia University',
    domain: 'columbia.edu',
    isActive: false,
  },
  {
    id: 'syracuse',
    name: 'Syracuse University',
    domain: 'syr.edu',
    isActive: false,
  },
  {
    id: 'rochester',
    name: 'University of Rochester',
    domain: 'rochester.edu',
    isActive: false,
  },
];

// ============================================
// SCHOOL CARD — MINIMAL
// ============================================

interface SchoolCardProps {
  school: School;
  index: number;
  onSelect: (school: School) => void;
}

function SchoolCard({ school, index, onSelect }: SchoolCardProps) {
  const isActive = school.isActive;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: EASE,
      }}
    >
      <Tilt intensity={isActive ? 6 : 3}>
        <button
          type="button"
          onClick={() => onSelect(school)}
          className="w-full text-left"
          data-testid={`school-${school.id}`}
        >
          <GlassSurface
            intensity={isActive ? 'standard' : 'subtle'}
            interactive
            className={cn(
              'p-5 rounded-2xl relative overflow-hidden',
              isActive && 'ring-1 ring-[var(--color-gold)]/20'
            )}
          >
            {/* Gold glow for active */}
            {isActive && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,215,0,0.08) 0%, transparent 60%)',
                }}
              />
            )}

            <div className="relative flex items-center gap-4">
              {/* School logo */}
              <div className="flex-shrink-0">
                {school.logoUrl ? (
                  <img
                    src={school.logoUrl}
                    alt={school.name}
                    className="w-12 h-12 rounded-xl object-contain bg-white/5"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center">
                    <span className="text-[18px] font-semibold text-white/40">
                      {school.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* School info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-[16px] font-medium text-white truncate">
                    {school.name}
                  </h3>
                  {isActive ? (
                    <Badge variant="gold" className="text-[10px] uppercase tracking-wider flex-shrink-0">
                      Live
                    </Badge>
                  ) : (
                    <Badge variant="neutral" className="text-[10px] uppercase tracking-wider flex-shrink-0">
                      Coming Soon
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="flex-shrink-0">
                {isActive ? (
                  <motion.div
                    className="flex items-center gap-2 text-[var(--color-gold)]"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-[14px] font-medium">Enter</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <span className="text-[13px] text-white/40">
                    Join waitlist
                  </span>
                )}
              </div>
            </div>
          </GlassSurface>
        </button>
      </Tilt>
    </motion.div>
  );
}

// ============================================
// SEARCH INPUT
// ============================================

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <motion.div
      className="relative max-w-md mx-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
    >
      <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none z-10" />
      <Input
        type="search"
        placeholder="Search universities..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-12 h-12 text-[15px]"
      />
    </motion.div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function SchoolsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch schools
  useEffect(() => {
    async function fetchSchools() {
      try {
        const response = await fetch('/api/schools');
        if (response.ok) {
          const schoolsData = await response.json();
          const formattedSchools = schoolsData
            .filter(
              (school: { name?: string }) => school && school.name
            )
            .map(
              (school: {
                name: string;
                status?: string;
                logoUrl?: string;
                [key: string]: unknown;
              }) => ({
                ...school,
                isActive: school.status === 'active',
              })
            );
          setSchools(formattedSchools);
        } else {
          logger.warn('Failed to fetch schools from API, using fallback', {
            component: 'SchoolsPage',
          });
          setSchools(fallbackSchools);
        }
      } catch (error) {
        logger.error(
          'Error fetching schools',
          { component: 'SchoolsPage' },
          error instanceof Error ? error : undefined
        );
        setSchools(fallbackSchools);
      } finally {
        setLoading(false);
      }
    }

    fetchSchools();
  }, []);

  // Filter schools
  const filteredSchools = useMemo(() => {
    if (!searchTerm.trim()) return schools;
    const q = searchTerm.toLowerCase();
    return schools.filter((s) => s.name.toLowerCase().includes(q));
  }, [schools, searchTerm]);

  // Sort: active first, then alphabetically
  const sortedSchools = useMemo(() => {
    return [...filteredSchools].sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredSchools]);

  const handleSchoolSelect = (school: School) => {
    if (school.isActive) {
      const params = new URLSearchParams({
        schoolId: school.id,
        schoolName: school.name,
        domain: school.domain,
      });
      router.push(`/enter?${params.toString()}`);
    }
    // TODO: Handle waitlist for inactive schools
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0A0A09] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0A0A09] overflow-hidden">
      {/* Noise texture */}
      <NoiseOverlay opacity={0.02} />

      {/* Background gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,215,0,0.04) 0%, transparent 50%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Logo variant="wordmark" size="sm" />
        <Button variant="ghost" size="sm" asChild>
          <a href="/about">About</a>
        </Button>
      </header>

      {/* Hero Section */}
      <div className="relative z-10 pt-12 pb-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <Heading
              level={1}
              className="text-[48px] md:text-[64px] lg:text-[72px] font-bold tracking-tight mb-6"
            >
              Find your{' '}
              <GradientText variant="gold">campus</GradientText>
            </Heading>
          </motion.div>

          <motion.p
            className="text-[18px] md:text-[20px] text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
          >
            Join students building the future of campus life.
          </motion.p>

          {/* Search */}
          <SearchInput value={searchTerm} onChange={setSearchTerm} />
        </div>
      </div>

      {/* Schools Grid */}
      <section className="relative z-10 max-w-2xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[80px] rounded-2xl" />
            ))}
          </div>
        ) : sortedSchools.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <MagnifyingGlassIcon className="w-6 h-6 text-white/30" />
            </div>
            <p className="text-[16px] text-white/60 mb-2">No universities found</p>
            <p className="text-[14px] text-white/40">Try a different search term</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {sortedSchools.map((school, index) => (
                <SchoolCard
                  key={school.id}
                  school={school}
                  index={index}
                  onSelect={handleSchoolSelect}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* CTA for missing schools */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
        >
          <GlassSurface intensity="subtle" className="p-8 rounded-2xl text-center">
            <Heading level={3} className="text-[20px] mb-3">
              Don&apos;t see your university?
            </Heading>
            <p className="text-[15px] text-white/50 mb-6 max-w-md mx-auto">
              We&apos;re expanding to more campuses. Join the waitlist to bring HIVE to your school.
            </p>
            <Button variant="cta" size="lg">
              Join General Waitlist
            </Button>
          </GlassSurface>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <span className="text-[12px] text-white/30">
            © 2026 HIVE. Built by students, for students.
          </span>
          <div className="flex items-center gap-6">
            <a
              href="/about"
              className="text-[12px] text-white/40 hover:text-white/60 transition-colors"
            >
              About
            </a>
            <a
              href="/legal/privacy"
              className="text-[12px] text-white/40 hover:text-white/60 transition-colors"
            >
              Privacy
            </a>
            <a
              href="/legal/terms"
              className="text-[12px] text-white/40 hover:text-white/60 transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
