# Feature Spec: Single-User Usability — Spaces + HiveLab

> Make one student able to sign up, create a space, build a tool, deploy it, and use it — in one session.

---

## Current Blockers (from codebase audit)

### P0 — Breaks the Flow

| # | Blocker | Location | Impact |
|---|---------|----------|--------|
| 1 | **7-day account age gate on space creation** | `apps/web/src/app/api/spaces/route.ts:160-168` | New user cannot create a space. The single biggest wall. |
| 2 | **Dashboard prompt creates blank tool, not AI-generated** | `apps/web/src/app/lab/page.tsx` — `handleSubmit` calls `createBlankTool()` | User types "a poll for my frat" and gets empty canvas. Expectation violation. |
| 3 | **"Spaces" nav item is a dead redirect** | `apps/web/src/app/spaces/page.tsx` → `router.replace('/home')` | Second nav pillar does nothing. User sees flash of "Redirecting..." |
| 4 | **Deploy-to-space dead end for new users** | `apps/web/src/app/lab/[toolId]/deploy/page.tsx` | No spaces = "No Deployment Targets" with no create-space shortcut. |
| 5 | **Hardcoded campusId in IDE** | `apps/web/src/app/lab/[toolId]/page.tsx:302` — `campusId: 'ub-buffalo'` | Breaks for any non-UB campus. |

### P1 — Degrades the Experience

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 6 | No notification bell in app shell | `apps/web/src/components/layout/AppShell.tsx` | User has no way to see activity. |
| 7 | Mobile nav drawer has no trigger | Mobile header shows logo only, no hamburger | Settings/sign-out unreachable on mobile (except via /me). |
| 8 | Preview state is ephemeral | IDE Use mode has no `deploymentId` | User can't test a poll end-to-end until they deploy. |
| 9 | No link from Space → HiveLab | `apps/web/src/app/s/[handle]/components/` | Space leader has no "Build a tool" entry point in-context. |
| 10 | DMs, Notifications, Connections all OFF | Feature flags: `enable_dms`, `enable_connections` | Solo user has zero social signals. Space feels dead. |

---

## Spec: What to Build

### Fix 1: Remove 7-Day Gate for Space Creation

**File:** `apps/web/src/app/api/spaces/route.ts`

**Change:** Remove or reduce the 7-day account age check. Replace with email-verified-only check (which already exists on the next line).

**Why:** A new student should be able to create their first space in their first session. The email verification requirement is sufficient fraud prevention. The daily limit of 3 spaces already prevents spam.

**Option:** Instead of removing entirely, reduce to 0 days (immediate) for the first space only, keep 7-day gate for spaces 2+. This limits spam while allowing first-session activation.

**Acceptance:**
- New user with verified email can create a space immediately
- Daily limit of 3 still enforced
- No other creation checks change

---

### Fix 2: Dashboard Prompt → AI Generation

**Files:**
- `apps/web/src/app/lab/page.tsx` — `handleSubmit`
- `apps/web/src/lib/hivelab/create-tool.ts`

**Change:** When user types a prompt and hits enter on the /lab dashboard:
1. Create tool via `POST /api/tools` (as now)
2. Navigate to `/lab/${toolId}?new=true&prompt=${encodedPrompt}`
3. **In the IDE page**, auto-trigger AI generation when `?prompt` is present — call `/api/tools/generate` streaming, populate canvas as elements arrive

The IDE already accepts `initialPrompt` prop. The fix is ensuring `HiveLabIDE` auto-fires generation when `initialPrompt` is non-empty on mount.

**Alternative (simpler):** Call `/api/tools/generate` on the dashboard BEFORE creating the tool, get the elements back, then create the tool WITH elements pre-populated (same as template flow). This avoids the streaming complexity on first load.

**Acceptance:**
- User types "poll for where to eat" → gets a tool with a poll element pre-configured
- Rules-based fallback works without any API keys
- Template chips continue to work as-is

---

### Fix 3: "Spaces" Nav → Browse/My Spaces

**Files:**
- `apps/web/src/app/spaces/page.tsx` — currently just redirects to /home
- `apps/web/src/lib/navigation.ts` — nav item definition

**Change:** Make `/spaces` a real page, not a redirect. Two sections:

1. **My Spaces** (top) — user's joined spaces with quick-switch cards
2. **Discover** (bottom) — recommended spaces, browse by category, search

If the user has 0 spaces, show the discovery section prominently with a "Create a Space" CTA.

**This is the space-equivalent of `/lab` for tools.** It's the hub.

**Alternative (minimal):** Change the nav href from `/spaces` to `/explore` and update the match pattern. `/explore` already works as a discovery page.

**Acceptance:**
- Clicking "Spaces" in nav shows a useful page
- No redirect flash
- User can browse, search, join, or create from this page

---

### Fix 4: Deploy Page → Create Space Shortcut

**Files:**
- `apps/web/src/app/lab/[toolId]/deploy/page.tsx` — empty state
- `apps/web/src/components/hivelab/deploy/` — deploy components

**Change:** In the empty state ("No Deployment Targets"), replace the "Browse Spaces" button with two CTAs:

1. **"Deploy to My Profile"** — always available, deploy to profile page
2. **"Create a Space"** — opens space creation flow, then returns to deploy after creation

The deploy modal (from IDE HeaderBar) already shows "My Profile" as a target. Ensure the full deploy page does too.

**Acceptance:**
- User with 0 spaces can still deploy (to profile)
- "Create a Space" CTA in deploy context with return-to-deploy after creation
- Profile deployment is never gated

---

### Fix 5: Dynamic campusId in IDE

**File:** `apps/web/src/app/lab/[toolId]/page.tsx:302`

