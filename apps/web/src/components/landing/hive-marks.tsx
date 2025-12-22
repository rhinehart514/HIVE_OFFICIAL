"use client";

import { motion } from "framer-motion";

interface MarkProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * HIVE Custom Mark System
 *
 * A family of hexagon-derived shapes unique to HIVE.
 * Use these instead of generic icons throughout the platform.
 */

// Primary hexagon mark - the core HIVE symbol
export function HexMark({ size = 24, className = "" }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 2L21 7v10l-9 5-9-5V7l9-5z" />
    </svg>
  );
}

// Outlined hexagon - secondary emphasis
export function HexOutline({ size = 24, className = "" }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
    >
      <path d="M12 2L21 7v10l-9 5-9-5V7l9-5z" />
    </svg>
  );
}

// Cell mark - single hexagon cell, represents individual/unit
export function CellMark({ size = 24, className = "" }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 6L16 8.5v5L12 16l-4-2.5v-5L12 6z" />
    </svg>
  );
}

// Cluster mark - multiple cells, represents community/group
export function ClusterMark({ size = 24, className = "" }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      {/* Center cell */}
      <path d="M12 8L15 9.75v3.5L12 15l-3-1.75v-3.5L12 8z" opacity={1} />
      {/* Top cell */}
      <path d="M12 2L15 3.75v3.5L12 9l-3-1.75v-3.5L12 2z" opacity={0.5} />
      {/* Bottom left */}
      <path d="M7 11L10 12.75v3.5L7 18l-3-1.75v-3.5L7 11z" opacity={0.3} />
      {/* Bottom right */}
      <path d="M17 11L20 12.75v3.5L17 18l-3-1.75v-3.5L17 11z" opacity={0.3} />
    </svg>
  );
}

// Build mark - hexagon with inner structure, represents creation/building
export function BuildMark({ size = 24, className = "" }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
    >
      {/* Outer hex */}
      <path d="M12 2L21 7v10l-9 5-9-5V7l9-5z" />
      {/* Inner structure lines */}
      <path d="M12 7v10M7 9.5l10 5M7 14.5l10-5" opacity={0.5} />
    </svg>
  );
}

// Pulse mark - animated, represents live/active state
export function PulseMark({ size = 24, className = "", animate = true }: MarkProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
    >
      {/* Outer pulse ring */}
      {animate && (
        <motion.path
          d="M12 2L21 7v10l-9 5-9-5V7l9-5z"
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 1.3 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          style={{ transformOrigin: "center" }}
        />
      )}
      {/* Core */}
      <path d="M12 6L17 9v6l-5 3-5-3V9l5-3z" fill="currentColor" />
    </motion.svg>
  );
}

// Arrow mark - directional, hex-inspired angle
export function ArrowMark({ size = 24, className = "", direction = "right" }: MarkProps & { direction?: "right" | "down" | "left" | "up" }) {
  const rotations = { right: 0, down: 90, left: 180, up: 270 };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ transform: `rotate(${rotations[direction]}deg)` }}
    >
      {/* 60-degree angled arrow, hex-inspired */}
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// Grid fragment - honeycomb texture element
export function GridFragment({ size = 24, className = "" }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={0.5}
      className={className}
    >
      <path d="M6 4L9 6v4L6 12 3 10V6L6 4z" />
      <path d="M12 4L15 6v4L12 12 9 10V6L12 4z" />
      <path d="M18 4L21 6v4L18 12 15 10V6L18 4z" />
      <path d="M9 10L12 12v4L9 18 6 16v-4L9 10z" />
      <path d="M15 10L18 12v4L15 18 12 16v-4L15 10z" />
    </svg>
  );
}

// Status dot with hex shape
export function HexDot({ size = 8, className = "", variant = "default" }: MarkProps & { variant?: "default" | "active" | "new" }) {
  const colors = {
    default: "currentColor",
    active: "#22c55e",  // green
    new: "#3b82f6",     // blue
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      fill={colors[variant]}
      className={className}
    >
      <path d="M4 0.5L7.5 2.5v3L4 7.5L0.5 5.5v-3L4 0.5z" />
    </svg>
  );
}

// Divider line with hex accent
export function HexDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
      <HexOutline size={8} className="text-white/20" />
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
    </div>
  );
}

// Section number with hex background
export function SectionNumber({ number, className = "" }: { number: string; className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <HexOutline size={48} className="text-white/[0.06] absolute" />
      <span className="font-mono text-lg text-white/30">{number}</span>
    </div>
  );
}

// Animated building indicator
export function BuildingIndicator({ size = 16, className = "" }: MarkProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <GridFragment size={size} className="text-gold-500/40" />
      </motion.div>
      <CellMark size={size * 0.4} className="absolute text-gold-500" />
    </div>
  );
}
