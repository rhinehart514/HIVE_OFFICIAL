'use client';

/**
 * TopBar — Page-Level Navigation Bar
 *
 * Sits AFTER the sidebar (not full-width).
 * Shows page-specific context, not global nav.
 *
 * - Left: Page title / breadcrumbs
 * - Right: Search (⌘K), Notifications
 *
 * Height: 48px
 *
 * @version 2.0.0 — Redesigned Jan 2026
 */

import * as React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { springPresets } from '@hive/tokens';

// ============================================
// TOKENS
// ============================================

export const TOPBAR_TOKENS = {
  height: 48,
  bg: '#080808',
  border: 'rgba(255, 255, 255, 0.06)',
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1A6',
  textMuted: '#71717A',
  hoverBg: 'rgba(255, 255, 255, 0.04)',
  transition: '150ms ease',
} as const;

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[#000000]';

// ============================================
// TOPBAR CONTAINER
// ============================================

export interface TopBarProps {
  children?: React.ReactNode;
  className?: string;
  /** Offset from left (sidebar width) */
  leftOffset?: number;
}

export function TopBar({ children, className, leftOffset = 0 }: TopBarProps) {
  return (
    <motion.header
      className={cn(
        'fixed top-0 right-0 z-50 flex items-center justify-between px-4',
        className
      )}
      animate={{ left: leftOffset }}
      transition={springPresets.snappy}
      style={{
        height: TOPBAR_TOKENS.height,
        background: TOPBAR_TOKENS.bg,
        borderBottom: `1px solid ${TOPBAR_TOKENS.border}`,
      }}
    >
      {children}
    </motion.header>
  );
}

// ============================================
// TOPBAR BRAND (Moved to sidebar, kept for backwards compat)
// ============================================

export interface TopBarBrandProps {
  onClick?: () => void;
}

/** @deprecated Use SidebarBrand instead */
export function TopBarBrand({ onClick }: TopBarBrandProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 -ml-2 rounded-lg transition-colors',
        'hover:bg-white/[0.05]',
        FOCUS_RING
      )}
    >
      <HiveLogo className="w-5 h-5" />
      <span className="text-body font-bold tracking-tight" style={{ color: TOPBAR_TOKENS.textPrimary }}>
        HIVE
      </span>
    </button>
  );
}

// ============================================
// TOPBAR PAGE TITLE
// ============================================

export interface TopBarTitleProps {
  children: React.ReactNode;
}

export function TopBarTitle({ children }: TopBarTitleProps) {
  return (
    <h1
      className="text-body font-semibold"
      style={{ color: TOPBAR_TOKENS.textPrimary }}
    >
      {children}
    </h1>
  );
}

// ============================================
// TOPBAR BREADCRUMBS
// ============================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface TopBarBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function TopBarBreadcrumbs({ items }: TopBarBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5">
      {items.map((item, index) => {
        const isCurrentPage = index === items.length - 1;
        const isClickable = item.onClick || item.href;

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="text-body-sm" style={{ color: TOPBAR_TOKENS.textMuted }}>/</span>
            )}
            {isClickable && !isCurrentPage ? (
              <button
                onClick={item.onClick}
                className={cn(
                  'text-body-sm transition-colors rounded px-1 -mx-1',
                  'hover:text-white',
                  FOCUS_RING
                )}
                style={{ color: TOPBAR_TOKENS.textSecondary }}
              >
                {item.label}
              </button>
            ) : (
              <span
                className={cn(
                  'text-body-sm',
                  isCurrentPage && 'font-semibold'
                )}
                style={{
                  color: isCurrentPage ? TOPBAR_TOKENS.textPrimary : TOPBAR_TOKENS.textSecondary,
                }}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ============================================
// TOPBAR ACTIONS (right side container)
// ============================================

export interface TopBarActionsProps {
  children: React.ReactNode;
}

export function TopBarActions({ children }: TopBarActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {children}
    </div>
  );
}

// ============================================
// TOPBAR SEARCH TRIGGER
// ============================================

export interface TopBarSearchProps {
  onClick?: () => void;
  shortcut?: string;
}

export function TopBarSearch({ onClick, shortcut = '⌘K' }: TopBarSearchProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
        'hover:bg-white/[0.05]',
        FOCUS_RING
      )}
      title={`Search (${shortcut})`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        style={{ color: TOPBAR_TOKENS.textMuted }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span
        className="text-label-sm font-medium px-1.5 py-0.5 rounded"
        style={{
          color: TOPBAR_TOKENS.textMuted,
          background: 'rgba(255, 255, 255, 0.06)',
        }}
      >
        {shortcut}
      </span>
    </button>
  );
}

// ============================================
// TOPBAR NOTIFICATIONS
// ============================================

export interface TopBarNotificationsProps {
  count?: number;
  onClick?: () => void;
}

export function TopBarNotifications({ count = 0, onClick }: TopBarNotificationsProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors',
        'hover:bg-white/[0.05]',
        FOCUS_RING
      )}
      title="Notifications"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        style={{ color: TOPBAR_TOKENS.textSecondary }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
      {count > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center text-label-xs font-semibold rounded-full px-1 bg-red-400 text-white"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

// ============================================
// TOPBAR PROFILE (kept for backwards compat, prefer sidebar)
// ============================================

export interface TopBarProfileProps {
  name?: string;
  avatarUrl?: string;
  onClick?: () => void;
}

/** @deprecated Profile button moved to sidebar */
export function TopBarProfile({ name, avatarUrl, onClick }: TopBarProfileProps) {
  const initials = React.useMemo(() => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }, [name]);

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center w-9 h-9 rounded-lg transition-colors overflow-hidden',
        'hover:bg-white/[0.05]',
        FOCUS_RING
      )}
      title={name || 'Profile'}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt={name || 'Profile'} width={28} height={28} className="rounded-lg object-cover" sizes="28px" />
      ) : (
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-label font-semibold bg-white/[0.10] text-white/50"
        >
          {initials}
        </div>
      )}
    </button>
  );
}

// ============================================
// TOPBAR DIVIDER
// ============================================

export function TopBarDivider() {
  return (
    <div
      className="w-px h-5 mx-1"
      style={{ background: TOPBAR_TOKENS.border }}
    />
  );
}

// ============================================
// HIVE LOGO (shared)
// ============================================

export function HiveLogo({ className }: { className?: string }) {
  return (
    <img
      src="/assets/hive-logo-gold.svg"
      alt="HIVE"
      className={className}
    />
  );
}