**Change:** Replace `campusId: 'ub-buffalo'` with `campusId` from session/auth context. The session already contains `campusId` (set during JWT creation). Use `getCampusId` from middleware or `useSession` hook client-side.

**Acceptance:**
- campusId derived from session, never hardcoded
- Tools created on any campus work correctly

---

### Fix 6: Notification Bell in App Shell

**File:** `apps/web/src/components/layout/AppShell.tsx`

**Change:** Add a notification bell icon in the header area (desktop: top-right of sidebar or top bar; mobile: in the header). Initially can show unread count badge. Even if the notification system is basic, the bell gives users a signal that activity exists.

Start with space activity notifications: new members, new messages in spaces you lead, event RSVPs.

**Acceptance:**
- Bell icon visible on desktop and mobile
- Unread count badge shows when notifications exist
- Clicking opens a dropdown/panel with recent activity
- Graceful empty state: "No notifications yet"

---

### Fix 7: Mobile Nav Drawer Trigger

**File:** `apps/web/src/components/layout/AppShell.tsx` — mobile header

**Change:** Add a hamburger/menu icon to the mobile header (left of logo or as user avatar tap) that opens the existing `MobileNav` drawer component. The drawer already contains Settings and Sign Out.

**Acceptance:**
- Visible trigger in mobile header
- Opens existing MobileNav drawer
- Settings and Sign Out reachable on mobile

---

### Fix 8: Preview State Persistence

**Files:**
- `apps/web/src/app/lab/[toolId]/page.tsx` — Use mode initialization
- `apps/web/src/hooks/use-tool-runtime.ts` or equivalent

**Change:** When toggling to Use mode in the IDE, create a temporary "preview deployment" in memory (or localStorage) that the execute API can work with. This lets a user test a poll (vote on it, see counts change) before deploying.

**Alternative (simpler):** Use client-side state only for preview. The poll counter increments locally, no Firestore. Shows the user what it will feel like without server persistence. Mark clearly as "Preview — deploy to make it live."

**Acceptance:**
- User can vote on their own poll in preview and see the count change
- State resets on page refresh (acceptable for preview)
- Clear "Preview Mode" indicator

---

### Fix 9: Space → HiveLab Entry Point

**Files:**
- `apps/web/src/app/s/[handle]/components/space-settings.tsx` — Tools section
- `apps/web/src/app/s/[handle]/components/sidebar/tools-list.tsx`

**Change:** Add a "Build a Tool" button in two places:
1. **Space sidebar** (Tools section) — visible to leaders, opens `/lab?spaceId=${spaceId}` which pre-selects the deploy target
2. **Space settings** → Tools tab — "Build a new tool for this space" CTA alongside existing tool management

**Acceptance:**
- Leader in a space sees "Build a Tool" in sidebar tools section
- Clicking goes to HiveLab with space context preserved
- After building, deploy flow pre-selects the originating space

---

### Fix 10: Enable Core Social Features

**Files:**
- `apps/web/src/hooks/use-feature-flags.ts`
- Firestore `featureFlags` collection
- Notification, DM, and connection infrastructure

**Change:** Flip feature flags ON for the core set:
- `enable_dms` → ON (at minimum for space leaders)
- Notifications → wire the bell (Fix 6) to real events

Connections can stay OFF for now — they require more UI work.

**Phased approach:**
1. **Now:** Notifications bell + basic activity notifications (new members, RSVPs, messages)
2. **Soon:** DMs between space members
3. **Later:** Connections / social graph

**Acceptance:**
- Notification bell shows real activity
- Space leaders get notified when someone joins their space
- DMs available between members of the same space

---

## The Single-User Journey (After Fixes)

```
1. Land on hive → "Enter HIVE" → email verify → name → year/major → interests
2. Home: see recommended spaces, "Create a Space" prominent
3. Create space (no 7-day gate) → immediately in their space
4. Space: empty state guides them → "Send first message", "Create an event", "Build a tool"
5. Click "Build a tool" in space sidebar → /lab with space context
6. Type "poll for meeting time" → AI generates poll tool with elements
7. Preview: vote on their own poll, see it work
8. Deploy → space is pre-selected → one click → tool appears in space sidebar
9. Share invite link → first member joins → notification bell lights up
10. Member votes on poll → creator sees real-time results
```

Total time from signup to working tool in a space: **under 5 minutes.**

---

## Implementation Priority

| Order | Fix | Effort | Impact |
|-------|-----|--------|--------|
| 1 | Remove 7-day gate (Fix 1) | 15 min | Unblocks entire flow |
| 2 | Dashboard prompt → AI gen (Fix 2) | 2-4 hrs | Makes HiveLab magic moment work |
| 3 | Fix "Spaces" nav (Fix 3) | 1-2 hrs | Stops the confusion |
| 4 | Dynamic campusId (Fix 5) | 15 min | Removes hardcoded bug |
| 5 | Deploy profile fallback (Fix 4) | 1-2 hrs | Unblocks deployment |
| 6 | Space → Lab link (Fix 9) | 1 hr | Connects the two features |
| 7 | Mobile hamburger (Fix 7) | 30 min | Mobile usability |
| 8 | Notification bell (Fix 6) | 4-6 hrs | Social signal loop |
| 9 | Preview state (Fix 8) | 2-4 hrs | Testing before deploy |
| 10 | Enable DMs + notifications (Fix 10) | 4-8 hrs | Social features live |

**Total estimated effort: 2-3 days of focused work.**

---

## Out of Scope (Deferred)

- Design system redesign (separate track)
- Quorum mechanic changes (works correctly for user-created spaces)
- Cross-campus federation
- Tool marketplace
- Gamification / leaderboards
- Voice / audio rooms
- Alumni features
- `canChat` dead code cleanup (cosmetic, not user-facing)
- GatheringThreshold messaging fix for unclaimed spaces (edge case)
