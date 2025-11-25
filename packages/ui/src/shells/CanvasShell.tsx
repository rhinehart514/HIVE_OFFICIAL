'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CanvasShell - The Canvas Experience
 *
 * Notion/Linear energy - Tools that feel alive
 * For: HiveLab, post creation, space management
 * Feel: Powerful but not overwhelming
 *
 * Layout: [Sidebar] [Main Content] [Inspector]
 */

interface CanvasShellProps {
  children: React.ReactNode;
  /** Left sidebar content (tool palette, navigation) */
  sidebar?: React.ReactNode;
  /** Right inspector panel (properties, details) */
  inspector?: React.ReactNode;
  /** Control inspector visibility */
  inspectorOpen?: boolean;
  /** Header content (title, actions) */
  headerContent?: React.ReactNode;
  /** Show left sidebar */
  showSidebar?: boolean;
  /** Sidebar width */
  sidebarWidth?: 'sm' | 'md' | 'lg';
  /** Inspector width */
  inspectorWidth?: 'sm' | 'md' | 'lg';
  /** Show floating action button */
  showFab?: boolean;
  /** FAB content */
  fabContent?: React.ReactNode;
  /** FAB click handler */
  onFabClick?: () => void;
}

const sidebarWidthClasses = {
  sm: 'w-56',
  md: 'w-64',
  lg: 'w-80',
};

const inspectorWidthClasses = {
  sm: 'w-72',
  md: 'w-80',
  lg: 'w-96',
};

export function CanvasShell({
  children,
  sidebar,
  inspector,
  inspectorOpen = true,
  headerContent,
  showSidebar = true,
  sidebarWidth = 'md',
  inspectorWidth = 'md',
  showFab = false,
  fabContent,
  onFabClick,
}: CanvasShellProps) {
  return (
    <div className="min-h-screen flex bg-[var(--hive-background-primary)]">
      {/* Left Sidebar - tool palette, navigation */}
      {showSidebar && sidebar && (
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`
            hidden md:flex flex-col
            ${sidebarWidthClasses[sidebarWidth]}
            border-r border-[var(--hive-border-default)]
            bg-[var(--hive-background-secondary)]
          `}
        >
          {sidebar}
        </motion.aside>
      )}

      {/* Main canvas area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar - glass */}
        {headerContent && (
          <motion.header
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="
              sticky top-0 z-40
              backdrop-blur-xl
              bg-[var(--hive-background-primary)]/80
              border-b border-[var(--hive-border-default)]/50
              px-4 py-3
            "
          >
            {headerContent}
          </motion.header>
        )}

        {/* Canvas content */}
        <main className="flex-1 relative overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.1,
            }}
            className="h-full"
          >
            {children}
          </motion.div>

          {/* Floating action button */}
          {showFab && fabContent && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
                delay: 0.3,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onFabClick}
              className="
                fixed bottom-6 right-6
                w-14 h-14
                rounded-full
                bg-[var(--hive-brand-primary)]
                text-[var(--hive-text-inverse)]
                shadow-lg shadow-[var(--hive-brand-primary)]/25
                flex items-center justify-center
                z-50
              "
            >
              {fabContent}
            </motion.button>
          )}
        </main>
      </div>

      {/* Right Inspector - properties panel */}
      <AnimatePresence>
        {inspector && inspectorOpen && (
          <motion.aside
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`
              hidden md:flex flex-col
              ${inspectorWidthClasses[inspectorWidth]}
              border-l border-[var(--hive-border-default)]
              bg-[var(--hive-background-secondary)]
            `}
          >
            {inspector}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CanvasShell;
