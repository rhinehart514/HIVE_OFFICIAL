'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CommandPalette, type CommandPaletteItem } from '../atomic/00-Global/organisms/command-palette';

// Silk easing - smooth, confident
const SILK_EASE = [0.22, 1, 0.36, 1];

// Spring config for OpenAI-style fluid motion
const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

// Smooth transition for content reveals
const CONTENT_TRANSITION = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1],
};

// Staggered nav item variants
const navContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const navItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: SPRING_CONFIG,
  },
};

// HIVE Logo SVG Component - Actual brand mark
const HiveLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 1500 1500"
    className={className}
    aria-label="HIVE"
    fill="currentColor"
  >
    <path d="M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z"/>
  </svg>
);

// Minimal icons - thinner strokes for OpenAI feel
const HomeIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const BeakerIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const SidebarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const NAV_ICONS: Record<string, React.FC> = {
  feed: HomeIcon,
  spaces: UsersIcon,
  profile: UserIcon,
  hivelab: BeakerIcon,
  notifications: BellIcon,
  schedules: CalendarIcon,
};

// Collapsible Section Component - like Income > Earnings/Refunds in reference
interface CollapsibleSectionProps {
  id: string;
  label: string;
  icon?: React.FC;
  badge?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isCollapsed?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  label,
  icon: Icon,
  badge,
  children,
  defaultOpen = false,
  isCollapsed = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (isCollapsed) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-0.5">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
          text-neutral-400 hover:text-neutral-200
          hover:bg-neutral-900/50
          transition-colors duration-150
        `}
        whileTap={{ scale: 0.98 }}
      >
        {Icon && <Icon />}
        <span className="flex-1 text-left text-[14px] font-medium">{label}</span>
        {badge && badge > 0 && (
          <span className="px-1.5 py-0.5 text-[11px] font-medium bg-gold-500/20 text-gold-500 rounded-md">
            {badge}
          </span>
        )}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-neutral-500"
        >
          <ChevronDownIcon />
        </motion.div>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pl-4 border-l border-neutral-800/50 ml-5 space-y-0.5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface ShellNavItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ElementType;
  badge?: number;
  children?: ShellNavItem[];
  comingSoon?: boolean;
}

// Coming soon badge tooltip
const ComingSoonTooltip = ({ children, show }: { children: React.ReactNode; show: boolean }) => {
  if (!show) return <>{children}</>;

  return (
    <div className="relative group">
      {children}
      <div className="
        absolute left-full top-1/2 -translate-y-1/2 ml-3
        px-2.5 py-1.5 rounded-lg bg-neutral-800
        text-[13px] text-white whitespace-nowrap
        opacity-0 group-hover:opacity-100
        pointer-events-none
        transition-opacity duration-100
        z-50 shadow-lg
      ">
        Launching soon
      </div>
    </div>
  );
}

export interface ShellMobileNavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  path?: string;
  badge?: number;
  onClick?: () => void;
  comingSoon?: boolean;
}

export interface ShellSpaceLink {
  id: string;
  label: string;
  href: string;
  status?: 'new' | 'live' | 'quiet';
  meta?: string;
}

export interface ShellSpaceSection {
  id: string;
  label: string;
  description?: string;
  spaces: ShellSpaceLink[];
  actionLabel?: string;
  actionHref?: string;
  emptyCopy?: string;
}

export interface UniversalShellProps {
  children: React.ReactNode;
  variant?: 'full' | 'minimal';
  sidebarStyle?: string;
  headerStyle?: string;
  navItems?: ShellNavItem[];
  secondaryNavItems?: ShellNavItem[];
  mobileNavItems?: ShellMobileNavItem[];
  notificationCount?: number;
  messageCount?: number;
  notifications?: Array<Record<string, unknown>>;
  notificationsLoading?: boolean;
  notificationsError?: string | null;
  mySpaces?: ShellSpaceSection[];
  showContextRail?: boolean;
  showBreadcrumbs?: boolean;
  onNotificationNavigate?: (url: string) => void;
  // User profile card props
  userAvatarUrl?: string;
  userName?: string;
  userHandle?: string;
  // Command palette props
  commandPaletteItems?: CommandPaletteItem[];
  onCommandPaletteSearch?: (query: string) => void;
  commandPaletteLoading?: boolean;
  onCommandPaletteSelect?: (item: CommandPaletteItem) => void;
}

export const DEFAULT_SIDEBAR_NAV_ITEMS: ShellNavItem[] = [
  { id: 'feed', label: 'Feed', href: '/feed' },
  { id: 'spaces', label: 'Spaces', href: '/spaces' },
  { id: 'schedules', label: 'Calendar', href: '/calendar' },
  { id: 'hivelab', label: 'HiveLab', href: '/tools' },
];

// Secondary nav items (bottom section)
export const DEFAULT_SECONDARY_NAV_ITEMS: ShellNavItem[] = [
  { id: 'notifications', label: 'Notifications', href: '/notifications' },
];

export const DEFAULT_MOBILE_NAV_ITEMS: ShellMobileNavItem[] = [
  { id: 'feed', icon: HomeIcon, label: 'Feed', path: '/feed' },
  { id: 'spaces', icon: UsersIcon, label: 'Spaces', path: '/spaces' },
  { id: 'schedules', icon: CalendarIcon, label: 'Calendar', path: '/calendar' },
  { id: 'hivelab', icon: BeakerIcon, label: 'Lab', path: '/tools' },
  { id: 'profile', icon: UserIcon, label: 'Profile', path: '/profile' },
];

// Tooltip component - minimal style
const Tooltip = ({ children, label, show }: { children: React.ReactNode; label: string; show: boolean }) => {
  if (!show) return <>{children}</>;

  return (
    <div className="relative group">
      {children}
      <div className="
        absolute left-full top-1/2 -translate-y-1/2 ml-3
        px-2.5 py-1.5 rounded-lg bg-neutral-800
        text-[13px] text-white whitespace-nowrap
        opacity-0 group-hover:opacity-100
        pointer-events-none
        transition-opacity duration-100
        z-50 shadow-lg
      ">
        {label}
      </div>
    </div>
  );
};

// Default command palette items for navigation
const DEFAULT_COMMAND_PALETTE_ITEMS: CommandPaletteItem[] = [
  { id: 'nav-feed', label: 'Go to Feed', description: 'View your personalized feed', category: 'Navigation', shortcut: ['G', 'F'] },
  { id: 'nav-spaces', label: 'Browse Spaces', description: 'Discover and join communities', category: 'Navigation', shortcut: ['G', 'S'] },
  { id: 'nav-calendar', label: 'Open Calendar', description: 'View upcoming events', category: 'Navigation', shortcut: ['G', 'C'] },
  { id: 'nav-hivelab', label: 'HiveLab', description: 'Build and deploy tools', category: 'Navigation', shortcut: ['G', 'H'] },
  { id: 'nav-profile', label: 'My Profile', description: 'View and edit your profile', category: 'Navigation', shortcut: ['G', 'P'] },
  { id: 'nav-notifications', label: 'Notifications', description: 'View your notifications', category: 'Navigation', shortcut: ['G', 'N'] },
  { id: 'nav-settings', label: 'Settings', description: 'Manage your preferences', category: 'Settings', shortcut: ['G', ','] },
  { id: 'action-create-space', label: 'Create Space', description: 'Start a new community', category: 'Actions', featured: true },
  { id: 'action-create-event', label: 'Create Event', description: 'Schedule a new event', category: 'Actions' },
  { id: 'action-create-tool', label: 'Create Tool', description: 'Build a new HiveLab tool', category: 'Actions' },
];

export const UniversalShell: React.FC<UniversalShellProps> = ({
  children,
  variant = 'full',
  navItems = DEFAULT_SIDEBAR_NAV_ITEMS,
  secondaryNavItems = DEFAULT_SECONDARY_NAV_ITEMS,
  mobileNavItems = DEFAULT_MOBILE_NAV_ITEMS,
  notificationCount = 0,
  mySpaces = [],
  userAvatarUrl,
  userName,
  userHandle,
  commandPaletteItems,
  onCommandPaletteSearch,
  commandPaletteLoading = false,
  onCommandPaletteSelect,
}) => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Build command palette items from spaces and default navigation
  const allCommandPaletteItems = React.useMemo(() => {
    const items: CommandPaletteItem[] = [...(commandPaletteItems || DEFAULT_COMMAND_PALETTE_ITEMS)];

    // Add user's spaces to command palette
    const allSpaces = mySpaces.flatMap(section => section.spaces);
    allSpaces.slice(0, 10).forEach(space => {
      items.push({
        id: `space-${space.id}`,
        label: space.label,
        description: space.meta || 'Go to space',
        category: 'Your Spaces',
        onSelect: () => {
          if (typeof window !== 'undefined') {
            window.location.href = space.href;
          }
        },
      });
    });

    return items;
  }, [commandPaletteItems, mySpaces]);

  // Handle command palette selection with navigation
  const handleCommandPaletteSelect = useCallback((item: CommandPaletteItem) => {
    if (onCommandPaletteSelect) {
      onCommandPaletteSelect(item);
      return;
    }

    // Default navigation handling
    const navigationMap: Record<string, string> = {
      'nav-feed': '/feed',
      'nav-spaces': '/spaces',
      'nav-calendar': '/calendar',
      'nav-hivelab': '/tools',
      'nav-profile': '/profile',
      'nav-notifications': '/notifications',
      'nav-settings': '/profile/settings',
      'action-create-space': '/spaces/create',
      'action-create-event': '/events/create',
      'action-create-tool': '/tools/create',
    };

    const path = navigationMap[item.id];
    if (path && typeof window !== 'undefined') {
      window.location.href = path;
    }
  }, [onCommandPaletteSelect]);

  // Toggle a space section's expanded state
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Check if section is expanded (default to true for sections with spaces)
  const isSectionExpanded = (sectionId: string, hasSpaces: boolean) => {
    if (expandedSections[sectionId] !== undefined) {
      return expandedSections[sectionId];
    }
    return hasSpaces; // Default: expanded if has spaces
  };

  // Accessibility: simplified animations for reduced motion
  const springTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : SPRING_CONFIG;

  const contentTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : CONTENT_TRANSITION;

  // Load sidebar state from localStorage
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('hive-sidebar-collapsed');
      if (savedCollapsed !== null) {
        setIsCollapsed(JSON.parse(savedCollapsed));
      }
      const savedSections = localStorage.getItem('hive-sidebar-sections');
      if (savedSections !== null) {
        setExpandedSections(JSON.parse(savedSections));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Persist expanded sections when they change
  useEffect(() => {
    if (Object.keys(expandedSections).length > 0) {
      try {
        localStorage.setItem('hive-sidebar-sections', JSON.stringify(expandedSections));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [expandedSections]);

  // Save collapse state
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    try {
      localStorage.setItem('hive-sidebar-collapsed', JSON.stringify(newState));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Global keyboard shortcuts (G + key for navigation)
  useEffect(() => {
    let gPressed = false;
    let gTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Handle G prefix for navigation shortcuts
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        gPressed = true;
        gTimeout = setTimeout(() => {
          gPressed = false;
        }, 1000); // Reset after 1 second
        return;
      }

      if (gPressed && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const keyLower = e.key.toLowerCase();
        const shortcuts: Record<string, string> = {
          'f': '/feed',
          's': '/spaces',
          'c': '/calendar',
          'h': '/tools',
          'p': '/profile',
          'n': '/notifications',
          ',': '/profile/settings',
        };

        const path = shortcuts[keyLower];
        if (path && typeof window !== 'undefined') {
          e.preventDefault();
          window.location.href = path;
          gPressed = false;
          clearTimeout(gTimeout);
        }
      }

      // Escape key to close command palette (backup)
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(gTimeout);
    };
  }, [isCommandPaletteOpen]);

  if (variant === 'minimal') {
    return <>{children}</>;
  }

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/feed' && pathname === '/') return true;
    return pathname === href || pathname?.startsWith(href + '/');
  };

  // Flatten all spaces from sections
  const allSpaces = mySpaces.flatMap(section => section.spaces);
  const hasSpaces = allSpaces.length > 0;

  return (
    <div className="flex min-h-screen bg-black">
      {/* Desktop Sidebar - OpenAI style: clean, spacious, minimal */}
      <motion.aside
        layout
        className="hidden md:flex flex-col bg-neutral-950 fixed h-full z-40"
        animate={{ width: isCollapsed ? 68 : 260 }}
        transition={springTransition}
      >
        {/* Logo area - lots of breathing room */}
        <motion.div
          layout
          className={`h-14 flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'}`}
          transition={springTransition}
        >
          <motion.button
            layout
            onClick={() => {
              if (isCollapsed) {
                toggleCollapse();
              } else {
                window.location.href = '/feed';
              }
            }}
            className={`flex items-center outline-none ${isCollapsed ? 'justify-center p-2' : 'gap-3'} focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:rounded-md`}
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            transition={springTransition}
            aria-label={isCollapsed ? "Expand sidebar" : "Go to feed"}
          >
            <motion.div
              layout
              animate={{
                width: isCollapsed ? 32 : 28,
                height: isCollapsed ? 32 : 28,
              }}
              transition={springTransition}
              className="flex items-center justify-center"
            >
              <HiveLogo className="text-white w-full h-full" />
            </motion.div>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  className="text-white text-[15px] font-medium"
                  initial={{ opacity: 0, x: -8, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 'auto' }}
                  exit={{ opacity: 0, x: -8, width: 0 }}
                  transition={contentTransition}
                >
                  HIVE
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Search/Command Palette trigger + Collapse toggle */}
          <div className="flex items-center gap-1">
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.button
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="p-1.5 rounded-md text-neutral-500 hover:text-white hover:bg-white/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                  whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={contentTransition}
                  aria-label="Open command palette (⌘K)"
                  title="Search (⌘K)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.button
                  onClick={toggleCollapse}
                  className="p-1.5 rounded-md text-neutral-500 hover:text-white hover:bg-white/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                  whileHover={shouldReduceMotion ? {} : { scale: 1.1, rotate: 180 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
                  initial={{ opacity: 0, rotate: shouldReduceMotion ? 0 : -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: shouldReduceMotion ? 0 : 90 }}
                  transition={springTransition}
                  aria-label="Collapse sidebar"
                >
                  <SidebarIcon />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Quick Search Bar (expanded sidebar) */}
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              className="px-3 pb-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={contentTransition}
            >
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-900/50 border border-neutral-800/50 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 hover:border-neutral-700/50 transition-all text-[13px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="flex-1 text-left">Search...</span>
                <kbd className="text-[10px] text-neutral-600 bg-neutral-800 px-1.5 py-0.5 rounded">⌘K</kbd>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Navigation - generous spacing */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          <motion.div
            className="space-y-0.5"
            variants={navContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {navItems.map((item) => {
              const Icon = NAV_ICONS[item.id];
              const active = isActive(item.href);
              const isComingSoon = item.comingSoon;

              // Use ComingSoonTooltip for coming soon items when collapsed
              const TooltipWrapper = isComingSoon && isCollapsed ? ComingSoonTooltip : Tooltip;
              const tooltipLabel = isComingSoon ? 'Launching soon' : item.label;

              return (
                <TooltipWrapper key={item.id} label={tooltipLabel} show={isCollapsed}>
                  <motion.a
                    href={isComingSoon ? undefined : item.href}
                    onClick={isComingSoon ? (e: React.MouseEvent) => e.preventDefault() : undefined}
                    variants={navItemVariants}
                    className={`
                      relative flex items-center gap-3 px-3 py-2.5 rounded-md
                      transition-colors duration-75 outline-none
                      ${isCollapsed ? 'justify-center' : ''}
                      ${isComingSoon
                        ? 'text-neutral-600 cursor-not-allowed'
                        : active
                          ? 'text-white bg-neutral-800 border border-neutral-700/50'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                      }
                      focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950
                    `}
                    whileHover={shouldReduceMotion || isComingSoon ? {} : { x: isCollapsed ? 0 : 2 }}
                    whileTap={shouldReduceMotion || isComingSoon ? {} : { scale: 0.97 }}
                    whileFocus={isComingSoon ? {} : { backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
                    transition={springTransition}
                  >
                    <motion.div
                      whileHover={shouldReduceMotion || isComingSoon ? {} : { scale: 1.1 }}
                      transition={springTransition}
                    >
                      {Icon && <Icon />}
                    </motion.div>

                    <AnimatePresence mode="wait">
                      {!isCollapsed && (
                        <motion.span
                          className="text-[14px]"
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          transition={contentTransition}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Coming soon badge */}
                    {isComingSoon && !isCollapsed && (
                      <motion.span
                        className="ml-auto text-[10px] text-neutral-600 uppercase tracking-wider"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={springTransition}
                      >
                        Soon
                      </motion.span>
                    )}

                    {/* Badge - HIVE gold pill style */}
                    {!isComingSoon && item.badge && item.badge > 0 && !isCollapsed && (
                      <motion.span
                        className="ml-auto px-2 py-0.5 text-[11px] font-semibold bg-gold-500 text-black rounded-full tabular-nums"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={springTransition}
                      >
                        {item.badge}
                      </motion.span>
                    )}

                    {/* Badge dot for collapsed */}
                    {!isComingSoon && item.badge && item.badge > 0 && isCollapsed && (
                      <motion.span
                        className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={springTransition}
                      />
                    )}
                  </motion.a>
                </TooltipWrapper>
              );
            })}
          </motion.div>

          {/* My Spaces - Grouped collapsible sections */}
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                className="mt-6 pt-6 border-t border-neutral-800/50"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={CONTENT_TRANSITION}
              >
                <div className="flex items-center justify-between px-3 mb-3">
                  <h3 className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                    Your Spaces
                  </h3>
                  <a
                    href="/spaces?tab=discover"
                    className="text-neutral-600 hover:text-gold-500 transition-colors"
                    title="Browse spaces"
                  >
                    <PlusIcon />
                  </a>
                </div>

                {hasSpaces ? (
                  <div className="space-y-1">
                    {mySpaces.map((section) => {
                      const sectionHasSpaces = section.spaces.length > 0;
                      const isExpanded = isSectionExpanded(section.id, sectionHasSpaces);

                      return (
                        <div key={section.id} className="space-y-0.5">
                          {/* Section Header - Collapsible */}
                          <button
                            onClick={() => toggleSection(section.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowRight' && !isExpanded) {
                                e.preventDefault();
                                toggleSection(section.id);
                              } else if (e.key === 'ArrowLeft' && isExpanded) {
                                e.preventDefault();
                                toggleSection(section.id);
                              }
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-left hover:bg-neutral-800/30 transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-950"
                            aria-expanded={isExpanded}
                            aria-controls={`spaces-section-${section.id}`}
                          >
                            <motion.div
                              animate={{ rotate: isExpanded ? 90 : 0 }}
                              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                              className="text-neutral-600 group-hover:text-neutral-400"
                            >
                              <ChevronRightIcon />
                            </motion.div>
                            <span className="text-[12px] font-medium text-neutral-500 group-hover:text-neutral-300 flex-1">
                              {section.label}
                            </span>
                            {sectionHasSpaces && (
                              <span className="text-[10px] text-neutral-600 tabular-nums">
                                {section.spaces.length}
                              </span>
                            )}
                          </button>

                          {/* Section Content */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                id={`spaces-section-${section.id}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden"
                              >
                                {sectionHasSpaces ? (
                                  <div className="pl-6 space-y-0.5" role="group" aria-label={`${section.label} spaces`}>
                                    {section.spaces.slice(0, 4).map((space) => (
                                      <a
                                        key={space.id}
                                        href={space.href}
                                        className="
                                          flex items-center gap-2.5 px-2 py-1.5 rounded-md
                                          text-neutral-400 hover:text-white hover:bg-neutral-800/50
                                          transition-colors duration-75
                                          outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-950
                                        "
                                      >
                                        <span
                                          className={`
                                            w-1.5 h-1.5 rounded-full flex-shrink-0
                                            ${space.status === 'live' ? 'bg-emerald-500' :
                                              space.status === 'new' ? 'bg-gold-500' : 'bg-neutral-600'}
                                          `}
                                          aria-hidden="true"
                                        />
                                        <span className="text-[13px] truncate">{space.label}</span>
                                        {space.status === 'new' && <span className="sr-only">(new)</span>}
                                        {space.status === 'live' && <span className="sr-only">(active)</span>}
                                      </a>
                                    ))}
                                    {section.spaces.length > 4 && (
                                      <a
                                        href={section.actionHref || '/spaces?tab=joined'}
                                        className="flex items-center px-2 py-1 text-[11px] text-neutral-500 hover:text-gold-500 transition-colors outline-none focus-visible:text-gold-500"
                                      >
                                        +{section.spaces.length - 4} more
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <div className="pl-6 pr-3 py-2">
                                    <p className="text-[11px] text-neutral-600 mb-1.5">
                                      {section.emptyCopy || 'No spaces yet'}
                                    </p>
                                    {section.actionLabel && section.actionHref && (
                                      <a
                                        href={section.actionHref}
                                        className="text-[11px] text-neutral-500 hover:text-gold-500 transition-colors"
                                      >
                                        {section.actionLabel} →
                                      </a>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}

                    {/* View all link */}
                    {allSpaces.length > 8 && (
                      <a
                        href="/spaces?tab=joined"
                        className="flex items-center px-3 py-2 text-[12px] text-neutral-500 hover:text-gold-500 transition-colors"
                      >
                        View all {allSpaces.length} spaces →
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="px-3 py-2">
                    <p className="text-[13px] text-neutral-500 mb-2">
                      Join spaces to see them here
                    </p>
                    <a
                      href="/spaces?tab=discover"
                      className="inline-flex items-center gap-1.5 text-[12px] text-neutral-400 hover:text-gold-500 transition-colors"
                    >
                      Browse spaces →
                    </a>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Secondary Nav - Settings, Notifications */}
        <div className="px-3 py-2 border-t border-neutral-800/50">
          <motion.div
            className="space-y-0.5"
            variants={navContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {secondaryNavItems.map((item) => {
              const Icon = NAV_ICONS[item.id];
              const active = isActive(item.href);
              const showBadge = item.id === 'notifications' && notificationCount > 0;

              return (
                <Tooltip key={item.id} label={item.label} show={isCollapsed}>
                  <motion.a
                    href={item.href}
                    variants={navItemVariants}
                    className={`
                      relative flex items-center gap-3 px-3 py-2 rounded-md
                      transition-colors duration-75 outline-none
                      ${isCollapsed ? 'justify-center' : ''}
                      ${active
                        ? 'text-white bg-neutral-800'
                        : 'text-neutral-500 hover:text-white hover:bg-neutral-800/50'
                      }
                    `}
                    whileHover={shouldReduceMotion ? {} : { x: isCollapsed ? 0 : 2 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                    transition={springTransition}
                  >
                    {Icon && <Icon />}

                    <AnimatePresence mode="wait">
                      {!isCollapsed && (
                        <motion.span
                          className="text-[13px]"
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          transition={contentTransition}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Notification badge */}
                    {showBadge && !isCollapsed && (
                      <motion.span
                        className="ml-auto px-2 py-0.5 text-[11px] font-semibold bg-gold-500 text-black rounded-full tabular-nums"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={springTransition}
                      >
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </motion.span>
                    )}

                    {/* Badge dot for collapsed */}
                    {showBadge && isCollapsed && (
                      <motion.span
                        className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold-500 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={springTransition}
                      />
                    )}
                  </motion.a>
                </Tooltip>
              );
            })}

            {/* Settings - always show */}
            <Tooltip label="Settings" show={isCollapsed}>
              <motion.a
                href="/profile/settings"
                variants={navItemVariants}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-md
                  transition-colors duration-75 outline-none
                  ${isCollapsed ? 'justify-center' : ''}
                  ${pathname?.includes('/settings')
                    ? 'text-white bg-neutral-800'
                    : 'text-neutral-500 hover:text-white hover:bg-neutral-800/50'
                  }
                `}
                whileHover={shouldReduceMotion ? {} : { x: isCollapsed ? 0 : 2 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                transition={springTransition}
              >
                <SettingsIcon />

                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      className="text-[13px]"
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={contentTransition}
                    >
                      Settings
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.a>
            </Tooltip>
          </motion.div>
        </div>

        {/* Bottom - User Portrait Card (YC-style rectangular card) */}
        <div className="px-3 py-4 mt-auto">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.a
                href="/profile"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={contentTransition}
                className="
                  block p-3 rounded-xl
                  bg-neutral-900/80 border border-neutral-800
                  hover:bg-neutral-800/80 hover:border-neutral-700
                  transition-all duration-150
                  group
                "
              >
                <div className="flex items-start gap-3">
                  {/* Portrait Avatar - Square with rounded corners */}
                  <div className="relative flex-shrink-0">
                    {userAvatarUrl ? (
                      <img
                        src={userAvatarUrl}
                        alt={userName || 'Profile'}
                        className="w-11 h-11 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-black text-base font-bold">
                        {userName ? userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-white truncate group-hover:text-gold-500 transition-colors">
                      {userName || 'Your Profile'}
                    </p>
                    <p className="text-[12px] text-neutral-500 truncate">
                      {userHandle ? `@${userHandle}` : 'Complete your profile'}
                    </p>
                  </div>
                  {/* Chevron indicator */}
                  <div className="text-neutral-600 group-hover:text-neutral-400 transition-colors mt-0.5">
                    <ChevronRightIcon />
                  </div>
                </div>
              </motion.a>
            ) : (
              <Tooltip label={userName || 'Profile'} show={true}>
                <motion.a
                  href="/profile"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="
                    flex items-center justify-center p-2 rounded-lg
                    hover:bg-neutral-800/50 transition-colors
                  "
                >
                  {userAvatarUrl ? (
                    <img
                      src={userAvatarUrl}
                      alt={userName || 'Profile'}
                      className="w-9 h-9 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-black text-sm font-bold">
                      {userName ? userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </motion.a>
              </Tooltip>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        className="flex-1"
        animate={{ marginLeft: isCollapsed ? 68 : 260 }}
        transition={springTransition}
      >
        {children}
      </motion.main>

      {/* Mobile Bottom Nav - Enhanced with search */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800/50 z-50 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex justify-around items-center h-16 px-2">
          {mobileNavItems.slice(0, 4).map((item) => {
            const Icon = NAV_ICONS[item.id];
            const active = isActive(item.path);
            const isComingSoon = item.comingSoon;

            const baseClassName = `
              relative flex flex-col items-center justify-center gap-1
              flex-1 py-2 min-w-0
              transition-colors duration-100
              ${isComingSoon
                ? 'text-neutral-700 cursor-not-allowed'
                : active ? 'text-white' : 'text-neutral-500'
              }
            `;

            const content = (
              <>
                <div className="relative">
                  {Icon && <Icon />}
                  {/* Active indicator - gold dot */}
                  {active && !isComingSoon && (
                    <motion.span
                      layoutId="mobile-nav-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-500"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>

                {/* Badge indicator */}
                {!isComingSoon && item.badge && item.badge > 0 && (
                  <span className="absolute top-1 right-1/4 w-2 h-2 bg-gold-500 rounded-full border-2 border-neutral-950" />
                )}
              </>
            );

            if (isComingSoon) {
              return (
                <span key={item.id} className={baseClassName} aria-disabled="true">
                  {content}
                </span>
              );
            }

            return (
              <a key={item.id} href={item.path} className={baseClassName} aria-current={active ? 'page' : undefined}>
                {content}
              </a>
            );
          })}

          {/* Search button for mobile - opens command palette */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2 min-w-0 text-neutral-500 hover:text-white transition-colors"
            aria-label="Search (opens command palette)"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[10px] font-medium">Search</span>
          </button>
        </div>
      </nav>

      {/* Notification indicator (accessibility) */}
      {notificationCount > 0 && (
        <div className="sr-only" role="status">
          {notificationCount} unread notifications
        </div>
      )}

      {/* Global Command Palette - ⌘K */}
      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        items={allCommandPaletteItems}
        onSelect={handleCommandPaletteSelect}
        onSearch={onCommandPaletteSearch}
        loading={commandPaletteLoading}
        placeholder="Search spaces, tools, or type a command..."
        emptyMessage="No results found. Try a different search."
      />
    </div>
  );
};

export default UniversalShell;
