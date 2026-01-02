"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Wrench,
  Layers,
  BarChart3,
  ChevronRight,
  Trophy,
  Vote,
  CalendarCheck,
  Target,
} from "lucide-react";
import Link from "next/link";

import { cn } from "../../../lib/utils";
import { Card } from "../../00-Global/atoms/card";
import { Button } from "../../00-Global/atoms/button";
import {
  PrivacyControl,
  type PrivacyLevel,
} from "../../00-Global/molecules/privacy-control";

// ============================================================================
// Types
// ============================================================================

export interface ProfileToolItem {
  id: string;
  name: string;
  deployedToSpaces?: number;
  usageCount?: number;
  status?: "active" | "draft" | "archived";
  lastUpdatedAt?: string | number | Date;
}

export interface ProfileHiveLabWidgetProps {
  tools: ProfileToolItem[];
  isOwnProfile?: boolean;
  privacyLevel?: PrivacyLevel;
  onPrivacyChange?: (level: PrivacyLevel) => void;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const BUILDER_BADGE_THRESHOLD = 1;
const BUILDER_LEVEL_2_THRESHOLD = 3;
const BUILDER_LEVEL_3_THRESHOLD = 5;

// Element icons for the CTA animation
const ELEMENT_ICONS = [
  { icon: Vote, label: "Poll", delay: 0 },
  { icon: CalendarCheck, label: "RSVP", delay: 0.1 },
  { icon: Target, label: "Quiz", delay: 0.2 },
];

// ============================================================================
// Sub-components
// ============================================================================

function ToolCard({ tool }: { tool: ProfileToolItem }) {
  const isActive = tool.status === "active";

  return (
    <div className="rounded-2xl bg-[color-mix(in_srgb,var(--hive-background-tertiary,#141522)_75%,transparent)] p-4 transition-all hover:bg-[color-mix(in_srgb,var(--hive-background-tertiary,#141522)_85%,transparent)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[color-mix(in_srgb,var(--hive-background-primary,#0a0b16)_80%,transparent)] p-2">
            <Wrench className="h-4 w-4 text-[var(--hive-text-secondary,#c0c2cc)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--hive-text-primary,#f7f7ff)]">
              {tool.name}
            </p>
            {tool.deployedToSpaces && tool.deployedToSpaces > 0 ? (
              <p className="text-xs text-[var(--hive-text-muted,#8d90a2)]">
                Deployed to {tool.deployedToSpaces} space{tool.deployedToSpaces > 1 ? "s" : ""}
              </p>
            ) : (
              <p className="text-xs text-[var(--hive-text-muted,#8d90a2)]">Draft</p>
            )}
          </div>
        </div>
        {isActive && (
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-400">
            Active
          </span>
        )}
      </div>

      {tool.usageCount !== undefined && tool.usageCount > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--hive-text-muted,#8d90a2)]">
          <BarChart3 className="h-3.5 w-3.5" />
          <span>{tool.usageCount} uses this week</span>
        </div>
      )}
    </div>
  );
}

function BuilderBadge({ toolCount }: { toolCount: number }) {
  let level = 0;
  let nextThreshold = BUILDER_BADGE_THRESHOLD;
  let label = "Create a tool to unlock";

  if (toolCount >= BUILDER_LEVEL_3_THRESHOLD) {
    level = 3;
    label = "Master Builder";
  } else if (toolCount >= BUILDER_LEVEL_2_THRESHOLD) {
    level = 2;
    nextThreshold = BUILDER_LEVEL_3_THRESHOLD;
    label = `Builder Level 2 · ${nextThreshold - toolCount} more to level up`;
  } else if (toolCount >= BUILDER_BADGE_THRESHOLD) {
    level = 1;
    nextThreshold = BUILDER_LEVEL_2_THRESHOLD;
    label = `Builder Badge · ${nextThreshold - toolCount} more to level up`;
  }

  return (
    <div className="mt-4 flex items-center gap-2 rounded-xl bg-[color-mix(in_srgb,var(--hive-brand-primary,#facc15)_8%,transparent)] px-4 py-3">
      <Trophy className={cn(
        "h-4 w-4",
        level > 0 ? "text-[var(--hive-brand-primary,#facc15)]" : "text-[var(--hive-text-muted,#8d90a2)]"
      )} />
      <span className={cn(
        "text-sm",
        level > 0 ? "text-[var(--hive-brand-primary,#facc15)]" : "text-[var(--hive-text-muted,#8d90a2)]"
      )}>
        {label}
      </span>
    </div>
  );
}

