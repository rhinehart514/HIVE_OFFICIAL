'use client';

/**
 * GlobalSidebar — Primary Navigation Rail
 *
 * Linear/Notion-style sidebar:
 * - Brand header at top
 * - Primary nav (Browse, HiveLab, Profile, Settings)
 * - Contextual content (changes based on route)
 *
 * 240px expanded / 64px collapsed
 *
 * @version 2.0.0 — Redesigned Jan 2026
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

// ============================================
// TOKENS (LOCKED)
// ============================================

export const SIDEBAR_TOKENS = {
  // Dimensions
  width: 240,
  collapsedWidth: 64,

  // Colors - Apple Glass Dark
  bg: '#0A0A0A',
  bgSubtle: 'rgba(255, 255, 255, 0.02)',
  bgHover: 'rgba(255, 255, 255, 0.04)',
  bgActive: 'rgba(255, 255, 255, 0.08)',
  bgSelected: 'rgba(255, 255, 255, 0.06)',

  // Borders
  border: 'rgba(255, 255, 255, 0.06)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',

  // Text hierarchy (Geist Sans)
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1A6',
  textMuted: '#71717A',
  textDisabled: '#52525B',

  // Accents
  gold: '#FFD700',
  goldDim: 'rgba(255, 215, 0, 0.6)',
  goldGlow: 'rgba(255, 215, 0, 0.1)',
  blue: '#3B82F6',

  // Motion
  transition: '150ms ease',
  transitionSlow: '200ms ease',
} as const;

// White focus ring per design system
const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0A0A0A]';

// ============================================
// CONTEXT
// ============================================

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextValue>({
  collapsed: false,
  setCollapsed: () => {},
});

export const useGlobalSidebar = () => React.useContext(SidebarContext);

// ============================================
// GLOBAL SIDEBAR CONTAINER
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

  const setCollapsed = React.useCallback((value: boolean) => {
    setCollapsedState(value);
    onCollapsedChange?.(value);
  }, [onCollapsedChange]);

  // Sync with external defaultCollapsed changes (for compact mode)
  React.useEffect(() => {
    setCollapsedState(defaultCollapsed);
  }, [defaultCollapsed]);

  const width = collapsed ? SIDEBAR_TOKENS.collapsedWidth : SIDEBAR_TOKENS.width;

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 z-40',
          'flex flex-col',
          'transition-[width] duration-200 ease-out',
          className
        )}
        style={{
          width,
          background: SIDEBAR_TOKENS.bg,
          borderRight: `1px solid ${SIDEBAR_TOKENS.border}`,
        }}
      >
        {children}
      </aside>
    </SidebarContext.Provider>
  );
}

// ============================================
// SIDEBAR SECTION
// ============================================

export interface SidebarSectionProps {
  label: string;
  children: React.ReactNode;
  action?: {
    icon: React.ReactNode;
    onClick: () => void;
    title?: string;
  };
}

export function SidebarSection({ label, children, action }: SidebarSectionProps) {
  const { collapsed } = useGlobalSidebar();

  if (collapsed) {
    return (
      <div className="py-1.5 px-2">
        {children}
      </div>
    );
  }

  return (
    <div className="py-1.5">
      {/* Section header - minimal, lowercase */}
      <div className="flex items-center justify-between px-4 py-2">
        <span
          className="text-[11px] font-medium tracking-wide"
          style={{ color: SIDEBAR_TOKENS.textMuted }}
        >
          {label}
        </span>
        {action && (
          <button
            onClick={action.onClick}
            title={action.title}
            className={cn(
              'p-1 -mr-1 rounded-md transition-colors',
              'hover:bg-white/[0.04] active:bg-white/[0.06]',
              FOCUS_RING
            )}
            style={{ color: SIDEBAR_TOKENS.textMuted }}
          >
            {action.icon}
          </button>
        )}
      </div>
      {/* Items */}
      <div className="space-y-0.5 px-2">
        {children}
      </div>
    </div>
  );
}

// ============================================
// SIDEBAR SPACE ITEM
// ============================================

export interface SidebarSpaceItemProps {
  name: string;
  avatarUrl?: string;
  emoji?: string;
  unreadCount?: number;
  isActive?: boolean;
  onClick?: () => void;
}

