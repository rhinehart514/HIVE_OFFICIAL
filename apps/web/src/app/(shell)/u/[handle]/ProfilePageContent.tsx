'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Check, Clock, UserMinus, UserPlus,
  Wrench, Calendar, MapPin, Video, Users, ChevronRight, Zap,
} from 'lucide-react';
import {
  ProfileToolModal,
  ReportContentModal,
  toast,
  type ProfileActivityTool,
  type ReportContentInput,
} from '@hive/ui';
import { useProfileByHandle } from './hooks';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function nameGradient(name: string): string {
  const gradients = [
    'from-amber-900/50 to-orange-950',
    'from-violet-900/50 to-purple-950',
    'from-blue-900/50 to-cyan-950',
    'from-emerald-900/50 to-green-950',
    'from-rose-900/50 to-pink-950',
  ];
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % gradients.length;
  return gradients[idx];
}

function timeLabel(startDate: string): string {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMs < 0) return 'Happening now';
  if (diffMin < 60) return `In ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Data fetches
// ─────────────────────────────────────────────────────────────────────────────

async function fetchNextEvent() {
  const res = await fetch('/api/events/personalized?timeRange=this-week&maxItems=5&sort=soonest', { credentials: 'include' });
  if (!res.ok) return null;
  const payload = await res.json();
  const events = (payload.data || payload).events || [];
  return events[0] || null;
}

async function fetchSuggestedSpaces() {
  const res = await fetch('/api/spaces/browse-v2?category=all&sort=trending&limit=3', { credentials: 'include' });
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.data?.spaces || data?.spaces || []).slice(0, 3);
}

// ─────────────────────────────────────────────────────────────────────────────
// Bento Card base
// ─────────────────────────────────────────────────────────────────────────────

function Card({ children, className = '', onClick }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const base = 'rounded-2xl border border-white/[0.06] bg-[#080808] overflow-hidden';
  if (onClick) {
    return (
      <button onClick={onClick} className={`${base} w-full text-left transition-colors hover:border-white/[0.1] hover:bg-white/[0.02] ${className}`}>
        {children}
      </button>
    );
  }
  return <div className={`${base} ${className}`}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Portrait card — identity hero
// ─────────────────────────────────────────────────────────────────────────────

function PortraitCard({ heroUser, heroPresence, isOwnProfile, onEdit, connectionState, isConnectionLoading, onConnect, onAcceptRequest, onUnfriend, onMessage }: {
  heroUser: { fullName: string; handle: string; avatarUrl?: string; bio?: string; major?: string; classYear?: string; campusName?: string };
  heroPresence: { isOnline: boolean };
  isOwnProfile: boolean;
  onEdit: () => void;
  connectionState: string;
  isConnectionLoading: boolean;
  onConnect: () => void;
  onAcceptRequest: (id: string) => void;
  onUnfriend: () => void;
  onMessage: () => void;
}) {
  const [showUnfriendMenu, setShowUnfriendMenu] = React.useState(false);
  const gradient = nameGradient(heroUser.fullName);
  const initial = heroUser.fullName.charAt(0).toUpperCase();
  const infoLine = [heroUser.major, heroUser.classYear, heroUser.campusName].filter(Boolean).join(' · ');

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Portrait — tall image area, identity overlays bottom */}
      <div className={`relative min-h-[360px] flex-1 bg-gradient-to-b ${gradient}`}>
        {heroUser.avatarUrl ? (
          <img src={heroUser.avatarUrl} alt={heroUser.fullName} className="absolute inset-0 w-full h-full object-cover object-top" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-clash text-[140px] font-semibold text-white/10 select-none leading-none">{initial}</span>
          </div>
        )}

        {/* Online pulse */}
        {heroPresence.isOnline && (
          <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFD700] opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#FFD700]" />
          </span>
        )}

        {/* Identity overlay — fades up from bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-12"
          style={{ background: 'linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.7) 60%, transparent 100%)' }}>
          <h1 className="font-clash text-[24px] font-semibold text-white leading-tight">{heroUser.fullName}</h1>
          <p className="font-mono text-[12px] text-white/50 mt-0.5">@{heroUser.handle}</p>
          {heroUser.bio && <p className="text-[13px] text-white/50 mt-1.5 leading-relaxed line-clamp-2">{heroUser.bio}</p>}
          {infoLine && <p className="text-[11px] text-white/30 mt-1">{infoLine}</p>}
        </div>
      </div>

      {/* Actions — below portrait */}
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          {isOwnProfile ? (
            <button onClick={onEdit} className="flex-1 py-2 rounded-xl bg-white/[0.06] text-[13px] font-medium text-white/60 hover:bg-white/[0.09] hover:text-white/80 transition-colors">
              Edit profile
            </button>
          ) : (
            <>
              {connectionState === 'none' && (
                <button onClick={onConnect} disabled={isConnectionLoading} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#FFD700] text-black text-[13px] font-semibold hover:bg-[#FFD700]/90 transition-colors">
                  <UserPlus className="w-3.5 h-3.5" />{isConnectionLoading ? '…' : 'Connect'}
                </button>
              )}
              {connectionState === 'pending_outgoing' && (
                <button disabled className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.06] text-white/40 text-[13px]">
                  <Clock className="w-3.5 h-3.5" />Sent
                </button>
              )}
              {connectionState === 'pending_incoming' && (
                <button onClick={() => onAcceptRequest('')} disabled={isConnectionLoading} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#FFD700] text-black text-[13px] font-semibold">
                  <Check className="w-3.5 h-3.5" />{isConnectionLoading ? '…' : 'Accept'}
                </button>
              )}
              {connectionState === 'friends' && (
                <div className="relative flex-1">
                  <button onClick={() => setShowUnfriendMenu(v => !v)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.06] text-white/50 text-[13px]">
                    <Check className="w-3.5 h-3.5 text-[#FFD700]" />Friends
                  </button>
                  {showUnfriendMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUnfriendMenu(false)} />
                      <div className="absolute bottom-full mb-1 left-0 z-50 min-w-[120px] rounded-xl bg-[#1a1a1a] border border-white/[0.06] shadow-xl">
                        <button onClick={() => { onUnfriend(); setShowUnfriendMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-red-400 hover:bg-white/[0.06]">
                          <UserMinus className="w-3.5 h-3.5" />Unfriend
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <button onClick={onMessage} className="py-2 px-3 rounded-xl bg-white/[0.06] text-white/50 text-[13px] hover:bg-white/[0.09] transition-colors">
                Message
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats card
// ─────────────────────────────────────────────────────────────────────────────

function StatsCard({ toolCount, spaceCount, isOwnProfile, fullWidth }: { toolCount: number; spaceCount: number; isOwnProfile: boolean; fullWidth?: boolean }) {
  const stats = [
    { label: 'Tools built', value: toolCount },
    { label: 'Spaces', value: spaceCount },
  ];

  return (
    <Card className={`flex flex-col justify-between p-5 gap-4${fullWidth ? ' col-span-2' : ''}`}>
      <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-white/25">Activity</p>
      <div className="flex items-end gap-6">
        {stats.map(s => (
          <div key={s.label}>
            <p className="font-clash text-[48px] font-semibold text-white leading-none">{s.value}</p>
            <p className="text-[11px] text-white/35 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      {isOwnProfile && toolCount === 0 && (
        <Link href="/lab" className="flex items-center gap-1.5 text-[12px] text-[#FFD700]/70 hover:text-[#FFD700] transition-colors">
          <Zap className="w-3 h-3" />Build your first tool <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Interests card
// ─────────────────────────────────────────────────────────────────────────────

function InterestsCard({ interests, isOwnProfile }: { interests: string[]; isOwnProfile: boolean }) {
  // Don't render an empty card — wastes real estate
  if (interests.length === 0 && !isOwnProfile) return null;
  if (interests.length === 0) return null; // Even own profile: skip empty card, prompt elsewhere

  return (
    <Card className="flex flex-col p-5 gap-3">
      <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-white/25">Interests</p>
      <div className="flex flex-wrap gap-1.5">
        {interests.slice(0, 8).map(interest => (
          <span key={interest} className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/50">
            {interest}
          </span>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Spaces card
// ─────────────────────────────────────────────────────────────────────────────

function SpacesCard({ spaces, suggestedSpaces, isOwnProfile, onSpaceClick }: {
  spaces: { id: string; name: string; emoji?: string; isLeader?: boolean }[];
  suggestedSpaces: { id: string; name: string; handle?: string; slug?: string; memberCount?: number }[];
  isOwnProfile: boolean;
  onSpaceClick: (id: string) => void;
}) {
  const hasSpaces = spaces.length > 0;

  return (
    <Card className="col-span-2 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-white/25">Spaces</p>
        {hasSpaces && isOwnProfile && (
          <Link href="/spaces" className="text-[11px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
            Browse <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {hasSpaces ? (
        <div className="grid grid-cols-2 gap-2">
          {spaces.slice(0, 4).map(space => (
            <button key={space.id} onClick={() => onSpaceClick(space.id)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left group"
            >
              {space.emoji && <span className="text-base">{space.emoji}</span>}
              <span className="text-[13px] text-white/60 group-hover:text-white/80 transition-colors truncate flex-1">{space.name}</span>
              {space.isLeader && <span className="text-[9px] font-mono text-[#FFD700]/60 uppercase shrink-0">Lead</span>}
              <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/35 shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <div>
          <p className="text-[12px] text-white/25 mb-3">Not in any spaces yet</p>
          {suggestedSpaces.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {suggestedSpaces.map((s: { id: string; name: string; handle?: string; slug?: string; memberCount?: number }) => (
                <Link key={s.id} href={`/s/${s.handle || s.slug || s.id}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition-colors group"
                >
                  <span className="text-[13px] text-white/50 group-hover:text-white/70">{s.name}</span>
                  <span className="text-[11px] text-[#FFD700]/60 font-medium">Join →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Top tool card
