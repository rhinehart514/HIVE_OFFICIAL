"use client";

import * as React from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { cn } from "../lib/utils";

/**
 * THE COHERENCE STREAM
 *
 * Design decisions flow from worldview to implementation.
 * Each level filters and refines the one above it.
 *
 * This component IS the design system while documenting it.
 */

// ============================================
// LEVEL 3: LANGUAGE (Tokens)
// ============================================

const tokens = {
  // Colors - Warm darks (Room at 3am)
  colors: {
    void: "#050504",
    ground: "#0A0A09",
    surface: "#141312",
    surfaceHover: "#1A1917",
    surfaceActive: "#252521",
    elevated: "#1E1D1B",

    textPrimary: "#FAF9F7",
    textSecondary: "#A3A19E",
    textTertiary: "#6B6B70",
    textMuted: "#3D3D42",
    textGhost: "#2A2A2E",

    // The campfire
    lifeGold: "#FFD700",
    lifeGoldHover: "#FFDF33",
    lifeGoldActive: "#E5C200",
    lifePulse: "rgba(255, 215, 0, 0.60)",
    lifeGlow: "rgba(255, 215, 0, 0.15)",
    lifeSubtle: "rgba(255, 215, 0, 0.08)",

    // Interactive
    interactive: "rgba(255, 255, 255, 0.06)",
    interactiveHover: "rgba(255, 255, 255, 0.10)",
    interactiveActive: "rgba(255, 255, 255, 0.15)",

    // Focus (WHITE, never gold)
    focusRing: "rgba(255, 255, 255, 0.50)",

    // Status (ultra-rare)
    error: "#EF4444",
    warning: "#F59E0B",
    success: "#22C55E",
  },

  // Motion - Answers questions, not decoration
  motion: {
    instant: 0,
    snap: 100,
    fast: 150,
    quick: 200,
    smooth: 300,
    gentle: 400,
    slow: 500,
    dramatic: 700,
    breathe: 4000,
  },

  // Easing
  ease: {
    smooth: [0.22, 1, 0.36, 1],
    out: [0, 0, 0.2, 1],
    inOut: [0.4, 0, 0.2, 1],
  },

  // Spacing (4px base)
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
  },

  // Border radius
  radius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
} as const;

// ============================================
// LEVEL 4: SYSTEMS
// ============================================

// Atmosphere System - Context-aware density
type Atmosphere = "landing" | "comfortable" | "workshop";

const atmosphereConfig: Record<Atmosphere, {
  gap: number;
  padding: number;
  fontSize: string;
  motionDuration: number;
  goldBudget: string;
}> = {
  landing: {
    gap: tokens.space[12],
    padding: tokens.space[16],
    fontSize: "display",
    motionDuration: tokens.motion.dramatic,
    goldBudget: "CTAs only",
  },
  comfortable: {
    gap: tokens.space[6],
    padding: tokens.space[6],
    fontSize: "body",
    motionDuration: tokens.motion.smooth,
    goldBudget: "presence + achievements",
  },
  workshop: {
    gap: tokens.space[3],
    padding: tokens.space[4],
    fontSize: "body-sm",
    motionDuration: tokens.motion.snap,
    goldBudget: "active selection only",
  },
};

// Shell Mode System
type ShellMode = "rail" | "living" | "hidden";

const shellConfig: Record<ShellMode, {
  width: number;
  showActivity: boolean;
  description: string;
}> = {
  rail: {
    width: 48,
    showActivity: false,
    description: "Icons only, maximum content",
  },
  living: {
    width: 240,
    showActivity: true,
    description: "Space heartbeat with activity",
  },
  hidden: {
    width: 0,
    showActivity: false,
    description: "Full workspace takeover",
  },
};

// Motion System - Page transitions
const pageTransitions = {
  enter: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: tokens.ease.smooth },
  },
  exit: {
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.15, ease: tokens.ease.out },
  },
  shift: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.2, ease: tokens.ease.inOut },
  },
  expand: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, ease: tokens.ease.smooth },
  },
};

// ============================================
// LEVEL 5: PRIMITIVES
// ============================================

// Life Dot - The breathing presence indicator
const LifeDot = React.forwardRef<
  HTMLSpanElement,
  {
    size?: "xs" | "sm" | "md" | "lg";
    status?: "active" | "away" | "offline";
    className?: string;
  }