export function SidebarSpaceItem({
  name,
  avatarUrl,
  emoji,
  unreadCount = 0,
  isActive,
  onClick,
}: SidebarSpaceItemProps) {
  const { collapsed } = useGlobalSidebar();
  const hasUnread = unreadCount > 0;

  // Collapsed: icon only with tooltip
  if (collapsed) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full flex justify-center py-1',
          'group relative',
          FOCUS_RING
        )}
        title={name}
      >
        <div
          className={cn(
            'relative w-10 h-10 rounded-xl flex items-center justify-center',
            'transition-all duration-150',
            isActive
              ? 'bg-white/[0.08]'
              : 'hover:bg-white/[0.04] active:bg-white/[0.06]'
          )}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-7 h-7 rounded-lg object-cover"
            />
          ) : emoji ? (
            <span className="text-lg leading-none">{emoji}</span>
          ) : (
            <span
              className="text-[13px] font-semibold"
              style={{ color: SIDEBAR_TOKENS.textSecondary }}
            >
              {name.charAt(0).toUpperCase()}
            </span>
          )}

          {/* Unread indicator */}
          {hasUnread && (
            <span
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
              style={{ background: SIDEBAR_TOKENS.blue }}
            />
          )}
        </div>
      </button>
    );
  }

  // Expanded: full row
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-2 py-1.5 rounded-lg',
        'transition-all duration-150',
        isActive
          ? 'bg-white/[0.06]'
          : 'hover:bg-white/[0.03] active:bg-white/[0.05]',
        FOCUS_RING
      )}
    >
      {/* Avatar/Emoji/Initial */}
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden',
          !avatarUrl && 'bg-white/[0.04]'
        )}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : emoji ? (
          <span className="text-base leading-none">{emoji}</span>
        ) : (
          <span
            className="text-[12px] font-semibold"
            style={{ color: SIDEBAR_TOKENS.textMuted }}
          >
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name */}
      <span
        className="flex-1 text-[13px] font-medium text-left truncate"
        style={{
          color: isActive || hasUnread
            ? SIDEBAR_TOKENS.textPrimary
            : SIDEBAR_TOKENS.textSecondary,
        }}
      >
        {name}
      </span>

      {/* Unread badge */}
      {hasUnread && (
        <span
          className="min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-semibold rounded-full px-1.5"
          style={{ background: SIDEBAR_TOKENS.blue, color: '#fff' }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

// ============================================
// SIDEBAR TOOL ITEM
// ============================================

export interface SidebarToolItemProps {
  name: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

export function SidebarToolItem({
  name,
  icon,
  isActive,
  onClick,
}: SidebarToolItemProps) {
  const { collapsed } = useGlobalSidebar();

  if (collapsed) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full flex justify-center py-1',
          FOCUS_RING
        )}
        title={name}
      >
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            'transition-all duration-150',
            isActive
              ? 'bg-white/[0.08]'
              : 'hover:bg-white/[0.04] active:bg-white/[0.06]'
          )}
          style={{ color: SIDEBAR_TOKENS.textMuted }}
        >
          {icon || <span className="text-[13px] font-semibold">{name.charAt(0)}</span>}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-2 py-1.5 rounded-lg',
        'transition-all duration-150',
        isActive
          ? 'bg-white/[0.06]'
          : 'hover:bg-white/[0.03] active:bg-white/[0.05]',
        FOCUS_RING
      )}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/[0.04]"
        style={{ color: SIDEBAR_TOKENS.textMuted }}
      >
        {icon || <span className="text-[12px] font-semibold">{name.charAt(0)}</span>}
      </div>
      <span
        className="flex-1 text-[13px] font-medium text-left truncate"
        style={{ color: isActive ? SIDEBAR_TOKENS.textPrimary : SIDEBAR_TOKENS.textSecondary }}
      >
        {name}
      </span>
    </button>
  );
}

// ============================================
// SIDEBAR ADD BUTTON
// ============================================

export interface SidebarAddButtonProps {
  label: string;
  onClick?: () => void;
}

export function SidebarAddButton({ label, onClick }: SidebarAddButtonProps) {
  const { collapsed } = useGlobalSidebar();

  if (collapsed) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full flex justify-center py-1',
          'group',
          FOCUS_RING
        )}
        title={label}
      >
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            'border border-dashed border-white/[0.12]',
            'transition-all duration-150',
            'group-hover:border-white/[0.2] group-hover:bg-white/[0.02]',
            'group-active:bg-white/[0.04]'
          )}
        >
          <PlusIcon
            className="w-4 h-4"
            style={{ color: SIDEBAR_TOKENS.textMuted }}
          />
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-2 py-1.5 rounded-lg',
        'border border-dashed border-white/[0.08]',
        'transition-all duration-150',
        'hover:border-white/[0.15] hover:bg-white/[0.02]',
        'active:bg-white/[0.04]',
        'group',
        FOCUS_RING
      )}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
        <PlusIcon
          className="w-4 h-4 transition-colors duration-150"
          style={{ color: SIDEBAR_TOKENS.textMuted }}
        />
      </div>
      <span
        className="text-[13px] font-medium transition-colors duration-150"
        style={{ color: SIDEBAR_TOKENS.textMuted }}
      >
        {label}
      </span>
    </button>
  );
}

// ============================================
// SIDEBAR NAV ITEM (Footer navigation)
// ============================================

export interface SidebarNavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  badge?: React.ReactNode;
}

