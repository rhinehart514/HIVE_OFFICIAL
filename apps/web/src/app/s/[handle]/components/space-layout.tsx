'use client';

/**
 * SpaceLayout - Split Panel Layout Shell
 *
 * Renders sidebar (desktop) + main content. No header — page.tsx owns the header.
 * This is a flex child inside page.tsx's `flex-1 overflow-hidden` container.
 *
 * - Desktop: 200px sidebar left, fluid content right
 * - Mobile: no sidebar (bottom sheet on demand), full-width content
 *
 * @version 3.0.0 - Fixed nesting, mobile-first (Feb 2026)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPACE_COLORS } from '@hive/tokens';

interface SpaceLayoutProps {
  /** Header content (unused — kept for API compat, page.tsx owns header) */
  header?: React.ReactNode;
  /** Sidebar content */
  sidebar: React.ReactNode;
  /** Main content area */
  children: React.ReactNode;
  /** Input area (fixed bottom) */
  input?: React.ReactNode;
  /** Whether sidebar is collapsed (desktop) */
  sidebarCollapsed?: boolean;
  /** Toggle sidebar collapse */
  onToggleSidebar?: () => void;
  /** Mobile sidebar open state */
  mobileSidebarOpen?: boolean;
  /** Toggle mobile sidebar */
  onToggleMobileSidebar?: () => void;
  /** Additional class names */
  className?: string;
}

export function SpaceLayout({
  sidebar,
  children,
  input,
  sidebarCollapsed = false,
  mobileSidebarOpen = false,
  onToggleMobileSidebar,
  className,
}: SpaceLayoutProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className={cn('flex h-full min-h-0 overflow-hidden', className)}>
      {/* Desktop Sidebar — 200px, hidden on mobile */}
      {!isMobile && !sidebarCollapsed && (
        <aside
          className="w-[200px] flex-shrink-0 overflow-y-auto overflow-x-hidden border-r border-white/[0.06] p-3"
        >
          {sidebar}
        </aside>
      )}

      {/* Main Content + Input */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Scrollable content — children manage their own scroll */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>

        {/* Input area — pinned to bottom */}
        {input && (
          <div
            className="flex-shrink-0 border-t border-white/[0.06]"
            style={{ backgroundColor: SPACE_COLORS.surfaceBase }}
          >
            {input}
          </div>
        )}
      </main>

      {/* Mobile Sidebar — bottom sheet */}
      {isMobile && (
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/60 z-40"
                onClick={onToggleMobileSidebar}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-[#080808] border-t border-white/[0.06] rounded-t-2xl max-h-[75vh] overflow-y-auto"
              >
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-8 h-1 rounded-full bg-white/[0.12]" />
                </div>
                <div className="px-4 pb-8">{sidebar}</div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

SpaceLayout.displayName = 'SpaceLayout';

export default SpaceLayout;
