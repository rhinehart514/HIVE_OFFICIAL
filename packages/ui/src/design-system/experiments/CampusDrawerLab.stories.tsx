import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Settings, User, Bell, Shield, HelpCircle, LogOut,
  ChevronRight, Moon, Globe, Bookmark, Heart, Users,
  GripHorizontal
} from 'lucide-react';

// Hardcoded colors for Storybook
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
  borderLight: 'rgba(255, 255, 255, 0.12)',
};

const meta: Meta = {
  title: 'Experiments/CampusDrawer Lab',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * COMPONENT: CampusDrawer
 * STATUS: IN LAB — Awaiting selection
 *
 * Mobile slide-out drawer for settings, account, overflow navigation.
 *
 * Variables to test:
 * 1. Slide Direction - Where drawer comes from
 * 2. Overlay Style - How background is treated
 * 3. Content Layout - How menu items are organized
 * 4. Header Style - Top section treatment
 */

// ============================================
// PHONE FRAME WITH DRAWER TRIGGER
// ============================================
const PhoneWithDrawer = ({
  children,
  label,
  drawer,
  isOpen,
  onToggle,
}: {
  children?: React.ReactNode;
  label: string;
  drawer: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
    <span style={{ color: colors.textTertiary, fontSize: '12px', fontWeight: 500 }}>{label}</span>
    <div
      style={{
        position: 'relative',
        width: '280px',
        height: '500px',
        backgroundColor: colors.bgGround,
        borderRadius: '36px',
        border: `3px solid ${colors.border}`,
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100px',
          height: '24px',
          backgroundColor: 'black',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
          zIndex: 50,
        }}
      />

      {/* Screen content with trigger */}
      <div
        style={{
          position: 'absolute',
          top: '36px',
          left: '12px',
          right: '12px',
          bottom: '12px',
          borderRadius: '16px',
          backgroundColor: 'rgba(255,255,255,0.03)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <span style={{ color: colors.textMuted, fontSize: '12px' }}>Tap to open drawer</span>
        <button
          onClick={onToggle}
          style={{
            padding: '12px 24px',
            backgroundColor: colors.bgElevated,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            color: colors.textPrimary,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          {isOpen ? 'Close' : 'Open'} Drawer
        </button>
      </div>

      {/* Drawer layer */}
      {drawer}
    </div>
  </div>
);

// ============================================
// MENU ITEMS
// ============================================
const menuItems = [
  { icon: User, label: 'Profile', hasArrow: true },
  { icon: Bell, label: 'Notifications', hasArrow: true },
  { icon: Bookmark, label: 'Saved', hasArrow: true },
  { icon: Heart, label: 'Favorites', hasArrow: true },
  { icon: Users, label: 'Connections', hasArrow: true },
  { icon: Settings, label: 'Settings', hasArrow: true },
  { icon: Shield, label: 'Privacy', hasArrow: true },
  { icon: HelpCircle, label: 'Help', hasArrow: true },
  { icon: LogOut, label: 'Sign Out', danger: true },
];

const MenuItem = ({ icon: Icon, label, hasArrow, danger }: any) => (
  <button
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
      padding: '12px 16px',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: danger ? '#ef4444' : colors.textPrimary,
      fontSize: '14px',
      textAlign: 'left',
    }}
  >
    <Icon style={{ width: '20px', height: '20px', opacity: 0.7 }} />
    <span style={{ flex: 1 }}>{label}</span>
    {hasArrow && <ChevronRight style={{ width: '16px', height: '16px', opacity: 0.4 }} />}
  </button>
);

// ============================================
// VARIABLE 1: Slide Direction
// ============================================
export const Variable1_SlideDirection: Story = {
  render: function Render() {
    const [openDrawer, setOpenDrawer] = useState<string | null>(null);

    // A: Left Side Drawer
    const LeftDrawer = ({ isOpen }: { isOpen: boolean }) => (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                zIndex: 40,
              }}
              onClick={() => setOpenDrawer(null)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '75%',
                backgroundColor: colors.bgSurface,
                borderRight: `1px solid ${colors.border}`,
                zIndex: 45,
                paddingTop: '48px',
              }}
            >
              {menuItems.map((item, i) => <MenuItem key={i} {...item} />)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );

    // B: Right Side Drawer
    const RightDrawer = ({ isOpen }: { isOpen: boolean }) => (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                zIndex: 40,
              }}
              onClick={() => setOpenDrawer(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '75%',
                backgroundColor: colors.bgSurface,
                borderLeft: `1px solid ${colors.border}`,
                zIndex: 45,
                paddingTop: '48px',
              }}
            >
              {menuItems.map((item, i) => <MenuItem key={i} {...item} />)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );

    // C: Bottom Sheet
    const BottomSheet = ({ isOpen }: { isOpen: boolean }) => (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                zIndex: 40,
              }}
              onClick={() => setOpenDrawer(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                maxHeight: '70%',
                backgroundColor: colors.bgSurface,
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                zIndex: 45,
                paddingTop: '8px',
                overflow: 'auto',
              }}
            >
              {/* Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
                <div style={{ width: '36px', height: '4px', backgroundColor: colors.textMuted, borderRadius: '2px' }} />
              </div>
              {menuItems.map((item, i) => <MenuItem key={i} {...item} />)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );

    // D: Bottom Sheet (Partial)
    const PartialSheet = ({ isOpen }: { isOpen: boolean }) => (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                zIndex: 40,
              }}
              onClick={() => setOpenDrawer(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '50%',
                backgroundColor: colors.bgSurface,
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                zIndex: 45,
                paddingTop: '8px',
                overflow: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
                <div style={{ width: '36px', height: '4px', backgroundColor: colors.textMuted, borderRadius: '2px' }} />
              </div>
              {menuItems.slice(0, 5).map((item, i) => <MenuItem key={i} {...item} />)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );

    // E: Modal Center
    const ModalDrawer = ({ isOpen }: { isOpen: boolean }) => (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(4px)',
                zIndex: 40,
              }}
              onClick={() => setOpenDrawer(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '85%',
                maxHeight: '70%',
                backgroundColor: colors.bgSurface,
                borderRadius: '16px',
                border: `1px solid ${colors.border}`,
                zIndex: 45,
                overflow: 'auto',
              }}
            >
              {menuItems.map((item, i) => <MenuItem key={i} {...item} />)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );

    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgGround, padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', color: colors.textPrimary, fontWeight: 500, marginBottom: '8px' }}>
            Variable 1: Slide Direction
          </h2>
          <p style={{ fontSize: '14px', color: colors.textMuted }}>
            Where should the drawer come from?
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center' }}>
          <PhoneWithDrawer
            label="A: Left Side"
            isOpen={openDrawer === 'left'}
            onToggle={() => setOpenDrawer(openDrawer === 'left' ? null : 'left')}
            drawer={<LeftDrawer isOpen={openDrawer === 'left'} />}
          />
          <PhoneWithDrawer
            label="B: Right Side"
            isOpen={openDrawer === 'right'}
            onToggle={() => setOpenDrawer(openDrawer === 'right' ? null : 'right')}
            drawer={<RightDrawer isOpen={openDrawer === 'right'} />}
          />
          <PhoneWithDrawer
            label="C: Bottom Sheet (Full)"
            isOpen={openDrawer === 'bottom'}
            onToggle={() => setOpenDrawer(openDrawer === 'bottom' ? null : 'bottom')}
            drawer={<BottomSheet isOpen={openDrawer === 'bottom'} />}
          />
          <PhoneWithDrawer
            label="D: Bottom Sheet (Partial)"
            isOpen={openDrawer === 'partial'}
            onToggle={() => setOpenDrawer(openDrawer === 'partial' ? null : 'partial')}
            drawer={<PartialSheet isOpen={openDrawer === 'partial'} />}
          />
          <PhoneWithDrawer
            label="E: Center Modal"
            isOpen={openDrawer === 'modal'}
            onToggle={() => setOpenDrawer(openDrawer === 'modal' ? null : 'modal')}
            drawer={<ModalDrawer isOpen={openDrawer === 'modal'} />}
          />
        </div>
      </div>
    );
  },
};

// ============================================
// VARIABLE 2: Overlay Style
// ============================================
export const Variable2_OverlayStyle: Story = {
  render: function Render() {
    const [openDrawer, setOpenDrawer] = useState<string | null>(null);

    const DrawerContent = () => (
      <div style={{ paddingTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
          <div style={{ width: '36px', height: '4px', backgroundColor: colors.textMuted, borderRadius: '2px' }} />
        </div>
        {menuItems.slice(0, 6).map((item, i) => <MenuItem key={i} {...item} />)}
      </div>
    );

    const makeDrawer = (overlayStyle: React.CSSProperties, key: string) => (
      <AnimatePresence>
        {openDrawer === key && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 40,
                ...overlayStyle,
              }}
              onClick={() => setOpenDrawer(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                maxHeight: '60%',
                backgroundColor: colors.bgSurface,
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                zIndex: 45,
              }}
            >
              <DrawerContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );

    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgGround, padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', color: colors.textPrimary, fontWeight: 500, marginBottom: '8px' }}>
            Variable 2: Overlay Style
          </h2>
          <p style={{ fontSize: '14px', color: colors.textMuted }}>
            How should the background be treated when drawer is open?
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center' }}>
          <PhoneWithDrawer
            label="A: Dark Dim (60%)"
            isOpen={openDrawer === 'dim'}
            onToggle={() => setOpenDrawer(openDrawer === 'dim' ? null : 'dim')}
            drawer={makeDrawer({ backgroundColor: 'rgba(0,0,0,0.6)' }, 'dim')}
          />
          <PhoneWithDrawer
            label="B: Heavy Blur"
            isOpen={openDrawer === 'blur'}
            onToggle={() => setOpenDrawer(openDrawer === 'blur' ? null : 'blur')}
            drawer={makeDrawer({ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' }, 'blur')}
          />
          <PhoneWithDrawer
            label="C: Light Dim (40%)"
            isOpen={openDrawer === 'light'}
            onToggle={() => setOpenDrawer(openDrawer === 'light' ? null : 'light')}
            drawer={makeDrawer({ backgroundColor: 'rgba(0,0,0,0.4)' }, 'light')}
          />
          <PhoneWithDrawer
            label="D: Blur + Dim Combo"
            isOpen={openDrawer === 'combo'}
            onToggle={() => setOpenDrawer(openDrawer === 'combo' ? null : 'combo')}
            drawer={makeDrawer({ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }, 'combo')}
          />
          <PhoneWithDrawer
            label="E: Minimal (20%)"
            isOpen={openDrawer === 'minimal'}
            onToggle={() => setOpenDrawer(openDrawer === 'minimal' ? null : 'minimal')}
            drawer={makeDrawer({ backgroundColor: 'rgba(0,0,0,0.2)' }, 'minimal')}
          />
        </div>
      </div>
    );
  },
};

// ============================================
// VARIABLE 3: Content Layout
// ============================================
export const Variable3_ContentLayout: Story = {
  render: function Render() {
    const [openDrawer, setOpenDrawer] = useState<string | null>(null);

    // A: Flat List
    const FlatList = () => (
      <div style={{ paddingTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
          <div style={{ width: '36px', height: '4px', backgroundColor: colors.textMuted, borderRadius: '2px' }} />
        </div>
        {menuItems.map((item, i) => <MenuItem key={i} {...item} />)}
      </div>
    );

    // B: Grouped Sections
    const GroupedSections = () => (
      <div style={{ paddingTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
          <div style={{ width: '36px', height: '4px', backgroundColor: colors.textMuted, borderRadius: '2px' }} />
        </div>
        <div style={{ padding: '8px 16px' }}>
          <span style={{ fontSize: '11px', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account</span>
        </div>
        {menuItems.slice(0, 5).map((item, i) => <MenuItem key={i} {...item} />)}
        <div style={{ height: '1px', backgroundColor: colors.border, margin: '8px 16px' }} />
        <div style={{ padding: '8px 16px' }}>
          <span style={{ fontSize: '11px', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Support</span>
        </div>
        {menuItems.slice(5).map((item, i) => <MenuItem key={i} {...item} />)}
      </div>
    );

    // C: Cards Style
    const CardsStyle = () => (
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ width: '36px', height: '4px', backgroundColor: colors.textMuted, borderRadius: '2px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {menuItems.slice(0, 6).map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 8px',
                  backgroundColor: colors.bgElevated,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  color: colors.textPrimary,
                }}
              >
                <Icon style={{ width: '24px', height: '24px', opacity: 0.7 }} />
                <span style={{ fontSize: '11px' }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );

    // D: Compact with Icons
    const CompactIcons = () => (
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ width: '36px', height: '4px', backgroundColor: colors.textMuted, borderRadius: '2px' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0' }}>
          {menuItems.slice(0, 5).map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.textSecondary,
                }}
              >
                <Icon style={{ width: '22px', height: '22px' }} />
                <span style={{ fontSize: '10px' }}>{item.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ height: '1px', backgroundColor: colors.border, margin: '12px 0' }} />
        {menuItems.slice(5).map((item, i) => <MenuItem key={i} {...item} />)}
      </div>
    );

    // E: User Header + List
    const UserHeader = () => (
      <div style={{ paddingTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
          <div style={{ width: '36px', height: '4px', backgroundColor: colors.textMuted, borderRadius: '2px' }} />
        </div>
        {/* User Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: colors.bgElevated }} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 500, color: colors.textPrimary }}>Jacob</div>
            <div style={{ fontSize: '13px', color: colors.textSecondary }}>@jacob · UB Buffalo</div>
          </div>
        </div>
        {menuItems.slice(1).map((item, i) => <MenuItem key={i} {...item} />)}
      </div>
    );

    const makeDrawer = (content: React.ReactNode, key: string) => (
      <AnimatePresence>
        {openDrawer === key && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                zIndex: 40,
              }}
              onClick={() => setOpenDrawer(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                maxHeight: '75%',
                backgroundColor: colors.bgSurface,
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                zIndex: 45,
                overflow: 'auto',
              }}
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );

    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgGround, padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', color: colors.textPrimary, fontWeight: 500, marginBottom: '8px' }}>
            Variable 3: Content Layout
          </h2>
          <p style={{ fontSize: '14px', color: colors.textMuted }}>
            How should menu items be organized?
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center' }}>
          <PhoneWithDrawer
            label="A: Flat List"
            isOpen={openDrawer === 'flat'}
            onToggle={() => setOpenDrawer(openDrawer === 'flat' ? null : 'flat')}
            drawer={makeDrawer(<FlatList />, 'flat')}
          />
          <PhoneWithDrawer
            label="B: Grouped Sections"
            isOpen={openDrawer === 'grouped'}
            onToggle={() => setOpenDrawer(openDrawer === 'grouped' ? null : 'grouped')}
            drawer={makeDrawer(<GroupedSections />, 'grouped')}
          />
          <PhoneWithDrawer
            label="C: Cards Grid"
            isOpen={openDrawer === 'cards'}
            onToggle={() => setOpenDrawer(openDrawer === 'cards' ? null : 'cards')}
            drawer={makeDrawer(<CardsStyle />, 'cards')}
          />
          <PhoneWithDrawer
            label="D: Compact Icons + List"
            isOpen={openDrawer === 'compact'}
            onToggle={() => setOpenDrawer(openDrawer === 'compact' ? null : 'compact')}
            drawer={makeDrawer(<CompactIcons />, 'compact')}
          />
          <PhoneWithDrawer
            label="E: User Header + List"
            isOpen={openDrawer === 'user'}
            onToggle={() => setOpenDrawer(openDrawer === 'user' ? null : 'user')}
            drawer={makeDrawer(<UserHeader />, 'user')}
          />
        </div>
      </div>
    );
  },
};

// ============================================
// VARIABLE 4: Handle & Close Style
// ============================================
export const Variable4_HandleStyle: Story = {
  render: function Render() {
    const [openDrawer, setOpenDrawer] = useState<string | null>(null);

    const MenuContent = () => (
      <>
        {menuItems.slice(0, 5).map((item, i) => <MenuItem key={i} {...item} />)}
      </>
    );

    // Different handle styles
    const handles = {
      pill: (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
          <div style={{ width: '36px', height: '4px', backgroundColor: colors.textMuted, borderRadius: '2px' }} />
        </div>
      ),
      line: (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
          <div style={{ width: '48px', height: '2px', backgroundColor: colors.textTertiary, borderRadius: '1px' }} />
        </div>
      ),
      close: (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px' }}>
          <button
            onClick={() => setOpenDrawer(null)}
            style={{
              padding: '8px',
              backgroundColor: colors.bgElevated,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: colors.textSecondary,
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      ),
      title: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: `1px solid ${colors.border}` }}>
          <span style={{ fontSize: '16px', fontWeight: 500, color: colors.textPrimary }}>Menu</span>
          <button
            onClick={() => setOpenDrawer(null)}
            style={{
              padding: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: colors.textTertiary,
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
      ),
      none: null,
    };

    const makeDrawer = (handle: React.ReactNode, key: string) => (
      <AnimatePresence>
        {openDrawer === key && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                zIndex: 40,
              }}
              onClick={() => setOpenDrawer(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: colors.bgSurface,
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                zIndex: 45,
              }}
            >
              {handle}
              <MenuContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );

    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgGround, padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', color: colors.textPrimary, fontWeight: 500, marginBottom: '8px' }}>
            Variable 4: Handle & Close Style
          </h2>
          <p style={{ fontSize: '14px', color: colors.textMuted }}>
            How should users know they can close the drawer?
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center' }}>
          <PhoneWithDrawer
            label="A: Pill Handle"
            isOpen={openDrawer === 'pill'}
            onToggle={() => setOpenDrawer(openDrawer === 'pill' ? null : 'pill')}
            drawer={makeDrawer(handles.pill, 'pill')}
          />
          <PhoneWithDrawer
            label="B: Thin Line"
            isOpen={openDrawer === 'line'}
            onToggle={() => setOpenDrawer(openDrawer === 'line' ? null : 'line')}
            drawer={makeDrawer(handles.line, 'line')}
          />
          <PhoneWithDrawer
            label="C: Close Button"
            isOpen={openDrawer === 'close'}
            onToggle={() => setOpenDrawer(openDrawer === 'close' ? null : 'close')}
            drawer={makeDrawer(handles.close, 'close')}
          />
          <PhoneWithDrawer
            label="D: Title + Close"
            isOpen={openDrawer === 'title'}
            onToggle={() => setOpenDrawer(openDrawer === 'title' ? null : 'title')}
            drawer={makeDrawer(handles.title, 'title')}
          />
          <PhoneWithDrawer
            label="E: No Handle (Tap Out)"
            isOpen={openDrawer === 'none'}
            onToggle={() => setOpenDrawer(openDrawer === 'none' ? null : 'none')}
            drawer={makeDrawer(handles.none, 'none')}
          />
        </div>
      </div>
    );
  },
};
