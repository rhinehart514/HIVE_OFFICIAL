"use client";

/**
 * SpaceDetailHeader - T1 Premium Space Header with Tabs
 *
 * Full-featured header for space detail pages with:
 * - Ken Burns animated banner
 * - Parallax scroll effects
 * - Integrated tab navigation
 * - T1 Premium motion tier
 * - Join celebration trigger
 *
 * @author HIVE Frontend Team
 * @version 2.0.0
 */

import * as React from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  Users,
  Check,
  Loader2,
  Share2,
  Settings,
  BadgeCheck,
  LogOut,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { springPresets, easingArrays, tinderSprings } from "@hive/tokens";
import { Button } from "../../00-Global/atoms/button";
import { SpaceTabBar, type SpaceTabItem } from "../molecules/space-tab-bar";
import { glass, glassPresets } from "../../../lib/glass-morphism";

// ============================================================
// Types
// ============================================================

export type SpaceMembershipState =
  | "not_joined"
  | "joined"
  | "pending"
  | "loading"
  | "owner"
  | "admin";

export interface SpaceDetailData {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  bannerUrl?: string;
  category?: string;
  isVerified?: boolean;
  memberCount: number;
  onlineCount?: number;
}

export interface SpaceDetailHeaderProps {
  space: SpaceDetailData;
  membershipState: SpaceMembershipState;
  isLeader?: boolean;
  tabs?: SpaceTabItem[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  onJoin?: () => Promise<void> | void;
  onLeave?: () => Promise<void> | void;
  onShare?: () => void;
  onSettings?: () => void;
  onAddTab?: () => void;
  showTabs?: boolean;
  className?: string;
}

// ============================================================
// Motion Variants (T1 Premium)
// ============================================================

const headerContainerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: easingArrays.silk,
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const contentVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      ...tinderSprings.settle,
      delay: 0.15,
    },
  },
};

const kenBurnsVariants: Variants = {
  animate: {
    scale: [1, 1.05],
    transition: {
      duration: 20,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "linear",
    },
  },
};

const verifiedBadgeVariants: Variants = {
  initial: { scale: 0, rotate: -180 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: springPresets.bouncy,
  },
};

