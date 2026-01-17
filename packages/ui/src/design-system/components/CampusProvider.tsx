'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Bell, Bookmark, Heart, Users, Settings, Shield, HelpCircle, LogOut, ChevronRight } from 'lucide-react';

// ============================================
// TYPES
// ============================================

type DrawerState = 'closed' | 'open';

interface CampusNavigationState {
  drawerState: DrawerState;
  activeRoute: string;
}

interface CampusNavigationActions {
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setActiveRoute: (route: string) => void;
}

interface CampusContextValue extends CampusNavigationState, CampusNavigationActions {}

interface CampusProviderProps {
  children: React.ReactNode;
  /** Initial route (default: 'home') */
  initialRoute?: string;
  /** User data for drawer header */
  user?: {
    name: string;
    handle: string;
    campus?: string;
    avatarUrl?: string;
  };
  /** Custom menu items (default: standard HIVE menu) */
  menuItems?: MenuItem[];
  /** Callback when menu item is clicked */
  onMenuItemClick?: (item: MenuItem) => void;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  route?: string;
  hasArrow?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

// ============================================
// COLORS (Locked design system values)
// ============================================

const colors = {
  bgGround: '#0A0A09',
  bgSurface: '#141312',
  bgElevated: '#1E1D1B',
  textPrimary: '#FAF9F7',
  textSecondary: '#A3A19E',
  textTertiary: '#6B6B70',
  textMuted: '#3D3D42',
  gold: '#FFD700',
  border: 'rgba(255, 255, 255, 0.08)',
  danger: '#ef4444',
};

// ============================================
// DEFAULT MENU ITEMS
// ============================================

const defaultMenuItems: MenuItem[] = [
  { icon: User, label: 'Profile', route: '/profile', hasArrow: true },
  { icon: Bell, label: 'Notifications', route: '/notifications', hasArrow: true },
  { icon: Bookmark, label: 'Saved', route: '/saved', hasArrow: true },
  { icon: Heart, label: 'Favorites', route: '/favorites', hasArrow: true },
  { icon: Users, label: 'Connections', route: '/connections', hasArrow: true },
  { icon: Settings, label: 'Settings', route: '/settings', hasArrow: true },
  { icon: Shield, label: 'Privacy', route: '/privacy', hasArrow: true },
  { icon: HelpCircle, label: 'Help', route: '/help', hasArrow: true },
  { icon: LogOut, label: 'Sign Out', danger: true },
];

// ============================================
// CONTEXT
// ============================================

const CampusContext = createContext<CampusContextValue | null>(null);

/**
 * Hook to access campus navigation context
 *
 * @example
 * ```tsx
 * const { openDrawer, closeDrawer, drawerState } = useCampusNavigation();
 * ```
 */
export function useCampusNavigation(): CampusContextValue {
  const context = useContext(CampusContext);
  if (!context) {
    throw new Error('useCampusNavigation must be used within a CampusProvider');
  }
  return context;
}

// ============================================
// DRAWER COMPONENT
// ============================================

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user?: CampusProviderProps['user'];
  menuItems: MenuItem[];
  onMenuItemClick?: (item: MenuItem) => void;
}

