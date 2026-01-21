# Frontend Migration Guide

**Purpose:** Practical guide for migrating HIVE frontend to infrastructure-grade patterns.

**Audience:** Developers working on HIVE, including future team members and contributors.

**Status:** Living document (updated as patterns evolve)

---

## Table of Contents

1. [Overview](#overview)
2. [Data Fetching: useHiveQuery](#data-fetching-usehivequery)
3. [Design System Compliance](#design-system-compliance)
4. [State Management: Required States](#state-management-required-states)
5. [Component Extraction](#component-extraction)
6. [Accessibility](#accessibility)
7. [Migration Checklist](#migration-checklist)

---

## Overview

### The Goal

Transform from "sophisticated prototype" to "infrastructure at scale":
- **ONE data pattern** (useHiveQuery)
- **Design system enforced** (tokens, not hardcoded values)
- **All states handled** (loading, error, empty, success, refreshing)
- **100% accessible** (WCAG 2.1 AA)

### The Process

**Phase-by-phase migration:**
1. Start with high-traffic pages (Feed, Spaces, Browse)
2. Migrate one page/component at a time
3. Use feature flags if needed
4. Never half-migrate (complete each unit fully)

**Quality gates enforce standards:**
- ESLint blocks hardcoded values
- CI blocks on accessibility violations
- Bundle size budgets enforced
- Lighthouse scores >90

---

## Data Fetching: useHiveQuery

### The Problem

**Current chaos (3 competing patterns):**
```tsx
// Pattern 1: fetch + useState (35% of files)
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => {
  fetch('/api/spaces').then(r => r.json()).then(setData);
}, []);

// Pattern 2: React Query direct (15% of files)
const { data, isLoading } = useQuery(['spaces'], fetchSpaces);

// Pattern 3: Custom hooks (10% of files)
const { spaces, loading } = useSpaces();
```

**Problems:**
- Inconsistent caching strategies
- Duplicated loading/error logic
- No real-time standardization
- Harder to maintain

### The Solution: useHiveQuery

**ONE standard pattern (500 lines, production-ready):**
- TanStack Query-inspired API (familiar to new devs)
- Firebase real-time integration
- Offline support (localStorage cache)
- Pagination built-in
- Campus isolation (automatic campusId filtering)

### Migration Steps

#### Step 1: Import useHiveQuery

```tsx
import { useHiveQuery } from '@hive/hooks';
```

#### Step 2: Replace Old Pattern

**Before (fetch + useState):**
```tsx
function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/spaces?campusId=${campusId}`)
      .then(r => r.json())
      .then(data => {
        setSpaces(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [campusId]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  return <SpacesList spaces={spaces} />;
}
```

**After (useHiveQuery):**
```tsx
function SpacesPage() {
  const { campusId } = useCampus();

  const { data: spaces, initial, error, refetch } = useHiveQuery({
    queryKey: ['spaces', { campusId }],
    queryFn: () => getSpaces(campusId),
    enableRealtime: true,
    staleTime: 30000, // 30s
  });

  if (initial) return <SpacesLoadingSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!spaces?.length) return <NoSpaces onCreate={() => router.push('/spaces/create')} />;

  return <SpacesList spaces={spaces} />;
}
```

#### Step 3: Real-time Updates (Optional)

```tsx
const { data: messages, initial, error } = useHiveQuery({
  queryKey: ['messages', { spaceId }],
  queryFn: () => getMessages(spaceId),

  // Real-time subscription
  enableRealtime: true,
  realtimeFn: (onUpdate) => {
    const unsubscribe = onSnapshot(
      collection(db, 'messages'),
      (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        onUpdate(messages);
      }
    );
    return unsubscribe;
  },
});
```

#### Step 4: Pagination

```tsx
const { data: posts, initial, error, loadMore, hasMore } = useHiveQuery({
  queryKey: ['feed', { spaceId }],
  queryFn: async () => {
    // Your API should return { items: [], hasMore: boolean, cursor?: string }
    const response = await getFeed({ spaceId, limit: 20 });
    return response;
  },
});

// In render:
<FeedList posts={data?.items || []} />
{hasMore && <Button onClick={() => loadMore()}>Load More</Button>}
```

### useHiveQuery API Reference

```tsx
const {
  data,           // T | null - The fetched data
  initial,        // boolean - True on first load (no cache)
  refreshing,     // boolean - True when manually refetching
  loadingMore,    // boolean - True when paginating
  revalidating,   // boolean - True when background revalidate
  error,          // HiveError | null - Error object
  isStale,        // boolean - Data older than staleTime
  isRealtime,     // boolean - Real-time subscription active
  hasMore,        // boolean - More pages available
  refetch,        // () => Promise<void> - Manual refetch
  loadMore,       // (cursor?) => Promise<void> - Load next page
  invalidate,     // () => void - Clear cache and refetch
} = useHiveQuery({
  queryKey,           // QueryKey - Cache key ['resource', { id }]
  queryFn,            // () => Promise<T> - Fetch function
  realtimeFn,         // (onUpdate) => () => void - Real-time sub
  enableRealtime,     // boolean - Enable real-time (default: false)
  staleTime,          // number - Fresh duration ms (default: 30000)
  cacheTime,          // number - Cache retention ms (default: 300000)
  enableOfflineCache, // boolean - localStorage cache (default: true)
  refetchOnMount,     // boolean - Refetch on mount (default: true)
  refetchOnFocus,     // boolean - Refetch on window focus (default: true)
  refetchOnReconnect, // boolean - Refetch on reconnect (default: true)
  onSuccess,          // (data) => void - Success callback
  onError,            // (error) => void - Error callback
});
```

---

## Design System Compliance

### The Problem

**1,209 violations across 486 files:**
- Hardcoded Tailwind spacing: `py-24`, `px-8`, `gap-12` (1,110 instances)
- Hardcoded hex colors: `#0A0A0A`, `#FFFFFF` (99 instances)

**Why this matters:**
- Design updates require touching 1,209 lines
- No single source of truth
- Inconsistent spacing/colors across app
- Can't theme or rebrand easily

### The Solution: Design System Tokens

**Import tokens, not hardcoded values:**
```tsx
import { SPACING, MONOCHROME, GOLD, MOTION } from '@hive/tokens';
import { Card, Text, Heading, Button } from '@hive/ui/primitives';
```

### Migration Steps

#### Step 1: Replace Hardcoded Spacing

**Before:**
```tsx
<div className="py-24 px-8 gap-12 mt-16">
  <h1 className="mb-6">Title</h1>
  <p className="space-y-4">Content</p>
</div>
```

**After:**
```tsx
import { SPACING } from '@hive/tokens';

<div style={{
  paddingTop: SPACING.xl,
  paddingLeft: SPACING.lg,
  gap: SPACING.md,
  marginTop: SPACING.xl,
}}>
  <h1 style={{ marginBottom: SPACING.md }}>Title</h1>
  <p style={{ gap: SPACING.sm }}>Content</p>
</div>
```

**Available spacing:**
```tsx
SPACING = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '3rem',   // 48px
  '4xl': '4rem',   // 64px
}
```

#### Step 2: Replace Hardcoded Colors

**Before:**
```tsx
<div style={{ color: '#0A0A0A', background: '#FFFFFF', border: '1px solid #E5E5E5' }}>
  <span style={{ color: '#FFD700' }}>Gold text</span>
</div>
```

**After:**
```tsx
import { MONOCHROME, GOLD } from '@hive/tokens';

<div style={{
  color: MONOCHROME.black,
  background: MONOCHROME.white,
  borderColor: MONOCHROME['border-subtle'],
}}>
  <span style={{ color: GOLD.base }}>Gold text</span>
</div>
```

**Available colors:**
```tsx
MONOCHROME = {
  black: '#0A0A0A',
  white: '#FFFFFF',
  'gray-50': '#F9FAFB',
  'gray-100': '#F3F4F6',
  // ... up to gray-900
  'border-subtle': 'rgba(255, 255, 255, 0.1)',
  'border-strong': 'rgba(255, 255, 255, 0.2)',
}

GOLD = {
  base: '#FFD700',
  light: '#FFE55C',
  dark: '#B8860B',
}
```

#### Step 3: Use Primitives Over Custom Components

**Before:**
```tsx
<div className="rounded-lg border border-white/10 bg-black/20 p-6">
  <h2 className="text-xl font-bold mb-4">Card Title</h2>
  <p className="text-gray-400">Card content</p>
  <button className="mt-4 px-4 py-2 bg-gold rounded">
    Action
  </button>
</div>
```

**After:**
```tsx
import { Card, Heading, Text, Button } from '@hive/ui/primitives';

<Card variant="elevated" padding="lg">
  <Heading level={2} size="xl">Card Title</Heading>
  <Text color="subtle">Card content</Text>
  <Button variant="primary" size="md">Action</Button>
</Card>
```

---

## State Management: Required States

### The Problem

**Missing states create bad UX:**
- 16% of pages missing loading.tsx (blank screen during load)
- 12% of pages missing error.tsx (crashes bubble up)
- ~70% missing empty states (confusing blank screens)

### The Solution: 5 Required States

**Every data-driven component MUST handle:**

| State | File | Component | User Experience |
|-------|------|-----------|----------------|
| **Initial** | `loading.tsx` | `<FeedLoadingSkeleton />` | Skeleton UI |
| **Error** | `error.tsx` | `<ErrorState onRetry />` | Error + retry |
| **Empty** | `page.tsx` | `<NoItems onAction />` | Empty + CTA |
| **Success** | `page.tsx` | Actual content | The thing |
| **Refreshing** | `page.tsx` | Subtle spinner | Background update |

### Migration Steps

#### Step 1: Add loading.tsx

```tsx
// app/spaces/loading.tsx
export default function SpacesLoading() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <SpaceCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

#### Step 2: Add error.tsx

```tsx
// app/spaces/error.tsx
'use client';

import { ErrorState } from '@hive/ui/primitives';

export default function SpacesError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Failed to load spaces"
      message={error.message}
      onRetry={reset}
    />
  );
}
```

#### Step 3: Handle Empty State in page.tsx

```tsx
// app/spaces/page.tsx
export default function SpacesPage() {
  const { data: spaces, initial, error, refetch } = useHiveQuery({...});

  if (initial) return <SpacesLoadingSkeleton />; // or rely on loading.tsx
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  // EMPTY STATE (often forgotten!)
  if (!spaces?.length) {
    return (
      <NoItems
        icon={<SpaceIcon />}
        title="No spaces yet"
        description="Join or create your first space to get started"
        actionLabel="Create Space"
        onAction={() => router.push('/spaces/create')}
      />
    );
  }

  return <SpacesList spaces={spaces} />;
}
```

#### Step 4: Handle Refreshing State

```tsx
const { data, initial, refreshing, refetch } = useHiveQuery({...});

return (
  <div>
    {refreshing && (
      <div className="fixed top-4 right-4">
        <Spinner size="sm" />
      </div>
    )}
    <Content data={data} />
  </div>
);
```

---

## Component Extraction

### When to Extract to Design System

**Criteria (ALL must be true):**
- Used in 3+ routes/contexts
- Implements LOCKED pattern (from DESIGN_PRINCIPLES.md)
- Has clear variants (size, state, atmosphere)
- No business logic (pure presentation)

**Examples that qualify:**
- `FadeInSection` (scroll animation, used across marketing)
- `MessageList` (chat messages, used in Spaces + DMs)
- `BoardsSidebar` (navigation pattern, reusable)

**Examples that DON'T qualify:**
- `SpaceThreshold` (space-specific business logic)
- `OnboardingProgress` (onboarding-specific, still evolving)

### When to Keep Page-Specific

**Keep in `/app/[route]/components/` if:**
- Used in 1-2 routes only
- Contains business logic
- Tightly coupled to route structure
- Still evolving (not LOCKED yet)

### Extraction Process

#### Step 1: Identify Candidate

```bash
# Find components used in multiple places
grep -r "ComponentName" apps/web/src/app --include="*.tsx" | wc -l
```

#### Step 2: Extract to Design System

```tsx
// packages/ui/src/design-system/primitives/FadeInSection.tsx
'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { MOTION } from '@hive/tokens';

interface FadeInSectionProps {
  children: React.ReactNode;
  delay?: number;
}

export function FadeInSection({ children, delay = 0 }: FadeInSectionProps) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // Respect prefers-reduced-motion
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: reducedMotion ? 0 : MOTION.duration.normal,
        delay: reducedMotion ? 0 : delay,
        ease: MOTION.ease.out,
      }}
    >
      {children}
    </motion.div>
  );
}
```

#### Step 3: Export from Primitives

```tsx
// packages/ui/src/design-system/primitives/index.ts
export { FadeInSection } from './FadeInSection';
```

#### Step 4: Document in Storybook (Optional)

```tsx
// packages/ui/src/design-system/primitives/FadeInSection.stories.tsx
export default {
  title: 'Primitives/FadeInSection',
  component: FadeInSection,
};

export const Default = () => (
  <FadeInSection>
    <Card>Content fades in on scroll</Card>
  </FadeInSection>
);
```

---

## Accessibility

### The Standard: WCAG 2.1 AA

**Target: 100% compliance**
- Level A: Basic accessibility
- Level AA: Recommended standard (includes A + AA)

### Key Requirements

#### 1. Keyboard Navigation

**All interactive elements must be keyboard accessible:**
```tsx
// ✅ Good: Button is keyboard accessible
<button onClick={handleClick}>Click me</button>

// ❌ Bad: Div click handler not keyboard accessible
<div onClick={handleClick}>Click me</div>

// ✅ Good: Div with proper semantics
<div role="button" tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown}>
  Click me
