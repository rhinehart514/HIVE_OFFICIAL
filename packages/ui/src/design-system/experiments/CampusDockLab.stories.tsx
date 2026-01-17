import type { Meta, StoryObj } from '@storybook/react';
import { motion } from 'framer-motion';
import { Home, Users, Calendar, MessageSquare, Plus, Compass, Bell, User } from 'lucide-react';

// Hardcoded colors for Storybook (CSS vars may not load)
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
  title: 'Experiments/CampusDock Lab',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * COMPONENT: CampusDock
 * STATUS: IN LAB — Awaiting selection
 *
 * Mobile bottom navigation dock. iOS-inspired with HIVE identity.
 *
 * Variables to test:
 * 1. Dock Style - Container shape and positioning
 * 2. Background - Glass blur vs solid vs gradient
 * 3. Item Layout - Icon arrangement and count
 * 4. Active Indicator - How selection is shown
 */

// ============================================
// MOCK PHONE FRAME
// ============================================
const PhoneFrame = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div className="flex flex-col items-center gap-3">
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

      {/* Screen content placeholder */}
      <div
        style={{
          position: 'absolute',
          top: '36px',
          left: '12px',
          right: '12px',
          bottom: '90px',
          borderRadius: '16px',
          backgroundColor: 'rgba(255,255,255,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: colors.textMuted, fontSize: '12px' }}>Screen Content</span>
      </div>

      {/* Dock area */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: 0,
          right: 0,
        }}
      >
        {children}
      </div>

      {/* Home indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '4px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100px',
          height: '4px',
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: '2px',
        }}
      />
    </div>
  </div>
);

// ============================================
// VARIABLE 1: Dock Style
// ============================================
export const Variable1_DockStyle: Story = {
  render: () => {
    const DockItem = ({ icon: Icon, active }: { icon: any; active?: boolean }) => (
      <button
        style={{
          padding: '10px',
          borderRadius: '12px',
          transition: 'all 200ms',
          color: active ? colors.gold : colors.textSecondary,
          backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <Icon style={{ width: '22px', height: '22px' }} />
      </button>
    );

    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgGround, padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', color: colors.textPrimary, fontWeight: 500, marginBottom: '8px' }}>
            Variable 1: Dock Style
          </h2>
          <p style={{ fontSize: '14px', color: colors.textMuted }}>
            Which container shape feels right for HIVE mobile?
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center' }}>
          {/* A: Fixed Bar */}
          <PhoneFrame label="A: Fixed Bar">
            <div
              style={{
                width: '100%',
                padding: '8px 16px',
                backgroundColor: colors.bgSurface,
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <DockItem icon={Home} active />
                <DockItem icon={Compass} />
                <DockItem icon={Plus} />
                <DockItem icon={Bell} />
                <DockItem icon={User} />
              </div>
            </div>
          </PhoneFrame>

          {/* B: Floating Pill */}
          <PhoneFrame label="B: Floating Pill">
            <div
              style={{
                margin: '0 12px 12px',
                padding: '8px 20px',
                backgroundColor: colors.bgElevated,
                borderRadius: '9999px',
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '8px' }}>
                <DockItem icon={Home} active />
                <DockItem icon={Compass} />
                <DockItem icon={Plus} />
                <DockItem icon={Bell} />
                <DockItem icon={User} />
              </div>
            </div>
          </PhoneFrame>

          {/* C: Dynamic Island */}
          <PhoneFrame label="C: Dynamic Island">
            <div
              style={{
                margin: '0 auto 12px',
                width: 'fit-content',
                padding: '8px 28px',
                backgroundColor: 'black',
                borderRadius: '28px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '16px' }}>
                <DockItem icon={Home} active />
                <DockItem icon={Compass} />
                <DockItem icon={Plus} />
                <DockItem icon={Bell} />
                <DockItem icon={User} />
              </div>
            </div>
          </PhoneFrame>

          {/* D: Floating Glass */}
          <PhoneFrame label="D: Floating Glass">
            <div
              style={{
                margin: '0 12px 12px',
                padding: '8px 20px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(20, 19, 18, 0.85)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '8px' }}>
                <DockItem icon={Home} active />
                <DockItem icon={Compass} />
                <DockItem icon={Plus} />
                <DockItem icon={Bell} />
                <DockItem icon={User} />
              </div>
            </div>
          </PhoneFrame>

          {/* E: Minimal Rail */}
          <PhoneFrame label="E: Minimal Rail">
            <div
              style={{
                width: '100%',
                padding: '4px 28px',
                backgroundColor: colors.bgGround,
                borderTop: `1px solid rgba(255,255,255,0.04)`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <DockItem icon={Home} active />
                <DockItem icon={Compass} />
                <DockItem icon={Plus} />
                <DockItem icon={Bell} />
                <DockItem icon={User} />
              </div>
            </div>
          </PhoneFrame>
        </div>
      </div>
    );
  },
};

// ============================================
// VARIABLE 2: Background Treatment
// ============================================
export const Variable2_Background: Story = {
  render: () => {
    const DockItem = ({ icon: Icon, active }: { icon: any; active?: boolean }) => (
      <button
        style={{
          padding: '10px',
          borderRadius: '12px',
          color: active ? colors.gold : colors.textSecondary,
          backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <Icon style={{ width: '22px', height: '22px' }} />
      </button>
    );

    const items = (
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '8px' }}>
        <DockItem icon={Home} active />
        <DockItem icon={Compass} />
        <DockItem icon={Plus} />
        <DockItem icon={Bell} />
        <DockItem icon={User} />
      </div>
    );

    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgGround, padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', color: colors.textPrimary, fontWeight: 500, marginBottom: '8px' }}>
            Variable 2: Background Treatment
          </h2>
          <p style={{ fontSize: '14px', color: colors.textMuted }}>
            What surface treatment feels premium?
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center' }}>
          {/* A: Solid Dark */}
          <PhoneFrame label="A: Solid Dark">
            <div
              style={{
                margin: '0 12px 12px',
                padding: '8px 20px',
                backgroundColor: colors.bgElevated,
                borderRadius: '16px',
                border: `1px solid ${colors.border}`,
              }}
            >
              {items}
            </div>
          </PhoneFrame>

          {/* B: Glass Blur */}
          <PhoneFrame label="B: Glass Blur">
            <div
              style={{
                margin: '0 12px 12px',
                padding: '8px 20px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {items}
            </div>
          </PhoneFrame>

          {/* C: Gradient Fade */}
          <PhoneFrame label="C: Gradient Fade">
            <div
              style={{
                margin: '0 12px 12px',
                padding: '8px 20px',
                borderRadius: '16px',
                background: 'linear-gradient(180deg, rgba(20,19,18,0) 0%, rgba(20,19,18,0.95) 100%)',
              }}
            >
              {items}
            </div>
          </PhoneFrame>

          {/* D: Border Emphasis */}
          <PhoneFrame label="D: Border Emphasis">
            <div
              style={{
                margin: '0 12px 12px',
                padding: '8px 20px',
                borderRadius: '16px',
                backgroundColor: 'transparent',
                border: '2px solid rgba(255,255,255,0.2)',
              }}
            >
              {items}
            </div>
          </PhoneFrame>

          {/* E: Warm Tint */}
          <PhoneFrame label="E: Warm Tint">
            <div
              style={{
                margin: '0 12px 12px',
                padding: '8px 20px',
                borderRadius: '16px',
                border: '1px solid rgba(255,215,0,0.2)',
                background: 'rgba(255, 215, 0, 0.04)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {items}
            </div>
          </PhoneFrame>
        </div>
      </div>
    );
  },
};

// ============================================
// VARIABLE 3: Item Layout
// ============================================
export const Variable3_ItemLayout: Story = {
  render: () => {
    const DockItem = ({ icon: Icon, active, label }: { icon: any; active?: boolean; label?: string }) => (
      <button
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          padding: '6px',
          borderRadius: '12px',
          color: active ? colors.gold : colors.textSecondary,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <Icon style={{ width: '22px', height: '22px' }} />
        {label && <span style={{ fontSize: '9px' }}>{label}</span>}
      </button>
    );

    const CenterOrb = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
      const sizes = { sm: 44, md: 52, lg: 60 };
      const offsets = { sm: -12, md: -18, lg: -24 };
      return (
        <button
          style={{
            width: sizes[size],
            height: sizes[size],
            marginTop: offsets[size],
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.gold} 0%, #B8860B 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 20px rgba(255, 215, 0, 0.3)`,
            border: `3px solid ${colors.bgGround}`,
            cursor: 'pointer',
          }}
        >
          <Plus style={{ width: '24px', height: '24px', color: 'black' }} />
        </button>
      );
    };

    const DockWrapper = ({ children }: { children: React.ReactNode }) => (
      <div
        style={{
          margin: '0 12px 12px',
          padding: '8px 16px',
          backgroundColor: colors.bgElevated,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {children}
        </div>
      </div>
    );

    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgGround, padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', color: colors.textPrimary, fontWeight: 500, marginBottom: '8px' }}>
            Variable 3: Item Layout
          </h2>
          <p style={{ fontSize: '14px', color: colors.textMuted }}>
            How should navigation items be arranged?
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center' }}>
          {/* A: 5 Icons */}
          <PhoneFrame label="A: 5 Icons Standard">
            <DockWrapper>
              <DockItem icon={Home} active />
              <DockItem icon={Compass} />
              <DockItem icon={Users} />
              <DockItem icon={Bell} />
              <DockItem icon={User} />
            </DockWrapper>
          </PhoneFrame>

          {/* B: 4 + Center Orb */}
          <PhoneFrame label="B: 4 + Center Orb">
            <DockWrapper>
              <DockItem icon={Home} active />
              <DockItem icon={Compass} />
              <CenterOrb size="md" />
              <DockItem icon={Bell} />
              <DockItem icon={User} />
            </DockWrapper>
          </PhoneFrame>

          {/* C: 3 + Large Orb */}
          <PhoneFrame label="C: 3 + Large Orb">
            <div
              style={{
                margin: '0 12px 12px',
                padding: '8px 24px',
                backgroundColor: colors.bgElevated,
                borderRadius: '16px',
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <DockItem icon={Home} active />
                <CenterOrb size="lg" />
                <DockItem icon={User} />
              </div>
            </div>
          </PhoneFrame>

          {/* D: 4 Icons Even */}
          <PhoneFrame label="D: 4 Icons Even">
            <DockWrapper>
              <DockItem icon={Home} active />
              <DockItem icon={Compass} />
              <DockItem icon={Bell} />
              <DockItem icon={User} />
            </DockWrapper>
          </PhoneFrame>

          {/* E: 5 + Labels */}
          <PhoneFrame label="E: 5 + Labels">
            <div
              style={{
                margin: '0 8px 12px',
                padding: '4px 8px',
                backgroundColor: colors.bgElevated,
                borderRadius: '16px',
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <DockItem icon={Home} active label="Home" />
                <DockItem icon={Compass} label="Explore" />
                <DockItem icon={Users} label="Spaces" />
                <DockItem icon={Bell} label="Alerts" />
                <DockItem icon={User} label="Profile" />
              </div>
            </div>
          </PhoneFrame>
        </div>
      </div>
    );
  },
};

// ============================================
// VARIABLE 4: Active Indicator
// ============================================
export const Variable4_ActiveIndicator: Story = {
  render: () => {
    // A: Gold Icon Only
    const IndicatorA = ({ icon: Icon, active }: { icon: any; active?: boolean }) => (
      <button
        style={{
          padding: '10px',
          color: active ? colors.gold : colors.textSecondary,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <Icon style={{ width: '22px', height: '22px' }} />
      </button>
    );

    // B: Gold + Pill Background
    const IndicatorB = ({ icon: Icon, active }: { icon: any; active?: boolean }) => (
      <button
        style={{
          padding: '10px',
          borderRadius: '12px',
          color: active ? colors.gold : colors.textSecondary,
          backgroundColor: active ? 'rgba(255,215,0,0.12)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <Icon style={{ width: '22px', height: '22px' }} />
      </button>
    );

    // C: Gold + Dot Below
    const IndicatorC = ({ icon: Icon, active }: { icon: any; active?: boolean }) => (
      <button
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          padding: '8px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <Icon style={{ width: '22px', height: '22px', color: active ? colors.gold : colors.textSecondary }} />
        {active && (
          <div
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: colors.gold,
            }}
          />
        )}
      </button>
    );

    // D: Gold + Glow
    const IndicatorD = ({ icon: Icon, active }: { icon: any; active?: boolean }) => (
      <button
        style={{
          padding: '10px',
          borderRadius: '12px',
          color: active ? colors.gold : colors.textSecondary,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          filter: active ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))' : 'none',
        }}
      >
        <Icon style={{ width: '22px', height: '22px' }} />
      </button>
    );

    // E: Scale + Gold
    const IndicatorE = ({ icon: Icon, active }: { icon: any; active?: boolean }) => (
      <button
        style={{
          padding: '10px',
          color: active ? colors.gold : colors.textSecondary,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          transform: active ? 'scale(1.15)' : 'scale(1)',
          transition: 'transform 200ms',
        }}
      >
        <Icon style={{ width: '22px', height: '22px' }} />
      </button>
    );

    const DockWrapper = ({ children }: { children: React.ReactNode }) => (
      <div
        style={{
          margin: '0 12px 12px',
          padding: '8px 16px',
          backgroundColor: colors.bgElevated,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {children}
        </div>
      </div>
    );

    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgGround, padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', color: colors.textPrimary, fontWeight: 500, marginBottom: '8px' }}>
            Variable 4: Active Indicator Style
          </h2>
          <p style={{ fontSize: '14px', color: colors.textMuted }}>
            How should the active item be indicated?
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center' }}>
          {/* A: Gold Icon Only */}
          <PhoneFrame label="A: Gold Icon Only">
            <DockWrapper>
              <IndicatorA icon={Home} active />
              <IndicatorA icon={Compass} />
              <IndicatorA icon={Users} />
              <IndicatorA icon={Bell} />
              <IndicatorA icon={User} />
            </DockWrapper>
          </PhoneFrame>

          {/* B: Gold + Pill */}
          <PhoneFrame label="B: Gold + Pill Bg">
            <DockWrapper>
              <IndicatorB icon={Home} active />
              <IndicatorB icon={Compass} />
              <IndicatorB icon={Users} />
              <IndicatorB icon={Bell} />
              <IndicatorB icon={User} />
            </DockWrapper>
          </PhoneFrame>

          {/* C: Gold + Dot */}
          <PhoneFrame label="C: Gold + Dot Below">
            <DockWrapper>
              <IndicatorC icon={Home} active />
              <IndicatorC icon={Compass} />
              <IndicatorC icon={Users} />
              <IndicatorC icon={Bell} />
              <IndicatorC icon={User} />
            </DockWrapper>
          </PhoneFrame>

          {/* D: Gold + Glow */}
          <PhoneFrame label="D: Gold + Glow">
            <DockWrapper>
              <IndicatorD icon={Home} active />
              <IndicatorD icon={Compass} />
              <IndicatorD icon={Users} />
              <IndicatorD icon={Bell} />
              <IndicatorD icon={User} />
            </DockWrapper>
          </PhoneFrame>

          {/* E: Scale + Gold */}
          <PhoneFrame label="E: Scale + Gold">
            <DockWrapper>
              <IndicatorE icon={Home} active />
              <IndicatorE icon={Compass} />
              <IndicatorE icon={Users} />
              <IndicatorE icon={Bell} />
              <IndicatorE icon={User} />
            </DockWrapper>
          </PhoneFrame>
        </div>
      </div>
    );
  },
};
