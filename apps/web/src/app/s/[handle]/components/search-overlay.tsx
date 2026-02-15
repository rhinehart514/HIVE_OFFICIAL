'use client';

/**
 * SearchOverlay - Cmd+K search within a space
 * Searches messages, members, events, and tools
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MessageSquare, User, Calendar, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { durationSeconds, easingArrays } from '@hive/tokens';

interface SearchResult {
  id: string;
  type: 'message' | 'member' | 'event' | 'tool';
  title: string;
  subtitle?: string;
  timestamp?: string;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  spaceHandle: string;
}

const TYPE_ICONS = {
  message: MessageSquare,
  member: User,
  event: Calendar,
  tool: Wrench,
};

export function SearchOverlay({ isOpen, onClose, spaceId, spaceHandle }: SearchOverlayProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const navigateToResult = React.useCallback((result: SearchResult) => {
    onClose();
    switch (result.type) {
      case 'member':
        router.push(`/u/${result.id}`);
        break;
      case 'event':
        router.push(`/s/${spaceHandle}?event=${result.id}`);
        break;
      case 'tool':
        router.push(`/s/${spaceHandle}/tools/${result.id}`);
        break;
      case 'message':
      default:
        router.push(`/s/${spaceHandle}?message=${result.id}`);
        break;
    }
  }, [onClose, router, spaceHandle]);

  // Focus input on open
  React.useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Search with debounce
  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/spaces/${spaceId}/search?q=${encodeURIComponent(query)}&limit=10`,
          { credentials: 'include' }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch {
        // Silent fail for search
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, spaceId]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        navigateToResult(results[selectedIndex]);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durationSeconds.quick }}
            onClick={onClose}
          />

          {/* Search Panel */}
          <motion.div
            className="fixed top-[20vh] left-1/2 -translate-x-1/2 w-full max-w-lg z-50 px-4"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{
              duration: durationSeconds.standard,
              ease: easingArrays.default,
            }}
          >
            <div className="bg-[var(--bg-surface)] border border-white/[0.06] rounded-lg overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 border-b border-white/[0.06]">
                <Search className="w-4 h-4 text-white/50 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search messages, members, events..."
                  className="flex-1 h-12 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 rounded-md hover:bg-white/[0.06] text-white/50 hover:text-white/50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-white/50 bg-white/[0.06] border border-white/[0.06]">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              {query.trim() && (
                <div className="max-h-[50vh] overflow-y-auto py-2">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-4 h-4 border-2 border-white/[0.06] border-t-white/50 rounded-full " />
                    </div>
                  ) : results.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <p className="text-sm text-white/50">No results for &ldquo;{query}&rdquo;</p>
                      <p className="text-xs text-white/50 mt-1">Try different keywords</p>
                    </div>
                  ) : (
                    results.map((result, index) => {
                      const Icon = TYPE_ICONS[result.type] || MessageSquare;
                      return (
                        <button
                          key={result.id}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                            index === selectedIndex
                              ? 'bg-white/[0.06]'
                              : 'hover:bg-white/[0.06]'
                          )}
                          onMouseEnter={() => setSelectedIndex(index)}
                          onClick={() => navigateToResult(result)}
                        >
                          <Icon className="w-4 h-4 text-white/50 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{result.title}</p>
                            {result.subtitle && (
                              <p className="text-xs text-white/50 truncate">{result.subtitle}</p>
                            )}
                          </div>
                          {result.timestamp && (
                            <span className="text-xs text-white/50 flex-shrink-0">{result.timestamp}</span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* Footer hint */}
              {!query.trim() && (
                <div className="px-4 py-3 border-t border-white/[0.06]">
                  <p className="text-xs text-white/50">
                    Search messages, members, events, and tools in this space
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
