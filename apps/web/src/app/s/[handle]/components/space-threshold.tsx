'use client';

/**
 * SpaceThreshold - Non-member join gate with activity preview.
 * Shows space identity + live activity signals + join CTA.
 */

import * as React from 'react';
import { Users, ArrowRight, AlertCircle, ChevronLeft, Calendar, BarChart3, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui';

interface ActivitySignal { type: 'event' | 'app'; label: string; detail: string }

interface SpaceThresholdProps {
  space: {
    id: string; handle: string; name: string; description?: string;
    avatarUrl?: string; memberCount: number; onlineCount: number;
    isClaimed?: boolean; orgTypeName?: string;
  };
  activity?: {
    appCount: number; eventCount: number; recentAppNames: string[];
    nextEventTitle?: string; messageCount: number;
  };
  onJoin: () => void;
  onClaim?: () => void;
  isJoining?: boolean;
  isClaiming?: boolean;
  joinError?: string | null;
  onClearError?: () => void;
}

export function SpaceThreshold({
  space, activity, onJoin, onClaim,
  isJoining = false, isClaiming = false, joinError = null, onClearError,
}: SpaceThresholdProps) {
  const handleJoin = () => { if (onClearError) onClearError(); onJoin(); };

  // Build activity signals
  const signals: ActivitySignal[] = [];
  if (activity?.nextEventTitle) {
    signals.push({ type: 'event', label: activity.nextEventTitle, detail: 'Upcoming' });
  }
  for (const name of (activity?.recentAppNames || []).slice(0, 2)) {
    signals.push({ type: 'app', label: name, detail: 'Active' });
  }
  const hasActivity = signals.length > 0 || (activity && (activity.appCount > 0 || activity.messageCount > 0));

  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-14 flex items-center px-4 flex-shrink-0">
        <a href="/discover" className="flex items-center gap-1 text-[13px] text-white/30 hover:text-white/50 transition-colors duration-100">
          <ChevronLeft className="h-4 w-4" />Spaces
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 -mt-14">
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
          <div className="rounded-2xl bg-[#161614] border border-white/[0.05] p-6">
            {/* Identity */}
            <div className="flex flex-col items-center text-center mb-6">
              <Avatar size="lg" className="mb-4">
                {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
                <AvatarFallback className="text-lg">{getInitials(space.name)}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-white mb-1" style={{ fontFamily: "var(--font-clash, 'Clash Display', sans-serif)" }}>
                {space.name}
              </h2>
              <span className="text-[13px] font-sans text-white/30 mb-3">@{space.handle}</span>
              <div className="flex items-center gap-4 text-[13px] text-white/50">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>{space.memberCount} {space.memberCount === 1 ? 'member' : 'members'}</span>
                </div>
                {(activity?.appCount ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    <span>{activity?.appCount} {activity?.appCount === 1 ? 'app' : 'apps'}</span>
                  </div>
                )}
                {space.onlineCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{space.onlineCount} online</span>
                  </div>
                )}
              </div>
            </div>

            {/* Category */}
            {space.orgTypeName && (
              <div className="flex justify-center mb-4">
                <span className="px-3 py-1 rounded-full border border-white/[0.05] text-[11px] tracking-wider uppercase text-white/30 font-mono">
                  {space.orgTypeName}
                </span>
              </div>
            )}

            {space.description && (
              <p className="text-[14px] text-white/50 leading-relaxed text-center mb-4 line-clamp-3">{space.description}</p>
            )}

            {/* Activity signals */}
            {hasActivity && (
              <div className="mb-4 space-y-2">
                {signals.map((sig, i) => (
                  <div key={`${sig.type}-${i}`} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    {sig.type === 'event'
                      ? <Calendar className="h-3.5 w-3.5 text-[#FFD700] flex-shrink-0" />
                      : <BarChart3 className="h-3.5 w-3.5 text-[#FFD700] flex-shrink-0" />}
                    <span className="text-[13px] text-white/70 truncate flex-1">{sig.label}</span>
                    <span className="text-[11px] text-white/30 flex-shrink-0 font-mono uppercase">{sig.detail}</span>
                  </div>
                ))}
                {(activity?.messageCount ?? 0) > 0 && signals.length === 0 && (
                  <p className="text-[13px] text-white/30 text-center">{activity?.messageCount} messages in the feed</p>
                )}
              </div>
            )}

            {/* Error */}
            <AnimatePresence mode="wait">
              {joinError && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden mb-4">
                  <div className="rounded-xl bg-red-500/10 border border-red-500/10 px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-[13px] text-red-300 leading-snug">{joinError}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleJoin} disabled={isJoining}
                className="w-full h-10 flex items-center justify-center gap-1.5 rounded-full bg-white text-black font-semibold text-[14px] hover:bg-white/90 transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? 'Joining...' : joinError ? 'Try Again' : 'Join to interact'}
                {!isJoining && <ArrowRight className="h-4 w-4" />}
              </button>
              {!space.isClaimed && onClaim && (
                <Button variant="ghost" size="default" onClick={onClaim} disabled={isClaiming} loading={isClaiming} className="w-full justify-center text-white/30">
                  {isClaiming ? 'Claiming...' : 'Become the Leader'}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

SpaceThreshold.displayName = 'SpaceThreshold';
