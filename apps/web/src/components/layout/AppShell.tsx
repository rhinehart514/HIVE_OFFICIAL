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

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Menu, Plus, Search } from 'lucide-react';
import { Logo, NoiseOverlay } from '@hive/ui/design-system/primitives';
import { BottomNav } from '@/components/nav/BottomNav';
import { SettingsIcon, LogOutIcon, EASE_PREMIUM, SIDEBAR_WIDTH } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';
import { cn } from '@/lib/utils';
import { useDM } from '@/contexts/dm-context';
import { useDMsEnabled } from '@/hooks/use-feature-flags';
import { useCampusMode } from '@/hooks/use-campus-mode';
import { getNavItems, isNavItemActive, type NavItem } from '@/lib/navigation';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';

// Admin toolbar — dynamic import, SSR disabled. Non-admins never download this code.
const AdminToolbar = dynamic(() => import('@/components/admin/AdminToolbar'), { ssr: false });

// Premium easing from design system
const EASE = EASE_PREMIUM;

interface GlobalSearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'space' | 'tool' | 'person' | 'event' | 'post';
  url: string;
}

const QUICK_CREATE_PRESETS = [
  { id: 'poll', label: 'Poll', prompt: 'Create a poll for this group.' },
  { id: 'rsvp', label: 'RSVP', prompt: 'Create an RSVP form for an upcoming event.' },
  { id: 'countdown', label: 'Countdown', prompt: 'Create a countdown to finals week.' },
  { id: 'signup', label: 'Signups', prompt: 'Create a signup sheet for volunteer shifts.' },
];

// ============================================================
// Sidebar Component
// ============================================================

interface SidebarProps {
  onNavigate?: () => void;
  onQuickCreate?: () => void;
}

