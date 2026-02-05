# Sprints
**Last Updated:** 2026-02-01

Detailed sprint tracking. TODO.md has current status only.

---

## Complete

### Sprint 0.4: Structural Cleanup ✅

| Task | Status |
|------|--------|
| Remove .env.production.local from git | ✅ |
| Delete packages/analytics/ | ✅ |
| Delete packages/api-client/ | ✅ |
| Delete packages/i18n/ | ✅ |
| Delete packages/utilities/ | ✅ |
| Fix admin tsconfig.json aliases | ✅ |
| Delete debug artifacts | ✅ |

### Sprint 0.5: Security ✅

| Task | Status |
|------|--------|
| Fix admin grant privilege escalation | ✅ |
| Fix profile connections privacy bypass | ✅ |
| Fix cross-campus suspend | ✅ |
| Wrap unprotected admin routes | ✅ |
| Add hasPermission() enforcement | ✅ |
| Fix rate limiting on code sending | ✅ |
| Add campusId validation to profile | ✅ |

### Sprint 0.6: Stability ✅

| Task | Status |
|------|--------|
| Add root error.tsx | ✅ |
| Add error.tsx to 5 main routes | ✅ |
| Add max limit to admin users | ✅ |
| Add max limit to chat messages | ✅ |
| Handle Firestore 500 doc limit | ✅ |
| Replace browser confirm() dialogs | ✅ |
| Fix silent catch patterns | ✅ |
| Add timeout to feed ranking | ✅ |

### Sprint 0.7: Features ✅

| Task | Status |
|------|--------|
| Email delivery | ✅ |
| Search API v2 | ✅ |
| Space deletion | ✅ |
| Admin tool approval | ✅ |
| Admin user search | ✅ |
| Calendar OAuth sync | ✅ |
| Event editing | ✅ |
| Account deletion | ✅ |
| Feed aggregation | Deferred |

### Sprint 1: Entry Flow ✅

| Task | Status |
|------|--------|
| Simplify identity fields | ✅ |
| Delete deprecated /welcome | ✅ |
| Implement avatar picker | ✅ |
| Add network error recovery | ✅ |
| Add button disabled states | ✅ |
| Activity pulse on Gate | Skipped |
| Auto-detect school from email | Skipped |

---

## In Progress

### Sprint 2: Feed & Core Loop

| Task | Status |
|------|--------|
| Fix isLive flag | ✅ |
| Add spaceHandle to events | ✅ |
| Add onlineCount to spaces | ✅ |
| Add unreadCount to spaces | ✅ |
| Empty state handling | |
| "Since you left" logic | |
| Partial loading | |
| Skeleton loading | |
| Fix N+1 members query | ✅ |

### Sprint 3: Spaces Polish

| Task | Status |
|------|--------|
| "Who you know" display | ✅ |
| Ghost space waitlist CTA | ✅ |
| People connection badge | ✅ |
| Space health indicators | |
| Fix role management | |
| Loading skeleton | |
| Add space join error message | |

---

## Planned

### Sprint 4: Supporting Surfaces
- Profile audit
- Notification sending
- Tab switching loading
- Persist search state

### Sprint 5: HiveLab
- Tool sandbox domain restrictions
- Secure tool storage
- Tool creation flow
- Wire Tool AI generation
- Implement tool sharing/export

### Sprint 6: Polish & Hardening
- Fix 40+ admin color violations
- Fix 30+ design system violations
- Add accessibility attributes
- Extract console.log to logger
- Remove deprecated code
- Implement explore/discovery
- Implement alumni onboarding

---

## Design Sprints

### D0: Foundation ✅
- Layout system docs
- Interaction states docs
- Motion docs
- Page templates

### D1: Entry + Feed ✅
- Entry premium transitions
- Feed tokens and hierarchy
- FeedEmptyState component
- DensityToggle component

### D-P: Profile ✅
- 3-zone layout (Identity, Activity, Presence)
- ProfileIdentityHero
- ProfileActivityCard
- ProfileLeadershipCard
- ProfileEventCard
- ProfileSpacePill
- ProfileConnectionFooter
- ProfileOverflowChip

### D2: Spaces + Browse
- [ ] Clarify hub vs browse
- [ ] Space personality
- [ ] Browse emotional design
- [ ] Explore power-user design
