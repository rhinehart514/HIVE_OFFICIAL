# HIVE Layout Patterns

Standard layout patterns using HIVE's layout primitives. **Use these components instead of raw Tailwind classes.**

---

## Quick Reference

| Pattern | Component | Use Case |
|---------|-----------|----------|
| Page wrapper | `Container` | Every page |
| Vertical flow | `VStack` | Lists, forms, sections |
| Horizontal row | `HStack` | Buttons, chips, actions |
| Card/box | `Surface` | All elevated content |
| Responsive grid | `Grid` | Card grids |
| Sidebar layout | `Columns` | Main + rail layouts |

---

## Pattern 1: Page Container

Wrap every page with `Container` for consistent max-width and padding.

```tsx
import { Container } from '@hive/ui';

export default function Page() {
  return (
    <Container maxWidth="lg" padding="md">
      {/* Page content */}
    </Container>
  );
}
```

**Props:**
- `maxWidth`: `"xs"` | `"sm"` | `"md"` | `"lg"` | `"xl"` | `"2xl"` | `"full"`
- `padding`: `"none"` | `"xs"` | `"sm"` | `"md"` | `"lg"` | `"xl"`

**When to use:** Every page. Default is `maxWidth="lg"` (960px) for primary content.

---

## Pattern 2: Vertical Stack

Use `VStack` for vertical layouts with consistent spacing.

```tsx
import { VStack, Surface } from '@hive/ui';

function FormSection() {
  return (
    <VStack gap="md">
      <Input label="Name" />
      <Input label="Email" />
      <Button>Submit</Button>
    </VStack>
  );
}
```

**Props:**
- `gap`: `"xs"` | `"sm"` | `"md"` | `"lg"` | `"xl"`
- `align`: `"start"` | `"center"` | `"end"` | `"stretch"`

**When to use:** Form fields, list items, page sections, any vertical flow.

---

## Pattern 3: Horizontal Stack

Use `HStack` for horizontal layouts.

```tsx
import { HStack, Button } from '@hive/ui';

function ActionBar() {
  return (
    <HStack gap="sm" justify="end">
      <Button variant="ghost">Cancel</Button>
      <Button>Save</Button>
    </HStack>
  );
}
```

**Props:**
- `gap`: `"xs"` | `"sm"` | `"md"` | `"lg"` | `"xl"`
- `justify`: `"start"` | `"center"` | `"end"` | `"between"`
- `align`: `"start"` | `"center"` | `"end"` | `"stretch"`

**When to use:** Button groups, icon rows, inline actions, chip clusters.

---

## Pattern 4: Surface (Cards/Boxes)

Use `Surface` for all elevated content instead of inline Tailwind.

```tsx
import { Surface, VStack } from '@hive/ui';

function Card({ title, children }) {
  return (
    <Surface tone="default" padding="md" elevation="sm">
      <VStack gap="sm">
        <h3>{title}</h3>
        {children}
      </VStack>
    </Surface>
  );
}
```

**Props:**
- `tone`: `"default"` | `"subtle"` | `"contrast"` | `"inverted"` | `"glass"`
- `elevation`: `"flat"` | `"sm"` | `"md"` | `"lg"`
- `padding`: `"xs"` | `"sm"` | `"md"` | `"lg"` | `"xl"`
- `radius`: `"md"` | `"lg"` | `"full"`
- `interactive`: boolean (adds hover state)

**When to use:** All cards, modals, dropdowns, any boxed content.

**Anti-pattern:**
```tsx
// Don't do this
<div className="bg-white/10 border border-white/20 rounded-lg p-4">

// Do this
<Surface tone="default" padding="md">
```

---

## Pattern 5: Responsive Grid

Use `Grid` for card grids with responsive columns.

```tsx
import { Grid, Container } from '@hive/ui';

function SpaceDirectory({ spaces }) {
  return (
    <Container maxWidth="lg" padding="md">
      <Grid columns={3} gap="md">
        {spaces.map(space => (
          <SpaceCard key={space.id} space={space} />
        ))}
      </Grid>
    </Container>
  );
}
```

