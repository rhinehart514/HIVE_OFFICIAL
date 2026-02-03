"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

/**
 * SHELL TEMPLATE
 *
 * The container for all HIVE pages. Adapts based on:
 * - Mode: rail (48px) | living (240px) | hidden (0px)
 * - Atmosphere: landing | comfortable | workshop
 *
 * From TEMPLATES.md:
 * "Shell wraps everything. It's the frame that holds the painting."
 */

// ============================================
// TYPES
// ============================================

export type ShellMode = "rail" | "living" | "hidden";
export type Atmosphere = "landing" | "comfortable" | "workshop";

export interface ShellContextValue {
  mode: ShellMode;
  setMode: (mode: ShellMode) => void;
  atmosphere: Atmosphere;
  setAtmosphere: (atmosphere: Atmosphere) => void;
  isSidebarExpanded: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

export interface ShellProps {
  children: React.ReactNode;
  mode?: ShellMode;
  atmosphere?: Atmosphere;
  defaultSidebarExpanded?: boolean;
  className?: string;
  // Navigation
  navItems?: ShellNavItem[];
  activeNavId?: string;
  onNavigate?: (id: string, href: string) => void;
  // Space context (for Living mode)
  spaceId?: string;
  spaceActivity?: {
    onlineCount: number;
    recentMessage?: string;
    isTyping?: boolean;
  };
  // User
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  // Callbacks
  onModeChange?: (mode: ShellMode) => void;
}

export interface ShellNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

// ============================================
// CONTEXT
// ============================================

const ShellContext = React.createContext<ShellContextValue | null>(null);

export const useShell = () => {
  const context = React.useContext(ShellContext);
  if (!context) {
    throw new Error("useShell must be used within a ShellProvider");
  }
  return context;
};

// ============================================
// CONSTANTS
// ============================================

const SHELL_CONFIG = {
  rail: { width: 48, showLabels: false, showActivity: false },
  living: { width: 240, showLabels: true, showActivity: true },
  hidden: { width: 0, showLabels: false, showActivity: false },
} as const;

const ATMOSPHERE_CONFIG = {
  landing: {
    gap: 48,
    padding: 64,
    motionDuration: 0.7,
    goldBudget: "ctas-only",
  },
  comfortable: {
    gap: 24,
    padding: 24,
    motionDuration: 0.3,
    goldBudget: "presence-achievements",
  },
  workshop: {
    gap: 12,
    padding: 16,
    motionDuration: 0.15,
    goldBudget: "selection-only",
  },
} as const;

const MOTION = {
  sidebar: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
  },
  content: {
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1] as const,
  },
};

// ============================================
// STORAGE
// ============================================

const STORAGE_KEYS = {
  mode: "hive-shell-mode",
  expanded: "hive-sidebar-expanded",
} as const;

const getStoredMode = (): ShellMode | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEYS.mode);
  if (stored === "rail" || stored === "living" || stored === "hidden") {
    return stored;
  }
  return null;
};

const storeMode = (mode: ShellMode) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.mode, mode);
};

// ============================================
// SHELL PROVIDER
// ============================================

interface ShellProviderProps {
  children: React.ReactNode;
  defaultMode?: ShellMode;
  defaultAtmosphere?: Atmosphere;
}

