# HIVE

## Soul

Web-first platform for students who do things — build, join, organize, belong. YC energy meets campus social: ship real projects, find real people, skip institutional friction. Not a feed to scroll. A place to do.

---

## Constraints

Non-negotiable. Every PR.

| Constraint | Implementation |
|------------|----------------|
| Campus isolation | Every query filters by `campusId`. No cross-campus data leakage. |
| Real identity | Campus email verification required. No anonymous users. |
| Validation at boundaries | Zod schemas on all inputs. Never trust client data. |
| Design tokens only | All visual values from `packages/tokens`. No hardcoded colors/spacing/radii. |
| Real handlers | Every button does real work. No console.log placeholders. |
| No dead ends | Every state shows next action. Empty states have guidance. |

---

## Index

| Need | Location |
|------|----------|
| Design language | `docs/VISUAL_DIRECTION.md` |
| IA rules | `docs/IA_INVARIANTS.md` |
| Architecture | `docs/` |
| Database schema | `docs/DATABASE_SCHEMA.md` |
| Component library | `packages/ui/src` |
| Design tokens | `packages/tokens/src` |
| Visual reference | `/about` page (live) |
| Current priorities | `TODO.md` |

---

## Patterns

**When building UI:**
- Check `packages/ui` for existing components before creating new ones
- Motion: subtle, purposeful, <300ms, use `packages/tokens/src/motion.ts`
- Empty states: always show what to do next, never just "Nothing here"

**When writing API routes:**
- Validate with Zod at the boundary
- Filter by `campusId` from session — never accept from client
- Check existing routes in `apps/web/src/app/api/` for patterns

**When making product decisions:**
- Web-first: desktop is the primary experience, mobile follows
- Builder aesthetic: precision, confidence, speed — even for non-builders using it
- Social with purpose: connections that lead to doing things, not just following
- Cold start test: would this work with zero existing activity?
- 48-hour test: if we ignore this for 48 hours, does anything change for users?

**When adding features:**
- STUBBED → WIRED → COMPLETE → PRODUCTION-READY
- Not done until user accomplishes their goal, not when code merges

---

## Commands

```bash
pnpm dev                      # all servers
pnpm --filter=@hive/web dev   # web only
pnpm build && pnpm typecheck  # run before any merge
```

---

## Stack

- **App:** Next.js 15, App Router, TypeScript
- **Database:** Firebase Firestore
- **Storage:** Firebase Storage
- **Auth:** Firebase Auth + campus email verification
- **Email:** Resend
- **Rate limiting:** Upstash
- **Hosting:** Vercel
