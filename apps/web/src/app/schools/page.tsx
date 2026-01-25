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

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
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
  onRequest: (school: School) => void;
}

function SchoolCard({ school, index, onSelect, onRequest }: SchoolCardProps) {
  const isActive = school.isActive;

  const handleClick = () => {
    if (isActive) {
      onSelect(school);
    } else {
      onRequest(school);
    }
  };

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
          onClick={handleClick}
          className="w-full text-left"
          data-testid={`school-${school.id}`}
        >
          <GlassSurface
            intensity={isActive ? 'standard' : 'subtle'}
            interactive
            className="p-5 rounded-2xl relative overflow-hidden"
          >
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
                    <span className="text-title-sm font-semibold text-white/40">
                      {school.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* School info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-body-lg font-medium text-white truncate">
                    {school.name}
                  </h3>
                  {isActive ? (
                    <Badge variant="gold" className="text-label-xs uppercase tracking-wider flex-shrink-0">
                      Live
                    </Badge>
                  ) : (
                    <Badge variant="neutral" className="text-label-xs uppercase tracking-wider flex-shrink-0">
                      Coming Soon
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="flex-shrink-0">
                {isActive ? (
                  <motion.div
                    className="flex items-center gap-2 text-white"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-body font-medium">Enter</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <span className="text-body-sm text-white/50 hover:text-white/70 transition-colors">
                    Request access
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
        className="pl-12 h-12 text-body"
      />
    </motion.div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

// ============================================
// REQUEST MODAL
// ============================================

interface RequestModalProps {
  school: School | null;
  onClose: () => void;
  onSubmit: (email: string) => void;
}

function RequestModal({ school, onClose, onSubmit }: RequestModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!school) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setSubmitted(true);
    onSubmit(email);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <GlassSurface intensity="standard" className="p-6 rounded-2xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5 text-white/40" />
          </button>

          {submitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-4">
                <span className="text-title">✓</span>
              </div>
              <Heading level={3} className="text-title mb-2">
                You're on the list
              </Heading>
              <p className="text-body text-white/50">
                We'll notify you when {school.name} goes live.
              </p>
            </div>
          ) : (
            <>
              <Heading level={3} className="text-title mb-2 pr-8">
                Request access to {school.name}
              </Heading>
              <p className="text-body text-white/50 mb-6">
                Enter your email and we'll let you know when it's available.
              </p>

              <form onSubmit={handleSubmit}>
                <Input
                  type="email"
                  placeholder="your@email.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mb-4"
                  autoFocus
                />
                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  className="w-full"
                  disabled={!email.trim() || isSubmitting}
                  loading={isSubmitting}
                >
                  {isSubmitting ? 'Requesting...' : 'Request Access'}
                </Button>
              </form>
            </>
          )}
        </GlassSurface>
      </motion.div>
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
  const [requestSchool, setRequestSchool] = useState<School | null>(null);

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

  const handleSchoolSelect = useCallback((school: School) => {
    const params = new URLSearchParams({
      schoolId: school.id,
      schoolName: school.name,
      domain: school.domain,
    });
    router.push(`/enter?${params.toString()}`);
  }, [router]);

  const handleRequestSchool = useCallback((school: School) => {
    setRequestSchool(school);
  }, []);

  const handleRequestSubmit = useCallback((email: string) => {
    // TODO: Send to API
    logger.info('School access requested', {
      component: 'SchoolsPage',
      schoolId: requestSchool?.id,
      email,
    });
    // Close modal after brief delay to show success
    setTimeout(() => setRequestSchool(null), 2000);
  }, [requestSchool]);

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
              className="text-display-sm md:text-display-lg lg:text-display-lg font-bold tracking-tight mb-6"
            >
              Find your{' '}
              <GradientText variant="gold">campus</GradientText>
            </Heading>
          </motion.div>

          <motion.p
            className="text-title-sm md:text-title text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed"
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
            <p className="text-body-lg text-white/60 mb-2">No universities found</p>
            <p className="text-body text-white/40">Try a different search term</p>
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
                  onRequest={handleRequestSchool}
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
            <Heading level={3} className="text-title mb-3">
              Don&apos;t see your university?
            </Heading>
            <p className="text-body text-white/50 mb-6 max-w-md mx-auto">
              We&apos;re expanding to more campuses. Request access to bring HIVE to your school.
            </p>
            <Button variant="default" size="lg">
              Request Your School
            </Button>
          </GlassSurface>
        </motion.div>
      </section>

      {/* Request Modal */}
      <AnimatePresence>
        {requestSchool && (
          <RequestModal
            school={requestSchool}
            onClose={() => setRequestSchool(null)}
            onSubmit={handleRequestSubmit}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <span className="text-label text-white/30">
            © 2026 HIVE. Built by students, for students.
          </span>
          <div className="flex items-center gap-6">
            <a
              href="/about"
              className="text-label text-white/40 hover:text-white/60 transition-colors"
            >
              About
            </a>
            <a
              href="/legal/privacy"
              className="text-label text-white/40 hover:text-white/60 transition-colors"
            >
              Privacy
            </a>
            <a
              href="/legal/terms"
              className="text-label text-white/40 hover:text-white/60 transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
