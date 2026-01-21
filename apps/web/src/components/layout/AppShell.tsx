'use client';

/**
 * AppShell — Center Stage Layout
 *
 * ChatGPT-inspired structure:
 * - Collapsible sidebar (64px icon → 240px with labels)
 * - Center content (max-w-4xl)
 * - Gold active route indicator
 * - Smooth transitions matching /about aesthetic
 *
 * Philosophy: Content is the star. Navigation recedes until needed.
 */

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut } from 'lucide-react';
import { Logo } from '@hive/ui/design-system/primitives';
import {
  HomeIcon,
  UsersIcon,
  BeakerIcon,
  UserIcon,
  SettingsIcon,
} from '@hive/ui';
import { useAuth } from '@hive/auth-logic';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  matchPattern?: RegExp;
}

// ============================================================
// Navigation Config
// ============================================================

const NAV_ITEMS: NavItem[] = [
  {
    id: 'feed',
    label: 'Feed',
    href: '/feed',
    icon: HomeIcon,
  },
  {
    id: 'spaces',
    label: 'Spaces',
    href: '/spaces',
    icon: UsersIcon,
    matchPattern: /^\/s(paces)?(\/|$)/,
  },
  {
    id: 'tools',
    label: 'Tools',
    href: '/tools',
    icon: BeakerIcon,
    matchPattern: /^\/tools?(\/|$)/,
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: UserIcon,
    matchPattern: /^\/profile(\/|$)|^\/u\//,
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: SettingsIcon,
  },
];

// Premium easing from /about
const EASE = [0.22, 1, 0.36, 1] as const;

// ============================================================
// Sidebar Component
// ============================================================

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}

function Sidebar({ isExpanded, onToggle, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const isActive = (item: NavItem) => {
    if (item.matchPattern) {
      return item.matchPattern.test(pathname);
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  const handleNavClick = (href: string) => {
    router.push(href);
    onNavigate?.();
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <motion.aside
      className="fixed left-0 top-0 h-screen bg-[#0A0A09] border-r border-white/[0.06] flex flex-col z-50"
      initial={false}
      animate={{
        width: isExpanded ? 240 : 64,
      }}
      transition={{
        duration: 0.2,
        ease: EASE,
      }}
    >
      {/* Logo + Toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.06]">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Logo variant="wordmark" size="sm" color="gold" />
            </motion.div>
          ) : (
            <motion.div
              key="logo-mark"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Logo variant="mark" size="sm" color="gold" />
            </motion.div>
          )}
        </AnimatePresence>

        {isExpanded && (
          <button
            onClick={onToggle}
            className="p-1 rounded-lg hover:bg-white/[0.04] transition-colors"
            aria-label="Collapse sidebar"
          >
            <X size={18} className="text-white/40" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                active
                  ? 'text-white bg-white/[0.04]'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
              )}
            >
              {/* Active indicator */}
              {active && (
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[var(--color-gold)] rounded-r"
                  layoutId="active-indicator"
                  transition={{ duration: 0.2, ease: EASE }}
                />
              )}

              <Icon className="flex-shrink-0" size={20} />

              <AnimatePresence mode="wait">
                {isExpanded && (
                  <motion.span
                    key={`label-${item.id}`}
                    className="text-[14px] font-medium whitespace-nowrap"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="py-4 px-2 space-y-1 border-t border-white/[0.06]">
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                active
                  ? 'text-white bg-white/[0.04]'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
              )}
            >
              {active && (
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[var(--color-gold)] rounded-r"
                  layoutId="active-indicator"
                  transition={{ duration: 0.2, ease: EASE }}
                />
              )}

              <Icon className="flex-shrink-0" size={20} />

              {isExpanded && (
                <motion.span
                  className="text-[14px] font-medium whitespace-nowrap"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          );
        })}

        {/* Sign Out */}
        {user && (
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.02] transition-colors"
          >
            <LogOut size={20} className="flex-shrink-0" />
            {isExpanded && (
              <motion.span
                className="text-[14px] font-medium whitespace-nowrap"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                Sign Out
              </motion.span>
            )}
          </button>
        )}
      </div>

      {/* Expand Button (when collapsed) */}
      {!isExpanded && (
        <button
          onClick={onToggle}
          className="mx-2 mb-4 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
          aria-label="Expand sidebar"
        >
          <Menu size={20} className="text-white/40" />
        </button>
      )}
    </motion.aside>
  );
}

// ============================================================
// Mobile Navigation
// ============================================================

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const isActive = (item: NavItem) => {
    if (item.matchPattern) {
      return item.matchPattern.test(pathname);
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  const handleNavClick = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed left-0 top-0 bottom-0 w-[280px] bg-[#0A0A09] border-r border-white/[0.06] z-50 lg:hidden"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.06]">
                <Logo variant="wordmark" size="sm" color="gold" />
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-white/[0.04] transition-colors"
                >
                  <X size={20} className="text-white/40" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 py-4 px-3 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.href)}
                      className={cn(
                        'relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                        active
                          ? 'text-white bg-white/[0.06]'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                      )}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--color-gold)] rounded-r" />
                      )}
                      <Icon size={20} />
                      <span className="text-[15px] font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Bottom */}
              <div className="py-4 px-3 space-y-1 border-t border-white/[0.06]">
                {BOTTOM_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.href)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.03] transition-colors"
                    >
                      <Icon size={20} />
                      <span className="text-[15px] font-medium">{item.label}</span>
                    </button>
                  );
                })}

                {user && (
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.03] transition-colors"
                  >
                    <LogOut size={20} />
                    <span className="text-[15px] font-medium">Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Main Shell Component
// ============================================================

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Pages that should not use the shell
  const isStandalonePage =
    pathname === '/' ||
    pathname === '/enter' ||
    pathname === '/about' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/legal/');

  if (isStandalonePage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-[#0A0A09] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          isExpanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        />
      </div>

      {/* Mobile Nav */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Content */}
      <main
        className="flex-1 overflow-y-auto"
        style={{
          marginLeft: sidebarExpanded ? '240px' : '64px',
          transition: 'margin-left 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 h-16 px-4 bg-[#0A0A09]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            <Menu size={20} className="text-white/60" />
          </button>
          <Logo variant="mark" size="sm" color="gold" />
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Page Content */}
        <div className="min-h-screen">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: EASE }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