function EmptyStateCTA() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--hive-border-default,#2d3145)_60%,transparent)] bg-[color-mix(in_srgb,var(--hive-background-primary,#0a0b16)_90%,transparent)] p-8">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--hive-brand-primary,#facc15)]/[0.02] to-transparent" />

      {/* Animated element icons */}
      <div className="mb-6 flex items-center justify-center gap-4">
        {ELEMENT_ICONS.map(({ icon: Icon, label, delay }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="group relative"
          >
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--hive-border-default,#2d3145)_80%,transparent)] bg-[color-mix(in_srgb,var(--hive-background-secondary,#111221)_90%,transparent)] transition-colors hover:border-[var(--hive-brand-primary,#facc15)]/30"
            >
              <Icon className="h-6 w-6 text-[var(--hive-text-secondary,#c0c2cc)] transition-colors group-hover:text-[var(--hive-brand-primary,#facc15)]" />
            </motion.div>
            <span className="mt-1.5 block text-center text-[10px] uppercase tracking-wider text-[var(--hive-text-muted,#8d90a2)]">
              {label}
            </span>
          </motion.div>
        ))}

        {/* Connecting arrows */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute left-1/2 top-12 -ml-[72px] flex items-center gap-[52px] text-[var(--hive-text-muted,#8d90a2)]/40"
        >
          <ChevronRight className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
        </motion.div>
      </div>

      {/* Copy */}
      <div className="text-center">
        <p className="mb-1 text-base font-medium text-[var(--hive-text-primary,#f7f7ff)]">
          Drag. Drop. Deploy.
        </p>
        <p className="mb-6 text-sm text-[var(--hive-text-muted,#8d90a2)]">
          Build tools your space needs — no code required.
        </p>

        {/* CTA Button */}
        <Link href="/tools/create">
          <Button
            className="group bg-[var(--hive-brand-primary,#facc15)] px-6 text-neutral-950 hover:bg-[var(--hive-brand-primary,#facc15)]/90"
          >
            Create Your First Tool
            <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ProfileHiveLabWidget({
  tools,
  isOwnProfile = false,
  privacyLevel = "public",
  onPrivacyChange,
  className,
}: ProfileHiveLabWidgetProps) {
  const hasTools = tools.length > 0;
  const visibleTools = tools.slice(0, 3);

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-[color-mix(in_srgb,var(--hive-border-default,#2d3145)_60%,transparent)] bg-[color-mix(in_srgb,var(--hive-background-secondary,#111221)_86%,transparent)] p-6",
        className,
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[color-mix(in_srgb,var(--hive-background-tertiary,#141522)_80%,transparent)] p-2">
            <Wrench className="h-4 w-4 text-[var(--hive-brand-primary,#facc15)]" aria-hidden />
          </div>
          <h3 className="text-lg font-medium text-[var(--hive-text-primary,#f7f7ff)]">
            {hasTools ? "Your Creations" : "Build Something"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {hasTools && (
            <Link
              href="/tools"
              className="text-xs text-[var(--hive-text-muted,#8d90a2)] transition-colors hover:text-[var(--hive-text-primary,#f7f7ff)]"
            >
              Open Lab →
            </Link>
          )}
          {isOwnProfile && onPrivacyChange ? (
            <PrivacyControl level={privacyLevel} onLevelChange={onPrivacyChange} compact />
          ) : null}
        </div>
      </div>

      {/* Content */}
      {hasTools ? (
        <>
          <div className="space-y-3">
            {visibleTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
          {tools.length > 3 && (
            <Link
              href="/tools"
              className="mt-3 block text-center text-xs text-[var(--hive-text-muted,#8d90a2)] transition-colors hover:text-[var(--hive-text-primary,#f7f7ff)]"
            >
              View all {tools.length} tools →
            </Link>
          )}
        </>
      ) : isOwnProfile ? (
        <EmptyStateCTA />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--hive-border-default,#2d3145)_45%,transparent)] bg-[color-mix(in_srgb,var(--hive-background-primary,#0a0b16)_80%,transparent)] py-10 text-center">
          <Layers className="h-6 w-6 text-[color-mix(in_srgb,var(--hive-text-muted,#8d90a2)_80%,transparent)]" aria-hidden />
          <p className="text-sm text-[var(--hive-text-secondary,#c0c2cc)]">
            No tools created yet.
          </p>
        </div>
      )}

      {/* Builder Badge */}
      {isOwnProfile && <BuilderBadge toolCount={tools.length} />}
    </Card>
  );
}
