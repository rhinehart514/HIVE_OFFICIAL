# HIVE Launch TODO

**Last Updated:** January 20, 2026
**Focus:** Core flows must work end-to-end. Polish comes after.

---

## Launch Flows

These are the paths users will take. Each must feel complete.

### 1. Entry Flow
**Path:** Landing → School → Email → Role → Code → Identity → Arrival → Spaces

| Step | Status | Notes |
|------|--------|-------|
| School selection | Ready | Single campus (UB) |
| Email validation | Ready | Domain check works |
| Role selection | Ready | Student/Faculty/Alumni |
| Code verification | Ready | Magic link flow |
| Identity (name, handle) | Ready | Handle checking works |
| Identity (major, year, residential) | **NEW** | Just shipped — verify in QA |
| Auto-join residential space | **NEW** | Just shipped — verify membership created |
| Arrival celebration | Ready | Redirects to /spaces |

**QA Checklist:**
- [ ] New user can complete full flow
- [ ] Major/year required, residential optional
- [ ] Residential auto-join creates membership
- [ ] Existing user bypasses identity step

---

### 2. Browse & Join Flow
**Path:** /spaces → Browse → Preview → Join → Space

| Step | Status | Notes |
|------|--------|-------|
| Space discovery grid | Ready | Categories, search |
| Space preview modal | Ready | Description, members |
| Join space | Ready | Membership created |
| Redirect to space | Ready | Goes to chat |

**QA Checklist:**
- [ ] Can browse without being member
- [ ] Join button works
- [ ] Redirects to space after join
- [ ] "Your Spaces" shows joined space

---

### 3. Space & Chat Flow
**Path:** Space → Chat → Send Message → See Message

| Step | Status | Blockers |
|------|--------|----------|
| Space landing (hub) | Ready | — |
| Chat board | Ready | — |
| Send message | Ready | — |
| See own message | Ready | — |
| See others' messages | Ready | Real-time works |
| Loading state | **BLOCKED** | No skeleton, feels broken |
| Empty state | **BLOCKED** | No "first message" prompt |

**QA Checklist:**
- [ ] Chat loads with skeleton (not blank)
- [ ] Empty chat shows prompt
- [ ] Can send and see message
- [ ] Real-time updates work

---

### 4. HiveLab Flow
**Path:** /hivelab → Create Tool → Build → Deploy → Use

| Step | Status | Blockers |
|------|--------|----------|
| Tool creation | Ready | — |
| Canvas editing | Ready | — |
| Deploy to space | Ready | — |
| Deploy error handling | **BLOCKED** | Error not shown to user |
| Tool execution | Ready | — |

**QA Checklist:**
- [ ] Can create new tool
- [ ] Can add elements
- [ ] Deploy shows error if fails
- [ ] Deployed tool appears in space

---

### 5. Feed Flow
**Path:** /feed → See Activity → Navigate to Space/Post

| Step | Status | Blockers |
|------|--------|----------|
| Today section | Ready | — |
| Your spaces section | Ready | — |
| Activity cards | Ready | — |
| Unread indicators | **BLOCKED** | Not implemented |
| Navigation to content | Ready | — |

**QA Checklist:**
- [ ] Feed loads with content
- [ ] Can navigate to space from card
- [ ] Activity reflects recent actions

---

### 6. Profile Flow
**Path:** /profile → View → (Edit)

| Step | Status | Notes |
|------|--------|-------|
| Profile view | Ready | Shows user data |
| Stats display | Ready | Connections, spaces |
| Edit profile | Post-launch | Not critical for GTM |

**QA Checklist:**
- [ ] Profile shows name, handle, avatar
- [ ] Shows joined spaces
- [ ] Shows connections count

---

## Blockers Summary

| Blocker | Flow | Fix |
|---------|------|-----|
| Chat loading skeleton | Space & Chat | Add 3-5 message skeletons |
| Chat empty state | Space & Chat | Add "Send the first message" |
| Deploy error display | HiveLab | Show error in modal |
| Unread indicators | Feed | Implement or defer |

**Minimum viable:** Fix chat states. Deploy error and unread can ship as-is with degraded experience.

---

## Quality Gates

Before launch:
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds
- [ ] Manual QA on all 6 flows above

---

## What We're NOT Fixing for Launch

- Design token inconsistencies (cosmetic)
- Focus ring variations (minor a11y)
- Profile heatmap/activity (unused)
- Loading state inconsistencies (functional)
- Mobile responsiveness gaps (desktop-first launch)

These become Sprint 2 priorities.

---

## Flow Priority Order

1. **Entry** — Gate to everything
2. **Browse & Join** — Discovery
3. **Space & Chat** — Core value
4. **HiveLab** — Builder experience
5. **Feed** — Engagement loop
6. **Profile** — Identity

Ship in this order. If time runs out, Entry through Chat must work.