const CampusDrawer = ({ isOpen, onClose, user, menuItems, onMenuItemClick }: DrawerProps) => {
  const handleItemClick = (item: MenuItem) => {
    if (item.onClick) {
      item.onClick();
    }
    if (onMenuItemClick) {
      onMenuItemClick(item);
    }
    if (!item.danger) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay - LOCKED: Dark Dim 60% */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 9998,
            }}
          />

          {/* Drawer Panel - LOCKED: Left Side, 75% width */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '75%',
              maxWidth: '320px',
              backgroundColor: colors.bgSurface,
              borderRight: `1px solid ${colors.border}`,
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header - LOCKED: Title + Close X */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 500, color: colors.textPrimary }}>
                Menu
              </span>
              <button
                onClick={onClose}
                style={{
                  padding: '8px',
                  backgroundColor: colors.bgElevated,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: colors.textSecondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* User Section - LOCKED: User Header */}
            {user && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: colors.bgElevated,
                    backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.textTertiary,
                    fontSize: '18px',
                    fontWeight: 500,
                  }}
                >
                  {!user.avatarUrl && user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 500, color: colors.textPrimary }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                    @{user.handle}{user.campus ? ` · ${user.campus}` : ''}
                  </div>
                </div>
              </div>
            )}

            {/* Menu Items - LOCKED: Grouped Sections layout */}
            <div style={{ flex: 1, overflow: 'auto', paddingTop: '8px' }}>
              {/* Account Section */}
              <div style={{ padding: '8px 16px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    color: colors.textTertiary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Account
                </span>
              </div>
              {menuItems.filter(i => !i.danger).slice(0, 5).map((item, i) => (
                <MenuItemRow key={i} item={item} onClick={() => handleItemClick(item)} />
              ))}

              {/* Divider */}
              <div style={{ height: '1px', backgroundColor: colors.border, margin: '8px 16px' }} />

              {/* Support Section */}
              <div style={{ padding: '8px 16px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    color: colors.textTertiary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Support
                </span>
              </div>
              {menuItems.filter(i => !i.danger).slice(5).map((item, i) => (
                <MenuItemRow key={i} item={item} onClick={() => handleItemClick(item)} />
              ))}

              {/* Divider */}
              <div style={{ height: '1px', backgroundColor: colors.border, margin: '8px 16px' }} />

              {/* Danger items (Sign Out) */}
              {menuItems.filter(i => i.danger).map((item, i) => (
                <MenuItemRow key={i} item={item} onClick={() => handleItemClick(item)} />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const MenuItemRow = ({ item, onClick }: { item: MenuItem; onClick: () => void }) => {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '12px 16px',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: item.danger ? colors.danger : colors.textPrimary,
        fontSize: '14px',
        textAlign: 'left',
      }}
    >
      <Icon style={{ width: '20px', height: '20px', opacity: 0.7 }} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.hasArrow && <ChevronRight style={{ width: '16px', height: '16px', opacity: 0.4 }} />}
    </button>
  );
};

// ============================================
// PROVIDER COMPONENT
// ============================================

/**
 * CampusProvider - Mobile navigation context provider
 *
 * Manages:
 * - Drawer open/closed state
 * - Active route tracking
 * - Animation coordination
 *
 * LOCKED DECISIONS (Jan 12, 2026):
 * - Direction: Left Side (75% width)
 * - Overlay: Dark Dim 60%
 * - Content: User Header + Grouped Sections
 * - Handle: Title + Close X
 * - Animation: Spring (damping: 25, stiffness: 300)
 *
 * @example
 * ```tsx
 * <CampusProvider
 *   user={{ name: 'Jacob', handle: 'jacob', campus: 'UB Buffalo' }}
 *   onMenuItemClick={(item) => router.push(item.route)}
 * >
 *   <App />
 * </CampusProvider>
 * ```
 */
export function CampusProvider({
  children,
  initialRoute = 'home',
  user,
  menuItems = defaultMenuItems,
  onMenuItemClick,
}: CampusProviderProps) {
  const [drawerState, setDrawerState] = useState<DrawerState>('closed');
  const [activeRoute, setActiveRoute] = useState(initialRoute);

  const openDrawer = useCallback(() => setDrawerState('open'), []);
  const closeDrawer = useCallback(() => setDrawerState('closed'), []);
  const toggleDrawer = useCallback(() => {
    setDrawerState(prev => prev === 'open' ? 'closed' : 'open');
  }, []);

  const value = useMemo<CampusContextValue>(() => ({
    drawerState,
    activeRoute,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    setActiveRoute,
  }), [drawerState, activeRoute, openDrawer, closeDrawer, toggleDrawer]);

  return (
    <CampusContext.Provider value={value}>
      {children}
      <CampusDrawer
        isOpen={drawerState === 'open'}
        onClose={closeDrawer}
        user={user}
        menuItems={menuItems}
        onMenuItemClick={onMenuItemClick}
      />
    </CampusContext.Provider>
  );
}

export default CampusProvider;