</div>
```

#### 2. Focus Indicators

**Focused elements must have visible indicators:**
```tsx
// ✅ Good: Focus ring defined
<button className="focus:ring-2 focus:ring-gold">
  Button
</button>

// ❌ Bad: Focus outline removed
<button className="focus:outline-none">
  Button
</button>
```

#### 3. Color Contrast

**Text must meet contrast ratios:**
- Normal text: 4.5:1
- Large text (18pt+): 3:1

```tsx
// ✅ Good: High contrast
<Text color={MONOCHROME.black} background={MONOCHROME.white}>
  Readable text
</Text>

// ❌ Bad: Low contrast
<Text color="#888" background="#999">
  Hard to read
</Text>
```

#### 4. Alt Text

**Images must have alt text:**
```tsx
// ✅ Good: Descriptive alt
<img src="/logo.png" alt="HIVE logo - Student autonomy platform" />

// ❌ Bad: Missing or generic alt
<img src="/logo.png" alt="image" />
```

#### 5. Semantic HTML

**Use proper HTML elements:**
```tsx
// ✅ Good: Semantic structure
<main>
  <h1>Page Title</h1>
  <nav>...</nav>
  <section>...</section>
</main>

// ❌ Bad: Divs for everything
<div>
  <div>Page Title</div>
  <div>...</div>
