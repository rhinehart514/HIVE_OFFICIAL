'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Search,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import { useAuth } from '@hive/auth-logic';
import { useCampusMode } from '@/hooks/use-campus-mode';

interface DiningLocationStatus {
  isOpen?: boolean;
  minutesUntilClose?: number;
  currentMealPeriod?: string;
  location?: {
    id?: string;
    name?: string;
  };
}

interface StudyBuilding {
  id?: string;
  name?: string;
  noiseLevel?: string;
  availableStudySpaceCount?: number;
  walkingTime?: number;
  isOpen?: boolean;
}

interface PersonalizedEvent {
  id: string;
  title: string;
  startDate: string;
  spaceName?: string;
  location?: string;
  relevanceScore?: number;
}

interface ToolSummary {
  id?: string;
  toolId?: string;
  name?: string;
  description?: string;
  deploymentCount?: number;
}

interface SpaceSummary {
  id: string;
  name?: string;
  description?: string;
  memberCount?: number;
  slug?: string;
  handle?: string;
  claimed?: boolean;
  ownerName?: string;
}

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'space' | 'tool' | 'person' | 'event' | 'post';
  url: string;
}

interface CampusDiscoverData {
  openNowDining: DiningLocationStatus[];
  studySpots: StudyBuilding[];
  personalizedEvents: PersonalizedEvent[];
  trendingTools: ToolSummary[];
  spacesToJoin: SpaceSummary[];
}