export const ShellProvider: React.FC<ShellProviderProps> = ({
  children,
  defaultMode = "rail",
  defaultAtmosphere = "comfortable",
}) => {
  const [mode, setModeState] = React.useState<ShellMode>(defaultMode);
  const [atmosphere, setAtmosphere] = React.useState<Atmosphere>(defaultAtmosphere);
  const [isSidebarExpanded, setIsSidebarExpanded] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = React.useState(false);

  // Restore from storage
  React.useEffect(() => {
    const stored = getStoredMode();
    if (stored) setModeState(stored);
  }, []);

  // Detect mobile
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const setMode = React.useCallback((newMode: ShellMode) => {
    setModeState(newMode);
    storeMode(newMode);
  }, []);

  const toggleSidebar = React.useCallback(() => {
    setIsSidebarExpanded((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({
      mode,
      setMode,
      atmosphere,
      setAtmosphere,
      isSidebarExpanded,
      toggleSidebar,
      isMobile,
      isCommandPaletteOpen,
      setCommandPaletteOpen,
    }),
    [mode, setMode, atmosphere, isSidebarExpanded, toggleSidebar, isMobile, isCommandPaletteOpen]
  );

  return (
    <ShellContext.Provider value={value}>
      {children}
    </ShellContext.Provider>
  );
};

// ============================================
// LIFE DOT (Presence Indicator)
// ============================================

interface LifeDotProps {
  size?: "xs" | "sm" | "md" | "lg";
  status?: "active" | "away" | "offline";
  className?: string;
}

export const LifeDot: React.FC<LifeDotProps> = ({
  size = "md",
  status = "active",
  className,
}) => {
  const sizeMap = { xs: "w-1.5 h-1.5", sm: "w-2 h-2", md: "w-2.5 h-2.5", lg: "w-3 h-3" };

  return (
    <motion.span
      className={cn(
        "rounded-full",
        sizeMap[size],
        status === "active" && "bg-life-gold",
        status === "away" && "bg-life-gold/40",
        status === "offline" && "bg-text-muted",
        className
      )}
      animate={status === "active" ? {
        opacity: [0.6, 1, 0.6],
        scale: [1, 1.05, 1],
      } : undefined}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

// ============================================
// SIDEBAR NAV ITEM
// ============================================

interface SidebarNavItemProps {
  item: ShellNavItem;
  isActive: boolean;
  showLabel: boolean;
  onClick: () => void;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  item,
  isActive,
  showLabel,
  onClick,
}) => (
  <motion.button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
      "hover:bg-interactive-hover",
      isActive && "bg-interactive-active"
    )}
    whileTap={{ scale: 0.98 }}
  >
    <span className={cn(
      "flex-shrink-0 w-5 h-5 flex items-center justify-center",
      isActive ? "text-text-primary" : "text-text-secondary"
    )}>
      {item.icon}
    </span>
    {showLabel && (
      <span className={cn(
        "text-sm truncate",
        isActive ? "text-text-primary font-medium" : "text-text-secondary"
      )}>
        {item.label}
      </span>
    )}
    {item.badge && item.badge > 0 && (
      <span className="ml-auto flex-shrink-0 px-1.5 py-0.5 text-xs font-mono bg-life-gold text-void rounded-full">
        {item.badge > 99 ? "99+" : item.badge}
      </span>
    )}
  </motion.button>
);

// ============================================
// SIDEBAR
// ============================================

interface SidebarProps {
  mode: ShellMode;
  navItems: ShellNavItem[];
  activeNavId?: string;
  onNavigate: (id: string, href: string) => void;
  spaceActivity?: ShellProps["spaceActivity"];
  user?: ShellProps["user"];
}

const Sidebar: React.FC<SidebarProps> = ({
  mode,
  navItems,
  activeNavId,
  onNavigate,
  spaceActivity,
  user,
}) => {
  const config = SHELL_CONFIG[mode];

  if (mode === "hidden") return null;

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: config.width, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={MOTION.sidebar}
      className="flex-shrink-0 h-full border-r border-border bg-surface overflow-hidden"
    >
      <div className="h-full flex flex-col p-3">
        {/* Logo */}
        <div className={cn(
          "flex items-center h-10 mb-4",
          config.showLabels ? "px-3 justify-start gap-2" : "justify-center"
        )}>
          <span className="text-lg">⬡</span>
          {config.showLabels && (
            <span className="font-display font-bold text-text-primary">HIVE</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              isActive={activeNavId === item.id}
              showLabel={config.showLabels}
              onClick={() => onNavigate(item.id, item.href)}
            />
          ))}
        </nav>

        {/* Activity Section (Living mode only) */}
        <AnimatePresence>
          {config.showActivity && spaceActivity && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border pt-4 mt-4"
            >
              <div className="text-xs font-mono uppercase tracking-wider text-text-tertiary mb-3 px-3">
                Activity
              </div>

              {/* Online count */}
              <div className="flex items-center gap-2 px-3 mb-2">
                <div className="flex -space-x-2">
                  {[...Array(Math.min(3, spaceActivity.onlineCount))].map((_, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full bg-surface-hover border-2 border-surface"
                    />
                  ))}
                </div>
                <span className="text-sm font-mono text-life-gold">
                  {spaceActivity.onlineCount}
                </span>
                <span className="text-sm text-text-secondary">online</span>
              </div>

              {/* Recent message or typing */}
              {spaceActivity.isTyping ? (
                <div className="flex items-center gap-2 px-3 text-sm text-text-tertiary">
                  <LifeDot size="xs" />
                  <span>typing...</span>
                </div>
              ) : spaceActivity.recentMessage && (
                <div className="px-3 text-sm text-text-tertiary truncate">
                  {spaceActivity.recentMessage}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* User */}
        {user && (
          <div className="mt-auto pt-4 border-t border-border">
            <button className={cn(
              "w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-interactive-hover",
              !config.showLabels && "justify-center"
            )}>
              <div className="w-8 h-8 rounded-full bg-surface-hover overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-secondary text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {config.showLabels && (
                <span className="text-sm text-text-secondary truncate">
                  {user.name}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
};

// ============================================
// MOBILE NAV
// ============================================

interface MobileNavProps {
  navItems: ShellNavItem[];
  activeNavId?: string;
  onNavigate: (id: string, href: string) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({
  navItems,
  activeNavId,
  onNavigate,
}) => (
  <motion.nav
    initial={{ y: 100 }}
    animate={{ y: 0 }}
    className="fixed bottom-0 left-0 right-0 h-14 bg-surface border-t border-border flex items-center justify-around px-4 z-50"
  >
    {navItems.slice(0, 5).map((item) => (
      <button
        key={item.id}
        onClick={() => onNavigate(item.id, item.href)}
        className={cn(
          "flex flex-col items-center justify-center w-12 h-12 rounded-lg",
          activeNavId === item.id ? "text-text-primary" : "text-text-tertiary"
        )}
      >
        <span className="w-5 h-5">{item.icon}</span>
        <span className="text-label-xs mt-0.5">{item.label}</span>
      </button>
    ))}
  </motion.nav>
);

// ============================================
// SHELL (Main Component)
// ============================================

const DEFAULT_NAV_ITEMS: ShellNavItem[] = [
  { id: "feed", label: "Feed", icon: "≡", href: "/feed" },
  { id: "spaces", label: "Spaces", icon: "□", href: "/spaces" },
  { id: "hivelab", label: "HiveLab", icon: "⚙", href: "/lab" },
  { id: "profile", label: "Profile", icon: "👤", href: "/profile" },
];

export const Shell: React.FC<ShellProps> = ({
  children,
  mode = "rail",
  atmosphere = "comfortable",
  className,
  navItems = DEFAULT_NAV_ITEMS,
  activeNavId,
  onNavigate,
  spaceId,
  spaceActivity,
  user,
  onModeChange,
}) => {
  const [isMobile, setIsMobile] = React.useState(false);
  const atmosConfig = ATMOSPHERE_CONFIG[atmosphere];

  // Detect mobile
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Auto-switch to living mode when in a space
  React.useEffect(() => {
    if (spaceId && mode === "rail") {
      onModeChange?.("living");
    }
  }, [spaceId, mode, onModeChange]);

  const handleNavigate = React.useCallback(
    (id: string, href: string) => {
      onNavigate?.(id, href);
    },
    [onNavigate]
  );

  return (
    <div
      className={cn("flex min-h-screen bg-ground", className)}
      style={{
        "--shell-gap": `${atmosConfig.gap}px`,
        "--shell-padding": `${atmosConfig.padding}px`,
        "--shell-motion": `${atmosConfig.motionDuration}s`,
      } as React.CSSProperties}
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <AnimatePresence mode="wait">
          <Sidebar
            key={mode}
            mode={mode}
            navItems={navItems}
            activeNavId={activeNavId}
            onNavigate={handleNavigate}
            spaceActivity={spaceActivity}
            user={user}
          />
        </AnimatePresence>
      )}

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 overflow-auto",
          isMobile && "pb-16" // Space for mobile nav
        )}
        style={{
          padding: mode === "hidden" ? 0 : atmosConfig.padding,
        }}
      >
        <motion.div
          key={atmosphere}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: atmosConfig.motionDuration }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Nav */}
      {isMobile && mode !== "hidden" && (
        <MobileNav
          navItems={navItems}
          activeNavId={activeNavId}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

// ============================================
// EXPORTS
// ============================================

export { SHELL_CONFIG, ATMOSPHERE_CONFIG, MOTION };
export default Shell;
