"use client";

import { Building2, Users, Grid, ChevronRight, MessageCircle, Circle } from "lucide-react";
import * as React from "react";
import Link from "next/link";

import { cn } from "../../../lib/utils";
import { Card } from "../../00-Global/atoms/card";
import {
  PrivacyControl,
  type PrivacyLevel,
} from "../../00-Global/molecules/privacy-control";

export interface ProfileSpaceItem {
  id: string;
  name: string;
  role?: "owner" | "admin" | "moderator" | "member" | string;
  memberCount?: number;
  lastActivityAt?: string | number | Date;
  headline?: string;
  unreadCount?: number;
  onlineCount?: number;
}

// Role badge styling
const getRoleBadgeStyles = (role?: string) => {
  switch (role?.toLowerCase()) {
    case "owner":
    case "leader":
      return "bg-[color-mix(in_srgb,var(--hive-brand-primary,#facc15)_16%,transparent)] text-[var(--hive-brand-primary,#facc15)]";
    case "admin":
      return "bg-purple-500/16 text-purple-400";
    case "moderator":
      return "bg-blue-500/16 text-blue-400";
    default:
      return "bg-neutral-800/50 text-neutral-400";
  }
};

const getRoleLabel = (role?: string) => {
  switch (role?.toLowerCase()) {
    case "owner":
      return "Leader";
    default:
      return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Member";
  }
};

export interface ProfileSpacesWidgetProps {
  spaces: ProfileSpaceItem[];
  isOwnProfile?: boolean;
  privacyLevel?: PrivacyLevel;
  onPrivacyChange?: (level: PrivacyLevel) => void;
  className?: string;
}

const formatLastActivity = (value?: string | number | Date) => {
  if (!value) return "Recently";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Active now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export function ProfileSpacesWidget({
  spaces,
  isOwnProfile = false,
  privacyLevel = "public",
  onPrivacyChange,
  className,
}: ProfileSpacesWidgetProps) {
  const visible = spaces.slice(0, 4);

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-[color-mix(in_srgb,var(--hive-border-default,#2d3145) 60%,transparent)] bg-[color-mix(in_srgb,var(--hive-background-secondary,#111221) 86%,transparent)] p-6",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--hive-background-tertiary,#141522)_80%,transparent)]">
            <Building2 className="h-5 w-5 text-[var(--hive-brand-primary,#facc15)]" aria-hidden />
          </div>
          <h3 className="text-lg font-medium text-[var(--hive-text-primary,#f7f7ff)]">Spaces</h3>
        </div>
        {isOwnProfile && onPrivacyChange ? (
          <PrivacyControl level={privacyLevel} onLevelChange={onPrivacyChange} compact />
        ) : null}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--hive-border-default,#2d3145)_45%,transparent)] bg-[color-mix(in_srgb,var(--hive-background-primary,#0a0b16)_80%,transparent)] py-10 text-center">
          <Grid className="h-6 w-6 text-[color-mix(in_srgb,var(--hive-text-muted,#8d90a2)_80%,transparent)]" aria-hidden />
          <p className="text-sm text-[var(--hive-text-secondary,#c0c2cc)]">
            {isOwnProfile
              ? "Join a space to showcase your campus communities."
              : "No spaces shared publicly yet."}
          </p>
          {isOwnProfile && (
            <Link
              href="/spaces"
              className="mt-2 inline-flex items-center gap-1 text-sm text-[var(--hive-brand-primary,#facc15)] hover:underline"
            >
              Browse Spaces
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((space) => (
            <Link
              key={space.id}
              href={`/spaces/${space.id}`}
              className="block rounded-2xl bg-[color-mix(in_srgb,var(--hive-background-tertiary,#141522)_75%,transparent)] p-4 transition-all hover:bg-[color-mix(in_srgb,var(--hive-background-tertiary,#141522)_85%,transparent)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--hive-text-primary,#f7f7ff)] truncate">
                      {space.name}
                    </p>
                    {/* Unread badge */}
                    {space.unreadCount && space.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--hive-brand-primary,#facc15)] text-[10px] font-bold text-neutral-950">
                        {space.unreadCount > 99 ? "99+" : space.unreadCount}
                      </span>
                    )}
                  </div>
                  {space.headline && (
                    <p className="text-xs text-[var(--hive-text-muted,#8d90a2)] truncate">
                      {space.headline}
                    </p>
                  )}
                </div>
                {/* Role badge with enhanced styling */}
                <span
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-[10px] uppercase tracking-wider font-medium",
                    getRoleBadgeStyles(space.role)
                  )}
                >
                  {getRoleLabel(space.role)}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-[color-mix(in_srgb,var(--hive-text-muted,#8d90a2)_90%,transparent)]">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  {space.memberCount ?? 0}
                </span>
                {/* Online indicator */}
                {space.onlineCount !== undefined && space.onlineCount > 0 && (
                  <>
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <Circle className="h-2 w-2 fill-current" aria-hidden />
                      {space.onlineCount} online
                    </span>
                  </>
                )}
                {/* Unread messages indicator */}
                {space.unreadCount && space.unreadCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[var(--hive-brand-primary,#facc15)]">
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                    {space.unreadCount} new
                  </span>
                )}
                <span className="ml-auto">
                  {formatLastActivity(space.lastActivityAt)}
                </span>
              </div>
            </Link>
          ))}

          {/* Browse more CTA if user has spaces */}
          {isOwnProfile && spaces.length > 0 && (
            <Link
              href="/spaces"
              className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--hive-border-default,#2d3145)_45%,transparent)] bg-transparent p-4 text-sm text-[var(--hive-text-muted,#8d90a2)] transition-colors hover:border-[var(--hive-border-default,#2d3145)] hover:text-[var(--hive-text-secondary,#c0c2cc)]"
            >
              <Grid className="h-4 w-4" />
              Discover more spaces
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}
