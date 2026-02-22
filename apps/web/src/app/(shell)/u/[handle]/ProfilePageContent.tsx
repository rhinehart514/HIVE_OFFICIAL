'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Check, Clock, UserMinus, UserPlus,
  Wrench, Calendar, MapPin, Video, Users, ChevronRight, Zap,
  Share2, Camera, Hammer, Compass, Sparkles,
} from 'lucide-react';
import {
  ProfileToolModal,
  ReportContentModal,
  toast,
  type ProfileActivityTool,
  type ReportContentInput,
} from '@hive/ui';
import type { ActivityContribution, ProfileConnection } from '@hive/ui';
import { useProfileByHandle } from './hooks';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const EASE_PREMIUM: [number, number, number, number] = [0.22, 1, 0.36, 1];

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
  const base = 'rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden';
  if (onClick) {
    return (
      <motion.button
        onClick={onClick}
        className={`${base} w-full text-left transition-colors hover:border-white/[0.1] hover:bg-white/[0.02] ${className}`}
        whileHover={{ opacity: 0.97 }}
        whileTap={{ opacity: 0.92 }}
        transition={{ duration: 0.15, ease: EASE_PREMIUM }}
      >
        {children}
      </motion.button>
    );
  }
  return (
    <motion.div
      className={`${base} ${className}`}
      whileHover={{ opacity: 0.97 }}
      transition={{ duration: 0.15, ease: EASE_PREMIUM }}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Completeness Ring
// ─────────────────────────────────────────────────────────────────────────────

function CompletenessRing({ heroUser, interests, spaceCount, toolCount }: {
  heroUser: { avatarUrl?: string; bio?: string };
  interests: string[];
  spaceCount: number;
  toolCount: number;
}) {
  const score = (heroUser.avatarUrl ? 20 : 0)
    + (heroUser.bio ? 20 : 0)
    + (interests.length > 0 ? 20 : 0)
    + (spaceCount > 0 ? 20 : 0)
    + (toolCount > 0 ? 20 : 0);

  if (score >= 100) return null;

  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="absolute top-3 left-3 flex items-center gap-1.5">
      <svg width="36" height="36" viewBox="0 0 36 36" className="rotate-[-90deg]">
        <circle cx="18" cy="18" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
        <motion.circle
          cx="18" cy="18" r={radius} fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: EASE_PREMIUM, delay: 0.3 }}
        />
      </svg>
      <span className="text-[10px] text-white/30 font-medium">{score}%</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Portrait card
// ─────────────────────────────────────────────────────────────────────────────

