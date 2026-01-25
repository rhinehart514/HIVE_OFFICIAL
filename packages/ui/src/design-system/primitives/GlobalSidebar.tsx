'use client';

/**
 * GlobalSidebar — Floating Navigation Panel
 * ENHANCED: Jan 21, 2026
 *
 * Premium dark aesthetic with refined motion:
 * - Floating glass-dark container with depth
 * - Luxuriously slow, about-page-style animations
 * - Staggered reveals on mount
 * - Gold (#FFD700) for active/earned states
 *
 * Motion philosophy: Confidence over speed. Let things breathe.
 *
 * @version 6.0.0 — Premium motion redesign
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import { cn } from '../../lib/utils';

// ============================================
// MOTION CONSTANTS (About-page aligned)
// ============================================

/** Premium easing — the HIVE signature curve */
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

/** Duration scale */
const DURATION = {
  instant: 0,
  fast: 0.15,
  quick: 0.25,
  smooth: 0.4,
  gentle: 0.6,
  slow: 0.8,
  dramatic: 1.0,
} as const;

/** Spring configs */
const SPRING_GENTLE = { stiffness: 200, damping: 25 };
const SPRING_SNAPPY = { stiffness: 400, damping: 30 };

// ============================================
// TOKENS
// ============================================

export const SIDEBAR_TOKENS = {
  // Dimensions
  width: 220,
  collapsedWidth: 64,
  margin: 12,

  // Container — Deep dark, minimal
  containerRadius: 14,
  containerBg: 'rgba(10, 10, 10, 0.95)',
  containerBorder: 'rgba(255, 255, 255, 0.04)',
  containerShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',

  // Items — Subtle, no gold backgrounds
  itemRadius: 8,
  itemHoverBg: 'rgba(255, 255, 255, 0.03)',
  itemActiveBg: 'rgba(255, 255, 255, 0.04)',

  // Text — Clean hierarchy
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1A1',
  textMuted: '#666666',

  // Gold — Indicator only, NOT backgrounds
  gold: '#FFD700',
  goldDim: 'rgba(255, 215, 0, 0.5)',

  // Motion
  spring: SPRING_SNAPPY,
  springSoft: SPRING_GENTLE,
} as const;

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]';

// ============================================
// MOTION VARIANTS
// ============================================

/** Individual item stagger entrance */
const itemEntranceVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: DURATION.smooth, ease: EASE_PREMIUM },
  },
};

// ============================================
// CONTEXT
// ============================================

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  reducedMotion: boolean;
}

const SidebarContext = React.createContext<SidebarContextValue>({
  collapsed: false,
  setCollapsed: () => {},
  reducedMotion: false,
});

export const useGlobalSidebar = () => React.useContext(SidebarContext);

// ============================================
// SIDEBAR CONTAINER
// ============================================

export interface GlobalSidebarProps {
  children: React.ReactNode;
  className?: string;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function GlobalSidebar({
  children,
  className,
  defaultCollapsed = false,
  onCollapsedChange,
}: GlobalSidebarProps) {
  const [collapsed, setCollapsedState] = React.useState(defaultCollapsed);
  const reducedMotion = useReducedMotion() ?? false;

  const setCollapsed = React.useCallback((value: boolean) => {
    setCollapsedState(value);
    onCollapsedChange?.(value);
  }, [onCollapsedChange]);

  React.useEffect(() => {
    setCollapsedState(defaultCollapsed);
  }, [defaultCollapsed]);

  const width = collapsed ? SIDEBAR_TOKENS.collapsedWidth : SIDEBAR_TOKENS.width;

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, reducedMotion }}>
      <motion.aside
        className={cn('fixed z-40 flex flex-col', className)}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0, width }}
        transition={{
          opacity: { duration: 0.3, ease: EASE_PREMIUM },
          x: { duration: 0.3, ease: EASE_PREMIUM },
          width: { duration: 0.2, ease: EASE_PREMIUM },
        }}
        style={{
          top: SIDEBAR_TOKENS.margin,
          left: SIDEBAR_TOKENS.margin,
          bottom: SIDEBAR_TOKENS.margin,
          background: SIDEBAR_TOKENS.containerBg,
          borderRadius: SIDEBAR_TOKENS.containerRadius,
          border: `1px solid ${SIDEBAR_TOKENS.containerBorder}`,
          boxShadow: SIDEBAR_TOKENS.containerShadow,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {children}
        </div>
      </motion.aside>
    </SidebarContext.Provider>
  );
}

// ============================================
// IDENTITY CARD
// ============================================

export interface IdentityCardProps {
  name?: string;
  handle?: string;
  avatarUrl?: string;
  onProfileClick?: () => void;
}