// ─────────────────────────────────────────────────────────────────────────────

function TopToolCard({ tool, isOwnProfile, onToolClick }: {
  tool: ProfileActivityTool | null;
  isOwnProfile: boolean;
  onToolClick: (id: string) => void;
}) {
  if (!tool) {
    return (
      <Link href="/lab">
        <Card className="p-4 flex flex-col gap-2 min-h-[140px] hover:border-white/[0.1] transition-colors cursor-pointer">
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-white/25">Top tool</p>
          <div className="flex-1 flex flex-col items-start justify-center py-3">
            <span className="text-2xl mb-2">⚡</span>
            <p className="text-[14px] font-medium text-white/50">Build something</p>
            <p className="text-[12px] text-white/25 mt-0.5">Your best tool lives here</p>
          </div>
          <span className="text-[12px] text-[#FFD700]/60 flex items-center gap-1">Open Lab <ArrowRight className="w-3 h-3" /></span>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="p-5 flex flex-col justify-between min-h-[140px]" onClick={() => onToolClick(tool.id)}>
      <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-white/25">Top tool</p>
      <div>
        <p className="font-clash text-[18px] font-semibold text-white leading-snug">{tool.name}</p>
        {tool.runs > 0 && <p className="text-[12px] text-white/35 mt-0.5">{tool.runs} uses</p>}
      </div>
      <span className="text-[12px] text-white/30 flex items-center gap-1">View tool <ChevronRight className="w-3 h-3" /></span>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Event card
// ─────────────────────────────────────────────────────────────────────────────

function EventCard({ event }: { event: { id: string; title: string; startDate: string; location?: string; isOnline?: boolean; rsvpCount: number; spaceName?: string; spaceHandle?: string; spaceId?: string } | null }) {
  if (!event) {
    return (
      <Link href="/discover">
        <Card className="p-4 flex flex-col justify-between min-h-[140px] hover:border-white/[0.1] transition-colors cursor-pointer">
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-white/25">Upcoming event</p>
          <div>
            <p className="text-[14px] text-white/40 mb-3">No upcoming events</p>
            <span className="text-[12px] text-[#FFD700]/60 flex items-center gap-1">Browse feed <ArrowRight className="w-3.5 h-3.5" /></span>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-white/25 mb-1.5">Upcoming event</p>
          <p className="text-[16px] font-semibold text-white leading-snug truncate">{event.title}</p>
          <div className="flex items-center gap-3 mt-2 text-[12px] text-white/35">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{timeLabel(event.startDate)}</span>
            {event.location && (
              <span className="flex items-center gap-1">
                {event.isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                {event.isOnline ? 'Online' : event.location}
              </span>
            )}
            {event.rsvpCount > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.rsvpCount}</span>}
          </div>
        </div>
        {event.spaceHandle && (
          <Link href={`/s/${event.spaceHandle}`} onClick={e => e.stopPropagation()}
            className="shrink-0 px-3 py-1.5 rounded-full bg-white/[0.05] text-[12px] text-white/40 hover:bg-white/[0.09] hover:text-white/60 transition-colors"
          >
            View
          </Link>
        )}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading / error states
// ─────────────────────────────────────────────────────────────────────────────

function ProfileLoadingState() {
  return (
    <div className="p-6 flex gap-3 animate-pulse">
      <div className="w-[280px] shrink-0 rounded-2xl bg-white/[0.04] min-h-[460px]" />
      <div className="flex-1 grid grid-cols-2 gap-3 content-start">
        <div className="rounded-2xl bg-white/[0.04] h-[160px]" />
        <div className="rounded-2xl bg-white/[0.04] h-[160px]" />
        <div className="col-span-2 rounded-2xl bg-white/[0.04] h-[140px]" />
        <div className="rounded-2xl bg-white/[0.04] h-[120px]" />
        <div className="rounded-2xl bg-white/[0.04] h-[120px]" />
      </div>
    </div>
  );
}

function ProfileNotFoundState({ handle }: { handle: string }) {
  return (
    <div className="flex items-center justify-center py-32 px-6">
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-semibold text-white mb-3">Not found</h1>
        <p className="text-sm text-white/50 mb-6">No one with handle <span className="font-mono">@{handle}</span> exists.</p>
        <Link href="/discover" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.06] text-white/50 text-sm font-medium hover:bg-white/[0.09]">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ProfileErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <p className="text-white/50 mb-4">Couldn't load this profile.</p>
        <button onClick={onRetry} className="px-5 py-2.5 rounded-full bg-[#FFD700] text-black text-sm font-medium">
          Try again
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfilePageContent() {
  const state = useProfileByHandle();
  const [showReportModal, setShowReportModal] = React.useState(false);

  const {
    handle, handleError, profileId, isOwnProfile, isLoading, error,
    profileData, heroUser, heroPresence, profileSpaces, profileTools,
    selectedTool, handleEditProfile, handleToolModalClose,
    handleToolUpdateVisibility, handleToolRemove,
    handleSpaceClick, handleToolClick, interests,
    connectionState, isConnectionLoading,
    handleConnect, handleAcceptRequest, handleUnfriend, handleMessage,
  } = state;

  const { data: nextEvent = null } = useQuery({
    queryKey: ['profile-next-event'],
    queryFn: fetchNextEvent,
    staleTime: 5 * 60_000,
    enabled: isOwnProfile,
  });

  const { data: suggestedSpaces = [] } = useQuery({
    queryKey: ['profile-suggested-spaces'],
    queryFn: fetchSuggestedSpaces,
    staleTime: 10 * 60_000,
    enabled: profileSpaces.length === 0,
  });

  const handleSubmitReport = async (data: ReportContentInput) => {
    const res = await fetch('/api/content/reports', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit report');
    toast.success('Report submitted');
  };

  if (isLoading) return <ProfileLoadingState />;
  if (handleError === 'not_found' || (handleError === 'private' && !isOwnProfile)) return <ProfileNotFoundState handle={handle} />;
  if (handleError === 'error' || error) return <ProfileErrorState onRetry={() => window.location.reload()} />;
  if (!profileData || !heroUser) return <ProfileNotFoundState handle={handle} />;

  // Deduplicate by ID (backend can return dupes from seeded data)
  const uniqueTools = profileTools.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);
  // Also dedup by name — backend seeding can return same-name tools with different IDs
  const seenNames = new Set<string>();
  const dedupedTools = uniqueTools.filter(t => {
    const key = t.name.toLowerCase().trim();
    if (seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });
  const sortedTools = [...dedupedTools].sort((a, b) => (b.runs || 0) - (a.runs || 0));
  const topTool = sortedTools[0] ? {
    id: sortedTools[0].id,
    name: sortedTools[0].name,
    emoji: sortedTools[0].emoji,
    runs: sortedTools[0].runs || 0,
  } : null;

  return (
    <div className="w-full px-6 py-6">
      {/* Bento — flex row: fixed portrait + fluid right grid */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch">

        {/* Left: Portrait — fixed width, stretches to right column height */}
        <div className="md:w-[280px] shrink-0">
          <PortraitCard
            heroUser={heroUser}
            heroPresence={heroPresence}
            isOwnProfile={isOwnProfile}
            onEdit={handleEditProfile}
            connectionState={connectionState}
            isConnectionLoading={isConnectionLoading}
            onConnect={handleConnect}
            onAcceptRequest={handleAcceptRequest}
            onUnfriend={handleUnfriend}
            onMessage={handleMessage}
          />
        </div>

        {/* Right: 2-col grid, fills remaining width */}
        <div className="flex-1 grid grid-cols-2 gap-3 content-start">
          <StatsCard
            toolCount={dedupedTools.length}
            spaceCount={profileSpaces.length}
            isOwnProfile={isOwnProfile}
            fullWidth={interests.length === 0}
          />
          {interests.length > 0 && <InterestsCard interests={interests} isOwnProfile={isOwnProfile} />}
          <SpacesCard
            spaces={profileSpaces}
            suggestedSpaces={suggestedSpaces}
            isOwnProfile={isOwnProfile}
            onSpaceClick={handleSpaceClick}
          />
          <EventCard event={nextEvent} />
          <TopToolCard tool={topTool} isOwnProfile={isOwnProfile} onToolClick={handleToolClick} />
        </div>
      </div>

      {/* Tools — clean list, top 6, no icons */}
      {sortedTools.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-white/25">Tools</p>
            {isOwnProfile && (
              <Link href="/lab" className="text-[11px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
                Open Lab <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          <Card className="divide-y divide-white/[0.04]">
            {sortedTools.slice(0, 6).map(tool => (
              <button key={tool.id} onClick={() => handleToolClick(tool.id)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors group text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-1 h-5 rounded-full bg-[#FFD700]/40 shrink-0" />
                  <span className="text-[14px] font-medium text-white/80 group-hover:text-white transition-colors truncate">{tool.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {tool.runs > 0 && <span className="text-[12px] font-mono text-white/25">{tool.runs} uses</span>}
                  <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/40 transition-colors" />
                </div>
              </button>
            ))}
          </Card>
        </div>
      )}

      {/* Report (non-own profiles) */}
      {!isOwnProfile && (
        <div className="flex justify-end mt-4">
          <button onClick={() => setShowReportModal(true)} className="text-[12px] text-white/20 hover:text-white/40 transition-colors">
            Report profile
          </button>
        </div>
      )}

      <ProfileToolModal
        tool={selectedTool}
        isOpen={!!selectedTool}
        onClose={handleToolModalClose}
        onUpdateVisibility={isOwnProfile ? handleToolUpdateVisibility : undefined}
        onRemove={isOwnProfile ? handleToolRemove : undefined}
        isOwner={isOwnProfile}
      />

      <ReportContentModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        contentId={profileId || ''}
        contentType="profile"
        authorName={heroUser?.fullName}
        onSubmit={handleSubmitReport}
      />
    </div>
  );
}
