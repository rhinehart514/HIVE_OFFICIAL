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
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare } from 'lucide-react';
import { Logo, NoiseOverlay } from '@hive/ui/design-system/primitives';
import { BottomNav } from '@/components/nav/BottomNav';
import { SettingsIcon, LogOutIcon, EASE_PREMIUM, SIDEBAR_WIDTH } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';
import { cn } from '@/lib/utils';
import { useDM } from '@/contexts/dm-context';
import { useDMsEnabled } from '@/hooks/use-feature-flags';
import { NAV_ITEMS, BOTTOM_ITEMS, isNavItemActive, type NavItem } from '@/lib/navigation';


// Premium easing from design system
const EASE = EASE_PREMIUM;

// ============================================================
// Sidebar Component
// ============================================================

interface SidebarProps {
  onNavigate?: () => void;
}

function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { openPanel, totalUnread } = useDM();
  const { enabled: dmsEnabled, isLoading: dmsLoading } = useDMsEnabled();

  const isActive = (item: NavItem) => isNavItemActive(item, pathname);

  const handleNavClick = (href: string) => {
    router.push(href);
    onNavigate?.();
  };

  const handleSignOut = async () => {
    await logout();
    router.push('/');
  };

  // ChatGPT aesthetic: Fixed sidebar, no collapse
  const railWidth = SIDEBAR_WIDTH;

  return (
    <motion.aside
      className="fixed left-0 top-0 h-screen bg-[var(--bg-ground)] border-r border-white/[0.06] flex flex-col z-50 overflow-hidden"
      style={{ width: railWidth }}
    >
      {/* Noise texture for depth */}
      <NoiseOverlay opacity={0.03} />

      {/* Gold edge glow */}
      <motion.div
        className="absolute right-0 top-0 bottom-0 w-[1px] pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, var(--color-gold)/20 50%, transparent 100%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      />
      {/* Header - ChatGPT style: 56px, centered */}
      <div className="h-14 flex items-center px-4 border-b border-white/[0.06] relative z-10">
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2 }}
        >
          {/* Breathing animation */}
          <motion.div
            animate={{ opacity: [1, 0.85, 1] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Logo variant="wordmark" size="sm" color="gold" />
          </motion.div>
        </motion.div>
      </div>

      {/* Main Navigation - ChatGPT style: generous spacing, always labeled */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto relative z-10">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                'group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-body font-medium transition-colors duration-200',
                active ? 'text-white/90' : 'text-white/60 hover:text-white/90'
              )}
              whileHover={{ x: 2 }}
              transition={{ duration: 0.2 }}
            >
              {/* Soft background on hover */}
              <motion.div
                className="absolute inset-0 rounded-xl bg-white/[0.04]"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />

              {/* Active indicator - soft gold line */}
              {active && (
                <motion.div
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-[var(--color-gold)]"
                  layoutId="active-indicator"
                  style={{
                    boxShadow: '0 0 8px 2px rgba(255,215,0,0.3)',
                  }}
                  transition={{ duration: 0.2, ease: EASE }}
                />
              )}

              <Icon className="w-5 h-5 flex-shrink-0 relative z-10" />

              <span className="relative z-10 tracking-[-0.01em]">
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* Utilities Section - DMs */}
      {dmsEnabled && !dmsLoading && user && (
        <div className="p-3 border-t border-white/[0.06] relative z-10">
          <motion.button
            onClick={openPanel}
            className="group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-body font-medium transition-colors duration-200 text-white/60 hover:text-white/90"
            whileHover={{ x: 2 }}
            transition={{ duration: 0.2 }}
          >
            {/* Soft background on hover */}
            <motion.div
              className="absolute inset-0 rounded-xl bg-white/[0.04]"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />

            <div className="relative z-10">
              <MessageSquare className="w-5 h-5" />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-[var(--color-gold)] text-black text-[10px] font-bold rounded-full">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>

            <span className="relative z-10 tracking-[-0.01em]">
              Messages
            </span>

            {totalUnread > 0 && (
              <span className="ml-auto relative z-10 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-[var(--color-gold)] text-black text-[11px] font-bold rounded-full">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </motion.button>
        </div>
      )}

      {/* Profile Footer - ChatGPT style */}
      <div className="p-3 border-t border-white/[0.06] relative z-10">
        {user && (
          <motion.button
            className="group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
            whileHover={{ x: 2 }}
            transition={{ duration: 0.2 }}
            onClick={() => handleNavClick('/me')}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/[0.08] flex-shrink-0 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-body-sm font-semibold text-white/60">
                  {user.displayName?.charAt(0) || user.fullName?.charAt(0) || 'U'}
                </span>
              )}
            </div>

            {/* Name + handle */}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-body-sm font-medium text-white/90 truncate tracking-[-0.01em]">
                {user.displayName || user.fullName || 'User'}
              </p>
              <p className="text-label-sm text-white/40 truncate">
                @{user.handle || 'username'}
              </p>
            </div>

            {/* Settings icon appears on hover */}
            <SettingsIcon className="w-4 h-4 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        )}

        {/* Sign Out */}
        {user && (
          <motion.button
            onClick={handleSignOut}
            className="group relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/60 hover:text-white/90 text-body-sm font-medium mt-1 transition-colors"
            whileHover={{ x: 2 }}
          >
            <motion.div
              className="absolute inset-0 rounded-xl bg-white/[0.02]"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
            />
            <LogOutIcon size={16} className="relative z-10" />
            <span className="relative z-10 tracking-[-0.01em]">Sign Out</span>
          </motion.button>
        )}
      </div>
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
  const { user, logout } = useAuth();
  const { openPanel, totalUnread } = useDM();
  const { enabled: dmsEnabled, isLoading: dmsLoading } = useDMsEnabled();

  const isActive = (item: NavItem) => isNavItemActive(item, pathname);

  const handleNavClick = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleSignOut = async () => {
    await logout();
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
            className="fixed left-0 top-0 bottom-0 w-[280px] bg-[var(--bg-ground)] border-r border-white/[0.06] z-50 lg:hidden"
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

              {/* Primary Navigation */}
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
                      <span className="text-body font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Bottom: DMs + Settings + Sign Out */}
              <div className="py-4 px-3 space-y-1 border-t border-white/[0.06]">
                {/* DMs button */}
                {dmsEnabled && !dmsLoading && user && (
                  <button
                    onClick={() => {
                      openPanel();
                      onClose();
                    }}
                    className="relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="relative">
                      <MessageSquare size={20} />
                      {totalUnread > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-1 flex items-center justify-center bg-[var(--color-gold)] text-black text-[9px] font-bold rounded-full">
                          {totalUnread > 99 ? '99+' : totalUnread}
                        </span>
                      )}
                    </div>
                    <span className="text-body font-medium">Messages</span>
                    {totalUnread > 0 && (
                      <span className="ml-auto min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-[var(--color-gold)] text-black text-[11px] font-bold rounded-full">
                        {totalUnread > 99 ? '99+' : totalUnread}
                      </span>
                    )}
                  </button>
                )}

                {/* Settings */}
                {BOTTOM_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.href)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.03] transition-colors"
                    >
                      <Icon size={20} />
                      <span className="text-body font-medium">{item.label}</span>
                    </button>
                  );
                })}

                {user && (
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.03] transition-colors"
                  >
                    <LogOutIcon size={20} />
                    <span className="text-body font-medium">Sign Out</span>
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
    pathname === '/schools' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/legal/');

  // Pages that need full-width content (escape max-w-3xl constraint)
  const isWideContentPage =
    pathname.startsWith('/home') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/me') ||
    pathname.startsWith('/u/') ||
    pathname.startsWith('/spaces') ||
    pathname.startsWith('/s/') ||
    pathname.startsWith('/explore') ||
    pathname.startsWith('/lab');

  if (isStandalonePage) {
    return <>{children}</>;
  }

  // ChatGPT aesthetic: Fixed 260px rail, generous content padding
  return (
    <div className="flex h-screen bg-[var(--bg-ground)] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer (for settings access) */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Content - ChatGPT style: sidebar offset, generous padding */}
      <main
        className="flex-1 overflow-y-auto lg:ml-[260px]"
      >
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 h-14 px-4 bg-[var(--bg-ground)]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-center">
          <Logo variant="mark" size="sm" color="gold" />
        </div>

        {/* Page Content */}
        <div className="min-h-screen pb-20 lg:pb-0">
          <div className={isWideContentPage ? 'h-full' : 'max-w-3xl mx-auto px-8 py-6'}>
            {/* No animation wrapper - caused opacity:0 bug */}
            <div className={isWideContentPage ? 'h-full' : undefined}>
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  );
}
