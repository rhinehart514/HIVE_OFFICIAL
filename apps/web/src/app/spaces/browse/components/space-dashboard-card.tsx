'use client';

/**
 * SpaceDashboardCard - Card for "Your Spaces" dashboard view
 *
 * Shows a user's joined space with:
 * - Space name and identity
 * - Next event preview (if any)
 * - New message count
 * - Online indicator
 *
 * @version 4.1.0 - Primitives integration (Jan 2026)
 * Design: Uses HIVE design system - opacity hover (NO scale), white focus rings
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { CalendarIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

// Design system primitives
import {
  Card,
  Text,
  Badge,
  SimpleAvatar,
  PresenceDot,
  Skeleton,
} from '@hive/ui/design-system/primitives';

import type { MySpace } from '../hooks';

// ============================================================
// Helpers
// ============================================================

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatEventTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ============================================================
// Component
// ============================================================

export interface SpaceDashboardCardProps {
  space: MySpace;
  onOpen: () => void;
}

export function SpaceDashboardCard({ space, onOpen }: SpaceDashboardCardProps) {
  const monogram = space.name?.charAt(0)?.toUpperCase() || 'S';
  const hasNewMessages = (space.membership.notifications ?? 0) > 0;
  const hasNextEvent = !!space.nextEvent;
  const isAdmin = ['admin', 'owner'].includes(space.membership.role.toLowerCase());

  return (
    <motion.article
      onClick={onOpen}
      className="
        relative cursor-pointer overflow-hidden rounded-2xl backdrop-blur-xl
        transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
        hover:brightness-110
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
        group
      "
      style={{
        background: 'linear-gradient(135deg, rgba(28,28,28,0.95), rgba(18,18,18,0.92))',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      role="button"
      aria-label={`Open ${space.name}`}
    >
      <div className="p-5">
        {/* Header: Avatar + Name */}
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar - rounded square per HIVE design */}
          <div
            className="
              w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden
              bg-white/[0.06] border border-white/[0.08]
            "
          >
            {space.bannerImage ? (
              <img src={space.bannerImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/[0.08] to-white/[0.02]">
                <span className="text-base font-semibold text-[#A3A19E]">
                  {monogram}
                </span>
              </div>
            )}
          </div>

          {/* Name + Role */}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[#FAF9F7] text-[15px] truncate">
              {space.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {isAdmin && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FFD700]">
                  Admin
                </span>
              )}
              <span className="text-[12px] text-[#6B6B70]">
                {space.memberCount} {space.memberCount === 1 ? 'member' : 'members'}
              </span>
            </div>
          </div>

          {/* Online indicator - gold presence dot */}
          {space.onlineCount && space.onlineCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[rgba(255,215,0,0.08)]">
              <span className="w-2 h-2 rounded-full bg-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.6)]" />
              <span className="text-[11px] font-medium text-[#FFD700]">
                {space.onlineCount}
              </span>
            </div>
          )}
        </div>

        {/* Next Event Preview - if exists */}
        {hasNextEvent && space.nextEvent && (
          <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[rgba(255,215,0,0.08)] flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="w-4 h-4 text-[#FFD700]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[#FAF9F7] truncate">
                  {space.nextEvent.title}
                </p>
                <p className="text-[12px] text-[#A3A19E] mt-0.5">
                  <span className="text-[#FFD700] font-medium">
                    {formatEventDate(space.nextEvent.startAt)}
                  </span>
                  {' · '}
                  {formatEventTime(space.nextEvent.startAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages indicator - bottom row */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <ChatBubbleLeftIcon className="w-4 h-4 text-[#6B6B70]" />
            {hasNewMessages ? (
              <span className="text-[12px] text-[#A3A19E]">
                <span className="font-semibold text-[#FFD700]">
                  {space.membership.notifications}
                </span>
                {' new'}
              </span>
            ) : (
              <span className="text-[12px] text-[#6B6B70]">
                No new messages
              </span>
            )}
          </div>

          {/* Enter button */}
          <div className="
            px-3 py-1.5 rounded-full text-[12px] font-medium
            bg-white/[0.06] text-[#A3A19E]
            group-hover:bg-white group-hover:text-[#0A0A09]
            transition-all duration-200
          ">
            Enter
          </div>
        </div>
      </div>

      {/* New messages badge */}
      {hasNewMessages && (
        <div className="absolute top-3 right-3">
          <div className="w-2 h-2 rounded-full bg-[var(--life-gold)] shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
        </div>
      )}
    </motion.article>
  );
}

// ============================================================
// Skeleton
// ============================================================

export function SpaceDashboardCardSkeleton() {
  return (
    <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-white/[0.04] animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-32 rounded bg-white/[0.04] animate-pulse mb-1.5" />
          <div className="h-3 w-20 rounded bg-white/[0.04] animate-pulse" />
        </div>
      </div>
      <div className="h-16 rounded-lg bg-white/[0.02] animate-pulse mb-3" />
      <div className="h-4 w-24 rounded bg-white/[0.04] animate-pulse" />
    </div>
  );
}
