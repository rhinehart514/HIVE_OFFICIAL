# HIVE Navigation Branding Implementation Guide

**Status**: ✅ Complete
**Date**: November 2025
**Version**: 1.0.0

---

## 🎨 **Overview**

HIVE's navigation system combines **authentic campus branding** with **modern social UX**. The design balances **University at Buffalo identity** (not corporate stiffness) with **clean, focused interactions** (not generic Instagram clone).

---

## 🏆 **Brand Identity**

### **Core Positioning**
```
BeReal's Authenticity + Discord's Community + Campus Culture = HIVE
```

### **Visual Identity**

**Logo**: Hexagon (beehive cell = community)
**Primary Color**: HIVE Gold `#F59E0B` (brand actions, active states)
**Accent Color**: UB Blue `#3B82F6` (campus context, live indicators)
**Typography**: Geist Sans (clean, modern, campus professional)

---

## 🎨 **Brand Colors**

### **Added to `/packages/tokens/src/colors.ts`**

```typescript
// HIVE Brand Colors - Campus identity
hiveGold: '#F59E0B',      // HIVE primary brand (beehive gold)
hiveGoldDark: '#D97706',  // HIVE gold darker
hiveGoldLight: '#FBBF24', // HIVE gold lighter
hiveBlue: '#3B82F6',      // UB Buffalo blue (campus spirit)
hiveBlueDark: '#2563EB',  // UB blue darker
```

### **Semantic Mapping**

```typescript
brand: {
  primary: colors.hiveGold,        // #F59E0B - Primary CTAs
  secondary: colors.hiveGoldLight, // #FBBF24 - Lighter accents
  accent: colors.hiveBlue,         // #3B82F6 - Campus context
}
```

---

## 📦 **Components**

### **1. HiveLogo** (Already Existed)

```typescript
import { HiveLogo } from '@hive/ui'

// Desktop header
<HiveLogo size="default" variant="default" />

// Mobile home button
<HiveLogo size="small" showIcon showText={false} />
```

**Features**:
- Hexagon icon with honeycomb pattern
- Gold gradient (`#F59E0B` → `#D97706`)
- Multiple size variants
- Aurora animated version available

---

### **2. DesktopNav** ✨ NEW

```typescript
import { DesktopNav, NotificationDropdown, ProfileDropdown } from '@hive/ui'

<DesktopNav
  notificationDropdown={<NotificationDropdown />}
  profileDropdown={<ProfileDropdown user={user} onSignOut={handleSignOut} />}
  showCampusIndicator={true}
  campusName="UB Buffalo"
/>
```

**Features**:
- Sticky top bar with backdrop blur
- HIVE logo (left)
- 3 primary nav items (center): Feed, Spaces, Rituals
- Campus indicator with live pulse (right)
- Command palette trigger (⌘K)
- Notifications + Profile dropdowns
- Active state: Gold underline with spring animation

**Layout**:
```
┌────────────────────────────────────────────┐
│ [Logo]  Feed Spaces Rituals  [🔵 UB] [🔍] [🔔] [👤] │
└────────────────────────────────────────────┘
```

---

### **3. MobileNav** ✨ NEW

```typescript
import { MobileNav } from '@hive/ui'

<MobileNav />
```

**Features**:
- Fixed bottom bar with backdrop blur
- 5 items max (cognitive budget enforced)
- Icon + label layout
- Active state: Gold dot indicator
- Center item can be highlighted (Create button)
- Safe area inset support (iOS notch)

**Layout**:
```
┌────────────────────────────────────┐
│ Feed  Spaces  [+]  Rituals  You    │
│  🏠     📊     ✨     🏆     👤    │
└────────────────────────────────────┘
```

---

### **4. NotificationDropdown** ✨ NEW

```typescript
import { NotificationDropdown } from '@hive/ui'

<NotificationDropdown
  notifications={[
    { id: '1', text: 'New ritual starting', time: '2m ago', unread: true }
  ]}
  unreadCount={2}
/>
```

**Features**:
- Bell icon with gold badge for unread count
- Smooth dropdown animation (spring physics)
- Clean notification list
- Gold dot for unread items
- Click-away backdrop

---

### **5. ProfileDropdown** ✨ NEW

```typescript
import { ProfileDropdown } from '@hive/ui'

const user = {
  displayName: 'Alex Chen',
  email: 'alexchen@buffalo.edu',
  major: 'Computer Science',
  gradYear: '2026',
  campus: 'University at Buffalo',
}

<ProfileDropdown user={user} onSignOut={handleSignOut} />
```

**Features**:
- Avatar with gold ring hover
- User info with campus context
- UB blue campus indicator
- Menu items: Profile, Settings, Log out
- Smooth scale animation

---

## 🚀 **Implementation**

### **Step 1: Import Components**

```typescript
// apps/web/src/app/(main)/layout.tsx
import {
  DesktopNav,
  MobileNav,
  NotificationDropdown,
  ProfileDropdown,
} from '@hive/ui'
```

### **Step 2: Create Layout**

```typescript
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()

  return (
    <>
      {/* Desktop Navigation */}
      <DesktopNav
        notificationDropdown={<NotificationDropdown />}
        profileDropdown={<ProfileDropdown user={user} onSignOut={signOut} />}
      />

      {/* Main Content */}
      <main className="min-h-screen pb-16 md:pb-0 md:pt-16">
        {children}
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </>
  )
}
```

