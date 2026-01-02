'use client';

/**
 * Space Layout Concepts - Statement Edition
 *
 * Design Philosophy:
 * - HIVE logo as compositional hero (ownable, not decorative)
 * - Display typography (100px+) that commands attention
 * - Asymmetric layouts that break the grid intentionally
 * - Layered depth with texture and dimension
 * - Gold as signature accent (Hermès level restraint)
 * - "Wait, what?" moments that demand screenshots
 *
 * This is graphic design, not UI.
 */

import { motion, AnimatePresence } from 'framer-motion';
import * as React from 'react';
import { cn } from '../../../lib/utils';

// ============================================
// DESIGN SYSTEM - Statement
// ============================================

// The hex path - simple geometric
const HEX_PATH = "M12 2L21 7v10l-9 5-9-5V7l9-5z";

// The OFFICIAL HIVE logo path - our ownable mark
const HIVE_LOGO_PATH = "M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z";

function Hex({ size = 24, className, filled = false }: { size?: number; className?: string; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d={HEX_PATH} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 1} />
    </svg>
  );
}

// The HIVE logo mark - use this instead of generic hexagons
function HiveMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1500 1500" className={className} fill="currentColor">
      <path d={HIVE_LOGO_PATH} />
    </svg>
  );
}

// Massive background watermark - the compositional hero
// Now more visible so glassmorphism has something to blur
function HiveWatermark({ className, opacity = 0.04 }: { className?: string; opacity?: number }) {
  return (
    <div className={cn('pointer-events-none absolute overflow-hidden', className)}>
      <svg
        viewBox="0 0 1500 1500"
        className="w-[900px] h-[900px]"
        style={{ opacity }}
        fill="currentColor"
      >
        <path d={HIVE_LOGO_PATH} />
      </svg>
    </div>
  );
}

// Glassmorphism surface - PREMIUM FROSTED GLASS
// Key insight: Glass needs visible content behind it AND strong enough blur to feel tangible
function GlassSurface({
  children,
  className,
  blur = 'md',
  intensity = 'subtle',
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  intensity?: 'subtle' | 'medium' | 'strong' | 'frosted';
  glow?: boolean;
}) {
  const blurMap = {
    sm: 'backdrop-blur-[8px]',
    md: 'backdrop-blur-[16px]',
    lg: 'backdrop-blur-[24px]',
    xl: 'backdrop-blur-[32px]',
  };

  const intensityMap = {
    subtle: 'bg-white/[0.02] border-white/[0.05]',
    medium: 'bg-white/[0.04] border-white/[0.08]',
    strong: 'bg-white/[0.06] border-white/[0.10]',
    frosted: 'bg-white/[0.08] border-white/[0.12]',
  };

  return (
    <div
      className={cn(
        blurMap[blur],
        intensityMap[intensity],
        'border rounded-xl',
        // Multi-layer inner glow for depth
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),inset_0_0_20px_rgba(255,255,255,0.02)]',
        // Optional outer glow
        glow && 'shadow-[0_0_40px_rgba(255,215,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.08)]',
        className
      )}
    >
      {children}
    </div>
  );
}

// Glass card with gold accent option - STRONGER PRESENCE
function GlassCard({
  children,
  className,
  accent = false,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        'backdrop-blur-[16px] rounded-xl',
        'bg-white/[0.03] border border-white/[0.08]',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),inset_0_0_12px_rgba(255,255,255,0.01)]',
        accent && 'border-l-2 border-l-[#FFD700]/50',
        hover && 'hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300',
        className
      )}
    >
      {children}
    </div>
  );
}

// Noise texture overlay for premium glass feel
function NoiseTexture({ opacity = 0.015 }: { opacity?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-xl"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        opacity,
      }}
      aria-hidden="true"
    />
  );
}

// Honeycomb grid texture - subtle depth layer
function HoneycombTexture({ opacity = 0.02 }: { opacity?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-32l20-12v-8L28 6 8 18v8l20 12z' fill='%23FFD700' fill-opacity='${opacity}'/%3E%3C/svg%3E")`,
      }}
      aria-hidden="true"
    />
  );
}

// Spring configs
const spring = {
  gentle: { type: 'spring' as const, stiffness: 120, damping: 20 },
  snappy: { type: 'spring' as const, stiffness: 400, damping: 30 },
  smooth: { type: 'spring' as const, stiffness: 80, damping: 15 },
};

// ============================================
// WOW DESIGN ELEMENTS - Premium Motion & Effects
// ============================================

// Animated gold shimmer sweep - the "wow" highlight
function GoldShimmer({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FFD700]/20 to-transparent"
        style={{ width: '200%', left: '-100%' }}
        animate={{ left: ['−100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

// Floating gold particles - ambient luxury
function GoldParticles({ count = 12 }: { count?: number }) {
  const particles = React.useMemo(() =>
    Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 10,
    })), [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#FFD700]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Premium live indicator with glow pulse
function LivePulse({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'h-1.5 w-1.5', md: 'h-2 w-2', lg: 'h-3 w-3' };
  const glowMap = { sm: '4px', md: '8px', lg: '12px' };

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex">
        {/* Outer glow ring */}
        <motion.span
          className={cn('absolute inline-flex rounded-full bg-[#FFD700]/30', sizeMap[size])}
          style={{ boxShadow: `0 0 ${glowMap[size]} #FFD700` }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
        {/* Inner ping */}
        <motion.span
          className={cn('absolute inline-flex rounded-full bg-[#FFD700]', sizeMap[size])}
          animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.3, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Core */}
        <span className={cn('relative inline-flex rounded-full bg-[#FFD700]', sizeMap[size])} />
      </span>
      <motion.span
        className="text-[10px] text-[#FFD700] uppercase tracking-[0.2em] font-semibold"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Live
      </motion.span>
    </div>
  );
}

// Glass message with premium hover
function GlassMessage({
  author,
  content,
  time,
  isHighlighted = false,
  isAction = false,
}: {
  author: string;
  content: string;
  time: string;
  isHighlighted?: boolean;
  isAction?: boolean;
}) {
  return (
    <motion.div
      className={cn(
        'group relative py-4 px-4 rounded-xl mb-3',
        'transition-all duration-300',
        isHighlighted
          ? 'bg-[#FFD700]/[0.04] border border-[#FFD700]/20'
          : 'hover:bg-white/[0.02]'
      )}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.005, transition: { duration: 0.2 } }}
    >
      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: isHighlighted
            ? 'radial-gradient(ellipse at center, rgba(255,215,0,0.05) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(255,255,255,0.02) 0%, transparent 70%)',
        }}
      />

      {/* Gold accent for highlighted */}
      {isHighlighted && (
        <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-gradient-to-b from-[#FFD700] via-[#FFD700]/60 to-transparent" />
      )}

      <div className="relative z-10">
        <div className="flex items-baseline gap-4 mb-1.5">
          <span className={cn(
            'text-sm font-medium tracking-tight',
            isHighlighted ? 'text-[#FFD700]' : 'text-white/90'
          )}>
            {author}
          </span>
          <span className="text-[10px] text-white/25 uppercase tracking-wider">{time}</span>
        </div>
        <p className={cn(
          'text-[15px] leading-relaxed',
          isAction ? 'text-white/35 italic text-sm' : 'text-white/65'
        )}>
          {content}
        </p>
      </div>
    </motion.div>
  );
}

