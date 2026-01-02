"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Calendar,
  Flame,
  GripVertical,
  Heart,
  Maximize2,
  Minimize2,
  Search,
  Settings,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "../../../lib/utils";
import {
  premiumContainerVariants,
  premiumItemVariants,
} from "../../../lib/motion-variants";
import { Button } from "../../00-Global/atoms/button";
import { Card } from "../../00-Global/atoms/card";
import { InView } from "../../../components/motion-primitives/in-view";

type GridCard = {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: GridSize;
  visible: boolean;
  customType?: string;
  title?: string;
  [key: string]: unknown;
};

type GridLayout = BentoGridLayout & {
  cards: GridCard[];
  mobileLayout: GridCard[];
  lastModified?: Date | string | null;
};

// Local fallbacks for core profile/grid types to decouple from @hive/core typing changes
type GridSize = "1x1" | "2x1" | "2x2" | "3x1" | "3x2" | "4x1" | (string & {});

interface BentoGridLayout {
  cards?: GridCard[];
  mobileLayout?: GridCard[];
  lastModified?: Date | string | null;
}

// ============================================================================
// Profile Data Types (for type safety in card rendering)
// ============================================================================

interface ProfileConnection {
  id?: string;
  displayName?: string;
  sharedSpaces?: string[];
  mutualCount?: number;
  isMutual?: boolean;
  isFriend?: boolean;
}

interface ProfileBadge {
  id?: string;
  name: string;
  icon?: string;
  earnedAt?: string;
}

interface ProfileActivity {
  type?: string;
  action?: string;
  spaceName?: string;
  timestamp?: string;
}

interface ProfileOverlap {
  time?: string;
  name?: string;
  location?: string;
}

interface ProfileSuggestion {
  name?: string;
  reason?: string;
  reasons?: string[];
  type?: string;
}

interface ProfilePresence {
  isOnline?: boolean;
  vibe?: string;
  beacon?: {
    active?: boolean;
    location?: string;
  };
}

interface ProfileStats {
  spacesJoined?: number;
  friends?: number;
  reputation?: number;
  currentStreak?: number;
  longestStreak?: number;
  toolsCreated?: number;
  activeRituals?: number;
  mutualFriends?: number;
  sharedSpaces?: number;
}

interface ProfileConnections {
  friends?: ProfileConnection[];
  connections?: ProfileConnection[];
}

interface ProfileIntelligence {
  overlaps?: ProfileOverlap[];
  suggestions?: ProfileSuggestion[];
}

interface ProfilePersonal {
  interests?: string[];
}

interface ProfileIdentity {
  badges?: ProfileBadge[];
}

/** Internal profile shape used by bento grid card renderers */
interface ProfileCardData {
  grid?: BentoGridLayout;
  stats?: ProfileStats;
  connections?: ProfileConnections;
  intelligence?: ProfileIntelligence;
  personal?: ProfilePersonal;
  identity?: ProfileIdentity;
  presence?: ProfilePresence;
  activities?: ProfileActivity[];
  interests?: string[];
  badges?: (ProfileBadge | string)[];
  isOnline?: boolean;
}

interface ProfileSystem {
  grid?: BentoGridLayout;
  [key: string]: unknown;
}

export interface ProfileBentoGridProps {
  profile: ProfileSystem;
  editable?: boolean;
  onLayoutChange?: (layout: BentoGridLayout) => void;
  onViewConnections?: () => void;
  className?: string;
}

// Identity & Connection focused default layout for profile bento grid
const DEFAULT_LAYOUT: GridLayout = {
  cards: [
    // Row 0: Friends (2x2 tall) + Spaces + Activity stacked
    { id: "friends", type: "friends_network", position: { x: 0, y: 0 }, size: "2x2", visible: true },
    { id: "spaces", type: "spaces_hub", position: { x: 2, y: 0 }, size: "2x1", visible: true },
    { id: "mutual", type: "mutual_friends", position: { x: 2, y: 1 }, size: "2x1", visible: true },
    // Row 2: Streak + Rep + Shared Spaces
    { id: "streak", type: "streak", position: { x: 0, y: 2 }, size: "1x1", visible: true },
    { id: "rep", type: "stats_rep", position: { x: 1, y: 2 }, size: "1x1", visible: true },
    { id: "shared", type: "shared_spaces", position: { x: 2, y: 2 }, size: "2x1", visible: true },
  ],
  mobileLayout: [
    // Mobile: 2-column layout, connection focused
    { id: "friends_m", type: "friends_network", position: { x: 0, y: 0 }, size: "2x1", visible: true },
    { id: "spaces_m", type: "spaces_hub", position: { x: 0, y: 1 }, size: "2x1", visible: true },
    { id: "streak_m", type: "streak", position: { x: 0, y: 2 }, size: "1x1", visible: true },
    { id: "rep_m", type: "stats_rep", position: { x: 1, y: 2 }, size: "1x1", visible: true },
  ],
  lastModified: null,
};

