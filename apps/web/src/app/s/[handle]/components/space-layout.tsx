'use client';

/**
 * SpaceLayout - Split Panel Layout Shell
 *
 * Linear-style layout: 200px sidebar (left) + fluid main content
 * - 56px header
 * - 64px input area (fixed bottom)
 * - Mobile: sidebar collapses to sheet
 *
 * @version 2.0.0 - Split Panel Rebuild (Jan 2026)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPACE_LAYOUT, SPACE_COLORS, spaceMotionVariants } from '@hive/tokens';

interface SpaceLayoutProps {
  /** Header content */
  header: React.ReactNode;
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
  header,
  sidebar,
  children,
  input,
  sidebarCollapsed = false,
  onToggleSidebar: _onToggleSidebar,
  mobileSidebarOpen = false,
  onToggleMobileSidebar,
  className,
}: SpaceLayoutProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  // Detect mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < SPACE_LAYOUT.mobileBreakpoint);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div
      className={cn(
        'flex flex-col h-screen overflow-hidden',
        'bg-[var(--bg-ground)]',
        className
      )}
      style={{
        '--space-sidebar-width': sidebarCollapsed ? '48px' : `${SPACE_LAYOUT.sidebarWidth}px`,
        '--space-header-height': `${SPACE_LAYOUT.headerHeight}px`,
        '--space-input-height': `${SPACE_LAYOUT.inputHeight}px`,
      } as React.CSSProperties}
    >
      {/* Header - Fixed top */}
      <header
        className="flex-shrink-0 border-b"
        style={{
          height: `${SPACE_LAYOUT.headerHeight}px`,
          borderColor: SPACE_COLORS.borderSubtle,
        }}
      >
        {header}
      </header>

      {/* Main area - Sidebar + Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <AnimatePresence mode="wait">
            <motion.aside
              key={sidebarCollapsed ? 'collapsed' : 'expanded'}
              initial={spaceMotionVariants.sidebarEnter.initial}
              animate={spaceMotionVariants.sidebarEnter.animate}
              exit={spaceMotionVariants.sidebarEnter.exit}
              transition={spaceMotionVariants.sidebarEnter.transition}
              className={cn(
                'flex-shrink-0 h-full overflow-y-auto overflow-x-hidden',
                'border-r',
                sidebarCollapsed ? 'w-12' : 'w-[200px]'
              )}
              style={{
                borderColor: SPACE_COLORS.borderSubtle,
                padding: `${SPACE_LAYOUT.sidebarPadding}px`,
              }}
            >
              {sidebar}
            </motion.aside>
          </AnimatePresence>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </div>

          {/* Input area - Fixed bottom */}
          {input && (
            <div
              className="flex-shrink-0 border-t"
              style={{
                borderColor: SPACE_COLORS.borderSubtle,
                backgroundColor: SPACE_COLORS.surfaceBase,
              }}
            >
              {input}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={onToggleMobileSidebar}
              />

              {/* Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
                className={cn(
                  'fixed bottom-0 left-0 right-0 z-50',
                  'bg-[var(--bg-ground)] border-t rounded-t-2xl',
                  'max-h-[80vh] overflow-y-auto'
                )}
                style={{ borderColor: SPACE_COLORS.borderSubtle }}
              >
                {/* Drag handle */}
                <div className="flex justify-center py-3">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Sidebar content */}
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