### **Step 3: Use Example Component** (Optional)

```typescript
import { HiveNavigationExample } from '@hive/ui'

// Complete navigation example with sample data
export default function Page() {
  return <HiveNavigationExample />
}
```

---

## 🎯 **Design Principles**

### **✅ DO**
- Use **HIVE gold (#F59E0B)** for primary actions, active states
- Use **UB blue (#3B82F6)** for campus context, live indicators
- Show campus affiliation subtly (top right indicator)
- Keep nav items to 3-4 (desktop) / 5 max (mobile)
- Use spring animations for confidence
- Respect `prefers-reduced-motion`

### **❌ DON'T**
- Use rainbow gradients (too Instagram)
- Use neon colors (too Discord)
- Show university seal in nav (too formal)
- Clutter with badges/counters everywhere
- Use tiny icons without labels on mobile
- Exceed cognitive budgets

---

## 📱 **Responsive Behavior**

### **Breakpoints**
```
Mobile:  < 768px  → MobileNav (bottom bar)
Desktop: ≥ 768px  → DesktopNav (top bar)
```

### **Layout Spacing**
```
Desktop Nav Height: 64px (h-16)
Mobile Nav Height: 64px (h-16) + safe-area-inset-bottom

Content Padding:
- Desktop: pt-16 (account for top nav)
- Mobile: pb-16 (account for bottom nav)
```

---

## 🎨 **Animation Details**

### **Active State Transitions**
```typescript
// Desktop: Sliding underline
<motion.div
  layoutId="activeDesktopNav"
  transition={{ type: 'spring', damping: 20, stiffness: 100 }}
/>

// Mobile: Dot indicator
<motion.div
  layoutId="activeMobileNav"
  transition={{ type: 'spring', damping: 20, stiffness: 100 }}
/>
```

### **Dropdown Animations**
```typescript
// Entry/exit
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: 10 }}
```

### **Campus Indicator Pulse**
```typescript
animate={{
  scale: [1, 1.2, 1],
  opacity: [0.7, 1, 0.7],
}}
transition={{ duration: 2, repeat: Infinity }}
```

---

## 📝 **Campus Context Integration**

### **Desktop Campus Indicator**
```typescript
<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20">
  <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
  <span className="text-xs font-medium text-[#3B82F6]">
    UB Buffalo
  </span>
</div>
```

### **Profile Campus Affiliation**
```typescript
<div className="flex items-center gap-1.5">
  <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
  <span className="text-xs text-[var(--hive-text-tertiary)]">
    University at Buffalo
  </span>
</div>
```

---

## 🔧 **Customization**

### **Custom Nav Items (Mobile)**
```typescript
import { MobileNav, type NavItem } from '@hive/ui'

const customNavItems: NavItem[] = [
  { href: '/feed', icon: HomeIcon, label: 'Feed', activeColor: 'text-[#F59E0B]' },
  { href: '/explore', icon: CompassIcon, label: 'Explore', activeColor: 'text-[#F59E0B]' },
  // ... up to 5 items max
]

<MobileNav navItems={customNavItems} />
```

### **Custom Notifications**
```typescript
<NotificationDropdown
  notifications={myNotifications}
  unreadCount={myUnreadCount}
/>
```

---

## ✅ **Testing Checklist**

- [ ] Logo visible and clickable (links to /feed)
- [ ] Active nav state updates correctly on route change
- [ ] Desktop nav shows on ≥768px viewport
- [ ] Mobile nav shows on <768px viewport
- [ ] Campus indicator pulses smoothly
- [ ] Notifications dropdown opens/closes
- [ ] Profile dropdown shows user info + campus
- [ ] Command palette trigger fires ⌘K event
- [ ] Mobile nav respects iOS safe area
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Gold (#F59E0B) used consistently for brand moments
- [ ] UB Blue (#3B82F6) used for campus context

---

## 📦 **Files Modified/Created**

### **Modified**
- `/packages/tokens/src/colors.ts` - Added HIVE brand colors

### **Created**
- `/packages/ui/src/atomic/00-Global/organisms/desktop-nav.tsx`
- `/packages/ui/src/atomic/00-Global/organisms/mobile-nav.tsx`
- `/packages/ui/src/atomic/00-Global/organisms/notification-dropdown-branded.tsx`
- `/packages/ui/src/atomic/00-Global/organisms/profile-dropdown-branded.tsx`
- `/packages/ui/src/atomic/00-Global/organisms/hive-navigation-example.tsx`

### **Updated**
- `/packages/ui/src/index.ts` - Exported new navigation components

---

## 🚀 **Next Steps**

1. **Implement in apps/web**: Use `HiveNavigationLayout` in main layout
2. **Connect to auth**: Pass real user data from `useAuth()`
3. **Wire up notifications**: Connect to Firebase real-time notifications
4. **Add command palette**: Implement ⌘K search functionality
5. **Test on device**: Verify iOS safe area and Android behavior

---

**The Result**: Navigation that feels like **authentic campus coordination** (not generic social media), with **professional university branding** (not corporate stiffness), and **modern social UX** (not outdated campus portal). 🎓✨
