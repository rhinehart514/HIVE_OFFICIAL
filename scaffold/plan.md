# Design System Components Scaffolding Plan

**Created:** January 10, 2026
**Target:** Fix broken component exports in `packages/ui/src/design-system/components/`

---

## Current State Analysis

### Primitives (COMPLETE - 32 components)
All primitives are working and exported from `primitives/index.ts`:
- Typography: DisplayText, Heading, Text, Mono, Label, Link
- Container: Card, Separator, Icon
- Input: Button, Input, Textarea, Select, Checkbox, Switch, Radio
- Feedback: Modal, Toast, Tooltip, Progress, Skeleton
- Navigation: Tabs, Avatar, AvatarGroup, Badge
- Life: PresenceDot, ActivityEdge, LiveCounter, TypingIndicator
- Workshop: PropertyField, CanvasArea, HandleDot

### Components with Type Errors (NEED FIXING)

Based on `components/index.ts` TODO comments:

| Component | Issue | Priority |
|-----------|-------|----------|
| **SpaceCard** | variant "base"/"md" doesn't exist | P1 |
| **ProfileCard** | variant "base"/"md" doesn't exist | P1 |
| **EventCard** | Type mismatches | P1 |
| **ToolCard** | Type mismatches | P2 |
| **EmptyState** | "base"/"primary" variants missing | P1 |
| **ErrorState** | "primary" variant missing | P1 |
| **PostCard** | "md" avatar size, null variant | P2 |
| **MemberList** | Avatar missing 'src', "base" size | P2 |
| **AttendeeList** | Avatar missing 'src', "base"/"md" sizes | P2 |
| **AvatarGroup** | "md" size, Avatar missing 'src' | P2 |
| **RadioGroup** | orientation interface conflict | P3 |
| **Checkbox** | CheckboxField missing 'label' | P3 |
| **Tabs** | orientation, null to undefined | P3 |
| **Callout** | ref type mismatch | P3 |
| **Accordion** | interface extension, type prop | P3 |
| **AspectRatio** | ratio type (string vs number) | P3 |
| **Separator** | orientation conflict | P3 |
| **ScrollArea** | missing radix package | P3 |
| **Label** | aria-describedby error | P3 |
| **NumberInput** | increment/decrement args | P3 |
| **Slot** | unknown type issue | P3 |

---

## Scaffolding Order

### Phase 1: High-Traffic Cards (P1) ✅ PARTIAL
These are used on browse, discovery, and profile pages.

1. [x] **Fix SpaceCard** - ActivityEdge rounded + Heading level types
2. [x] **Fix EmptyState** - Text size variants + Button interface
3. [x] **Fix ErrorState** - Button variant (primary → default)
4. [ ] **Fix EventCard** - Align with primitive types
5. [ ] **Fix ProfileCard** - Update variant names

### Phase 2: Member/Content Components (P2)
6. [ ] **Fix MemberList** - Update Avatar usage
7. [ ] **Fix AttendeeList** - Update Avatar usage
8. [ ] **Fix PostCard** - Fix avatar size, null handling
9. [ ] **Fix ToolCard** - Align with primitive types
10. [ ] **Fix AvatarGroup component** - Update size variants

### Phase 3: Form Components (P3)
11. [ ] Fix RadioGroup interface
12. [ ] Fix Checkbox field
13. [ ] Fix Tabs orientation
14. [ ] Fix other form components

---

## Fix Strategy

The core issue is **variant name mismatches** between old atomic components and new primitives.

### Primitive Variant Names (Correct)
```tsx
// Button variants
variant: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'cta'
size: 'sm' | 'md' | 'lg' | 'icon'

// Avatar sizes
size: 'xs' | 'sm' | 'default' | 'lg' | 'xl'

// Card variants
variant: 'default' | 'elevated' | 'interactive'
```

### Common Fixes Needed
```tsx
// WRONG
variant="base"  // Doesn't exist
size="md"       // Use 'default' for Avatar

// RIGHT
variant="default"
size="default"
```

---

## Files to Create/Modify

### Phase 1 Files
```
packages/ui/src/design-system/components/
├── SpaceCard.tsx          # Modify - fix variant names
├── EmptyState.tsx         # Modify - fix Button variant
├── ErrorState.tsx         # Modify - fix Button variant
├── EventCard.tsx          # Modify - fix type alignment
├── ProfileCard.tsx        # Modify - fix variant names
```

### Export Updates
```
packages/ui/src/design-system/components/index.ts
# Uncomment working exports after fixes
```

---

## Pattern Reference

Use SpaceCard.tsx as the reference pattern - it's already well-structured:
- Uses ActivityEdge for warmth
- Composes primitives correctly
- Has skeleton variant
- Has hover variant
- Proper TypeScript interfaces

---

## Notes

- All fixes should be **modifications** not new files
- Run `pnpm typecheck` after each fix to verify
- Update `components/index.ts` exports when fixed
- Follow existing SpaceCard pattern for consistency
