# FRONTEND STATUS — Treat as 0%

**Updated:** 2026-02-14

The backend is done (224 routes, all systems wired). The frontend compiles. But compiling is not shipping. Most of the UI is AI-generated scaffolding — it works mechanically but lacks design intentionality, product polish, and the kind of craft that makes a UB freshman think "this is mine."

**Every page needs a design pass before launch. No exceptions.**

---

## Information Architecture (Agreed Feb 14, 2026)

**Platform:** Web-first

**Global Nav (4 tabs):**
| Tab | Name | Purpose | Status |
|-----|------|---------|--------|
| 1 | Home | Activity from your spaces, "what's happening now" | ❌ Needs new aggregated feed API + full page rebuild. LAST priority. |
| 2 | Spaces | Your joined spaces, browse/search | 🟡 SpacesHub exists (216 lines) but needs design pass |
| 3 | Create | Conversational tool creation, your creations, templates | 🟡 HiveLab exists but user-facing name is "Create", needs UX rethink |
| 4 | You | Profile as creation showcase, spaces, stats, settings | 🟡 Profile exists (319 lines) but is thin — needs to be a portfolio |

**Top Bar:** HIVE logo | (spacer) | Search (Cmd+K) | Notifications bell
**Notifications:** Bell icon → panel/sheet. Not a tab.
**Settings:** Inside You tab. Not top-level.

---

## Frontend Work Order

### Phase 1: Spaces (design + product pass)
The core experience. Where people spend time. Currently "Discord but for campus" — needs identity and soul.

**Design decisions needed:**
- [ ] Space identity system (accent color palette, avatar in header, 1-line description)
- [ ] Non-member view redesign (activity stats, member faces, social proof — not a blank wall)
- [ ] Context bar above chat (next event / pinned post / featured tool)
- [ ] Mobile layout (vertical stack vs sidebar sheet — test both)
- [ ] Space type differentiation (do Greek life and CS study groups feel different?)

**Wiring (blocked on design):**
- [ ] Sidebar tool clicks → navigate to tool or open inline
- [ ] Member promote/demote → uses existing PATCH member role API
- [ ] Remove dead `events-tab.tsx` (superseded by `space-events-tab.tsx`)

**Every component in `/s/[handle]/` needs a design review:**
- space-header.tsx (110 lines) — too thin, no personality
- space-sidebar.tsx — often empty, purpose unclear on mobile
- space-tabs.tsx — tabs need context (counts, previews)
- space-threshold.tsx (non-member gate) — no social proof
- chat-input.tsx — functional but generic
- message-feed.tsx — works but is it delightful?
- space-events-tab.tsx — just shipped, needs design eye
- space-posts-tab.tsx — just shipped, needs design eye
- event-detail-drawer.tsx — just shipped, needs design eye
- space-settings.tsx (1,978 lines!) — likely over-built, needs simplification
- member-management.tsx — promote/demote not wired
- moderation-panel.tsx — is this needed for V1?
- analytics-panel.tsx — is this needed for V1?
- leader-dashboard.tsx — is this needed for V1?

### Phase 2: Create (rename + UX rethink)
User-facing name is "Create", not "HiveLab". This is the differentiator — needs to feel exciting, not like an IDE.

**Design decisions needed:**
- [ ] What does the Create tab landing look like? (Prompt-first? Gallery? Recent creations?)
- [ ] How does the creation flow feel? (Conversational creator exists but is it delightful?)
- [ ] Tool editor — is the full IDE appropriate for students or is it overwhelming?
- [ ] How do deployed tools surface back in spaces? (The loop)

**Pages to review:**
- /lab/page.tsx (dashboard) — rename, redesign
- /lab/create/ and /lab/new/ — creation entry points, may need consolidation
- /lab/[toolId]/ (IDE) — 11K+ lines across sub-pages, likely needs simplification
- Conversational creator (1,184 lines) — the hero flow, needs to be great

### Phase 3: You / Profile
Profile as creation showcase. "What have you built?" is the status signal.

**Design decisions needed:**
- [ ] What's on the profile? (Creations, spaces, activity, bio?)
- [ ] How are creations displayed? (Cards? Gallery? Usage stats?)
- [ ] What does someone else's profile look like? (When you tap a name in chat)
- [ ] Settings — what's actually needed for V1?

**Pages to review:**
- /u/[handle]/ProfilePageContent.tsx (319 lines) — rebuild as showcase
- /me/ — redirect logic is fine, destination needs work

### Phase 4: Navigation + Global Chrome
Update the app shell to match the new IA.

- [ ] 4-tab nav (Home, Spaces, Create, You)
- [ ] Notification bell + panel in top bar
- [ ] Global search (Cmd+K overlay)
- [ ] Update navigation.ts, AppSidebar.tsx, AppShell.tsx

### Phase 5: Home / Feed (LAST)
Needs new backend work (aggregated feed API). Do this after everything else is polished.

- [ ] New `/api/feed` or `/api/home` endpoint — aggregates events/posts/activity across joined spaces
- [ ] Home page design — "what's happening now" dashboard, not a scrollable feed
- [ ] Campus context integration (dining, weather — compact, secondary)
- [ ] Recommendations for new users with few spaces

---

## Design Principles for the Rebuild

1. **Every screen earns its pixels.** If a component doesn't help the user do something or feel something, cut it.
2. **Mobile is the real product.** Desktop works but 90% of students are on phones. Design mobile-first, enhance for desktop.
3. **Identity over uniformity.** Spaces should feel owned, not generated. Accent colors, avatars, personality.
4. **Creation is the flex.** Building something should feel like posting a story — easy, visible, social.
5. **Less is more for V1.** Settings pages with 50 options? Cut to 5. Admin panels? Hide them. Analytics? Post-launch.
6. **No AI slop.** Every component should look like a human designer made a deliberate choice. If it looks generated, redo it.

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-14 | Frontend treated as 0% despite compiling | AI-generated scaffolding ≠ product. Every page needs design pass. |
| 2026-02-14 | 4-tab global nav: Home/Spaces/Create/You | Covers the four things students care about. |
| 2026-02-14 | "Create" not "HiveLab" user-facing | Nobody knows what HiveLab means on day one. |
| 2026-02-14 | No DMs for V1 | Communication happens in spaces. DMs add complexity without clear V1 value. |
| 2026-02-14 | Feed/Home tab is last priority | Needs new aggregated API. Other sections are higher ROI for launch. |
| 2026-02-14 | Web-first | Not a mobile app. Responsive web. |