function Sidebar({ onNavigate, onQuickCreate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { openPanel, totalUnread } = useDM();
  const { enabled: dmsEnabled, isLoading: dmsLoading } = useDMsEnabled();
  const { hasCampus } = useCampusMode();
  const navItems = getNavItems(hasCampus);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const isActive = (item: NavItem) => isNavItemActive(item, pathname);

  const handleNavClick = (href: string) => {
    router.push(href);
    onNavigate?.();
  };

  const handleSignOut = async () => {
    await logout();
    router.push('/');
  };

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let active = true;
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmedQuery)}&limit=8`,
          { credentials: 'include' }
        );

        if (!response.ok) {
          if (active) setSearchResults([]);
          return;
        }

        const payload = await response.json();
        if (active) {
          setSearchResults(Array.isArray(payload.results) ? payload.results : []);
        }
      } catch {
        if (active) setSearchResults([]);
      } finally {
        if (active) setIsSearching(false);
      }
    }, 220);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

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

      {/* Global search */}
      <div className="px-3 py-3 border-b border-white/[0.06] relative z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            onBlur={() => {
              setTimeout(() => setIsSearchOpen(false), 120);
            }}
            placeholder="Search everything"
            className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] pl-9 pr-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/20"
          />
          {isSearchOpen && searchQuery.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-11 rounded-lg border border-white/[0.08] bg-[var(--bg-ground)] shadow-xl overflow-hidden z-30">
              {isSearching && (
                <div className="px-3 py-2 text-xs text-white/45">Searching…</div>
              )}
              {!isSearching && searchResults.length === 0 && (
                <div className="px-3 py-2 text-xs text-white/45">No results</div>
              )}
              {!isSearching && searchResults.length > 0 && (
                <div className="max-h-72 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        handleNavClick(result.url);
                        setSearchQuery('');
                        setSearchResults([]);
                        setIsSearchOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-white/[0.05]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-white truncate">{result.title}</p>
                        <span className="text-[10px] uppercase tracking-wide text-white/40">
                          {result.type}
                        </span>
                      </div>
                      {result.description && (
                        <p className="text-xs text-white/45 truncate">{result.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation - ChatGPT style: generous spacing, always labeled */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto relative z-10">
        {navItems.map((item) => {
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

      {hasCampus && (
        <div className="p-3 border-t border-white/[0.06] relative z-10">
          <motion.button
            onClick={onQuickCreate}
            className="group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-body font-medium transition-colors duration-200 text-black bg-[var(--color-gold)] hover:bg-[var(--color-gold)]/90"
            whileHover={{ x: 2 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className="w-5 h-5 relative z-10" />
            <span className="relative z-10 tracking-[-0.01em]">Create</span>
          </motion.button>
        </div>
      )}

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

            <MessageSquare className="w-5 h-5 relative z-10" />

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
                <Image src={user.avatarUrl} alt="" width={32} height={32} className="object-cover" sizes="32px" priority />
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
  onQuickCreate?: () => void;
}

function MobileNav({ isOpen, onClose, onQuickCreate }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { openPanel, totalUnread } = useDM();
  const { enabled: dmsEnabled, isLoading: dmsLoading } = useDMsEnabled();
  const { hasCampus } = useCampusMode();
  const navItems = getNavItems(hasCampus);

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
                {navItems.map((item) => {
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

                {hasCampus && onQuickCreate && (
                  <button
                    onClick={() => {
                      onQuickCreate();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-black bg-[var(--color-gold)] hover:bg-[var(--color-gold)]/90 transition-colors"
                  >
                    <Plus size={20} />
                    <span className="text-body font-medium">Create</span>
                  </button>
                )}
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
                    <MessageSquare size={20} />
                    <span className="text-body font-medium">Messages</span>
                    {totalUnread > 0 && (
                      <span className="ml-auto min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-[var(--color-gold)] text-black text-[11px] font-bold rounded-full">
                        {totalUnread > 99 ? '99+' : totalUnread}
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => handleNavClick('/settings')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.03] transition-colors"
                >
                  <SettingsIcon size={20} />
                  <span className="text-body font-medium">Settings</span>
                </button>

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

interface QuickCreateModalProps {
  isOpen: boolean;
  contextLabel?: string;
  onClose: () => void;
  onCreate: (prompt: string) => void;
  onOpenEditor: () => void;
}

function QuickCreateModal({
  isOpen,
  contextLabel,
  onClose,
  onCreate,
  onOpenEditor,
}: QuickCreateModalProps) {
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPrompt('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] flex items-end justify-center lg:items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="relative w-full rounded-t-2xl border border-white/[0.08] bg-[var(--bg-surface)] p-5 lg:max-w-2xl lg:rounded-2xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Create</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-white/55 hover:bg-white/[0.06] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {contextLabel && (
            <p className="mb-3 text-xs text-white/45">
              Context: {contextLabel}
            </p>
          )}

          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={3}
            placeholder="Describe what you want to build..."
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/20"
          />

          <div className="mt-3 grid grid-cols-2 gap-2">
            {QUICK_CREATE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setPrompt(preset.prompt)}
                className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2 text-left text-xs text-white/70 hover:bg-white/[0.05]"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={onOpenEditor}
              className="text-sm text-white/60 hover:text-white"
            >
              Open full editor
            </button>
            <button
              onClick={() => onCreate(prompt.trim())}
              className="rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-black hover:bg-[var(--color-gold)]/90"
            >
              Continue
            </button>
          </div>
        </motion.div>
      </motion.div>
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
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [spaceContextId, setSpaceContextId] = useState<string | null>(null);
  const pathname = usePathname();
  const { hasCampus } = useCampusMode();

  const spaceHandle = useMemo(() => {
    if (!pathname.startsWith('/s/')) return null;
    const segment = pathname.split('/')[2];
    return segment || null;
  }, [pathname]);

  const spaceContextLabel = useMemo(() => {
    if (!spaceHandle) return undefined;
    return spaceHandle.replace(/-/g, ' ');
  }, [spaceHandle]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Resolve space handle -> spaceId for contextual creation.
  useEffect(() => {
    if (!spaceHandle) {
      setSpaceContextId(null);
      return;
    }

    let active = true;
    const resolveSpace = async () => {
      try {
        const response = await fetch(
          `/api/spaces/resolve-slug/${encodeURIComponent(spaceHandle)}`,
          { credentials: 'include' }
        );
        if (!response.ok) {
          if (active) setSpaceContextId(null);
          return;
        }
        const payload = await response.json();
        const resolvedId = payload.data?.spaceId || payload.spaceId || null;
        if (active) setSpaceContextId(resolvedId);
      } catch {
        if (active) setSpaceContextId(null);
      }
    };

    resolveSpace();
    return () => {
      active = false;
    };
  }, [spaceHandle]);

  const handleOpenQuickCreate = () => {
    setQuickCreateOpen(true);
  };

  const handleQuickCreate = (prompt: string) => {
    const params = new URLSearchParams();
    if (prompt) params.set('prompt', prompt);
    if (spaceContextId && spaceContextLabel) {
      params.set('spaceId', spaceContextId);
      params.set('spaceName', spaceContextLabel);
    }

    const query = params.toString();
    router.push(`/lab/new${query ? `?${query}` : ''}`);
    setQuickCreateOpen(false);
  };

  const handleOpenFullEditor = () => {
    const params = new URLSearchParams();
    if (spaceContextId) {
      params.set('spaceId', spaceContextId);
    }

    const query = params.toString();
    router.push(`/lab${query ? `?${query}` : ''}`);
    setQuickCreateOpen(false);
  };

  // Pages that should not use the shell
  const isStandalonePage =
    pathname === '/' ||
    pathname === '/enter' ||
    pathname === '/about' ||
    pathname === '/schools' ||
    pathname.startsWith('/t/') ||
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
    pathname.startsWith('/discover') ||
    pathname.startsWith('/explore') ||
    pathname.startsWith('/lab');

  if (isStandalonePage) {
    return (
      <>
        {children}
        <AdminToolbar />
      </>
    );
  }

  // ChatGPT aesthetic: Fixed 260px rail, generous content padding
  return (
    <div className="flex h-screen bg-[var(--bg-ground)] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar onQuickCreate={handleOpenQuickCreate} />
      </div>

      {/* Mobile drawer (for settings access) */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onQuickCreate={handleOpenQuickCreate}
      />

      {/* Main Content - ChatGPT style: sidebar offset, generous padding */}
      <main
        className="flex-1 overflow-y-auto lg:ml-[260px]"
      >
        <ImpersonationBanner />
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 h-14 px-4 bg-[var(--bg-ground)]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden p-2 text-white/60 hover:text-white transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1 flex justify-center">
            <Logo variant="mark" size="sm" color="gold" />
          </div>
          {/* Spacer to balance the hamburger button */}
          <div className="w-9" />
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
      <BottomNav onOpenCreate={hasCampus ? handleOpenQuickCreate : undefined} />

      {/* Quick Create Modal */}
      <QuickCreateModal
        isOpen={quickCreateOpen}
        contextLabel={spaceContextLabel}
        onClose={() => setQuickCreateOpen(false)}
        onCreate={handleQuickCreate}
        onOpenEditor={handleOpenFullEditor}
      />

      {/* Admin Toolbar — only loaded for admins */}
      <AdminToolbar />
    </div>
  );
}