// Premium send button with gold gradient
function SendButton({ onClick }: { onClick?: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative p-3 rounded-xl overflow-hidden',
        'bg-gradient-to-br from-[#FFD700]/30 via-[#FFD700]/20 to-[#FFD700]/30',
        'border border-[#FFD700]/40',
        'text-[#FFD700]',
        'shadow-[0_0_20px_rgba(255,215,0,0.15)]'
      )}
      whileHover={{
        scale: 1.05,
        boxShadow: '0 0 30px rgba(255,215,0,0.25)',
      }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        style={{ width: '200%', left: '-100%' }}
        animate={{ left: ['−100%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      />
      <svg className="relative z-10 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    </motion.button>
  );
}

// Typing indicator - premium dots
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-[#FFD700]/40"
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
      <span className="ml-2 text-xs text-white/30">Someone is typing...</span>
    </div>
  );
}

// Animated watermark with drift
function AnimatedWatermark({
  className,
  opacity = 0.04,
  color = '#FFD700',
}: {
  className?: string;
  opacity?: number;
  color?: string;
}) {
  return (
    <motion.div
      className={cn('pointer-events-none absolute overflow-hidden', className)}
      animate={{
        x: [0, 10, 0],
        y: [0, -5, 0],
        rotate: [0, 1, 0],
      }}
      transition={{
        duration: 30,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <svg
        viewBox="0 0 1500 1500"
        className="w-[900px] h-[900px]"
        style={{ opacity, color }}
        fill="currentColor"
      >
        <path d={HIVE_LOGO_PATH} />
      </svg>
    </motion.div>
  );
}

// ============================================
// GRAPHIC DESIGN COMPONENTS
// ============================================

// Masthead - The space name as a design statement
function Masthead({
  name,
  memberCount,
  isLive = false,
}: {
  name: string;
  memberCount: number;
  isLive?: boolean;
}) {
  return (
    <div className="relative">
      {/* Giant type */}
      <h1 className="text-[56px] font-bold tracking-tight leading-none text-white">
        {name}
      </h1>

      {/* Metadata line - small, precise */}
      <div className="flex items-center gap-6 mt-3">
        <span className="text-xs text-white/40 uppercase tracking-[0.2em]">
          {memberCount.toLocaleString()} members
        </span>

        {isLive && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD700]" />
            </span>
            <span className="text-xs text-[#FFD700]/80 uppercase tracking-[0.15em]">Live</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Signature button - The HIVE action
function SignatureButton({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'gold';
  className?: string;
}) {
  return (
    <motion.button
      className={cn(
        'relative px-6 py-2.5 text-sm font-medium tracking-wide uppercase',
        'border transition-all duration-300',
        variant === 'default' && [
          'border-white/20 text-white/70',
          'hover:border-white/40 hover:text-white',
        ],
        variant === 'gold' && [
          'border-[#FFD700]/40 text-[#FFD700]',
          'hover:border-[#FFD700] hover:bg-[#FFD700]/5',
        ],
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}

// Message - Editorial treatment
function EditorialMessage({
  author,
  content,
  time,
  isHighlighted = false,
  isAction = false,
}: {
  author: string;
  content: string;
  time: string;
  isHighlighted?: boolean;
  isAction?: boolean;
}) {
  return (
    <motion.div
      className={cn(
        'group py-5 border-b border-white/[0.04]',
        'transition-colors duration-300',
        'hover:bg-white/[0.01]',
        isHighlighted && 'border-l-2 border-l-[#FFD700]/50 pl-6 bg-[#FFD700]/[0.02]'
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-baseline gap-4 mb-2">
        <span className={cn(
          'text-sm font-medium',
          isHighlighted ? 'text-[#FFD700]' : 'text-white/80'
        )}>
          {author}
        </span>
        <span className="text-[10px] text-white/20 uppercase tracking-wider">{time}</span>
      </div>
      <p className={cn(
        'text-base leading-relaxed',
        isAction ? 'text-white/30 italic text-sm' : 'text-white/60'
      )}>
        {content}
      </p>
    </motion.div>
  );
}

// Sidebar module - Clean, modular
function SidebarModule({
  label,
  children,
  accent = false,
}: {
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={cn(
      'py-6 border-b',
      accent ? 'border-[#FFD700]/20' : 'border-white/[0.06]'
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          'w-1 h-3',
          accent ? 'bg-[#FFD700]/60' : 'bg-white/20'
        )} />
        <span className="text-[10px] uppercase tracking-[0.25em] text-white/30 font-medium">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

// Event card - Prominent, informational
function EventCard({
  title,
  date,
  location,
  attendees,
}: {
  title: string;
  date: string;
  location: string;
  attendees: number;
}) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] text-[#FFD700] uppercase tracking-[0.2em]">{date}</p>
      <h3 className="text-lg font-medium text-white leading-tight">{title}</h3>
      <p className="text-xs text-white/30">{location}</p>
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border border-black bg-white/10"
              />
            ))}
          </div>
          <span className="text-xs text-white/30">+{attendees - 3}</span>
        </div>
        <SignatureButton variant="gold" className="text-[10px] px-4 py-1.5">
          RSVP
        </SignatureButton>
      </div>
    </div>
  );
}

// Tool slot - Minimal, functional
function ToolSlot({ name, isActive = false }: { name: string; isActive?: boolean }) {
  return (
    <button className={cn(
      'w-full flex items-center gap-3 py-2.5 px-3 transition-all duration-200',
      'border-l-2',
      isActive
        ? 'border-l-[#FFD700]/60 bg-[#FFD700]/[0.03] text-white/90'
        : 'border-l-transparent text-white/40 hover:text-white/60 hover:bg-white/[0.02]'
    )}>
      <Hex size={14} className={isActive ? 'text-[#FFD700]/60' : 'text-white/20'} />
      <span className="text-sm">{name}</span>
      {isActive && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
      )}
    </button>
  );
}

// Tab navigation - Underline style
function TabNav({
  items,
  active,
  onChange
}: {
  items: string[];
  active: number;
  onChange?: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-8 border-b border-white/[0.06]">
      {items.map((item, i) => (
        <button
          key={item}
          onClick={() => onChange?.(i)}
          className={cn(
            'relative py-4 text-sm transition-colors duration-200',
            i === active ? 'text-white' : 'text-white/30 hover:text-white/50'
          )}
        >
          {item}
          {i === active && (
            <motion.div
              layoutId="tab-underline"
              className="absolute bottom-0 left-0 right-0 h-px bg-white"
              transition={spring.snappy}
            />
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================
// LAYOUT A: CHAT-CENTRIC — "The Hive Mind"
// ============================================
//
// Design philosophy: Make the space feel ALIVE
// - Presence layer: WHO is here, not just a number
// - Message flow: Visual rhythm, not just a list
// - Spatial awareness: Energy indicators, activity pulses
// - Information density: More is more (when organized)
// - HIVE identity: Unmistakably us

// Presence bubble - shows who's actually here
function PresenceBubble({
  name,
  isActive = false,
  color,
}: {
  name: string;
  isActive?: boolean;
  color: string;
}) {
  return (
    <motion.div
      className="relative"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1, zIndex: 10 }}
      transition={spring.snappy}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium',
          'border-2 border-black cursor-pointer',
          isActive && 'ring-2 ring-emerald-500/50'
        )}
        style={{ backgroundColor: color }}
      >
        {name.split(' ').map(n => n[0]).join('')}
      </div>
      {isActive && (
        <motion.div
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

// Presence strip - the "who's here" layer
function PresenceStrip({ people }: { people: Array<{ name: string; isActive?: boolean; color: string }> }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-2">
        {people.slice(0, 5).map((person, i) => (
          <PresenceBubble key={i} {...person} />
        ))}
      </div>
      {people.length > 5 && (
        <motion.div
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/40 border-2 border-black"
          whileHover={{ scale: 1.05 }}
        >
          +{people.length - 5}
        </motion.div>
      )}
      <motion.div
        className="ml-3 flex items-center gap-2"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-[11px] text-emerald-400/80 font-mono">{people.filter(p => p.isActive).length} here now</span>
      </motion.div>
    </div>
  );
}

// Rich message with threading, reactions, and presence
function RichMessage({
  author,
  content,
  time,
  isSystem = false,
  reactions = [],
  replyCount = 0,
  isHighlighted = false,
  hasThread = false,
  color,
}: {
  author: string;
  content: string;
  time: string;
  isSystem?: boolean;
  reactions?: Array<{ emoji: string; count: number }>;
  replyCount?: number;
  isHighlighted?: boolean;
  hasThread?: boolean;
  color: string;
}) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      className={cn(
        'group relative flex gap-3 py-3 px-3 -mx-3 rounded-xl transition-all duration-200',
        isHighlighted ? 'bg-[#FFD700]/[0.04]' : 'hover:bg-white/[0.015]'
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Thread connector line */}
      {hasThread && (
        <div className="absolute left-[22px] top-12 bottom-0 w-px bg-gradient-to-b from-white/10 to-transparent" />
      )}

      {/* Avatar */}
      <div
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-medium flex-shrink-0',
          isSystem ? 'bg-[#FFD700]/20 text-[#FFD700]' : ''
        )}
        style={!isSystem ? { backgroundColor: color } : {}}
      >
        {isSystem ? (
          <Hex size={16} filled className="text-[#FFD700]" />
        ) : (
          author.split(' ').map(n => n[0]).join('')
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className={cn(
            'text-[14px] font-medium',
            isHighlighted ? 'text-[#FFD700]' : 'text-white/90'
          )}>
            {author}
          </span>
          <span className="text-[10px] font-mono text-white/20">{time}</span>
          {isHighlighted && (
            <span className="text-[9px] uppercase tracking-wider text-[#FFD700]/60 font-medium">Pinned</span>
          )}
        </div>

        <p className={cn(
          'text-[14px] leading-relaxed',
          isSystem ? 'text-white/40 italic text-[13px]' : 'text-white/70'
        )}>
          {content}
        </p>

        {/* Reactions + Thread indicator */}
        {(reactions.length > 0 || replyCount > 0) && (
          <div className="flex items-center gap-3 mt-2">
            {reactions.map((r, i) => (
              <motion.button
                key={i}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-[13px]">{r.emoji}</span>
                <span className="text-[11px] text-white/50 font-mono">{r.count}</span>
              </motion.button>
            ))}
            {replyCount > 0 && (
              <button className="text-[12px] text-[#FFD700]/70 hover:text-[#FFD700] transition-colors font-medium">
                {replyCount} replies →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hover actions */}
      <AnimatePresence>
        {isHovered && !isSystem && (
          <motion.div
            className="absolute right-2 top-2 flex items-center gap-1"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {['💬', '⭐', '📌'].map((emoji, i) => (
              <motion.button
                key={i}
                className="p-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-[13px] transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Time separator with activity indicator
function TimeSeparator({ time, activity }: { time: string; activity: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'from-[#FFD700]/20 via-[#FFD700]/5',
    medium: 'from-white/10 via-white/5',
    low: 'from-white/5 via-transparent',
  };

  return (
    <div className="flex items-center gap-4 py-4">
      <div className={cn('flex-1 h-px bg-gradient-to-r to-transparent', colors[activity])} />
      <div className="flex items-center gap-2">
        {activity === 'high' && (
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-[#FFD700]"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">{time}</span>
      </div>
      <div className={cn('flex-1 h-px bg-gradient-to-l to-transparent', colors[activity])} />
    </div>
  );
}

// Typing indicator with names
function TypingIndicatorRich({ names }: { names: string[] }) {
  if (names.length === 0) return null;

  const text = names.length === 1
    ? `${names[0]} is typing`
    : names.length === 2
      ? `${names[0]} and ${names[1]} are typing`
      : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <motion.div
      className="flex items-center gap-3 px-3 py-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#FFD700]/50"
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <span className="text-[12px] text-white/40">{text}</span>
    </motion.div>
  );
}

// Activity pulse for sidebar sections
function ActivityPulse({ hasActivity = false }: { hasActivity?: boolean }) {
  if (!hasActivity) return null;

  return (
    <motion.div
      className="w-2 h-2 rounded-full bg-[#FFD700]"
      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
}

// Tool card with live preview hint
function ToolCard({
  name,
  isLive = false,
  preview,
  participants = 0,
}: {
  name: string;
  isLive?: boolean;
  preview?: string;
  participants?: number;
}) {
  return (
    <motion.button
      className={cn(
        'w-full p-3 rounded-xl text-left transition-all duration-200',
        'bg-white/[0.02] border border-white/[0.06]',
        'hover:bg-white/[0.04] hover:border-white/[0.1]',
        isLive && 'border-[#FFD700]/30 bg-[#FFD700]/[0.02]'
      )}
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          isLive ? 'bg-[#FFD700]/20' : 'bg-white/[0.06]'
        )}>
          <Hex size={16} filled className={isLive ? 'text-[#FFD700]' : 'text-white/40'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-white/80">{name}</span>
            {isLive && (
              <motion.span
                className="text-[9px] uppercase tracking-wider text-[#FFD700] font-semibold px-1.5 py-0.5 rounded bg-[#FFD700]/10"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Live
              </motion.span>
            )}
          </div>
          {participants > 0 && (
            <span className="text-[11px] text-white/30">{participants} participating</span>
          )}
        </div>
      </div>
      {preview && (
        <div className="text-[12px] text-white/40 pl-11 line-clamp-1">{preview}</div>
      )}
    </motion.button>
  );
}

// Event countdown card
function EventCountdown({
  title,
  date,
  location,
  attendees,
  startsIn,
}: {
  title: string;
  date: string;
  location: string;
  attendees: number;
  startsIn: string;
}) {
  return (
    <motion.div
      className="relative rounded-xl overflow-hidden"
      whileHover={{ scale: 1.01 }}
    >
      {/* Animated border */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)',
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['100% 0', '-100% 0'],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative m-[1px] rounded-xl bg-black p-4">
        {/* Glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#FFD700]/10 via-transparent to-transparent" />

        <div className="relative">
          {/* Countdown */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-[0.15em] text-[#FFD700]/60">Starts in</span>
            <motion.span
              className="text-[18px] font-mono font-bold text-[#FFD700]"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {startsIn}
            </motion.span>
          </div>

          <h4 className="text-[15px] font-semibold text-white mb-1">{title}</h4>
          <p className="text-[12px] text-white/40 mb-3">{date} · {location}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border-2 border-black"
                    style={{ backgroundColor: ['#6366f1', '#ec4899', '#14b8a6'][i] }}
                  />
                ))}
              </div>
              <span className="text-[11px] text-white/40">+{attendees - 3} going</span>
            </div>
            <motion.button
              className="px-3 py-1.5 text-[11px] font-medium text-[#FFD700] bg-[#FFD700]/10 rounded-lg border border-[#FFD700]/30"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,215,0,0.15)' }}
              whileTap={{ scale: 0.95 }}
            >
              RSVP
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Board tab with activity indicator
function BoardTab({
  name,
  isActive,
  unread = 0,
  hasActivity = false,
  onClick,
}: {
  name: string;
  isActive: boolean;
  unread?: number;
  hasActivity?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200',
        isActive
          ? 'text-white bg-white/[0.08]'
          : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span>{name}</span>
      {unread > 0 && (
        <motion.span
          className="ml-2 px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-[#FFD700]/20 text-[#FFD700]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={spring.snappy}
        >
          {unread}
        </motion.span>
      )}
      {hasActivity && !unread && (
        <motion.div
          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#FFD700]"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
}

// ============================================
// CONSIDERED VERSION — Calm + Intentional Hierarchy
// ============================================
// Philosophy: OpenAI/Apple calm BUT with precision
// - One thing is bright. Everything else defers.
// - Tools communicate state through content, not badges
// - Typography hierarchy is deliberate (not everything 40%)
// - The single accent color (soft white-blue) is earned

// Utility: Desaturate a hex color for calmer chrome
function desaturateColor(hex: string, intensity = 0.65): string {
  const c = hex.replace(/^#/, '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  // Mix with neutral gray (not pure dark)
  return `rgb(${Math.round(r * intensity + 45)}, ${Math.round(g * intensity + 45)}, ${Math.round(b * intensity + 45)})`;
}

// Considered message - clear hierarchy
function ConsideredMessage({
  author,
  content,
  time,
  isSystem = false,
  reactions = [],
  replyCount = 0,
  isPinned = false,
  color,
}: {
  author: string;
  content: string;
  time: string;
  isSystem?: boolean;
  reactions?: Array<{ emoji: string; count: number }>;
  replyCount?: number;
  isPinned?: boolean;
  color: string;
}) {
  const avatarColor = desaturateColor(color, 0.7);

  return (
    <div
      className={cn(
        'group flex gap-3 py-3',
        'transition-colors duration-150',
        'hover:bg-white/[0.02]',
        '-mx-3 px-3 rounded-lg'
      )}
    >
      {/* Avatar - desaturated but present */}
      <div
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-semibold flex-shrink-0',
          isSystem ? 'bg-white/[0.06]' : ''
        )}
        style={!isSystem ? { backgroundColor: avatarColor, color: 'rgba(255,255,255,0.9)' } : {}}
      >
        {isSystem ? (
          <HiveMark size={16} className="text-white/40" />
        ) : (
          author.split(' ').map(n => n[0]).join('')
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-baseline gap-2 mb-1">
          <span className={cn(
            'text-[13px] font-medium',
            isSystem ? 'text-white/50' : 'text-white/90'
          )}>
            {author}
          </span>
          <span className="text-[11px] text-white/25">{time}</span>
          {isPinned && (
            <span className="text-[10px] text-white/40 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
              </svg>
              pinned
            </span>
          )}
        </div>

        <p className={cn(
          'text-[14px] leading-[1.6]',
          isSystem ? 'text-white/35 text-[13px]' : 'text-white/70'
        )}>
          {content}
        </p>

        {/* Reactions - subtle but clickable */}
        {(reactions.length > 0 || replyCount > 0) && (
          <div className="flex items-center gap-2 mt-2.5">
            {reactions.map((r, i) => (
              <button
                key={i}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
              >
                <span className="text-[13px]">{r.emoji}</span>
                <span className="text-[11px] text-white/50 font-medium">{r.count}</span>
              </button>
            ))}
            {replyCount > 0 && (
              <button className="text-[12px] text-white/50 hover:text-white/70 transition-colors font-medium">
                {replyCount} replies
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Considered presence - harmonized with feed avatars
function ConsideredPresence({ people }: { people: Array<{ name: string; isActive?: boolean; color: string }> }) {
  const activeCount = people.filter(p => p.isActive).length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-1.5">
        {people.slice(0, 4).map((person, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-semibold border-2 border-[#0f0f0f]"
            style={{ backgroundColor: desaturateColor(person.color, 0.7), color: 'rgba(255,255,255,0.85)' }}
          >
            {person.name.split(' ').map(n => n[0]).join('')}
          </div>
        ))}
        {people.length > 4 && (
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] text-white/40 bg-white/[0.06] border-2 border-[#0f0f0f]">
            +{people.length - 4}
          </div>
        )}
      </div>
      <span className="text-[11px] text-white/40">{activeCount} here</span>
    </div>
  );
}

// Considered event card - THE focal point with HIVE identity
function ConsideredEventCard({
  title,
  date,
  location,
  attendees,
  startsIn,
  isUrgent = false,
  hasRSVPd = false,
  onRSVP,
}: {
  title: string;
  date: string;
  location: string;
  attendees: number;
  startsIn: string;
  isUrgent?: boolean;
  hasRSVPd?: boolean;
  onRSVP?: () => void;
}) {
  return (
    <div className={cn(
      'relative rounded-xl overflow-hidden transition-all',
      isUrgent
        ? 'bg-gradient-to-br from-[#FFD700]/[0.06] via-[#FFD700]/[0.02] to-transparent'
        : 'bg-white/[0.02]'
    )}>
      {/* Gold accent line - the HIVE signature (4px for graphic impact) */}
      <div className={cn(
        'absolute left-0 top-0 bottom-0 w-[4px] rounded-r-sm',
        isUrgent
          ? 'bg-gradient-to-b from-[#FFD700] via-[#FFD700]/70 to-[#FFD700]/30 shadow-[0_0_8px_rgba(255,215,0,0.3)]'
          : 'bg-white/[0.08]'
      )} />

      <div className="p-4 pl-5">
        {/* Countdown - GOLD when urgent (the hero moment) */}
        <div className="flex items-center justify-between mb-3">
          <span className={cn(
            'text-[10px] uppercase tracking-wider font-medium',
            isUrgent ? 'text-[#FFD700]/70' : 'text-white/40'
          )}>
            {isUrgent ? 'Starting soon' : 'Next up'}
          </span>
          <span className={cn(
            'text-[18px] font-mono font-semibold tabular-nums tracking-tight',
            isUrgent ? 'text-[#FFD700]' : 'text-white/60'
          )}>
            {startsIn}
          </span>
        </div>

        {/* Title - strong hierarchy */}
        <h4 className="text-[16px] font-semibold text-white mb-1">{title}</h4>
        <p className="text-[12px] text-white/45 mb-4">{date} · {location}</p>

        <div className="flex items-center justify-between">
          {/* Attendee count with subtle avatars */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full bg-white/[0.1] border-2 border-[#121212]"
                />
              ))}
            </div>
            <span className="text-[11px] text-white/40">{attendees} going</span>
          </div>
          {/* CTA - GOLD when urgent and not acted */}
          <button
            onClick={onRSVP}
            className={cn(
              'px-4 py-1.5 text-[11px] font-semibold rounded-md transition-all',
              hasRSVPd
                ? 'text-white/70 bg-white/[0.06] border border-white/[0.1]'
                : isUrgent
                  ? 'text-black bg-[#FFD700] hover:bg-[#FFD700]/90 shadow-[0_0_20px_rgba(255,215,0,0.2)]'
                  : 'text-white bg-white/[0.1] hover:bg-white/[0.15]'
            )}
          >
            {hasRSVPd ? "You're going ✓" : 'RSVP'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// INTELLIGENT TOOL WIDGETS
// ============================================
// Tools are NOT links. They're mini-apps that communicate:
// - Type (poll vs form vs resource)
// - State (active, closing soon, completed)
// - Your status (voted, submitted, new)
// - Content preview (what's the poll about?)

interface ToolWidgetProps {
  type: 'poll' | 'form' | 'resource' | 'countdown';
  name: string;
  // Poll-specific
  pollQuestion?: string;
  pollLeadingOption?: string;
  pollVotes?: number;
  pollTimeLeft?: string;
  hasVoted?: boolean;
  // Form-specific
  formSubmissions?: number;
  formDeadline?: string;
  hasSubmitted?: boolean;
  // Resource-specific
  resourceCount?: number;
  // Countdown-specific
  countdownTarget?: string;
  countdownTime?: string;
  // Business logic: does this tool need the user's attention?
  needsAttention?: boolean;
  // Interactive
  onClick?: () => void;
}

function ToolWidget({
  type,
  name,
  pollQuestion,
  pollLeadingOption,
  pollVotes = 0,
  pollTimeLeft,
  hasVoted = false,
  formSubmissions = 0,
  formDeadline,
  hasSubmitted = false,
  resourceCount = 0,
  countdownTarget,
  countdownTime,
  needsAttention = false,
  onClick,
}: ToolWidgetProps) {
  // Different visual treatment per type
  if (type === 'poll') {
    return (
      <button className={cn(
        'relative w-full p-3 rounded-lg text-left transition-colors group',
        needsAttention
          ? 'bg-[#FFD700]/[0.04] hover:bg-[#FFD700]/[0.08] border border-[#FFD700]/20'
          : 'bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06]'
      )}>
        {/* Gold accent line when needs attention */}
        {needsAttention && (
          <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-[#FFD700] via-[#FFD700]/70 to-[#FFD700]/30" />
        )}
        <div className={cn('flex items-start gap-3', needsAttention && 'pl-1')}>
          {/* Type indicator */}
          <div className={cn(
            'w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0',
            needsAttention ? 'bg-[#FFD700]/[0.1]' : 'bg-white/[0.06]'
          )}>
            <svg className={cn('w-4 h-4', needsAttention ? 'text-[#FFD700]/70' : 'text-white/50')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[12px] font-medium text-white/80 group-hover:text-white/90 transition-colors">{name}</span>
              {hasVoted ? (
                <svg className="w-3.5 h-3.5 text-emerald-500/70" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : needsAttention && (
                <span className="text-[9px] font-semibold text-[#FFD700] uppercase tracking-wider">Vote</span>
              )}
            </div>
            {pollQuestion && (
              <p className="text-[11px] text-white/40 mb-1.5 line-clamp-1">{pollQuestion}</p>
            )}
            <div className="flex items-center gap-3 text-[10px]">
              {pollLeadingOption && (
                <span className="text-white/50">Leading: <span className="text-white/70">{pollLeadingOption}</span></span>
              )}
              <span className="text-white/30">{pollVotes} votes</span>
              {pollTimeLeft && (
                <span className={needsAttention ? 'text-[#FFD700]/60' : 'text-white/40'}>{pollTimeLeft}</span>
              )}
            </div>
          </div>
        </div>
      </button>
    );
  }

  if (type === 'form') {
    return (
      <button
        onClick={onClick}
        className={cn(
          'relative w-full p-3 rounded-lg text-left transition-colors group',
          needsAttention
            ? 'bg-[#FFD700]/[0.04] hover:bg-[#FFD700]/[0.08] border border-[#FFD700]/20'
            : 'bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06]'
        )}
      >
        {/* Gold accent line when needs attention */}
        {needsAttention && (
          <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-[#FFD700] via-[#FFD700]/70 to-[#FFD700]/30" />
        )}
        <div className={cn('flex items-start gap-3', needsAttention && 'pl-1')}>
          <div className={cn(
            'w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0',
            needsAttention ? 'bg-[#FFD700]/[0.1]' : 'bg-white/[0.06]'
          )}>
            <svg className={cn('w-4 h-4', needsAttention ? 'text-[#FFD700]/70' : 'text-white/50')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[12px] font-medium text-white/80 group-hover:text-white/90 transition-colors">{name}</span>
              {hasSubmitted ? (
                <svg className="w-3.5 h-3.5 text-emerald-500/70" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : needsAttention && (
                <span className="text-[9px] font-semibold text-[#FFD700] uppercase tracking-wider">Submit</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-white/50">{formSubmissions} submitted</span>
              {formDeadline && (
                <span className={needsAttention ? 'text-[#FFD700]/60' : 'text-white/40'}>Due {formDeadline}</span>
              )}
            </div>
          </div>
        </div>
      </button>
    );
  }

  if (type === 'resource') {
    return (
      <button className="w-full p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] text-left transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-white/[0.06] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[12px] font-medium text-white/80 group-hover:text-white/90 transition-colors">{name}</span>
          </div>
          <span className="text-[10px] text-white/30">{resourceCount} links</span>
        </div>
      </button>
    );
  }

  // Countdown type
  return (
    <button className="w-full p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] text-left transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-white/[0.06] flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[12px] font-medium text-white/80 group-hover:text-white/90 transition-colors">{name}</span>
          {countdownTarget && (
            <p className="text-[10px] text-white/40">{countdownTarget}</p>
          )}
        </div>
        {countdownTime && (
          <span className="text-[12px] font-mono text-white/60 tabular-nums">{countdownTime}</span>
        )}
      </div>
    </button>
  );
}

// Considered board tab - clear active state
function ConsideredBoardTab({
  name,
  isActive,
  unread = 0,
  onClick,
}: {
  name: string;
  isActive: boolean;
  unread?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-[13px] rounded-md transition-all duration-150',
        isActive
          ? 'text-white bg-white/[0.1] font-medium'
          : 'text-white/45 hover:text-white/70 hover:bg-white/[0.03]'
      )}
    >
      {name}
      {unread > 0 && (
        <span className={cn(
          'ml-1.5 text-[11px] font-medium',
          isActive ? 'text-white/60' : 'text-white/35'
        )}>
          {unread}
        </span>
      )}
    </button>
  );
}

// Legacy calm components for backwards compatibility
function CalmMessage(props: Parameters<typeof ConsideredMessage>[0]) {
  return <ConsideredMessage {...props} />;
}

function CalmPresence(props: Parameters<typeof ConsideredPresence>[0]) {
  return <ConsideredPresence {...props} />;
}

function CalmEventCard(props: Omit<Parameters<typeof ConsideredEventCard>[0], 'isUrgent' | 'hasRSVPd'>) {
  return <ConsideredEventCard {...props} isUrgent />;
}

function CalmToolRow({
  name,
  isLive = false,
  meta,
}: {
  name: string;
  isLive?: boolean;
  meta?: string;
}) {
  // Map to new ToolWidget
  return (
    <ToolWidget
      type={name.toLowerCase().includes('poll') ? 'poll' : name.toLowerCase().includes('submission') ? 'form' : 'resource'}
      name={name}
      pollVotes={isLive ? 12 : 0}
      formSubmissions={meta ? parseInt(meta) : 0}
      resourceCount={3}
    />
  );
}

function CalmBoardTab(props: Parameters<typeof ConsideredBoardTab>[0]) {
  return <ConsideredBoardTab {...props} />;
}

// ============================================
// INLINE POLL - Interactive tool in chat
// ============================================
interface InlinePollProps {
  question: string;
  options: { id: string; label: string; votes: number }[];
  totalVotes: number;
  timeLeft: string;
  author: string;
  authorColor: string;
  time: string;
  selectedOption: string | null;
  onVote: (optionId: string) => void;
}

function InlinePoll({
  question,
  options,
  totalVotes,
  timeLeft,
  author,
  authorColor,
  time,
  selectedOption,
  onVote,
}: InlinePollProps) {
  const hasVoted = selectedOption !== null;

  return (
    <div className="flex items-start gap-3 py-3 group">
      {/* Author avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-medium text-white flex-shrink-0"
        style={{ backgroundColor: desaturateColor(authorColor) }}
      >
        {author.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[13px] font-medium text-white/90">{author}</span>
          <span className="text-[11px] text-white/30">{time}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FFD700]/10 text-[#FFD700]/70 font-medium uppercase tracking-wider">Poll</span>
        </div>

        {/* Poll card - FUTURISTIC glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'relative rounded-xl overflow-hidden max-w-md transition-all',
            hasVoted
              ? 'bg-white/[0.03] backdrop-blur-sm border border-white/[0.08]'
              : 'bg-gradient-to-br from-[#FFD700]/[0.06] via-[#FFD700]/[0.02] to-transparent backdrop-blur-sm border border-[#FFD700]/25 shadow-[0_0_30px_rgba(255,215,0,0.08)]'
          )}
        >
          {/* Animated gold accent when not voted */}
          {!hasVoted && (
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-[4px] rounded-r-full"
              style={{
                background: 'linear-gradient(180deg, #FFD700 0%, #FFD700 50%, rgba(255,215,0,0.3) 100%)',
                boxShadow: '0 0 12px rgba(255,215,0,0.5)',
              }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          <div className="p-4">
            <p className="text-[14px] font-medium text-white/90 mb-3">{question}</p>

            {/* Options */}
            <div className="space-y-2">
              {options.map((option) => {
                const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                const isSelected = selectedOption === option.id;
                const isWinning = hasVoted && option.votes === Math.max(...options.map(o => o.votes));

                return (
                  <motion.button
                    key={option.id}
                    onClick={() => !hasVoted && onVote(option.id)}
                    disabled={hasVoted}
                    whileHover={!hasVoted ? { scale: 1.02, x: 4 } : {}}
                    whileTap={!hasVoted ? { scale: 0.98 } : {}}
                    className={cn(
                      'relative w-full text-left rounded-lg overflow-hidden transition-all duration-200',
                      hasVoted
                        ? 'cursor-default'
                        : 'cursor-pointer hover:shadow-[0_0_20px_rgba(255,215,0,0.15)]',
                      isSelected && 'ring-2 ring-[#FFD700]/60 shadow-[0_0_20px_rgba(255,215,0,0.2)]'
                    )}
                  >
                    {/* Progress bar background - animated sweep */}
                    {hasVoted && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: `${percentage}%`, opacity: 1 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                          'absolute inset-y-0 left-0',
                          isWinning
                            ? 'bg-gradient-to-r from-[#FFD700]/[0.2] to-[#FFD700]/[0.08]'
                            : 'bg-gradient-to-r from-white/[0.08] to-white/[0.02]'
                        )}
                      />
                    )}

                    <div className={cn(
                      'relative flex items-center justify-between px-3 py-2.5',
                      !hasVoted && 'border border-white/[0.08] rounded-lg'
                    )}>
                      <div className="flex items-center gap-2">
                        {/* Radio/check indicator */}
                        <div className={cn(
                          'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all',
                          isSelected
                            ? 'border-[#FFD700] bg-[#FFD700]'
                            : hasVoted
                              ? 'border-white/20'
                              : 'border-white/30'
                        )}>
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={cn(
                          'text-[13px]',
                          isSelected ? 'text-white font-medium' : 'text-white/70'
                        )}>
                          {option.label}
                        </span>
                      </div>

                      {hasVoted && (
                        <motion.span
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          className={cn(
                            'text-[12px] font-medium tabular-nums',
                            isWinning ? 'text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]' : 'text-white/40'
                          )}
                        >
                          {percentage}%
                        </motion.span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer - futuristic */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
              <span className="text-[11px] text-white/40">{totalVotes} votes</span>
              {!hasVoted ? (
                <motion.span
                  className="text-[11px] text-[#FFD700]/70 font-medium"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ● {timeLeft}
                </motion.span>
              ) : (
                <span className="text-[11px] text-white/40">{timeLeft}</span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function LayoutChatCentric() {
  const [activeBoard, setActiveBoard] = React.useState(0);

  // Interactive state
  const [hasRSVPd, setHasRSVPd] = React.useState(false);
  const [selectedPollOption, setSelectedPollOption] = React.useState<string | null>(null);
  const [pollVotes, setPollVotes] = React.useState([
    { id: 'tue', label: 'Tuesday 6pm', votes: 8 },
    { id: 'wed', label: 'Wednesday 7pm', votes: 5 },
    { id: 'thu', label: 'Thursday 5pm', votes: 3 },
  ]);
  const [hasSubmittedForm, setHasSubmittedForm] = React.useState(false);

  // Tool picker state
  const [showInlineToolPicker, setShowInlineToolPicker] = React.useState(false);
  const [showAddToolMenu, setShowAddToolMenu] = React.useState(false);

  // Handle poll vote
  const handlePollVote = (optionId: string) => {
    setSelectedPollOption(optionId);
    setPollVotes(prev => prev.map(opt =>
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    ));
  };

  const messages = [
    {
      author: 'Alex Chen',
      content: 'Just confirmed the venue. Davis Hall 101 is locked in for Saturday. I talked to facilities and we have the room from 2pm until midnight if we need it.',
      time: '2m',
      color: '#6366f1',
      reactions: [{ emoji: '🔥', count: 5 }, { emoji: '👏', count: 3 }],
      isPinned: true,
    },
    {
      author: 'HIVE',
      content: "Jordan RSVP'd to Spring Hackathon Kickoff",
      time: '5m',
      isSystem: true,
      color: '#888888',
    },
    {
      author: 'Morgan',
      content: 'Project proposals due Friday. No extensions this time—last semester was chaos when people submitted late.',
      time: '15m',
      color: '#ec4899',
      replyCount: 4,
    },
    {
      author: 'Taylor',
      content: 'Anyone working on the ML workshop slides? I can help with the demo section.',
      time: '23m',
      color: '#14b8a6',
      reactions: [{ emoji: '🙋', count: 2 }],
    },
    {
      author: 'Sam',
      content: 'The new project submission form is live. Please test it out and let me know if anything breaks.',
      time: '45m',
      color: '#f59e0b',
    },
  ];

  const boards = [
    { name: 'General', unread: 3 },
    { name: 'Events', unread: 0 },
    { name: 'Resources', unread: 0 },
  ];

  const presenceData = [
    { name: 'Alex Chen', isActive: true, color: '#6366f1' },
    { name: 'Morgan Lee', isActive: true, color: '#ec4899' },
    { name: 'Taylor Kim', isActive: true, color: '#14b8a6' },
    { name: 'Jordan', isActive: false, color: '#8b5cf6' },
    { name: 'Sam', isActive: false, color: '#f59e0b' },
  ];

  // Base: flat deep charcoal with subtle HIVE texture
  return (
    <div className="h-full flex flex-col bg-[#0f0f0f] text-white overflow-hidden">
      {/* Subtle warm gradient - HIVE identity */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(255,215,0,0.015) 0%, transparent 40%),
            radial-gradient(ellipse at 70% 80%, rgba(255,215,0,0.01) 0%, transparent 35%)
          `,
        }}
      />

      {/* Very subtle honeycomb texture - felt, not seen */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Header - clean lines */}
      <header className="relative z-10 px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Space icon - HIVE identity with subtle gold */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700]/[0.12] to-[#FFD700]/[0.04] flex items-center justify-center border border-[#FFD700]/[0.15]">
              <HiveMark size={22} className="text-[#FFD700]/80" />
            </div>
            <div>
              <h1 className="text-[16px] font-semibold text-white/90">CS Club</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[12px] text-white/30">847 members</span>
                <CalmPresence people={presenceData} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-[13px] text-white/50 hover:text-white/70 transition-colors">
              Search
            </button>
            <button className="px-4 py-1.5 text-[13px] font-medium text-black bg-white hover:bg-white/90 rounded-md transition-colors">
              Join
            </button>
          </div>
        </div>
      </header>

      {/* Board tabs - minimal */}
      <div className="relative z-10 px-6 py-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-1">
          {boards.map((board, i) => (
            <CalmBoardTab
              key={board.name}
              name={board.name}
              unread={board.unread}
              isActive={i === activeBoard}
              onClick={() => setActiveBoard(i)}
            />
          ))}
          <button className="ml-2 px-2 py-1.5 text-[13px] text-white/20 hover:text-white/40 transition-colors">
            +
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* Chat area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6">
            <div className="max-w-2xl py-4">
              {/* Time separator - subtle */}
              <div className="flex items-center gap-3 py-3 mb-2">
                <div className="flex-1 h-px bg-white/[0.04]" />
                <span className="text-[10px] text-white/20 uppercase tracking-wide">Today</span>
                <div className="flex-1 h-px bg-white/[0.04]" />
              </div>

              {messages.map((msg, i) => (
                <CalmMessage key={i} {...msg} />
              ))}

              {/* INLINE POLL - Interactive tool in chat */}
              <InlinePoll
                question="When should we meet next week?"
                options={pollVotes}
                totalVotes={pollVotes.reduce((sum, opt) => sum + opt.votes, 0)}
                timeLeft="2h left"
                author="Morgan"
                authorColor="#ec4899"
                time="10m"
                selectedOption={selectedPollOption}
                onVote={handlePollVote}
              />

              {/* Typing - quiet */}
              <div className="flex items-center gap-2 py-2 px-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 rounded-full bg-white/20"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-white/25">Morgan is typing</span>
              </div>
            </div>
          </div>

          {/* Input - clean with tool picker */}
          <div className="px-6 pb-5 pt-2">
            <div className="max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Message ${boards[activeBoard].name.toLowerCase()}...`}
                  className={cn(
                    'w-full px-4 py-3 text-[14px]',
                    'bg-white/[0.03] border border-white/[0.06]',
                    'rounded-lg outline-none',
                    'text-white/90 placeholder:text-white/25',
                    'focus:border-white/[0.1]',
                    'transition-colors duration-150'
                  )}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {/* Tools button - insert inline tools */}
                  <div className="relative">
                    <motion.button
                      onClick={() => setShowInlineToolPicker(!showInlineToolPicker)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        'p-2 rounded-md transition-colors',
                        showInlineToolPicker
                          ? 'bg-[#FFD700]/20 text-[#FFD700]'
                          : 'text-white/20 hover:text-white/40 hover:bg-white/5'
                      )}
                      title="Insert tool"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                      </svg>
                    </motion.button>

                    {/* Inline Tool Picker Dropdown */}
                    <AnimatePresence>
                      {showInlineToolPicker && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full right-0 mb-2 w-56 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                        >
                          <div className="p-2">
                            <div className="px-2 py-1 text-[9px] text-white/30 uppercase tracking-wider font-medium">
                              Insert inline
                            </div>
                            {[
                              { name: 'Poll', desc: 'Ask a question', iconPath: 'M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5' },
                              { name: 'Countdown', desc: 'Time to event', iconPath: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
                              { name: 'Form', desc: 'Collect responses', iconPath: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z' },
                              { name: 'Event', desc: 'Link an event', iconPath: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5' },
                            ].map((tool) => (
                              <motion.button
                                key={tool.name}
                                whileHover={{ x: 2, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                onClick={() => setShowInlineToolPicker(false)}
                                className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-left"
                              >
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                  </svg>
                                </div>
                                <div>
                                  <div className="text-[13px] text-white/90">{tool.name}</div>
                                  <div className="text-[11px] text-white/40">{tool.desc}</div>
                                </div>
                              </motion.button>
                            ))}
                          </div>
                          <div className="border-t border-white/5 p-2">
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#FFD700]/10 text-[#FFD700] text-[12px] font-medium"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                              </svg>
                              Create in HiveLab
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button className="p-2 text-white/20 hover:text-white/40 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                    </svg>
                  </button>
                  <button className="p-2 bg-white/[0.08] hover:bg-white/[0.12] text-white/70 rounded-md transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar - CONTEXTUAL based on active board */}
        <aside className="w-72 border-l border-white/[0.06] bg-[#121212] overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-4">
            {/* GENERAL TAB SIDEBAR */}
            {activeBoard === 0 && (
              <>
                {/* Event - THE focal point (INTERACTIVE) */}
                <ConsideredEventCard
                  title="Spring Hackathon Kickoff"
                  date="Saturday, 2:00 PM"
                  location="Davis Hall 101"
                  attendees={hasRSVPd ? 90 : 89}
                  startsIn="01:23:45"
                  isUrgent={!hasRSVPd}
                  hasRSVPd={hasRSVPd}
                  onRSVP={() => setHasRSVPd(true)}
                />

                {/* About - lightweight */}
                <div className="pt-4 border-t border-white/[0.04]">
                  <p className="text-[12px] text-white/50 leading-relaxed">
                    UB's largest computer science community. Weekly workshops, hackathons, and industry networking.
                  </p>
                </div>
              </>
            )}

            {/* EVENTS TAB SIDEBAR */}
            {activeBoard === 1 && (
              <>
                {/* Upcoming Events Widget */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Upcoming</h3>
                    <button className="text-[10px] text-[#FFD700]/60 hover:text-[#FFD700] transition-colors">+ Add</button>
                  </div>
                  <div className="space-y-2">
                    {[
                      { title: 'Spring Hackathon Kickoff', date: 'Sat, Jan 11', time: '2:00 PM', rsvp: 89, isNext: true },
                      { title: 'ML Workshop', date: 'Wed, Jan 15', time: '6:00 PM', rsvp: 34, isNext: false },
                      { title: 'Industry Panel', date: 'Fri, Jan 24', time: '5:00 PM', rsvp: 56, isNext: false },
                    ].map((event, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ x: 2 }}
                        className={cn(
                          'w-full text-left p-3 rounded-lg transition-all',
                          event.isNext
                            ? 'bg-[#FFD700]/[0.08] border border-[#FFD700]/20'
                            : 'bg-white/[0.02] hover:bg-white/[0.04]'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              'text-[12px] font-medium truncate',
                              event.isNext ? 'text-white' : 'text-white/70'
                            )}>
                              {event.title}
                            </div>
                            <div className="text-[10px] text-white/40 mt-0.5">
                              {event.date} · {event.time}
                            </div>
                          </div>
                          <div className="text-[10px] text-white/30 flex-shrink-0">
                            {event.rsvp} going
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Calendar Preview Widget */}
                <div className="pt-4 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] text-white/30 uppercase tracking-wider font-medium">January 2025</h3>
                    <div className="flex gap-1">
                      <button className="p-1 text-white/20 hover:text-white/40 transition-colors">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                      </button>
                      <button className="p-1 text-white/20 hover:text-white/40 transition-colors">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <div key={i} className="text-[9px] text-white/20 py-1">{d}</div>
                    ))}
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                      const hasEvent = [11, 15, 24].includes(day);
                      const isToday = day === 8;
                      return (
                        <button
                          key={day}
                          className={cn(
                            'text-[10px] py-1.5 rounded transition-colors',
                            hasEvent && 'bg-[#FFD700]/20 text-[#FFD700]',
                            isToday && !hasEvent && 'bg-white/10 text-white',
                            !hasEvent && !isToday && 'text-white/40 hover:bg-white/5'
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* RESOURCES TAB SIDEBAR */}
            {activeBoard === 2 && (
              <>
                {/* Quick Links Widget */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Quick Links</h3>
                    <button className="text-[10px] text-[#FFD700]/60 hover:text-[#FFD700] transition-colors">+ Add</button>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { name: 'Club Constitution', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z' },
                      { name: 'Meeting Notes', icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10' },
                      { name: 'Workshop Slides', icon: 'M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6' },
                      { name: 'Discord Server', icon: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244', external: true },
                      { name: 'GitHub Org', icon: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244', external: true },
                    ].map((link, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ x: 2, backgroundColor: 'rgba(255,255,255,0.03)' }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors"
                      >
                        <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                        </svg>
                        <span className="text-[12px] text-white/70 flex-1">{link.name}</span>
                        {link.external && (
                          <svg className="w-3 h-3 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Recent Files Widget */}
                <div className="pt-4 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Recent Files</h3>
                    <button className="text-[10px] text-white/30 hover:text-white/50 transition-colors">View all</button>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { name: 'hackathon-rules.pdf', size: '245 KB', date: '2d ago' },
                      { name: 'sponsor-deck.pptx', size: '1.2 MB', date: '5d ago' },
                      { name: 'budget-2025.xlsx', size: '89 KB', date: '1w ago' },
                    ].map((file, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ x: 2 }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] text-white/40 font-medium uppercase">
                            {file.name.split('.').pop()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] text-white/70 truncate">{file.name}</div>
                          <div className="text-[9px] text-white/30">{file.size} · {file.date}</div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Tools - INTELLIGENT WIDGETS that communicate state */}
            <div className="pt-4 border-t border-white/[0.04]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Tools</h3>
                {/* Add Tool button for leaders */}
                <div className="relative">
                  <motion.button
                    onClick={() => setShowAddToolMenu(!showAddToolMenu)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      'w-5 h-5 rounded flex items-center justify-center transition-colors',
                      showAddToolMenu
                        ? 'bg-[#FFD700]/20 text-[#FFD700]'
                        : 'text-white/20 hover:text-white/40 hover:bg-white/5'
                    )}
                    title="Add tool to sidebar"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </motion.button>

                  {/* Add Tool Menu */}
                  <AnimatePresence>
                    {showAddToolMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-2 w-64 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                      >
                        <div className="p-3 border-b border-white/5">
                          <div className="text-[11px] font-medium text-white/80">Add to sidebar</div>
                          <div className="text-[10px] text-white/30 mt-0.5">Deploy tools for your members</div>
                        </div>
                        <div className="p-2">
                          <div className="px-2 py-1.5 text-[9px] text-white/30 uppercase tracking-wider font-medium">
                            Quick add
                          </div>
                          {[
                            { name: 'Poll Widget', desc: 'Voting for members', iconPath: 'M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5' },
                            { name: 'Form/Signup', desc: 'Collect submissions', iconPath: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z' },
                            { name: 'Resource Links', desc: 'Useful links', iconPath: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244' },
                            { name: 'Countdown', desc: 'Event timer', iconPath: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
                          ].map((tool) => (
                            <motion.button
                              key={tool.name}
                              whileHover={{ x: 2, backgroundColor: 'rgba(255,255,255,0.05)' }}
                              onClick={() => setShowAddToolMenu(false)}
                              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left"
                            >
                              <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3.5 h-3.5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[12px] text-white/90">{tool.name}</div>
                                <div className="text-[10px] text-white/40">{tool.desc}</div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                        <div className="p-2 border-t border-white/5 space-y-1.5">
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/70 text-[11px] font-medium hover:bg-white/10 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                            </svg>
                            Browse my tools
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#FFD700]/10 text-[#FFD700] text-[11px] font-medium"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                            </svg>
                            Create in HiveLab
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="space-y-2">
                <ToolWidget
                  type="poll"
                  name="Meeting Poll"
                  pollQuestion="When should we meet next week?"
                  pollLeadingOption="Tuesday 6pm"
                  pollVotes={24}
                  pollTimeLeft="2h left"
                  hasVoted
                />
                <ToolWidget
                  type="form"
                  name="Project Submissions"
                  formSubmissions={hasSubmittedForm ? 13 : 12}
                  formDeadline="Friday"
                  hasSubmitted={hasSubmittedForm}
                  needsAttention={!hasSubmittedForm}
                  onClick={() => setHasSubmittedForm(true)}
                />
                <ToolWidget
                  type="resource"
                  name="Resource Links"
                  resourceCount={8}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ============================================
// LAYOUT B: EVENT-FIRST (Graphic Design)
// ============================================

export function LayoutEventFirst() {
  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Compact header */}
      <header className="px-10 py-4 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          <Hex size={28} filled className="text-[#FFD700]" />
          <div>
            <h1 className="text-sm font-medium">CS Club</h1>
            <span className="text-xs text-white/30">847 members</span>
          </div>
        </div>
        <span className="text-xs text-white/30 uppercase tracking-wider">Member</span>
      </header>

      {/* Hero event section */}
      <div className="px-10 py-12 border-b border-white/[0.06]">
        <div className="flex items-end justify-between">
          <div className="space-y-4 max-w-xl">
            <p className="text-xs text-[#FFD700] uppercase tracking-[0.25em]">
              Happening Saturday
            </p>
            <h2 className="text-5xl font-bold tracking-tight leading-tight">
              Spring Hackathon<br />Kickoff
            </h2>
            <p className="text-sm text-white/40">
              Davis Hall 101 · 2:00 PM – 6:00 PM
            </p>
            <div className="flex items-center gap-6 pt-4">
              <SignatureButton variant="gold">RSVP</SignatureButton>
              <span className="text-sm text-white/30">89 attending</span>
            </div>
          </div>

          {/* Countdown */}
          <div className="text-right">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] mb-2">Starts in</p>
            <div className="font-mono text-4xl font-light text-[#FFD700] tracking-wider">
              01:23:45
            </div>
          </div>
        </div>
      </div>

      {/* Split content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat */}
        <main className="flex-1 flex flex-col border-r border-white/[0.06]">
          <div className="px-10">
            <TabNav items={['Discussion', 'Q&A']} active={0} />
          </div>
          <div className="flex-1 overflow-y-auto px-10 py-6">
            {[
              { author: 'Alex', content: "Can't wait for Saturday!", time: '2m' },
              { author: 'Jordan', content: 'Team forming in #teams channel', time: '5m' },
              { author: 'Morgan', content: 'Bringing snacks 🍕', time: '12m' },
            ].map((msg, i) => (
              <EditorialMessage key={i} {...msg} />
            ))}
          </div>
          <div className="px-10 py-4 border-t border-white/[0.06]">
            <input
              type="text"
              placeholder="Message..."
              className="w-full bg-transparent text-white placeholder:text-white/20 outline-none text-sm"
            />
          </div>
        </main>

        {/* Schedule */}
        <aside className="w-80 px-8 overflow-y-auto">
          <SidebarModule label="Schedule">
            <div className="space-y-6">
              {[
                { time: '2:00 PM', title: 'Doors Open', desc: 'Check-in and networking' },
                { time: '2:30 PM', title: 'Kickoff Talk', desc: 'Theme reveal and rules' },
                { time: '3:00 PM', title: 'Team Formation', desc: 'Find your squad' },
                { time: '4:00 PM', title: 'Hacking Begins', desc: '24 hours starts' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-xs font-mono text-[#FFD700]/60 w-16 flex-shrink-0 pt-0.5">
                    {item.time}
                  </span>
                  <div>
                    <p className="text-sm text-white/80 font-medium">{item.title}</p>
                    <p className="text-xs text-white/30 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </SidebarModule>

          <SidebarModule label="Details">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-2xl font-bold text-[#FFD700]">$5K</p>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Prizes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">24h</p>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Duration</p>
              </div>
            </div>
          </SidebarModule>
        </aside>
      </div>
    </div>
  );
}

// ============================================
// LAYOUT C: DASHBOARD (Graphic Design)
// ============================================

export function LayoutDashboard() {
  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="px-10 py-6 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-6">
          <Hex size={36} filled className="text-[#FFD700]" />
          <div>
            <h1 className="text-2xl font-bold">CS Club</h1>
            <span className="text-xs text-white/30 uppercase tracking-wider">Leader Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <SignatureButton>Settings</SignatureButton>
          <SignatureButton variant="gold">Invite</SignatureButton>
        </div>
      </header>

      {/* Stats ribbon */}
      <div className="px-10 py-8 border-b border-white/[0.06] grid grid-cols-4 gap-12">
        {[
          { label: 'Members', value: '847', delta: '+12 this week', positive: true },
          { label: 'Active Now', value: '23', sub: 'Peak: 89' },
          { label: 'Events', value: '3', sub: 'This month' },
          { label: 'Messages', value: '1.2K', sub: 'This week' },
        ].map((stat, i) => (
          <div key={i}>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
            <p className="text-4xl font-bold">{stat.value}</p>
            {stat.delta && (
              <p className={cn('text-xs mt-2', stat.positive ? 'text-emerald-500' : 'text-white/30')}>
                {stat.delta}
              </p>
            )}
            {stat.sub && <p className="text-xs text-white/20 mt-2">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-10">
        <div className="grid grid-cols-3 gap-8">
          {/* Poll */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Active Poll</span>
              <span className="text-[10px] text-[#FFD700]/60">2h left</span>
            </div>
            <div>
              <p className="text-lg font-medium mb-6">Weekly meeting time?</p>
              <div className="space-y-4">
                {[
                  { label: 'Tuesday 6pm', pct: 45, winning: true },
                  { label: 'Wednesday 7pm', pct: 37 },
                  { label: 'Thursday 5pm', pct: 18 },
                ].map((opt, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className={opt.winning ? 'text-[#FFD700]' : 'text-white/50'}>{opt.label}</span>
                      <span className="text-white/30">{opt.pct}%</span>
                    </div>
                    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={cn('h-full', opt.winning ? 'bg-[#FFD700]' : 'bg-white/20')}
                        style={{ width: `${opt.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/20 text-right mt-4">76 votes</p>
            </div>
          </div>

          {/* Upcoming */}
          <div className="space-y-6">
            <span className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Upcoming</span>
            <div className="space-y-4">
              {[
                { title: 'Hackathon Kickoff', when: 'Sat 2pm', count: 89 },
                { title: 'Mock Interviews', when: 'Mon 5pm', count: 24 },
                { title: 'Workshop: React', when: 'Wed 6pm', count: 45 },
              ].map((evt, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                  <div>
                    <p className="text-sm text-white/80">{evt.title}</p>
                    <p className="text-xs text-white/30">{evt.when}</p>
                  </div>
                  <span className="text-xs text-white/30">{evt.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div className="space-y-6">
            <span className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Activity</span>
            <div className="space-y-4">
              {[
                { user: 'Alex Chen', action: 'created event Hackathon', time: '2h' },
                { user: 'Jordan', action: 'joined', time: '3h' },
                { user: 'Morgan', action: 'pinned message', time: '5h' },
              ].map((act, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-xs text-white/40">
                    {act.user[0]}
                  </div>
                  <div className="flex-1 text-sm">
                    <span className="text-white/70">{act.user}</span>{' '}
                    <span className="text-white/30">{act.action}</span>
                  </div>
                  <span className="text-[10px] text-white/20">{act.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat preview - spans 2 cols */}
          <div className="col-span-2 border-t border-white/[0.06] pt-8">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] text-white/30 uppercase tracking-[0.2em]">General Chat</span>
              <button className="text-xs text-[#FFD700]/60 hover:text-[#FFD700] transition-colors">
                View All →
              </button>
            </div>
            <div className="space-y-4">
              {[
                { name: 'Alex', msg: 'Venue confirmed for Saturday!' },
                { name: 'Jordan', msg: "Who's bringing the projector?" },
                { name: 'Morgan', msg: 'I got it covered 👍' },
              ].map((m, i) => (
                <p key={i} className="text-sm">
                  <span className="text-white/50">{m.name}:</span>{' '}
                  <span className="text-white/70">{m.msg}</span>
                </p>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="border-t border-white/[0.06] pt-8">
            <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-6">Quick Tools</span>
            <div className="grid grid-cols-2 gap-3">
              {['Poll', 'Form', 'Timer', 'Links'].map((tool) => (
                <button
                  key={tool}
                  className="py-3 text-sm text-white/40 border border-white/[0.06] hover:border-white/[0.15] hover:text-white/60 transition-all"
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// LAYOUT D: FORUM (Graphic Design)
// ============================================

export function LayoutForum() {
  const [sortIndex, setSortIndex] = React.useState(0);

  const threads = [
    {
      title: 'Spring Hackathon: Team Formation Thread',
      preview: "Looking for teammates? Post your skills and what you're looking for here...",
      author: 'Alex Chen',
      isOwner: true,
      replies: 34,
      views: 156,
      time: '2h',
      isPinned: true,
      tags: ['Events', 'Hackathon'],
    },
    {
      title: 'Best resources for learning system design?',
      preview: 'I have a system design interview coming up. What resources did you all use?',
      author: 'Jamie K',
      replies: 12,
      views: 89,
      time: '5h',
      tags: ['Resources', 'Career'],
    },
    {
      title: 'Workshop feedback: React Performance',
      preview: "Thanks everyone who came to yesterday's workshop! Here's the recording...",
      author: 'Morgan Lee',
      replies: 8,
      views: 67,
      time: '1d',
      tags: ['Events'],
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="px-10 py-8 border-b border-white/[0.06]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <Hex size={40} filled className="text-[#FFD700]" />
            <div>
              <h1 className="text-3xl font-bold">CS Club</h1>
              <span className="text-xs text-white/30 uppercase tracking-wider">Discussion Board</span>
            </div>
          </div>
          <SignatureButton variant="gold">New Post</SignatureButton>
        </div>
      </header>

      {/* Filters */}
      <div className="px-10 flex items-center justify-between border-b border-white/[0.06]">
        <TabNav
          items={['Latest', 'Top', 'Unanswered']}
          active={sortIndex}
          onChange={setSortIndex}
        />
        <div className="flex items-center gap-3">
          {['All', 'Events', 'Resources', 'Questions'].map((filter, i) => (
            <button
              key={filter}
              className={cn(
                'px-3 py-1.5 text-xs uppercase tracking-wider transition-all',
                i === 0
                  ? 'text-[#FFD700] border-b border-[#FFD700]'
                  : 'text-white/30 hover:text-white/50'
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto">
        {threads.map((thread, i) => (
          <motion.article
            key={i}
            className={cn(
              'px-10 py-8 border-b border-white/[0.04] cursor-pointer transition-colors',
              'hover:bg-white/[0.01]',
              thread.isPinned && 'border-l-2 border-l-[#FFD700]/50'
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex gap-6">
              {/* Author avatar */}
              <div className={cn(
                'w-10 h-10 rounded-full border flex items-center justify-center text-sm flex-shrink-0',
                thread.isOwner
                  ? 'border-[#FFD700]/40 text-[#FFD700]'
                  : 'border-white/10 text-white/40'
              )}>
                {thread.author.split(' ').map(n => n[0]).join('')}
              </div>

              <div className="flex-1 min-w-0">
                {/* Title row */}
                <div className="flex items-center gap-3 mb-2">
                  {thread.isPinned && (
                    <span className="text-[10px] text-[#FFD700]/60 uppercase tracking-wider">Pinned</span>
                  )}
                  <h2 className="text-lg font-medium text-white/90">{thread.title}</h2>
                </div>

                {/* Preview */}
                <p className="text-sm text-white/40 mb-4 line-clamp-1">{thread.preview}</p>

                {/* Meta row */}
                <div className="flex items-center gap-6 text-xs">
                  <span className={thread.isOwner ? 'text-[#FFD700]/60' : 'text-white/30'}>
                    {thread.author}
                  </span>
                  <span className="text-white/20">{thread.replies} replies</span>
                  <span className="text-white/20">{thread.views} views</span>
                  <span className="text-white/20">{thread.time}</span>
                  <div className="flex-1" />
                  <div className="flex gap-2">
                    {thread.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-[10px] uppercase tracking-wider border border-white/[0.08] text-white/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export function SpaceLayoutConcepts() {
  const [activeLayout, setActiveLayout] = React.useState<'chat' | 'event' | 'dashboard' | 'forum'>('chat');

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Switcher */}
      <div className="flex items-center gap-8 px-10 py-4 border-b border-white/[0.06]">
        {[
          { id: 'chat' as const, label: 'Chat-Centric' },
          { id: 'event' as const, label: 'Event-First' },
          { id: 'dashboard' as const, label: 'Dashboard' },
          { id: 'forum' as const, label: 'Forum' },
        ].map((layout) => (
          <button
            key={layout.id}
            onClick={() => setActiveLayout(layout.id)}
            className={cn(
              'text-sm transition-colors duration-200',
              activeLayout === layout.id
                ? 'text-white'
                : 'text-white/30 hover:text-white/50'
            )}
          >
            {layout.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeLayout === 'chat' && <LayoutChatCentric key="chat" />}
          {activeLayout === 'event' && <LayoutEventFirst key="event" />}
          {activeLayout === 'dashboard' && <LayoutDashboard key="dashboard" />}
          {activeLayout === 'forum' && <LayoutForum key="forum" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

export const HIVESpace = LayoutChatCentric;
export default SpaceLayoutConcepts;
