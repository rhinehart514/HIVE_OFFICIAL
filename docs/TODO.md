# HIVE Development TODO

**Last Updated:** January 17, 2026
**Platform Status:** Feature Complete — GTM Sprint Active

---

## Current Focus: GTM BY MONDAY

**Full Redesign & Rethink Sprint**

Every surface goes through the 4-phase framework:
1. **Interrogate** — Purpose, user intent, current reality
2. **Decide** — Keep / Kill / Redesign / Add
3. **Design** — Hierarchy, layout, components, states
4. **Build** — Implement with design system compliance

**See:** `docs/GTM_SURFACE_RETHINK_FRAMEWORK.md` for full methodology

---

## GTM Sprint Checklist

### Entry/Auth
- [ ] Onboarding flow feels premium
- [ ] Transitions between steps are buttery
- [ ] Success states create "wow" moments
- [ ] Error states are helpful

### Spaces
- [ ] Chat feels responsive and real-time
- [ ] Empty space states invite action
- [ ] Board navigation is intuitive
- [ ] Member list polish
- [ ] Loading states match design system

### Feed
- [ ] Post cards are visually consistent
- [ ] Comments thread cleanly
- [ ] Trending sidebar feels alive
- [ ] Empty feed invites first post

### HiveLab
- [ ] Builder experience is premium
- [ ] Template gallery is discoverable
- [ ] Tool deployment feedback is clear
- [ ] Analytics dashboard is polished

### Discovery (Browse)
- [ ] Space cards are consistent
- [ ] Category filtering is smooth
- [ ] Search feels responsive
- [ ] Territory navigation is clear

### Profiles
- [ ] Bento grid is consistent
- [ ] Connections display clearly
- [ ] Placed tools showcase well
- [ ] Edit flow is intuitive

### Calendar
- [ ] Event cards are polished
- [ ] RSVP feedback is immediate
- [ ] Empty states invite event creation

### Notifications
- [ ] Real-time feels instant
- [ ] Read/unread states are clear
- [ ] Notification types are distinguishable

---

## Completed Features (January 2026)

### Entry/Auth (100%)
- [x] Email-based OTP authentication
- [x] State machine entry flow (`/enter`)
- [x] Handle selection with validation
- [x] Session management with JWT

### Spaces (95%)
- [x] Space creation and management
- [x] Real-time chat with SSE
- [x] Board (channel) system
- [x] Member management and roles
- [x] Events integration
- [x] Tool deployment sidebar
- [x] Settings and visibility controls

### Feed (100%)
- [x] Post creation with composer modal
- [x] Comment system with threading
- [x] Like/unlike functionality
- [x] Trending sidebar (real data)
- [x] Post detail page (`/posts/[postId]`)

### Profiles (95%)
- [x] View profile (`/profile/[id]`)
- [x] Edit profile (`/profile/edit`)
- [x] Connections/followers
- [x] Placed tools display
- [x] Privacy settings

### HiveLab (95%)
- [x] Tool IDE with code editor
- [x] Template system
- [x] Tool deployment to spaces
- [x] Tool execution runtime
- [x] Analytics dashboard

### Discovery (95%)
- [x] Space browse with territories
- [x] Search functionality
- [x] Category filtering
- [x] Membership indicators

### Calendar (90%)
- [x] Personal calendar view
- [x] Space events integration
- [x] RSVP functionality
- [x] Event creation

### Notifications (90%)
- [x] Real-time notifications
- [x] Mark as read
- [x] Notification preferences

### Settings (95%)
- [x] Account settings
- [x] Privacy settings
- [x] Notification preferences
- [x] Connected accounts

---

## Post-GTM (After Monday)

### Next Sprint
- [ ] Thread notifications
- [ ] Read receipts
- [ ] Board reordering
- [ ] Space analytics (real data)
- [ ] Typing indicator optimization

### Future Features (Gated)
- [ ] Rituals (feature-flagged, leaders-only)
- [ ] Push notifications (infrastructure ready)
- [ ] Voice messages (not started)
- [ ] Marketplace (not started)

---

## Technical Debt (Post-GTM)

### After Launch
- [ ] Consolidate `users` and `profiles` collections
- [ ] Migrate legacy `reactions` field to `engagement`
- [ ] Add comprehensive test coverage
- [ ] Performance audit and optimization

### Documentation (Done)
- [x] Update CLAUDE.md with GTM sprint focus
- [x] Update TODO.md with sprint checklist
- [x] DATABASE_SCHEMA.md current
- [x] Archive old audit reports

---

## Quality Gates

Before any release:
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` passes
- [ ] Manual QA on core flows

---

## Notes

### GTM Sprint Rules
- **Redesign & Rethink** — everything is up for debate
- **Four phases per surface** — Interrogate → Decide → Design → Build
- **Kill what doesn't serve** — simpler is always better
- **Design system compliance** — use tokens, not hardcoded values
- **All states designed** — loading, empty, error, partial, full, success
- **Ship by Monday** — prioritize P0/P1 surfaces, defer P3

### Design System
- 93 primitives, 138 composed components
- Use `@hive/ui/design-system/primitives` for all UI
- Gold is earned (1% rule), white focus rings
- Rounded square avatars (never circles)
- See `docs/DESIGN_PRINCIPLES.md` for full spec

### Key Paths
- Entry: `/enter` + `components/entry/`
- Feed: `/feed` + `/posts/[postId]`
- Spaces: `/spaces/[spaceId]` + chat hooks
- Profile: `/profile/[id]` + `/profile/edit`
- Tools: `/tools/[toolId]` + HiveLab components
- Discovery: `/spaces/browse` + `browse/components/`

### Architecture Reference
- Top-level collections (not subcollections) for membership, posts
- SSE for real-time updates (not WebSockets)
- Campus isolation via `campusId` field on all documents
- JWT sessions with Firebase Auth backend
