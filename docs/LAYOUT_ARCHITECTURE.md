# HIVE Layout Architecture

> **Decision**: Design pages directly. No shell abstractions. No layout primitives.

---

## The Goal

**HIVE should feel like Linear meets Discord.** Tech platform energy — dense, keyboard-friendly, expansive. Not a narrow blog. Not a cramped mobile-first web app.

Students using a **power tool**, not a consumer app.

---

## The Fix

### Shell Responsibility

The shell provides:
- TopBar (48px)
- Sidebar (240px expanded / 64px collapsed)
- Mobile bottom nav (72px)

**The shell does NOT provide content padding.** Pages own their own layout.

### Page Responsibility

Each page chooses its own layout using standard Tailwind. No abstractions.

---

## Layout Patterns

### Full Bleed
Content fills entire available space. Page handles everything.

```tsx
// Use for: Chat, IDE, entry flow
export default function SpaceChatPage() {
  return (
    <div className="h-full w-full">
      <ChatView />
    </div>
  );
}
```

### Full Width
Content uses full width with consistent padding.

```tsx
// Use for: Browse, discovery, dashboards
export default function CampusPage() {
  return (
    <div className="w-full px-6 py-6">
      <SpaceGrid />
    </div>
  );
}
```

### Comfortable
Centered with readable max-width for medium-density content.

```tsx
// Use for: Profiles, medium content
export default function ProfilePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <ProfileContent />
    </div>
  );
}
```

### Centered Form
Narrow centered layout for focused tasks.

```tsx
// Use for: Settings, forms, wizards
export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <SettingsForm />
    </div>
  );
}
```

### Split
Two columns — main content + panel.

```tsx
// Use for: Tool preview, detail views with sidebars
export default function ToolDetailPage() {
  return (
    <div className="flex h-full">
      <div className="flex-1 min-w-0">
        <ToolPreview />
      </div>
      <aside className="w-[320px] border-l border-white/10">
        <ToolInfo />
      </aside>
    </div>
  );
}
```

### Dashboard
Grid layout for analytics/metrics.

```tsx
// Use for: Analytics, admin dashboards
export default function AnalyticsPage() {
  return (
    <div className="w-full px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard />
        <MetricCard />
        <MetricCard />
        <MetricCard />
      </div>
    </div>
  );
}
```

---

## Page → Layout Mapping

| Page | Layout | Tailwind |
|------|--------|----------|
| `/enter` | Full bleed | `h-full w-full` |
| `/campus` | Full width | `w-full px-6 py-6` |
| `/spaces/browse` | Full width | `w-full px-6 py-6` |
| `/spaces/[id]` | Full bleed | `h-full w-full` |
| `/spaces/[id]/settings` | Centered form | `max-w-2xl mx-auto px-6 py-8` |
| `/tools` | Full width | `w-full px-6 py-6` |
| `/tools/[id]` | Split | `flex h-full` |
| `/tools/[id]/edit` | Full bleed | `h-full w-full` |
| `/tools/create` | Centered form | `max-w-2xl mx-auto px-6 py-8` |
| `/profile/[id]` | Comfortable | `max-w-5xl mx-auto px-6 py-6` |
| `/profile/edit` | Centered form | `max-w-2xl mx-auto px-6 py-8` |
| `/settings` | Centered form | `max-w-2xl mx-auto px-6 py-8` |
| `/events` | Full width | `w-full px-6 py-6` |
| `/calendar` | Full width | `w-full px-6 py-6` |

---

## Shell Changes Required

### Remove Content Padding

```tsx
// UniversalShell.tsx - CURRENT (broken)
<main style={{ marginLeft: sidebarWidth, paddingTop: 48 }}>
  <div className="px-6 py-6">  {/* ❌ This strangles pages */}
    {children}
  </div>
</main>

// UniversalShell.tsx - FIXED
<main
  className="h-[calc(100vh-48px)]"
  style={{ marginLeft: sidebarWidth, paddingTop: 48 }}
>
  {children}  {/* ✅ Pages own their layout */}
</main>
```

### Add Keyboard Shortcut

```tsx
// Add to shell or global hook
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === '[' && !e.metaKey && !e.ctrlKey) {
      toggleSidebar();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

---

## Sidebar Behavior

| State | Width | Trigger |
|-------|-------|---------|
| Expanded | 240px | Default on desktop ≥1024px |
| Collapsed | 64px | `[` key, or click collapse button |
| Hidden | 0px | Mobile <768px, or `Cmd+\` |

---

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | <768px | Sidebar hidden, bottom nav visible |
| Tablet | 768-1023px | Sidebar collapsed by default |
| Desktop | ≥1024px | Sidebar expanded by default |

---

## Why No Abstractions

We considered building a `ContentArea` primitive with modes. We killed it because:

1. **We're building ONE app** — not a design system for others
2. **We know exactly what pages we have** — just design them
3. **Tailwind is already the abstraction** — no need for another layer
4. **Premature abstraction is waste** — if patterns emerge, extract later

---

## References

- [Linear UI Redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [SaaS UI AppShell](https://saas-ui.dev/docs/components/layout/app-shell)
- [Linear Design Trend](https://blog.logrocket.com/ux-design/linear-design/)