// HIVE Brand: "One bright note in a monochrome orchestra. Gold is scarce, purposeful, never decorative."
// All cards are monochrome except achievements/rep which get gold accent
const CARD_CONFIGS: Record<string, {
  title: string;
  icon: typeof Users;
  isGoldAccent?: boolean; // Only for achievements/rep
}> = {
  spaces_hub: { title: "Spaces", icon: Users },
  friends_network: { title: "Network", icon: Users },
  schedule_overlap: { title: "Schedule", icon: Calendar },
  active_now: { title: "Active", icon: Activity },
  discovery: { title: "Discover", icon: Search },
  vibe_check: { title: "Vibe", icon: Zap },
  tools_created: { title: "Tools", icon: Zap },
  rituals_active: { title: "Rituals", icon: Activity },
  reputation: { title: "Rep", icon: TrendingUp, isGoldAccent: true },
  badges: { title: "Achievements", icon: Trophy, isGoldAccent: true },
  interests: { title: "Interests", icon: Heart },
  activity_timeline: { title: "Activity", icon: Activity },
  streak: { title: "Streak", icon: Flame },
  stats_spaces: { title: "Spaces", icon: Users },
  stats_friends: { title: "Friends", icon: Users },
  stats_rep: { title: "Rep", icon: Star, isGoldAccent: true },
  mutual_friends: { title: "Mutuals", icon: Users },
  shared_spaces: { title: "Shared", icon: Users },
};

function normalizeLayout(layout: Partial<GridLayout> | undefined): GridLayout {
  // Use persisted layout if available and valid
  if (layout?.cards && Array.isArray(layout.cards) && layout.cards.length > 0) {
    // Validate each card has required properties
    const validCards = layout.cards.filter(
      (card): card is GridCard =>
        card &&
        typeof card.id === 'string' &&
        typeof card.type === 'string' &&
        card.position &&
        typeof card.position.x === 'number' &&
        typeof card.position.y === 'number' &&
        typeof card.size === 'string'
    );

    if (validCards.length > 0) {
      // Merge with defaults for missing properties
      const normalizedCards = validCards.map((card) => ({
        ...card,
        visible: card.visible ?? true,
      }));

      // Use persisted mobile layout or generate from cards
      const mobileLayout = layout.mobileLayout && Array.isArray(layout.mobileLayout)
        ? layout.mobileLayout.map((card) => ({
            ...card,
            visible: card.visible ?? true,
          }))
        : DEFAULT_LAYOUT.mobileLayout;

      return {
        cards: normalizedCards,
        mobileLayout,
        lastModified: layout.lastModified ?? null,
      };
    }
  }

  // Fall back to default layout for new profiles or invalid data
  return DEFAULT_LAYOUT;
}

/**
 * Mobile-first responsive Bento Grid
 * - Mobile: 2 columns max, vertical scroll
 * - Tablet: 3 columns
 * - Desktop: 4 columns full grid
 */
/** Safely extract grid from profile with type coercion */
function getProfileGrid(profile: ProfileSystem): Partial<GridLayout> | undefined {
  return profile.grid as Partial<GridLayout> | undefined;
}

/** Safely coerce profile to ProfileCardData for card rendering */
function getProfileCardData(profile: ProfileSystem): ProfileCardData {
  return profile as unknown as ProfileCardData;
}