>(({ size = "md", status = "active", className }, ref) => {
  const sizeMap = { xs: 6, sm: 8, md: 10, lg: 12 };
  const dimension = sizeMap[size];

  return (
    <motion.span
      ref={ref}
      className={cn("rounded-full", className)}
      style={{
        width: dimension,
        height: dimension,
        backgroundColor: status === "active"
          ? tokens.colors.lifeGold
          : status === "away"
          ? tokens.colors.lifePulse
          : tokens.colors.textMuted,
      }}
      animate={status === "active" ? {
        opacity: [0.6, 1, 0.6],
        scale: [1, 1.05, 1],
      } : undefined}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
});
LifeDot.displayName = "LifeDot";

// ============================================
// LEVEL 8: TEMPLATES
// ============================================

// Shell Template - The container for all pages
interface ShellTemplateProps {
  mode: ShellMode;
  atmosphere: Atmosphere;
  children: React.ReactNode;
  onModeChange?: (mode: ShellMode) => void;
}

const ShellTemplate: React.FC<ShellTemplateProps> = ({
  mode,
  atmosphere,
  children,
  onModeChange,
}) => {
  const config = shellConfig[mode];
  const atmos = atmosphereConfig[atmosphere];

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: tokens.colors.ground }}
    >
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {mode !== "hidden" && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{
              width: config.width,
              opacity: 1,
            }}
            exit={{ width: 0, opacity: 0 }}
            transition={{
              duration: atmos.motionDuration / 1000,
              ease: tokens.ease.smooth,
            }}
            className="flex-shrink-0 border-r overflow-hidden"
            style={{
              borderColor: tokens.colors.interactive,
              backgroundColor: tokens.colors.surface,
            }}
          >
            <div className="h-full flex flex-col p-3">
              {/* Logo */}
              <div className="flex items-center justify-center h-10 mb-4">
                <span
                  className="text-lg font-bold"
                  style={{ color: tokens.colors.textPrimary }}
                >
                  {mode === "rail" ? "⬡" : "⬡ HIVE"}
                </span>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-2">
                {["Feed", "Spaces", "Build"].map((item, i) => (
                  <motion.button
                    key={item}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: tokens.colors.interactive }}
                    whileHover={{ backgroundColor: tokens.colors.interactiveHover }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span style={{ color: tokens.colors.textSecondary }}>
                      {["≡", "□", "⚙"][i]}
                    </span>
                    {mode === "living" && (
                      <span
                        className="text-sm"
                        style={{ color: tokens.colors.textSecondary }}
                      >
                        {item}
                      </span>
                    )}
                  </motion.button>
                ))}
              </nav>

              {/* Activity Section (Living mode only) */}
              {config.showActivity && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="border-t pt-4 mt-4"
                  style={{ borderColor: tokens.colors.interactive }}
                >
                  <div
                    className="text-xs font-medium uppercase tracking-wider mb-3"
                    style={{ color: tokens.colors.textTertiary }}
                  >
                    Activity
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex -space-x-2">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border-2"
                          style={{
                            backgroundColor: tokens.colors.surfaceHover,
                            borderColor: tokens.colors.surface,
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-sm font-mono"
                      style={{ color: tokens.colors.lifeGold }}
                    >
                      5
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: tokens.colors.textSecondary }}
                    >
                      online
                    </span>
                  </div>
                  <div
                    className="text-sm truncate"
                    style={{ color: tokens.colors.textTertiary }}
                  >
                    <LifeDot size="xs" className="inline-block mr-2" />
                    typing...
                  </div>
                </motion.div>
              )}

              {/* Profile */}
              <div className="mt-auto pt-4 border-t" style={{ borderColor: tokens.colors.interactive }}>
                <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: tokens.colors.surfaceHover }}
                  />
                  {mode === "living" && (
                    <span
                      className="text-sm truncate"
                      style={{ color: tokens.colors.textSecondary }}
                    >
                      Profile
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className="flex-1 overflow-auto"
        style={{ padding: atmos.padding }}
      >
        {children}
      </main>
    </div>
  );
};

// ============================================
// COHERENCE STREAM VISUALIZER
// ============================================

