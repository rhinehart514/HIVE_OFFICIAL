'use client';

/**
 * SearchCommand — Cmd+K search palette
 *
 * Opens on Cmd+K or via the search button in AppSidebar.
 * Calls /api/search?q=... with debounce, groups results by type,
 * navigates on click.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Search, Users, Calendar, Box, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types (mirrors /api/search response)
// ─────────────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'space' | 'tool' | 'person' | 'event' | 'post';
  category: string;
  url: string;
  metadata?: Record<string, unknown>;
  relevanceScore: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_META: Record<SearchResult['type'], { label: string; icon: typeof Search }> = {
  space: { label: 'Spaces', icon: Users },
  person: { label: 'People', icon: Users },
  event: { label: 'Events', icon: Calendar },
  tool: { label: 'Apps', icon: Box },
  post: { label: 'Posts', icon: FileText },
};

const TYPE_ORDER: SearchResult['type'][] = ['space', 'person', 'event', 'tool', 'post'];

// ─────────────────────────────────────────────────────────────────────────────
// Hook: debounced search
// ─────────────────────────────────────────────────────────────────────────────

function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback((q: string) => {
    setQuery(q);

    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (!q || q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=20`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        if (!controller.signal.aborted) {
          setResults(data.results ?? []);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
  }, []);

  const reset = useCallback(() => {
    setQuery('');
    setResults([]);
    setLoading(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return { query, results, loading, search, reset };
}

// ─────────────────────────────────────────────────────────────────────────────
// Group results by type
// ─────────────────────────────────────────────────────────────────────────────

function groupResults(results: SearchResult[]) {
  const groups = new Map<SearchResult['type'], SearchResult[]>();
  for (const r of results) {
    if (!groups.has(r.type)) groups.set(r.type, []);
    groups.get(r.type)!.push(r);
  }
  return TYPE_ORDER.filter((t) => groups.has(t)).map((t) => ({
    type: t,
    ...TYPE_META[t],
    items: groups.get(t)!,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const { query, results, loading, search, reset } = useSearch();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard: Cmd+K to open/close
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Custom event from sidebar search button
  useEffect(() => {
    function onOpenSearch() {
      setOpen(true);
    }
    window.addEventListener('hive:open-search', onOpenSearch);
    return () => window.removeEventListener('hive:open-search', onOpenSearch);
  }, []);

  // Reset state when closing
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function navigate(url: string) {
    setOpen(false);
    reset();
    router.push(url);
  }

  const grouped = groupResults(results);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/70 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'duration-150',
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed z-50 focus:outline-none',
            // Mobile: full-width sheet from bottom
            'inset-x-0 bottom-0 top-auto',
            'max-h-[85vh] rounded-t-2xl',
            // Desktop: centered modal
            'sm:inset-auto sm:left-[50%] sm:top-[15%] sm:translate-x-[-50%] sm:translate-y-0',
            'sm:w-full sm:max-w-xl sm:rounded-2xl sm:max-h-[60vh]',
            // Surface
            'bg-black/90 backdrop-blur-2xl border border-white/[0.08]',
            'flex flex-col overflow-hidden',
            // Animation
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4',
            'sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0',
            'sm:data-[state=closed]:zoom-out-[0.98] sm:data-[state=open]:zoom-in-[0.98]',
            'duration-200',
          )}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search for spaces, people, events, and apps across campus.
          </DialogPrimitive.Description>

          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
            <Search className="h-[18px] w-[18px] shrink-0 text-white/30" strokeWidth={1.5} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => search(e.target.value)}
              placeholder="Search spaces, people, events, apps..."
              className={cn(
                'flex-1 bg-transparent text-[15px] text-white placeholder:text-white/30',
                'font-sans outline-none',
              )}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-sans text-white/30">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-none py-2">
            {/* Loading state */}
            {loading && query.length >= 2 && (
              <div className="flex items-center justify-center py-8">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
              </div>
            )}

            {/* Empty state */}
            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 px-4">
                <span className="text-sm text-white/30 font-sans">Nothing matching &quot;{query}&quot;</span>
                <span className="text-[13px] text-white/30 font-sans">Try a space name, person, or app type</span>
              </div>
            )}

            {/* Idle state */}
            {!loading && query.length < 2 && (
              <div className="flex flex-col items-center gap-2 py-10 px-4">
                <span className="text-sm text-white/30 font-sans">Search spaces, people, and apps across UB</span>
              </div>
            )}

            {/* Grouped results */}
            {!loading && grouped.map((group) => (
              <div key={group.type}>
                <div className="flex items-center gap-2 px-4 py-1.5">
                  <span className="text-[10px] uppercase tracking-label text-white/30 font-sans font-medium">
                    {group.label}
                  </span>
                </div>
                {group.items.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => navigate(result.url)}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-2.5 text-left',
                      'hover:bg-white/[0.04] transition-colors duration-100',
                      'group',
                    )}
                  >
                    <ResultIcon type={result.type} metadata={result.metadata} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-sans font-medium text-white/70 group-hover:text-white/90 truncate transition-colors">
                        {result.title}
                      </p>
                      {result.description && (
                        <p className="text-[11px] font-sans text-white/30 truncate mt-0.5">
                          {result.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-white/30 group-hover:text-white/50 shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Result icon — initial in glassy circle (matches sidebar aesthetic)
// ─────────────────────────────────────────────────────────────────────────────

function ResultIcon({ type, metadata }: { type: SearchResult['type']; metadata?: Record<string, unknown> }) {
  const letter = type === 'person'
    ? ((metadata?.handle as string)?.[0] || 'P').toUpperCase()
    : type === 'space'
    ? 'S'
    : type === 'event'
    ? 'E'
    : type === 'tool'
    ? 'A'
    : 'P';

  return (
    <span
      className="flex items-center justify-center shrink-0 rounded-lg text-white/50 border border-white/[0.08] font-sans font-semibold text-[11px]"
      style={{
        width: 28,
        height: 28,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
      }}
    >
      {letter}
    </span>
  );
}
