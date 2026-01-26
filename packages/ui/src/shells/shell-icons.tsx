/**
 * Shell Icons
 *
 * Centralized icon library for the HIVE Shell.
 * All shell icons in one place — no duplication.
 *
 * Design: 18x18 with 1.25 stroke width (OpenAI/Apple aesthetic)
 */

import React from 'react';

// ============================================
// ICON BASE PROPS
// ============================================

export interface ShellIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

const defaultProps = {
  size: 18,
  strokeWidth: 1.25,
};

// ============================================
// BRAND
// ============================================

/**
 * HIVE Logo — The actual brand mark.
 */
export const HiveLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 1500 1500"
    className={className}
    aria-label="HIVE"
    fill="currentColor"
  >
    <path d="M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z" />
  </svg>
);

// ============================================
// NAVIGATION ICONS
// ============================================

/**
 * Home/Feed icon
 */
export const HomeIcon: React.FC<ShellIconProps> = ({
  className,
  size = defaultProps.size,
  strokeWidth = defaultProps.strokeWidth,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

/**
 * Users/Spaces icon
 */
export const UsersIcon: React.FC<ShellIconProps> = ({
  className,
  size = defaultProps.size,
  strokeWidth = defaultProps.strokeWidth,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

/**
 * Single user/Profile icon
 */
export const UserIcon: React.FC<ShellIconProps> = ({
  className,
  size = defaultProps.size,
  strokeWidth = defaultProps.strokeWidth,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

/**
 * Beaker/HiveLab icon
 */
export const BeakerIcon: React.FC<ShellIconProps> = ({
  className,
  size = defaultProps.size,
  strokeWidth = defaultProps.strokeWidth,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
    />
  </svg>
);

/**
 * Bell/Notifications icon
 */
export const BellIcon: React.FC<ShellIconProps> = ({
  className,
  size = defaultProps.size,
  strokeWidth = defaultProps.strokeWidth,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

/**
 * Calendar/Events icon
 */
export const CalendarIcon: React.FC<ShellIconProps> = ({
  className,
  size = defaultProps.size,
  strokeWidth = defaultProps.strokeWidth,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

/**
 * Settings/Gear icon
 */
export const SettingsIcon: React.FC<ShellIconProps> = ({
  className,
  size = defaultProps.size,
  strokeWidth = defaultProps.strokeWidth,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

/**
 * Search/Magnifying glass icon
 */
export const SearchIcon: React.FC<ShellIconProps> = ({
  className,
  size = defaultProps.size,
  strokeWidth = defaultProps.strokeWidth,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

// ============================================
// UI ICONS
// ============================================

/**
 * Plus/Add icon
 */
export const PlusIcon: React.FC<ShellIconProps> = ({
  className,
  size = 16,
  strokeWidth = 1.5,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

/**
 * Chevron down
 */
export const ChevronDownIcon: React.FC<ShellIconProps> = ({
  className,
  size = 16,
  strokeWidth = 1.5,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

/**
 * Chevron right
 */
export const ChevronRightIcon: React.FC<ShellIconProps> = ({
  className,
  size = 16,
  strokeWidth = 1.5,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

/**
 * Sidebar/Menu icon
 */
export const SidebarIcon: React.FC<ShellIconProps> = ({
  className,
  size = 16,
  strokeWidth = defaultProps.strokeWidth,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

// ============================================
// ACTIVITY ICONS
// ============================================

/**
 * Message/Chat icon
 */
export const MessageIcon: React.FC<ShellIconProps> = ({
  className,
  size = 16,
  strokeWidth = 1.5,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
    />
  </svg>
);

/**
 * Heart/Reaction icon
 */
export const HeartIcon: React.FC<ShellIconProps> = ({
  className,
  size = 16,
  strokeWidth = 1.5,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
    />
  </svg>
);

// ============================================
// LIVING SIDEBAR ICONS
// ============================================

/**
 * Chevron left — collapse/back navigation
 */
export const ChevronLeftIcon: React.FC<ShellIconProps> = ({
  className,
  size = 16,
  strokeWidth = 1.5,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

/**
 * Message circle — chat/conversation icon (simpler than MessageIcon)
 */
export const MessageCircleIcon: React.FC<ShellIconProps> = ({
  className,
  size = 16,
  strokeWidth = 1.5,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
    />
  </svg>
);

/**
 * Hash — channel/board icon
 */
export const HashIcon: React.FC<ShellIconProps> = ({
  className,
  size = 16,
  strokeWidth = 1.5,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18"
    />
  </svg>
);

// ============================================
// ICON MAP
// ============================================

/**
 * Navigation icon map for dynamic lookup.
 */
export const NAV_ICONS: Record<string, React.FC<ShellIconProps>> = {
  feed: HomeIcon,
  home: HomeIcon,
  spaces: UsersIcon,
  profile: UserIcon,
  hivelab: BeakerIcon,
  build: BeakerIcon,
  notifications: BellIcon,
  calendar: CalendarIcon,
  schedules: CalendarIcon,
  settings: SettingsIcon,
  search: SearchIcon,
};

/**
 * Get icon by name.
 */
export function getNavIcon(name: string): React.FC<ShellIconProps> | undefined {
  return NAV_ICONS[name.toLowerCase()];
}

// ============================================
// ACTION ICONS
// ============================================

/**
 * LogOut/Sign out icon
 */
export const LogOutIcon: React.FC<ShellIconProps> = ({
  className,
  size = 16,
  strokeWidth = 1.5,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);