const LEVELS = [
  {
    id: 0,
    name: "WORLDVIEW",
    color: tokens.colors.lifeGold,
    description: "Students don't use HIVE—they inhabit it.",
    details: ["Presence over engagement", "Power over convenience", "Emergence over prescription"],
  },
  {
    id: 1,
    name: "PHILOSOPHY",
    color: tokens.colors.textPrimary,
    description: "The Room at 3am",
    details: ["95% grayscale, 5% gold", "Warmth in darkness", "The campfire metaphor"],
  },
  {
    id: 2,
    name: "PRINCIPLES",
    color: tokens.colors.textSecondary,
    description: "Design truths",
    details: ["Presence is Primary", "Content is King", "Motion Answers Questions"],
  },
  {
    id: 3,
    name: "LANGUAGE",
    color: tokens.colors.textTertiary,
    description: "Design tokens",
    details: ["Typography", "Colors", "Motion", "Spacing"],
  },
  {
    id: 4,
    name: "SYSTEMS",
    color: tokens.colors.textTertiary,
    description: "Composed behaviors",
    details: ["Surface", "Glass", "State", "Motion", "Layout", "Life", "Atmosphere"],
  },
  {
    id: 5,
    name: "PRIMITIVES",
    color: tokens.colors.textMuted,
    description: "Base elements",
    details: ["Button", "Input", "Card", "Modal"],
  },
  {
    id: 6,
    name: "COMPONENTS",
    color: tokens.colors.textMuted,
    description: "Feature blocks",
    details: ["SpaceCard", "ChatMessage", "ProfileCard"],
  },
  {
    id: 7,
    name: "PATTERNS",
    color: tokens.colors.textGhost,
    description: "Recurring solutions",
    details: ["Infinite scroll", "Optimistic updates", "Draft auto-save"],
  },
  {
    id: 8,
    name: "TEMPLATES",
    color: tokens.colors.textGhost,
    description: "Page compositions",
    details: ["Shell", "Feed", "Workspace", "Portal"],
  },
  {
    id: 9,
    name: "INSTANCES",
    color: tokens.colors.textGhost,
    description: "Specific pages",
    details: ["Landing", "Space Home", "HiveLab IDE", "Profile"],
  },
];

interface CoherenceStreamProps {
  className?: string;
}