export function ProfileBentoGrid({
  profile,
  editable = false,
  onLayoutChange,
  onViewConnections,
  className,
}: ProfileBentoGridProps) {
  const [layout, setLayout] = useState<GridLayout>(() =>
    normalizeLayout(getProfileGrid(profile)),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLayout(normalizeLayout(getProfileGrid(profile)));
  }, [profile]);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const activeCards = useMemo<GridCard[]>(() => {
    const cards = isMobile ? layout.mobileLayout : layout.cards;
    return Array.isArray(cards) ? cards : [];
  }, [isMobile, layout.cards, layout.mobileLayout]);

  const updateLayout = (updatedCards: GridCard[]) => {
    const nextLayout: GridLayout = {
      ...layout,
      [isMobile ? "mobileLayout" : "cards"]: updatedCards,
      lastModified: new Date(),
    };
    setLayout(nextLayout);
    onLayoutChange?.(nextLayout as BentoGridLayout);
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    cardId: string,
  ) => {
    if (!editable) return;
    setIsDragging(true);
    setDraggedCard(cardId);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!editable) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    targetPos: { x: number; y: number },
  ) => {
    event.preventDefault();
    if (!editable || !draggedCard) return;

    const updatedCards = activeCards.map((card) =>
      card.id === draggedCard ? { ...card, position: targetPos } : card,
    );

    setIsDragging(false);
    setDraggedCard(null);
    updateLayout(updatedCards);
  };

  const toggleCardSize = (cardId: string) => {
    if (!editable) return;

    const updatedCards = activeCards.map((card) => {
      if (card.id !== cardId) return card;

      const nextSize: GridSize =
        card.size === "1x1"
          ? "2x1"
          : card.size === "2x1"
            ? "2x2"
            : card.size === "2x2"
              ? "1x1"
              : "1x1";

      return { ...card, size: nextSize };
    });

    updateLayout(updatedCards);
  };

  const renderCardContent = (card: GridCard) => {
    const cardType = card.type === "custom" ? card.customType : card.type;
    const cardProfile = getProfileCardData(profile);

    switch (cardType) {
      case "spaces_hub": {
        const activeSpaces =
          cardProfile?.connections?.connections?.filter(
            (conn: ProfileConnection) => (conn.sharedSpaces?.length ?? 0) > 0,
          ) ?? [];
        const hasSpaces = activeSpaces.length > 0;

        return (
          <div className="mt-2 space-y-2">
            <div className="text-2xl font-bold text-hive-text-primary">
              {activeSpaces.length || 0}
            </div>
            <div className="text-xs text-hive-text-secondary">
              {hasSpaces ? "Active spaces" : "Discover your communities"}
            </div>
            {card.size !== "1x1" && hasSpaces ? (
              <div className="mt-3">
                <div className="mb-2 text-xs text-hive-text-secondary">
                  Recent activity
                </div>
                {/* Tinder-style horizontal scroll with momentum */}
                <div
                  className="overflow-x-auto snap-x snap-mandatory scroll-smooth flex gap-2 pb-1 -mx-1 px-1"
                  style={{
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {activeSpaces.slice(0, 5).map((conn: ProfileConnection, index: number) => (
                    <motion.div
                      key={conn.id ?? index}
                      className="snap-start flex-shrink-0 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-xs text-hive-text-primary whitespace-nowrap">
                        {conn.sharedSpaces?.[0] ?? "Space"}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : card.size !== "1x1" ? (
              <p className="mt-2 text-[10px] text-hive-text-secondary max-w-[160px]">
                Join clubs, study groups, and campus communities
              </p>
            ) : null}
            {card.size === "2x2" ? (
              <Button size="sm" variant="outline" className="mt-3 w-full">
                {hasSpaces ? "Browse Spaces" : "Explore Spaces"}
              </Button>
            ) : null}
          </div>
        );
      }

      case "friends_network": {
        const friendCount =
          cardProfile?.connections?.friends?.length ??
          cardProfile?.stats?.friends ??
          0;
        const connectionCount =
          cardProfile?.connections?.connections?.length ?? 0;
        const hasConnections = friendCount > 0 || connectionCount > 0;

        return (
          <div className="mt-2 space-y-2 h-full flex flex-col">
            <div className="flex gap-4">
              <div>
                <div className="text-xl font-bold text-hive-text-primary">
                  {friendCount}
                </div>
                <div className="text-xs text-hive-text-secondary">Friends</div>
              </div>
              <div>
                <div className="text-xl font-bold text-hive-text-primary">
                  {connectionCount}
                </div>
                <div className="text-xs text-hive-text-secondary">
                  Connections
                </div>
              </div>
            </div>

            {card.size === "2x2" && (
              <div className="mt-3 flex-1 flex flex-col">
                {hasConnections ? (
                  <>
                    <div className="mb-2 text-xs text-hive-text-secondary">
                      Recently connected
                    </div>
                    {/* Tinder-style avatar stack pop on hover */}
                    <motion.div
                      className="flex -space-x-2"
                      whileHover="hover"
                      initial="initial"
                    >
                      {Array.from({
                        length: Math.min(5, friendCount + connectionCount),
                      }).map((_, index) => (
                        <motion.div
                          key={index}
                          className="h-8 w-8 rounded-full border-2 border-hive-background-primary bg-gradient-to-br from-neutral-600 to-neutral-700"
                          variants={{
                            initial: { y: 0, x: 0, scale: 1 },
                            hover: {
                              y: -4,
                              x: index * 3,
                              scale: 1.1,
                              transition: {
                                type: 'spring',
                                stiffness: 300,
                                damping: 20,
                                delay: index * 0.05,
                              },
                            },
                          }}
                        />
                      ))}
                    </motion.div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center text-center py-4 rounded-xl bg-white/[0.02]">
                    <Users className="w-8 h-8 text-neutral-400/40 mb-2" />
                    <p className="text-[11px] font-medium text-white/70 mb-1">
                      Your campus network starts here
                    </p>
                    <p className="text-[10px] text-hive-text-secondary max-w-[140px]">
                      Find classmates and grow your HIVE
                    </p>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-auto w-full text-xs rounded-lg"
                  onClick={onViewConnections}
                >
                  {hasConnections ? 'View All' : 'Find Friends'}
                </Button>
              </div>
            )}
          </div>
        );
      }

      case "active_now": {
        const allFriends = cardProfile?.connections?.friends ?? [];
        const activeFriends = allFriends.filter((_: unknown, index: number) =>
          index % 2 === 0 ? true : false,
        );
        const isUserOnline =
          cardProfile?.presence?.isOnline ?? cardProfile?.isOnline ?? false;

        return (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-hive-text-primary">
                {activeFriends.length}
              </div>
              {isUserOnline ? (
                <div className="h-2 w-2 animate-pulse rounded-full bg-status-success" />
              ) : null}
            </div>
            <div className="text-xs text-hive-text-secondary">
              Friends online now
            </div>
            {card.size !== "1x1" && activeFriends.length > 0 ? (
              <div className="mt-2">
                <div className="flex -space-x-2">
                  {activeFriends.slice(0, 5).map((_: unknown, index: number) => (
                    <div
                      key={index}
                      className="h-6 w-6 rounded-full border border-neutral-950 bg-white/[0.08]"
                    />
                  ))}
                  {activeFriends.length > 5 ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-hive-background-primary bg-hive-background-secondary">
                      <span className="text-xs text-hive-text-secondary">
                        +{activeFriends.length - 5}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        );
      }

      case "vibe_check": {
        const currentVibe = cardProfile?.presence?.vibe ?? "🚀 Building";
        const vibeOptions = [
          "🎯 Focused",
          "🚀 Building",
          "📚 Studying",
          "🤝 Connecting",
          "⚡ Energized",
          "😴 Resting",
        ];

        return (
          <div className="mt-2 space-y-2">
            <div className="text-lg font-semibold text-hive-text-primary">
              {currentVibe}
            </div>
            <div className="text-xs text-hive-text-secondary">
              Campus vibe • Tap to update
            </div>
            {card.size === "2x2" ? (
              <div className="mt-3 grid grid-cols-2 gap-1">
                {vibeOptions.slice(0, 4).map((vibe, index) => (
                  <button
                    key={index}
                    className="rounded bg-hive-background-secondary p-2 text-xs transition-colors hover:bg-hive-background-tertiary"
                  >
                    {vibe}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        );
      }

      case "schedule_overlap": {
        const overlaps = cardProfile?.intelligence?.overlaps ?? [];
        const beaconActive = cardProfile?.presence?.beacon?.active ?? false;
        const beaconLocation =
          cardProfile?.presence?.beacon?.location ?? "Campus";

        return (
          <div className="mt-2 space-y-2">
            <div className="text-sm text-hive-text-primary">
              {overlaps.length > 0
                ? `${overlaps.length} overlaps today`
                : "No overlaps today"}
            </div>
            {beaconActive ? (
              <div className="flex items-center gap-1 text-xs text-status-success">
                <div className="h-2 w-2 animate-pulse rounded-full bg-status-success" />
                Beacon at {beaconLocation}
              </div>
            ) : (
              <div className="text-xs text-hive-text-secondary">
                Enable beacon to find friends
              </div>
            )}
            {card.size !== "1x1" && overlaps.length > 0 ? (
              <div className="mt-2 space-y-1">
                {overlaps.slice(0, 2).map((overlap: ProfileOverlap, index: number) => (
                  <div
                    key={index}
                    className="text-xs text-hive-text-primary"
                  >
                    {overlap.time ?? "TBD"} • {overlap.name ?? "Event"}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      }

      case "discovery": {
        const suggestions = cardProfile?.intelligence?.suggestions ?? [];
        const hasSuggestions = suggestions.length > 0;

        return (
          <div className="mt-2 space-y-2">
            <div className="text-sm text-hive-text-primary">
              {hasSuggestions
                ? `${suggestions.length} new suggestions`
                : "Explore HIVE"}
            </div>
            <div className="text-xs text-hive-text-secondary">
              {hasSuggestions
                ? "Based on your interests"
                : "Discover spaces & tools"}
            </div>
            {card.size !== "1x1" ? (
              <div className="mt-3">
                {hasSuggestions ? (
                  <div className="space-y-2">
                    {suggestions.slice(0, 2).map((suggestion: ProfileSuggestion, index: number) => (
                      <div
                        key={index}
                        className="rounded bg-hive-background-secondary p-2"
                      >
                        <div className="text-xs font-medium text-hive-text-primary">
                          {suggestion.name ?? "Suggestion"}
                        </div>
                        <div className="text-xs text-hive-text-secondary">
                          {suggestion.reason ??
                            suggestion.reasons?.[0] ??
                            "Recommended for you"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <Search size={12} className="mr-1" />
                    Discover
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        );
      }

      case "tools_created": {
        const toolsCount = cardProfile?.stats?.toolsCreated ?? 0;
        return (
          <div className="mt-2 space-y-2">
            <div className="text-2xl font-bold text-hive-text-primary">
              {toolsCount}
            </div>
            <div className="text-xs text-hive-text-secondary">
              Tools created
            </div>
            {card.size !== "1x1" ? (
              <div className="mt-3">
                <Button size="sm" variant="outline" className="w-full">
                  <Zap size={12} className="mr-1" />
                  Create Tool
                </Button>
              </div>
            ) : null}
          </div>
        );
      }

      case "rituals_active": {
        const activeRituals = cardProfile?.stats?.activeRituals ?? 0;
        return (
          <div className="mt-2 space-y-2">
            <div className="text-2xl font-bold text-hive-text-primary">
              {activeRituals}
            </div>
            <div className="text-xs text-hive-text-secondary">
              Active rituals
            </div>
            {card.size !== "1x1" ? (
              <div className="mt-2 text-xs text-hive-accent">
                Current streak: {cardProfile?.stats?.currentStreak ?? 0} days
              </div>
            ) : null}
          </div>
        );
      }

      case "reputation": {
        // HIVE Brand: reputation is an achievement, gold accent allowed
        const reputation = cardProfile?.stats?.reputation ?? 0;
        return (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-hive-text-primary">
                {reputation}
              </div>
              <TrendingUp size={14} className="text-gold-500" />
            </div>
            <div className="text-xs text-hive-text-secondary">
              Reputation score
            </div>
            {card.size !== "1x1" ? (
              <div className="mt-2">
                <div className="h-2 w-full rounded-full bg-white/[0.06]">
                  <div
                    className="h-2 rounded-full bg-gold-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, reputation)}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        );
      }

      // ===== NEW MURU-INSPIRED CARD TYPES =====

      case "badges": {
        const badges = cardProfile?.identity?.badges ?? cardProfile?.badges ?? [];
        return (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-white tabular-nums">
                {badges.length}
              </span>
              <Trophy size={18} className="text-neutral-400" />
            </div>
            <div className="text-xs text-hive-text-secondary uppercase tracking-wider">
              Achievements
            </div>
            {card.size !== "1x1" && badges.length > 0 && (
              <motion.div
                className="mt-3 flex flex-wrap gap-1.5"
                whileHover="hover"
                initial="initial"
              >
                {badges.slice(0, card.size === "2x2" ? 8 : 4).map((badge: ProfileBadge | string, i: number) => (
                  <motion.span
                    key={i}
                    className="rounded-full bg-gold-500/15 px-2.5 py-1 text-xs font-medium text-gold-500 border border-gold-500/20"
                    variants={{
                      initial: { y: 0, scale: 1 },
                      hover: {
                        y: -3,
                        scale: 1.08,
                        transition: {
                          type: 'spring',
                          stiffness: 400,
                          damping: 15,
                          delay: i * 0.03,
                        },
                      },
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {typeof badge === 'string' ? badge : badge.name}
                  </motion.span>
                ))}
                {badges.length > (card.size === "2x2" ? 8 : 4) && (
                  <span className="text-xs text-hive-text-secondary">
                    +{badges.length - (card.size === "2x2" ? 8 : 4)} more
                  </span>
                )}
              </motion.div>
            )}
          </div>
        );
      }

      case "interests": {
        // HIVE Brand: monochrome tags, no colored decorative elements
        const interests = cardProfile?.personal?.interests ?? cardProfile?.interests ?? [];
        const maxTags = card.size === "1x1" ? 3 : card.size === "2x1" ? 6 : 10;
        return (
          <div className="mt-2 space-y-2">
            <div className="text-xs text-hive-text-secondary uppercase tracking-wider mb-2">
              Into
            </div>
            {/* Tinder-style tag pop on hover */}
            <motion.div
              className="flex flex-wrap gap-1.5"
              whileHover="hover"
              initial="initial"
            >
              {interests.slice(0, maxTags).map((tag: string, i: number) => (
                <motion.span
                  key={i}
                  className="rounded-full bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-neutral-400 border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer"
                  variants={{
                    initial: { y: 0, scale: 1 },
                    hover: {
                      y: -2,
                      scale: 1.05,
                      transition: {
                        type: 'spring',
                        stiffness: 400,
                        damping: 20,
                        delay: i * 0.02,
                      },
                    },
                  }}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tag}
                </motion.span>
              ))}
            </motion.div>
            {interests.length > maxTags && (
              <div className="text-xs text-hive-text-secondary">
                +{interests.length - maxTags} more
              </div>
            )}
          </div>
        );
      }

      case "activity_timeline": {
        // HIVE Brand: monochrome accents
        const activities = cardProfile?.activities ?? [];
        const maxItems = card.size === "1x1" ? 2 : card.size === "2x1" ? 3 : 5;
        return (
          <div className="mt-2 space-y-2">
            {activities.length > 0 ? (
              <div className="space-y-2">
                {activities.slice(0, maxItems).map((activity: ProfileActivity, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-neutral-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-hive-text-primary truncate block">
                        {activity.action ?? activity.type ?? "Activity"}
                        {activity.spaceName && ` in ${activity.spaceName}`}
                      </span>
                      <span className="text-hive-text-secondary text-[10px]">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : "Recently"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-hive-text-secondary">
                No recent activity
              </div>
            )}
          </div>
        );
      }

      case "streak": {
        const currentStreak = cardProfile?.stats?.currentStreak ?? 0;
        const longestStreak = cardProfile?.stats?.longestStreak ?? currentStreak;
        const hasStreak = currentStreak > 0;

        return (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-3xl font-black text-white">{currentStreak}</div>
              {/* Streak Ember: Charcoal ember at zero, lit flame when active */}
              {hasStreak ? (
                <Flame size={20} className="text-orange-400 animate-pulse" />
              ) : (
                <div className="relative">
                  <Flame size={20} className="text-[#4A3830]" />
                  <motion.div
                    className="absolute inset-0"
                    animate={{ opacity: [0.15, 0.3, 0.15] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Flame size={20} className="text-[#FF5722]" style={{ opacity: 0.2 }} />
                  </motion.div>
                </div>
              )}
            </div>
            <div className="text-xs text-hive-text-secondary uppercase tracking-wider">
              {hasStreak ? "Day Streak" : "Ready to ignite"}
            </div>
            {card.size !== "1x1" && (
              <div className="mt-2 text-xs text-hive-text-secondary">
                {hasStreak ? `Best: ${longestStreak} days` : "Return daily to build your streak"}
              </div>
            )}
          </div>
        );
      }

      case "stats_spaces": {
        const spacesCount = cardProfile?.stats?.spacesJoined ?? 0;
        return (
          <div className="mt-2 space-y-1">
            <div className="text-3xl font-black text-white">{spacesCount}</div>
            <div className="text-xs text-hive-text-secondary uppercase tracking-wider">
              Spaces
            </div>
          </div>
        );
      }

      case "stats_friends": {
        const friendsCount = cardProfile?.stats?.friends ?? cardProfile?.connections?.friends?.length ?? 0;
        return (
          <div className="mt-2 space-y-1">
            <div className="text-3xl font-black text-white">{friendsCount}</div>
            <div className="text-xs text-hive-text-secondary uppercase tracking-wider">
              Friends
            </div>
          </div>
        );
      }

      case "stats_rep": {
        const rep = cardProfile?.stats?.reputation ?? 0;

        return (
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-white tabular-nums">
                {rep.toLocaleString()}
              </span>
              <Star size={18} className="text-neutral-400" />
            </div>
            <div className="text-xs text-neutral-500 uppercase tracking-wider">
              Rep
            </div>
          </div>
        );
      }

      // ===== IDENTITY & CONNECTION CARD TYPES =====

      case "mutual_friends": {
        // HIVE Brand: monochrome styling
        const connections = cardProfile?.connections?.connections ?? [];
        const mutualFriends = connections.filter((conn: ProfileConnection) => (conn.mutualCount ?? 0) > 0 || conn.isMutual);
        const mutualCount = mutualFriends.length || (cardProfile?.stats?.mutualFriends ?? 0);
        const maxDisplay = card.size === "1x1" ? 3 : card.size === "2x1" ? 5 : 8;

        return (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-white">{mutualCount}</div>
              <Users size={16} className="text-neutral-400" />
            </div>
            <div className="text-xs text-hive-text-secondary">
              Friends in common
            </div>
            {card.size !== "1x1" && mutualCount > 0 && (
              <div className="mt-3">
                <div className="flex -space-x-2">
                  {Array.from({ length: Math.min(maxDisplay, mutualCount) }).map((_, i) => (
                    <div
                      key={i}
                      className="h-7 w-7 rounded-full border-2 border-neutral-950 bg-white/[0.08]"
                    />
                  ))}
                  {mutualCount > maxDisplay && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-neutral-950 bg-neutral-900">
                      <span className="text-[10px] text-hive-text-secondary">
                        +{mutualCount - maxDisplay}
                      </span>
                    </div>
                  )}
                </div>
                {card.size === "2x2" && onViewConnections && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 w-full text-xs"
                    onClick={onViewConnections}
                  >
                    View All Mutuals
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      }

      case "shared_spaces": {
        // HIVE Brand: monochrome, no colored accents
        const connections = cardProfile?.connections?.connections ?? [];
        const sharedSpacesList: string[] = [];
        connections.forEach((conn: ProfileConnection) => {
          if (conn.sharedSpaces) {
            sharedSpacesList.push(...conn.sharedSpaces);
          }
        });
        const uniqueSpaces = [...new Set(sharedSpacesList)];
        const spaceCount = uniqueSpaces.length || (cardProfile?.stats?.sharedSpaces ?? 0);
        const maxDisplay = card.size === "1x1" ? 2 : card.size === "2x1" ? 3 : 5;

        return (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-white">{spaceCount}</div>
              <Users size={16} className="text-neutral-400" />
            </div>
            <div className="text-xs text-hive-text-secondary">
              Spaces in common
            </div>
            {card.size !== "1x1" && spaceCount > 0 && (
              <div className="mt-3 space-y-1.5">
                {uniqueSpaces.slice(0, maxDisplay).map((space, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2.5 py-1.5"
                  >
                    <div className="h-2 w-2 rounded-full bg-neutral-400" />
                    <span className="text-xs text-white truncate">{space}</span>
                  </div>
                ))}
                {spaceCount > maxDisplay && (
                  <div className="text-xs text-hive-text-secondary px-2">
                    +{spaceCount - maxDisplay} more spaces
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      default:
        return (
          <div className="mt-2 space-y-2">
            <div className="text-sm text-hive-text-secondary">
              Widget coming soon
            </div>
          </div>
        );
    }
  };

  const renderCard = (card: GridCard, index: number) => {
    const resolvedType =
      card.type === "custom" ? (card.customType as string | undefined) ?? card.type : card.type;

    const config =
      CARD_CONFIGS[resolvedType] ??
      CARD_CONFIGS[card.customType ?? ""] ?? {
        title: card.title ?? "Widget",
        icon: Settings,
      };

    // Gold accent ONLY for achievements/rep (brand rule)
    const isGoldAccent = config.isGoldAccent ?? false;

    // Calculate grid placement from card size and position
    const [cols, rows] = card.size.split("x").map(Number);
    const colspan = cols || 1;
    const rowspan = rows || 1;

    // Explicit CSS Grid positioning
    const gridStyle = {
      gridColumn: `${card.position.x + 1} / span ${colspan}`,
      gridRow: `${card.position.y + 1} / span ${rowspan}`,
    };

    // Size-based min-heights for proper card sizing
    const sizeClasses = {
      "1x1": "min-h-[120px]",
      "2x1": "min-h-[120px]",
      "2x2": "min-h-[260px]",
      "3x1": "min-h-[120px]",
      "3x2": "min-h-[260px]",
      "4x1": "min-h-[120px]",
    };
    const minHeightClass = sizeClasses[card.size as keyof typeof sizeClasses] ?? "min-h-[120px]";

    // Determine if this is a hero card (2x2) vs stat card (1x1)
    const isHeroCard = card.size === "2x2";
    const isWideCard = card.size === "2x1" || card.size === "3x1";

    return (
      <InView
        key={card.id}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        }}
        transition={{ duration: 0.3, delay: index * 0.03 }}
        once={true}
        style={gridStyle}
        className="contents"
      >
        <div
          className={cn(
            "group relative overflow-hidden cursor-pointer rounded-xl",
            minHeightClass,
            "bg-neutral-900 border border-neutral-800",
            "transition-colors duration-200",
            "hover:border-neutral-600",
          )}
          style={gridStyle}
        >
          {/* Card header */}
          <div className={cn("px-4 pt-4 pb-1", isHeroCard && "px-5 pt-5")}>
            <div className="flex items-center justify-between">
              <span className={cn(
                "uppercase tracking-wider text-neutral-500 font-medium",
                isHeroCard ? "text-sm" : "text-xs"
              )}>
                {config.title}
              </span>
              <config.icon className={cn(
                isGoldAccent ? "text-gold-500" : "text-neutral-600",
                isHeroCard ? "h-5 w-5" : "h-4 w-4"
              )} />
            </div>

            {/* Edit controls - 44x44px touch target for accessibility */}
            {editable && (
              <button
                type="button"
                onClick={() => toggleCardSize(card.id)}
                className="absolute right-0 top-0 w-11 h-11 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
                aria-label={card.size === "2x2" ? "Minimize card" : "Expand card"}
              >
                <span className="w-7 h-7 rounded-md bg-neutral-800/90 flex items-center justify-center">
                  {card.size === "2x2" ? (
                    <Minimize2 size={14} className="text-neutral-300" />
                  ) : (
                    <Maximize2 size={14} className="text-neutral-300" />
                  )}
                </span>
              </button>
            )}
          </div>

          {/* Card content */}
          <div className={cn("px-4 pb-4", isHeroCard && "px-5 pb-5")}>{renderCardContent(card)}</div>
        </div>
      </InView>
    );
  };

  return (
    <motion.div
      ref={gridRef}
      variants={premiumContainerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "grid gap-3",
        isMobile
          ? "grid-cols-2 auto-rows-[minmax(100px,auto)]"
          : "grid-cols-4 auto-rows-[minmax(120px,auto)]",
        className,
      )}
    >
      <AnimatePresence mode="popLayout">
        {activeCards
          .filter((card) => card.visible ?? true)
          .map((card, index) => renderCard(card, index))}
      </AnimatePresence>

      {editable && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onLayoutChange?.(layout as BentoGridLayout)}
            className="px-5 py-2.5 rounded-full text-sm font-medium bg-white/90 text-neutral-950 hover:bg-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-colors"
          >
            Save Layout
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}

function cardTypeLabel(type: string) {
  switch (type) {
    case "spaces_hub":
      return "Spaces overview";
    case "friends_network":
      return "Network";
    case "active_now":
      return "Active now";
    case "schedule_overlap":
      return "Schedule overlap";
    case "discovery":
      return "Discover";
    case "vibe_check":
      return "Campus vibe";
    case "tools_created":
      return "Tools";
    case "rituals_active":
      return "Rituals";
    case "reputation":
      return "Reputation";
    default:
      return "Widget";
  }
}
