# CODEX-TASK-5: Enforce Space Type Rules & Permission System

## Context
HIVE has two well-built systems that are **defined but almost completely unenforced**:

1. **`apps/web/src/lib/space-type-rules.ts`** — Defines per-space-type rules for membership (join method, max spaces, approval process, special roles), visibility (posts, events, members, discoverability), tools (allowed types, max tools, require approval), and compliance. 5 space types: `student_organizations`, `university_organizations`, `greek_life`, `campus_living`, `hive_exclusive`.

2. **`apps/web/src/lib/permission-system.ts`** — Defines role-based permissions (owner/admin/moderator/member/guest) with space-type modifiers. Has `resolveUserPermissions()`, `hasPermission()`, `canUseToolInSpace()`. Includes tool permission presets. **Zero API routes import this file.**

There's also **`apps/web/src/lib/space-permission-middleware.ts`** which IS used (140+ references) — it does role hierarchy checks via `checkSpacePermission()`. But it doesn't use the higher-level permission system or space type rules.

## Goal
Wire these rule systems into the actual API routes so they're enforced, not decorative.

## Tasks

### Task 1: Create a unified enforcement middleware
Create `apps/web/src/lib/space-rules-middleware.ts` that combines both systems:

1. **Read** `space-type-rules.ts`, `permission-system.ts`, and `space-permission-middleware.ts` thoroughly first
2. Create `enforceSpaceRules()` — a middleware function that:
   - Takes `spaceId`, `userId`, and a required `Permission` (from permission-system.ts)
   - Looks up the space to get its `category` (space type)
   - Looks up the user's membership to get their role
   - Calls `resolveUserPermissions()` with the space type rules
   - Returns `{ allowed: boolean; reason?: string; space; membership; effectivePermissions }`
3. Create `enforceJoinRules()` — checks if a user can join based on space type:
   - Calls `canUserJoinSpace()` from space-type-rules
   - Checks join method (instant/approval/invitation_only/automatic)
   - Returns `{ allowed: boolean; joinMethod; reason? }`
4. Create `enforceToolRules()` — checks if a tool can be deployed/used in a space:
   - Calls `isToolAllowedInSpaceType()` and `canUseToolInSpace()`
   - Checks max tool limit
   - Checks if approval is required
   - Returns `{ allowed: boolean; requiresApproval: boolean; reason? }`
5. Create `enforceVisibilityRules()` — determines what content is visible:
   - Calls `getContentVisibility()` for posts/events/members
   - Returns visibility level so routes can filter accordingly

### Task 2: Wire into join/leave routes
Apply enforcement to these routes:

1. `apps/web/src/app/api/spaces/join-v2/route.ts` (628 lines) — Use `enforceJoinRules()`. Check max spaces limit, join method, approval process per space type.
2. `apps/web/src/app/api/spaces/[spaceId]/join-requests/route.ts` (614 lines) — Respect approval process type (simple vs rush_system vs faculty_approval)
3. `apps/web/src/app/api/spaces/leave/route.ts` (177 lines) — Check `leaveRestriction` (campus_living can only leave on housing change)
4. `apps/web/src/app/api/spaces/claim/route.ts` (349 lines) — Verify claim rules per space type

### Task 3: Wire into content routes
Apply permission checks to content creation/modification:

1. `apps/web/src/app/api/spaces/[spaceId]/posts/route.ts` (294 lines) — Check `posts:create`, `posts:edit_own`/`posts:edit_any`, `posts:delete_own`/`posts:delete_any`
2. `apps/web/src/app/api/spaces/[spaceId]/chat/route.ts` (647 lines) — Check `messages:edit_own`/`messages:edit_any`, `messages:delete_own`/`messages:delete_any`
3. `apps/web/src/app/api/spaces/[spaceId]/events/route.ts` (543 lines) — Check `events:create`, `events:edit_own`/`events:edit_any`, `events:manage`
4. `apps/web/src/app/api/spaces/[spaceId]/chat/[messageId]/route.ts` — Check edit/delete permissions with own vs any distinction

### Task 4: Wire into tool routes
Apply tool rules:

1. `apps/web/src/app/api/spaces/[spaceId]/tools/route.ts` (715 lines) — Use `enforceToolRules()`. Check allowed tool types per space type, max tool limit, approval requirement.
2. `apps/web/src/app/api/tools/deploy/route.ts` — Check tool is allowed in target space type before deploying
3. `apps/web/src/app/api/spaces/[spaceId]/tools/feature/route.ts` — Check `tools:configure` permission

### Task 5: Wire into member management routes
Apply member permissions:

1. `apps/web/src/app/api/spaces/[spaceId]/members/route.ts` (909 lines) — Check `members:invite`, `members:remove`, `members:promote` per action. Respect visibility rules for member list (greek_life restricts member info to outsiders).
2. `apps/web/src/app/api/spaces/[spaceId]/members/[memberId]/route.ts` (216 lines) — Check role-appropriate permissions for member actions
3. `apps/web/src/app/api/spaces/[spaceId]/members/batch/route.ts` (564 lines) — Same permission checks for batch operations

### Task 6: Wire into space settings & admin routes
Apply space-level permissions:

1. `apps/web/src/app/api/spaces/[spaceId]/route.ts` (403 lines) — PATCH needs `space:settings`, DELETE needs `space:delete` (restricted for university_organizations and campus_living)
2. `apps/web/src/app/api/spaces/transfer/route.ts` (530 lines) — Check `space:transfer` (restricted for campus_living)
3. `apps/web/src/app/api/spaces/[spaceId]/analytics/route.ts` (523 lines) — Check `analytics:view`

### Task 7: Wire visibility into discovery/browse routes
Apply visibility rules to public-facing endpoints:

1. `apps/web/src/app/api/spaces/browse-v2/route.ts` (390 lines) — Respect `spaceDiscoverable` flag (greek_life and campus_living are not discoverable)
2. `apps/web/src/app/api/spaces/[spaceId]/feed/route.ts` (466 lines) — Filter content based on visibility rules and viewer's membership status
3. `apps/web/src/app/api/spaces/[spaceId]/preview/route.ts` — Show limited info for spaces with restricted visibility

### Task 8: Clean up deprecated routes
Delete these 6 deprecated routes that return 410 Gone:
- `apps/web/src/app/api/auth/request-signin-code/`
- `apps/web/src/app/api/auth/verify-signin-code/`
- `apps/web/src/app/api/auth/session/`
- `apps/web/src/app/api/tools/execute/`
- `apps/web/src/app/api/profile/handle/[handle]/`
- `apps/web/src/app/api/profile/v2/`

Also delete `apps/web/src/app/api/search/v2/` (19-line stub) and empty dirs: `stats/`, `internal/`.

## Rules
- **Read existing code before writing.** Every route you modify — read the full file first, understand its patterns.
- **Don't break existing functionality.** The enforcement should ADD checks, not replace working logic.
- **Use the existing `checkSpacePermission()` pattern** from `space-permission-middleware.ts` where it's already used — enhance it, don't replace it.
- **TypeScript strict mode.** No `any`.
- **Use firebase-admin** for all Firestore reads.
- **Return proper HTTP status codes**: 403 for permission denied, 400 for rule violations (max spaces, wrong join method), 404 for not found.
- **Include the reason in error responses** so the frontend can show meaningful messages.
- **Commit when done** with message: `feat(spaces): enforce space type rules and permission system across all routes`
- **Push with `LEFTHOOK=0 git push`**

When completely finished, run this command to notify me:
openclaw gateway wake "Done: Space type rules and permission system enforced across all routes, deprecated routes cleaned up" --mode now