export const CoherenceStream: React.FC<CoherenceStreamProps> = ({ className }) => {
  const [activeLevel, setActiveLevel] = React.useState<number | null>(null);
  const [atmosphere, setAtmosphere] = React.useState<Atmosphere>("comfortable");
  const [shellMode, setShellMode] = React.useState<ShellMode>("rail");
  const [showDemo, setShowDemo] = React.useState(false);

  return (
    <div
      className={cn("min-h-screen", className)}
      style={{ backgroundColor: tokens.colors.ground }}
    >
      {/* Hero Section */}
      <motion.header
        className="relative overflow-hidden"
        style={{
          minHeight: "60vh",
          background: `linear-gradient(180deg, ${tokens.colors.void} 0%, ${tokens.colors.ground} 100%)`,
        }}
        {...pageTransitions.enter}
      >
        {/* Floating gold particles (the campfire sparks) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                backgroundColor: tokens.colors.lifeGold,
                left: `${10 + Math.random() * 80}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 0.8, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 6 + Math.random() * 4,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-8 py-24">
          {/* Label */}
          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <LifeDot size="md" />
            <span
              className="text-xs font-mono uppercase tracking-[0.2em]"
              style={{ color: tokens.colors.textTertiary }}
            >
              Design Architecture
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="font-display text-6xl md:text-7xl font-bold tracking-tight mb-6"
            style={{ color: tokens.colors.textPrimary }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: tokens.ease.smooth }}
          >
            The Coherence
            <br />
            <span style={{ color: tokens.colors.lifeGold }}>Stream</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-xl md:text-2xl max-w-xl"
            style={{ color: tokens.colors.textSecondary }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Design decisions flow from worldview to implementation.
            <br />
            <span style={{ color: tokens.colors.textTertiary }}>
              Philosophy cascades into pixels.
            </span>
          </motion.p>
        </div>

        {/* Bottom gradient fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32"
          style={{
            background: `linear-gradient(to top, ${tokens.colors.ground}, transparent)`,
          }}
        />
      </motion.header>

      {/* The Stream Visualization */}
      <section className="max-w-5xl mx-auto px-8 py-16">
        <LayoutGroup>
          <div className="relative">
            {/* Connecting line */}
            <div
              className="absolute left-[23px] top-0 bottom-0 w-px"
              style={{
                background: `linear-gradient(180deg,
                  ${tokens.colors.lifeGold} 0%,
                  ${tokens.colors.textSecondary} 30%,
                  ${tokens.colors.textMuted} 60%,
                  ${tokens.colors.textGhost} 100%
                )`,
              }}
            />

            {/* Levels */}
            <div className="space-y-2">
              {LEVELS.map((level, index) => (
                <motion.div
                  key={level.id}
                  layout
                  className="relative pl-12"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Node */}
                  <motion.button
                    className="absolute left-0 w-12 h-12 flex items-center justify-center"
                    onClick={() => setActiveLevel(activeLevel === level.id ? null : level.id)}
                    whileHover={{ opacity: 0.9 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: level.color }}
                      animate={level.id === 0 ? {
                        opacity: [0.6, 1, 0.6],
                        scale: [1, 1.2, 1],
                      } : undefined}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </motion.button>

                  {/* Content */}
                  <motion.div
                    className="py-4 px-4 rounded-lg cursor-pointer"
                    style={{
                      backgroundColor: activeLevel === level.id
                        ? tokens.colors.interactive
                        : "transparent",
                    }}
                    onClick={() => setActiveLevel(activeLevel === level.id ? null : level.id)}
                    whileHover={{ backgroundColor: tokens.colors.interactive }}
                  >
                    <div className="flex items-baseline gap-4 mb-1">
                      <span
                        className="text-xs font-mono"
                        style={{ color: tokens.colors.textMuted }}
                      >
                        {String(level.id).padStart(2, "0")}
                      </span>
                      <h3
                        className="font-display text-lg font-semibold tracking-tight"
                        style={{ color: level.color }}
                      >
                        {level.name}
                      </h3>
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: tokens.colors.textSecondary }}
                    >
                      {level.description}
                    </p>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {activeLevel === level.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t"
                          style={{ borderColor: tokens.colors.interactive }}
                        >
                          <div className="flex flex-wrap gap-2">
                            {level.details.map((detail, i) => (
                              <span
                                key={i}
                                className="px-3 py-1.5 text-xs font-mono rounded-full"
                                style={{
                                  backgroundColor: tokens.colors.surfaceHover,
                                  color: tokens.colors.textSecondary,
                                }}
                              >
                                {detail}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </LayoutGroup>
      </section>

      {/* Interactive Demo Section */}
      <section
        className="border-t"
        style={{
          borderColor: tokens.colors.interactive,
          backgroundColor: tokens.colors.surface,
        }}
      >
        <div className="max-w-5xl mx-auto px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className="font-display text-2xl font-semibold tracking-tight mb-2"
                style={{ color: tokens.colors.textPrimary }}
              >
                Systems in Action
              </h2>
              <p style={{ color: tokens.colors.textSecondary }}>
                See how atmosphere and shell mode affect the interface
              </p>
            </div>

            <motion.button
              className="px-6 py-3 rounded-lg font-medium"
              style={{
                backgroundColor: showDemo ? tokens.colors.interactive : tokens.colors.lifeGold,
                color: showDemo ? tokens.colors.textPrimary : tokens.colors.void,
              }}
              onClick={() => setShowDemo(!showDemo)}
              whileHover={{ opacity: 0.96 }}
              whileTap={{ scale: 0.98 }}
            >
              {showDemo ? "Hide Demo" : "Open Demo"}
            </motion.button>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-8 mb-8">
            {/* Atmosphere Selector */}
            <div>
              <label
                className="block text-xs font-mono uppercase tracking-wider mb-3"
                style={{ color: tokens.colors.textTertiary }}
              >
                Atmosphere
              </label>
              <div className="flex gap-2">
                {(["landing", "comfortable", "workshop"] as Atmosphere[]).map((a) => (
                  <motion.button
                    key={a}
                    className="px-4 py-2 rounded-lg text-sm capitalize"
                    style={{
                      backgroundColor: atmosphere === a
                        ? tokens.colors.interactiveActive
                        : tokens.colors.interactive,
                      color: atmosphere === a
                        ? tokens.colors.textPrimary
                        : tokens.colors.textSecondary,
                    }}
                    onClick={() => setAtmosphere(a)}
                    whileHover={{ backgroundColor: tokens.colors.interactiveHover }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {a}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Shell Mode Selector */}
            <div>
              <label
                className="block text-xs font-mono uppercase tracking-wider mb-3"
                style={{ color: tokens.colors.textTertiary }}
              >
                Shell Mode
              </label>
              <div className="flex gap-2">
                {(["rail", "living", "hidden"] as ShellMode[]).map((m) => (
                  <motion.button
                    key={m}
                    className="px-4 py-2 rounded-lg text-sm capitalize"
                    style={{
                      backgroundColor: shellMode === m
                        ? tokens.colors.interactiveActive
                        : tokens.colors.interactive,
                      color: shellMode === m
                        ? tokens.colors.textPrimary
                        : tokens.colors.textSecondary,
                    }}
                    onClick={() => setShellMode(m)}
                    whileHover={{ backgroundColor: tokens.colors.interactiveHover }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {m} ({shellConfig[m].width}px)
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Config Display */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg mb-8"
            style={{ backgroundColor: tokens.colors.ground }}
          >
            <div>
              <div
                className="text-xs font-mono uppercase mb-1"
                style={{ color: tokens.colors.textMuted }}
              >
                Gap
              </div>
              <div
                className="font-mono"
                style={{ color: tokens.colors.textPrimary }}
              >
                {atmosphereConfig[atmosphere].gap}px
              </div>
            </div>
            <div>
              <div
                className="text-xs font-mono uppercase mb-1"
                style={{ color: tokens.colors.textMuted }}
              >
                Motion
              </div>
              <div
                className="font-mono"
                style={{ color: tokens.colors.textPrimary }}
              >
                {atmosphereConfig[atmosphere].motionDuration}ms
              </div>
            </div>
            <div>
              <div
                className="text-xs font-mono uppercase mb-1"
                style={{ color: tokens.colors.textMuted }}
              >
                Gold Budget
              </div>
              <div
                className="font-mono text-sm"
                style={{ color: tokens.colors.lifeGold }}
              >
                {atmosphereConfig[atmosphere].goldBudget}
              </div>
            </div>
            <div>
              <div
                className="text-xs font-mono uppercase mb-1"
                style={{ color: tokens.colors.textMuted }}
              >
                Sidebar
              </div>
              <div
                className="font-mono"
                style={{ color: tokens.colors.textPrimary }}
              >
                {shellConfig[shellMode].width}px
              </div>
            </div>
          </div>

          {/* Live Demo */}
          <AnimatePresence>
            {showDemo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 500 }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl overflow-hidden border"
                style={{ borderColor: tokens.colors.interactive }}
              >
                <ShellTemplate
                  mode={shellMode}
                  atmosphere={atmosphere}
                  onModeChange={setShellMode}
                >
                  <motion.div
                    key={atmosphere}
                    className="h-full flex flex-col"
                    style={{ gap: atmosphereConfig[atmosphere].gap }}
                    {...pageTransitions.enter}
                  >
                    <div
                      className="p-6 rounded-lg"
                      style={{ backgroundColor: tokens.colors.surface }}
                    >
                      <h3
                        className="font-display text-xl font-semibold mb-2"
                        style={{ color: tokens.colors.textPrimary }}
                      >
                        {atmosphere === "landing" && "Welcome to HIVE"}
                        {atmosphere === "comfortable" && "Your Spaces"}
                        {atmosphere === "workshop" && "HiveLab IDE"}
                      </h3>
                      <p style={{ color: tokens.colors.textSecondary }}>
                        {atmosphereConfig[atmosphere].goldBudget} in this context
                      </p>
                    </div>

                    <div
                      className="flex-1 grid grid-cols-2 md:grid-cols-3"
                      style={{ gap: atmosphereConfig[atmosphere].gap }}
                    >
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="rounded-lg"
                          style={{
                            backgroundColor: tokens.colors.surface,
                            padding: atmosphereConfig[atmosphere].padding,
                          }}
                          whileHover={{
                            backgroundColor: tokens.colors.surfaceHover,
                            scale: 1.02,
                          }}
                          transition={{
                            duration: atmosphereConfig[atmosphere].motionDuration / 1000,
                          }}
                        >
                          <div
                            className="h-12 rounded mb-3"
                            style={{ backgroundColor: tokens.colors.ground }}
                          />
                          <div
                            className="h-3 rounded w-3/4 mb-2"
                            style={{ backgroundColor: tokens.colors.textMuted }}
                          />
                          <div
                            className="h-2 rounded w-1/2"
                            style={{ backgroundColor: tokens.colors.textGhost }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </ShellTemplate>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t py-12"
        style={{ borderColor: tokens.colors.interactive }}
      >
        <div className="max-w-5xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LifeDot />
            <span
              className="font-mono text-sm"
              style={{ color: tokens.colors.textTertiary }}
            >
              HIVE Design System
            </span>
          </div>
          <span
            className="text-xs"
            style={{ color: tokens.colors.textMuted }}
          >
            Philosophy → Pixels
          </span>
        </div>
      </footer>
    </div>
  );
};

// Export everything
export {
  tokens,
  atmosphereConfig,
  shellConfig,
  pageTransitions,
  LifeDot,
  ShellTemplate,
};

export type { Atmosphere, ShellMode };

export default CoherenceStream;