</div>
```

#### 6. Reduced Motion

**Respect user preferences:**
```tsx
// ✅ Good: Respect prefers-reduced-motion
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  animate={{ opacity: 1, y: reducedMotion ? 0 : 20 }}
  transition={{ duration: reducedMotion ? 0 : 0.3 }}
>
  Content
</motion.div>

// ❌ Bad: Always animate
<motion.div animate={{ opacity: 1, y: 20 }} transition={{ duration: 0.3 }}>
  Content
</motion.div>
```

### Testing Accessibility

```bash
# Run axe-core tests
pnpm --filter=@hive/web test:e2e --project=accessibility

# Manual testing
- Tab through page (keyboard navigation)
- Use screen reader (VoiceOver on Mac, NVDA on Windows)
- Check focus indicators
- Test with reduced motion enabled
```

---

## Migration Checklist

### Per-Page Checklist

Use this for each page you migrate:

```markdown
## [Page Name] Migration

- [ ] **Data Fetching**
  - [ ] Migrated to useHiveQuery
  - [ ] Real-time enabled (if needed)
  - [ ] Pagination implemented (if needed)
  - [ ] Error handling complete

- [ ] **Required States**
  - [ ] loading.tsx exists and uses design system
  - [ ] error.tsx exists with retry button
  - [ ] Empty state handled in page.tsx
  - [ ] Refreshing state has visual feedback