const joinCelebrationVariants: Variants = {
  initial: { scale: 0.5, opacity: 0 },
  animate: {
    scale: [0.5, 1.15, 1],
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: easingArrays.dramatic,
      times: [0, 0.6, 1],
    },
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

const goldPulseVariants: Variants = {
  pulse: {
    boxShadow: [
      "0 0 0 0 rgba(255,215,0,0)",
      "0 0 40px 20px rgba(255,215,0,0.3)",
      "0 0 0 0 rgba(255,215,0,0)",
    ],
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

// ============================================================
// Subcomponents
// ============================================================

interface SpaceAvatarProps {
  name: string;
  iconUrl?: string;
  isVerified?: boolean;
  size?: "sm" | "md" | "lg";
}

function SpaceAvatar({
  name,
  iconUrl,
  isVerified,
  size = "md",
}: SpaceAvatarProps) {
  const monogram = name.charAt(0).toUpperCase() || "H";
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14 md:w-16 md:h-16",
    lg: "w-20 h-20 md:w-24 md:h-24",
  };

  return (
    <div className="relative flex-shrink-0">
      <div
        className={cn(
          sizeClasses[size],
          "rounded-xl overflow-hidden border-2 border-white/10",
          "shadow-xl shadow-black/30"
        )}
      >
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={`${name} icon`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FFD700] to-[#FFD700]/70 flex items-center justify-center">
            <span
              className={cn(
                "font-bold text-black",
                size === "sm" && "text-sm",
                size === "md" && "text-lg md:text-xl",
                size === "lg" && "text-2xl md:text-3xl"
              )}
            >
              {monogram}
            </span>
          </div>
        )}
      </div>

      {/* Verified badge */}
      <AnimatePresence>
        {isVerified && (
          <motion.div
            variants={verifiedBadgeVariants}
            initial="initial"
            animate="animate"
            className={cn(
              "absolute -bottom-1 -right-1 bg-[#FFD700] rounded-full p-0.5",
              "shadow-lg shadow-[#FFD700]/30"
            )}
          >
            <BadgeCheck className="w-4 h-4 text-black" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function SpaceDetailHeader({
  space,
  membershipState,
  isLeader = false,
  tabs = [],
  activeTabId,
  onTabChange,
  onJoin,
  onLeave,
  onShare,
  onSettings,
  onAddTab,
  showTabs = true,
  className,
}: SpaceDetailHeaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const headerRef = React.useRef<HTMLDivElement>(null);
  const [showJoinCelebration, setShowJoinCelebration] = React.useState(false);
  const [isJoinLoading, setIsJoinLoading] = React.useState(false);

  // Scroll-based parallax
  const { scrollY } = useScroll();
  const bannerY = useTransform(scrollY, [0, 300], [0, 100]);
  const bannerOpacity = useTransform(scrollY, [0, 200], [1, 0.3]);
  const headerScale = useTransform(scrollY, [0, 100], [1, 0.98]);

  const {
    name,
    iconUrl,
    bannerUrl,
    isVerified,
    memberCount,
    onlineCount,
  } = space;

  const isJoined = ["joined", "owner", "admin"].includes(membershipState);
  const isPending = membershipState === "pending";
  const isLoading = membershipState === "loading" || isJoinLoading;
  const isJoinable = membershipState === "not_joined" && Boolean(onJoin);
  const isLeavable = isJoined && Boolean(onLeave) && membershipState !== "owner";

  const buttonLabel = (() => {
    switch (membershipState) {
      case "owner":
        return "Owner";
      case "admin":
        return "Admin";
      case "joined":
        return "Joined";
      case "pending":
        return "Pending";
      case "loading":
        return "Loading...";
      default:
        return "Join Space";
    }
  })();

  const handleJoinClick = async () => {
    if (!onJoin) return;
    setIsJoinLoading(true);
    try {
      await onJoin();
      // Trigger celebration
      setShowJoinCelebration(true);
      setTimeout(() => setShowJoinCelebration(false), 2000);
    } finally {
      setIsJoinLoading(false);
    }
  };

  const handleLeaveClick = () => {
    onLeave?.();
  };

  return (
    <motion.header
      ref={headerRef}
      variants={headerContainerVariants}
      initial="initial"
      animate="animate"
      style={shouldReduceMotion ? {} : { scale: headerScale }}
      className={cn("relative overflow-hidden", className)}
    >
      {/* Banner with Ken Burns */}
      {bannerUrl && (
        <motion.div
          className="absolute inset-0 z-0"
          style={shouldReduceMotion ? {} : { y: bannerY, opacity: bannerOpacity }}
        >
          <motion.div
            variants={shouldReduceMotion ? {} : kenBurnsVariants}
            animate="animate"
            className="absolute inset-0"
          >
            <img
              src={bannerUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          </motion.div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
        </motion.div>
      )}

      {/* Fallback gradient background */}
      {!bannerUrl && (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900" />
      )}

      {/* Content - Ultra-compact: minimal vertical padding */}
      <motion.div
        variants={contentVariants}
        className={cn(
          "relative z-10 px-4 md:px-6 pt-4 pb-2",
          "max-w-[1200px] mx-auto"
        )}
      >
        {/* Main content row - Single line on desktop */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Avatar - Smaller for compact header */}
          <SpaceAvatar
            name={name}
            iconUrl={iconUrl}
            isVerified={isVerified}
            size="sm"
          />

          {/* Name + inline stats */}
          <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-white truncate">
              {name}
            </h1>

            {/* Stats inline on desktop, below on mobile */}
            <div className="flex items-center gap-3 text-xs md:text-sm text-neutral-400">
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{memberCount.toLocaleString()}</span>
              </span>

              {onlineCount !== undefined && onlineCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[#FFD700]">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full bg-[#FFD700]",
                      "shadow-[0_0_6px_#FFD700]",
                      "animate-pulse"
                    )}
                  />
                  <span>{onlineCount}</span>
                </span>
              )}
            </div>
          </div>

          {/* Actions - More prominent */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Share - Icon only */}
            {onShare && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onShare}
                aria-label="Share space"
                className="h-9 w-9 text-neutral-400 hover:text-white hover:bg-white/10"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            )}

            {/* Join/Leave button - Larger, more prominent */}
            <motion.div
              variants={showJoinCelebration ? goldPulseVariants : {}}
              animate={showJoinCelebration ? "pulse" : ""}
              className="relative"
            >
              <Button
                variant={isJoined ? "outline" : "brand"}
                size="default"
                onClick={isJoined ? handleLeaveClick : handleJoinClick}
                disabled={isLoading || isPending || (!isJoinable && !isLeavable)}
                className={cn(
                  "min-w-[110px] h-10 font-semibold",
                  isJoined && "border-white/20 hover:border-red-500/50 hover:text-red-400",
                  !isJoined && "shadow-[0_0_20px_rgba(255,215,0,0.15)]"
                )}
              >
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isJoined && !isLoading && (
                  <Check className="mr-1.5 h-4 w-4" />
                )}
                <span>{buttonLabel}</span>
              </Button>

              {/* Join celebration overlay */}
              <AnimatePresence>
                {showJoinCelebration && (
                  <motion.div
                    variants={joinCelebrationVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className={cn(
                      "absolute inset-0 pointer-events-none",
                      "flex items-center justify-center",
                      "bg-[#FFD700]/20 rounded-lg"
                    )}
                  >
                    <Check className="w-6 h-6 text-[#FFD700]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Settings (leader only) */}
            {isLeader && onSettings && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSettings}
                aria-label="Space settings"
                className="hidden md:flex h-9 w-9 text-neutral-400 hover:text-[#FFD700] hover:bg-white/10"
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tab bar - Tightly integrated */}
        {showTabs && tabs.length > 0 && onTabChange && (
          <div className="mt-2 -mb-1">
            <SpaceTabBar
              tabs={tabs}
              activeTabId={activeTabId ?? tabs[0]?.id ?? ""}
              onTabChange={onTabChange}
              isLeader={isLeader}
              onAddTab={onAddTab}
              onSettingsClick={onSettings}
              showSettings={false}
            />
          </div>
        )}
      </motion.div>
    </motion.header>
  );
}

// ============================================================
// Exports
// ============================================================

export default SpaceDetailHeader;