interface NonCampusDiscoverData {
  trendingTools: ToolSummary[];
  publicSpaces: SpaceSummary[];
  featuredTools: ToolSummary[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Failed request: ${url}`);
  }
  const payload = await response.json();
  return (payload.data || payload) as T;
}

async function fetchTrendingTools(limit = 8): Promise<ToolSummary[]> {
  try {
    const recommendations = await fetchJson<{ trending?: ToolSummary[] }>(
      `/api/tools/recommendations?limit=${limit}`
    );
    if (Array.isArray(recommendations.trending) && recommendations.trending.length > 0) {
      return recommendations.trending;
    }
  } catch {
    // Fallback below
  }

  try {
    const browse = await fetchJson<{ tools?: ToolSummary[] }>(
      `/api/tools/browse?limit=${limit}`
    );
    return browse.tools || [];
  } catch {
    return [];
  }
}

async function fetchCampusDiscoverData(): Promise<CampusDiscoverData> {
  const [dining, buildings, events, spaces, tools] = await Promise.allSettled([
    fetchJson<{ locations?: DiningLocationStatus[] }>('/api/campus/dining?openNow=true&sortBy=closing-soon'),
    fetchJson<{ buildings?: StudyBuilding[] }>('/api/campus/buildings?goodForStudying=true&sortBy=study-spaces'),
    fetchJson<{ events?: PersonalizedEvent[] }>('/api/events/personalized?timeRange=this-week&maxItems=8'),
    fetchJson<{ recommendations?: SpaceSummary[] }>('/api/spaces/recommended?limit=8'),
    fetchTrendingTools(8),
  ]);

  return {
    openNowDining: dining.status === 'fulfilled' ? (dining.value.locations || []) : [],
    studySpots: buildings.status === 'fulfilled' ? (buildings.value.buildings || []) : [],
    personalizedEvents: events.status === 'fulfilled' ? (events.value.events || []) : [],
    trendingTools: tools.status === 'fulfilled' ? tools.value : [],
    spacesToJoin: spaces.status === 'fulfilled' ? (spaces.value.recommendations || []) : [],
  };
}

async function fetchNonCampusDiscoverData(): Promise<NonCampusDiscoverData> {
  const [tools, spaces] = await Promise.allSettled([
    fetchTrendingTools(10),
    fetchJson<{ spaces?: SpaceSummary[] }>('/api/spaces/browse-v2?sort=trending&limit=10'),
  ]);

  const resolvedTools = tools.status === 'fulfilled' ? tools.value : [];
  return {
    trendingTools: resolvedTools,
    publicSpaces: spaces.status === 'fulfilled' ? (spaces.value.spaces || []) : [],
    featuredTools: resolvedTools.slice(0, 3),
  };
}

async function fetchSearchResults(query: string): Promise<SearchResult[]> {
  const response = await fetchJson<{ results?: SearchResult[] }>(
    `/api/search?q=${encodeURIComponent(query)}&limit=8`
  );
  return response.results || [];
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="text-xs text-white/30">{subtitle}</p>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { hasCampus } = useCampusMode();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/enter?redirect=/discover');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-white/[0.06] border-t-[#FFD700] animate-spin" />
      </div>
    );
  }
  const trimmedSearch = searchQuery.trim();

  const campusDiscover = useQuery({
    queryKey: ['discover', 'campus'],
    queryFn: fetchCampusDiscoverData,
    enabled: hasCampus,
    staleTime: 60_000,
  });

  const nonCampusDiscover = useQuery({
    queryKey: ['discover', 'non-campus'],
    queryFn: fetchNonCampusDiscoverData,
    enabled: !hasCampus,
    staleTime: 60_000,
  });

  const searchResultsQuery = useQuery({
    queryKey: ['discover-search', trimmedSearch],
    queryFn: () => fetchSearchResults(trimmedSearch),
    enabled: trimmedSearch.length >= 2,
    staleTime: 20_000,
  });

  const discoverData = useMemo(
    () => (hasCampus ? campusDiscover.data : nonCampusDiscover.data),
    [hasCampus, campusDiscover.data, nonCampusDiscover.data]
  );

  const isLoading = hasCampus ? campusDiscover.isLoading : nonCampusDiscover.isLoading;
  const hasError = false; // Sections degrade independently; no global error banner
  const searchResults = searchResultsQuery.data || [];

  return (
    <div className="min-h-screen w-full bg-[var(--bg-ground)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <header className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white md:text-3xl">Discover</h1>
              <p className="text-sm text-white/50">
                {hasCampus ? 'Live campus intel + events + tools' : 'Trending tools and communities'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/feed"
                className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.06] px-3 py-1 text-xs text-white/50 transition-colors hover:bg-white/[0.1] hover:text-white/70"
              >
                <Users className="h-3 w-3" />
                Activity
              </Link>
              <span className="rounded-full border border-white/[0.06] bg-white/[0.06] px-3 py-1 text-xs text-white/50">
                {hasCampus ? 'Campus Mode' : 'Community Mode'}
              </span>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tools, spaces, events, and people"
              className="h-11 w-full rounded-[16px] border border-white/[0.06] bg-white/[0.06] pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/[0.15]"
            />
          </div>

          {trimmedSearch.length >= 2 && (
            <div className="mt-3 rounded-[16px] border border-white/[0.06] bg-white/[0.04] p-2">
              {searchResultsQuery.isLoading && (
                <div className="px-2 py-2 text-xs text-white/30">Searching…</div>
              )}
              {!searchResultsQuery.isLoading && searchResults.length === 0 && (
                <div className="px-2 py-2 text-xs text-white/30">No results</div>
              )}
              {!searchResultsQuery.isLoading && searchResults.length > 0 && (
                <div className="space-y-1">
                  {searchResults.map((result) => (
                    <Link
                      key={`${result.type}-${result.id}`}
                      href={result.url}
                      className="block rounded-[16px] px-2 py-2 hover:bg-white/[0.06]"
                    >
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm text-white">{result.title}</p>
                        <span className="ml-3 shrink-0 text-[11px] uppercase tracking-wide text-white/50">
                          {result.type}
                        </span>
                      </div>
                      {result.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-white/30">
                          {result.description}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </header>

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-36 rounded-[16px] border border-white/[0.06] bg-white/[0.06]"
              />
            ))}
          </div>
        )}

        {hasError && (
          <div className="rounded-[16px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            Failed to load discover data. Please refresh.
          </div>
        )}

        {!isLoading && !hasError && hasCampus && discoverData && (
          <div className="space-y-6">
            <section className="rounded-[16px] border border-white/[0.06] bg-white/[0.06] p-4">
              <SectionTitle
                title="Open Now"
                subtitle="Dining locations that are currently open"
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(discoverData as CampusDiscoverData).openNowDining.slice(0, 6).map((entry, index) => (
                  <div key={`${entry.location?.id || entry.location?.name || index}`} className="rounded-[16px] border border-white/[0.06] bg-white/[0.04] p-3">
                    <p className="text-sm font-medium text-white">{entry.location?.name || 'Dining Hall'}</p>
                    <p className="text-xs text-white/50">
                      {entry.isOpen ? `Closes in ${entry.minutesUntilClose || '--'} min` : 'Closed'}
                    </p>
                    {entry.currentMealPeriod && (
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-white/50">{entry.currentMealPeriod}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[16px] border border-white/[0.06] bg-white/[0.06] p-4">
              <SectionTitle
                title="Study Spots"
                subtitle="Best places to focus right now"
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(discoverData as CampusDiscoverData).studySpots.slice(0, 6).map((building, index) => (
                  <div key={`${building.id || building.name || index}`} className="rounded-[16px] border border-white/[0.06] bg-white/[0.04] p-3">
                    <p className="text-sm font-medium text-white">{building.name || 'Campus Building'}</p>
                    <p className="text-xs text-white/50">
                      Noise: {building.noiseLevel || 'mixed'}
                    </p>
                    <p className="text-xs text-white/30">
                      {building.availableStudySpaceCount || 0} study spaces
                      {building.walkingTime ? ` · ${building.walkingTime} min walk` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[16px] border border-white/[0.06] bg-white/[0.06] p-4">
              <SectionTitle
                title="Happening This Week"
                subtitle="Events ranked for you"
              />
              <div className="space-y-2">
                {(discoverData as CampusDiscoverData).personalizedEvents.slice(0, 6).map((event) => (
                  <div key={event.id} className="rounded-[16px] border border-white/[0.06] bg-white/[0.04] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{event.title}</p>
                        <p className="text-xs text-white/50">
                          {new Date(event.startDate).toLocaleString()} {event.spaceName ? `· ${event.spaceName}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-white/30">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {Math.round(event.relevanceScore || 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.06] p-4">
                <SectionTitle
                  title="Trending Tools"
                  subtitle="Most active tools right now"
                />
                <div className="space-y-2">
                  {(discoverData as CampusDiscoverData).trendingTools.slice(0, 6).map((tool, index) => {
                    const toolId = tool.toolId || tool.id;
                    return (
                      <Link
                        key={`${toolId || index}`}
                        href={toolId ? `/t/${toolId}` : '/lab'}
                        className="block rounded-[16px] border border-white/[0.06] bg-white/[0.04] p-3 hover:bg-white/[0.06]"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">{tool.name || 'Untitled tool'}</p>
                          <Wrench className="h-4 w-4 text-white/30" />
                        </div>
                        {tool.description && (
                          <p className="mt-1 line-clamp-1 text-xs text-white/30">{tool.description}</p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.06] p-4">
                <SectionTitle
                  title="Spaces to Join"
                  subtitle="Recommended communities"
                />
                <div className="space-y-2">
                  {(discoverData as CampusDiscoverData).spacesToJoin.slice(0, 6).map((space) => {
                    const routeKey = space.slug || space.handle || space.id;
                    const isClaimed = space.claimed ?? (space.memberCount || 0) > 2;
                    return (
                      <Link
                        key={space.id}
                        href={`/s/${routeKey}`}
                        className="block rounded-[16px] border border-white/[0.06] bg-white/[0.04] p-3 hover:bg-white/[0.06]"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">{space.name || 'Untitled space'}</p>
                          {isClaimed ? (
                            <Users className="h-4 w-4 text-white/30" />
                          ) : (
                            <span className="shrink-0 rounded-full bg-[var(--life-gold,#FFD700)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--life-gold,#FFD700)]">
                              Claim
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-white/30">
                          {isClaimed
                            ? ((space.memberCount || 0) > 0 ? `${space.memberCount} members` : 'Be the first to join')
                            : 'No leader yet — claim this space'}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {!isLoading && !hasError && !hasCampus && discoverData && (
          <div className="space-y-6">
            <section className="rounded-[16px] border border-white/[0.06] bg-white/[0.06] p-4">
              <SectionTitle
                title="Trending Tools"
                subtitle="Popular public tools"
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(discoverData as NonCampusDiscoverData).trendingTools.slice(0, 8).map((tool, index) => {
                  const toolId = tool.toolId || tool.id;
                  return (
                    <Link
                      key={`${toolId || index}`}
                      href={toolId ? `/t/${toolId}` : '/lab'}
                      className="rounded-[16px] border border-white/[0.06] bg-white/[0.04] p-3 hover:bg-white/[0.06]"
                    >
                      <p className="text-sm font-medium text-white">{tool.name || 'Untitled tool'}</p>
                      {tool.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-white/30">{tool.description}</p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[16px] border border-white/[0.06] bg-white/[0.06] p-4">
              <SectionTitle
                title="Public Spaces"
                subtitle="Communities open to join"
              />
              <div className="space-y-2">
                {(discoverData as NonCampusDiscoverData).publicSpaces.slice(0, 8).map((space) => {
                  const routeKey = space.slug || space.handle || space.id;
                  const isClaimed = space.claimed ?? (space.memberCount || 0) > 2;
                  return (
                    <Link
                      key={space.id}
                      href={`/s/${routeKey}`}
                      className="block rounded-[16px] border border-white/[0.06] bg-white/[0.04] p-3 hover:bg-white/[0.06]"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white">{space.name || 'Untitled space'}</p>
                        {isClaimed ? (
                          <ArrowRight className="h-4 w-4 text-white/30" />
                        ) : (
                          <span className="shrink-0 rounded-full bg-[var(--life-gold,#FFD700)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--life-gold,#FFD700)]">
                            Claim
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-white/30">
                        {isClaimed
                          ? (space.description || ((space.memberCount || 0) > 0 ? `${space.memberCount} members` : 'Be the first to join'))
                          : 'No leader yet — claim this space'}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[16px] border border-white/[0.06] bg-white/[0.06] p-4">
              <SectionTitle
                title="Featured Tools"
                subtitle="Editor picks"
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {(discoverData as NonCampusDiscoverData).featuredTools.map((tool, index) => {
                  const toolId = tool.toolId || tool.id;
                  return (
                    <Link
                      key={`${toolId || index}`}
                      href={toolId ? `/t/${toolId}` : '/lab'}
                      className="rounded-[16px] border border-white/[0.06] bg-white/[0.04] p-3 hover:bg-white/[0.06]"
                    >
                      <div className="mb-2 flex items-center gap-1 text-[11px] uppercase tracking-wide text-[#FFD700]">
                        <Sparkles className="h-3.5 w-3.5" />
                        Featured
                      </div>
                      <p className="text-sm font-medium text-white">{tool.name || 'Untitled tool'}</p>
                      {tool.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-white/30">{tool.description}</p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {!isLoading && !hasError && (
          <footer className="mt-8 flex items-center gap-2 text-xs text-white/50">
            <Clock3 className="h-3.5 w-3.5" />
            Live data from campus and discovery APIs
          </footer>
        )}
      </div>
    </div>
  );
}
