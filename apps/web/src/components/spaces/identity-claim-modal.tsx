'use client';

/**
 * IdentityClaimModal - Modal for claiming identity spaces
 *
 * Allows users to search and select a space to claim as their
 * residential, major, or Greek identity.
 *
 * @version 1.0.0 - Spaces Hub redesign (Jan 2026)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  HomeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  Text,
  SimpleAvatar,
  Button,
  Skeleton,
} from '@hive/ui/design-system/primitives';
import { toast } from '@hive/ui';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import type { IdentityType } from './identity-cards';

// ============================================================
// Types
// ============================================================

interface SearchResult {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  memberCount: number;
  category: string;
}

interface IdentityClaimModalProps {
  type: IdentityType | null;
  isOpen: boolean;
  onClose: () => void;
  onClaim: (type: IdentityType, spaceId: string) => Promise<void>;
}

// ============================================================
// Config
// ============================================================

const MODAL_CONFIG: Record<
  IdentityType,
  {
    title: string;
    description: string;
    searchPlaceholder: string;
    icon: React.ComponentType<{ className?: string }>;
    category: string; // API category filter
  }
> = {
  residential: {
    title: 'Claim Your Dorm',
    description: 'Select your residential hall to connect with neighbors',
    searchPlaceholder: 'Search dorms...',
    icon: HomeIcon,
    category: 'residential',
  },
  major: {
    title: 'Claim Your Major',
    description: 'Select your academic department',
    searchPlaceholder: 'Search majors...',
    icon: AcademicCapIcon,
    category: 'academics',
  },
  greek: {
    title: 'Claim Your Chapter',
    description: 'Select your Greek organization (if affiliated)',
    searchPlaceholder: 'Search organizations...',
    icon: UserGroupIcon,
    category: 'greek',
  },
};

// ============================================================
// Hardcoded Options (for residential and major)
// ============================================================

const _RESIDENTIAL_OPTIONS = [
  'Ellicott Complex',
  'Governors Complex',
  'Greiner Hall',
  'Hadley Village',
  'South Lake Village',
  'Flint Village',
  'Creekside Village',
  'Fargo Quadrangle',
  'Red Jacket Quadrangle',
  'Richmond Quadrangle',
  'Spaulding Quadrangle',
];

const _MAJOR_OPTIONS = [
  'Computer Science',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Business Administration',
  'Psychology',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'English',
  'History',
  'Political Science',
  'Economics',
  'Sociology',
  'Communication',
  'Nursing',
  'Pharmacy',
  'Architecture',
  'Art',
  'Music',
  'Theater',
  'Film Studies',
  'Environmental Science',
  'Geography',
  'Anthropology',
  'Philosophy',
];

// ============================================================
// Search Result Row
// ============================================================

function SearchResultRow({
  space,
  onSelect,
  isSelected,
}: {
  space: SearchResult;
  onSelect: () => void;
  isSelected?: boolean;
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
      whileTap={{ opacity: 0.8 }}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3',
        'text-left',
        'transition-colors duration-150',
        isSelected && 'bg-white/[0.06]'
      )}
    >
      <SimpleAvatar
        src={space.avatarUrl}
        fallback={space.name.substring(0, 2)}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <Text weight="medium" className="text-white truncate">
          {space.name}
        </Text>
        <Text size="xs" className="text-white/50">
          {space.memberCount.toLocaleString()} members
        </Text>
      </div>
      {isSelected && (
        <CheckIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
      )}
    </motion.button>
  );
}

// ============================================================
// Main Component
// ============================================================

export function IdentityClaimModal({
  type,
  isOpen,
  onClose,
  onClaim,
}: IdentityClaimModalProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedSpace, setSelectedSpace] = React.useState<SearchResult | null>(null);
  const [claiming, setClaiming] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setResults([]);
      setSelectedSpace(null);
      // Focus search input
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, type]);

  // Fetch spaces on search or load hardcoded options
  React.useEffect(() => {
    if (!isOpen || !type) return;

    const fetchSpaces = async () => {
      setLoading(true);
      try {
        const config = MODAL_CONFIG[type];
        const res = await secureApiFetch(
          `/api/spaces/browse-v2?category=${config.category}&limit=50`,
          { method: 'GET' }
        );
        const data = await res.json();
        const spaces = data?.data?.spaces || data?.spaces || [];

        // Transform to SearchResult format
        const transformedResults: SearchResult[] = spaces.map((s: {
          id: string;
          name: string;
          description?: string;
          bannerImage?: string;
          iconURL?: string;
          memberCount?: number;
          category?: string;
        }) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          avatarUrl: s.iconURL || s.bannerImage,
          memberCount: s.memberCount || 0,
          category: s.category || config.category,
        }));

        setResults(transformedResults);
      } catch {
        toast.error('Failed to load options', 'Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, [isOpen, type]);

  // Filter results by search query
  const filteredResults = React.useMemo(() => {
    if (!searchQuery.trim()) return results;
    const query = searchQuery.toLowerCase();
    return results.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query)
    );
  }, [results, searchQuery]);

  // Handle claim
  const handleClaim = async () => {
    if (!selectedSpace || !type) return;

    setClaiming(true);
    try {
      await onClaim(type, selectedSpace.id);
      onClose();
    } catch {
      toast.error('Failed to claim', 'Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  if (!type) return null;

  const config = MODAL_CONFIG[type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 "
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'fixed z-50',
              'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-full max-w-md',
              'bg-[var(--bg-surface)] border border-white/[0.06]',
              'rounded-lg',
              'overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/[0.06]">
                  <Icon className="w-5 h-5 text-white/50" />
                </div>
                <div>
                  <Text weight="semibold" className="text-white">
                    {config.title}
                  </Text>
                  <Text size="xs" className="text-white/50">
                    {config.description}
                  </Text>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-white/50 hover:text-white/50 hover:bg-white/[0.06] transition-colors"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={config.searchPlaceholder}
                  className={cn(
                    'w-full bg-white/[0.06] border border-white/[0.06]',
                    'rounded-lg py-2.5 pl-9 pr-4',
                    'text-sm text-white placeholder:text-white/50',
                    'focus:outline-none focus:ring-2 focus:ring-white/50'
                  )}
                />
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="py-12 text-center">
                  <Text className="text-white/50">
                    {searchQuery ? 'No results found' : 'No options available'}
                  </Text>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {filteredResults.map((space) => (
                    <SearchResultRow
                      key={space.id}
                      space={space}
                      onSelect={() => setSelectedSpace(space)}
                      isSelected={selectedSpace?.id === space.id}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/[0.06] bg-white/[0.06]">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="solid"
                size="sm"
                onClick={handleClaim}
                disabled={!selectedSpace || claiming}
              >
                {claiming ? 'Claiming...' : 'Claim Identity'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default IdentityClaimModal;
