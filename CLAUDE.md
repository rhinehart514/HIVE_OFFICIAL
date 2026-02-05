# HIVE

Web-first platform for students who do things — build, join, organize, belong. Not a feed to scroll. A place to do.

---

## Decision Filter

Every decision runs through one question:

**Does this help a student find their people, join something real, and come back tomorrow?**

If no → kill it, ignore it, or defer it.

---

## Constraints

Non-negotiable. Every PR.

| Rule | Implementation |
|------|----------------|
| Campus isolation | Every query filters by `campusId` from session. Never accept from client. |
| Real identity | Campus email verification required. No anonymous users. |
| Validation | Zod schemas on all API inputs. Never trust client data. |
| Design tokens | All visual values from `packages/tokens`. No hardcoded colors/spacing/radii. |
| Real handlers | Every button does real work. No console.log placeholders. |
| No dead ends | Every state shows next action. Empty states guide, never "Nothing here". |
| Motion | All transitions use `@hive/tokens/motion`. Subtle, <300ms. |

---

## Patterns

**Adding an API route:**
```
apps/web/src/app/api/[domain]/route.ts
```
- Use `withAuthAndErrors` wrapper
- Validate with Zod: `const body = schema.parse(await req.json())`
- Filter by `campusId` from session
- Return `NextResponse.json({ data })`

**Adding a component:**
```
packages/ui/src/components/[domain]/ComponentName.tsx   # Reusable
apps/web/src/components/[feature]/ComponentName.tsx    # Feature-specific
```
- Check `packages/ui` first — don't duplicate
- Use design tokens for all values
- Add motion with `@hive/tokens` variants

**Adding a hook:**
```
apps/web/src/hooks/use-[name].ts
```

**Adding a page:**
```
apps/web/src/app/[route]/page.tsx
```

**Using feature flags:**
```typescript
import { useFeatureFlags } from '@/hooks/use-feature-flags';
const { dmsEnabled } = useFeatureFlags();
if (!dmsEnabled) return null;
```

---

## File Map

| Need | Location |
|------|----------|
| API routes | `apps/web/src/app/api/` |
| Pages | `apps/web/src/app/` |
| Shared components | `packages/ui/src/` |
| Feature components | `apps/web/src/components/` |
| Hooks | `apps/web/src/hooks/` |
| Design tokens | `packages/tokens/src/` |
| Motion tokens | `packages/tokens/src/motion.ts` |
| Core types | `packages/core/src/` |
| Firebase admin | `packages/firebase/src/admin/` |

---

## Commands

```bash
pnpm dev                      # Start all
pnpm --filter=@hive/web dev   # Web only
pnpm build && pnpm typecheck  # Before merge
```

---

## Stack

Next.js 15 (App Router) · TypeScript · Firebase (Firestore, Auth, Storage) · Vercel

---

## Reference

| Topic | Location |
|-------|----------|
| **Systems** | |
| Identity (Entry, Auth, Profile) | `docs/systems/IDENTITY.md` |
| Spaces (Communities, Chat) | `docs/systems/SPACES.md` |
| Tools (HiveLab, Automations) | `docs/systems/TOOLS.md` |
| Awareness (Home, Notifications) | `docs/systems/AWARENESS.md` |
| Discovery (Explore, Search) | `docs/systems/DISCOVERY.md` |
| **UX Specs** | |
| Identity UX | `docs/systems/IDENTITY_UX.md` |
| Spaces UX | `docs/systems/SPACES_UX.md` |
| Tools UX | `docs/systems/TOOLS_UX.md` |
| Awareness UX | `docs/systems/AWARENESS_UX.md` |
| Discovery UX | `docs/systems/DISCOVERY_UX.md` |
| **Standards** | |
| Quality standards | `docs/QUALITY_STANDARDS.md` |
| Database schema | `docs/DATABASE_SCHEMA.md` |
| IA rules | `docs/IA_INVARIANTS.md` |
| Visual direction | `docs/VISUAL_DIRECTION.md` |
| Design system | `docs/design-system/INDEX.md` |
| Strategic lenses | `docs/STRATEGIC_LENSES.md` |
| Current priorities | `TODO.md` |