**Props:**
- `columns`: `1` | `2` | `3` | `4` | `6` | `12` | `"auto"`
- `gap`: `"xs"` | `"sm"` | `"md"` | `"lg"` | `"xl"`
- `flow`: `"row"` | `"col"` | `"dense"`

**Responsive behavior:** Grid automatically adjusts columns at breakpoints:
- `columns={3}` → 1 col mobile, 2 col tablet, 3 col desktop

**When to use:** Space grids, member lists, gallery views.

---

## Pattern 6: Sidebar Layout

Use `Columns` for main content + rail layouts.

```tsx
import { Columns, Container } from '@hive/ui';

function SpaceBoardPage() {
  return (
    <Container maxWidth="xl" padding="md">
      <Columns layout="sidebarRight" gap="lg">
        <main>
          {/* Primary stream content */}
          <FeedList />
        </main>
        <aside>
          {/* Right rail widgets */}
          <MembersWidget />
          <EventsWidget />
        </aside>
      </Columns>
    </Container>
  );
}
```

**Props:**
- `layout`: `"split"` | `"two"` | `"three"` | `"sidebarLeft"` | `"sidebarRight"`
- `gap`: `"xs"` | `"sm"` | `"md"` | `"lg"` | `"xl"`
- `equalHeight`: boolean

**Layouts:**
- `"split"` → 50/50
- `"two"` → equal columns
- `"three"` → 3 equal columns
- `"sidebarLeft"` → 280px / flex
- `"sidebarRight"` → flex / 320px

**When to use:** Space board, admin dashboards, settings pages.

---

## Combined Example: Full Page

```tsx
import { Container, VStack, HStack, Grid, Surface } from '@hive/ui';

export default function SpacesPage({ spaces }) {
  return (
    <Container maxWidth="lg" padding="md">
      <VStack gap="lg">
        {/* Header */}
        <HStack justify="between" align="center">
          <h1>Spaces</h1>
          <Button>Create Space</Button>
        </HStack>

        {/* Filters */}
        <HStack gap="sm">
          <Badge>All</Badge>
          <Badge>Academic</Badge>
          <Badge>Social</Badge>
        </HStack>

        {/* Grid */}
        <Grid columns={3} gap="md">
          {spaces.map(space => (
            <Surface key={space.id} tone="default" padding="md" interactive>
              <VStack gap="sm">
                <h3>{space.name}</h3>
                <p>{space.memberCount} members</p>
              </VStack>
            </Surface>
          ))}
        </Grid>
      </VStack>
    </Container>
  );
}
```

---

## Migration Guide

### Before (Raw Tailwind)

```tsx
<div className="px-4 sm:px-6 lg:px-8 mx-auto max-w-[960px]">
  <div className="flex flex-col gap-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      <div className="bg-white/10 border border-white/20 rounded-lg p-4">
```

### After (Layout Components)

```tsx
<Container maxWidth="lg" padding="md">
  <VStack gap="lg">
    <Grid columns={3} gap="md">
      <Surface tone="default" padding="md">
```

---

## Cognitive Budgets

Remember to enforce cognitive budgets when using layouts:

```tsx
import { useEnforceBudget } from '@hive/hooks';

function SpaceRail({ widgets }) {
  // Max 3 rail widgets per cognitive budget
  const visibleWidgets = useEnforceBudget('spaceBoard', 'maxRailWidgets', widgets);

  return (
    <VStack gap="md">
      {visibleWidgets.map(widget => (
        <Surface key={widget.id} padding="sm">
          {widget.content}
        </Surface>
      ))}
    </VStack>
  );
}
```

---

## Component Locations

All layout primitives are in `@hive/ui`:

```
packages/ui/src/layout/
├── container.tsx
├── stack.tsx (Stack, VStack, HStack)
├── grid.tsx
├── columns.tsx
├── surface.tsx
├── cluster.tsx
├── spacer.tsx
└── index.ts
```

Import from package:
```tsx
import { Container, VStack, HStack, Grid, Surface, Columns } from '@hive/ui';
```