function PortraitCard({ heroUser, heroPresence, isOwnProfile, onEdit, onShare, connectionState, isConnectionLoading, onConnect, onAcceptRequest, onUnfriend, onMessage, isBuilder, completenessProps }: {
  heroUser: { fullName: string; handle: string; avatarUrl?: string; bio?: string; major?: string; classYear?: string; campusName?: string };
  heroPresence: { isOnline: boolean };
  isOwnProfile: boolean;
  onEdit: () => void;
  onShare: () => void;
  connectionState: string;
  isConnectionLoading: boolean;
  onConnect: () => void;
  onAcceptRequest: (id: string) => void;
  onUnfriend: () => void;
  onMessage: () => void;
  isBuilder: boolean;
  completenessProps?: { interests: string[]; spaceCount: number; toolCount: number };
}) {
  const [showUnfriendMenu, setShowUnfriendMenu] = React.useState(false);
  const gradient = nameGradient(heroUser.fullName);
  const initial = heroUser.fullName.charAt(0).toUpperCase();
  const infoLine = [heroUser.major, heroUser.classYear, heroUser.campusName].filter(Boolean).join(' · ');

  return (
    <Card className="flex flex-col overflow-hidden h-full">
      <div className={`relative min-h-[360px] flex-1 bg-gradient-to-b ${gradient}`}>
        {heroUser.avatarUrl ? (
          <img src={heroUser.avatarUrl} alt={heroUser.fullName} className="absolute inset-0 w-full h-full object-cover object-top" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
            <span className="font-clash text-[140px] font-semibold text-white/10 select-none leading-none">{initial}</span>
            {isOwnProfile && (
              <motion.button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.1] text-[11px] text-white/50 hover:bg-white/[0.12] hover:text-white/70 transition-colors"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3, ease: EASE_PREMIUM }}
              >
                <Camera className="w-3 h-3" />Add photo
              </motion.button>
            )}
          </div>
        )}

        {isOwnProfile && completenessProps && (
          <CompletenessRing heroUser={heroUser} {...completenessProps} />
        )}

        {heroPresence.isOnline && (
          <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFD700] opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#FFD700]" />
          </span>
        )}

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-12"
          style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.7) 60%, transparent 100%)' }}>
          <h1 className="font-clash text-[24px] font-semibold text-white leading-tight">{heroUser.fullName}</h1>
          <p className="font-sans text-[12px] text-white/50 mt-0.5">@{heroUser.handle}</p>
          {isBuilder && (
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-[10px] font-medium text-amber-400">
              <Hammer className="w-2.5 h-2.5" />Builder
            </span>
          )}
          {heroUser.bio && <p className="text-[13px] text-white/50 mt-1.5 leading-relaxed line-clamp-2">{heroUser.bio}</p>}
          {infoLine && <p className="text-[11px] text-white/30 mt-1">{infoLine}</p>}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          {isOwnProfile ? (
            <>
              <button onClick={onEdit} className="flex-1 py-2 rounded-xl bg-white/[0.06] text-[13px] font-medium text-white/60 hover:bg-white/[0.09] hover:text-white/80 transition-colors">
                Edit profile
              </button>
              <button onClick={onShare} className="py-2 px-2.5 rounded-xl bg-white/[0.06] text-white/40 hover:bg-white/[0.09] hover:text-white/60 transition-colors" aria-label="Share profile">
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </>
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
              <button onClick={onShare} className="py-2 px-2.5 rounded-xl bg-white/[0.06] text-white/40 hover:bg-white/[0.09] hover:text-white/60 transition-colors" aria-label="Share profile">
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats card — warm gradient bg when user has activity
// ─────────────────────────────────────────────────────────────────────────────

function StatsCard({ toolCount, spaceCount, connectionCount, isOwnProfile }: {
  toolCount: number;
  spaceCount: number;
  connectionCount: number;
  isOwnProfile: boolean;
}) {
  const hasActivity = toolCount > 0 || spaceCount > 0;
  const stats = [
    { label: 'Tools', value: toolCount },
    { label: 'Spaces', value: spaceCount },
    { label: 'Connections', value: connectionCount },
  ];

  return (
    <Card className={`relative flex flex-col justify-between p-5 gap-3 ${hasActivity ? '' : ''}`}>
      {/* Subtle warm glow when active */}
      {hasActivity && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/[0.03] to-transparent pointer-events-none" />
      )}
      <p className="text-[11px] font-sans uppercase tracking-[0.15em] text-white/25 relative">Stats</p>
      <div className="flex items-end gap-5 relative">
        {stats.map(s => (
          <div key={s.label}>
            <p className={`font-clash text-[36px] font-semibold leading-none ${s.value > 0 ? 'text-white' : 'text-white/20'}`}>{s.value}</p>
            <p className="text-[11px] text-white/35 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      {isOwnProfile && toolCount === 0 && (
        <Link href="/lab" className="flex items-center gap-1.5 text-[12px] text-[#FFD700]/70 hover:text-[#FFD700] transition-colors relative">
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
  if (interests.length === 0 && !isOwnProfile) return null;
  if (interests.length === 0) return null;

  return (
    <Card className="flex flex-col p-5 gap-3">
      <p className="text-[11px] font-sans uppercase tracking-[0.15em] text-white/25">Interests</p>
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
// Connections Card — ghost avatars when empty
// ─────────────────────────────────────────────────────────────────────────────

function ConnectionsCard({ connections, totalConnections, mutualFriendsCount, isOwnProfile }: {
  connections: ProfileConnection[];
  totalConnections: number;
  mutualFriendsCount: number;
  isOwnProfile: boolean;
}) {
  if (totalConnections === 0 && !isOwnProfile) return null;

  if (totalConnections === 0 && isOwnProfile) {
    return (
      <Card className="relative p-4 flex flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.04] to-transparent pointer-events-none" />
        <p className="text-[11px] font-sans uppercase tracking-[0.15em] text-white/25 relative mb-3">Connections</p>
        <div className="relative">
          {/* Ghost avatar previews — shows what this card becomes */}
          <div className="flex -space-x-2 mb-3">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] bg-white/[0.04]" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </div>
          <p className="text-[13px] text-white/40 mb-0.5">Find your people</p>
          <p className="text-[11px] text-white/20 mb-2">Connect with classmates on campus</p>
          <Link href="/discover" className="inline-flex items-center gap-1 text-[11px] text-[#FFD700]/60 hover:text-[#FFD700] transition-colors">
            Discover <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-sans uppercase tracking-[0.15em] text-white/25">Connections</p>
        <Link href={isOwnProfile ? '/me/connections' : '#'} className="text-[11px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-0.5">
          See all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {connections.slice(0, 4).map((conn, i) => (
            <div key={conn.id} className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] overflow-hidden bg-white/[0.06]" style={{ zIndex: 4 - i }}>
              {conn.avatarUrl ? (
                <img src={conn.avatarUrl} alt={conn.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-white/40">
                  {conn.fullName.charAt(0)}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-white/70">{totalConnections}</p>
          <p className="text-[11px] text-white/30">
            {mutualFriendsCount > 0 ? `${mutualFriendsCount} mutual` : 'connections'}
          </p>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Spaces card — gradient warmth when empty
// ─────────────────────────────────────────────────────────────────────────────

function SpacesCard({ spaces, suggestedSpaces, isOwnProfile, onSpaceClick }: {
  spaces: { id: string; name: string; emoji?: string; isLeader?: boolean }[];
  suggestedSpaces: { id: string; name: string; handle?: string; slug?: string; memberCount?: number }[];
  isOwnProfile: boolean;
  onSpaceClick: (id: string) => void;
}) {
  const hasSpaces = spaces.length > 0;

  return (
    <Card className="col-span-2 relative overflow-hidden">
      {/* Warm gradient for empty own-profile */}
      {!hasSpaces && isOwnProfile && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] to-transparent pointer-events-none" />
      )}
      <div className="p-4 relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-sans uppercase tracking-[0.15em] text-white/25">Spaces</p>
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
                {space.isLeader && <span className="text-[9px] font-sans text-[#FFD700]/60 uppercase shrink-0">Lead</span>}
                <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/35 shrink-0" />
              </button>
            ))}
          </div>
        ) : isOwnProfile ? (
          <div className="flex items-center gap-4">
            {/* Ghost space cards preview */}
            <div className="flex gap-2">
              {['🎭', '📚', '⚡'].map((emoji, i) => (
                <div key={i} className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center" style={{ opacity: 1 - i * 0.2 }}>
                  <span className="text-sm opacity-40">{emoji}</span>
                </div>
              ))}
            </div>
            <div className="flex-1">
              <p className="text-[13px] text-white/40">Join your first space</p>
              <p className="text-[11px] text-white/20">Where your campus community lives</p>
            </div>
            <Link href="/spaces" className="inline-flex items-center gap-1 text-[11px] text-[#FFD700]/60 hover:text-[#FFD700] transition-colors shrink-0">
              Browse <ArrowRight className="w-3 h-3" />
            </Link>
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
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity Timeline Strip
// ─────────────────────────────────────────────────────────────────────────────

function ActivityStrip({ contributions, currentStreak }: {
  contributions: ActivityContribution[];
  currentStreak: number;
}) {
  if (contributions.length === 0) return null;

  const now = new Date();
  const dayMap = new Map<string, number>();
  for (const c of contributions) {
    dayMap.set(c.date, c.count);
  }

  const cells: { date: string; count: number }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, count: dayMap.get(key) || 0 });
  }

  function intensityClass(count: number): string {
    if (count === 0) return 'bg-white/[0.04]';
    if (count <= 2) return 'bg-white/[0.12]';
    if (count <= 5) return 'bg-white/[0.25]';
    if (count <= 10) return 'bg-[#FFD700]/35';
    return 'bg-[#FFD700]/80';
  }

  return (
    <Card className="col-span-2 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/[0.02] to-transparent pointer-events-none" />
      <div className="flex items-center justify-between mb-3 relative">
        <p className="text-[11px] font-sans uppercase tracking-[0.15em] text-white/25">Activity</p>
        {currentStreak > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-[#FFD700]/70">
            <Zap className="w-3 h-3" />{currentStreak} day streak
          </span>
        )}
      </div>
      <div className="grid grid-cols-12 gap-[3px] relative">
        {Array.from({ length: 12 }, (_, col) => (
          <div key={col} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }, (_, row) => {
              const idx = col * 7 + row;
              const cell = cells[idx];
              if (!cell) return <div key={row} className="w-full aspect-square rounded-[2px]" />;
              return (
                <motion.div
                  key={row}
                  className={`w-full aspect-square rounded-[2px] ${intensityClass(cell.count)}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.003, duration: 0.2 }}
                  title={`${cell.date}: ${cell.count} contributions`}
                />
              );
            })}
          </div>
        ))}
      </div>
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
    if (!isOwnProfile) return null;
    return (
      <Link href="/lab">
        <Card className="relative p-5 flex flex-col justify-between min-h-[140px] hover:border-white/[0.1] transition-colors cursor-pointer overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] to-transparent pointer-events-none" />
          <p className="text-[11px] font-sans uppercase tracking-[0.15em] text-white/25 relative">Top tool</p>
          <div className="relative flex-1 flex flex-col justify-center">
            <span className="text-2xl mb-2">⚡</span>
            <p className="text-[13px] font-medium text-white/50">Build something</p>
            <p className="text-[11px] text-white/20 mt-0.5">Your best tool lives here</p>
          </div>
          <span className="text-[11px] text-[#FFD700]/60 flex items-center gap-1 relative">Open Lab <ArrowRight className="w-3 h-3" /></span>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="relative p-5 flex flex-col justify-between min-h-[140px] overflow-hidden" onClick={() => onToolClick(tool.id)}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/[0.03] to-transparent pointer-events-none" />
      <p className="text-[11px] font-sans uppercase tracking-[0.15em] text-white/25 relative">Top tool</p>
      <div className="relative">
        {tool.emoji && <span className="text-xl mb-1 block">{tool.emoji}</span>}
        <p className="font-clash text-[18px] font-semibold text-white leading-snug">{tool.name}</p>
        {tool.runs > 0 && <p className="text-[12px] text-[#FFD700]/50 mt-0.5">{tool.runs} uses</p>}
      </div>
      <span className="text-[12px] text-white/30 flex items-center gap-1 relative">View tool <ChevronRight className="w-3 h-3" /></span>
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
        <Card className="relative p-4 flex flex-col justify-between min-h-[140px] hover:border-white/[0.1] transition-colors cursor-pointer overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] to-transparent pointer-events-none" />
          <p className="text-[11px] font-sans uppercase tracking-[0.15em] text-white/25 relative">Upcoming event</p>
          <div className="relative">
            <Calendar className="w-5 h-5 text-white/15 mb-2" />
            <p className="text-[13px] text-white/40 mb-1">No upcoming events</p>
            <span className="text-[11px] text-[#FFD700]/60 flex items-center gap-1">Browse feed <ArrowRight className="w-3 h-3" /></span>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="relative p-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-transparent pointer-events-none" />
      <div className="flex items-start justify-between gap-4 relative">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-sans uppercase tracking-[0.15em] text-white/25 mb-1.5">Upcoming event</p>
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
// Tool Row with Hover Preview
// ─────────────────────────────────────────────────────────────────────────────

function ToolRow({ tool, onClick }: {
  tool: { id: string; name: string; emoji?: string; description?: string; runs: number };
  onClick: () => void;
}) {
  const [showPreview, setShowPreview] = React.useState(false);
  const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isTouchDevice] = React.useState(() =>
    typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );

  const handleMouseEnter = () => {
    if (isTouchDevice) return;
    hoverTimerRef.current = setTimeout(() => setShowPreview(true), 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setShowPreview(false);
  };

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors group text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-1 h-5 rounded-full bg-[#FFD700]/40 shrink-0" />
          <span className="text-[14px] font-medium text-white/80 group-hover:text-white transition-colors truncate">{tool.name}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {tool.runs > 0 && <span className="text-[12px] font-sans text-white/25">{tool.runs} uses</span>}
          <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/40 transition-colors" />
        </div>
      </button>

      <AnimatePresence>
        {showPreview && (tool.description || tool.emoji) && (
          <motion.div
            className="absolute right-0 top-0 z-30 w-56 p-3 rounded-xl bg-[#141414] border border-white/[0.08] shadow-2xl pointer-events-none hidden md:block"
            style={{ transform: 'translateX(calc(100% + 8px))' }}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15, ease: EASE_PREMIUM }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {tool.emoji && <span className="text-base">{tool.emoji}</span>}
              <p className="text-[13px] font-medium text-white/80 truncate">{tool.name}</p>
            </div>
            {tool.description && (
              <p className="text-[11px] text-white/40 leading-relaxed line-clamp-3">{tool.description}</p>
            )}
            {tool.runs > 0 && (
              <p className="text-[10px] text-white/25 mt-2">{tool.runs} total uses</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading / error states
// ─────────────────────────────────────────────────────────────────────────────

function ProfileLoadingState() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-6 pb-24 md:pb-8 animate-pulse">
      <div className="flex flex-col md:flex-row gap-3 items-stretch">
        <div className="md:w-[280px] shrink-0">
          <div className="rounded-2xl bg-white/[0.04] min-h-[460px] flex flex-col overflow-hidden">
            <div className="flex-1 min-h-[360px]" />
            <div className="px-4 py-3 border-t border-white/[0.04]">
              <div className="h-9 rounded-xl bg-white/[0.04]" />
            </div>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3 content-start">
          <div className="rounded-2xl bg-white/[0.04] p-5 h-[150px]" />
          <div className="rounded-2xl bg-white/[0.04] p-5 h-[150px]" />
          <div className="col-span-2 rounded-2xl bg-white/[0.04] p-4 h-[100px]" />
          <div className="rounded-2xl bg-white/[0.04] p-4 h-[140px]" />
          <div className="rounded-2xl bg-white/[0.04] p-5 h-[140px]" />
        </div>
      </div>
      <div className="mt-3">
        <div className="h-3 w-12 rounded bg-white/[0.04] mb-2" />
        <div className="rounded-2xl bg-white/[0.04] divide-y divide-white/[0.02]">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 rounded-full bg-white/[0.04]" />
                <div className="h-3.5 rounded bg-white/[0.04]" style={{ width: 80 + i * 20 }} />
              </div>
              <div className="h-3 w-12 rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileNotFoundState({ handle }: { handle: string }) {
  return (
    <div className="flex items-center justify-center py-32 px-6">
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-semibold text-white mb-3">Not found</h1>
        <p className="text-sm text-white/50 mb-6">No one with handle <span className="font-sans">@{handle}</span> exists.</p>
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
    profileData, heroUser, heroPresence, heroBadges, profileSpaces, profileTools,
    profileConnections, totalConnections, mutualFriendsCount,
    activityContributions, currentStreak,
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

  const handleShare = React.useCallback(() => {
    const url = `${window.location.origin}/u/${handle}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Copied!', 'Profile link copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  }, [handle]);

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

  const uniqueTools = profileTools.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);
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
    <div className="w-full max-w-7xl mx-auto px-6 py-6 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row gap-3 items-stretch">
        <div className="md:w-[280px] shrink-0">
          <PortraitCard
            heroUser={heroUser}
            heroPresence={heroPresence}
            isOwnProfile={isOwnProfile}
            onEdit={handleEditProfile}
            onShare={handleShare}
            connectionState={connectionState}
            isConnectionLoading={isConnectionLoading}
            onConnect={handleConnect}
            onAcceptRequest={handleAcceptRequest}
            onUnfriend={handleUnfriend}
            onMessage={handleMessage}
            isBuilder={heroBadges.isBuilder ?? false}
            completenessProps={isOwnProfile ? {
              interests,
              spaceCount: profileSpaces.length,
              toolCount: dedupedTools.length,
            } : undefined}
          />
        </div>

        <div className="flex-1 grid grid-cols-2 gap-3 content-start">
          <StatsCard
            toolCount={dedupedTools.length}
            spaceCount={profileSpaces.length}
            connectionCount={totalConnections}
            isOwnProfile={isOwnProfile}
          />
          {interests.length > 0 ? (
            <InterestsCard interests={interests} isOwnProfile={isOwnProfile} />
          ) : (
            <ConnectionsCard
              connections={profileConnections}
              totalConnections={totalConnections}
              mutualFriendsCount={mutualFriendsCount}
              isOwnProfile={isOwnProfile}
            />
          )}
          <SpacesCard
            spaces={profileSpaces}
            suggestedSpaces={suggestedSpaces}
            isOwnProfile={isOwnProfile}
            onSpaceClick={handleSpaceClick}
          />
          {interests.length > 0 && (
            <ConnectionsCard
              connections={profileConnections}
              totalConnections={totalConnections}
              mutualFriendsCount={mutualFriendsCount}
              isOwnProfile={isOwnProfile}
            />
          )}
          <ActivityStrip contributions={activityContributions} currentStreak={currentStreak} />
          <EventCard event={nextEvent} />
          <TopToolCard tool={topTool} isOwnProfile={isOwnProfile} onToolClick={handleToolClick} />
        </div>
      </div>

      {sortedTools.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-sans uppercase tracking-[0.15em] text-white/25">Tools</p>
            {isOwnProfile && (
              <Link href="/lab" className="text-[11px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
                Open Lab <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          <Card className="divide-y divide-white/[0.04]">
            {sortedTools.slice(0, 6).map(tool => (
              <ToolRow key={tool.id} tool={tool} onClick={() => handleToolClick(tool.id)} />
            ))}
          </Card>
        </div>
      )}

      {sortedTools.length === 0 && isOwnProfile && (
        <div className="mt-3">
          <Card className="relative p-4 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#FFD700]/[0.08] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-[#FFD700]/50" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-white/50">Create your first tool</p>
                <p className="text-[11px] text-white/20">Build polls, forms, and more for your spaces</p>
              </div>
              <Link href="/lab" className="inline-flex items-center gap-1 text-[11px] text-[#FFD700]/60 hover:text-[#FFD700] transition-colors shrink-0">
                Open Lab <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </Card>
        </div>
      )}

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