- [ ] **Design System**
  - [ ] No hardcoded spacing (use SPACING tokens)
  - [ ] No hardcoded colors (use color tokens)
  - [ ] Using primitives over custom components
  - [ ] ESLint passes with no violations

- [ ] **Accessibility**
  - [ ] Keyboard navigable (tab through page)
  - [ ] Focus indicators visible
  - [ ] Alt text on images
  - [ ] Semantic HTML (h1, nav, main, etc.)
  - [ ] Reduced motion respected
  - [ ] axe-core tests pass

- [ ] **Performance**
  - [ ] Bundle size impact checked (<50KB for route)
  - [ ] Lighthouse score >90
  - [ ] No unnecessary re-renders

- [ ] **Documentation**
  - [ ] Comments on complex logic
  - [ ] PropTypes/TypeScript types complete
  - [ ] README updated (if needed)
```

### Project-Wide Checklist

Track overall migration progress:

```markdown
## GTM Surface Migration Status

### Phase 1: Entry (Weeks 1-2)
- [ ] Landing page (/)
- [ ] Auth flow (/enter)
- [ ] Onboarding steps

### Phase 2: Feed (Weeks 3-4)
- [ ] Feed page (/feed)
- [ ] Activity cards
- [ ] Real-time updates

### Phase 3: Spaces (Weeks 5-7)
- [ ] Browse spaces (/spaces)
- [ ] Space detail (/s/[handle])
- [ ] Space components

### Phase 4: Browse (Weeks 8-9)
- [ ] Tools (/tools)
- [ ] Templates
- [ ] Search/filters

### Phase 5: HiveLab (Weeks 10-12)
- [ ] Tool IDE
- [ ] Canvas components
- [ ] Preview system
```

---

## Resources

- **Design System Tokens:** `packages/tokens/src/`
- **useHiveQuery Hook:** `packages/hooks/src/use-hive-query.ts`
- **Primitives:** `packages/ui/src/design-system/primitives/`
- **ESLint Plugin:** `packages/eslint-plugin-hive/`
- **Frontend Audit:** `FRONTEND_AUDIT.md`
- **Quality Gates:** `.github/workflows/frontend-quality.yml`

---

## Questions?

- Check `docs/DESIGN_PRINCIPLES.md` for design philosophy
- Check `docs/STRATEGY.md` for product direction
- Ask in #engineering channel
- Tag @frontend-leads for review

---

**Status:** ✅ Active
**Last Updated:** 2026-01-21
**Maintainer:** HIVE Core Team