export function SidebarNavItem({ icon, label, isActive, onClick, badge }: SidebarNavItemProps) {
  const { collapsed } = useGlobalSidebar();

  if (collapsed) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full flex justify-center py-1 relative',
          FOCUS_RING
        )}
        title={label}
      >
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            'transition-all duration-150',
            isActive
              ? 'bg-white/[0.08]'
              : 'hover:bg-white/[0.04] active:bg-white/[0.06]'
          )}
          style={{
            color: isActive ? SIDEBAR_TOKENS.textPrimary : SIDEBAR_TOKENS.textMuted
          }}
        >
          {icon}
        </div>
        {/* Badge dot in collapsed mode */}
        {badge && (
          <span className="absolute top-0.5 right-1 w-2 h-2 bg-amber-400 rounded-full" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-2 py-1.5 rounded-lg',
        'transition-all duration-150',
        isActive
          ? 'bg-white/[0.06]'
          : 'hover:bg-white/[0.03] active:bg-white/[0.05]',
        FOCUS_RING
      )}
    >
      <span
        className="w-8 h-8 flex items-center justify-center flex-shrink-0"
        style={{ color: isActive ? SIDEBAR_TOKENS.textPrimary : SIDEBAR_TOKENS.textMuted }}
      >
        {icon}
      </span>
      <span
        className="text-[13px] font-medium"
        style={{ color: isActive ? SIDEBAR_TOKENS.textPrimary : SIDEBAR_TOKENS.textSecondary }}
      >
        {label}
      </span>
      {badge && (
        <span className="ml-auto">{badge}</span>
      )}
    </button>
  );
}

// ============================================
// SIDEBAR DIVIDER
// ============================================

export function SidebarDivider() {
  return (
    <div
      className="my-2 mx-3"
      style={{ borderTop: `1px solid ${SIDEBAR_TOKENS.borderSubtle}` }}
    />
  );
}

// ============================================
// SIDEBAR HEADER (Brand)
// ============================================

export interface SidebarHeaderProps {
  onLogoClick?: () => void;
}

export function SidebarHeader({ onLogoClick }: SidebarHeaderProps) {
  const { collapsed } = useGlobalSidebar();

  if (collapsed) {
    return (
      <div className="px-2 py-3 flex justify-center">
        <button
          onClick={onLogoClick}
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            'transition-all duration-150',
            'hover:bg-white/[0.04]',
            FOCUS_RING
          )}
          title="HIVE Home"
        >
          <HiveLogo className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 py-3">
      <button
        onClick={onLogoClick}
        className={cn(
          'flex items-center gap-2.5 px-2 py-1.5 -ml-2 rounded-lg',
          'transition-all duration-150',
          'hover:bg-white/[0.04]',
          FOCUS_RING
        )}
        title="HIVE Home"
      >
        <HiveLogo className="w-6 h-6" />
        <span
          className="text-[15px] font-bold tracking-tight"
          style={{ color: SIDEBAR_TOKENS.textPrimary }}
        >
          HIVE
        </span>
      </button>
    </div>
  );
}

// ============================================
// SIDEBAR FOOTER
// ============================================

export interface SidebarFooterProps {
  children: React.ReactNode;
}

export function SidebarFooter({ children }: SidebarFooterProps) {
  const { collapsed } = useGlobalSidebar();

  return (
    <div
      className={cn(
        'mt-auto py-2',
        collapsed ? 'px-2' : 'px-2'
      )}
      style={{ borderTop: `1px solid ${SIDEBAR_TOKENS.border}` }}
    >
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );
}

// ============================================
// SIDEBAR COLLAPSE TOGGLE
// ============================================

export function SidebarCollapseToggle() {
  const { collapsed, setCollapsed } = useGlobalSidebar();

  return (
    <button
      onClick={() => setCollapsed(!collapsed)}
      className={cn(
        'absolute -right-3 top-3 z-50',
        'w-6 h-6 rounded-full',
        'flex items-center justify-center',
        'transition-all duration-150',
        'hover:bg-white/[0.06]',
        'active:bg-white/[0.08]',
        FOCUS_RING
      )}
      style={{
        background: SIDEBAR_TOKENS.bg,
        border: `1px solid ${SIDEBAR_TOKENS.border}`,
      }}
      title={collapsed ? 'Expand sidebar ([)' : 'Collapse sidebar ([)'}
    >
      <ChevronIcon
        className="w-3 h-3"
        style={{
          color: SIDEBAR_TOKENS.textMuted,
          transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: '200ms ease',
        }}
      />
    </button>
  );
}

// ============================================
// ICONS (Minimal, 1.5 stroke weight)
// ============================================

function PlusIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function ChevronIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
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

export function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

export function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

export function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

export function EventsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
    </svg>
  );
}

export function LeadersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}

export function FeedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
    </svg>
  );
}

export function RitualsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013-5.6c.212-.182.426-.354.638-.523A8.252 8.252 0 0015.362 5.214zM12 12a3 3 0 100 6 3 3 0 000-6z" />
    </svg>
  );
}

export function HiveLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1500 1500" fill="#FFD700" className={className}>
      <path d="M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z"/>
    </svg>
  );
}