export function IdentityCard({ name, handle, avatarUrl, onProfileClick }: IdentityCardProps) {
  const { collapsed } = useGlobalSidebar();

  return (
    <motion.div
      className="px-3 pt-2 pb-1"
      variants={itemEntranceVariants}
    >
      <button
        onClick={onProfileClick}
        className={cn(
          'w-full flex items-center rounded-lg px-2 py-2',
          'transition-colors duration-200',
          'hover:bg-white/[0.03]',
          FOCUS_RING
        )}
        style={{ minHeight: 40 }}
      >
        {/* Avatar */}
        <div
          className="flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            background: avatarUrl ? undefined : '#1A1A1A',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={name || 'Profile'} className="w-full h-full object-cover" />
          ) : (
            <span style={{ color: SIDEBAR_TOKENS.textSecondary, fontSize: 13, fontWeight: 600 }}>
              {name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>

        {/* Name & Handle */}
        {!collapsed && (
          <div className="flex-1 min-w-0 text-left ml-2.5">
            <div
              className="text-body-sm font-medium truncate leading-tight"
              style={{ color: SIDEBAR_TOKENS.textPrimary }}
            >
              {name || 'Anonymous'}
            </div>
            {handle && (
              <div
                className="text-label-sm truncate leading-tight"
                style={{ color: SIDEBAR_TOKENS.textMuted }}
              >
                @{handle}
              </div>
            )}
          </div>
        )}
      </button>
    </motion.div>
  );
}

// ============================================
// SPACER
// ============================================

export function SidebarSpacer() {
  return (
    <div className="mx-4 my-2">
      <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

// ============================================
// NAV CARD
// ============================================

export interface NavCardProps {
  children: React.ReactNode;
}

export function NavCard({ children }: NavCardProps) {
  return (
    <nav className="px-3 py-1">
      <div className="space-y-0.5">{children}</div>
    </nav>
  );
}

// ============================================
// NAV ITEM
// ============================================

export interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  badge?: number;
  onClick?: () => void;
}

export function NavItem({ icon, label, isActive, badge, onClick }: NavItemProps) {
  const { collapsed, setCollapsed, reducedMotion } = useGlobalSidebar();
  const showBadge = badge !== undefined && badge > 0;

  const handleClick = () => {
    if (collapsed) setCollapsed(false);
    onClick?.();
  };

  return (
    <motion.button
      onClick={handleClick}
      variants={itemEntranceVariants}
      className={cn(
        'relative w-full flex items-center rounded-lg',
        'transition-colors duration-200',
        'hover:bg-white/[0.03]',
        FOCUS_RING
      )}
      style={{
        padding: collapsed ? '10px' : '9px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: isActive ? SIDEBAR_TOKENS.itemActiveBg : 'transparent',
      }}
    >
      {/* Active indicator — small gold bar */}
      {isActive && (
        <div
          className="absolute left-0 top-1/2 w-[2px] rounded-full"
          style={{
            height: 14,
            transform: 'translateY(-50%)',
            background: SIDEBAR_TOKENS.gold,
          }}
        />
      )}

      {/* Icon */}
      <div
        className="flex items-center justify-center flex-shrink-0 transition-colors duration-200"
        style={{
          width: 20,
          height: 20,
          color: isActive ? SIDEBAR_TOKENS.textPrimary : SIDEBAR_TOKENS.textMuted,
        }}
      >
        <div className="relative">
          {icon}
          {collapsed && showBadge && (
            <span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
              style={{ background: SIDEBAR_TOKENS.gold }}
            />
          )}
        </div>
      </div>

      {/* Label */}
      {!collapsed && (
        <span
          className="flex-1 text-body-sm font-medium text-left ml-3"
          style={{ color: isActive ? SIDEBAR_TOKENS.textPrimary : SIDEBAR_TOKENS.textSecondary }}
        >
          {label}
        </span>
      )}

      {/* Badge */}
      {!collapsed && showBadge && (
        <span
          className="text-label-xs font-medium rounded px-1.5 py-0.5 min-w-[18px] text-center"
          style={{
            background: 'rgba(255, 215, 0, 0.15)',
            color: SIDEBAR_TOKENS.gold,
          }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </motion.button>
  );
}

// ============================================
// SPACES CARD
// ============================================

export interface SpacesCardProps {
  children: React.ReactNode;
  onBrowseClick?: () => void;
}

export function SpacesCard({ children, onBrowseClick }: SpacesCardProps) {
  const { collapsed } = useGlobalSidebar();
  const hasChildren = React.Children.count(children) > 0;

  return (
    <motion.div
      className="flex-1 flex flex-col min-h-0"
      variants={itemEntranceVariants}
    >
      {/* Header */}
      {!collapsed && (
        <div className="px-4 py-2">
          <span
            className="text-label-xs font-semibold uppercase tracking-wider"
            style={{ color: SIDEBAR_TOKENS.textMuted }}
          >
            Spaces
          </span>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {hasChildren ? children : (
          !collapsed && (
            <div className="py-6 text-center">
              <p className="text-label" style={{ color: SIDEBAR_TOKENS.textMuted }}>
                No spaces yet
              </p>
            </div>
          )
        )}
      </div>

      {/* Browse button */}
      {onBrowseClick && (
        <div className="p-3">
          <button
            onClick={onBrowseClick}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2 rounded-lg',
              'text-label font-medium',
              'transition-colors duration-200',
              'hover:bg-white/[0.03]',
              FOCUS_RING
            )}
            style={{ color: SIDEBAR_TOKENS.textMuted }}
          >
            <span className="text-body">+</span>
            {!collapsed && <span>Browse</span>}
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// SPACE ITEM
// ============================================

export interface SpaceItemProps {
  name: string;
  avatarUrl?: string;
  emoji?: string;
  isActive?: boolean;
  hasUnread?: boolean;
  onClick?: () => void;
}

export function SpaceItem({ name, avatarUrl, emoji, isActive, hasUnread, onClick }: SpaceItemProps) {
  const { collapsed, setCollapsed } = useGlobalSidebar();

  const handleClick = () => {
    if (collapsed) setCollapsed(false);
    onClick?.();
  };

  return (
    <motion.button
      onClick={handleClick}
      variants={itemEntranceVariants}
      className={cn(
        'relative w-full flex items-center rounded-lg',
        'transition-colors duration-200',
        'hover:bg-white/[0.03]',
        FOCUS_RING
      )}
      title={collapsed ? name : undefined}
      style={{
        padding: collapsed ? '8px' : '7px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: isActive ? SIDEBAR_TOKENS.itemActiveBg : 'transparent',
      }}
    >
      {/* Active indicator */}
      {isActive && (
        <div
          className="absolute left-0 top-1/2 w-[2px] rounded-full"
          style={{
            height: 12,
            transform: 'translateY(-50%)',
            background: SIDEBAR_TOKENS.gold,
          }}
        />
      )}

      {/* Avatar */}
      <div
        className="relative flex-shrink-0 rounded-md flex items-center justify-center overflow-hidden"
        style={{
          width: 24,
          height: 24,
          background: avatarUrl ? undefined : '#1A1A1A',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : emoji ? (
          <span style={{ fontSize: 11 }}>{emoji}</span>
        ) : (
          <span style={{ color: SIDEBAR_TOKENS.textMuted, fontSize: 10, fontWeight: 600 }}>
            {name.charAt(0).toUpperCase()}
          </span>
        )}

        {/* Unread indicator */}
        {hasUnread && (
          <span
            className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
            style={{ background: SIDEBAR_TOKENS.gold }}
          />
        )}
      </div>

      {/* Name */}
      {!collapsed && (
        <span
          className="flex-1 text-label font-medium text-left truncate ml-2.5"
          style={{ color: isActive ? SIDEBAR_TOKENS.textPrimary : SIDEBAR_TOKENS.textSecondary }}
        >
          {name}
        </span>
      )}
    </motion.button>
  );
}

// ============================================
// COLLAPSE TOGGLE
// ============================================

export function SidebarCollapseToggle() {
  const { collapsed, setCollapsed } = useGlobalSidebar();

  return (
    <div className="p-3 mt-auto">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2 rounded-lg',
          'transition-colors duration-200',
          'hover:bg-white/[0.03]',
          FOCUS_RING
        )}
        style={{ color: SIDEBAR_TOKENS.textMuted }}
        title={collapsed ? 'Expand sidebar [' : 'Collapse sidebar ['}
      >
        <span
          className="text-body-sm transition-transform duration-200"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          «
        </span>
        {!collapsed && (
          <span className="text-label-sm font-medium">Collapse</span>
        )}
      </button>
    </div>
  );
}

// ============================================
// NAV ICONS
// ============================================

export function FeedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
    </svg>
  );
}

export function BrowseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

export function ToolsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  );
}

export function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

export function HiveLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1500 1500" fill="currentColor" className={className}>
      <path d="M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z"/>
    </svg>
  );
}

// ============================================
// LEGACY EXPORTS
// ============================================

export { SpaceItem as SidebarSpaceItem, NavItem as SidebarNavItem };
export const SidebarSection = SpacesCard;
export const SidebarHeader = IdentityCard;
export const SidebarFooter = NavCard;
export const SidebarDivider = SidebarSpacer;
export const SidebarToolItem = SpaceItem;
export const SidebarAddButton = () => null;

export type SidebarSectionProps = SpacesCardProps;
export type SidebarSpaceItemProps = SpaceItemProps;
export type SidebarToolItemProps = SpaceItemProps;
export type SidebarAddButtonProps = { label: string; onClick?: () => void };
export type SidebarNavItemProps = NavItemProps;
export type SidebarFooterProps = NavCardProps;
export type SidebarHeaderProps = IdentityCardProps;
